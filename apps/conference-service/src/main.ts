// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConferenceServiceModule } from './conference-service.module';

async function bootstrap() {
  const app = await NestFactory.create(ConferenceServiceModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS
  app.enableCors();

  // ✅ Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Conference Service API')
    .setDescription('API for managing conferences, deadlines, and conference-related operations')
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

  await app.listen(process.env.PORT ?? 3002);
  console.log('🚀 Conference Service running on http://localhost:3002');
  console.log('📚 Swagger UI: http://localhost:3002/api/docs');
}
bootstrap();