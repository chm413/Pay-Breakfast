import { IsEmail, IsIn, IsOptional } from 'class-validator';

export class RequestResetDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsIn(['RESET_PWD', 'REGISTER'])
  purpose?: 'RESET_PWD' | 'REGISTER';
}
