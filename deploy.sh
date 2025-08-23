#!/bin/bash

# FileBin Deployment Script
# This script helps deploy your FileBin application

set -e

echo "🚀 FileBin Deployment Script"
echo "=============================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "📋 Please copy .env.example to .env and fill in your configuration:"
    echo "   cp .env.example .env"
    echo "   Edit .env with your database URL and storage credentials"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building application..."
npm run build

echo "🗄️  Setting up database..."
if [ ! -z "$DATABASE_URL" ]; then
    npm run db:push
    echo "✅ Database schema applied"
else
    echo "⚠️  DATABASE_URL not set, skipping database setup"
fi

echo "🧪 Testing build..."
npm run check

echo "✅ Build completed successfully!"
echo ""
echo "🎉 Your FileBin application is ready for deployment!"
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub"
echo "2. Connect your repository to your hosting platform"
echo "3. Set environment variables in your hosting dashboard"
echo "4. Deploy!"
echo ""
echo "To start locally: npm start"
echo "To develop locally: npm run dev"