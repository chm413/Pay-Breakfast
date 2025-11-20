import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from '../accounts/accounts.module';
import { RechargeRequest, Student } from '../entities';
import { RechargeController } from './recharge.controller';
import { RechargeService } from './recharge.service';

@Module({
  imports: [AccountsModule, TypeOrmModule.forFeature([RechargeRequest, Student])],
  controllers: [RechargeController],
  providers: [RechargeService],
})
export class RechargeModule {}
