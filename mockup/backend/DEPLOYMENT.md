# Finding Sports - Deployment Guide

## 🚀 Quick Deploy to Railway

### Prerequisites
- Railway account (https://railway.app)
- GitHub repository connected to Railway

### Deployment Steps

1. **Use the Secure Server**
   ```bash
   # The secure server fixes all critical vulnerabilities
   cp ultra-simple-server-secure.js ultra-simple-server.js
   ```

2. **Configure Environment Variables in Railway**
   - `PORT`: 8080 (Railway sets this automatically)
   - `NODE_ENV`: production
   - `ALLOWED_ORIGINS`: Your production domains (comma-separated)

3. **Deploy Command**
   ```bash
   node ultra-simple-server.js
   ```

## 🔒 Security Enhancements

### Fixed Vulnerabilities
- ✅ **Path Traversal**: Validates all file paths
- ✅ **CORS**: Restricts to allowed origins only
- ✅ **Security Headers**: XSS, clickjacking protection
- ✅ **Network Binding**: Proper host configuration
- ✅ **Input Validation**: Validates all requests

### Security Features
- Request logging with IP tracking
- Rate limiting preparation
- Memory monitoring
- Graceful shutdown handling
- ETag support for caching

## 📡 API Endpoints

### Health Check
```
GET /api/health
Response: { "status": "ok", "server": "ultra-simple-secure" }
```

### Play Now Activities
```
GET /api/play-now
Response: {
  "activities": {
    "happeningNow": [...],
    "startingSoon": [...],
    "laterToday": [...],
    "openCourts": [...],
    "pickupGames": [...]
  },
  "summary": { ... }
}
```

### Static Files
- `/` or `/index.html` - Main application
- `/css/*` - Stylesheets
- `/js/*` - JavaScript files
- `/images/*` - Image assets

## ⚡ Performance Features

### Caching System
- In-memory file cache (50MB limit)
- 1-hour TTL for cached content
- ETag support for conditional requests
- Automatic cache eviction

### Optimizations
- Pre-serialized JSON responses
- Asynchronous file operations
- Memory usage monitoring
- Response time logging

## 🛠️ Configuration

### Environment Variables
```bash
# Required
PORT=8080
NODE_ENV=production

# Security
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Optional
SESSION_SECRET=your-secret-here
LOG_LEVEL=info
CACHE_TTL=3600000
MAX_CACHE_SIZE=52428800
```

### Railway Configuration
The `railway.json` file is pre-configured:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node ultra-simple-server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## 📊 Monitoring

### Health Checks
- Endpoint: `/api/health`
- Frequency: Every 30 seconds
- Memory usage warnings at 100MB

### Logs
- Request logging with timestamps
- Slow response warnings (>100ms)
- Security incident logging
- Memory usage alerts

### Metrics to Track
- Response times by endpoint
- Memory usage trends
- Cache hit rates
- Error rates

## 🚨 Troubleshooting

### Server Won't Start
1. Check PORT environment variable
2. Verify no other process on port
3. Check file permissions

### 404 Errors
1. Verify file paths are correct
2. Check mockup directory structure
3. Ensure index.html exists

### CORS Issues
1. Add origin to ALLOWED_ORIGINS
2. Check protocol (http vs https)
3. Verify origin header is sent

### High Memory Usage
1. Check cache size
2. Look for memory leaks
3. Monitor concurrent connections

### Performance Issues
1. Check cache hit rates
2. Monitor slow response logs
3. Verify file sizes

## 🔄 Updates and Maintenance

### Rolling Updates
1. Deploy new version
2. Railway handles zero-downtime deployment
3. Monitor health endpoint

### Rollback Process
1. Use Railway's deployment history
2. Revert to previous deployment
3. Check logs for issues

## 📈 Scaling

### Vertical Scaling
- Increase Railway instance size
- Monitor memory usage
- Adjust cache limits

### Horizontal Scaling
- Use Railway's scaling features
- Implement session persistence
- Configure load balancing

## 🆘 Emergency Procedures

### Server Crash
1. Railway auto-restarts (max 10 retries)
2. Check logs for crash reason
3. Monitor memory usage

### Security Incident
1. Check security logs
2. Update ALLOWED_ORIGINS
3. Review access patterns

### Performance Degradation
1. Clear cache if needed
2. Check for blocking operations
3. Monitor concurrent requests

## 📝 Maintenance Checklist

### Daily
- [ ] Check health endpoint
- [ ] Monitor error logs
- [ ] Review memory usage

### Weekly
- [ ] Review performance metrics
- [ ] Check security logs
- [ ] Update dependencies

### Monthly
- [ ] Security audit
- [ ] Performance optimization
- [ ] Backup configuration

## 🎯 Production Ready

The secure server is production-ready with:
- ✅ All critical vulnerabilities fixed
- ✅ Performance optimizations
- ✅ Monitoring and logging
- ✅ Graceful error handling
- ✅ Zero dependencies maintained

Deploy with confidence! 🚀