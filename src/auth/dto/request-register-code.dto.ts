import { IsEmail } from 'class-validator';

export class RequestRegisterCodeDto {
  @IsEmail()
  email!: string;
}
