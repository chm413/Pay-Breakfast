import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from '../accounts/accounts.module';
import { ClassAccount, ClassAccountOperator, ClassGroupOrder, ClassGroupOrderItem, Student } from '../entities';
import { ClassOrdersController } from './class-orders.controller';
import { ClassOrdersService } from './class-orders.service';

@Module({
  imports: [
    AccountsModule,
    TypeOrmModule.forFeature([ClassAccount, ClassAccountOperator, ClassGroupOrder, ClassGroupOrderItem, Student]),
  ],
  controllers: [ClassOrdersController],
  providers: [ClassOrdersService],
})
export class ClassOrdersModule {}
