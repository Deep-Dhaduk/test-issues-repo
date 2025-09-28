import { FastifyInstance } from 'fastify';
import { HealthStatus } from '../types';

const startTime = Date.now();

export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  // Health check endpoint
  fastify.get('/healthz', async () => {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    
    const healthStatus: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime,
    };

    return healthStatus;
  });
}
