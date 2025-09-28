import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { GitHubClient } from '../services/github-client';
import { 
  validateCreateIssueRequest, 
  validateUpdateIssueRequest, 
  validateIssueNumber,
  validatePaginationParams
} from '../utils/validation';
import { handleError } from '../utils/error-handler';
import { extractPaginationFromResponse } from '../utils/pagination';

const githubClient = new GitHubClient();

export async function issueRoutes(fastify: FastifyInstance): Promise<void> {
  // Create issue
  fastify.post('/issues', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const issueData = validateCreateIssueRequest(request.body);
      const response = await githubClient.createIssue(issueData);
      
      reply.status(201);
      reply.header('Location', `/issues/${response.data.number}`);
      return response.data;
    } catch (error) {
      handleError(error, reply);
      return;
    }
  });

  // List issues
  fastify.get('/issues', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = validatePaginationParams(request.query as Record<string, unknown>);
      const response = await githubClient.listIssues(params);
      
      const paginationHeaders = extractPaginationFromResponse(response);
      
      // Set pagination headers
      if (paginationHeaders['link']) {
        reply.header('Link', paginationHeaders['link']);
      }
      if (paginationHeaders['x-total-count']) {
        reply.header('X-Total-Count', paginationHeaders['x-total-count']);
      }
      
      return response.data;
    } catch (error) {
      handleError(error, reply);
      return;
    }
  });

  // Get single issue
  fastify.get('/issues/:number', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { number } = request.params as { number: string };
      const issueNumber = validateIssueNumber(number);
      const response = await githubClient.getIssue(issueNumber);
      
      return response.data;
    } catch (error) {
      handleError(error, reply);
      return;
    }
  });

  // Update issue
  fastify.patch('/issues/:number', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { number } = request.params as { number: string };
      const issueNumber = validateIssueNumber(number);
      const updateData = validateUpdateIssueRequest(request.body);
      const response = await githubClient.updateIssue(issueNumber, updateData);
      
      return response.data;
    } catch (error) {
      handleError(error, reply);
      return;
    }
  });
}
