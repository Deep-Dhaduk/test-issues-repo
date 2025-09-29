# GitHub Issues Service

A comprehensive service that wraps the GitHub REST API for Issues with webhook handling, built with Node.js, TypeScript, and Fastify.

## 📋 Assignment Requirements & Team Division

### **Nihar Patel (019158958) - Core Issues API & GitHub Integration**

**Focus: Issues CRUD, GitHub API, Error Handling, OpenAPI Contract**

**Deliverables:**

- ✅ **POST /issues** - Create GitHub issues with validation
- ✅ **GET /issues** - List issues with pagination (state, labels, page, per_page)
- ✅ **GET /issues/{number}** - Retrieve single issue
- ✅ **PATCH /issues/{number}** - Update issues (title, body, state)
- ✅ **GitHub API Integration** - Authentication, rate limiting, error mapping
- ✅ **OpenAPI 3.1 Contract** - Complete specification with examples
- ✅ **Error Handling** - GitHub API errors → clear error messages
- ✅ **Unit Tests** - Issues routes, GitHub client, validation (80%+ coverage)
- ✅ **Integration Tests** - End-to-end GitHub API testing

**Key Files:**

- `src/routes/issues.ts` - Main CRUD operations
- `src/services/github-client.ts` - GitHub API integration
- `src/utils/error-handler.ts` - Error mapping
- `src/utils/validation.ts` - Input validation
- `openapi.yaml` - API specification
- `tests/unit/issues.test.ts` - Route tests
- `tests/unit/github-client.test.ts` - API client tests

---

### **Kalhar Patel (019140511) - Comments API & Utilities**

**Focus: Comments, Pagination, Health Monitoring, TypeScript**

**Deliverables:**

- ✅ **POST /issues/{number}/comments** - Add comments to issues
- ✅ **Pagination Utilities** - Link header parsing and creation
- ✅ **GET /healthz** - Health check endpoint
- ✅ **TypeScript Definitions** - All interfaces and types
- ✅ **Rate Limiting** - GitHub rate limit handling
- ✅ **Unit Tests** - Comments routes, pagination utilities
- ✅ **HTTP Semantics** - Proper status codes and headers

**Key Files:**

- `src/routes/comments.ts` - Comments API
- `src/routes/health.ts` - Health monitoring
- `src/utils/pagination.ts` - Pagination utilities
- `src/types/index.ts` - TypeScript definitions
- `tests/unit/comments.test.ts` - Comments tests
- `tests/unit/pagination.test.ts` - Pagination tests

---

### **Deep Dhaduk (018317078) - Webhooks & Security**

**Focus: Webhook Processing, Event Storage, Security, Monitoring**

**Deliverables:**

- ✅ **POST /webhook** - Webhook endpoint with HMAC verification
- ✅ **GET /events** - Event retrieval for debugging
- ✅ **HMAC SHA-256 Verification** - Webhook signature validation
- ✅ **Event Storage** - SQLite persistence for webhook events
- ✅ **Security Implementation** - Constant-time comparison, no secret logging
- ✅ **Idempotency** - Safe webhook re-processing
- ✅ **Unit Tests** - Webhook processing, security, event storage
- ✅ **Integration Tests** - Real webhook testing with ngrok

**Key Files:**

- `src/routes/webhooks.ts` - Webhook processing
- `src/routes/events.ts` - Event retrieval
- `src/services/webhook-verifier.ts` - HMAC verification
- `src/services/event-store.ts` - Event persistence
- `tests/unit/webhooks.test.ts` - Webhook tests
- `tests/unit/webhook-verifier.test.ts` - Security tests
- `tests/unit/event-store.test.ts` - Storage tests

---

## 🎯 **Assignment Compliance Checklist**

### **Required API Endpoints:**

- ✅ POST /issues (201 Created, Location header)
- ✅ GET /issues (200 OK, pagination headers)
- ✅ GET /issues/{number} (200 OK, 404 Not Found)
- ✅ PATCH /issues/{number} (200 OK, 400/404 errors)
- ✅ POST /issues/{number}/comments (201 Created)
- ✅ POST /webhook (204 No Content, HMAC verification)
- ✅ GET /events (200 OK, debugging endpoint)
- ✅ GET /healthz (Health check)

### **Non-Functional Requirements:**

- ✅ **Idempotency** - Safe webhook re-processing
- ✅ **Rate Limiting** - GitHub rate limit handling
- ✅ **Pagination** - Link header forwarding
- ✅ **Observability** - Structured logs, request IDs
- ✅ **Security** - HMAC verification, constant-time comparison

### **Testing Requirements:**

- ✅ **Unit Tests** - 80%+ line coverage
- ✅ **Integration Tests** - Real GitHub API testing
- ✅ **Webhook Testing** - ngrok tunnel testing
- ✅ **Error Testing** - GitHub API error mapping

### **Documentation & Deployment:**

- ✅ **OpenAPI 3.1** - Complete specification
- ✅ **README.md** - Setup, examples, webhook instructions
- ✅ **Dockerfile** - Production-ready containerization
- ✅ **Environment Variables** - Secure configuration

## Features

- **Complete CRUD Operations** for GitHub Issues and Comments
- **Webhook Handling** with HMAC signature verification
- **OpenAPI 3.1 Specification** with interactive documentation
- **Comprehensive Testing** (Unit + Integration tests)
- **Rate Limiting** and error handling
- **Docker Support** with production-ready configuration
- **Event Storage** for webhook debugging and monitoring

## Quick Start

### Prerequisites

- Node.js 18+
- Docker (optional)
- GitHub Personal Access Token (Fine-Grained PAT recommended)

### 1. Clone and Install

```bash
git clone <repository-url>
cd github-issues-service
npm install
```

### 2. Environment Setup

Copy the example environment file and configure:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# GitHub API Configuration
GITHUB_TOKEN=your_fine_grained_pat_here
GITHUB_OWNER=your_username
GITHUB_REPO=your_test_repo

# Webhook Configuration
WEBHOOK_SECRET=your_webhook_secret_here

# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration (SQLite)
DATABASE_PATH=./data/events.db
```

### 3. Run the Service

#### Development Mode

```bash
npm run dev
```

#### Production Mode

```bash
npm run build
npm start
```

#### Using Docker

```bash
# Build image
make docker:build

# Run container
make docker:run

# Or use docker-compose
docker-compose up -d
```

### 4. Access the Service

- **API Base URL**: `http://localhost:3000`
- **Interactive Documentation**: `http://localhost:3000/docs`
- **Health Check**: `http://localhost:3000/healthz`

## API Endpoints

### Issues

| Method  | Endpoint           | Description                   |
| ------- | ------------------ | ----------------------------- |
| `POST`  | `/issues`          | Create a new issue            |
| `GET`   | `/issues`          | List issues (with pagination) |
| `GET`   | `/issues/{number}` | Get a specific issue          |
| `PATCH` | `/issues/{number}` | Update an issue               |

### Comments

| Method | Endpoint                    | Description               |
| ------ | --------------------------- | ------------------------- |
| `POST` | `/issues/{number}/comments` | Add a comment to an issue |

### Webhooks

| Method | Endpoint   | Description             |
| ------ | ---------- | ----------------------- |
| `POST` | `/webhook` | GitHub webhook endpoint |

### Events

| Method | Endpoint  | Description                   |
| ------ | --------- | ----------------------------- |
| `GET`  | `/events` | List processed webhook events |

### Health

| Method | Endpoint   | Description           |
| ------ | ---------- | --------------------- |
| `GET`  | `/healthz` | Service health status |

## Complete Step-by-Step Testing Guide

### Prerequisites for Testing

1. **Start the Service** (choose one method):

   **Option A: Docker (Recommended)**

   ```bash
   docker run -p 3001:3000 --env-file .env github-issues-service
   ```

   **Option B: Development Mode**

   ```bash
   npm run dev
   ```

2. **Verify Service is Running**
   - Open browser: `http://localhost:3001/healthz`
   - Should return: `{"status":"healthy","timestamp":"...","uptime":...}`

### API Testing with Postman

**Base URL:** `http://localhost:3001`

#### 1. Health Check

- **Method:** `GET`
- **URL:** `http://localhost:3001/healthz`
- **Expected Response:** 200 OK with health status

#### 2. Create Issue

- **Method:** `POST`
- **URL:** `http://localhost:3001/issues`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**

```json
{
  "title": "Test Issue from Postman",
  "body": "This is a test issue created via Postman API",
  "labels": ["test", "api", "postman"]
}
```

- **Expected Response:** 201 Created with issue details
- **Note:** Save the `number` field from response for next tests

#### 3. List Issues

- **Method:** `GET`
- **URL:** `http://localhost:3001/issues`
- **Query Parameters (optional):**
  - `state=open` (default: open, options: open, closed, all)
  - `page=1` (default: 1)
  - `per_page=30` (default: 30, max: 100)
  - `labels=test,api` (comma-separated)
- **Expected Response:** 200 OK with array of issues

#### 4. Get Specific Issue

- **Method:** `GET`
- **URL:** `http://localhost:3001/issues/{number}`
- **Replace `{number}` with actual issue number from step 2**
- **Expected Response:** 200 OK with issue details

#### 5. Update Issue

- **Method:** `PATCH`
- **URL:** `http://localhost:3001/issues/{number}`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**

```json
{
  "title": "Updated Issue Title",
  "body": "Updated issue description",
  "state": "closed"
}
```

- **Expected Response:** 200 OK with updated issue details

#### 6. Add Comment to Issue

- **Method:** `POST`
- **URL:** `http://localhost:3001/issues/{number}/comments`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**

```json
{
  "body": "This is a test comment added via Postman API"
}
```

- **Expected Response:** 201 Created with comment details

#### 7. List Webhook Events

- **Method:** `GET`
- **URL:** `http://localhost:3001/events`
- **Query Parameters (optional):**
  - `limit=50` (default: 50, max: 100)
- **Expected Response:** 200 OK with array of webhook events

#### 8. API Documentation

- **Method:** `GET`
- **URL:** `http://localhost:3001/docs`
- **Expected Response:** 302 Redirect to Swagger UI

#### 9. OpenAPI Specification

- **Method:** `GET`
- **URL:** `http://localhost:3001/docs/json`
- **Expected Response:** 200 OK with OpenAPI JSON spec

### Testing Sequence

**Recommended testing order:**

1. **Health Check** → Verify service is running
2. **Create Issue** → Create a test issue
3. **List Issues** → Verify issue appears in list
4. **Get Specific Issue** → Retrieve the created issue
5. **Add Comment** → Add a comment to the issue
6. **Update Issue** → Modify the issue (e.g., close it)
7. **List Events** → Check for any webhook events
8. **API Documentation** → Verify Swagger UI works

### Error Testing

Test error scenarios:

#### Invalid Issue Creation

- **Method:** `POST`
- **URL:** `http://localhost:3001/issues`
- **Body:** `{"title": ""}` (empty title)
- **Expected Response:** 400 Bad Request

#### Invalid Issue Number

- **Method:** `GET`
- **URL:** `http://localhost:3001/issues/invalid`
- **Expected Response:** 400 Bad Request

#### Non-existent Issue

- **Method:** `GET`
- **URL:** `http://localhost:3001/issues/99999`
- **Expected Response:** 404 Not Found

### cURL Examples

#### Create an Issue

```bash
curl -X POST http://localhost:3001/issues \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Feature Request",
    "body": "Please implement this new feature",
    "labels": ["enhancement", "feature"]
  }'
```

#### List Issues

```bash
curl "http://localhost:3001/issues?state=open&page=1&per_page=10"
```

#### Update an Issue

```bash
curl -X PATCH http://localhost:3001/issues/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "state": "closed"
  }'
```

#### Add a Comment

```bash
curl -X POST http://localhost:3001/issues/1/comments \
  -H "Content-Type: application/json" \
  -d '{
    "body": "This is a comment on the issue"
  }'
```

#### Health Check

```bash
curl http://localhost:3001/healthz
```

### Postman Collection Setup

1. **Create New Collection:** "GitHub Issues Service"
2. **Set Base URL:** `http://localhost:3001`
3. **Add all endpoints above as requests**
4. **Test each endpoint in sequence**
5. **Save successful responses for documentation**

### Troubleshooting

**Common Issues:**

- **Connection Refused:** Service not running or wrong port
- **401 Unauthorized:** Invalid GitHub token in `.env`
- **500 Internal Error:** Check service logs for details
- **404 Not Found:** Wrong endpoint URL or issue number

**Debug Steps:**

1. Check service logs: `docker logs <container-id>`
2. Verify environment variables in `.env`
3. Test health endpoint first
4. Check GitHub token permissions
5. Verify repository exists and is accessible

## 📋 Complete Testing Checklist

### Phase 1: Service Setup ✅

- [ ] Clone repository and install dependencies
- [ ] Configure `.env` file with GitHub credentials
- [ ] Start service using Docker or npm
- [ ] Verify service is running (health check)

### Phase 2: Basic API Testing ✅

- [ ] **Health Check** - GET `/healthz` → 200 OK
- [ ] **Create Issue** - POST `/issues` → 201 Created
- [ ] **List Issues** - GET `/issues` → 200 OK
- [ ] **Get Issue** - GET `/issues/{number}` → 200 OK
- [ ] **Update Issue** - PATCH `/issues/{number}` → 200 OK
- [ ] **Add Comment** - POST `/issues/{number}/comments` → 201 Created
- [ ] **List Events** - GET `/events` → 200 OK

### Phase 3: API Documentation Testing ✅

- [ ] **Swagger UI** - GET `/docs` → 302 Redirect
- [ ] **OpenAPI Spec** - GET `/docs/json` → 200 OK

### Phase 4: Error Handling Testing ✅

- [ ] **Invalid Issue Creation** - POST `/issues` with empty title → 400 Bad Request
- [ ] **Invalid Issue Number** - GET `/issues/invalid` → 400 Bad Request
- [ ] **Non-existent Issue** - GET `/issues/99999` → 404 Not Found

### Phase 5: Advanced Testing ✅

- [ ] **Pagination** - GET `/issues?page=1&per_page=5` → 200 OK
- [ ] **Filtering** - GET `/issues?state=closed` → 200 OK
- [ ] **Labels** - GET `/issues?labels=bug,enhancement` → 200 OK

### Phase 6: Screenshots for Documentation 📸

- [ ] **Service Health Check** - Screenshot of health endpoint response
- [ ] **API Documentation** - Screenshot of Swagger UI
- [ ] **Issue Creation** - Screenshot of successful issue creation
- [ ] **Issue List** - Screenshot of issues list
- [ ] **Postman Collection** - Screenshot of all API endpoints in Postman
- [ ] **Error Response** - Screenshot of error handling

### Phase 7: Webhook Testing (Optional) 🔗

- [ ] **Setup ngrok** - Expose local service
- [ ] **Configure GitHub Webhook** - Point to ngrok URL
- [ ] **Test Webhook Delivery** - Create issue in GitHub
- [ ] **Verify Event Storage** - Check `/events` endpoint

## 📝 Documentation Template

Use this template for your submission document:

### 1. Title Page

- **Assignment:** GitHub Issues Service - Assignment #2
- **Student:** [Your Name]
- **Course:** CMPE 272
- **Date:** [Current Date]

### 2. Introduction

- Brief overview of the service
- Technologies used (Node.js, TypeScript, Fastify, Docker)
- Key features implemented

### 3. Screenshots Section

- **Service Health Check** - Show service is running
- **API Documentation** - Swagger UI interface
- **Issue Creation** - Successful API call and response
- **Issue Management** - List, update, comment operations
- **Error Handling** - Validation and error responses
- **Postman Collection** - All endpoints organized

### 4. Technical Implementation

- **API Endpoints** - Complete list with examples
- **Database Schema** - SQLite event storage
- **Security Features** - HMAC verification, rate limiting
- **Testing Coverage** - Unit and integration tests

### 5. Testing Results

- **Test Coverage Report** - Screenshot of coverage metrics
- **API Testing** - Successful endpoint testing
- **Error Scenarios** - Validation and error handling
- **Docker Deployment** - Container running successfully

### 6. Conclusion

- **Features Completed** - All required functionality
- **Testing Results** - Comprehensive test coverage
- **Deployment Ready** - Docker container working
- **Documentation** - Complete API documentation

## Webhook Setup

### 1. Configure GitHub Webhook

1. Go to your repository settings
2. Navigate to "Webhooks" section
3. Click "Add webhook"
4. Set the following:
   - **Payload URL**: `https://your-domain.com/webhook`
   - **Content type**: `application/json`
   - **Secret**: Use the same value as `WEBHOOK_SECRET` in your `.env`
   - **Events**: Select "Issues" and "Issue comments"
   - **Active**: Checked

### 2. Local Development with ngrok

For local testing, use ngrok to expose your local service:

```bash
# Install ngrok
npm install -g ngrok

# Start your service
npm run dev

# In another terminal, expose port 3000
ngrok http 3000
```

Use the ngrok URL (e.g., `https://abc123.ngrok.io/webhook`) as your webhook URL.

### 3. Webhook Events

The service processes the following webhook events:

- `issues` - Issue opened, closed, edited, etc.
- `issue_comment` - Comments added, edited, deleted
- `ping` - GitHub webhook ping (for testing)

## Testing

### Run All Tests

```bash
npm test
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Test Categories

- **Unit Tests**: Test individual functions and classes
- **Integration Tests**: Test API endpoints and external integrations
- **GitHub API Tests**: Test actual GitHub API integration (requires valid token)

## Development

### Project Structure

```
src/
├── config/           # Configuration management
├── routes/           # API route handlers
├── services/         # Business logic services
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
└── index.ts          # Application entry point

tests/
├── unit/             # Unit tests
├── integration/      # Integration tests
└── setup.ts          # Test setup

openapi.yaml          # OpenAPI 3.1 specification
Dockerfile            # Docker configuration
docker-compose.yml    # Docker Compose setup
```

### Available Scripts

```bash
npm run build         # Build TypeScript
npm run start         # Start production server
npm run dev           # Start development server
npm test              # Run tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run lint          # Run linter
npm run lint:fix      # Fix linting issues
```

### Environment Variables

| Variable         | Required | Description                        |
| ---------------- | -------- | ---------------------------------- |
| `GITHUB_TOKEN`   | Yes      | GitHub Personal Access Token       |
| `GITHUB_OWNER`   | Yes      | GitHub repository owner            |
| `GITHUB_REPO`    | Yes      | GitHub repository name             |
| `WEBHOOK_SECRET` | Yes      | Webhook signature secret           |
| `PORT`           | No       | Server port (default: 3000)        |
| `NODE_ENV`       | No       | Environment (default: development) |
| `DATABASE_PATH`  | No       | SQLite database path               |

## Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Using Docker Directly

```bash
# Build image
docker build -t github-issues-service .

# Run container
docker run -p 3000:3000 \
  -e GITHUB_TOKEN=your_token \
  -e GITHUB_OWNER=your_username \
  -e GITHUB_REPO=your_repo \
  -e WEBHOOK_SECRET=your_secret \
  github-issues-service
```

### Production Configuration

For production deployment:

1. Use environment variables for secrets
2. Configure reverse proxy (nginx included)
3. Set up SSL/TLS certificates
4. Configure monitoring and logging
5. Set up backup for SQLite database

## Security Considerations

- **HMAC Verification**: All webhooks are verified using HMAC-SHA256
- **Rate Limiting**: Built-in rate limiting to prevent abuse
- **Input Validation**: Comprehensive validation of all inputs
- **Error Handling**: Secure error messages without information leakage
- **Environment Variables**: All secrets stored in environment variables

## Monitoring and Observability

- **Health Check**: `/healthz` endpoint for service health
- **Structured Logging**: JSON-formatted logs with request IDs
- **Event Storage**: Webhook events stored for debugging
- **Rate Limit Tracking**: GitHub API rate limit monitoring

## Error Handling

The service provides consistent error responses:

```json
{
  "error": "ERROR_CODE",
  "message": "Human readable error message",
  "details": {
    "field": "additional_error_details"
  }
}
```

Common error codes:

- `VALIDATION_ERROR` - Invalid request data
- `UNAUTHORIZED` - Missing or invalid authentication
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_EXCEEDED` - GitHub API rate limit exceeded
- `INTERNAL_ERROR` - Unexpected server error

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:

1. Check the [API Documentation](http://localhost:3000/docs)
2. Review the test cases for usage examples
3. Check the logs for detailed error information
4. Open an issue in the repository

## Changelog

### v1.0.0

- Initial release
- Complete CRUD operations for issues and comments
- Webhook handling with HMAC verification
- OpenAPI 3.1 specification
- Comprehensive test suite
- Docker support
- Rate limiting and error handling

