import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AffiliatesService } from './affiliates.service';
import { AffiliatesController } from './affiliates.controller';
import { Affiliate } from '../entities/affiliate.entity';
import { AffiliatePayout } from '../entities/affiliate-payout.entity';
import { Order } from '../entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Affiliate, AffiliatePayout, Order])],
  controllers: [AffiliatesController],
  providers: [AffiliatesService],
  exports: [AffiliatesService],
})
export class AffiliatesModule {}
