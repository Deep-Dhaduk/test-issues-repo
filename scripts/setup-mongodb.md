# MongoDB Setup Guide

## Option 1: Local MongoDB Installation

### Windows
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Install MongoDB
3. Start MongoDB service:
   ```cmd
   net start MongoDB
   ```

### macOS
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

### Linux (Ubuntu/Debian)
```bash
# Import the public key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Create a list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package database
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

## Option 2: Docker (Recommended)

### Start MongoDB with Docker
```bash
docker run -d --name mongodb -p 27017:27017 mongo:7
```

### Or use Docker Compose
```bash
docker-compose up mongodb -d
```

## Option 3: MongoDB Atlas (Cloud)

1. Go to https://www.mongodb.com/atlas
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Update your `.env` file:
   ```env
   MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/
   MONGODB_DATABASE=github_issues_service
   ```

## Verify Installation

```bash
# Check if MongoDB is running
mongosh --eval "db.runCommand('ping')"

# Or using Docker
docker exec mongodb mongosh --eval "db.runCommand('ping')"
```

## Environment Configuration

Update your `.env` file:
```env
MONGODB_URL=mongodb://localhost:27017
MONGODB_DATABASE=github_issues_service
```

## Start the Service

```bash
npm install
npm run dev
```

The service will automatically connect to MongoDB and create the necessary collections and indexes.
