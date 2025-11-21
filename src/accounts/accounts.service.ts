import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Account } from '../entities/account.entity';
import { Notification } from '../entities/notification.entity';
import { RiskEvent } from '../entities/risk-event.entity';
import { Student } from '../entities/student.entity';
import { Transaction } from '../entities/transaction.entity';

interface BalanceChangeResult {
  success: boolean;
  transactionId?: number;
  errorCode?: string;
  errorMessage?: string;
  newBalance?: number;
}

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(RiskEvent)
    private readonly riskEventsRepository: Repository<RiskEvent>,
    @InjectRepository(Student)
    private readonly studentsRepository: Repository<Student>,
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async getOrCreatePersonalAccountForUser(userId: number): Promise<Account> {
    const student = await this.studentsRepository.findOne({
      where: { user: { id: userId } },
      relations: ['personalAccount', 'personalAccount.student'],
    });

    if (student?.personalAccount) {
      return student.personalAccount;
    }

    const existing = await this.accountsRepository.findOne({ where: { ownerUserId: userId, type: 'personal' } });
    if (existing) return existing;

    const created = this.accountsRepository.create({
      type: 'personal',
      ownerUserId: userId,
      name: '个人账户',
      balance: '0.00',
      creditLimit: '0.00',
    });
    return this.accountsRepository.save(created);
  }

  async getPersonalAccountByStudentId(studentId: number): Promise<Account | null> {
    return this.accountsRepository.findOne({ where: { student: { id: studentId }, type: 'personal' }, relations: ['student'] });
  }

  async consume(
    accountId: number,
    amount: number,
    source: { type: string; id?: number },
    operatorUserId: number | null,
  ): Promise<BalanceChangeResult> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();

    try {
      const account = await runner.manager.getRepository(Account).findOne({
        where: { id: accountId },
        relations: ['student', 'student.user'],
        lock: { mode: 'pessimistic_write' },
      });
      if (!account || account.status !== 1) {
        await runner.rollbackTransaction();
        return { success: false, errorCode: 'ACCOUNT_NOT_AVAILABLE', errorMessage: 'Account not found or inactive' };
      }

      const oldBalance = Number(account.balance);
      const creditLimit = Number(account.creditLimit);
      const newBalance = Number((oldBalance - amount).toFixed(2));

      if (newBalance < -creditLimit) {
        await runner.rollbackTransaction();
        return { success: false, errorCode: 'INSUFFICIENT_FUNDS', errorMessage: 'Balance below credit limit' };
      }

      account.balance = newBalance.toFixed(2);
      await runner.manager.save(account);

      const transaction = this.transactionsRepository.create({
        account,
        type: 'CONSUME',
        direction: -1,
        amount: amount.toFixed(2),
        balanceAfter: account.balance,
        sourceType: source.type,
        sourceId: source.id,
        operatorUserId: operatorUserId ?? undefined,
      });
      const savedTx = await runner.manager.save(transaction);

      await this.handleThresholdAlerts(account, oldBalance, newBalance, runner.manager);

      await runner.commitTransaction();
      return { success: true, transactionId: savedTx.id, newBalance: newBalance };
    } catch (error) {
      await runner.rollbackTransaction();
      return { success: false, errorCode: 'INTERNAL_ERROR', errorMessage: (error as Error).message };
    } finally {
      await runner.release();
    }
  }

  async recharge(
    accountId: number,
    amount: number,
    source: { type: string; id?: number },
    operatorUserId: number | null,
  ): Promise<BalanceChangeResult> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();

    try {
      const account = await runner.manager.getRepository(Account).findOne({
        where: { id: accountId },
        relations: ['student', 'student.user'],
        lock: { mode: 'pessimistic_write' },
      });
      if (!account || account.status !== 1) {
        throw new NotFoundException('Account not found or inactive');
      }

      const oldBalance = Number(account.balance);
      const newBalance = Number((oldBalance + amount).toFixed(2));

      account.balance = newBalance.toFixed(2);
      await runner.manager.save(account);

      const transaction = this.transactionsRepository.create({
        account,
        type: 'RECHARGE',
        direction: 1,
        amount: amount.toFixed(2),
        balanceAfter: account.balance,
        sourceType: source.type,
        sourceId: source.id,
        operatorUserId: operatorUserId ?? undefined,
      });
      const savedTx = await runner.manager.save(transaction);

      await this.handleThresholdAlerts(account, oldBalance, newBalance, runner.manager);

      await runner.commitTransaction();
      return { success: true, transactionId: savedTx.id, newBalance };
    } catch (error) {
      await runner.rollbackTransaction();
      return { success: false, errorCode: 'INTERNAL_ERROR', errorMessage: (error as Error).message };
    } finally {
      await runner.release();
    }
  }

  private async handleThresholdAlerts(
    account: Account,
    oldBalance: number,
    newBalance: number,
    manager: EntityManager,
  ) {
    if (!account.student) return;

    const reminderThreshold = Number(account.reminderThreshold);
    const dangerThreshold = Number(account.dangerThreshold);

    if (oldBalance >= reminderThreshold && newBalance < reminderThreshold) {
      const event = this.riskEventsRepository.create({
        account,
        student: account.student,
        type: 'LOW_BALANCE',
        level: 1,
        message: `余额低于提醒阈值 ${reminderThreshold.toFixed(2)}`,
      });
      await manager.save(event);
      await this.createNotification(account.student.user.id, '余额不足提醒', `账户余额低于 ${reminderThreshold.toFixed(2)} 元`, manager);
    }

    if (oldBalance >= dangerThreshold && newBalance < dangerThreshold) {
      const event = this.riskEventsRepository.create({
        account,
        student: account.student,
        type: 'DANGER_BALANCE',
        level: 2,
        message: `余额低于危急阈值 ${dangerThreshold.toFixed(2)}`,
      });
      await manager.save(event);
      await this.createNotification(account.student.user.id, '余额危急', `账户余额低于 ${dangerThreshold.toFixed(2)} 元`, manager);
    }
  }

  private async createNotification(userId: number, title: string, content: string, manager: EntityManager) {
    const notification = this.notificationsRepository.create({ user: { id: userId } as any, title, content });
    await manager.save(notification);
  }
}
