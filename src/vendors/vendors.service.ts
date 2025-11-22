import { ForbiddenException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { BreakfastProduct, OrderItem, Vendor, VendorDailySettlement } from '../entities';

@Injectable()
export class VendorsService implements OnModuleInit {
  constructor(
    @InjectRepository(Vendor) private readonly vendorsRepo: Repository<Vendor>,
    @InjectRepository(VendorDailySettlement) private readonly settlementsRepo: Repository<VendorDailySettlement>,
    @InjectRepository(OrderItem) private readonly orderItemsRepo: Repository<OrderItem>,
    @InjectRepository(BreakfastProduct) private readonly productRepo: Repository<BreakfastProduct>,
  ) {}

  private lastSettlementDate?: string;

  onModuleInit() {
    this.tryRunForToday();
    setInterval(() => this.tryRunForToday(), 60 * 60 * 1000);
  }

  private async tryRunForToday() {
    const today = new Date().toISOString().slice(0, 10);
    if (this.lastSettlementDate === today) return;
    await this.runDailySettlement(undefined, today);
    this.lastSettlementDate = today;
  }

  private ensureAdmin(req: any) {
    const roles: string[] = req.user?.roles || [];
    if (!roles.includes('ADMIN') && !roles.includes('SUPER_ADMIN') && !roles.includes('MANAGER')) {
      throw new ForbiddenException({ code: 'NO_PERMISSION', message: '你无权访问该资源' });
    }
  }

  list(req: any) {
    this.ensureAdmin(req);
    return this.vendorsRepo.find({ order: { name: 'ASC' } });
  }

  async create(req: any, body: any) {
    this.ensureAdmin(req);
    const vendor = this.vendorsRepo.create({ name: body.name, enabled: body.enabled ?? true, remark: body.remark });
    return this.vendorsRepo.save(vendor);
  }

  async update(req: any, id: number, body: any) {
    this.ensureAdmin(req);
    const vendor = await this.vendorsRepo.findOne({ where: { id } });
    if (!vendor) throw new NotFoundException('Vendor not found');
    Object.assign(vendor, body);
    return this.vendorsRepo.save(vendor);
  }

  async remove(req: any, id: number) {
    this.ensureAdmin(req);
    const vendor = await this.vendorsRepo.findOne({ where: { id } });
    if (!vendor) throw new NotFoundException('Vendor not found');
    vendor.enabled = false;
    return this.vendorsRepo.save(vendor);
  }

  async summary(req: any, vendorId: number) {
    this.ensureAdmin(req);
    const total = await this.orderItemsRepo
      .createQueryBuilder('item')
      .leftJoin('item.product', 'product')
      .where('product.vendorId = :vendorId', { vendorId })
      .andWhere('item.status = :status', { status: 'success' })
      .select('COALESCE(SUM(item.amount),0)', 'total')
      .getRawOne();
    return { totalAmount: Number(total.total || 0) };
  }

  async settlements(req: any, vendorId: number, from?: string, to?: string) {
    this.ensureAdmin(req);
    const where: any = { vendor: { id: vendorId } };
    if (from && to) where.date = Between(from, to);
    return this.settlementsRepo.find({ where, order: { date: 'DESC' } });
  }

  async runDailySettlement(req: any, date?: string) {
    if (req) this.ensureAdmin(req);
    const day = date || new Date().toISOString().slice(0, 10);
    const existing = await this.settlementsRepo.findOne({ where: { date: day } });
    if (existing) return existing;
    const items = await this.orderItemsRepo
      .createQueryBuilder('item')
      .leftJoin('item.product', 'product')
      .where('item.status = :status', { status: 'success' })
      .andWhere('DATE(item.created_at) = :day', { day })
      .select('product.vendorId', 'vendorId')
      .addSelect('COUNT(item.id)', 'ordersCount')
      .addSelect('COALESCE(SUM(item.amount),0)', 'totalAmount')
      .groupBy('product.vendorId')
      .getRawMany();

    for (const row of items) {
      if (!row.vendorId) continue;
      const settlement = this.settlementsRepo.create({
        vendor: { id: Number(row.vendorId) } as Vendor,
        date: day,
        ordersCount: Number(row.ordersCount),
        totalAmount: Number(row.totalAmount).toFixed(2),
      });
      await this.settlementsRepo.save(settlement);
    }
    return { date: day, generated: items.length };
  }
}
