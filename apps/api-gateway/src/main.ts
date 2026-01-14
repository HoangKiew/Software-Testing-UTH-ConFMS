import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import { createProxyMiddleware } from 'http-proxy-middleware';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'Content-Type'],
  });

  const isDocker =
    process.env.DOCKER_ENV === 'true' ||
    process.env.IDENTITY_SERVICE_URL?.includes('identity-service');
  const identityServiceUrl =
    process.env.IDENTITY_SERVICE_URL ||
    (isDocker ? 'http://identity-service:3001' : 'http://localhost:3001');
  const conferenceServiceUrl =
    process.env.CONFERENCE_SERVICE_URL ||
    (isDocker ? 'http://conference-service:3002' : 'http://localhost:3002');
  const submissionServiceUrl =
    process.env.SUBMISSION_SERVICE_URL ||
    (isDocker ? 'http://submission-service:3003' : 'http://localhost:3003');
  const reviewServiceUrl =
    process.env.REVIEW_SERVICE_URL ||
    (isDocker ? 'http://review-service:3000' : 'http://localhost:3004');

  const proxyOptions = {
    changeOrigin: true,
    onProxyReq: (proxyReq: any, req: any) => {
      if (req.headers.origin) proxyReq.setHeader('Origin', req.headers.origin);
    },
    onProxyRes: (proxyRes: any, req: any) => {
      proxyRes.headers['Access-Control-Allow-Origin'] = req.headers.origin || '*';
      proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
    },
    onError: (err: any, req: any, res: any) => {
      console.error('Proxy error:', err);
      res.status(500).json({ message: 'Proxy error', error: err.message });
    },
  };

  // Identity Service: giữ prefix /api khi forward (đúng với globalPrefix của service)
  app.use(
    '/api/users',
    createProxyMiddleware({
      target: identityServiceUrl,
      // Mount '/api/users' làm req.url còn '/profile' hoặc '/?role=REVIEWER' → prepend lại '/api/users'
      pathRewrite: (path) => (path === '/' ? '/api/users' : '/api/users' + path),
      ...proxyOptions,
    }),
  );

  app.use(
    '/api/auth',
    createProxyMiddleware({
      target: identityServiceUrl,
      // Mount '/api/auth' làm req.url còn '/login' → prepend lại '/api/auth'
      pathRewrite: (path) => (path === '/' ? '/api/auth' : '/api/auth' + path),
      ...proxyOptions,
    }),
  );

  // Conference Service
  app.use(
    '/api/conferences',
    createProxyMiddleware({
      target: conferenceServiceUrl,
      pathRewrite: (path) =>
        path.startsWith('/api/conferences') ? path : '/api/conferences' + path,
      ...proxyOptions,
    }),
  );

  // Reviewers → forward sang Identity Service: /api/users?role=REVIEWER
  app.use(
    '/api/reviewers',
    createProxyMiddleware({
      target: identityServiceUrl,
      // root reviewers list
      pathRewrite: () => '/api/users?role=REVIEWER',
      ...proxyOptions,
    }),
  );

  // Invitations
  app.use(
    '/api/invitations',
    createProxyMiddleware({
      target: conferenceServiceUrl,
      pathRewrite: (path) => (path === '/' ? '/api/invitations' : '/api/invitations' + path),
      ...proxyOptions,
    }),
  );

  // Assignments
  app.use(
    '/api/assignments',
    createProxyMiddleware({
      target: conferenceServiceUrl,
      pathRewrite: (path) => (path === '/' ? '/api/assignments' : '/api/assignments' + path),
      ...proxyOptions,
    }),
  );

  // Review Service: bỏ tiền tố /api/reviews → gốc (/health, /profile,…)
  app.use(
    '/api/reviews',
    createProxyMiddleware({
      target: reviewServiceUrl,
      pathRewrite: { '^/api/reviews(.*)': '$1' },
      ...proxyOptions,
    }),
  );

  await app.listen(3000);
  console.log('Gateway is running on http://localhost:3000');
}
bootstrap();