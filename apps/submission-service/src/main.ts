import { NestFactory } from '@nestjs/core';
import { SubmissionServiceModule } from './submission-service.module';

async function bootstrap() {
  const app = await NestFactory.create(SubmissionServiceModule);
  app.setGlobalPrefix('api');
  await app.listen(process.env.port ?? 3003);
}
bootstrap();
