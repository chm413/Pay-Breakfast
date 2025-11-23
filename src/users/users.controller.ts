import { Body, Controller, Get, Param, ParseIntPipe, Put, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SimpleAuthGuard } from '../common/simple-auth.guard';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.entity';

@Controller('users')
@UseGuards(SimpleAuthGuard)
export class UsersController {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRolesRepository: Repository<UserRole>,
  ) {}

  @Get()
  async list() {
    const users = await this.usersRepository.find({ relations: ['roles', 'roles.role'] });
    return users.map((u) => ({
      id: u.id,
      username: u.username,
      realName: u.realName,
      email: u.email,
      status: u.status,
      roles: (u.roles || []).map((link) => link.role.code),
    }));
  }

  @Put(':id')
  async updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: number) {
    await this.usersRepository.update({ id }, { status });
    return { id, status };
  }
}
