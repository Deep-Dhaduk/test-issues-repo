import { buildApp } from '../../src/index';
import { EventStore } from '../../src/services/event-store';

describe('App Integration Tests', () => {
  let app: any;
  let eventStore: EventStore;

  beforeAll(async () => {
    app = await buildApp();
    eventStore = new EventStore();
  });

  afterAll(async () => {
    await app.close();
    await eventStore.close();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/healthz',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
      });
    });
  });

  describe('API Documentation', () => {
    it('should serve OpenAPI spec', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/docs/json',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        openapi: '3.1.0',
        info: {
          title: 'GitHub Issues Service API',
        },
      });
    });

    it('should serve Swagger UI', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/docs',
      });

      // Swagger UI redirects to /docs/ by default
      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('./docs/static/index.html');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/unknown-route',
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toMatchObject({
        error: 'NOT_FOUND',
        message: 'Route not found',
      });
    });

    it('should return 400 for invalid JSON', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/issues',
        payload: 'invalid json',
        headers: {
          'content-type': 'application/json',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Validation', () => {
    it('should validate create issue request', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/issues',
        payload: {
          // Missing required title
          body: 'Test body',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        error: 'VALIDATION_ERROR',
        message: 'Title is required and must be a non-empty string',
      });
    });

    it('should validate issue number parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/issues/invalid-number',
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        error: 'VALIDATION_ERROR',
        message: 'Issue number must be a positive integer',
      });
    });

    it('should validate pagination parameters', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/issues?per_page=101',
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        error: 'VALIDATION_ERROR',
        message: 'Per page must be between 1 and 100',
      });
    });
  });

  describe('Webhook Endpoint', () => {
    it('should reject requests without signature', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/webhook',
        payload: { test: 'data' },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toMatchObject({
        error: 'UNAUTHORIZED',
        message: 'Missing webhook signature',
      });
    });

    it('should reject requests with invalid signature', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/webhook',
        payload: { test: 'data' },
        headers: {
          'x-hub-signature-256': 'sha256=invalid-signature',
        },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toMatchObject({
        error: 'UNAUTHORIZED',
        message: 'Invalid webhook signature',
      });
    });

    it('should reject unsupported event types', async () => {
      const payload = JSON.stringify({ test: 'data' });
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', 'test-secret');
      hmac.update(payload);
      const signature = `sha256=${hmac.digest('hex')}`;

      const response = await app.inject({
        method: 'POST',
        url: '/webhook',
        payload,
        headers: {
          'content-type': 'application/json',
          'x-hub-signature-256': signature,
          'x-github-event': 'unsupported-event',
          'x-github-delivery': 'delivery-123',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        error: 'UNSUPPORTED_EVENT',
        message: "Event type 'unsupported-event' is not supported",
      });
    });

    it('should handle ping events', async () => {
      const payload = JSON.stringify({ zen: 'Keep it logically awesome.' });
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', 'test-secret');
      hmac.update(payload);
      const signature = `sha256=${hmac.digest('hex')}`;

      const response = await app.inject({
        method: 'POST',
        url: '/webhook',
        payload,
        headers: {
          'content-type': 'application/json',
          'x-hub-signature-256': signature,
          'x-github-event': 'ping',
          'x-github-delivery': 'delivery-123',
        },
      });

      expect(response.statusCode).toBe(204);
    });
  });

  describe('Events Endpoint', () => {
    it('should return events list', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/events',
      });

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.json())).toBe(true);
    });

    it('should validate limit parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/events?limit=101',
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        error: 'VALIDATION_ERROR',
        message: 'Limit must be between 1 and 100',
      });
    });
  });
});
