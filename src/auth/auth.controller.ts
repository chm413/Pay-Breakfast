import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestResetDto } from './dto/request-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RecheckPasswordDto } from './dto/recheck-password.dto';
import { SimpleAuthGuard } from '../common/simple-auth.guard';
import { Request } from 'express';
import { RequestRegisterCodeDto } from './dto/request-register-code.dto';
type AuthedRequest = Request & { user?: any };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('public-key')
  getPublicKey() {
    return { publicKey: this.authService.getPublicKey() };
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('register/request-code')
  requestRegisterCode(@Body() dto: RequestRegisterCodeDto) {
    return this.authService.requestRegisterCode(dto.email, dto.purpose || 'REGISTER');
  }

  @Post('request-reset')
  requestReset(@Body() dto: RequestResetDto) {
    return this.authService.requestReset(dto.email, dto.purpose || 'RESET_PWD');
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('recheck-password')
  @UseGuards(SimpleAuthGuard)
  recheckPassword(@Body() dto: RecheckPasswordDto, @Req() req: AuthedRequest) {
    const userId = Number((req as any).user?.id);
    return this.authService.recheckPassword(userId, dto.password, dto.encrypted);
  }
}
