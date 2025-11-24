import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Account } from './account.entity';
import { Order } from './order.entity';
import { BreakfastProduct } from './breakfast-product.entity';
import { BreakfastCategory } from './breakfast-category.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @ManyToOne(() => Order, (order) => order.items)
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ name: 'order_id', type: 'bigint' })
  orderId!: number;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'personal_account_id' })
  personalAccount?: Account;

  @Column({ name: 'personal_account_id', type: 'bigint' })
  personalAccountId!: number;

  @ManyToOne(() => BreakfastProduct)
  @JoinColumn({ name: 'product_id' })
  product?: BreakfastProduct;

  @Column({ name: 'product_id', type: 'bigint' })
  productId!: number;

  @ManyToOne(() => BreakfastCategory, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category?: BreakfastCategory | null;

  @Column({ name: 'category_id', type: 'bigint', nullable: true })
  categoryId?: number | null;

  @Column({ name: 'vendor_id', type: 'bigint', nullable: true })
  vendorId?: number | null;

  @Column({ name: 'target_user_id', type: 'bigint', nullable: true })
  targetUserId?: number | null;

  @Column({ type: 'int', default: 1 })
  quantity!: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: string;

  @Column({ name: 'item_remark', length: 255, nullable: true })
  itemRemark?: string;

  @Column({ name: 'transaction_id', type: 'bigint', nullable: true })
  transactionId?: number;

  @Column({ length: 16, default: 'pending' })
  status!: 'pending' | 'success' | 'failed';

  @Column({ name: 'fail_reason', length: 255, nullable: true })
  failReason?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
