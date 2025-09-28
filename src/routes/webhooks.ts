import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { WebhookVerifier } from '../services/webhook-verifier';
import { EventStore } from '../services/event-store';
import { config } from '../config';
import { WebhookEvent } from '../types';
import { handleError } from '../utils/error-handler';

const webhookVerifier = new WebhookVerifier(config.webhook.secret);
const eventStore = new EventStore();

export async function webhookRoutes(fastify: FastifyInstance): Promise<void> {
  // Webhook endpoint
  fastify.post('/webhook', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const signature = request.headers['x-hub-signature-256'] as string;
      const event = request.headers['x-github-event'] as string;
      const deliveryId = request.headers['x-github-delivery'] as string;

      // Check for missing signature
      if (!signature) {
        reply.status(401).send({
          error: 'UNAUTHORIZED',
          message: 'Missing webhook signature'
        });
        return;
      }

      // Verify signature
      const payload = JSON.stringify(request.body);
      if (!webhookVerifier.verifySignature(payload, signature)) {
        reply.status(401).send({
          error: 'UNAUTHORIZED',
          message: 'Invalid webhook signature'
        });
        return;
      }

      // Check if event is supported
      if (!['issues', 'issue_comment', 'ping'].includes(event)) {
        reply.status(400).send({
          error: 'UNSUPPORTED_EVENT',
          message: `Event type '${event}' is not supported`
        });
        return;
      }

      // Handle ping event
      if (event === 'ping') {
        reply.status(204).send();
        return;
      }

      // Extract action and issue number
      const body = request.body as any;
      const action = body.action;
      let issueNumber: number | undefined;

      if (event === 'issues' && body.issue) {
        issueNumber = body.issue.number;
      } else if (event === 'issue_comment' && body.issue) {
        issueNumber = body.issue.number;
      }

      // Create webhook event
      const webhookEvent: WebhookEvent = {
        id: deliveryId,
        event,
        action,
        issue_number: issueNumber || undefined,
        timestamp: new Date().toISOString(),
      };

      // Store event (async, don't wait)
      eventStore.storeEvent(webhookEvent, payload).catch(error => {
        console.error('Failed to store webhook event:', error);
      });

      // Log event
      console.log(`Webhook event received: ${event}.${action} (delivery: ${deliveryId})`);

      reply.status(204).send();
    } catch (error) {
      handleError(error, reply);
    }
  });
}
