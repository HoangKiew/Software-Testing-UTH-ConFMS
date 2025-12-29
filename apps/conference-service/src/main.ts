import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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
  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('Conference Service - UTH ConfMS')
    .setDescription('Conference Service API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  // Loại bỏ các route không muốn hiển thị trong Swagger UI (ví dụ route health root)
  if (document.paths && document.paths['/api']) {
    delete document.paths['/api'];
  }

  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
