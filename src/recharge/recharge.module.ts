import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from '../accounts/accounts.module';
import { RechargeRequest, Student } from '../entities';
import { RechargeController } from './recharge.controller';
import { RechargeService } from './recharge.service';
import { AuthModule } from '../auth/auth.module';
import { RecentVerificationGuard } from '../common/recent-verification.guard';

@Module({
  imports: [AccountsModule, AuthModule, TypeOrmModule.forFeature([RechargeRequest, Student])],
  controllers: [RechargeController],
  providers: [RechargeService, RecentVerificationGuard],
})
export class RechargeModule {}
