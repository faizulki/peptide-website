import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(@Query('includeInactive') includeInactive?: string) {
    const products = await this.productsService.findAll(includeInactive === 'true');
    return products.map((p) => this.formatProduct(p));
  }

  @Get('visible')
  async findVisible() {
    const products = await this.productsService.findVisible();
    return products.map((p) => this.formatProduct(p));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const product = await this.productsService.findOne(id);
    return this.formatProduct(product);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async create(@Body() createProductDto: CreateProductDto) {
    const product = await this.productsService.create(createProductDto);
    return this.formatProduct(product);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    const product = await this.productsService.update(id, updateProductDto);
    return this.formatProduct(product);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async remove(@Param('id') id: string) {
    await this.productsService.remove(id);
    return { message: 'Product deleted successfully' };
  }

  private formatProduct(product: any) {
    return {
      ...product,
      extendedInfo: {
        specifications: product.specifications ? JSON.parse(product.specifications) : [],
        usage: product.usage || '',
        storage: product.storage || '',
        warnings: product.warnings ? JSON.parse(product.warnings) : [],
      },
      extendedInfoSv: {
        specifications: product.specificationsSv ? JSON.parse(product.specificationsSv) : [],
        usage: product.usageSv || '',
        storage: product.storageSv || '',
        warnings: product.warningsSv ? JSON.parse(product.warningsSv) : [],
      },
    };
  }
}

