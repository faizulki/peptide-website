import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  CREATED = 'created',
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderNumber: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  guestId: string;

  @Column()
  customerName: string;

  @Column()
  customerEmail: string;

  @Column()
  customerPhone: string;

  @Column('text')
  shippingAddress: string; // JSON string

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  items: OrderItem[];

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column('decimal', { precision: 10, scale: 2 })
  shipping: number;

  // Affiliate discount, taken off the subtotal: total = subtotal - discount + shipping.
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  // Affiliate attribution. The code and commission are snapshotted when the
  // order is placed, so later edits to the affiliate don't rewrite history.
  // Commission only counts toward earnings once the order is paid.
  @Column({ nullable: true })
  affiliateId: string;

  @Column({ nullable: true })
  affiliateCode: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  commission: number;

  @Column({ type: 'varchar', default: OrderStatus.CREATED })
  status: OrderStatus;

  @Column({ type: 'varchar', default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Column({ default: 'PAYGATE' })
  paymentMethod: string;

  @Column({ nullable: true })
  paymentTransactionId: string;

  @Column({ nullable: true })
  paymentRequestId: string; // B2BINPAY request ID

  @Column({ nullable: true })
  shippedAt: Date;

  @Column({ nullable: true })
  deliveredAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

