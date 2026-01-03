// src/main.ts (Update để fix crypto error)
import { NestFactory } from '@nestjs/core';
import { ReviewServiceModule } from './review-service.module';
import { webcrypto, randomUUID } from 'crypto';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

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

  const config = new DocumentBuilder()
    .setTitle('UTH-ConfMS Review Service')
    .setDescription('Review Service API (Reviewer & PC)')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3004;
  await app.listen(port as any);
  console.log(`[Review-Service] Application is running on: http://localhost:${port}/api`);
  console.log(`[Review-Service] Swagger documentation: http://localhost:${port}/api/docs`);
}

bootstrap();