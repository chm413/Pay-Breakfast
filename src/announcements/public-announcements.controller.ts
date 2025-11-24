import { Controller, Get } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';

@Controller('announcements')
export class PublicAnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}

  @Get('login-popups')
  loginPopups() {
    return this.service.listForLogin();
  }

  @Get('public')
  listPublic() {
    return this.service.listPublic();
  }
}
