#!/bin/bash
echo "MongoDB Atlas Connection String Updater"
echo "========================================"
echo ""
echo "Paste your MongoDB Atlas connection string here:"
echo "Example: mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/secure-messaging?retryWrites=true&w=majority"
echo ""
read -p "Connection String: " mongodb_uri

if [ -f .env ]; then
    # Update MONGODB_URI in .env file
    if grep -q "MONGODB_URI=" .env; then
        sed -i "s|MONGODB_URI=.*|MONGODB_URI=$mongodb_uri|" .env
        echo ""
        echo "✅ Updated MONGODB_URI in .env file!"
    else
        echo "MONGODB_URI=$mongodb_uri" >> .env
        echo ""
        echo "✅ Added MONGODB_URI to .env file!"
    fi
    echo ""
    echo "Updated .env file:"
    grep "MONGODB_URI" .env
else
    echo "❌ .env file not found!"
fi
