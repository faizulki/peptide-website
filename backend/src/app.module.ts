import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AdminModule } from './admin/admin.module';
import { PaymentModule } from './payment/payment.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { CurrencyModule } from './currency/currency.module';
import { UploadsModule } from './uploads/uploads.module';
import { FaqModule } from './faq/faq.module';
import { AffiliatesModule } from './affiliates/affiliates.module';
import { LabReportsModule } from './lab-reports/lab-reports.module';
import { ArticlesModule } from './articles/articles.module';
import * as entities from './entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite',
        database: configService.get<string>('DATABASE_PATH') || 'database.sqlite',
        entities: Object.values(entities).filter(
          (e): e is new (...args: any[]) => any => typeof e === 'function',
        ),
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    AuthModule,
    UsersModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    ReviewsModule,
    AdminModule,
    PaymentModule,
    WebhooksModule,
    CurrencyModule,
    UploadsModule,
    FaqModule,
    AffiliatesModule,
    LabReportsModule,
    ArticlesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
