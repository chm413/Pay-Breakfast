import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ClassAccount } from './class-account.entity';
import { ClassGroupOrderItem } from './class-group-order-item.entity';
import { User } from './user.entity';

@Entity({ name: 'class_group_orders' })
export class ClassGroupOrder {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @ManyToOne(() => ClassAccount, (account) => account.orders)
  @JoinColumn({ name: 'class_account_id' })
  classAccount!: ClassAccount;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'operator_user_id' })
  operator!: User;

  @Column({ name: 'order_time', type: 'datetime' })
  orderTime!: Date;

  @Column({ name: 'student_count', type: 'int' })
  studentCount!: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalAmount!: string;

  @Column({ length: 32 })
  status!: string;

  @Column({ length: 255, nullable: true })
  remark?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => ClassGroupOrderItem, (item) => item.groupOrder)
  items?: ClassGroupOrderItem[];
}
