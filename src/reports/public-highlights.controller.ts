import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { ClassGroupOrder } from '../entities/class-group-order.entity';
import { ClassGroupOrderItem } from '../entities/class-group-order-item.entity';

@Controller('public')
export class PublicHighlightsController {
  constructor(
    @InjectRepository(ClassGroupOrder)
    private readonly ordersRepository: Repository<ClassGroupOrder>,
    @InjectRepository(ClassGroupOrderItem)
    private readonly orderItemsRepository: Repository<ClassGroupOrderItem>,
  ) {}

  @Get('highlights')
  async highlights() {
    const now = new Date();
    const since = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    since.setUTCDate(since.getUTCDate() - 6);

    const totalOrders = await this.ordersRepository.count({ where: { createdAt: MoreThanOrEqual(since) } });
    const totalAmountRaw = await this.ordersRepository
      .createQueryBuilder('o')
      .select('COALESCE(SUM(o.totalAmount),0)', 'sum')
      .where('o.createdAt >= :since', { since })
      .getRawOne<{ sum: string }>();

    const averageDailyOrders = Number((totalOrders / 7).toFixed(2));
    const totalAmountLast7Days = Number(totalAmountRaw?.sum || 0);

    const topProducts = await this.orderItemsRepository
      .createQueryBuilder('item')
      .innerJoin('item.groupOrder', 'order')
      .select('item.productId', 'productId')
      .addSelect('COUNT(*)', 'orders')
      .addSelect('COALESCE(SUM(item.amount),0)', 'amount')
      .where('order.createdAt >= :since', { since })
      .andWhere('item.productId IS NOT NULL')
      .groupBy('item.productId')
      .orderBy('amount', 'DESC')
      .limit(5)
      .getRawMany<{ productId: string; orders: string; amount: string }>();

    return {
      windowDays: 7,
      since: since.toISOString(),
      totalOrdersLast7Days: totalOrders,
      totalAmountLast7Days,
      averageDailyOrders,
      topProducts: topProducts.map((p) => ({
        productId: Number(p.productId),
        orders: Number(p.orders),
        amount: Number(p.amount),
      })),
      updatedAt: new Date().toISOString(),
    };
  }
}
