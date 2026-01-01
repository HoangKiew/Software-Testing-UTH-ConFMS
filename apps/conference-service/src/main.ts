// apps/conference-service/src/main.ts (hoặc src/main.ts tùy cấu trúc của bạn)

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; // ← THÊM IMPORT
import { ConferenceServiceModule } from './conference-service.module';

async function bootstrap() {
  const app = await NestFactory.create(ConferenceServiceModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // ValidationPipe toàn cục
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // ================== THÊM PHẦN SWAGGER ==================
  const config = new DocumentBuilder()
    .setTitle('Conference Service - UTH ConfMS')
    .setDescription(
      'Quản lý hội nghị khoa học: tạo hội nghị, mời PC Member, phân công bài báo, gợi ý AI, ra quyết định, báo cáo, proceedings...'
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Nhập JWT access token (lấy từ /api/auth/login)',
        in: 'header',
      },
      'JWT-auth', // tên này sẽ dùng ở @ApiBearerAuth nếu bạn thêm sau này
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); // Truy cập tại: http://localhost:3002/api/docs
  // ========================================================

  await app.listen(process.env.PORT ?? 3002);

  console.log(`Conference Service is running on http://localhost:3002`);
  console.log(`Swagger documentation: http://localhost:3002/api/docs`);
}
bootstrap();