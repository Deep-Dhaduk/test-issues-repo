# Development setup script for GitHub Issues Service

Write-Host "🚀 Setting up GitHub Issues Service for development..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check Node.js version
$versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
if ($versionNumber -lt 18) {
    Write-Host "❌ Node.js version 18+ is required. Current version: $nodeVersion" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Create data directory
Write-Host "📁 Creating data directory..." -ForegroundColor Yellow
if (!(Test-Path "data")) {
    New-Item -ItemType Directory -Path "data"
}

# Check if .env exists
if (!(Test-Path ".env")) {
    Write-Host "⚙️  Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    Write-Host "📝 Please edit .env file with your GitHub credentials and webhook secret" -ForegroundColor Cyan
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Build the application
Write-Host "🔨 Building application..." -ForegroundColor Yellow
npm run build

# Run tests
Write-Host "🧪 Running tests..." -ForegroundColor Yellow
npm test

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env file with your GitHub credentials"
Write-Host "2. Run 'npm run dev' to start development server"
Write-Host "3. Visit http://localhost:3000/docs for API documentation"
Write-Host "4. Visit http://localhost:3000/healthz for health check"
Write-Host ""
Write-Host "For production deployment:" -ForegroundColor Cyan
Write-Host "1. Run 'make docker:build' to build Docker image"
Write-Host "2. Run 'make docker:run' to run with Docker"
Write-Host "3. Or use 'docker-compose up -d' for full stack"
