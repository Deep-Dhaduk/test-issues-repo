import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/index';
import { GitHubClient } from '../../src/services/github-client';
import { Issue } from '../../src/types';

// Mock GitHubClient
jest.mock('../../src/services/github-client');
const MockedGitHubClient = GitHubClient as jest.MockedClass<typeof GitHubClient>;

describe('Issues Route', () => {
  let app: FastifyInstance;
  let mockGitHubClient: jest.Mocked<GitHubClient>;

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock GitHub client
    mockGitHubClient = {
      createIssue: jest.fn(),
      listIssues: jest.fn(),
      getIssue: jest.fn(),
      updateIssue: jest.fn(),
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

  describe('POST /issues', () => {
    it('should create an issue successfully', async () => {
      const mockIssue: Issue = {
        number: 1,
        title: 'Test Issue',
        state: 'open' as const,
        body: 'This is a test issue',
        labels: ['test', 'bug'],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        html_url: 'https://github.com/owner/repo/issues/1',
      };

      mockGitHubClient.createIssue.mockResolvedValue({
        data: mockIssue,
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
        url: '/issues',
        payload: {
          title: 'Test Issue',
          body: 'This is a test issue',
          labels: ['test', 'bug'],
        },
      });

      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.payload)).toEqual(mockIssue);
      expect(response.headers.location).toBe('/issues/1');
      expect(mockGitHubClient.createIssue).toHaveBeenCalledWith({
        title: 'Test Issue',
        body: 'This is a test issue',
        labels: ['test', 'bug'],
      });
    });

    it('should create an issue with minimal data', async () => {
      const mockIssue: Issue = {
        number: 1,
        title: 'Test Issue',
        state: 'open' as const,
        body: '',
        labels: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        html_url: 'https://github.com/owner/repo/issues/1',
      };

      mockGitHubClient.createIssue.mockResolvedValue({
        data: mockIssue,
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
        url: '/issues',
        payload: {
          title: 'Test Issue',
        },
      });

      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.payload)).toEqual(mockIssue);
      expect(mockGitHubClient.createIssue).toHaveBeenCalledWith({
        title: 'Test Issue',
        body: undefined,
        labels: undefined,
      });
    });

    it('should return 400 for missing title', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/issues',
        payload: {
          body: 'This is a test issue',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toContain('Title is required');
    });

    it('should return 400 for empty title', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/issues',
        payload: {
          title: '',
          body: 'This is a test issue',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toContain('Title is required');
    });

    it('should return 400 for invalid labels', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/issues',
        payload: {
          title: 'Test Issue',
          labels: 'invalid',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toContain('Labels must be an array of strings');
    });

    it('should handle GitHub API error', async () => {
      const githubError = {
        response: {
          status: 422,
          data: {
            message: 'Validation Failed',
            errors: [{ field: 'title', code: 'too_short' }],
          },
        },
      };

      mockGitHubClient.createIssue.mockRejectedValue(githubError);

      const response = await app.inject({
        method: 'POST',
        url: '/issues',
        payload: {
          title: 'x',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toContain('GitHub API validation failed');
    });
  });

  describe('GET /issues', () => {
    it('should list issues successfully', async () => {
      const mockIssues: Issue[] = [
        {
          number: 1,
          title: 'Test Issue 1',
          state: 'open' as const,
          body: 'Test issue body 1',
          labels: ['test'],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          html_url: 'https://github.com/owner/repo/issues/1',
        },
        {
          number: 2,
          title: 'Test Issue 2',
          state: 'closed' as const,
          body: 'Test issue body 2',
          labels: ['bug'],
          created_at: '2023-01-02T00:00:00Z',
          updated_at: '2023-01-02T00:00:00Z',
          html_url: 'https://github.com/owner/repo/issues/2',
        },
      ];

      mockGitHubClient.listIssues.mockResolvedValue({
        data: mockIssues,
        headers: {
          'link': '<https://api.github.com/repos/owner/repo/issues?page=2>; rel="next", <https://api.github.com/repos/owner/repo/issues?page=5>; rel="last"',
        },
        rateLimit: {
          limit: 5000,
          remaining: 4999,
          reset: Date.now() + 3600000,
          used: 1,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/issues?state=open&page=1&per_page=10',
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual(mockIssues);
      expect(mockGitHubClient.listIssues).toHaveBeenCalledWith({
        state: 'open',
        page: 1,
        per_page: 10,
        labels: undefined,
      });
    });

    it('should list issues with default parameters', async () => {
      const mockIssues: Issue[] = [];

      mockGitHubClient.listIssues.mockResolvedValue({
        data: mockIssues,
        headers: {},
        rateLimit: {
          limit: 5000,
          remaining: 4999,
          reset: Date.now() + 3600000,
          used: 1,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/issues',
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual(mockIssues);
      expect(mockGitHubClient.listIssues).toHaveBeenCalledWith({
        state: 'open',
        page: 1,
        per_page: 30,
        labels: undefined,
      });
    });

    it('should return 400 for invalid state', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/issues?state=invalid',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toContain('State must be one of: open, closed, all');
    });

    it('should return 400 for invalid page', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/issues?page=0',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toContain('Page must be a positive integer');
    });

    it('should return 400 for invalid per_page', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/issues?per_page=101',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toContain('Per page must be between 1 and 100');
    });

    it('should handle GitHub API error', async () => {
      const githubError = {
        response: {
          status: 403,
          data: {
            message: 'API rate limit exceeded',
          },
        },
      };

      mockGitHubClient.listIssues.mockRejectedValue(githubError);

      const response = await app.inject({
        method: 'GET',
        url: '/issues',
      });

      expect(response.statusCode).toBe(429);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('RATE_LIMIT_EXCEEDED');
      expect(body.message).toContain('GitHub API rate limit exceeded');
    });
  });

  describe('GET /issues/:number', () => {
    it('should get issue successfully', async () => {
      const mockIssue: Issue = {
        number: 1,
        title: 'Test Issue',
        state: 'open' as const,
        body: 'This is a test issue',
        labels: ['test'],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        html_url: 'https://github.com/owner/repo/issues/1',
      };

      mockGitHubClient.getIssue.mockResolvedValue({
        data: mockIssue,
        headers: {},
        rateLimit: {
          limit: 5000,
          remaining: 4999,
          reset: Date.now() + 3600000,
          used: 1,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/issues/1',
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual(mockIssue);
      expect(mockGitHubClient.getIssue).toHaveBeenCalledWith(1);
    });

    it('should return 400 for invalid issue number', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/issues/invalid',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toContain('Issue number must be a positive integer');
    });

    it('should handle GitHub API 404 error', async () => {
      const githubError = {
        response: {
          status: 404,
          data: {
            message: 'Not Found',
          },
        },
      };

      mockGitHubClient.getIssue.mockRejectedValue(githubError);

      const response = await app.inject({
        method: 'GET',
        url: '/issues/999',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('NOT_FOUND');
      expect(body.message).toContain('GitHub resource not found');
    });
  });

  describe('PATCH /issues/:number', () => {
    it('should update issue successfully', async () => {
      const mockIssue: Issue = {
        number: 1,
        title: 'Updated Issue',
        state: 'closed' as const,
        body: 'Updated body',
        labels: ['updated'],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T01:00:00Z',
        html_url: 'https://github.com/owner/repo/issues/1',
      };

      mockGitHubClient.updateIssue.mockResolvedValue({
        data: mockIssue,
        headers: {},
        rateLimit: {
          limit: 5000,
          remaining: 4999,
          reset: Date.now() + 3600000,
          used: 1,
        },
      });

      const response = await app.inject({
        method: 'PATCH',
        url: '/issues/1',
        payload: {
          title: 'Updated Issue',
          state: 'closed',
          body: 'Updated body',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual(mockIssue);
      expect(mockGitHubClient.updateIssue).toHaveBeenCalledWith(1, {
        title: 'Updated Issue',
        state: 'closed',
        body: 'Updated body',
      });
    });

    it('should update issue with partial data', async () => {
      const mockIssue: Issue = {
        number: 1,
        title: 'Test Issue',
        state: 'closed' as const,
        body: 'This is a test issue',
        labels: ['test'],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T01:00:00Z',
        html_url: 'https://github.com/owner/repo/issues/1',
      };

      mockGitHubClient.updateIssue.mockResolvedValue({
        data: mockIssue,
        headers: {},
        rateLimit: {
          limit: 5000,
          remaining: 4999,
          reset: Date.now() + 3600000,
          used: 1,
        },
      });

      const response = await app.inject({
        method: 'PATCH',
        url: '/issues/1',
        payload: {
          state: 'closed',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual(mockIssue);
      expect(mockGitHubClient.updateIssue).toHaveBeenCalledWith(1, {
        state: 'closed',
      });
    });

    it('should return 400 for invalid issue number', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/issues/invalid',
        payload: {
          title: 'Updated Issue',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toContain('Issue number must be a positive integer');
    });

    it('should return 400 for invalid state', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/issues/1',
        payload: {
          state: 'invalid',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toContain('State must be one of: open, closed');
    });

    it('should handle GitHub API error', async () => {
      const githubError = {
        response: {
          status: 422,
          data: {
            message: 'Validation Failed',
            errors: [{ field: 'title', code: 'too_short' }],
          },
        },
      };

      mockGitHubClient.updateIssue.mockRejectedValue(githubError);

      const response = await app.inject({
        method: 'PATCH',
        url: '/issues/1',
        payload: {
          title: 'x',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toContain('GitHub API validation failed');
    });
  });
});
