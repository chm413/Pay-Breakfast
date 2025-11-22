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
import { Student } from './student.entity';
import { User } from './user.entity';

@Entity({ name: 'recharge_requests' })
export class RechargeRequest {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account!: Account;

  @ManyToOne(() => Student, (student) => student.rechargeRequests, { nullable: true })
  @JoinColumn({ name: 'student_id' })
  student?: Student;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: string;

  @Column({ name: 'pay_method', length: 32 })
  payMethod!: string;

  @Column({ name: 'voucher_image_url', length: 255, nullable: true })
  voucherImageUrl?: string;

  @Column({ length: 32 })
  status!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewer_user_id' })
  reviewer?: User;

  @Column({ name: 'review_time', type: 'datetime', nullable: true })
  reviewTime?: Date;

  @Column({ name: 'review_comment', length: 255, nullable: true })
  reviewComment?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
