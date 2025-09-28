export interface Issue {
  number: number;
  title: string;
  state: 'open' | 'closed';
  body: string | null;
  labels: string[];
  created_at: string;
  updated_at: string;
  html_url: string;
}

export interface CreateIssueRequest {
  title: string;
  body?: string | undefined;
  labels?: string[] | undefined;
}

export interface UpdateIssueRequest {
  title?: string | undefined;
  body?: string | undefined;
  state?: 'open' | 'closed' | undefined;
}

export interface Comment {
  id: number;
  body: string;
  user: User;
  created_at: string;
  html_url: string;
}

export interface CreateCommentRequest {
  body: string;
}

export interface User {
  login: string;
  id: number;
  avatar_url: string;
}

export interface WebhookEvent {
  id: string;
  event: string;
  action: string;
  issue_number?: number | undefined;
  timestamp: string;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
}

export interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, unknown> | undefined;
}

export interface GitHubRateLimit {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}

export interface GitHubApiResponse<T> {
  data: T;
  headers: Record<string, string>;
  rateLimit: GitHubRateLimit;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
  state?: 'open' | 'closed' | 'all';
  labels?: string;
}

export interface PaginationHeaders {
  link?: string;
  'x-total-count'?: string;
}
