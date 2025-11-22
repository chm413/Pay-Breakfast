import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { BreakfastCategory } from '../entities/breakfast-category.entity';
import { BreakfastProduct } from '../entities/breakfast-product.entity';
import { Vendor } from '../entities/vendor.entity';

@Injectable()
export class BreakfastService {
  constructor(
    @InjectRepository(BreakfastCategory)
    private readonly categoryRepo: Repository<BreakfastCategory>,
    @InjectRepository(BreakfastProduct)
    private readonly productRepo: Repository<BreakfastProduct>,
    @InjectRepository(Vendor)
    private readonly vendorRepo: Repository<Vendor>,
  ) {}

  async listCategories() {
    return this.categoryRepo.find({ order: { sortOrder: 'ASC', id: 'ASC' } });
  }

  async createCategory(payload: Partial<BreakfastCategory>) {
    const created = this.categoryRepo.create(payload);
    return this.categoryRepo.save(created);
  }

  async updateCategory(id: number, payload: Partial<BreakfastCategory>) {
    await this.categoryRepo.update({ id }, payload);
    return this.categoryRepo.findOne({ where: { id } });
  }

  async disableCategory(id: number) {
    await this.categoryRepo.update({ id }, { enabled: false });
    return { id, enabled: false };
  }

  async listProducts(filters: { categoryId?: number; enabled?: boolean }) {
    const where: FindOptionsWhere<BreakfastProduct> = {};
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.enabled !== undefined) where.enabled = filters.enabled;
    return this.productRepo.find({ where, relations: ['category'], order: { id: 'ASC' } });
  }

  async createProduct(payload: Partial<BreakfastProduct>) {
    const category = await this.categoryRepo.findOne({ where: { id: payload.categoryId } });
    if (!category) throw new NotFoundException('分类不存在');
    if (payload.vendorId) {
      const vendor = await this.vendorRepo.findOne({ where: { id: payload.vendorId } });
      if (!vendor) throw new NotFoundException('店家不存在');
    }
    const created = this.productRepo.create(payload);
    return this.productRepo.save(created);
  }

  async updateProduct(id: number, payload: Partial<BreakfastProduct>) {
    if (payload.categoryId) {
      const category = await this.categoryRepo.findOne({ where: { id: payload.categoryId } });
      if (!category) throw new NotFoundException('分类不存在');
    }
    if (payload.vendorId) {
      const vendor = await this.vendorRepo.findOne({ where: { id: payload.vendorId } });
      if (!vendor) throw new NotFoundException('店家不存在');
    }
    await this.productRepo.update({ id }, payload);
    return this.productRepo.findOne({ where: { id }, relations: ['category'] });
  }

  async disableProduct(id: number) {
    await this.productRepo.update({ id }, { enabled: false });
    return { id, enabled: false };
  }

  async getProductOrFail(id: number) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('商品不存在');
    return product;
  }
}
