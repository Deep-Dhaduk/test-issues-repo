# Design Documentation

## Architecture Overview

The GitHub Issues Service is built as a microservice that acts as a wrapper around the GitHub REST API, providing a clean HTTP interface for issue management with webhook handling capabilities.

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client Apps   │    │  GitHub Issues   │    │   GitHub API    │
│                 │    │     Service      │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │ HTTP/REST             │ HTTP/REST             │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   API Gateway   │    │   Fastify App    │    │   GitHub API    │
│   (Optional)    │    │                  │    │   Endpoints     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   SQLite DB      │
                       │  (Event Store)   │
                       └──────────────────┘
```

## Core Components

### 1. API Layer (Fastify)
- **Framework**: Fastify for high-performance HTTP server
- **Features**: 
  - Automatic request/response validation
  - Swagger/OpenAPI documentation
  - CORS and security headers
  - Rate limiting
  - Error handling middleware

### 2. GitHub Client Service
- **Purpose**: Abstracts GitHub API interactions
- **Features**:
  - Authentication with Bearer tokens
  - Rate limit tracking and handling
  - Request/response transformation
  - Error mapping and propagation

### 3. Webhook Handler
- **Security**: HMAC-SHA256 signature verification
- **Processing**: Asynchronous event processing
- **Storage**: Event persistence for debugging and monitoring

### 4. Event Store
- **Database**: SQLite for simplicity and portability
- **Schema**: Optimized for webhook event storage
- **Features**: Event deduplication and querying

## Error Mapping Strategy

### GitHub API Error Mapping

| GitHub Status | Service Status | Error Code | Description |
|---------------|----------------|------------|-------------|
| 400 | 400 | VALIDATION_ERROR | Invalid request data |
| 401 | 401 | UNAUTHORIZED | Invalid or missing token |
| 403 | 403 | FORBIDDEN | Insufficient permissions |
| 404 | 404 | NOT_FOUND | Resource not found |
| 422 | 400 | VALIDATION_ERROR | GitHub validation errors |
| 429 | 429 | RATE_LIMIT_EXCEEDED | Rate limit exceeded |
| 5xx | 503 | SERVICE_UNAVAILABLE | GitHub service unavailable |

### Error Response Format

```json
{
  "error": "ERROR_CODE",
  "message": "Human readable message",
  "details": {
    "field": "additional_context"
  }
}
```

## Pagination Strategy

### GitHub API Pagination
- **Implementation**: Forward GitHub's Link headers
- **Headers**: 
  - `Link`: Pagination links (first, prev, next, last)
  - `X-Total-Count`: Total number of items (when available)

### Client Pagination
- **Parameters**: `page`, `per_page`, `state`, `labels`
- **Validation**: 
  - `page`: Positive integer, default 1
  - `per_page`: 1-100, default 30
  - `state`: "open", "closed", "all", default "open"

### Example Response Headers
```
Link: <https://api.github.com/repos/owner/repo/issues?page=2>; rel="next", <https://api.github.com/repos/owner/repo/issues?page=5>; rel="last"
X-Total-Count: 150
```

## Webhook Deduplication

### Strategy
- **Primary Key**: GitHub delivery ID (`x-github-delivery` header)
- **Database**: SQLite with `INSERT OR REPLACE` for idempotency
- **Processing**: Asynchronous to prevent blocking

### Event Schema
```sql
CREATE TABLE webhook_events (
  id TEXT PRIMARY KEY,           -- GitHub delivery ID
  event TEXT NOT NULL,           -- Event type (issues, issue_comment)
  action TEXT NOT NULL,          -- Action (opened, closed, created)
  issue_number INTEGER,          -- Related issue number
  timestamp TEXT NOT NULL,       -- Event timestamp
  payload TEXT NOT NULL,         -- Full webhook payload
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Deduplication Logic
1. Extract delivery ID from webhook headers
2. Check if event already exists in database
3. If exists, skip processing (idempotent)
4. If new, store event and process asynchronously

## Security Trade-offs

### HMAC Signature Verification
- **Algorithm**: HMAC-SHA256
- **Implementation**: Constant-time comparison to prevent timing attacks
- **Secret**: Environment variable, not stored in code

### Rate Limiting
- **Client Rate Limiting**: 100 requests/minute per IP
- **GitHub Rate Limiting**: Respect GitHub's rate limits
- **Webhook Rate Limiting**: 5 requests/minute per IP

### Input Validation
- **Schema Validation**: Zod for request/response validation
- **Sanitization**: No HTML/script injection prevention (GitHub handles this)
- **Size Limits**: 
  - Title: 200 characters
  - Body: 65,536 characters
  - Labels: Array of strings

### Error Information Disclosure
- **Production**: Generic error messages
- **Development**: Detailed error information
- **Logging**: Full error details in logs (not exposed to clients)

## Performance Considerations

### Caching Strategy
- **No Caching**: Real-time data from GitHub API
- **Future Enhancement**: ETag-based conditional requests
- **Database**: SQLite with proper indexing

### Database Optimization
```sql
-- Indexes for common queries
CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at);
CREATE INDEX idx_webhook_events_event_action ON webhook_events(event, action);
CREATE INDEX idx_webhook_events_issue_number ON webhook_events(issue_number);
```

### Memory Management
- **Event Storage**: Bounded by disk space (SQLite)
- **Rate Limit Tracking**: In-memory, resets on restart
- **Request Processing**: Stateless, no memory leaks

## Monitoring and Observability

### Health Checks
- **Endpoint**: `/healthz`
- **Response**: Service status, uptime, timestamp
- **Docker**: Built-in health check configuration

### Logging
- **Format**: Structured JSON logs
- **Levels**: Debug (dev), Info (prod)
- **Fields**: Request ID, delivery ID, timestamps, errors

### Metrics (Future Enhancement)
- Request count and duration
- GitHub API rate limit usage
- Webhook event processing metrics
- Error rates by endpoint

## Deployment Considerations

### Environment Configuration
- **Development**: Local SQLite, debug logging
- **Production**: Persistent storage, info logging, security headers

### Docker Configuration
- **Base Image**: Node.js 18 Alpine
- **Security**: Non-root user, minimal attack surface
- **Health Checks**: Built-in container health monitoring

### Scaling Considerations
- **Stateless**: Horizontal scaling possible
- **Database**: SQLite limits to single instance
- **Future**: PostgreSQL for multi-instance deployment

## API Design Principles

### RESTful Design
- **Resources**: Issues, Comments, Events
- **HTTP Methods**: GET, POST, PATCH (no DELETE for issues)
- **Status Codes**: Standard HTTP status codes
- **Content Types**: JSON only

### Consistency
- **Error Format**: Consistent across all endpoints
- **Response Format**: Standardized issue/comment objects
- **Pagination**: Consistent header-based pagination

### Usability
- **Documentation**: Interactive OpenAPI documentation
- **Examples**: Comprehensive request/response examples
- **Validation**: Clear validation error messages

## Future Enhancements

### Short Term
- Conditional GET with ETag support
- Enhanced error messages with GitHub context
- Webhook event filtering and routing

### Medium Term
- PostgreSQL support for multi-instance deployment
- Metrics and monitoring dashboard
- Webhook event replay functionality

### Long Term
- Multi-repository support
- Advanced webhook filtering
- Integration with external systems
- GraphQL API support

## Testing Strategy

### Unit Tests
- **Coverage Target**: 80%+ line coverage
- **Focus**: Business logic, validation, error handling
- **Mocking**: External dependencies (GitHub API, database)

### Integration Tests
- **API Tests**: End-to-end HTTP request/response testing
- **GitHub API Tests**: Real API integration (with test token)
- **Webhook Tests**: Signature verification and event processing

### Test Data Management
- **Fixtures**: Reusable test data
- **Isolation**: Each test runs independently
- **Cleanup**: Automatic cleanup of test data

## Security Considerations

### Authentication
- **GitHub Token**: Fine-grained PAT with minimal scopes
- **Token Storage**: Environment variables only
- **Token Rotation**: Manual process (future: automatic)

### Webhook Security
- **Signature Verification**: HMAC-SHA256 with constant-time comparison
- **Secret Management**: Environment variable, not in code
- **Event Validation**: Validate event types and payload structure

### Data Protection
- **No PII Storage**: Only issue metadata, no user data
- **Logging**: No sensitive data in logs
- **Database**: Local SQLite, not exposed externally

This design provides a robust, secure, and maintainable service that meets all the specified requirements while being extensible for future enhancements.
