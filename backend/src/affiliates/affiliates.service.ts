import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Affiliate } from '../entities/affiliate.entity';
import { AffiliatePayout } from '../entities/affiliate-payout.entity';
import { Order, PaymentStatus } from '../entities/order.entity';
import {
  CreateAffiliateDto,
  UpdateAffiliateDto,
  CreatePayoutDto,
} from './dto/affiliate.dto';

export const round2 = (n: number) => Math.round(n * 100) / 100;

// SQLite aggregates come back as numbers, but other drivers return decimal
// sums as strings, so every value is passed through Number() regardless.
interface OrderStatsRow {
  affiliateId: string;
  paymentStatus: PaymentStatus;
  count: number | string;
  sales: number | string | null;
  commission: number | string | null;
}

interface PayoutStatsRow {
  affiliateId: string;
  total: number | string | null;
}

export interface AffiliateStats {
  paidOrders: number;
  pendingOrders: number;
  // Product total of paid orders after discount, excluding shipping — the
  // base commission is calculated on.
  sales: number;
  commissionEarned: number;
  paidOut: number;
  owed: number;
}

@Injectable()
export class AffiliatesService {
  constructor(
    @InjectRepository(Affiliate)
    private affiliatesRepository: Repository<Affiliate>,
    @InjectRepository(AffiliatePayout)
    private payoutsRepository: Repository<AffiliatePayout>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private configService: ConfigService,
  ) {}

  normalizeCode(code: string): string {
    return code.trim().toUpperCase();
  }

  // Looks up an active affiliate for checkout/tracking. Returns null for
  // unknown or deactivated codes rather than throwing, so a stale code
  // remembered from an old link never blocks a purchase.
  async findActiveByCode(
    code: string | undefined | null,
  ): Promise<Affiliate | null> {
    if (!code || !code.trim()) {
      return null;
    }
    return this.affiliatesRepository.findOne({
      where: { code: this.normalizeCode(code), isActive: true },
    });
  }

  async recordClick(code: string): Promise<Affiliate | null> {
    const affiliate = await this.findActiveByCode(code);
    if (affiliate) {
      await this.affiliatesRepository.increment(
        { id: affiliate.id },
        'clicks',
        1,
      );
    }
    return affiliate;
  }

  async findOne(id: string): Promise<Affiliate> {
    const affiliate = await this.affiliatesRepository.findOne({
      where: { id },
    });
    if (!affiliate) {
      throw new NotFoundException('Affiliate not found');
    }
    return affiliate;
  }

  async findAllWithStats() {
    const affiliates = await this.affiliatesRepository.find({
      order: { createdAt: 'DESC' },
    });
    const stats = await this.computeStats();
    return affiliates.map((affiliate) =>
      this.format(affiliate, stats.get(affiliate.id)),
    );
  }

  async findOneWithDetails(id: string) {
    const affiliate = await this.findOne(id);
    const stats = await this.computeStats(id);
    const orders = await this.ordersRepository.find({
      where: { affiliateId: id },
      order: { createdAt: 'DESC' },
    });
    const payouts = await this.payoutsRepository.find({
      where: { affiliateId: id },
      order: { createdAt: 'DESC' },
    });
    return {
      ...this.format(affiliate, stats.get(id)),
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        status: order.status,
        paymentStatus: order.paymentStatus,
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        total: Number(order.total),
        commission: Number(order.commission),
      })),
      payouts: payouts.map((payout) => ({
        ...payout,
        amount: Number(payout.amount),
      })),
    };
  }

  async create(dto: CreateAffiliateDto) {
    const code = this.normalizeCode(dto.code);
    await this.assertCodeAvailable(code);
    const affiliate = this.affiliatesRepository.create({
      name: dto.name,
      code,
      email: dto.email,
      commissionPercent: dto.commissionPercent ?? 10,
      discountPercent: dto.discountPercent ?? 0,
      isActive: dto.isActive ?? true,
      notes: dto.notes,
    });
    const saved = await this.affiliatesRepository.save(affiliate);
    return this.format(saved);
  }

  async update(id: string, dto: UpdateAffiliateDto) {
    const affiliate = await this.findOne(id);
    if (dto.code !== undefined) {
      const code = this.normalizeCode(dto.code);
      if (code !== affiliate.code) {
        await this.assertCodeAvailable(code);
      }
      dto.code = code;
    }
    // Only apply fields actually present in the request — a blind
    // Object.assign would overwrite untouched fields with `undefined`.
    for (const [key, value] of Object.entries(dto) as [
      keyof UpdateAffiliateDto,
      unknown,
    ][]) {
      if (value !== undefined) {
        Object.assign(affiliate, { [key]: value });
      }
    }
    await this.affiliatesRepository.save(affiliate);
    const stats = await this.computeStats(id);
    return this.format(affiliate, stats.get(id));
  }

  // Affiliates with attributed orders can't be deleted — that would erase
  // the record of what they earned. Deactivate them instead.
  async remove(id: string): Promise<void> {
    const affiliate = await this.findOne(id);
    const orderCount = await this.ordersRepository.count({
      where: { affiliateId: id },
    });
    if (orderCount > 0) {
      throw new BadRequestException(
        'This affiliate has orders attributed to them. Deactivate them instead of deleting.',
      );
    }
    await this.affiliatesRepository.remove(affiliate);
  }

  async createPayout(affiliateId: string, dto: CreatePayoutDto) {
    await this.findOne(affiliateId);
    const payout = this.payoutsRepository.create({
      affiliateId,
      amount: round2(dto.amount),
      note: dto.note,
    });
    const saved = await this.payoutsRepository.save(payout);
    return { ...saved, amount: Number(saved.amount) };
  }

  async removePayout(affiliateId: string, payoutId: string): Promise<void> {
    const payout = await this.payoutsRepository.findOne({
      where: { id: payoutId, affiliateId },
    });
    if (!payout) {
      throw new NotFoundException('Payout not found');
    }
    await this.payoutsRepository.remove(payout);
  }

  // Aggregated from the orders and payouts themselves rather than kept as
  // running counters, so a repeated payment webhook or a manual payment
  // status change can never double-count.
  private async computeStats(
    affiliateId?: string,
  ): Promise<Map<string, AffiliateStats>> {
    const orderQuery = this.ordersRepository
      .createQueryBuilder('o')
      .select('o.affiliateId', 'affiliateId')
      .addSelect('o.paymentStatus', 'paymentStatus')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(o.subtotal - o.discount)', 'sales')
      .addSelect('SUM(o.commission)', 'commission')
      .where('o.affiliateId IS NOT NULL')
      .groupBy('o.affiliateId')
      .addGroupBy('o.paymentStatus');
    const payoutQuery = this.payoutsRepository
      .createQueryBuilder('p')
      .select('p.affiliateId', 'affiliateId')
      .addSelect('SUM(p.amount)', 'total')
      .groupBy('p.affiliateId');
    if (affiliateId) {
      orderQuery.andWhere('o.affiliateId = :affiliateId', { affiliateId });
      payoutQuery.where('p.affiliateId = :affiliateId', { affiliateId });
    }

    const stats = new Map<string, AffiliateStats>();
    const get = (id: string) => {
      if (!stats.has(id)) {
        stats.set(id, {
          paidOrders: 0,
          pendingOrders: 0,
          sales: 0,
          commissionEarned: 0,
          paidOut: 0,
          owed: 0,
        });
      }
      return stats.get(id)!;
    };

    for (const row of await orderQuery.getRawMany<OrderStatsRow>()) {
      const s = get(row.affiliateId);
      if (row.paymentStatus === PaymentStatus.PAID) {
        s.paidOrders += Number(row.count);
        s.sales += Number(row.sales) || 0;
        s.commissionEarned += Number(row.commission) || 0;
      } else if (row.paymentStatus === PaymentStatus.PENDING) {
        s.pendingOrders += Number(row.count);
      }
    }
    for (const row of await payoutQuery.getRawMany<PayoutStatsRow>()) {
      get(row.affiliateId).paidOut += Number(row.total) || 0;
    }
    for (const s of stats.values()) {
      s.sales = round2(s.sales);
      s.commissionEarned = round2(s.commissionEarned);
      s.paidOut = round2(s.paidOut);
      s.owed = round2(s.commissionEarned - s.paidOut);
    }
    return stats;
  }

  private format(affiliate: Affiliate, stats?: AffiliateStats) {
    const storefrontUrl = (
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001'
    ).replace(/\/+$/, '');
    return {
      ...affiliate,
      commissionPercent: Number(affiliate.commissionPercent),
      discountPercent: Number(affiliate.discountPercent),
      link: `${storefrontUrl}/?ref=${encodeURIComponent(affiliate.code)}`,
      stats: stats ?? {
        paidOrders: 0,
        pendingOrders: 0,
        sales: 0,
        commissionEarned: 0,
        paidOut: 0,
        owed: 0,
      },
    };
  }

  private async assertCodeAvailable(code: string): Promise<void> {
    const existing = await this.affiliatesRepository.findOne({
      where: { code },
    });
    if (existing) {
      throw new ConflictException(`The code ${code} is already in use`);
    }
  }
}
