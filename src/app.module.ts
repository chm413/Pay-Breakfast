import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from './accounts/accounts.module';
import { AuthModule } from './auth/auth.module';
import { ClassOrdersModule } from './class-orders/class-orders.module';
import { RechargeModule } from './recharge/recharge.module';
import * as entities from './entities';
import { NotificationsModule } from './notifications/notifications.module';
import { UsersModule } from './users/users.module';
import { ReportsModule } from './reports/reports.module';
import { BreakfastModule } from './breakfast/breakfast.module';
import { OrdersModule } from './orders/orders.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { VendorsModule } from './vendors/vendors.module';
import { SystemController } from './system/system.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'pay_breakfast',
      charset: process.env.DB_CHARSET || 'utf8mb4_unicode_ci',
      supportBigNumbers: true,
      legacySpatialSupport: true,
      dateStrings: true,
      timezone: '+00:00',
      entities: Object.values(entities),
      synchronize: true,
    }),
    TypeOrmModule.forFeature([entities.User, entities.Order, entities.Transaction]),
    AccountsModule,
    AuthModule,
    ClassOrdersModule,
    RechargeModule,
    NotificationsModule,
    UsersModule,
    ReportsModule,
    BreakfastModule,
    OrdersModule,
    AnnouncementsModule,
    VendorsModule,
  ],
  controllers: [SystemController],
})
export class AppModule {}
