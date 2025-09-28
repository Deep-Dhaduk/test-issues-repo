import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { EventStore } from '../services/event-store';
import { handleError } from '../utils/error-handler';

const eventStore = new EventStore();

export async function eventRoutes(fastify: FastifyInstance): Promise<void> {
  // List webhook events
  fastify.get('/events', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { limit } = request.query as { limit?: string };
      const limitNumber = limit ? parseInt(limit, 10) : 50;
      
      if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 100) {
        reply.status(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Limit must be between 1 and 100'
        });
        return;
      }

      const events = await eventStore.getEvents(limitNumber);
      return events;
    } catch (error) {
      handleError(error, reply);
      return;
    }
  });
}
