import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateRechargeRequestDto {
  @IsNumber()
  accountId!: number;

  @IsOptional()
  @IsNumber()
  studentId?: number;

  @IsNumber()
  amount!: number;

  @IsString()
  payMethod!: string;

  @IsOptional()
  @IsString()
  voucherImageUrl?: string;
}
