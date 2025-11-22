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
import { ClassAccountOperator } from './class-account-operator.entity';
import { ClassGroupOrder } from './class-group-order.entity';
import { SchoolClass } from './school-class.entity';

@Entity({ name: 'class_accounts' })
export class ClassAccount {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @ManyToOne(() => SchoolClass, (cls) => cls.classAccounts)
  @JoinColumn({ name: 'class_id' })
  classroom!: SchoolClass;

  @Column({ length: 64 })
  name!: string;

  @Column({ name: 'max_students_per_order', type: 'int', default: 10 })
  maxStudentsPerOrder!: number;

  @Column({ name: 'max_amount_per_order', type: 'decimal', precision: 10, scale: 2, default: 80 })
  maxAmountPerOrder!: string;

  @Column({ type: 'tinyint', default: 1 })
  enabled!: number;

  @Column({ name: 'allowed_ip', length: 64, nullable: true })
  allowedIp?: string;

  @Column({ length: 255, nullable: true })
  remark?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => ClassAccountOperator, (op) => op.classAccount)
  operators?: ClassAccountOperator[];

  @OneToMany(() => ClassGroupOrder, (order) => order.classAccount)
  orders?: ClassGroupOrder[];
}
