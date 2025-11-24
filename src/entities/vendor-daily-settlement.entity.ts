import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Vendor } from './vendor.entity';
import { BreakfastCategory } from './breakfast-category.entity';

@Entity({ name: 'vendor_daily_settlements' })
export class VendorDailySettlement {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @ManyToOne(() => Vendor)
  @JoinColumn({ name: 'vendor_id' })
  vendor!: Vendor;

  @ManyToOne(() => BreakfastCategory, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category?: BreakfastCategory | null;

  @Column({ name: 'category_id', type: 'bigint', nullable: true })
  categoryId?: number | null;

  @Column({ type: 'date' })
  date!: string;

  @Column({ name: 'orders_count', type: 'int' })
  ordersCount!: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
