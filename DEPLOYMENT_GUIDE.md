# Finding Sports - Deployment Guide & Hosting Recommendations

## 🚀 Deployment Options

### Option 1: Railway.app (Recommended for MVPs)
**Best for**: Quick deployment, auto-scaling, minimal DevOps
- **Cost**: ~$20-50/month for small-medium apps
- **Pros**: 
  - One-click PostgreSQL + Redis
  - Automatic SSL certificates
  - GitHub integration
  - Auto-deploy on push
- **Setup Time**: 15 minutes

```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
railway login
railway up
```

### Option 2: Fly.io (Best Performance)
**Best for**: Global edge deployment, WebSocket support
- **Cost**: ~$15-40/month
- **Pros**:
  - Global edge locations
  - Built-in PostgreSQL with replication
  - Excellent for real-time features
  - Zero-downtime deployments

```toml
# fly.toml
app = "finding-sports"
primary_region = "sea"

[http_service]
  internal_port = 8080
  force_https = true
  
[mounts]
  destination = "/data"
  source = "data"
```

### Option 3: DigitalOcean App Platform
**Best for**: Simplicity with control
- **Cost**: ~$25-75/month
- **Pros**:
  - Managed PostgreSQL + Redis
  - Built-in CDN
  - Easy scaling
  - Good developer experience

### Option 4: AWS (Production Scale)
**Best for**: Maximum control and scale
- **Cost**: ~$100-500/month (varies greatly)
- **Services**:
  - ECS/Fargate for containers
  - RDS PostgreSQL with PostGIS
  - ElastiCache for Redis
  - CloudFront CDN
  - Route53 for DNS

## 📦 Production Setup

### 1. Environment Variables
```bash
# Production .env
DATABASE_URL=postgres://user:pass@host:5432/finding_sports?sslmode=require
REDIS_URL=rediss://user:pass@host:6379
JWT_SECRET=your-production-secret-key-min-32-chars
ENVIRONMENT=production
PORT=8080

# Add these for production
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=info
SENTRY_DSN=your-sentry-dsn
```

### 2. Database Migrations
```bash
# Run migrations on production
DATABASE_URL=your-prod-url sqlx migrate run
```

### 3. SSL/TLS Configuration
- Use Let's Encrypt for free SSL certificates
- Enable force HTTPS redirects
- Set secure cookie flags

### 4. Production Dockerfile
```dockerfile
# Multi-stage build for smaller image
FROM rust:1.75-slim as builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
COPY --from=builder /app/target/release/server /app/
CMD ["./app/server"]
```

## 🔒 Security Checklist

- [ ] Environment variables for all secrets
- [ ] HTTPS everywhere
- [ ] Rate limiting configured
- [ ] CORS properly set
- [ ] SQL injection protection (using sqlx)
- [ ] Input validation
- [ ] Authentication on all protected routes
- [ ] Regular dependency updates

## 📊 Monitoring Setup

### 1. Application Monitoring
- **Sentry**: Error tracking
- **DataDog/New Relic**: APM
- **Prometheus + Grafana**: Metrics

### 2. Infrastructure Monitoring
- **UptimeRobot**: Uptime monitoring
- **CloudWatch/DigitalOcean Monitoring**: Resource usage

### 3. Logging
```rust
// Add structured logging
use tracing_subscriber::fmt::format::FmtSpan;

tracing_subscriber::fmt()
    .with_span_events(FmtSpan::CLOSE)
    .json()
    .init();
```

## 🚄 Performance Optimizations

### 1. Database
```sql
-- Add missing indexes
CREATE INDEX idx_games_sport_start ON games(sport_type, start_time);
CREATE INDEX idx_users_email_lower ON users(LOWER(email));

-- Vacuum and analyze
VACUUM ANALYZE;
```

### 2. Caching Headers
```rust
// Add cache headers
.layer(
    ServiceBuilder::new()
        .layer(CompressionLayer::new())
        .layer(
            CorsLayer::new()
                .allow_origin(cors_origin)
                .allow_methods(vec![Method::GET, Method::POST])
        )
)
```

### 3. CDN Setup
- CloudFlare (Free tier available)
- Cache static assets
- Geographic distribution

## 🔄 CI/CD Pipeline

### GitHub Actions
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
          
      - name: Run tests
        run: cargo test
        
      - name: Build
        run: cargo build --release
        
      - name: Deploy to Railway
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

## 📱 Domain & DNS

### Recommended Registrars
1. **Namecheap**: Good prices, free privacy
2. **Cloudflare**: Best performance, at-cost domains
3. **Porkbun**: Cheap, good UI

### DNS Configuration
```
A     @       YOUR_SERVER_IP
A     www     YOUR_SERVER_IP
CNAME api     YOUR_API_DOMAIN
```

## 💰 Cost Breakdown

### MVP Stage (100-1000 users)
- **Hosting**: $20-30/month (Railway/Fly.io)
- **Database**: Included
- **Domain**: $12/year
- **Total**: ~$35/month

### Growth Stage (1000-10K users)
- **Hosting**: $50-100/month
- **Database**: $25/month (managed)
- **CDN**: $20/month
- **Monitoring**: $30/month
- **Total**: ~$150/month

### Scale Stage (10K+ users)
- **Multiple servers**: $200-500/month
- **Database cluster**: $100-200/month
- **CDN**: $50-100/month
- **Monitoring**: $100/month
- **Total**: ~$500-900/month

## 🚨 What's Still Missing

### Critical for Production
1. **Email Service**
   - SendGrid/Postmark for transactional emails
   - Email verification flow
   - Password reset functionality

2. **File Storage**
   - AWS S3 or Cloudflare R2 for user avatars
   - Image optimization pipeline

3. **Search Infrastructure**
   - Elasticsearch or MeiliSearch
   - Full-text venue/game search

4. **Payment Processing**
   - Stripe integration for paid venues
   - Subscription management

### Important Features
1. **Push Notifications**
   - Web push for game reminders
   - Mobile push via Firebase

2. **Analytics**
   - Google Analytics or Plausible
   - User behavior tracking
   - Conversion funnels

3. **Admin Dashboard**
   - Venue management
   - User moderation
   - Analytics viewing

4. **Mobile Apps**
   - React Native setup
   - App store deployment

### Nice to Have
1. **Internationalization**
   - Multi-language support
   - Currency conversion

2. **Advanced Features**
   - AI-powered game recommendations
   - Social sharing
   - Calendar integration

## 🎯 Deployment Steps

### For Railway.app (Quickest)
1. Create account at railway.app
2. Install CLI: `npm i -g @railway/cli`
3. Login: `railway login`
4. Initialize: `railway init`
5. Add services:
   ```bash
   railway add postgresql
   railway add redis
   ```
6. Deploy: `railway up`
7. Set custom domain in dashboard

### Database Setup
```bash
# After deployment, run migrations
railway run cargo sqlx migrate run

# Seed with test data
railway run cargo run --bin seed
```

## 📝 Post-Deployment Checklist

- [ ] Verify all environment variables
- [ ] Test authentication flow
- [ ] Check WebSocket connections
- [ ] Verify map functionality
- [ ] Test on mobile devices
- [ ] Set up error tracking
- [ ] Configure backups
- [ ] Set up monitoring alerts
- [ ] Document API endpoints
- [ ] Create user guide

## 🆘 Support & Troubleshooting

### Common Issues
1. **Database connection errors**
   - Check DATABASE_URL format
   - Ensure SSL mode is set
   - Verify PostGIS extension

2. **CORS errors**
   - Set CORS_ORIGIN env var
   - Check allowed methods

3. **WebSocket issues**
   - Ensure WSS support
   - Check proxy settings

### Getting Help
- GitHub Issues for bugs
- Stack Overflow for technical questions
- Discord/Slack community (to be created)

## Ready to Deploy? 🚀

Start with Railway.app for the quickest path to production. You can always migrate to more complex infrastructure as you grow!

```bash
# Quick start
git add .
git commit -m "Ready for production!"
railway up
```

Your Finding Sports app will be live in minutes! 🎉