import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BreakfastCategory } from './breakfast-category.entity';

@Entity('breakfast_products')
export class BreakfastProduct {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @ManyToOne(() => BreakfastCategory)
  @JoinColumn({ name: 'category_id' })
  category?: BreakfastCategory;

  @Column({ name: 'category_id', type: 'bigint' })
  categoryId!: number;

  @Column({ length: 64 })
  name!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price!: number;

  @Column({ length: 16, default: '份' })
  unit!: string;

  @Column({ type: 'tinyint', default: true })
  enabled!: boolean;

  @Column({ length: 255, nullable: true })
  remark?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
