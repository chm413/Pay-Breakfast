import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'dormant_account_reports' })
export class DormantAccountReport {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @Column({ name: 'report_date', type: 'date' })
  reportDate!: string;

  @Column({ name: 'grade_id', type: 'bigint', nullable: true })
  gradeId?: number;

  @Column({ name: 'class_id', type: 'bigint', nullable: true })
  classId?: number;

  @Column({ name: 'account_count', type: 'int' })
  accountCount!: number;

  @Column({ name: 'total_balance', type: 'decimal', precision: 10, scale: 2 })
  totalBalance!: string;

  @Column({ name: 'params_json', type: 'text', nullable: true })
  paramsJson?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
