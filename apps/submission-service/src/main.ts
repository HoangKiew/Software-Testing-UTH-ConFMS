import { NestFactory } from '@nestjs/core';
import { SubmissionServiceModule } from './submission-service.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(SubmissionServiceModule);
  app.setGlobalPrefix('api');

  // Swagger UI Configuration
  const config = new DocumentBuilder()
    .setTitle('Submission Service API')
    .setDescription('UTH-ConfMS Submission Service - Paper submission and management')
    .setVersion('1.0')
    .addTag('submissions', 'Submission operations')
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

  await app.listen(process.env.port ?? 3003);
  console.log(`🚀 Submission Service running on http://localhost:3003`);
  console.log(`📚 Swagger UI available at http://localhost:3003/api/docs`);
}
bootstrap();
