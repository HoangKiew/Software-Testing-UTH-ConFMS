import { NestFactory } from '@nestjs/core';
import { ConferenceServiceModule } from './conference-service.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(ConferenceServiceModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );
  await app.listen(process.env.port ?? 3002);
}
bootstrap();
