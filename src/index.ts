import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from './config';
import { issueRoutes } from './routes/issues';
import { commentRoutes } from './routes/comments';
import { webhookRoutes } from './routes/webhooks';
import { eventRoutes } from './routes/events';
import { healthRoutes } from './routes/health';
import { handleError } from './utils/error-handler';

async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: config.server.nodeEnv === 'production' ? 'info' : 'debug',
    },
  });

  // Register plugins
  await fastify.register(helmet);
  await fastify.register(cors, {
    origin: true,
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await fastify.register(swagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'GitHub Issues Service API',
        description: 'A service that wraps the GitHub REST API for Issues with webhook handling',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://localhost:${config.server.port}`,
          description: 'Development server',
        },
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });

  // Register routes
  await fastify.register(issueRoutes);
  await fastify.register(commentRoutes);
  await fastify.register(webhookRoutes);
  await fastify.register(eventRoutes);
  await fastify.register(healthRoutes);

  // Error handler
  fastify.setErrorHandler((error, _request, reply) => {
    handleError(error, reply);
  });

  // 404 handler
  fastify.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({
      error: 'NOT_FOUND',
      message: 'Route not found',
    });
  });

  return fastify;
}

async function start() {
  try {
    const app = await buildApp();
    
    await app.listen({
      port: config.server.port,
      host: '0.0.0.0',
    });

    console.log(`Server is running on http://localhost:${config.server.port}`);
    console.log(`API documentation available at http://localhost:${config.server.port}/docs`);
    console.log(`Health check available at http://localhost:${config.server.port}/healthz`);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

if (require.main === module) {
  start();
}

export { buildApp };
