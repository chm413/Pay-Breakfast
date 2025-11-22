import { IsEmail, IsIn, IsOptional } from 'class-validator';

export class RequestRegisterCodeDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsIn(['REGISTER', 'RESET_PWD'])
  purpose?: 'REGISTER' | 'RESET_PWD';
}
