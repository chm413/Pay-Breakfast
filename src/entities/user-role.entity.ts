import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Role } from './role.entity';
import { User } from './user.entity';

@Entity({ name: 'user_roles' })
@Unique(['user', 'role'])
export class UserRole {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @ManyToOne(() => User, (user) => user.roles)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Role, (role) => role.userRoles)
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
