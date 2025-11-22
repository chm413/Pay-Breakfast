import { Controller, Get, Post, Body, Req, UseGuards, Param, ParseIntPipe, Put, Delete, Query } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { SimpleAuthGuard } from '../common/simple-auth.guard';

@Controller()
@UseGuards(SimpleAuthGuard)
export class VendorsController {
  constructor(private readonly service: VendorsService) {}

  @Get('admin/vendors')
  list(@Req() req: any) {
    return this.service.list(req);
  }

  @Post('admin/vendors')
  create(@Req() req: any, @Body() body: any) {
    return this.service.create(req, body);
  }

  @Put('admin/vendors/:id')
  update(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.update(req, id, body);
  }

  @Delete('admin/vendors/:id')
  remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(req, id);
  }

  @Get('admin/vendors/:id/summary')
  summary(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.summary(req, id);
  }

  @Get('admin/vendors/:id/settlements')
  settlements(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.settlements(req, id, from, to);
  }

  @Post('admin/vendors/settlements/run')
  runSettlement(@Body('date') date: string) {
    return this.service.runDailySettlement(date);
  }
}
