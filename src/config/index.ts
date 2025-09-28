import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  github: {
    token: string;
    owner: string;
    repo: string;
  };
  webhook: {
    secret: string;
  };
  server: {
    port: number;
    nodeEnv: string;
  };
  database: {
    path: string;
  };
}

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

function getOptionalNumberEnv(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }
  return parsed;
}

export const config: Config = {
  github: {
    token: getRequiredEnv('GITHUB_TOKEN'),
    owner: getRequiredEnv('GITHUB_OWNER'),
    repo: getRequiredEnv('GITHUB_REPO'),
  },
  webhook: {
    secret: getRequiredEnv('WEBHOOK_SECRET'),
  },
  server: {
    port: getOptionalNumberEnv('PORT', 3000),
    nodeEnv: getOptionalEnv('NODE_ENV', 'development'),
  },
  database: {
    path: getOptionalEnv('DATABASE_PATH', './data/events.db'),
  },
};
