import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RecheckPasswordDto {
  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsOptional()
  @IsBoolean()
  encrypted?: boolean;
}
