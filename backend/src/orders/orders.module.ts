import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Cart } from '../entities/cart.entity';
import { Product } from '../entities/product.entity';
import { PaymentModule } from '../payment/payment.module';
import { ProductsModule } from '../products/products.module';
import { CurrencyModule } from '../currency/currency.module';
import { AffiliatesModule } from '../affiliates/affiliates.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Cart, Product]),
    PaymentModule,
    ProductsModule,
    CurrencyModule,
    AffiliatesModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}

