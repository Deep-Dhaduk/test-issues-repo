import { CreateIssueRequest, UpdateIssueRequest, CreateCommentRequest } from '../types';

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateCreateIssueRequest(data: unknown): CreateIssueRequest {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Request body must be an object');
  }

  const { title, body, labels } = data as Record<string, unknown>;

  if (typeof title !== 'string' || title.length === 0) {
    throw new ValidationError('Title is required and must be a non-empty string', 'title');
  }

  if (title.length > 200) {
    throw new ValidationError('Title must be 200 characters or less', 'title');
  }

  if (body !== undefined && body !== null && typeof body !== 'string') {
    throw new ValidationError('Body must be a string', 'body');
  }

  if (body && typeof body === 'string' && body.length > 65536) {
    throw new ValidationError('Body must be 65536 characters or less', 'body');
  }

  if (labels !== undefined) {
    if (!Array.isArray(labels)) {
      throw new ValidationError('Labels must be an array', 'labels');
    }

    for (const label of labels) {
      if (typeof label !== 'string') {
        throw new ValidationError('All labels must be strings', 'labels');
      }
    }
  }

  return {
    title,
    body: body || undefined,
    labels: labels || undefined,
  };
}

export function validateUpdateIssueRequest(data: unknown): UpdateIssueRequest {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Request body must be an object');
  }

  const { title, body, state } = data as Record<string, unknown>;

  if (title !== undefined) {
    if (typeof title !== 'string') {
      throw new ValidationError('Title must be a string', 'title');
    }

    if (title.length === 0) {
      throw new ValidationError('Title cannot be empty', 'title');
    }

    if (title.length > 200) {
      throw new ValidationError('Title must be 200 characters or less', 'title');
    }
  }

  if (body !== undefined && body !== null && typeof body !== 'string') {
    throw new ValidationError('Body must be a string', 'body');
  }

  if (body && typeof body === 'string' && body.length > 65536) {
    throw new ValidationError('Body must be 65536 characters or less', 'body');
  }

  if (state !== undefined) {
    if (typeof state !== 'string' || !['open', 'closed'].includes(state)) {
      throw new ValidationError('State must be either "open" or "closed"', 'state');
    }
  }

  const result: UpdateIssueRequest = {};
  if (title !== undefined) result.title = title;
  if (body !== undefined) result.body = body || undefined;
  if (state !== undefined) result.state = state as 'open' | 'closed';

  return result;
}

export function validateCreateCommentRequest(data: unknown): CreateCommentRequest {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Request body must be an object');
  }

  const { body } = data as Record<string, unknown>;

  if (typeof body !== 'string' || body.length === 0) {
    throw new ValidationError('Body is required and must be a non-empty string', 'body');
  }

  if (body.length > 65536) {
    throw new ValidationError('Body must be 65536 characters or less', 'body');
  }

  return { body };
}

export function validateIssueNumber(number: string): number {
  const parsed = parseInt(number, 10);
  if (isNaN(parsed) || parsed < 1 || !Number.isInteger(parseFloat(number))) {
    throw new ValidationError('Issue number must be a positive integer');
  }
  return parsed;
}

export function validatePaginationParams(query: Record<string, unknown>): {
  page?: number;
  per_page?: number;
  state?: 'open' | 'closed' | 'all';
  labels?: string;
} {
  const result: {
    page?: number;
    per_page?: number;
    state?: 'open' | 'closed' | 'all';
    labels?: string;
  } = {};

  if (query['page'] !== undefined) {
    const page = parseInt(String(query['page']), 10);
    if (isNaN(page) || page < 1) {
      throw new ValidationError('Page must be a positive integer', 'page');
    }
    result.page = page;
  }

  if (query['per_page'] !== undefined) {
    const perPage = parseInt(String(query['per_page']), 10);
    if (isNaN(perPage) || perPage < 1 || perPage > 100) {
      throw new ValidationError('Per page must be between 1 and 100', 'per_page');
    }
    result.per_page = perPage;
  }

  if (query['state'] !== undefined) {
    const state = String(query['state']);
    if (!['open', 'closed', 'all'].includes(state)) {
      throw new ValidationError('State must be "open", "closed", or "all"', 'state');
    }
    result.state = state as 'open' | 'closed' | 'all';
  }

  if (query['labels'] !== undefined) {
    result.labels = String(query['labels']);
  }

  return result;
}
