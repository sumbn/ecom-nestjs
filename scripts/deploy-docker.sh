#!/bin/bash

# Docker Deployment Script for NestJS E-Commerce API
# Usage: ./scripts/deploy-docker.sh [dev|prod]

set -e

ENVIRONMENT=${1:-prod}
PROJECT_NAME="ecom-nestjs"

echo "🚀 Starting Docker deployment for $ENVIRONMENT environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

# Set environment-specific variables
if [ "$ENVIRONMENT" = "dev" ]; then
    COMPOSE_FILE="docker-compose.dev.yml"
    echo "📦 Building for development environment..."
else
    COMPOSE_FILE="docker-compose.yml"
    echo "📦 Building for production environment..."
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f $COMPOSE_FILE down

# Remove old images (optional, uncomment if needed)
# echo "🗑️  Removing old images..."
# docker-compose -f $COMPOSE_FILE down --rmi all

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f $COMPOSE_FILE up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
docker-compose -f $COMPOSE_FILE ps

# Run database migrations
echo "🗄️  Running database migrations..."
if [ "$ENVIRONMENT" = "dev" ]; then
    docker-compose -f $COMPOSE_FILE exec app-dev npm run migration:run
else
    docker-compose -f $COMPOSE_FILE exec app npm run migration:run
fi

# Health check
echo "🏥 Performing health check..."
sleep 5

if [ "$ENVIRONMENT" = "dev" ]; then
    HEALTH_URL="http://localhost:3001/health"
else
    HEALTH_URL="http://localhost:3000/health"
fi

if curl -f $HEALTH_URL > /dev/null 2>&1; then
    echo "✅ Health check passed! API is running at $HEALTH_URL"
else
    echo "❌ Health check failed! Please check the logs:"
    docker-compose -f $COMPOSE_FILE logs app
    exit 1
fi

echo "🎉 Deployment completed successfully!"
echo "📊 API Status: $HEALTH_URL"
echo "📋 View logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "🛑 Stop services: docker-compose -f $COMPOSE_FILE down"
