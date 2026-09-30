import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Affiliate } from './affiliate.entity';

// A record of commission paid out to an affiliate. Payment itself happens
// outside the site (e.g. crypto transfer); this just keeps the balance.
@Entity('affiliate_payouts')
export class AffiliatePayout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  affiliateId: string;

  // EUR, the base currency.
  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column('text', { nullable: true })
  note: string;

  @ManyToOne(() => Affiliate, (affiliate) => affiliate.payouts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'affiliateId' })
  affiliate: Affiliate;

  @CreateDateColumn()
  createdAt: Date;
}
