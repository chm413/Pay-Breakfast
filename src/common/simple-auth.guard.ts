import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { extractUserFromRequest } from './jwt.util';

@Injectable()
export class SimpleAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = extractUserFromRequest(req, { allowMissing: true });
    if (!user) {
      throw new UnauthorizedException('缺少鉴权信息');
    }
    req.user = user;
    return true;
  }
}
