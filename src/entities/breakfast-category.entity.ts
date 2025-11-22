import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('breakfast_categories')
export class BreakfastCategory {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ length: 32, unique: true })
  name!: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ type: 'tinyint', default: true })
  enabled!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
