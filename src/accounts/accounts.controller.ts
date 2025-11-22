import { Controller, Get, Param, ParseIntPipe, Query, Req, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SimpleAuthGuard } from '../common/simple-auth.guard';
import { extractUserFromRequest } from '../common/jwt.util';
import { Transaction } from '../entities/transaction.entity';
import { AccountsService } from './accounts.service';
import { Request } from 'express';

type AuthedRequest = Request & { user?: any };

@Controller('accounts')
@UseGuards(SimpleAuthGuard)
export class AccountsController {
  constructor(
    private readonly accountsService: AccountsService,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
  ) {}

  @Get('me')
  async getMe(@Req() req: AuthedRequest) {
    const user = extractUserFromRequest(req);
    const account = await this.accountsService.getOrCreatePersonalAccountForUser(user.id);
    return {
      id: account.id,
      balance: Number(account.balance),
      creditLimit: Number(account.creditLimit),
      status: account.status,
    };
  }

  @Get(':id/transactions')
  async listTransactions(@Param('id', ParseIntPipe) id: number, @Query('limit') limit?: string) {
    const take = Math.min(Number(limit) || 50, 200);
    const records = await this.transactionsRepository.find({
      where: { account: { id } },
      order: { createdAt: 'DESC' },
      take,
    });
    return records.map((tx) => ({
      id: tx.id,
      type: tx.type,
      direction: tx.direction,
      amount: Number(tx.amount),
      balanceAfter: Number(tx.balanceAfter),
      sourceType: tx.sourceType,
      sourceId: tx.sourceId,
      createdAt: tx.createdAt,
    }));
  }
}
