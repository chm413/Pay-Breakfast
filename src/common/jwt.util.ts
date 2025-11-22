import { UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { Request } from 'express';

export interface AuthUser {
  id: number;
  username?: string;
  realName?: string;
  roles?: string[];
}

export function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'dev-secret';
}

export function extractUserFromRequest(req: Request): AuthUser {
  const header = req.headers.authorization || '';
  const [, token] = header.split(' ');
  if (!token) {
    throw new UnauthorizedException('缺少鉴权信息');
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as AuthUser;
    if (!payload || !payload.id) {
      throw new UnauthorizedException('无效的凭证');
    }
    return payload;
  } catch (error) {
    throw new UnauthorizedException('鉴权失败');
  }
}
