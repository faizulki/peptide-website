import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LabReportsService } from './lab-reports.service';
import { LabReportsController } from './lab-reports.controller';
import { LabReport } from '../entities/lab-report.entity';
import { Product } from '../entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LabReport, Product])],
  controllers: [LabReportsController],
  providers: [LabReportsService],
})
export class LabReportsModule {}
