import { NestFactory } from '@nestjs/core';
import { IdentityServiceModule } from './identity-service.module';

async function bootstrap() {
  const app = await NestFactory.create(IdentityServiceModule);
  app.setGlobalPrefix('api');
  await app.listen(process.env.port ?? 3001);
}
bootstrap();
