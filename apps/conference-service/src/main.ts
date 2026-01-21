import { NestFactory } from '@nestjs/core';
import { ConferenceServiceModule } from './conference-service.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

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

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('UTH-ConfMS Conference Service')
    .setDescription('Hệ thống quản lý bài báo hội nghị nghiên cứu khoa học cho Đại học UTH (UTH-ConfMS) - Conference Service: Quản lý Hội nghị, Track, CFP, Templates & Thông báo')
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

  const port = process.env.PORT || process.env.port || 3002;
  await app.listen(port, '0.0.0.0');
  console.log(`[Conference-Service] Running on http://0.0.0.0:${port}`);
  console.log(`[Conference-Service] Swagger documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
