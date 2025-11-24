import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement, User } from '../entities';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement) private readonly repo: Repository<Announcement>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  private ensureAdmin(req: any) {
    const roles: string[] = req.user?.roles || [];
    if (!roles.includes('ADMIN') && !roles.includes('SUPER_ADMIN') && !roles.includes('MANAGER')) {
      throw new ForbiddenException({ code: 'NO_PERMISSION', message: '你无权访问该资源' });
    }
  }

  async listForLogin(): Promise<Announcement[]> {
    return this.repo.find({ where: { enabled: true, showOnLogin: true }, order: { createdAt: 'DESC' }, take: 5 });
  }

  async listPublic(): Promise<Announcement[]> {
    return this.repo.find({ where: { enabled: true }, order: { createdAt: 'DESC' }, take: 50 });
  }

  async listAdmin(req: any) {
    this.ensureAdmin(req);
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async create(req: any, dto: Partial<Announcement>) {
    this.ensureAdmin(req);
    const creator = req.user?.id ? ({ id: req.user.id } as User) : undefined;
    const entity = this.repo.create({
      title: dto.title || '未命名公告',
      contentMd: dto.contentMd || '',
      showOnLogin: !!dto.showOnLogin,
      enabled: dto.enabled ?? true,
      creator,
    });
    return this.repo.save(entity);
  }

  async update(req: any, id: number, dto: Partial<Announcement>) {
    this.ensureAdmin(req);
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Announcement not found');
    Object.assign(existing, dto);
    return this.repo.save(existing);
  }

  async remove(req: any, id: number) {
    this.ensureAdmin(req);
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Announcement not found');
    existing.enabled = false;
    return this.repo.save(existing);
  }
}
