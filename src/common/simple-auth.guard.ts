import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { extractUserFromRequest } from './jwt.util';

@Injectable()
export class SimpleAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = extractUserFromRequest(req);
    req.user = user;
    return true;
  }
}
