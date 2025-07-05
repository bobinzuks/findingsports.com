#!/bin/bash
# Railway.app Deployment Script for Finding Sports

set -e

echo "🚂 Finding Sports - Railway Deployment"
echo "====================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm i -g @railway/cli
fi

# Login to Railway
echo "🔐 Logging in to Railway..."
railway login

# Initialize project
echo "🚀 Initializing Railway project..."
railway init finding-sports

# Add PostgreSQL with PostGIS
echo "🐘 Adding PostgreSQL database..."
railway add postgresql
sleep 5

# Add Redis
echo "🔴 Adding Redis..."
railway add redis
sleep 5

# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 32)
echo "🔒 Generated JWT secret"

# Set environment variables
echo "⚙️  Setting environment variables..."
railway variables set DATABASE_URL=\${{PGDATABASE_URL}}
railway variables set REDIS_URL=\${{REDIS_URL}}
railway variables set JWT_SECRET="$JWT_SECRET"
railway variables set ENVIRONMENT=production
railway variables set PORT=8080
railway variables set CORS_ORIGIN=https://finding-sports.railway.app

# Create deployment package
echo "📦 Preparing deployment..."
cd finding-sports-backend

# Deploy backend
echo "🚀 Deploying backend..."
railway up

# Get deployment URL
BACKEND_URL=$(railway status --json | jq -r '.url')
echo "✅ Backend deployed at: $BACKEND_URL"

# Deploy frontend
cd ../mockup
echo "🎨 Deploying frontend..."
railway up

# Run migrations
echo "🗄️  Running database migrations..."
railway run cargo run --bin migrate

# Seed database
echo "🌱 Seeding database with test data..."
railway run cargo run --bin seed

echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo "🔗 Backend URL: $BACKEND_URL"
echo "🔗 Frontend URL: https://finding-sports.railway.app"
echo "📧 Demo login: demo@example.com / demo123"
echo ""
echo "📊 Next steps:"
echo "1. Set up custom domain in Railway dashboard"
echo "2. Configure monitoring alerts"
echo "3. Test all endpoints"
echo ""
echo "💰 Estimated cost: $20-35/month"