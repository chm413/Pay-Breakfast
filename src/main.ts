import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';

function readTimeoutEnv(key: string, fallback: number): number {
  const value = process.env[key];
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  const expressInstance = app.getHttpAdapter().getInstance?.();
  if (expressInstance?.set) {
    const trustProxy = process.env.TRUST_PROXY;
    if (trustProxy === 'false' || trustProxy === '0') {
      expressInstance.set('trust proxy', false);
    } else {
      // Default to trusting one proxy (e.g., Nginx/宝塔) so rate limiting can
      // correctly read the real client IP from X-Forwarded-For and avoid warnings.
      expressInstance.set('trust proxy', trustProxy ?? 1);
    }
  }

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 600,
      standardHeaders: true,
      legacyHeaders: false,
      message: '请求过于频繁，请稍后再试',
    }),
  );
  app.use(
    '/auth',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 20,
      standardHeaders: true,
      legacyHeaders: false,
      message: '鉴权请求过多，请稍后再试',
    }),
  );

  app.use((req: Request, res: Response, next: NextFunction) => {
    const raw = `${req.originalUrl} ${JSON.stringify(req.body || {})} ${JSON.stringify(req.query || {})}`.toLowerCase();
    const blocked = ['<script', '</script', 'select ', 'union ', '../'];
    if (blocked.some((keyword) => raw.includes(keyword))) {
      return res.status(400).send('非法请求已被拒绝');
    }
    next();
  });

  const server = app.getHttpAdapter().getHttpServer();
  if (server) {
    // 反向代理（Nginx/宝塔等）默认 keep-alive 超时时间较高，如果 Node 服务保持
    // 默认 5 秒会导致 "upstream prematurely closed connection" 报错并返回 502。
    // 这里设置更长的默认值，并允许通过环境变量覆盖（单位：毫秒）。
    server.keepAliveTimeout = readTimeoutEnv('HTTP_KEEP_ALIVE_TIMEOUT', 65_000);
    server.headersTimeout = readTimeoutEnv('HTTP_HEADERS_TIMEOUT', 66_000);
    server.requestTimeout = readTimeoutEnv('HTTP_REQUEST_TIMEOUT', 60_000);
  }

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Server started on port ${port}`);
}

bootstrap();
