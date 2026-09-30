import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('faqs')
export class Faq {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  question: string;

  @Column('text')
  answer: string;

  // Swedish translations — nullable, storefront falls back to English
  // until an admin fills these in.
  @Column('text', { nullable: true })
  questionSv: string;

  @Column('text', { nullable: true })
  answerSv: string;

  // Lower sorts first on the storefront FAQ page.
  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
