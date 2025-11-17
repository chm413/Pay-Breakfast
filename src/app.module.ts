import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from './accounts/accounts.module';
import { ClassOrdersModule } from './class-orders/class-orders.module';
import { RechargeModule } from './recharge/recharge.module';
import * as entities from './entities';
import { NotificationsModule } from './notifications/notifications.module';

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
    AccountsModule,
    ClassOrdersModule,
    RechargeModule,
    NotificationsModule,
  ],
})
export class AppModule {}
