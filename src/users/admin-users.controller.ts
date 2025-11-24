import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Between, Repository } from 'typeorm';
import { AccountsService } from '../accounts/accounts.service';
import { SimpleAuthGuard } from '../common/simple-auth.guard';
import { assertAuthenticated } from '../common/jwt.util';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import { User } from '../entities/user.entity';
import { Transaction } from '../entities/transaction.entity';

function ensureAdmin(req: any) {
  assertAuthenticated(req?.user);
  const roles: string[] = req.user?.roles || [];
  if (!roles.includes('SUPER_ADMIN') && !roles.includes('ADMIN') && !roles.includes('MANAGER') && !roles.includes('GRADE_ADMIN')) {
    throw new ForbiddenException({ code: 'NO_PERMISSION', message: '你无权访问该资源' });
  }
}

@Controller('admin/users')
@UseGuards(SimpleAuthGuard)
export class AdminUsersController {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRolesRepository: Repository<UserRole>,
    private readonly accountsService: AccountsService,
  ) {}

  @Get()
  async list(@Req() req: any) {
    ensureAdmin(req);
    try {
      const users = await this.usersRepository.find({
        relations: ['roles', 'roles.role'],
        order: { createdAt: 'DESC' },
      });

      const enriched = await Promise.all(
        users.map(async (user) => {
          const account = await this.accountsService.getOrCreatePersonalAccountForUser(user.id);
          return {
            id: user.id,
            username: user.username,
            realName: user.realName,
            classOrDorm: user.classOrDorm,
            email: user.email,
            qq: user.qq,
            status: user.status,
            roles: (user.roles || []).map((r) => r.role?.code).filter(Boolean),
            balance: Number(account?.balance ?? 0),
            creditLimit: Number(account?.creditLimit ?? 0),
            createdAt: user.createdAt,
          };
        }),
      );
      return enriched;
    } catch (error) {
      throw new InternalServerErrorException({ code: 'ADMIN_USERS_LIST_FAILED', message: (error as Error).message });
    }
  }

  @Post()
  async createUser(@Body() body: any, @Req() req: any) {
    ensureAdmin(req);
    try {
      const existing = await this.usersRepository.findOne({ where: { username: body.username } });
      if (existing) {
        return { code: 'USERNAME_EXISTS', message: '用户名已存在' };
      }
      const password = this.randomPassword();
      const passwordHash = await bcrypt.hash(password, 10);
      const user = this.usersRepository.create({
        username: body.username,
        realName: body.realName,
        email: body.email,
        qq: body.qq,
        passwordHash,
        classOrDorm: body.classOrDorm,
        status: 1,
      });
      const savedUser = await this.usersRepository.save(user);

      const roleCode = body.role || 'MEMBER';
      let role = await this.rolesRepository.findOne({ where: { code: roleCode } });
      if (!role) {
        role = this.rolesRepository.create({ code: roleCode, name: roleCode });
        role = await this.rolesRepository.save(role);
      }
      const link = this.userRolesRepository.create({ user: savedUser, role });
      await this.userRolesRepository.save(link);

      await this.accountsService.getOrCreatePersonalAccountForUser(savedUser.id);
      if (body.initialBalance !== undefined || body.creditLimit !== undefined) {
        const account = await this.accountsService.getOrCreatePersonalAccountForUser(savedUser.id);
        if (body.initialBalance !== undefined) account.balance = Number(body.initialBalance || 0).toFixed(2);
        if (body.creditLimit !== undefined) account.creditLimit = Number(body.creditLimit || 0).toFixed(2);
        await this.usersRepository.manager.save(account);
      }

      return { userId: savedUser.id, initialPassword: password };
    } catch (error) {
      throw new InternalServerErrorException({ code: 'ADMIN_USER_CREATE_FAILED', message: (error as Error).message });
    }
  }

  private randomPassword() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789';
    return Array.from({ length: 10 })
      .map(() => alphabet.charAt(Math.floor(Math.random() * alphabet.length)))
      .join('');
  }

  @Put(':id')
  async updateUser(@Param('id', ParseIntPipe) id: number, @Body() body: any, @Req() req: any) {
    ensureAdmin(req);
    try {
      const statusValue =
        body.enabled !== undefined ? (body.enabled ? 1 : 0) : body.status !== undefined ? Number(body.status) : undefined;
      await this.usersRepository.update(
        { id },
        {
          realName: body.realName,
          classOrDorm: body.classOrDorm,
          email: body.email,
          qq: body.qq,
          status: statusValue,
        },
      );

      if (body.role) {
        let role = await this.rolesRepository.findOne({ where: { code: body.role } });
        if (!role) {
          role = await this.rolesRepository.save(this.rolesRepository.create({ code: body.role, name: body.role }));
        }
        const links = await this.userRolesRepository.find({ where: { user: { id } } });
        await this.userRolesRepository.remove(links);
        const link = this.userRolesRepository.create({ user: { id } as any, role });
        await this.userRolesRepository.save(link);
      }
      return { id };
    } catch (error) {
      throw new InternalServerErrorException({ code: 'ADMIN_USER_UPDATE_FAILED', message: (error as Error).message });
    }
  }

  @Put(':id/password')
  async updatePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body('newPassword') newPassword: string,
    @Req() req: any,
  ) {
    ensureAdmin(req);
    try {
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await this.usersRepository.update({ id }, { passwordHash });
      return { id };
    } catch (error) {
      throw new InternalServerErrorException({ code: 'ADMIN_USER_PASSWORD_UPDATE_FAILED', message: (error as Error).message });
    }
  }

  @Delete(':id')
  async softDelete(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    ensureAdmin(req);
    try {
      await this.usersRepository.update({ id }, { status: 0 });
      return { id, status: 'disabled' };
    } catch (error) {
      throw new InternalServerErrorException({ code: 'ADMIN_USER_DELETE_FAILED', message: (error as Error).message });
    }
  }

  @Get(':id/transactions')
  async listTransactions(
    @Param('id', ParseIntPipe) id: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Req() req?: any,
  ) {
    ensureAdmin(req);
    try {
      const user = await this.usersRepository.findOne({ where: { id } });
      if (!user) throw new NotFoundException('User not found');
      const account = await this.accountsService.getOrCreatePersonalAccountForUser(id);
      const where: any = { account: { id: account.id } };
      if (from && to) {
        where.createdAt = Between(new Date(from), new Date(to));
      }
      return this.userRolesRepository.manager.getRepository(Transaction).find({
        where,
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      throw new InternalServerErrorException({ code: 'ADMIN_USER_TRANSACTIONS_FAILED', message: (error as Error).message });
    }
  }

  @Post(':id/transactions')
  async createTransaction(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @Req() req: any,
  ) {
    ensureAdmin(req);
    try {
      const account = await this.accountsService.getOrCreatePersonalAccountForUser(id);
      const direction = body.type === 'CONSUME' ? -1 : 1;
      const txRepo = this.userRolesRepository.manager.getRepository(Transaction);
      const tx = txRepo.create({
        account,
        type: body.type || 'ADJUST',
        direction,
        amount: Number(body.amount || 0).toFixed(2),
        balanceAfter: account.balance,
        description: body.remark,
        sourceType: 'ADMIN_MANUAL',
        operatorUserId: req.user?.id,
      });
      await txRepo.save(tx);
      const recalculated = await this.accountsService.recalculateAccountBalance(account.id);
      tx.balanceAfter = String(recalculated.balance);
      await txRepo.save(tx);
      return tx;
    } catch (error) {
      throw new InternalServerErrorException({ code: 'ADMIN_USER_TRANSACTION_CREATE_FAILED', message: (error as Error).message });
    }
  }

  @Put('/transactions/:txId')
  async updateTransaction(@Param('txId', ParseIntPipe) txId: number, @Body() body: any, @Req() req: any) {
    ensureAdmin(req);
    try {
      const txRepo = this.userRolesRepository.manager.getRepository(Transaction);
      const existing = await txRepo.findOne({ where: { id: txId }, relations: ['account'] });
      if (!existing) throw new NotFoundException('Transaction not found');
      existing.amount = Number(body.amount ?? existing.amount).toFixed(2) as any;
      existing.type = body.type || existing.type;
      existing.direction = existing.type === 'CONSUME' ? -1 : 1;
      existing.description = body.remark ?? existing.description;
      await txRepo.save(existing);
      const recalculated = await this.accountsService.recalculateAccountBalance(existing.account.id);
      existing.balanceAfter = String(recalculated.balance);
      await txRepo.save(existing);
      return existing;
    } catch (error) {
      throw new InternalServerErrorException({ code: 'ADMIN_USER_TRANSACTION_UPDATE_FAILED', message: (error as Error).message });
    }
  }

  @Delete('/transactions/:txId')
  async deleteTransaction(@Param('txId', ParseIntPipe) txId: number, @Req() req: any) {
    ensureAdmin(req);
    try {
      const txRepo = this.userRolesRepository.manager.getRepository(Transaction);
      const existing = await txRepo.findOne({ where: { id: txId }, relations: ['account'] });
      if (!existing) throw new NotFoundException('Transaction not found');
      await txRepo.delete({ id: txId });
      await this.accountsService.recalculateAccountBalance(existing.account.id);
      return { id: txId, status: 'deleted' };
    } catch (error) {
      throw new InternalServerErrorException({ code: 'ADMIN_USER_TRANSACTION_DELETE_FAILED', message: (error as Error).message });
    }
  }
}
