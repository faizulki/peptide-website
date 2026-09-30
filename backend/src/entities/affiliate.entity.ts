import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { AffiliatePayout } from './affiliate-payout.entity';

@Entity('affiliates')
export class Affiliate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  // Stored uppercase. Used both in the tracking link (?ref=CODE, matched
  // case-insensitively) and as the code customers type at checkout.
  @Column({ unique: true })
  code: string;

  @Column({ nullable: true })
  email: string;

  // Percentage of each paid order's product total (after any discount,
  // excluding shipping) earned by the affiliate.
  @Column('decimal', { precision: 5, scale: 2, default: 10 })
  commissionPercent: number;

  // Percentage off the product total for customers who come through this
  // affiliate. 0 means the code only tracks, it doesn't discount.
  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  discountPercent: number;

  // Visits via the tracking link — counted once per browser session.
  @Column({ type: 'int', default: 0 })
  clicks: number;

  @Column({ default: true })
  isActive: boolean;

  @Column('text', { nullable: true })
  notes: string;

  @OneToMany(() => AffiliatePayout, (payout) => payout.affiliate)
  payouts: AffiliatePayout[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
