import { BadRequestException, Body, Controller, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CreateClassGroupOrderDto } from './dto/create-class-group-order.dto';
import { ClassOrdersService } from './class-orders.service';
import { SimpleAuthGuard } from '../common/simple-auth.guard';
import { Request } from 'express';
import { RecentVerificationGuard } from '../common/recent-verification.guard';

type AuthedRequest = Request & { user?: any };

@Controller('class-group-orders')
@UseGuards(SimpleAuthGuard, RecentVerificationGuard)
export class ClassOrdersController {
  constructor(private readonly classOrdersService: ClassOrdersService) {}

  @Post()
  async create(@Body() dto: CreateClassGroupOrderDto, @Req() req: AuthedRequest, @Query('confirm') confirm?: string) {
    if (confirm !== 'true') {
      throw new BadRequestException({ code: 'CONFIRM_REQUIRED', message: '请二次确认后再提交批量下单' });
    }
    const operatorId = Number((req as any).user?.id);
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip;
    return this.classOrdersService.createGroupOrder(operatorId, dto, ip);
  }
}
