import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { SimpleAuthGuard } from '../common/simple-auth.guard';

@Controller('admin/announcements')
@UseGuards(SimpleAuthGuard)
export class AdminAnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}

  @Get()
  list(@Req() req: any) {
    return this.service.listAdmin(req);
  }

  @Post()
  create(@Req() req: any, @Body() body: any) {
    return this.service.create(req, body);
  }

  @Put(':id')
  update(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.update(req, id, body);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(req, id);
  }
}
