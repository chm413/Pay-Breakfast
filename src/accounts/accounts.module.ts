import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { Account, Notification, RiskEvent, Student, Transaction } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Account, Transaction, RiskEvent, Student, Notification])],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}
