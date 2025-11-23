import { Body, Controller, Delete, ForbiddenException, Get, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { SimpleAuthGuard } from '../common/simple-auth.guard';
import { BreakfastService } from './breakfast.service';

function ensureAdminOrManager(req: any) {
  const roles: string[] = req.user?.roles || [];
  if (!roles.includes('SUPER_ADMIN') && !roles.includes('ADMIN') && !roles.includes('MANAGER') && !roles.includes('GRADE_ADMIN')) {
    throw new ForbiddenException({ code: 'NO_PERMISSION', message: '你无权访问该资源' });
  }
}

@Controller('admin')
@UseGuards(SimpleAuthGuard)
export class AdminBreakfastController {
  constructor(private readonly breakfastService: BreakfastService) {}

  @Get('categories')
  async listCategories() {
    return this.breakfastService.listCategories();
  }

  @Post('categories')
  async createCategory(@Body() body: any, @Param() _params: any, @Query() _query: any, @Req() req: any) {
    ensureAdminOrManager((req as any) || {});
    const payload = { name: body.name, sortOrder: body.sortOrder ?? 0, enabled: body.enabled ?? true };
    return this.breakfastService.createCategory(payload);
  }

  @Put('categories/:id')
  async updateCategory(@Param('id', ParseIntPipe) id: number, @Body() body: any, @Req() req: any) {
    ensureAdminOrManager(req);
    return this.breakfastService.updateCategory(id, body);
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    ensureAdminOrManager(req);
    return this.breakfastService.disableCategory(id);
  }

  @Get('products')
  async listProducts(@Query('categoryId') categoryId?: string, @Query('enabled') enabled?: string) {
    return this.breakfastService.listProducts({
      categoryId: categoryId ? Number(categoryId) : undefined,
      enabled: enabled !== undefined ? enabled !== '0' && enabled !== 'false' : undefined,
    });
  }

  @Post('products')
  async createProduct(@Body() body: any, @Req() req: any) {
    ensureAdminOrManager(req);
    return this.breakfastService.createProduct(body);
  }

  @Put('products/:id')
  async updateProduct(@Param('id', ParseIntPipe) id: number, @Body() body: any, @Req() req: any) {
    ensureAdminOrManager(req);
    return this.breakfastService.updateProduct(id, body);
  }

  @Delete('products/:id')
  async deleteProduct(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    ensureAdminOrManager(req);
    return this.breakfastService.disableProduct(id);
  }
}
