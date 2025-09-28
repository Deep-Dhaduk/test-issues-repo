import nock from 'nock';
import { GitHubClient } from '../../src/services/github-client';

describe('GitHubClient', () => {
  let githubClient: GitHubClient;
  const baseURL = 'https://api.github.com';
  const owner = 'test-owner';
  const repo = 'test-repo';

  beforeEach(() => {
    githubClient = new GitHubClient();
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('createIssue', () => {
    it('should create an issue successfully', async () => {
      const issueData = {
        title: 'Test Issue',
        body: 'Test body',
        labels: ['bug'],
      };

      const mockResponse = {
        number: 1,
        title: 'Test Issue',
        state: 'open',
        body: 'Test body',
        labels: ['bug'],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        html_url: 'https://github.com/test-owner/test-repo/issues/1',
      };

      nock(baseURL)
        .post(`/repos/${owner}/${repo}/issues`)
        .reply(201, mockResponse, {
          'x-ratelimit-limit': '5000',
          'x-ratelimit-remaining': '4999',
          'x-ratelimit-reset': '1640995200',
          'x-ratelimit-used': '1',
        });

      const response = await githubClient.createIssue(issueData);

      expect(response.data).toEqual({
        ...mockResponse,
        labels: ['bug'],
      });
      expect(response.rateLimit.limit).toBe(5000);
      expect(response.rateLimit.remaining).toBe(4999);
    });

    it('should handle rate limit exceeded', async () => {
      const issueData = {
        title: 'Test Issue',
      };

      nock(baseURL)
        .post(`/repos/${owner}/${repo}/issues`)
        .reply(429, {}, {
          'retry-after': '60',
        });

      await expect(githubClient.createIssue(issueData)).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('getIssue', () => {
    it('should get an issue successfully', async () => {
      const issueNumber = 1;
      const mockResponse = {
        number: 1,
        title: 'Test Issue',
        state: 'open',
        body: 'Test body',
        labels: ['bug'],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        html_url: 'https://github.com/test-owner/test-repo/issues/1',
      };

      nock(baseURL)
        .get(`/repos/${owner}/${repo}/issues/${issueNumber}`)
        .reply(200, mockResponse);

      const response = await githubClient.getIssue(issueNumber);

      expect(response.data).toEqual({
        ...mockResponse,
        labels: ['bug'],
      });
    });
  });

  describe('listIssues', () => {
    it('should list issues successfully', async () => {
      const mockResponse = [
        {
          number: 1,
          title: 'Test Issue 1',
          state: 'open',
          body: 'Test body 1',
          labels: ['bug'],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          html_url: 'https://github.com/test-owner/test-repo/issues/1',
        },
        {
          number: 2,
          title: 'Test Issue 2',
          state: 'closed',
          body: 'Test body 2',
          labels: ['enhancement'],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          html_url: 'https://github.com/test-owner/test-repo/issues/2',
        },
      ];

      nock(baseURL)
        .get(`/repos/${owner}/${repo}/issues`)
        .query({ state: 'open', page: '1', per_page: '30' })
        .reply(200, mockResponse, {
          'link': '<https://api.github.com/repos/test-owner/test-repo/issues?page=2>; rel="next"',
          'x-total-count': '2',
        });

      const response = await githubClient.listIssues({
        state: 'open',
        page: 1,
        per_page: 30,
      });

      expect(response.data).toHaveLength(2);
      expect(response.data[0]?.labels).toEqual(['bug']);
      expect(response.data[1]?.labels).toEqual(['enhancement']);
    });
  });

  describe('updateIssue', () => {
    it('should update an issue successfully', async () => {
      const issueNumber = 1;
      const updateData = {
        title: 'Updated Title',
        state: 'closed' as const,
      };

      const mockResponse = {
        number: 1,
        title: 'Updated Title',
        state: 'closed',
        body: 'Test body',
        labels: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        html_url: 'https://github.com/test-owner/test-repo/issues/1',
      };

      nock(baseURL)
        .patch(`/repos/${owner}/${repo}/issues/${issueNumber}`)
        .reply(200, mockResponse);

      const response = await githubClient.updateIssue(issueNumber, updateData);

      expect(response.data).toEqual(mockResponse);
    });
  });

  describe('createComment', () => {
    it('should create a comment successfully', async () => {
      const issueNumber = 1;
      const commentData = {
        body: 'This is a comment',
      };

      const mockResponse = {
        id: 123456,
        body: 'This is a comment',
        user: {
          login: 'test-user',
          id: 1,
          avatar_url: 'https://github.com/images/error/test-user_happy.gif',
        },
        created_at: '2023-01-01T00:00:00Z',
        html_url: 'https://github.com/test-owner/test-repo/issues/1#issuecomment-123456',
      };

      nock(baseURL)
        .post(`/repos/${owner}/${repo}/issues/${issueNumber}/comments`)
        .reply(201, mockResponse);

      const response = await githubClient.createComment(issueNumber, commentData);

      expect(response.data).toEqual(mockResponse);
    });
  });

  describe('getRateLimitInfo', () => {
    it('should return rate limit info after a request', async () => {
      const issueData = {
        title: 'Test Issue',
      };

      nock(baseURL)
        .post(`/repos/${owner}/${repo}/issues`)
        .reply(201, {}, {
          'x-ratelimit-limit': '5000',
          'x-ratelimit-remaining': '4999',
          'x-ratelimit-reset': '1640995200',
          'x-ratelimit-used': '1',
        });

      await githubClient.createIssue(issueData);
      const rateLimit = githubClient.getRateLimitInfo();

      expect(rateLimit).toEqual({
        limit: 5000,
        remaining: 4999,
        reset: 1640995200,
        used: 1,
      });
    });

    it('should return null if no requests have been made', () => {
      const rateLimit = githubClient.getRateLimitInfo();
      expect(rateLimit).toBeNull();
    });
  });
});
