import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Vendor } from './vendor.entity';

@Entity({ name: 'vendor_daily_settlements' })
export class VendorDailySettlement {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @ManyToOne(() => Vendor)
  @JoinColumn({ name: 'vendor_id' })
  vendor!: Vendor;

  @Column({ type: 'date' })
  date!: string;

  @Column({ name: 'orders_count', type: 'int' })
  ordersCount!: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
