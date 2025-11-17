import { Body, Controller, Headers, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CreateRechargeRequestDto } from './dto/create-recharge-request.dto';
import { ReviewRechargeRequestDto } from './dto/review-recharge-request.dto';
import { RechargeService } from './recharge.service';

@Controller('recharge-requests')
export class RechargeController {
  constructor(private readonly rechargeService: RechargeService) {}

  @Post()
  create(@Body() dto: CreateRechargeRequestDto, @Headers('x-user-id') userId: string) {
    return this.rechargeService.createRequest(Number(userId), dto);
  }

  @Post(':id/review')
  review(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewRechargeRequestDto,
    @Headers('x-user-id') reviewerId: string,
  ) {
    return this.rechargeService.reviewRequest(id, Number(reviewerId), dto);
  }
}
