// src/main.ts (Update để fix crypto error)
import { NestFactory } from '@nestjs/core';
import { ReviewServiceModule } from './review-service.module';
import { webcrypto, randomUUID } from 'crypto';

const g: any = global as any;
if (typeof g.crypto === 'undefined') {
  g.crypto = webcrypto;
}
if (g.crypto && !g.crypto.randomUUID) {
  g.crypto.randomUUID = randomUUID;
}

async function bootstrap() {
  const app = await NestFactory.create(ReviewServiceModule);
  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT || 3004);
}
bootstrap();