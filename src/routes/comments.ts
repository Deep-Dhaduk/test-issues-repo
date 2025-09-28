import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { GitHubClient } from '../services/github-client';
import { 
  validateCreateCommentRequest, 
  validateIssueNumber 
} from '../utils/validation';
import { handleError } from '../utils/error-handler';

const githubClient = new GitHubClient();

export async function commentRoutes(fastify: FastifyInstance): Promise<void> {
  // Create comment
  fastify.post('/issues/:number/comments', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { number } = request.params as { number: string };
      const issueNumber = validateIssueNumber(number);
      const commentData = validateCreateCommentRequest(request.body);
      const response = await githubClient.createComment(issueNumber, commentData);
      
      reply.status(201);
      return response.data;
    } catch (error) {
      handleError(error, reply);
      return;
    }
  });
}
