#!/bin/bash

# Quick Authentication Testing Script
# Usage: ./test-auth.sh

API_URL="http://localhost:5000/api"

echo "🧪 Testing Authentication API"
echo "=========================="
echo ""

# Test 1: Health Check
echo "1. Testing Health Check..."
curl -s "$API_URL/health" | jq '.' || echo "❌ Health check failed"
echo ""

# Test 2: Registration
echo "2. Testing Registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser'$(date +%s)'",
    "email": "test'$(date +%s)'@example.com",
    "password": "password123"
  }')

echo "$REGISTER_RESPONSE" | jq '.' || echo "$REGISTER_RESPONSE"

# Extract token
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token' 2>/dev/null)
echo ""

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo "✅ Registration successful! Token: ${TOKEN:0:20}..."
  echo ""
  
  # Test 3: Get Current User (Protected Route)
  echo "3. Testing Protected Route (Get Current User)..."
  curl -s "$API_URL/auth/me" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" | jq '.' || echo "❌ Protected route failed"
  echo ""
  
  # Test 4: Login
  echo "4. Testing Login..."
  USERNAME=$(echo "$REGISTER_RESPONSE" | jq -r '.user.username' 2>/dev/null)
  LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
      \"username\": \"$USERNAME\",
      \"password\": \"password123\"
    }")
  
  echo "$LOGIN_RESPONSE" | jq '.' || echo "$LOGIN_RESPONSE"
  echo ""
  
  # Test 5: Invalid Credentials
  echo "5. Testing Invalid Credentials..."
  curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
      \"username\": \"$USERNAME\",
      \"password\": \"wrongpassword\"
    }" | jq '.' || echo "Response received"
  echo ""
  
  echo "✅ All tests completed!"
else
  echo "❌ Registration failed - cannot continue tests"
fi

