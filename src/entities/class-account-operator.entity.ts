import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ClassAccount } from './class-account.entity';
import { User } from './user.entity';

@Entity({ name: 'class_account_operators' })
export class ClassAccountOperator {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @ManyToOne(() => ClassAccount, (account) => account.operators)
  @JoinColumn({ name: 'class_account_id' })
  classAccount!: ClassAccount;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
