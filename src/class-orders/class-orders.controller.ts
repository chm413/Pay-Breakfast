import { Body, Controller, Headers, Post } from '@nestjs/common';
import { CreateClassGroupOrderDto } from './dto/create-class-group-order.dto';
import { ClassOrdersService } from './class-orders.service';

@Controller('class-group-orders')
export class ClassOrdersController {
  constructor(private readonly classOrdersService: ClassOrdersService) {}

  @Post()
  async create(@Body() dto: CreateClassGroupOrderDto, @Headers('x-user-id') userId: string, @Headers('x-forwarded-for') ip?: string) {
    const operatorId = Number(userId);
    return this.classOrdersService.createGroupOrder(operatorId, dto, ip);
  }
}
