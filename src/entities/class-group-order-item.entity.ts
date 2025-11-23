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
import { ClassGroupOrder } from './class-group-order.entity';
import { Student } from './student.entity';
import { Transaction } from './transaction.entity';

@Entity({ name: 'class_group_order_items' })
export class ClassGroupOrderItem {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @ManyToOne(() => ClassGroupOrder, (order) => order.items)
  @JoinColumn({ name: 'group_order_id' })
  groupOrder!: ClassGroupOrder;

  @ManyToOne(() => Student, (student) => student.groupOrderItems)
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'personal_account_id' })
  personalAccount!: Account;

  @Column({ name: 'product_id', type: 'bigint', nullable: true })
  productId?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: string;

  @ManyToOne(() => Transaction, { nullable: true })
  @JoinColumn({ name: 'transaction_id' })
  transaction?: Transaction;

  @Column({ length: 32 })
  status!: string;

  @Column({ name: 'fail_reason', length: 255, nullable: true })
  failReason?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
