import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @IsNotEmpty()
  newPassword!: string;

  @IsOptional()
  @IsBoolean()
  encrypted?: boolean;
}
