import { handleError, createErrorResponse } from '../../src/utils/error-handler';
import { ValidationError } from '../../src/utils/validation';
import { FastifyReply } from 'fastify';

// Mock FastifyReply
const mockReply = {
  status: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
} as unknown as FastifyReply;

describe('Error Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createErrorResponse', () => {
    it('should create error response with message only', () => {
      const error = new Error('Test error');
      const response = createErrorResponse('TEST_ERROR', error.message);
      
      expect(response).toEqual({
        error: 'TEST_ERROR',
        message: 'Test error',
        details: undefined,
      });
    });

    it('should create error response with message and details', () => {
      const details = { field: 'test', value: 'invalid' };
      const response = createErrorResponse('VALIDATION_ERROR', 'Invalid input', details);
      
      expect(response).toEqual({
        error: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details,
      });
    });
  });

  describe('handleError', () => {
    it('should handle ValidationError', () => {
      const error = new ValidationError('Title is required', 'title');
      
      handleError(error, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'VALIDATION_ERROR',
        message: 'Title is required',
        details: { field: 'title' },
      });
    });

    it('should handle ValidationError without field', () => {
      const error = new ValidationError('Title is required');
      
      handleError(error, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'VALIDATION_ERROR',
        message: 'Title is required',
        details: undefined,
      });
    });

    it('should handle rate limit error', () => {
      const error = new Error('Rate limit exceeded');
      
      handleError(error, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(429);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded',
        details: undefined,
      });
    });

    it('should handle not found error', () => {
      const error = new Error('Not Found');
      
      handleError(error, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'NOT_FOUND',
        message: 'Resource not found',
        details: undefined,
      });
    });

    it('should handle 404 error', () => {
      const error = new Error('404 error');
      
      handleError(error, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'NOT_FOUND',
        message: 'Resource not found',
        details: undefined,
      });
    });

    it('should handle unauthorized error', () => {
      const error = new Error('Unauthorized');
      
      handleError(error, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'UNAUTHORIZED',
        message: 'Invalid or missing authentication token',
        details: undefined,
      });
    });

    it('should handle 401 error', () => {
      const error = new Error('401 error');
      
      handleError(error, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'UNAUTHORIZED',
        message: 'Invalid or missing authentication token',
        details: undefined,
      });
    });

    it('should handle forbidden error', () => {
      const error = new Error('Forbidden');
      
      handleError(error, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'FORBIDDEN',
        message: 'Insufficient permissions',
        details: undefined,
      });
    });

    it('should handle 403 error', () => {
      const error = new Error('403 error');
      
      handleError(error, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'FORBIDDEN',
        message: 'Insufficient permissions',
        details: undefined,
      });
    });

    it('should handle generic error', () => {
      const error = new Error('Generic error');
      
      handleError(error, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: undefined,
      });
    });

    it('should handle unknown error type', () => {
      const error = 'string error';
      
      handleError(error, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: undefined,
      });
    });

    it('should handle null error', () => {
      handleError(null, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: undefined,
      });
    });

    it('should handle undefined error', () => {
      handleError(undefined, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: undefined,
      });
    });
  });
});