#!/bin/bash
echo "MongoDB Atlas Connection String Updater"
echo "========================================"
echo ""
echo "Enter your MongoDB username:"
read -p "Username: " username
echo ""
echo "Enter your MongoDB password:"
read -s -p "Password: " password
echo ""
echo ""
echo "Your connection string will be:"
echo "mongodb+srv://$username:$password@cluster0.g8dsdko.mongodb.net/secure-messaging?retryWrites=true&w=majority"
echo ""
read -p "Update .env file with this connection string? (y/n): " confirm

if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
    if [ -f .env ]; then
        connection_string="mongodb+srv://$username:$password@cluster0.g8dsdko.mongodb.net/secure-messaging?retryWrites=true&w=majority"
        if grep -q "MONGODB_URI=" .env; then
            sed -i "s|MONGODB_URI=.*|MONGODB_URI=$connection_string|" .env
            echo ""
            echo "✅ Updated MONGODB_URI in .env file!"
        else
            echo "MONGODB_URI=$connection_string" >> .env
            echo ""
            echo "✅ Added MONGODB_URI to .env file!"
        fi
        echo ""
        echo "Connection string updated successfully!"
    else
        echo "❌ .env file not found!"
    fi
else
    echo "Cancelled."
fi
