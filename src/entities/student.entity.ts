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
import { Account } from './account.entity';
import { Grade } from './grade.entity';
import { SchoolClass } from './school-class.entity';
import { User } from './user.entity';
import { ClassGroupOrderItem } from './class-group-order-item.entity';
import { RechargeRequest } from './recharge-request.entity';
import { RiskEvent } from './risk-event.entity';

@Entity({ name: 'students' })
export class Student {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @ManyToOne(() => User, (user) => user.students)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'student_no', length: 32, unique: true })
  studentNo!: string;

  @ManyToOne(() => Grade, (grade) => grade.students)
  @JoinColumn({ name: 'grade_id' })
  grade!: Grade;

  @ManyToOne(() => SchoolClass, (cls) => cls.students)
  @JoinColumn({ name: 'class_id' })
  classroom!: SchoolClass;

  @Column({ name: 'seat_no', length: 16, nullable: true })
  seatNo?: string;

  @Column({ name: 'parent_phone', length: 20, nullable: true })
  parentPhone?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToOne(() => Account, (account) => account.student)
  personalAccount?: Account;

  @OneToMany(() => ClassGroupOrderItem, (item) => item.student)
  groupOrderItems?: ClassGroupOrderItem[];

  @OneToMany(() => RechargeRequest, (req) => req.student)
  rechargeRequests?: RechargeRequest[];

  @OneToMany(() => RiskEvent, (event) => event.student)
  riskEvents?: RiskEvent[];
}
