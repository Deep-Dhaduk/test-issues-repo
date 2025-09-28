#!/bin/bash

# Test script for GitHub Issues Service API

set -e

BASE_URL="http://localhost:3000"

echo "🧪 Testing GitHub Issues Service API..."

# Test health check
echo "1. Testing health check..."
curl -s -f "$BASE_URL/healthz" | jq '.' || echo "❌ Health check failed"

# Test API documentation
echo "2. Testing API documentation..."
curl -s -f "$BASE_URL/docs" > /dev/null && echo "✅ API docs accessible" || echo "❌ API docs not accessible"

# Test OpenAPI spec
echo "3. Testing OpenAPI specification..."
curl -s -f "$BASE_URL/documentation/json" | jq '.info.title' || echo "❌ OpenAPI spec not accessible"

# Test create issue (requires valid GitHub token)
echo "4. Testing create issue..."
if [ -n "$GITHUB_TOKEN" ] && [ -n "$GITHUB_OWNER" ] && [ -n "$GITHUB_REPO" ]; then
    ISSUE_RESPONSE=$(curl -s -X POST "$BASE_URL/issues" \
        -H "Content-Type: application/json" \
        -d '{
            "title": "API Test Issue",
            "body": "This is a test issue created by the API test script",
            "labels": ["test", "api"]
        }')
    
    if echo "$ISSUE_RESPONSE" | jq -e '.number' > /dev/null; then
        ISSUE_NUMBER=$(echo "$ISSUE_RESPONSE" | jq -r '.number')
        echo "✅ Issue created successfully: #$ISSUE_NUMBER"
        
        # Test get issue
        echo "5. Testing get issue..."
        curl -s -f "$BASE_URL/issues/$ISSUE_NUMBER" | jq '.title' || echo "❌ Get issue failed"
        
        # Test update issue
        echo "6. Testing update issue..."
        curl -s -X PATCH "$BASE_URL/issues/$ISSUE_NUMBER" \
            -H "Content-Type: application/json" \
            -d '{"title": "Updated API Test Issue"}' | jq '.title' || echo "❌ Update issue failed"
        
        # Test create comment
        echo "7. Testing create comment..."
        curl -s -X POST "$BASE_URL/issues/$ISSUE_NUMBER/comments" \
            -H "Content-Type: application/json" \
            -d '{"body": "This is a test comment"}' | jq '.body' || echo "❌ Create comment failed"
        
        # Test list issues
        echo "8. Testing list issues..."
        curl -s -f "$BASE_URL/issues?per_page=5" | jq 'length' || echo "❌ List issues failed"
        
        # Test close issue
        echo "9. Testing close issue..."
        curl -s -X PATCH "$BASE_URL/issues/$ISSUE_NUMBER" \
            -H "Content-Type: application/json" \
            -d '{"state": "closed"}' | jq '.state' || echo "❌ Close issue failed"
        
    else
        echo "❌ Create issue failed: $ISSUE_RESPONSE"
    fi
else
    echo "⚠️  Skipping GitHub API tests (missing environment variables)"
fi

# Test webhook endpoint (should fail without proper signature)
echo "10. Testing webhook endpoint..."
WEBHOOK_RESPONSE=$(curl -s -X POST "$BASE_URL/webhook" \
    -H "Content-Type: application/json" \
    -d '{"test": "data"}')
    
if echo "$WEBHOOK_RESPONSE" | jq -e '.error' > /dev/null; then
    echo "✅ Webhook endpoint properly rejects invalid requests"
else
    echo "❌ Webhook endpoint should reject invalid requests"
fi

# Test events endpoint
echo "11. Testing events endpoint..."
curl -s -f "$BASE_URL/events" | jq 'length' || echo "❌ Events endpoint failed"

echo ""
echo "🎉 API testing complete!"
