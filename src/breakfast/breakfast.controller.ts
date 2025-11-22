import { Controller, Get, Query } from '@nestjs/common';
import { BreakfastService } from './breakfast.service';

@Controller()
export class BreakfastController {
  constructor(private readonly breakfastService: BreakfastService) {}

  @Get('products')
  async listProducts(@Query('categoryId') categoryId?: string, @Query('enabled') enabled?: string) {
    return this.breakfastService.listProducts({
      categoryId: categoryId ? Number(categoryId) : undefined,
      enabled: enabled !== undefined ? enabled !== '0' && enabled !== 'false' : true,
    });
  }
}
