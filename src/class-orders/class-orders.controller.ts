import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { CreateClassGroupOrderDto } from './dto/create-class-group-order.dto';
import { ClassOrdersService } from './class-orders.service';
import { SimpleAuthGuard } from '../common/simple-auth.guard';
import { Request } from 'express';

type AuthedRequest = Request & { user?: any };

@Controller('class-group-orders')
@UseGuards(SimpleAuthGuard)
export class ClassOrdersController {
  constructor(private readonly classOrdersService: ClassOrdersService) {}

  @Post()
  async create(@Body() dto: CreateClassGroupOrderDto, @Req() req: AuthedRequest) {
    const operatorId = Number((req as any).user?.id);
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip;
    return this.classOrdersService.createGroupOrder(operatorId, dto, ip);
  }
}
