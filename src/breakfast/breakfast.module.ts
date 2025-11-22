import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BreakfastCategory } from '../entities/breakfast-category.entity';
import { BreakfastProduct } from '../entities/breakfast-product.entity';
import { BreakfastService } from './breakfast.service';
import { AdminBreakfastController } from './admin-breakfast.controller';
import { BreakfastController } from './breakfast.controller';
import { Vendor } from '../entities/vendor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BreakfastCategory, BreakfastProduct, Vendor])],
  controllers: [AdminBreakfastController, BreakfastController],
  providers: [BreakfastService],
  exports: [BreakfastService],
})
export class BreakfastModule {}
