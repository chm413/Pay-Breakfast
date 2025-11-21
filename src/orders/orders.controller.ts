import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { SimpleAuthGuard } from '../common/simple-auth.guard';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(SimpleAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createPersonalOrder(@Body() body: any, @Req() req: any) {
    const user = req.user;
    return this.ordersService.createPersonalOrder(user.id, { items: body.items || [], remark: body.remark });
  }
}
