import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

// A lab report (certificate of analysis) image for a product. A product can
// have several — typically one per batch — shown newest first on its page
// and on the storefront's Lab Reports page.
@Entity('lab_reports')
export class LabReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  image: string;

  @Column({ type: 'varchar', nullable: true })
  batchNumber: string | null;

  // Calendar date the lab tested the batch, as YYYY-MM-DD.
  @Column({ type: 'varchar', nullable: true })
  testDate: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
