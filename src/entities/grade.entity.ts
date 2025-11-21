import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { SchoolClass } from './school-class.entity';
import { Student } from './student.entity';

@Entity({ name: 'grades' })
export class Grade {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @Column({ length: 64 })
  name!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => SchoolClass, (cls) => cls.grade)
  classes?: SchoolClass[];

  @OneToMany(() => Student, (student) => student.grade)
  students?: Student[];
}
