import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/index';
import { GitHubClient } from '../../src/services/github-client';

// Mock GitHubClient
jest.mock('../../src/services/github-client');
const MockedGitHubClient = GitHubClient as jest.MockedClass<typeof GitHubClient>;

describe('Comments Route', () => {
  let app: FastifyInstance;
  let mockGitHubClient: jest.Mocked<GitHubClient>;

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock GitHub client
    mockGitHubClient = {
      createComment: jest.fn(),
    } as any;

    // Mock the GitHubClient constructor
    MockedGitHubClient.mockImplementation(() => mockGitHubClient);

    // Build the app
    app = await buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /issues/:number/comments', () => {
    it('should create a comment successfully', async () => {
      const mockComment = {
        id: 123,
        body: 'This is a test comment',
        user: {
          login: 'testuser',
          id: 1,
          avatar_url: 'https://github.com/testuser.png',
        },
        created_at: '2023-01-01T00:00:00Z',
        html_url: 'https://github.com/owner/repo/issues/1#issuecomment-123',
      };

      mockGitHubClient.createComment.mockResolvedValue({
        data: mockComment,
        headers: {},
        rateLimit: {
          limit: 5000,
          remaining: 4999,
          reset: Date.now() + 3600000,
          used: 1,
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/issues/1/comments',
        payload: {
          body: 'This is a test comment',
        },
      });

      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.payload)).toEqual(mockComment);
      expect(mockGitHubClient.createComment).toHaveBeenCalledWith(1, 'This is a test comment');
    });

    it('should return 400 for missing body', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/issues/1/comments',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toContain('Body is required');
    });

    it('should return 400 for empty body', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/issues/1/comments',
        payload: {
          body: '',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toContain('Body is required');
    });

    it('should return 400 for invalid issue number', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/issues/invalid/comments',
        payload: {
          body: 'This is a test comment',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toContain('Issue number must be a positive integer');
    });

    it('should return 400 for negative issue number', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/issues/-1/comments',
        payload: {
          body: 'This is a test comment',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toContain('Issue number must be a positive integer');
    });

    it('should return 400 for zero issue number', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/issues/0/comments',
        payload: {
          body: 'This is a test comment',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toContain('Issue number must be a positive integer');
    });

    it('should return 400 for decimal issue number', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/issues/1.5/comments',
        payload: {
          body: 'This is a test comment',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toContain('Issue number must be a positive integer');
    });

    it('should handle GitHub API error', async () => {
      const githubError = {
        response: {
          status: 404,
          data: {
            message: 'Not Found',
          },
        },
      };

      mockGitHubClient.createComment.mockRejectedValue(githubError);

      const response = await app.inject({
        method: 'POST',
        url: '/issues/999/comments',
        payload: {
          body: 'This is a test comment',
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('NOT_FOUND');
      expect(body.message).toContain('GitHub resource not found');
    });

    it('should handle GitHub API rate limit error', async () => {
      const githubError = {
        response: {
          status: 403,
          data: {
            message: 'API rate limit exceeded',
          },
        },
      };

      mockGitHubClient.createComment.mockRejectedValue(githubError);

      const response = await app.inject({
        method: 'POST',
        url: '/issues/1/comments',
        payload: {
          body: 'This is a test comment',
        },
      });

      expect(response.statusCode).toBe(429);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('RATE_LIMIT_EXCEEDED');
      expect(body.message).toContain('GitHub API rate limit exceeded');
    });

    it('should handle GitHub API validation error', async () => {
      const githubError = {
        response: {
          status: 422,
          data: {
            message: 'Validation Failed',
            errors: [{ field: 'body', code: 'too_short' }],
          },
        },
      };

      mockGitHubClient.createComment.mockRejectedValue(githubError);

      const response = await app.inject({
        method: 'POST',
        url: '/issues/1/comments',
        payload: {
          body: 'x',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toContain('GitHub API validation failed');
    });

    it('should handle network error', async () => {
      const networkError = {
        code: 'ENOTFOUND',
        message: 'getaddrinfo ENOTFOUND api.github.com',
      };

      mockGitHubClient.createComment.mockRejectedValue(networkError);

      const response = await app.inject({
        method: 'POST',
        url: '/issues/1/comments',
        payload: {
          body: 'This is a test comment',
        },
      });

      expect(response.statusCode).toBe(503);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('SERVICE_UNAVAILABLE');
      expect(body.message).toContain('GitHub API is currently unavailable');
    });

    it('should handle unexpected error', async () => {
      const unexpectedError = new Error('Unexpected error');

      mockGitHubClient.createComment.mockRejectedValue(unexpectedError);

      const response = await app.inject({
        method: 'POST',
        url: '/issues/1/comments',
        payload: {
          body: 'This is a test comment',
        },
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('INTERNAL_ERROR');
      expect(body.message).toContain('An unexpected error occurred');
    });

    it('should return 400 for invalid JSON', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/issues/1/comments',
        payload: 'invalid json',
        headers: {
          'content-type': 'application/json',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for missing content-type', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/issues/1/comments',
        payload: {
          body: 'This is a test comment',
        },
        headers: {},
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
