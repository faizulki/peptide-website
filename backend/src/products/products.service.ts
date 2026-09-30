import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async findAll(includeInactive = false): Promise<Product[]> {
    const query = this.productsRepository.createQueryBuilder('product');
    if (!includeInactive) {
      query.where('product.isActive = :isActive', { isActive: true });
    }
    return query.getMany();
  }

  async findVisible(): Promise<Product[]> {
    return this.productsRepository.find({
      where: { isVisible: true, isActive: true },
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productsRepository.create({
      ...createProductDto,
      specifications: createProductDto.specifications
        ? JSON.stringify(createProductDto.specifications)
        : null,
      warnings: createProductDto.warnings ? JSON.stringify(createProductDto.warnings) : null,
      specificationsSv: createProductDto.specificationsSv
        ? JSON.stringify(createProductDto.specificationsSv)
        : null,
      warningsSv: createProductDto.warningsSv
        ? JSON.stringify(createProductDto.warningsSv)
        : null,
    });
    return this.productsRepository.save(product);
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    const updateData: any = { ...updateProductDto };

    if (updateProductDto.specifications) {
      updateData.specifications = JSON.stringify(updateProductDto.specifications);
    }
    if (updateProductDto.warnings) {
      updateData.warnings = JSON.stringify(updateProductDto.warnings);
    }
    if (updateProductDto.specificationsSv) {
      updateData.specificationsSv = JSON.stringify(updateProductDto.specificationsSv);
    }
    if (updateProductDto.warningsSv) {
      updateData.warningsSv = JSON.stringify(updateProductDto.warningsSv);
    }

    // updateProductDto's untouched optional fields are still own properties
    // set to undefined (TS class fields), so a blind Object.assign would
    // overwrite product.name/price/etc. with undefined even when the
    // request omitted them.
    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        (product as any)[key] = value;
      }
    }
    return this.productsRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productsRepository.remove(product);
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    const product = await this.findOne(id);
    product.stockLevel = Math.max(0, product.stockLevel - quantity);
    product.inStock = product.stockLevel > 0;
    return this.productsRepository.save(product);
  }
}

