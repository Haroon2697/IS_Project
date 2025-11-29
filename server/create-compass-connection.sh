#!/bin/bash
echo "MongoDB Compass Connection String Helper"
echo "========================================"
echo ""
echo "This will help you create the correct Atlas connection string for Compass"
echo ""
read -p "Enter your MongoDB username [i222697]: " username
username=${username:-i222697}
echo ""
read -s -p "Enter your MongoDB password: " password
echo ""
echo ""
echo "Your connection string for MongoDB Compass:"
echo ""
connection_string="mongodb+srv://$username:$password@cluster0.g8dsdko.mongodb.net/secure-messaging?retryWrites=true&w=majority"
echo "$connection_string"
echo ""
echo "========================================"
echo "INSTRUCTIONS:"
echo "1. Copy the connection string above"
echo "2. Open MongoDB Compass"
echo "3. Click '+' to add NEW connection"
echo "4. Paste the connection string"
echo "5. Click 'Connect'"
echo ""
echo "Save this connection string to .env file? (y/n): "
read -p "> " save_env
if [ "$save_env" = "y" ] || [ "$save_env" = "Y" ]; then
    if [ -f .env ]; then
        if grep -q "MONGODB_URI=" .env; then
            sed -i "s|MONGODB_URI=.*|MONGODB_URI=$connection_string|" .env
            echo "✅ Updated .env file!"
        else
            echo "MONGODB_URI=$connection_string" >> .env
            echo "✅ Added to .env file!"
        fi
    else
        echo "❌ .env file not found!"
    fi
fi
