// Test setup file
import 'dotenv/config';

// Set test environment variables
process.env['NODE_ENV'] = 'test';
process.env['GITHUB_TOKEN'] = 'test-token';
process.env['GITHUB_OWNER'] = 'test-owner';
process.env['GITHUB_REPO'] = 'test-repo';
process.env['WEBHOOK_SECRET'] = 'test-secret';
process.env['PORT'] = '3000';
process.env['DATABASE_PATH'] = './data/test-events.db';
