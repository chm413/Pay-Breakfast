import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserRole])],
  controllers: [UsersController],
})
export class UsersModule {}
