import { NestFactory } from '@nestjs/core';
import { IdentityServiceModule } from './identity-service.module';
import { ValidationPipe } from '@nestjs/common';
import { webcrypto, randomUUID } from 'crypto';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const g: any = global as any;
  if (typeof g.crypto === 'undefined') {
    g.crypto = webcrypto;
  }
  if (g.crypto && !g.crypto.randomUUID) {
    g.crypto.randomUUID = randomUUID;
  }

  const app = await NestFactory.create(IdentityServiceModule);
  
  app.enableCors({
    origin: true, 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });
  
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
    .setTitle('UTH-ConfMS Identity Service')
    .setDescription('Identity Service API: Xác thực & Quản lý người dùng')
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

  await app.listen(process.env.port ?? 3001);
  console.log(`[Identity-Service] Application is running on: http://localhost:${process.env.port ?? 3001}/api`);
  console.log(`[Identity-Service] Swagger documentation: http://localhost:${process.env.port ?? 3001}/api/docs`);
}
bootstrap();
