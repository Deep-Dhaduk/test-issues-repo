import { EventStore } from '../../src/services/event-store';
import { WebhookEvent } from '../../src/types';

describe('EventStore', () => {
  let eventStore: EventStore;
  let dbPath: string;

  beforeEach(() => {
    // Use a unique database file for each test
    dbPath = `./data/test-events-${Date.now()}-${Math.random()}.db`;
    eventStore = new EventStore(dbPath);
  });

  afterEach(async () => {
    await eventStore.close();
    // Clean up the test database file
    const fs = require('fs');
    if (dbPath && fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  });

  describe('storeEvent', () => {
    it('should store a webhook event', async () => {
      const event: WebhookEvent = {
        id: 'delivery-123',
        event: 'issues',
        action: 'opened',
        issue_number: 1,
        timestamp: '2023-01-01T00:00:00Z',
      };

      const payload = '{"test": "data"}';

      await eventStore.storeEvent(event, payload);

      const storedEvent = await eventStore.getEventById('delivery-123');
      expect(storedEvent).toEqual(event);
    });

    it('should update an existing event with same ID', async () => {
      const event1: WebhookEvent = {
        id: 'delivery-123',
        event: 'issues',
        action: 'opened',
        issue_number: 1,
        timestamp: '2023-01-01T00:00:00Z',
      };

      const event2: WebhookEvent = {
        id: 'delivery-123',
        event: 'issues',
        action: 'closed',
        issue_number: 1,
        timestamp: '2023-01-01T00:01:00Z',
      };

      await eventStore.storeEvent(event1, 'payload1');
      await eventStore.storeEvent(event2, 'payload2');

      const storedEvent = await eventStore.getEventById('delivery-123');
      expect(storedEvent).toEqual(event2);
    });
  });

  describe('getEvents', () => {
    it('should return events in descending order by created_at', async () => {
      const events: WebhookEvent[] = [
        {
          id: 'delivery-1',
          event: 'issues',
          action: 'opened',
          issue_number: 1,
          timestamp: '2023-01-01T00:00:00Z',
        },
        {
          id: 'delivery-2',
          event: 'issues',
          action: 'closed',
          issue_number: 1,
          timestamp: '2023-01-01T00:01:00Z',
        },
        {
          id: 'delivery-3',
          event: 'issue_comment',
          action: 'created',
          issue_number: 1,
          timestamp: '2023-01-01T00:02:00Z',
        },
      ];

      for (const event of events) {
        await eventStore.storeEvent(event, 'payload');
        // Longer delay to ensure different created_at timestamps (SQLite has second precision)
        await new Promise(resolve => setTimeout(resolve, 1100));
      }

      const storedEvents = await eventStore.getEvents();
      expect(storedEvents).toHaveLength(3);
      
      // Events should be in descending order by created_at (most recent first)
      expect(storedEvents[0]?.id).toBe('delivery-3');
      expect(storedEvents[1]?.id).toBe('delivery-2');
      expect(storedEvents[2]?.id).toBe('delivery-1');
    });

    it('should respect limit parameter', async () => {
      const events: WebhookEvent[] = Array.from({ length: 5 }, (_, i) => ({
        id: `delivery-${i + 1}`,
        event: 'issues',
        action: 'opened',
        issue_number: i + 1,
        timestamp: '2023-01-01T00:00:00Z',
      }));

      for (const event of events) {
        await eventStore.storeEvent(event, 'payload');
      }

      const limitedEvents = await eventStore.getEvents(3);
      expect(limitedEvents).toHaveLength(3);
    });

    it('should return empty array when no events exist', async () => {
      const events = await eventStore.getEvents();
      expect(events).toEqual([]);
    });
  });

  describe('getEventById', () => {
    it('should return event by ID', async () => {
      const event: WebhookEvent = {
        id: 'delivery-123',
        event: 'issues',
        action: 'opened',
        issue_number: 1,
        timestamp: '2023-01-01T00:00:00Z',
      };

      await eventStore.storeEvent(event, 'payload');

      const storedEvent = await eventStore.getEventById('delivery-123');
      expect(storedEvent).toEqual(event);
    });

    it('should return null for non-existent event', async () => {
      const storedEvent = await eventStore.getEventById('non-existent');
      expect(storedEvent).toBeNull();
    });
  });
});
