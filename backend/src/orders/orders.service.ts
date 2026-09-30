import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Cart } from '../entities/cart.entity';
import { Product } from '../entities/product.entity';
import { CheckoutDto, UpdateOrderStatusDto, UpdatePaymentStatusDto } from './dto/order.dto';
import { PAYMENT_GATEWAY } from '../payment/payment-gateway.interface';
import type {
  PaymentGateway,
  PaymentProviderOption,
  CryptoCoinOption,
} from '../payment/payment-gateway.interface';
import { ProductsService } from '../products/products.service';
import { PayGateService } from '../payment/paygate.service';
import { CurrencyService } from '../currency/currency.service';
import { AffiliatesService, round2 } from '../affiliates/affiliates.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @Inject(PAYMENT_GATEWAY)
    private paymentGateway: PaymentGateway,
    private productsService: ProductsService,
    private currencyService: CurrencyService,
    private affiliatesService: AffiliatesService,
  ) {}

  async createOrder(
    checkoutDto: CheckoutDto,
    userId?: string,
  ): Promise<{
    order: Order;
    paymentUrl?: string;
    providers?: PaymentProviderOption[];
    cryptoCoins?: CryptoCoinOption[];
  }> {
    const cart = await this.cartRepository.findOne({
      where: userId ? { userId } : { guestId: checkoutDto.guestId },
      relations: ['items', 'items.product'],
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Validate product availability and calculate totals
    let subtotal = 0;
    let allFreeShipping = true;
    const orderItems: OrderItem[] = [];

    for (const cartItem of cart.items) {
      const product = await this.productRepository.findOne({
        where: { id: cartItem.productId },
      });

      if (!product || !product.isActive || !product.inStock) {
        throw new BadRequestException(`Product ${product?.name || cartItem.productId} is not available`);
      }

      if (product.stockLevel < cartItem.quantity) {
        throw new BadRequestException(`Insufficient stock for ${product.name}`);
      }

      if (!product.freeShipping) {
        allFreeShipping = false;
      }

      const itemPrice = product.price;
      const itemSubtotal = itemPrice * cartItem.quantity;
      subtotal += itemSubtotal;

      const orderItem = this.orderItemsRepository.create({
        productId: product.id,
        productName: product.name,
        quantity: cartItem.quantity,
        price: itemPrice,
        subtotal: itemSubtotal,
      });
      orderItems.push(orderItem);
    }

    // Affiliate attribution: the discount comes off the product subtotal, and
    // commission is earned on what the customer pays for products (after
    // the discount, excluding shipping).
    const affiliate = await this.affiliatesService.findActiveByCode(checkoutDto.affiliateCode);
    const discount = affiliate
      ? round2((subtotal * Number(affiliate.discountPercent)) / 100)
      : 0;
    const commission = affiliate
      ? round2(((subtotal - discount) * Number(affiliate.commissionPercent)) / 100)
      : 0;

    // Flat €10 shipping, waived only when every item in the cart is flagged free-shipping.
    const shipping = allFreeShipping ? 0 : 10;
    const total = round2(subtotal - discount + shipping);

    // Generate order number
    const orderNumber = `ORD-${Date.now().toString().padStart(10, '0')}`;

    // Create order
    const order = this.ordersRepository.create({
      orderNumber,
      userId,
      guestId: checkoutDto.guestId,
      customerName: `${checkoutDto.firstName} ${checkoutDto.lastName}`,
      customerEmail: checkoutDto.email,
      customerPhone: checkoutDto.phone,
      shippingAddress: JSON.stringify(checkoutDto.shippingAddress),
      items: orderItems,
      subtotal,
      shipping,
      discount,
      total,
      affiliateId: affiliate?.id,
      affiliateCode: affiliate?.code,
      commission,
      status: OrderStatus.CREATED,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: 'PAYGATE',
    });

    const savedOrder = await this.ordersRepository.save(order);

    // Deliberately not clearing the cart anywhere in this method — the
    // customer hasn't paid yet at this point. Clearing it here meant an
    // abandoned or failed payment left them with an empty cart and no way
    // to retry. It's cleared instead once handlePaymentWebhook confirms the
    // payment actually succeeded.

    // 'crypto': hand back the coin picker built from our own UI instead of
    // creating a payment request now — which specific coin (and therefore
    // which wallet.php call) isn't known until the customer picks one via
    // selectCryptoCoin(), below.
    if (checkoutDto.paymentType === 'crypto' && this.paymentGateway instanceof PayGateService) {
      const cryptoCoins = await this.paymentGateway.getCryptoCoinOptions();
      return { order: savedOrder, cryptoCoins };
    }

    // All amounts above are computed and stored in EUR, our base currency —
    // set directly by the admin, never derived from a live rate, so it
    // can't drift. Only the payment-gateway-facing amount is converted, so
    // the customer pays (and PayGate's provider list is chosen) in their
    // selected currency without touching stored order totals.
    const currency = checkoutDto.currency || 'EUR';
    const gatewayAmount = await this.currencyService.convertFromEur(total, currency);

    const { paymentUrl, requestId, providers } = await this.paymentGateway.createPaymentRequest(
      savedOrder.id,
      gatewayAmount,
      currency,
      checkoutDto.email,
    );

    savedOrder.paymentRequestId = requestId;
    await this.ordersRepository.save(savedOrder);

    return { order: savedOrder, paymentUrl, providers };
  }

  // Called once the customer picks a specific coin on our direct-crypto UI
  // (deferred from createOrder — see the note there for why).
  async selectCryptoCoin(
    orderId: string,
    coinPath: string,
  ): Promise<{ address: string; amountCoin: string; coinPath: string }> {
    if (!(this.paymentGateway instanceof PayGateService)) {
      throw new BadRequestException('Direct crypto payment is not available');
    }

    const order = await this.findOne(orderId);
    // order.total is stored in EUR, our base currency.
    const { address, amountCoin, ipnToken } = await this.paymentGateway.createCryptoAddressForCoin(
      order.id,
      coinPath,
      Number(order.total),
    );

    order.paymentRequestId = ipnToken;
    await this.ordersRepository.save(order);

    return { address, amountCoin, coinPath };
  }

  async findAll(userId?: string): Promise<Order[]> {
    if (userId) {
      return this.ordersRepository.find({
        where: { userId },
        relations: ['items'],
        order: { createdAt: 'DESC' },
      });
    }
    return this.ordersRepository.find({
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId?: string): Promise<Order> {
    const where: any = { id };
    if (userId) {
      where.userId = userId;
    }

    const order = await this.ordersRepository.findOne({
      where,
      relations: ['items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.findOne(id);
    order.status = updateOrderStatusDto.status as OrderStatus;
    
    if (order.status === OrderStatus.SHIPPED) {
      order.shippedAt = new Date();
    }
    if (order.status === OrderStatus.DELIVERED) {
      order.deliveredAt = new Date();
    }

    return this.ordersRepository.save(order);
  }

  async updatePaymentStatus(id: string, updatePaymentStatusDto: UpdatePaymentStatusDto): Promise<Order> {
    const order = await this.findOne(id);
    order.paymentStatus = updatePaymentStatusDto.paymentStatus as PaymentStatus;

    if (order.paymentStatus === PaymentStatus.PAID) {
      // Update stock levels
      for (const item of order.items) {
        await this.productsService.updateStock(item.productId, item.quantity);
      }
      await this.clearCustomerCart(order);
    }

    return this.ordersRepository.save(order);
  }

  async handlePaymentWebhook(orderId: string, transactionId: string, status: string): Promise<Order> {
    const order = await this.findOne(orderId);

    if (status === 'paid' || status === 'completed') {
      order.paymentStatus = PaymentStatus.PAID;
      order.paymentTransactionId = transactionId;
      order.status = OrderStatus.PENDING;

      // Update stock levels
      for (const item of order.items) {
        await this.productsService.updateStock(item.productId, item.quantity);
      }

      await this.clearCustomerCart(order);
    } else if (status === 'failed' || status === 'cancelled') {
      order.paymentStatus = PaymentStatus.FAILED;
    }

    return this.ordersRepository.save(order);
  }

  // Only called once payment is actually confirmed — see the note in
  // createOrder for why this doesn't happen any earlier.
  private async clearCustomerCart(order: Order): Promise<void> {
    const cart = await this.cartRepository.findOne({
      where: order.userId ? { userId: order.userId } : { guestId: order.guestId },
      relations: ['items'],
    });
    if (cart) {
      await this.cartRepository.remove(cart);
    }
  }
}

