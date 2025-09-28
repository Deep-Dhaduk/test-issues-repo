import { Database } from 'sqlite3';
import { WebhookEvent } from '../types';
import { config } from '../config';

export class EventStore {
  private db: Database;
  private initPromise: Promise<void>;

  constructor(databasePath?: string) {
    const dbPath = databasePath || process.env['DATABASE_PATH'] || config.database.path;
    this.db = new Database(dbPath);
    this.initPromise = this.initializeDatabase();
  }

  private async waitForInit(): Promise<void> {
    await this.initPromise;
  }

  private initializeDatabase(): Promise<void> {
    const createTable = `
      CREATE TABLE IF NOT EXISTS webhook_events (
        id TEXT PRIMARY KEY,
        event TEXT NOT NULL,
        action TEXT NOT NULL,
        issue_number INTEGER,
        timestamp TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    return new Promise<void>((resolve, reject) => {
      this.db.run(createTable, (err) => {
        if (err) {
          console.error('Error creating webhook_events table:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async storeEvent(event: WebhookEvent, payload: string): Promise<void> {
    await this.waitForInit();
    
    const insertEvent = `
      INSERT OR REPLACE INTO webhook_events (id, event, action, issue_number, timestamp, payload, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    `;

    return new Promise((resolve, reject) => {
      this.db.run(insertEvent, [
        event.id,
        event.event,
        event.action,
        event.issue_number || null,
        event.timestamp,
        payload,
      ], (err) => {
        if (err) {
          console.error('Error storing webhook event:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async getEvents(limit: number = 50): Promise<WebhookEvent[]> {
    await this.waitForInit();
    
    const selectEvents = `
      SELECT id, event, action, issue_number, timestamp
      FROM webhook_events
      ORDER BY created_at DESC
      LIMIT ?
    `;

    return new Promise((resolve, reject) => {
      this.db.all(selectEvents, [limit], (err, rows: any[]) => {
        if (err) {
          console.error('Error retrieving webhook events:', err);
          reject(err);
        } else {
          const events: WebhookEvent[] = rows.map(row => ({
            id: row.id,
            event: row.event,
            action: row.action,
            issue_number: row.issue_number || undefined,
            timestamp: row.timestamp,
          }));
          resolve(events);
        }
      });
    });
  }

  async getEventById(id: string): Promise<WebhookEvent | null> {
    await this.waitForInit();
    
    const selectEvent = `
      SELECT id, event, action, issue_number, timestamp
      FROM webhook_events
      WHERE id = ?
    `;

    return new Promise((resolve, reject) => {
      this.db.get(selectEvent, [id], (err, row: any) => {
        if (err) {
          console.error('Error retrieving webhook event by ID:', err);
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          resolve({
            id: row.id,
            event: row.event,
            action: row.action,
            issue_number: row.issue_number || undefined,
            timestamp: row.timestamp,
          });
        }
      });
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve) => {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        }
        resolve();
      });
    });
  }
}