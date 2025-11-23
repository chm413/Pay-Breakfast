import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ReviewRechargeRequestDto {
  @IsBoolean()
  approve!: boolean;

  @IsOptional()
  @IsString()
  comment?: string;
}
