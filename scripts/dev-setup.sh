#!/bin/bash

# Development setup script for GitHub Issues Service

set -e

echo "🚀 Setting up GitHub Issues Service for development..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create data directory
echo "📁 Creating data directory..."
mkdir -p data

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚙️  Creating .env file from template..."
    cp env.example .env
    echo "📝 Please edit .env file with your GitHub credentials and webhook secret"
else
    echo "✅ .env file already exists"
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Run tests
echo "🧪 Running tests..."
npm test

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your GitHub credentials"
echo "2. Run 'npm run dev' to start development server"
echo "3. Visit http://localhost:3000/docs for API documentation"
echo "4. Visit http://localhost:3000/healthz for health check"
echo ""
echo "For production deployment:"
echo "1. Run 'make docker:build' to build Docker image"
echo "2. Run 'make docker:run' to run with Docker"
echo "3. Or use 'docker-compose up -d' for full stack"
