import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ name: 'order_type', length: 16 })
  orderType!: 'PERSONAL' | 'BATCH';

  @Column({ name: 'creator_user_id', type: 'bigint' })
  creatorUserId!: number;

  @Column({ name: 'target_user_id', type: 'bigint', nullable: true })
  targetUserId?: number | null;

  @Column({ length: 255, nullable: true })
  remark?: string;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalAmount!: string;

  @Column({ length: 16, default: 'created' })
  status!: 'created' | 'partially_success' | 'success' | 'canceled';

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items?: OrderItem[];
}
