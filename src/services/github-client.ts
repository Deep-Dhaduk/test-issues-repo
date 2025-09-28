import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { config } from '../config';
import { 
  Issue, 
  CreateIssueRequest, 
  UpdateIssueRequest, 
  Comment, 
  CreateCommentRequest,
  GitHubApiResponse,
  GitHubRateLimit,
  PaginationParams
} from '../types';

export class GitHubClient {
  private client: AxiosInstance;
  private rateLimit: GitHubRateLimit | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        'Authorization': `Bearer ${config.github.token}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'github-issues-service/1.0.0',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    // Add response interceptor to track rate limits
    this.client.interceptors.response.use(
      (response) => {
        this.updateRateLimit(response);
        return response;
      },
      (error) => {
        if (error.response) {
          this.updateRateLimit(error.response);
        }
        return Promise.reject(error);
      }
    );
  }

  private updateRateLimit(response: AxiosResponse): void {
    const headers = response.headers;
    this.rateLimit = {
      limit: parseInt(headers['x-ratelimit-limit'] || '0', 10),
      remaining: parseInt(headers['x-ratelimit-remaining'] || '0', 10),
      reset: parseInt(headers['x-ratelimit-reset'] || '0', 10),
      used: parseInt(headers['x-ratelimit-used'] || '0', 10),
    };
  }

  private getRateLimit(): GitHubRateLimit | null {
    return this.rateLimit;
  }

  private checkRateLimit(): void {
    const rateLimit = this.getRateLimit();
    if (rateLimit && rateLimit.remaining <= 0) {
      const resetTime = new Date(rateLimit.reset * 1000);
      const retryAfter = Math.ceil((resetTime.getTime() - Date.now()) / 1000);
      throw new Error(`Rate limit exceeded. Retry after ${retryAfter} seconds`);
    }
  }

  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PATCH',
    url: string,
    data?: unknown
  ): Promise<GitHubApiResponse<T>> {
    this.checkRateLimit();

    try {
      const response = await this.client.request({
        method,
        url,
        data,
      });

      return {
        data: response.data,
        headers: response.headers as Record<string, string>,
        rateLimit: this.getRateLimit()!,
      };
    } catch (error: any) {
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        throw new Error(`Rate limit exceeded. Retry after ${retryAfter} seconds`);
      }
      throw error;
    }
  }

  async createIssue(issueData: CreateIssueRequest): Promise<GitHubApiResponse<Issue>> {
    return this.makeRequest<Issue>(
      'POST',
      `/repos/${config.github.owner}/${config.github.repo}/issues`,
      issueData
    );
  }

  async getIssue(number: number): Promise<GitHubApiResponse<Issue>> {
    return this.makeRequest<Issue>(
      'GET',
      `/repos/${config.github.owner}/${config.github.repo}/issues/${number}`
    );
  }

  async listIssues(params: PaginationParams = {}): Promise<GitHubApiResponse<Issue[]>> {
    const searchParams = new URLSearchParams();
    
    if (params.state) searchParams.append('state', params.state);
    if (params.labels) searchParams.append('labels', params.labels);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.per_page) searchParams.append('per_page', params.per_page.toString());

    const queryString = searchParams.toString();
    const url = `/repos/${config.github.owner}/${config.github.repo}/issues${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest<Issue[]>('GET', url);
  }

  async updateIssue(number: number, updateData: UpdateIssueRequest): Promise<GitHubApiResponse<Issue>> {
    return this.makeRequest<Issue>(
      'PATCH',
      `/repos/${config.github.owner}/${config.github.repo}/issues/${number}`,
      updateData
    );
  }

  async createComment(issueNumber: number, commentData: CreateCommentRequest): Promise<GitHubApiResponse<Comment>> {
    return this.makeRequest<Comment>(
      'POST',
      `/repos/${config.github.owner}/${config.github.repo}/issues/${issueNumber}/comments`,
      commentData
    );
  }

  getRateLimitInfo(): GitHubRateLimit | null {
    return this.getRateLimit();
  }
}
