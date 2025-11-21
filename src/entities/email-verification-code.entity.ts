import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'email_verification_codes' })
@Index(['email', 'purpose'])
export class EmailVerificationCode {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @Column({ type: 'varchar', length: 128 })
  email!: string;

  @Column({ type: 'varchar', length: 8 })
  code!: string;

  @Column({ type: 'varchar', length: 32 })
  purpose!: string;

  @Column({ type: 'datetime' })
  expiresAt!: Date;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;
}
