import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Student } from './student.entity';
import { Transaction } from './transaction.entity';
import { RiskEvent } from './risk-event.entity';

@Entity({ name: 'accounts' })
export class Account {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @Column({ length: 16 })
  type!: string;

  @Column({ name: 'owner_user_id', type: 'bigint', nullable: true })
  ownerUserId?: number;

  @OneToOne(() => Student, (student) => student.personalAccount, { nullable: true })
  @JoinColumn({ name: 'student_id' })
  student?: Student;

  @Column({ name: 'merchant_id', type: 'bigint', nullable: true })
  merchantId?: number;

  @Column({ length: 64 })
  name!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance!: string;

  @Column({ name: 'credit_limit', type: 'decimal', precision: 10, scale: 2, default: 0 })
  creditLimit!: string;

  @Column({ type: 'tinyint', default: 1 })
  status!: number;

  @Column({ name: 'risk_level', type: 'tinyint', default: 0 })
  riskLevel!: number;

  @Column({ name: 'reminder_threshold', type: 'decimal', precision: 10, scale: 2, default: 25.0 })
  reminderThreshold!: string;

  @Column({ name: 'danger_threshold', type: 'decimal', precision: 10, scale: 2, default: 3.0 })
  dangerThreshold!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => Transaction, (tx) => tx.account)
  transactions?: Transaction[];

  @OneToMany(() => RiskEvent, (event) => event.account)
  riskEvents?: RiskEvent[];
}
