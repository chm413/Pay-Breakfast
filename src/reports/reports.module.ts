import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ClassGroupOrder } from '../entities/class-group-order.entity';
import { Student } from '../entities/student.entity';
import { ClassGroupOrderItem } from '../entities/class-group-order-item.entity';
import { PublicHighlightsController } from './public-highlights.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClassGroupOrder, ClassGroupOrderItem, Student])],
  controllers: [ReportsController, PublicHighlightsController],
})
export class ReportsModule {}
