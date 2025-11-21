import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Student } from './student.entity';
import { UserRole } from './user-role.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @Column({ unique: true, length: 64 })
  username!: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash!: string;

  @Column({ name: 'real_name', length: 64 })
  realName!: string;

  @Column({ length: 20, nullable: true })
  phone?: string;

  @Column({ length: 128, nullable: true })
  email?: string;

  @Column({ type: 'tinyint', default: 1 })
  status!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => UserRole, (role) => role.user)
  roles?: UserRole[];

  @OneToMany(() => Student, (student) => student.user)
  students?: Student[];
}
