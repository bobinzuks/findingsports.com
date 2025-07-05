#!/bin/bash
# Fly.io Deployment Script for Finding Sports

set -e

echo "✈️  Finding Sports - Fly.io Deployment"
echo "====================================="

# Check if Fly CLI is installed
if ! command -v fly &> /dev/null; then
    echo "📦 Installing Fly CLI..."
    curl -L https://fly.io/install.sh | sh
    export PATH="$HOME/.fly/bin:$PATH"
fi

# Login to Fly
echo "🔐 Logging in to Fly..."
fly auth login

# Create app
echo "🚀 Creating Fly app..."
fly apps create finding-sports --org personal

# Create PostgreSQL cluster
echo "🐘 Creating PostgreSQL database..."
fly postgres create finding-sports-db --region sea --initial-cluster-size 1
sleep 10

# Attach database
echo "🔗 Attaching database..."
fly postgres attach finding-sports-db --app finding-sports

# Create Redis instance
echo "🔴 Creating Redis instance..."
fly redis create finding-sports-redis --region sea --plan free

# Get Redis URL
REDIS_URL=$(fly redis status finding-sports-redis --json | jq -r '.url')

# Generate secrets
JWT_SECRET=$(openssl rand -base64 32)

# Set secrets
echo "🔒 Setting secrets..."
fly secrets set JWT_SECRET="$JWT_SECRET" \
    REDIS_URL="$REDIS_URL" \
    ENVIRONMENT=production \
    PORT=8080 \
    CORS_ORIGIN=https://finding-sports.fly.dev

# Deploy backend
echo "🚀 Deploying backend..."
cd finding-sports-backend
fly deploy

# Scale to 2 instances for reliability
echo "📈 Scaling to 2 instances..."
fly scale count 2

# Deploy frontend as separate app
cd ../mockup
echo "🎨 Creating frontend app..."
fly apps create finding-sports-frontend --org personal

# Create fly.toml for frontend
cat > fly.toml << EOF
app = "finding-sports-frontend"
primary_region = "sea"

[build]
  builder = "static"
  
[http_service]
  internal_port = 8080
  force_https = true
  
  [[http_service.checks]]
    interval = "30s"
    timeout = "5s"
    grace_period = "10s"
    method = "GET"
    path = "/"
EOF

# Deploy frontend
fly deploy

# Run migrations
echo "🗄️  Running database migrations..."
fly ssh console -a finding-sports -C "cd /app && ./migrate"

# Seed database
echo "🌱 Seeding database..."
fly ssh console -a finding-sports -C "cd /app && ./seed"

# Set up custom domains (optional)
echo "🌐 Domain setup..."
echo "To add custom domain, run:"
echo "fly certs add yourdomain.com -a finding-sports"

echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo "🔗 Backend: https://finding-sports.fly.dev"
echo "🔗 Frontend: https://finding-sports-frontend.fly.dev"
echo "📧 Demo login: demo@example.com / demo123"
echo ""
echo "📊 Monitoring:"
echo "fly logs -a finding-sports"
echo "fly status -a finding-sports"
echo ""
echo "💰 Estimated cost: $15-40/month"