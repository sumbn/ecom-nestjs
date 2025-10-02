#!/bin/bash

# Vercel Deployment Script for NestJS E-Commerce API
# Usage: ./scripts/deploy-vercel.sh [preview|production]

set -e

ENVIRONMENT=${1:-preview}
PROJECT_NAME="ecom-nestjs"

echo "🚀 Starting Vercel deployment for $ENVIRONMENT environment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami > /dev/null 2>&1; then
    echo "❌ Not logged in to Vercel. Please login first:"
    echo "   vercel login"
    exit 1
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Run tests before deployment
echo "🧪 Running tests..."
npm test

# Deploy to Vercel
echo "📦 Deploying to Vercel..."
if [ "$ENVIRONMENT" = "production" ]; then
    vercel --prod
    echo "✅ Deployed to production!"
else
    vercel
    echo "✅ Deployed to preview!"
fi

# Get deployment URL
echo "🔍 Getting deployment URL..."
DEPLOYMENT_URL=$(vercel ls --json | jq -r '.[0].url')

if [ "$DEPLOYMENT_URL" != "null" ] && [ "$DEPLOYMENT_URL" != "" ]; then
    echo "🌐 Deployment URL: https://$DEPLOYMENT_URL"
    
    # Health check
    echo "🏥 Performing health check..."
    sleep 10
    
    if curl -f "https://$DEPLOYMENT_URL/health" > /dev/null 2>&1; then
        echo "✅ Health check passed! API is running at https://$DEPLOYMENT_URL"
    else
        echo "⚠️  Health check failed. Please check the deployment logs."
    fi
else
    echo "⚠️  Could not retrieve deployment URL. Please check Vercel dashboard."
fi

echo "🎉 Vercel deployment completed!"
echo "📊 Vercel Dashboard: https://vercel.com/dashboard"
echo "📋 View logs: vercel logs"
