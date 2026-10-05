import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LabReport } from '../entities/lab-report.entity';
import { Product } from '../entities/product.entity';
import { CreateLabReportDto, UpdateLabReportDto } from './dto/lab-report.dto';

@Injectable()
export class LabReportsService {
  constructor(
    @InjectRepository(LabReport)
    private labReportsRepository: Repository<LabReport>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  // Storefront listing: only reports for products customers can see, with
  // just enough product info to label and link them. Newest test first
  // (reports without a test date fall back to upload order).
  async findPublic(productId?: string) {
    const query = this.labReportsRepository
      .createQueryBuilder('report')
      .innerJoin('report.product', 'product')
      .addSelect([
        'product.id',
        'product.name',
        'product.nameSv',
        'product.image',
      ])
      .where('product.isActive = :active AND product.isVisible = :visible', {
        active: true,
        visible: true,
      })
      .orderBy('product.name', 'ASC')
      .addOrderBy('report.testDate', 'DESC', 'NULLS LAST')
      .addOrderBy('report.createdAt', 'DESC');
    if (productId) {
      query.andWhere('report.productId = :productId', { productId });
    }
    return query.getMany();
  }

  // Admin listing for one product, regardless of the product's visibility.
  async findForProduct(productId: string): Promise<LabReport[]> {
    return this.labReportsRepository
      .createQueryBuilder('report')
      .where('report.productId = :productId', { productId })
      .orderBy('report.testDate', 'DESC', 'NULLS LAST')
      .addOrderBy('report.createdAt', 'DESC')
      .getMany();
  }

  async create(dto: CreateLabReportDto): Promise<LabReport> {
    const product = await this.productsRepository.findOne({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    const report = this.labReportsRepository.create({
      productId: dto.productId,
      image: dto.image,
      batchNumber: dto.batchNumber ?? null,
      testDate: dto.testDate ?? null,
    });
    return this.labReportsRepository.save(report);
  }

  async update(id: string, dto: UpdateLabReportDto): Promise<LabReport> {
    const report = await this.findOne(id);
    // Only apply fields present in the request; null is a deliberate clear.
    for (const [key, value] of Object.entries(dto) as [
      keyof UpdateLabReportDto,
      unknown,
    ][]) {
      if (value !== undefined) {
        Object.assign(report, { [key]: value });
      }
    }
    return this.labReportsRepository.save(report);
  }

  async remove(id: string): Promise<void> {
    const report = await this.findOne(id);
    await this.labReportsRepository.remove(report);
  }

  private async findOne(id: string): Promise<LabReport> {
    const report = await this.labReportsRepository.findOne({ where: { id } });
    if (!report) {
      throw new NotFoundException('Lab report not found');
    }
    return report;
  }
}
