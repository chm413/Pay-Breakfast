import { Body, Controller, ForbiddenException, Post, Req, UseGuards } from '@nestjs/common';
import { SimpleAuthGuard } from '../common/simple-auth.guard';
import { OrdersService } from './orders.service';

function ensureAdmin(req: any) {
  const roles: string[] = req.user?.roles || [];
  if (!roles.includes('SUPER_ADMIN') && !roles.includes('ADMIN') && !roles.includes('MANAGER') && !roles.includes('GRADE_ADMIN')) {
    throw new ForbiddenException({ code: 'NO_PERMISSION', message: '你无权访问该资源' });
  }
}

@Controller('admin')
@UseGuards(SimpleAuthGuard)
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('batch-orders')
  async createBatch(@Body() body: any, @Req() req: any) {
    ensureAdmin(req);
    return this.ordersService.createBatchOrder(req.user.id, body);
  }
}
