import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('articles')
export class Article {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  titleSv: string;

  @Column({ unique: true })
  slug: string;

  @Column('text')
  content: string; // HTML body

  @Column('text', { nullable: true })
  contentSv: string;

  @Column('text', { nullable: true })
  metaDescription: string;

  @Column('text', { nullable: true })
  metaDescriptionSv: string;

  @Column({ nullable: true })
  featuredImage: string;

  @Column({ default: true })
  isPublished: boolean;

  // 'soro' for anything the webhook created, 'manual' for admin-authored.
  @Column({ default: 'manual' })
  source: string;

  // The exact JSON body the webhook received, kept around so the field
  // mapping below can be corrected without losing anything if Soro's
  // actual payload shape turns out to differ from what we guessed.
  @Column('text', { nullable: true })
  rawPayload: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
