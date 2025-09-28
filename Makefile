.PHONY: help build start dev test test:watch test:coverage lint lint:fix clean docker:build docker:run docker:stop install

# Default target
help:
	@echo "Available commands:"
	@echo "  install       - Install dependencies"
	@echo "  build         - Build the application"
	@echo "  start         - Start the application"
	@echo "  dev           - Start development server with hot reload"
	@echo "  test          - Run tests"
	@echo "  test:watch    - Run tests in watch mode"
	@echo "  test:coverage - Run tests with coverage report"
	@echo "  lint          - Run linter"
	@echo "  lint:fix      - Fix linting issues"
	@echo "  clean         - Clean build artifacts"
	@echo "  docker:build  - Build Docker image"
	@echo "  docker:run    - Run Docker container"
	@echo "  docker:stop   - Stop Docker container"

# Install dependencies
install:
	npm install

# Build the application
build:
	npm run build

# Start the application
start:
	npm start

# Start development server
dev:
	npm run dev

# Run tests
test:
	npm test

# Run tests in watch mode
test:watch:
	npm run test:watch

# Run tests with coverage
test:coverage:
	npm run test:coverage

# Run linter
lint:
	npm run lint

# Fix linting issues
lint:fix:
	npm run lint:fix

# Clean build artifacts
clean:
	rm -rf dist
	rm -rf coverage
	rm -rf data

# Build Docker image
docker:build:
	docker build -t github-issues-service .

# Run Docker container
docker:run:
	docker run -p 3000:3000 --env-file .env github-issues-service

# Stop Docker container
docker:stop:
	docker stop $$(docker ps -q --filter ancestor=github-issues-service)

# Run with docker-compose
docker-compose:up:
	docker-compose up -d

# Stop docker-compose
docker-compose:down:
	docker-compose down

# Run tests in Docker
docker:test:
	docker run --rm -v $$(pwd):/app -w /app node:18-alpine sh -c "npm install && npm test"
