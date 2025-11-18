import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountsService } from '../accounts/accounts.service';
import { RechargeRequest, Student, User } from '../entities';
import { CreateRechargeRequestDto } from './dto/create-recharge-request.dto';
import { ReviewRechargeRequestDto } from './dto/review-recharge-request.dto';

@Injectable()
export class RechargeService {
  constructor(
    @InjectRepository(RechargeRequest)
    private readonly rechargeRequestsRepository: Repository<RechargeRequest>,
    @InjectRepository(Student)
    private readonly studentsRepository: Repository<Student>,
    private readonly accountsService: AccountsService,
  ) {}

  async createRequest(userId: number, dto: CreateRechargeRequestDto) {
    const request = this.rechargeRequestsRepository.create({
      account: { id: dto.accountId } as any,
      student: dto.studentId ? ({ id: dto.studentId } as Student) : undefined,
      amount: dto.amount.toFixed(2),
      payMethod: dto.payMethod,
      voucherImageUrl: dto.voucherImageUrl,
      status: 'pending',
    });
    const saved = await this.rechargeRequestsRepository.save(request);
    return { id: saved.id, status: saved.status };
  }

  async reviewRequest(requestId: number, reviewerId: number, dto: ReviewRechargeRequestDto) {
    const request = await this.rechargeRequestsRepository.findOne({
      where: { id: requestId },
      relations: ['account', 'student'],
    });
    if (!request || request.status !== 'pending') {
      throw new NotFoundException('Recharge request not found or already reviewed');
    }

    if (dto.approve) {
      const rechargeResult = await this.accountsService.recharge(
        request.account.id,
        Number(request.amount),
        { type: 'RECHARGE_APPROVAL', id: request.id },
        reviewerId,
      );
      request.status = 'approved';
      request.reviewTime = new Date();
      request.reviewComment = dto.comment;
      request.reviewer = { id: reviewerId } as User;
      await this.rechargeRequestsRepository.save(request);
      return { ...rechargeResult, status: request.status };
    }

    request.status = 'rejected';
    request.reviewComment = dto.comment;
    request.reviewTime = new Date();
    request.reviewer = { id: reviewerId } as User;
    await this.rechargeRequestsRepository.save(request);
    return { status: request.status, reviewComment: request.reviewComment };
  }
}
