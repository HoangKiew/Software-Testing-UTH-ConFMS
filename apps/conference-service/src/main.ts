import { NestFactory } from '@nestjs/core';
import { ConferenceServiceModule } from './conference-service.module';

async function bootstrap() {
  const app = await NestFactory.create(ConferenceServiceModule);
  app.setGlobalPrefix('api');
  await app.listen(process.env.port ?? 3002);
}
bootstrap();
