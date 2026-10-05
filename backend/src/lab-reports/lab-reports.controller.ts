import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { LabReportsService } from './lab-reports.service';
import { CreateLabReportDto, UpdateLabReportDto } from './dto/lab-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('lab-reports')
export class LabReportsController {
  constructor(private readonly labReportsService: LabReportsService) {}

  // Public: the Lab Reports page (all products) and a product page (?productId=).
  @Get()
  async findPublic(
    @Query('productId', new ParseUUIDPipe({ optional: true }))
    productId?: string,
  ) {
    return this.labReportsService.findPublic(productId);
  }

  @Get('admin/product/:productId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async findForProduct(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.labReportsService.findForProduct(productId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async create(@Body() dto: CreateLabReportDto) {
    return this.labReportsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLabReportDto,
  ) {
    return this.labReportsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.labReportsService.remove(id);
    return { message: 'Lab report deleted successfully' };
  }
}
