import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { extractUserFromRequest } from './jwt.util';

@Injectable()
export class RecentVerificationGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = extractUserFromRequest(req);
    req.user = user;

    if (!this.authService.hasRecentVerification(user.id)) {
      throw new ForbiddenException({ code: 'RECENT_VERIFY_REQUIRED', message: '请先完成敏感操作二次校验' });
    }

    return true;
  }
}
