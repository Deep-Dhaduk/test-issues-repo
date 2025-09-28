import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/index';
import { EventStore } from '../../src/services/event-store';
import { WebhookVerifier } from '../../src/services/webhook-verifier';
import crypto from 'crypto';

// Mock dependencies
jest.mock('../../src/services/event-store');
jest.mock('../../src/services/webhook-verifier');

const MockedEventStore = EventStore as jest.MockedClass<typeof EventStore>;
const MockedWebhookVerifier = WebhookVerifier as jest.MockedClass<typeof WebhookVerifier>;

describe('Webhooks Route', () => {
  let app: FastifyInstance;
  let mockEventStore: jest.Mocked<EventStore>;
  let mockWebhookVerifier: jest.Mocked<WebhookVerifier>;

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock instances
    mockEventStore = {
      storeEvent: jest.fn(),
    } as any;

    mockWebhookVerifier = {
      verifySignature: jest.fn(),
    } as any;

    // Mock the constructors
    MockedEventStore.mockImplementation(() => mockEventStore);
    MockedWebhookVerifier.mockImplementation(() => mockWebhookVerifier);

    // Build the app
    app = await buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /webhook', () => {
    const webhookSecret = 'test-secret';
    const payload = JSON.stringify({
      action: 'opened',
      issue: {
        number: 1,
        title: 'Test Issue',
        state: 'open',
      },
    });

    beforeEach(() => {
      // Set up environment variable
      process.env['WEBHOOK_SECRET'] = webhookSecret;
    });

    afterEach(() => {
      delete process.env['WEBHOOK_SECRET'];
    });

    it('should process issues event successfully', async () => {
      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      mockWebhookVerifier.verifySignature.mockReturnValue(true);
      mockEventStore.storeEvent.mockResolvedValue();

      const response = await app.inject({
        method: 'POST',
        url: '/webhook',
        headers: {
          'x-github-event': 'issues',
          'x-github-delivery': 'delivery-123',
          'x-hub-signature-256': `sha256=${signature}`,
          'content-type': 'application/json',
        },
        payload,
      });

      expect(response.statusCode).toBe(204);
      expect(mockWebhookVerifier.verifySignature).toHaveBeenCalledWith(
        payload,
        `sha256=${signature}`
      );
      expect(mockEventStore.storeEvent).toHaveBeenCalledWith(
        {
          id: 'delivery-123',
          event: 'issues',
          action: 'opened',
          issue_number: 1,
          timestamp: expect.any(String),
        },
        payload
      );
    });

    it('should process issue_comment event successfully', async () => {
      const commentPayload = JSON.stringify({
        action: 'created',
        comment: {
          id: 123,
          body: 'This is a comment',
        },
        issue: {
          number: 1,
        },
      });

      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(commentPayload)
        .digest('hex');

      mockWebhookVerifier.verifySignature.mockReturnValue(true);
      mockEventStore.storeEvent.mockResolvedValue();

      const response = await app.inject({
        method: 'POST',
        url: '/webhook',
        headers: {
          'x-github-event': 'issue_comment',
          'x-github-delivery': 'delivery-456',
          'x-hub-signature-256': `sha256=${signature}`,
          'content-type': 'application/json',
        },
        payload: commentPayload,
      });

      expect(response.statusCode).toBe(204);
      expect(mockEventStore.storeEvent).toHaveBeenCalledWith(
        {
          id: 'delivery-456',
          event: 'issue_comment',
          action: 'created',
          issue_number: 1,
          timestamp: expect.any(String),
        },
        commentPayload
      );
    });

    it('should process ping event successfully', async () => {
      const pingPayload = JSON.stringify({
        zen: 'Keep it logically awesome.',
        hook_id: 123456,
      });

      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(pingPayload)
        .digest('hex');

      mockWebhookVerifier.verifySignature.mockReturnValue(true);

      const response = await app.inject({
        method: 'POST',
        url: '/webhook',
        headers: {
          'x-github-event': 'ping',
          'x-github-delivery': 'delivery-ping',
          'x-hub-signature-256': `sha256=${signature}`,
          'content-type': 'application/json',
        },
        payload: pingPayload,
      });

      expect(response.statusCode).toBe(204);
      expect(mockEventStore.storeEvent).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid signature', async () => {
      mockWebhookVerifier.verifySignature.mockReturnValue(false);

      const response = await app.inject({
        method: 'POST',
        url: '/webhook',
        headers: {
          'x-github-event': 'issues',
          'x-github-delivery': 'delivery-123',
          'x-hub-signature-256': 'sha256=invalid',
          'content-type': 'application/json',
        },
        payload,
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('UNAUTHORIZED');
      expect(body.message).toContain('Invalid webhook signature');
    });

    it('should return 401 for missing signature', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/webhook',
        headers: {
          'x-github-event': 'issues',
          'x-github-delivery': 'delivery-123',
          'content-type': 'application/json',
        },
        payload,
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('UNAUTHORIZED');
      expect(body.message).toContain('Missing webhook signature');
    });

    it('should return 400 for unsupported event type', async () => {
      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      mockWebhookVerifier.verifySignature.mockReturnValue(true);

      const response = await app.inject({
        method: 'POST',
        url: '/webhook',
        headers: {
          'x-github-event': 'push',
          'x-github-delivery': 'delivery-123',
          'x-hub-signature-256': `sha256=${signature}`,
          'content-type': 'application/json',
        },
        payload,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('BAD_REQUEST');
      expect(body.message).toContain('Unsupported event type: push');
    });

    it('should return 400 for missing event type', async () => {
      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      mockWebhookVerifier.verifySignature.mockReturnValue(true);

      const response = await app.inject({
        method: 'POST',
        url: '/webhook',
        headers: {
          'x-github-delivery': 'delivery-123',
          'x-hub-signature-256': `sha256=${signature}`,
          'content-type': 'application/json',
        },
        payload,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('BAD_REQUEST');
      expect(body.message).toContain('Missing event type');
    });

    it('should return 400 for missing delivery ID', async () => {
      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      mockWebhookVerifier.verifySignature.mockReturnValue(true);

      const response = await app.inject({
        method: 'POST',
        url: '/webhook',
        headers: {
          'x-github-event': 'issues',
          'x-hub-signature-256': `sha256=${signature}`,
          'content-type': 'application/json',
        },
        payload,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('BAD_REQUEST');
      expect(body.message).toContain('Missing delivery ID');
    });

    it('should handle event store error', async () => {
      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      mockWebhookVerifier.verifySignature.mockReturnValue(true);
      mockEventStore.storeEvent.mockRejectedValue(new Error('Database error'));

      const response = await app.inject({
        method: 'POST',
        url: '/webhook',
        headers: {
          'x-github-event': 'issues',
          'x-github-delivery': 'delivery-123',
          'x-hub-signature-256': `sha256=${signature}`,
          'content-type': 'application/json',
        },
        payload,
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('INTERNAL_ERROR');
      expect(body.message).toContain('An unexpected error occurred');
    });

    it('should handle issues event without issue number', async () => {
      const payloadWithoutIssue = JSON.stringify({
        action: 'opened',
        // Missing issue object
      });

      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payloadWithoutIssue)
        .digest('hex');

      mockWebhookVerifier.verifySignature.mockReturnValue(true);
      mockEventStore.storeEvent.mockResolvedValue();

      const response = await app.inject({
        method: 'POST',
        url: '/webhook',
        headers: {
          'x-github-event': 'issues',
          'x-github-delivery': 'delivery-123',
          'x-hub-signature-256': `sha256=${signature}`,
          'content-type': 'application/json',
        },
        payload: payloadWithoutIssue,
      });

      expect(response.statusCode).toBe(204);
      expect(mockEventStore.storeEvent).toHaveBeenCalledWith(
        {
          id: 'delivery-123',
          event: 'issues',
          action: 'opened',
          issue_number: undefined,
          timestamp: expect.any(String),
        },
        payloadWithoutIssue
      );
    });

    it('should handle issue_comment event without issue number', async () => {
      const commentPayloadWithoutIssue = JSON.stringify({
        action: 'created',
        comment: {
          id: 123,
          body: 'This is a comment',
        },
        // Missing issue object
      });

      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(commentPayloadWithoutIssue)
        .digest('hex');

      mockWebhookVerifier.verifySignature.mockReturnValue(true);
      mockEventStore.storeEvent.mockResolvedValue();

      const response = await app.inject({
        method: 'POST',
        url: '/webhook',
        headers: {
          'x-github-event': 'issue_comment',
          'x-github-delivery': 'delivery-456',
          'x-hub-signature-256': `sha256=${signature}`,
          'content-type': 'application/json',
        },
        payload: commentPayloadWithoutIssue,
      });

      expect(response.statusCode).toBe(204);
      expect(mockEventStore.storeEvent).toHaveBeenCalledWith(
        {
          id: 'delivery-456',
          event: 'issue_comment',
          action: 'created',
          issue_number: undefined,
          timestamp: expect.any(String),
        },
        commentPayloadWithoutIssue
      );
    });

    it('should return 400 for invalid JSON payload', async () => {
      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update('invalid json')
        .digest('hex');

      mockWebhookVerifier.verifySignature.mockReturnValue(true);

      const response = await app.inject({
        method: 'POST',
        url: '/webhook',
        headers: {
          'x-github-event': 'issues',
          'x-github-delivery': 'delivery-123',
          'x-hub-signature-256': `sha256=${signature}`,
          'content-type': 'application/json',
        },
        payload: 'invalid json',
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for missing content-type', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/webhook',
        headers: {
          'x-github-event': 'issues',
          'x-github-delivery': 'delivery-123',
          'x-hub-signature-256': 'sha256=test',
        },
        payload,
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
