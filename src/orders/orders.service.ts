import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AccountsService } from '../accounts/accounts.service';
import { BreakfastProduct } from '../entities/breakfast-product.entity';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';

interface PersonalOrderItemPayload {
  productId: number;
  quantity: number;
  itemRemark?: string;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(BreakfastProduct)
    private readonly productRepo: Repository<BreakfastProduct>,
    private readonly accountsService: AccountsService,
    private readonly dataSource: DataSource,
  ) {}

  async createPersonalOrder(userId: number, payload: { items: PersonalOrderItemPayload[]; remark?: string }) {
    if (!payload.items?.length) {
      throw new BadRequestException('订单项不能为空');
    }

    const products = await this.loadProducts(payload.items.map((i) => i.productId));
    const account = await this.accountsService.getOrCreatePersonalAccountForUser(userId);

    return this.dataSource.transaction(async (manager) => {
      const order = this.orderRepo.create({
        orderType: 'PERSONAL',
        creatorUserId: userId,
        targetUserId: userId,
        remark: payload.remark,
        status: 'created',
      });
      const savedOrder = await manager.save(order);

      const results: OrderItem[] = [];
      let successCount = 0;
      let total = 0;

      for (const item of payload.items) {
        const product = products.get(item.productId);
        if (!product) {
          results.push(
            this.orderItemRepo.create({
              orderId: savedOrder.id,
              personalAccountId: account.id,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: '0',
              amount: '0',
              status: 'failed',
              failReason: 'PRODUCT_NOT_FOUND',
            }),
          );
          continue;
        }

        const unitPrice = Number(product.price);
        const amount = unitPrice * (item.quantity || 1);
        const consumeResult = await this.accountsService.consume(account.id, amount, { type: 'ORDER', id: savedOrder.id }, userId);
        const success = consumeResult.success;
        results.push(
          this.orderItemRepo.create({
            orderId: savedOrder.id,
            personalAccountId: account.id,
            productId: product.id,
            quantity: item.quantity || 1,
            unitPrice: unitPrice.toFixed(2),
            amount: amount.toFixed(2),
            itemRemark: item.itemRemark,
            status: success ? 'success' : 'failed',
            transactionId: consumeResult.transactionId,
            failReason: success ? undefined : consumeResult.errorCode,
          }),
        );
        if (success) {
          successCount += 1;
          total += amount;
        }
      }

      await manager.save(results);
      const status = successCount === 0 ? 'canceled' : successCount === results.length ? 'success' : 'partially_success';
      await manager.update(Order, { id: savedOrder.id }, { status, totalAmount: total.toFixed(2) });
      return { ...savedOrder, status, totalAmount: total.toFixed(2), items: results };
    });
  }

  async createBatchOrder(creatorUserId: number, payload: any) {
    const targets = payload.targets || [];
    if (!targets.length) throw new BadRequestException('targets 不能为空');

    const products = await this.loadProducts(
      targets.flatMap((t: any) => (t.items || []).map((i: any) => i.productId)),
    );

    return this.dataSource.transaction(async (manager) => {
      const order = this.orderRepo.create({
        orderType: 'BATCH',
        creatorUserId,
        remark: payload.remark,
        status: 'created',
      });
      const saved = await manager.save(order);

      const items: OrderItem[] = [];
      let successCount = 0;
      let total = 0;

      for (const target of targets) {
        const account = await this.accountsService.getOrCreatePersonalAccountForUser(target.userId);
        for (const item of target.items || []) {
          const product = products.get(item.productId);
          if (!product) {
            items.push(
              this.orderItemRepo.create({
                orderId: saved.id,
                personalAccountId: account.id,
                productId: item.productId,
                quantity: item.quantity || 1,
                unitPrice: '0',
                amount: '0',
                status: 'failed',
                failReason: 'PRODUCT_NOT_FOUND',
              }),
            );
            continue;
          }
          const unitPrice = Number(product.price);
          const amount = unitPrice * (item.quantity || 1);
          const consumeResult = await this.accountsService.consume(
            account.id,
            amount,
            { type: 'BATCH_ORDER', id: saved.id },
            creatorUserId,
          );
          const success = consumeResult.success;
          items.push(
            this.orderItemRepo.create({
              orderId: saved.id,
              personalAccountId: account.id,
              productId: product.id,
              quantity: item.quantity || 1,
              unitPrice: unitPrice.toFixed(2),
              amount: amount.toFixed(2),
              itemRemark: item.itemRemark,
              status: success ? 'success' : 'failed',
              transactionId: consumeResult.transactionId,
              failReason: success ? undefined : consumeResult.errorCode,
            }),
          );
          if (success) {
            successCount += 1;
            total += amount;
          }
        }
      }

      await manager.save(items);
      const status = successCount === 0 ? 'canceled' : successCount === items.length ? 'success' : 'partially_success';
      await manager.update(Order, { id: saved.id }, { status, totalAmount: total.toFixed(2) });
      return { ...saved, status, totalAmount: total.toFixed(2), items };
    });
  }

  private async loadProducts(ids: number[]) {
    const uniqueIds = Array.from(new Set(ids)).filter(Boolean);
    const list = await this.productRepo.find({ where: uniqueIds.map((id) => ({ id, enabled: true })) });
    return new Map(list.map((p) => [p.id, p]));
  }
}
