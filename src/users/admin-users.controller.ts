import { Body, Controller, ForbiddenException, Post, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { AccountsService } from '../accounts/accounts.service';
import { SimpleAuthGuard } from '../common/simple-auth.guard';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import { User } from '../entities/user.entity';

function ensureAdmin(req: any) {
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

  @Post()
  async createUser(@Body() body: any, req: any) {
    ensureAdmin(req);
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
  }

  private randomPassword() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789';
    return Array.from({ length: 10 })
      .map(() => alphabet.charAt(Math.floor(Math.random() * alphabet.length)))
      .join('');
  }
}
