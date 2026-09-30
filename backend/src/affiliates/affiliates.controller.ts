import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AffiliatesService } from './affiliates.service';
import {
  CreateAffiliateDto,
  UpdateAffiliateDto,
  CreatePayoutDto,
} from './dto/affiliate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('affiliates')
export class AffiliatesController {
  constructor(private readonly affiliatesService: AffiliatesService) {}

  // Public: lets checkout confirm a typed code and show its discount.
  // Exposes only the code and discount — never commission or stats.
  @Get('lookup/:code')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async lookup(@Param('code') code: string) {
    const affiliate = await this.affiliatesService.findActiveByCode(code);
    if (!affiliate) {
      throw new NotFoundException('Code not found');
    }
    return {
      code: affiliate.code,
      discountPercent: Number(affiliate.discountPercent),
    };
  }

  // Public: called by the storefront when a visitor lands via a ?ref= link.
  @Post('lookup/:code/click')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async click(@Param('code') code: string) {
    const affiliate = await this.affiliatesService.recordClick(code);
    if (!affiliate) {
      throw new NotFoundException('Code not found');
    }
    return {
      code: affiliate.code,
      discountPercent: Number(affiliate.discountPercent),
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async findAll() {
    return this.affiliatesService.findAllWithStats();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async findOne(@Param('id') id: string) {
    return this.affiliatesService.findOneWithDetails(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async create(@Body() dto: CreateAffiliateDto) {
    return this.affiliatesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateAffiliateDto) {
    return this.affiliatesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async remove(@Param('id') id: string) {
    await this.affiliatesService.remove(id);
    return { message: 'Affiliate deleted successfully' };
  }

  @Post(':id/payouts')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async createPayout(@Param('id') id: string, @Body() dto: CreatePayoutDto) {
    return this.affiliatesService.createPayout(id, dto);
  }

  @Delete(':id/payouts/:payoutId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async removePayout(
    @Param('id') id: string,
    @Param('payoutId') payoutId: string,
  ) {
    await this.affiliatesService.removePayout(id, payoutId);
    return { message: 'Payout deleted successfully' };
  }
}
