import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ClassGroupOrder } from '../entities/class-group-order.entity';
import { Student } from '../entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClassGroupOrder, Student])],
  controllers: [ReportsController],
})
export class ReportsModule {}
