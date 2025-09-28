import { GitHubClient } from '../../src/services/github-client';
import { config } from '../../src/config';

// Skip these tests if GitHub token is not available
const skipIfNoToken = process.env['GITHUB_TOKEN'] === 'test-token' ? describe.skip : describe;

skipIfNoToken('GitHub API Integration Tests', () => {
  let githubClient: GitHubClient;
  let createdIssueNumber: number;

  beforeAll(() => {
    githubClient = new GitHubClient();
  });

  describe('Issue CRUD Operations', () => {
    it('should create an issue', async () => {
      const issueData = {
        title: `Test Issue ${Date.now()}`,
        body: 'This is a test issue created by integration tests',
        labels: ['test', 'integration'],
      };

      const response = await githubClient.createIssue(issueData);
      
      expect(response.data.title).toBe(issueData.title);
      expect(response.data.body).toBe(issueData.body);
      expect(response.data.state).toBe('open');
      expect(response.data.labels).toEqual(issueData.labels);
      expect(response.data.html_url).toContain(`/${config.github.owner}/${config.github.repo}/issues/`);
      
      createdIssueNumber = response.data.number;
    }, 10000);

    it('should get the created issue', async () => {
      const response = await githubClient.getIssue(createdIssueNumber);
      
      expect(response.data.number).toBe(createdIssueNumber);
      expect(response.data.title).toContain('Test Issue');
      expect(response.data.state).toBe('open');
    }, 10000);

    it('should list issues', async () => {
      const response = await githubClient.listIssues({
        state: 'open',
        per_page: 10,
      });
      
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      
      const testIssue = response.data.find(issue => issue.number === createdIssueNumber);
      expect(testIssue).toBeDefined();
    }, 10000);

    it('should update the issue', async () => {
      const updateData = {
        title: `Updated Test Issue ${Date.now()}`,
        body: 'This is an updated test issue',
      };

      const response = await githubClient.updateIssue(createdIssueNumber, updateData);
      
      expect(response.data.title).toBe(updateData.title);
      expect(response.data.body).toBe(updateData.body);
      expect(response.data.number).toBe(createdIssueNumber);
    }, 10000);

    it('should close the issue', async () => {
      const updateData = {
        state: 'closed' as const,
      };

      const response = await githubClient.updateIssue(createdIssueNumber, updateData);
      
      expect(response.data.state).toBe('closed');
      expect(response.data.number).toBe(createdIssueNumber);
    }, 10000);

    it('should list closed issues', async () => {
      const response = await githubClient.listIssues({
        state: 'closed',
        per_page: 10,
      });
      
      expect(Array.isArray(response.data)).toBe(true);
      
      const testIssue = response.data.find(issue => issue.number === createdIssueNumber);
      expect(testIssue).toBeDefined();
      expect(testIssue?.state).toBe('closed');
    }, 10000);
  });

  describe('Comment Operations', () => {
    it('should create a comment on the issue', async () => {
      const commentData = {
        body: `Test comment created at ${new Date().toISOString()}`,
      };

      const response = await githubClient.createComment(createdIssueNumber, commentData);
      
      expect(response.data.body).toBe(commentData.body);
      expect(response.data.html_url).toContain(`/${config.github.owner}/${config.github.repo}/issues/${createdIssueNumber}#issuecomment-`);
      expect(response.data.user).toBeDefined();
      expect(response.data.user.login).toBeDefined();
    }, 10000);
  });

  describe('Rate Limiting', () => {
    it('should track rate limit information', async () => {
      const response = await githubClient.listIssues({ per_page: 1 });
      
      expect(response.rateLimit).toBeDefined();
      expect(response.rateLimit.limit).toBeGreaterThan(0);
      expect(response.rateLimit.remaining).toBeGreaterThanOrEqual(0);
      expect(response.rateLimit.used).toBeGreaterThanOrEqual(0);
      expect(response.rateLimit.reset).toBeGreaterThan(0);
    }, 10000);

    it('should provide rate limit info via getRateLimitInfo', async () => {
      await githubClient.listIssues({ per_page: 1 });
      
      const rateLimit = githubClient.getRateLimitInfo();
      expect(rateLimit).toBeDefined();
      expect(rateLimit?.limit).toBeGreaterThan(0);
    }, 10000);
  });

  describe('Error Handling', () => {
    it('should handle non-existent issue', async () => {
      const nonExistentNumber = 999999999;
      
      await expect(githubClient.getIssue(nonExistentNumber)).rejects.toThrow();
    }, 10000);

    it('should handle invalid issue number for comments', async () => {
      const nonExistentNumber = 999999999;
      const commentData = { body: 'Test comment' };
      
      await expect(githubClient.createComment(nonExistentNumber, commentData)).rejects.toThrow();
    }, 10000);
  });
});
