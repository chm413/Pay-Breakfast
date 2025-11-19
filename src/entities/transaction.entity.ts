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

@Entity({ name: 'transactions' })
export class Transaction {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @ManyToOne(() => Account, (account) => account.transactions)
  @JoinColumn({ name: 'account_id' })
  account!: Account;

  @ManyToOne(() => Account, { nullable: true })
  @JoinColumn({ name: 'counterparty_account_id' })
  counterpartyAccount?: Account;

  @Column({ length: 32 })
  type!: string;

  @Column({ type: 'tinyint' })
  direction!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: string;

  @Column({ name: 'balance_after', type: 'decimal', precision: 10, scale: 2 })
  balanceAfter!: string;

  @Column({ name: 'source_type', length: 32, nullable: true })
  sourceType?: string;

  @Column({ name: 'source_id', type: 'bigint', nullable: true })
  sourceId?: number;

  @Column({ name: 'operator_user_id', type: 'bigint', nullable: true })
  operatorUserId?: number;

  @Column({ length: 255, nullable: true })
  description?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
