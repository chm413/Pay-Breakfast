import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Account } from './account.entity';
import { Student } from './student.entity';

@Entity({ name: 'risk_events' })
export class RiskEvent {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @ManyToOne(() => Account, (account) => account.riskEvents)
  @JoinColumn({ name: 'account_id' })
  account!: Account;

  @ManyToOne(() => Student, (student) => student.riskEvents, { nullable: true })
  @JoinColumn({ name: 'student_id' })
  student?: Student;

  @Column({ length: 32 })
  type!: string;

  @Column({ type: 'tinyint' })
  level!: number;

  @Column({ length: 255 })
  message!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
