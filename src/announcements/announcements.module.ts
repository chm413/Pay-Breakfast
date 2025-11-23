import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Announcement, User } from '../entities';
import { AnnouncementsService } from './announcements.service';
import { AdminAnnouncementsController } from './admin-announcements.controller';
import { PublicAnnouncementsController } from './public-announcements.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Announcement, User])],
  controllers: [AdminAnnouncementsController, PublicAnnouncementsController],
  providers: [AnnouncementsService],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
