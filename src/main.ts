import { NestFactory } from '@nestjs/core';
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
