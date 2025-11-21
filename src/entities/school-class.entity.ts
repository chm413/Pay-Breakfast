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
import { Grade } from './grade.entity';
import { Student } from './student.entity';
import { User } from './user.entity';

@Entity({ name: 'classes' })
export class SchoolClass {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @ManyToOne(() => Grade, (grade) => grade.classes)
  @JoinColumn({ name: 'grade_id' })
  grade!: Grade;

  @Column({ length: 64 })
  name!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'head_teacher_id' })
  headTeacher?: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => Student, (student) => student.classroom)
  students?: Student[];

  @OneToMany(() => ClassAccount, (account) => account.classroom)
  classAccounts?: ClassAccount[];
}
