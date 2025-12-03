import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import { createProxyMiddleware } from 'http-proxy-middleware';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);

  // 1. Chuyển hướng request /api/users -> Identity Service (3001)
  app.use(
    '/api/users',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
    }),
  );
  
  // 2. Chuyển hướng request /api/auth -> Identity Service (3001)
  app.use(
    '/api/auth',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
    }),
  );

  // 3. Chuyển hướng Conference (3002)
  app.use(
    '/api/conferences',
    createProxyMiddleware({
      target: 'http://localhost:3002',
      changeOrigin: true,
    }),
  );

  // 4. Chuyển hướng Submission (3003)
  app.use(
    '/api/submissions',
    createProxyMiddleware({
      target: 'http://localhost:3003',
      changeOrigin: true,
    }),
  );

  // 5. Chuyển hướng Review (3004)
  app.use(
    '/api/reviews',
    createProxyMiddleware({
      target: 'http://localhost:3004',
      changeOrigin: true,
    }),
  );

  // Bật CORS để Frontend (Port khác) gọi được vào
  app.enableCors();

  await app.listen(3000); // Gateway chạy ở cổng 3000
  console.log('Gateway is running on http://localhost:3000');
}
bootstrap();