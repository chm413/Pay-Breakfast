import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
  ) {}

  async listUserNotifications(userId: number): Promise<Notification[]> {
    return this.notificationsRepository.find({ where: { user: { id: userId } }, order: { createdAt: 'DESC' } });
  }

  async createNotification(userId: number, title: string, content: string) {
    const notification = this.notificationsRepository.create({ user: { id: userId } as any, title, content });
    return this.notificationsRepository.save(notification);
  }
}
