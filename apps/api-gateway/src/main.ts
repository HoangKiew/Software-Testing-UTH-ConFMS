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

  const isDocker = process.env.DOCKER_ENV === 'true' || process.env.IDENTITY_SERVICE_URL?.includes('identity-service');
  const identityServiceUrl = process.env.IDENTITY_SERVICE_URL || 
    (isDocker ? 'http://identity-service:3001' : 'http://localhost:3001');
  const conferenceServiceUrl = process.env.CONFERENCE_SERVICE_URL || 
    (isDocker ? 'http://conference-service:3002' : 'http://localhost:3002');
  const submissionServiceUrl = process.env.SUBMISSION_SERVICE_URL || 
    (isDocker ? 'http://submission-service:3003' : 'http://localhost:3003');
  const reviewServiceUrl = process.env.REVIEW_SERVICE_URL || 
    (isDocker ? 'http://review-service:3004' : 'http://localhost:3004');

  // Get Express instance from NestJS
  const httpAdapter = app.getHttpAdapter();
  const expressApp = httpAdapter.getInstance();

  const proxyOptions = {
    changeOrigin: true,
    timeout: 30000, // 30 seconds timeout
    proxyTimeout: 30000,
    onProxyReq: (proxyReq: any, req: any, res: any) => {
      if (req.headers.origin) {
        proxyReq.setHeader('Origin', req.headers.origin);
      }
    },
    onProxyRes: (proxyRes: any, req: any, res: any) => {
      proxyRes.headers['Access-Control-Allow-Origin'] = req.headers.origin || '*';
      proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
    },
    onError: (err: any, req: any, res: any) => {
      console.error('Proxy error:', err);
      if (!res.headersSent) {
        if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
          res.status(502).json({ message: 'Service unavailable', error: err.message });
        } else {
          res.status(500).json({ message: 'Proxy error', error: err.message });
        }
      }
    },
  };

  expressApp.use(
    '/api/users',
    createProxyMiddleware({
      target: identityServiceUrl,
      pathRewrite: {
        '^(.*)': '/api/users$1',
      },
      ...proxyOptions,
    }),
  );
  expressApp.use(
    '/api/auth',
    createProxyMiddleware({
      target: identityServiceUrl,
      pathRewrite: {
        '^(.*)': '/api/auth$1',
      },
      ...proxyOptions,
    }),
  );
  expressApp.use(
    '/api/public/conferences',
    createProxyMiddleware({
      target: conferenceServiceUrl,
      pathRewrite: (path, req) => {
        const fullPath = req.url || path;
        const newPath = fullPath.startsWith('/api/public/conferences') 
          ? fullPath 
          : '/api/public/conferences' + (path.startsWith('/') ? path : '/' + path);
        
        return newPath;
      },
      ...proxyOptions,
    }),
  );
  expressApp.use(
    '/api/conferences',
    createProxyMiddleware({
      target: conferenceServiceUrl,
      pathRewrite: {
        '^(.*)': '/api/conferences$1',
      },
      ...proxyOptions,
    }),
  );
  expressApp.use(
    '/api/submissions',
    createProxyMiddleware({
      target: submissionServiceUrl,
      pathRewrite: {
        '^(.*)': '/api/submissions$1',
      },
      ...proxyOptions,
    }),
  );
  expressApp.use(
    '/api/reviews',
    createProxyMiddleware({
      target: reviewServiceUrl,
      pathRewrite: {
        '^(.*)': '/api/reviews$1',
      },
      ...proxyOptions,
    }),
  );

  // Health check endpoint for gateway
  expressApp.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
    });
  });

  // Health check proxy endpoints for monitoring services
  expressApp.get('/health/identity', createProxyMiddleware({
    target: identityServiceUrl,
    pathRewrite: { '^/health/identity': '/api/health' },
    ...proxyOptions,
  }));

  expressApp.get('/health/conference', createProxyMiddleware({
    target: conferenceServiceUrl,
    pathRewrite: { '^/health/conference': '/api/health' },
    ...proxyOptions,
  }));

  expressApp.get('/health/submission', createProxyMiddleware({
    target: submissionServiceUrl,
    pathRewrite: { '^/health/submission': '/api/health' },
    ...proxyOptions,
  }));

  expressApp.get('/health/review', createProxyMiddleware({
    target: reviewServiceUrl,
    pathRewrite: { '^/health/review': '/api/health' },
    ...proxyOptions,
  }));

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0'); 
  console.log(`Gateway is running on http://0.0.0.0:${port}`);
}
bootstrap();