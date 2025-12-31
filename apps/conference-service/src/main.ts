import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConferenceServiceModule } from './conference-service.module';

async function bootstrap() {
  const app = await NestFactory.create(ConferenceServiceModule);
  app.setGlobalPrefix('api');
<<<<<<< HEAD
=======

  // ValidationPipe toàn cục
>>>>>>> origin/develop-new
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
<<<<<<< HEAD
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
=======
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
>>>>>>> origin/develop-new
}
bootstrap();
