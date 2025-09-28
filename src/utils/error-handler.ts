import { FastifyError, FastifyReply } from 'fastify';
import { ValidationError } from './validation';
import { ErrorResponse } from '../types';

export function createErrorResponse(error: string, message: string, details?: Record<string, unknown>): ErrorResponse {
  return {
    error,
    message,
    details,
  };
}

export function handleError(error: unknown, reply: FastifyReply): void {
  console.error('Error occurred:', error);

  if (error instanceof ValidationError) {
    reply.status(400).send(createErrorResponse(
      'VALIDATION_ERROR',
      error.message,
      error.field ? { field: error.field } : undefined
    ));
    return;
  }

  if (error instanceof Error) {
    // Handle GitHub API errors
    if (error.message.includes('Rate limit exceeded')) {
      reply.status(429).send(createErrorResponse(
        'RATE_LIMIT_EXCEEDED',
        error.message
      ));
      return;
    }

    if (error.message.includes('Not Found') || error.message.includes('404')) {
      reply.status(404).send(createErrorResponse(
        'NOT_FOUND',
        'Resource not found'
      ));
      return;
    }

    if (error.message.includes('Unauthorized') || error.message.includes('401')) {
      reply.status(401).send(createErrorResponse(
        'UNAUTHORIZED',
        'Invalid or missing authentication token'
      ));
      return;
    }

    if (error.message.includes('Forbidden') || error.message.includes('403')) {
      reply.status(403).send(createErrorResponse(
        'FORBIDDEN',
        'Insufficient permissions'
      ));
      return;
    }

    // Generic server error
    reply.status(500).send(createErrorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred'
    ));
    return;
  }

  // Unknown error type
  reply.status(500).send(createErrorResponse(
    'INTERNAL_ERROR',
    'An unexpected error occurred'
  ));
}

export function isFastifyError(error: unknown): error is FastifyError {
  return error !== null && typeof error === 'object' && 'statusCode' in error;
}
