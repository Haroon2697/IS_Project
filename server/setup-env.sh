#!/bin/bash
echo "Setting up .env file..."
echo ""
echo "Enter your MongoDB URI (or press Enter for default):"
read -p "MongoDB URI [mongodb://localhost:27017/secure-messaging]: " mongodb_uri
mongodb_uri=${mongodb_uri:-mongodb://localhost:27017/secure-messaging}

echo ""
echo "Enter your Google OAuth Client ID (get from Google Cloud Console):"
read -p "GOOGLE_CLIENT_ID: " google_client_id

echo ""
echo "Enter your Google OAuth Client Secret:"
read -p "GOOGLE_CLIENT_SECRET: " google_client_secret

echo ""
read -p "Enter a random session secret (or press Enter for default): " session_secret
session_secret=${session_secret:-$(openssl rand -hex 32)}

cat > .env << ENVFILE
PORT=5000
NODE_ENV=development
MONGODB_URI=$mongodb_uri
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=$google_client_id
GOOGLE_CLIENT_SECRET=$google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/oauth/google/callback
SESSION_SECRET=$session_secret
SERVER_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000
ENVFILE

echo ""
echo "✅ .env file created successfully!"
echo ""
echo "Next steps:"
echo "1. Make sure MongoDB is running"
echo "2. Start server: npm run dev"
echo "3. Start client: cd ../client && npm start"
