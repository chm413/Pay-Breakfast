import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CreateRechargeRequestDto } from './dto/create-recharge-request.dto';
import { ReviewRechargeRequestDto } from './dto/review-recharge-request.dto';
import { RechargeService } from './recharge.service';
import { SimpleAuthGuard } from '../common/simple-auth.guard';
import { RecentVerificationGuard } from '../common/recent-verification.guard';
import { Request } from 'express';

type AuthedRequest = Request & { user?: any };

@Controller('recharge-requests')
@UseGuards(SimpleAuthGuard)
export class RechargeController {
  constructor(private readonly rechargeService: RechargeService) {}

  @Get()
  list(@Query('status') status?: string) {
    return this.rechargeService.listRequests(status);
  }

  @Post()
  create(@Body() dto: CreateRechargeRequestDto, @Req() req: AuthedRequest) {
    const userId = Number((req as any).user?.id);
    return this.rechargeService.createRequest(userId, dto);
  }

  @Post(':id/review')
  @UseGuards(RecentVerificationGuard)
  review(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewRechargeRequestDto,
    @Req() req: AuthedRequest,
    @Query('confirm') confirm?: string,
  ) {
    if (confirm !== 'true') {
      throw new BadRequestException({ code: 'CONFIRM_REQUIRED', message: '请二次确认后再审核充值申请' });
    }
    const reviewerId = Number((req as any).user?.id);
    return this.rechargeService.reviewRequest(id, reviewerId, dto);
  }
}
