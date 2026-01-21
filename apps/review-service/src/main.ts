import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ReviewServiceModule } from './review-service.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(ReviewServiceModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('UTH-ConfMS Review Service')
    .setDescription('Hệ thống quản lý bài báo hội nghị nghiên cứu khoa học cho Đại học UTH (UTH-ConfMS) - Review Service: Quản lý Đánh giá, Phân công, Bidding, Quyết định & Phản biện')
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

  const port = process.env.PORT || process.env.port || 3004;
  await app.listen(port, '0.0.0.0');
  console.log(`[Review-Service] Running on http://0.0.0.0:${port}`);
  console.log(`[Review-Service] Swagger documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
