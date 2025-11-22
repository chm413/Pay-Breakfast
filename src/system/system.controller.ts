import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, Transaction, User } from '../entities';
import { SimpleAuthGuard } from '../common/simple-auth.guard';
import * as fs from 'fs';
import * as path from 'path';

@Controller('admin/system')
@UseGuards(SimpleAuthGuard)
export class SystemController {
  private readonly startedAt = Date.now();

  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Order) private readonly ordersRepo: Repository<Order>,
    @InjectRepository(Transaction) private readonly txRepo: Repository<Transaction>,
  ) {}

  @Get('status')
  async status() {
    const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    const frontendPackage = fs.existsSync(path.join(process.cwd(), 'frontend', 'package.json'))
      ? JSON.parse(fs.readFileSync(path.join(process.cwd(), 'frontend', 'package.json'), 'utf8'))
      : { version: 'unknown' };

    const totalUsers = await this.usersRepo.count({ where: { status: 1 } });
    const totalCompletedOrders = await this.ordersRepo.count({ where: { status: 'success' } });
    const totalAmountRaw = await this.txRepo
      .createQueryBuilder('tx')
      .select('COALESCE(SUM(tx.amount),0)', 'total')
      .where('tx.type = :type', { type: 'CONSUME' })
      .getRawOne();

    return {
      backendVersion: packageJson.version,
      frontendVersion: frontendPackage.version,
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      totalUsers,
      totalCompletedOrders,
      totalAmount: Number(totalAmountRaw.total || 0),
    };
  }
}
