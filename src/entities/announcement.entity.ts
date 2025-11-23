import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'announcements' })
export class Announcement {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @Column({ length: 64 })
  title!: string;

  @Column({ name: 'content_md', type: 'text' })
  contentMd!: string;

  @Column({ name: 'show_on_login', type: 'tinyint', default: 0 })
  showOnLogin!: boolean;

  @Column({ type: 'tinyint', default: 1 })
  enabled!: boolean;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'creator_user_id' })
  creator?: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
