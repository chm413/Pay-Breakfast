import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from '../accounts/accounts.module';
import { BreakfastProduct } from '../entities/breakfast-product.entity';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { UsersModule } from '../users/users.module';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { AdminOrdersController } from './admin-orders.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, BreakfastProduct]), AccountsModule, UsersModule],
  providers: [OrdersService],
  controllers: [OrdersController, AdminOrdersController],
})
export class OrdersModule {}
