import { ForbiddenException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, IsNull, Repository } from 'typeorm';
import { BreakfastCategory, BreakfastProduct, OrderItem, Vendor, VendorDailySettlement } from '../entities';

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
    const qb = this.orderItemsRepo
      .createQueryBuilder('item')
      .leftJoin('item.product', 'product')
      .leftJoin('product.category', 'category')
      .where('item.status = :status', { status: 'success' })
      .andWhere('COALESCE(item.vendorId, product.vendorId) = :vendorId', { vendorId })
      .select('COALESCE(SUM(item.amount),0)', 'total');

    const total = await qb.getRawOne();

    const byCategory = await this.orderItemsRepo
      .createQueryBuilder('item')
      .leftJoin('item.product', 'product')
      .leftJoin('product.category', 'category')
      .where('item.status = :status', { status: 'success' })
      .andWhere('COALESCE(item.vendorId, product.vendorId) = :vendorId', { vendorId })
      .select('COALESCE(item.categoryId, product.categoryId)', 'categoryId')
      .addSelect('COALESCE(category.name, "未分类")', 'categoryName')
      .addSelect('COUNT(item.id)', 'ordersCount')
      .addSelect('COALESCE(SUM(item.amount),0)', 'totalAmount')
      .groupBy('COALESCE(item.categoryId, product.categoryId)')
      .addGroupBy('category.name')
      .getRawMany();

    return {
      totalAmount: Number(total.total || 0),
      byCategory: byCategory.map((row) => ({
        categoryId: row.categoryId ? Number(row.categoryId) : null,
        categoryName: row.categoryName,
        ordersCount: Number(row.ordersCount || 0),
        totalAmount: Number(row.totalAmount || 0),
      })),
    };
  }

  async settlements(req: any, vendorId: number, from?: string, to?: string, categoryId?: number) {
    this.ensureAdmin(req);
    const where: any = { vendor: { id: vendorId } };
    if (categoryId) where.categoryId = categoryId;
    if (from && to) where.date = Between(from, to);
    return this.settlementsRepo.find({ where, order: { date: 'DESC' }, relations: ['category'] });
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
      .select('COALESCE(item.vendorId, product.vendorId)', 'vendorId')
      .addSelect('COALESCE(item.categoryId, product.categoryId)', 'categoryId')
      .addSelect('COUNT(item.id)', 'ordersCount')
      .addSelect('COALESCE(SUM(item.amount),0)', 'totalAmount')
      .groupBy('COALESCE(item.vendorId, product.vendorId)')
      .addGroupBy('COALESCE(item.categoryId, product.categoryId)')
      .getRawMany();

    for (const row of items) {
      if (!row.vendorId) continue;
      const vendorId = Number(row.vendorId);
      const categoryId = row.categoryId ? Number(row.categoryId) : null;

      const existingForCombination = await this.settlementsRepo.findOne({
        where: {
          vendor: { id: vendorId },
          categoryId: categoryId ?? IsNull(),
          date: day,
        },
      });
      if (existingForCombination) continue;

      const settlement = this.settlementsRepo.create({
        vendor: { id: vendorId } as Vendor,
        category: categoryId ? ({ id: categoryId } as BreakfastCategory) : null,
        categoryId: categoryId ?? null,
        date: day,
        ordersCount: Number(row.ordersCount),
        totalAmount: Number(row.totalAmount).toFixed(2),
      });
      await this.settlementsRepo.save(settlement);
    }
    return { date: day, generated: items.length };
  }
}
