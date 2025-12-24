import { NestFactory } from '@nestjs/core';
import { ReviewServiceModule } from './review-service.module';

async function bootstrap() {
  const app = await NestFactory.create(ReviewServiceModule);
  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT || 3004);
}
bootstrap();