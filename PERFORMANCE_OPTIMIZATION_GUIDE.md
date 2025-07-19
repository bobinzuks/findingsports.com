# Social Features Performance Optimization Guide

## Overview

This guide details the performance optimizations implemented for the Finding Sports social features to support thousands of concurrent users.

## 1. Database Optimizations

### Indexes Added

#### Chat Messages
```sql
-- Composite index for room queries with pagination
CREATE INDEX idx_chat_messages_room_created 
ON chat_messages(room_id, created_at DESC) 
WHERE is_deleted = false;

-- Index for efficient pagination
CREATE INDEX idx_chat_messages_room_id_desc 
ON chat_messages(room_id, id DESC) 
WHERE is_deleted = false;
```

#### Reports & Moderation
```sql
-- Composite index for moderator dashboard
CREATE INDEX idx_user_reports_status_created 
ON user_reports(status, created_at DESC);

-- Index for pending reports by type
CREATE INDEX idx_user_reports_pending_type 
ON user_reports(report_type, created_at DESC) 
WHERE status = 'pending';

-- User moderation history
CREATE INDEX idx_moderation_actions_user_created 
ON moderation_actions(target_user_id, created_at DESC);
```

### Query Optimization Tips

1. **Use LIMIT and OFFSET for pagination**
   ```sql
   SELECT * FROM chat_messages 
   WHERE room_id = $1 AND is_deleted = false
   ORDER BY created_at DESC
   LIMIT 50 OFFSET 0;
   ```

2. **Use prepared statements** to avoid query parsing overhead

3. **Batch operations** when possible
   ```sql
   INSERT INTO chat_messages (room_id, user_id, content) 
   VALUES ($1, $2, $3), ($4, $5, $6), ($7, $8, $9);
   ```

## 2. Caching Strategy

### Cache Layers

1. **Permissions Cache** (5 min TTL)
   - User roles and permissions
   - Reduces database queries for authorization

2. **Banned Words Cache** (30 min TTL)
   - List of prohibited words
   - Enables fast message filtering

3. **Moderator List Cache** (15 min TTL)
   - Active moderators
   - Quick moderator lookup

4. **Room Membership Cache** (2 min TTL)
   - Active participants per room
   - Reduces JOIN queries

5. **Message History Cache** (1 min TTL)
   - Recent messages per room
   - Speeds up pagination

### Cache Usage Example

```javascript
// Get user permissions with caching
const permissions = await cacheService.getUserPermissions(userId, async (id) => {
    const result = await db.query('SELECT role FROM users WHERE id = $1', [id]);
    return result.rows[0]?.role || 'user';
});

// Check permission
if (cacheService.hasPermission(permissions, 'delete', 'message')) {
    // User can delete messages
}
```

### Cache Invalidation

```javascript
// Invalidate user cache when role changes
cacheService.invalidateUserCache(userId);

// Invalidate room cache when membership changes
cacheService.invalidateRoomCache(roomId);

// Invalidate report cache when new report submitted
cacheService.invalidateReportCache();
```

## 3. WebSocket Optimizations

### Connection Pooling

- Multiple devices per user supported
- Efficient room membership tracking
- Connection state management

### Message Batching

- Messages queued and sent in batches
- Reduces network overhead
- Default: 50 messages or 100ms delay

```javascript
// Messages are automatically batched
socket.emit('send-message', { channel: 'general', message: 'Hello!' });
// Sent with other messages in the same batch
```

### Rate Limiting

- 100 messages per minute per connection
- Prevents spam and abuse
- Graceful degradation with retry headers

### Compression

- Messages over 1KB are compressed
- WebSocket frame compression enabled
- Reduces bandwidth usage

## 4. Performance Monitoring

### Real-time Metrics

```javascript
// Access performance metrics
GET /api/performance/report

Response:
{
  "endpoints": {
    "slowEndpoints": [...],
    "totalRequests": 150000,
    "totalErrors": 23
  },
  "database": {
    "slowQueries": [...],
    "totalQueries": 500000
  },
  "websocket": {
    "messagesPerSecond": 1250,
    "activeConnections": 3200
  },
  "system": {
    "cpu": { "current": 45.2, "average": 38.7 },
    "memory": { "current": 72.1, "average": 68.4 },
    "eventLoop": { "current": 2.3, "average": 1.8 }
  }
}
```

### Performance Alerts

The system automatically alerts when:
- CPU usage > 80%
- Memory usage > 90%
- Event loop delay > 100ms
- Query time > 100ms
- Request time > 1000ms

## 5. Cleanup Jobs

### Automated Maintenance

| Job | Schedule | Purpose |
|-----|----------|---------|
| Expired Chats | Hourly | Mark old chat rooms inactive |
| Archive Messages | Daily 2 AM | Move old messages to archive |
| Stale Connections | Every 15 min | Clean disconnected sockets |
| Cache Cleanup | Every 30 min | Remove expired entries |
| Vacuum Database | Weekly | Optimize table storage |

### Manual Cleanup

```bash
# Trigger cleanup job manually
POST /api/performance/cleanup/cleanup-expired-chats

# Check cleanup statistics
GET /api/performance/cleanup-stats
```

## 6. Configuration Recommendations

### Database Connection Pool

```javascript
{
  max: 100,              // Maximum connections
  min: 10,               // Minimum connections
  idleTimeoutMillis: 600000,     // 10 minutes
  connectionTimeoutMillis: 30000, // 30 seconds
  statement_timeout: 30000        // 30 seconds per query
}
```

### Redis Configuration

```javascript
{
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  reconnectOnError: true
}
```

### Rate Limiting

```javascript
// Different limits for different operations
- General: 100 req/15 min
- Auth: 5 req/15 min
- API: 60 req/min
- Chat: 100 msg/min
```

## 7. Scaling Strategies

### Horizontal Scaling

1. **Multiple Server Instances**
   - Use Redis adapter for WebSocket
   - Share cache across instances
   - Distributed rate limiting

2. **Database Read Replicas**
   - Route read queries to replicas
   - Master for writes only
   - Connection pooling per replica

3. **CDN for Static Assets**
   - Cache static files
   - Reduce server load
   - Global distribution

### Vertical Scaling

1. **Optimize Node.js**
   ```bash
   node --max-old-space-size=4096 server.js
   ```

2. **Use PM2 Cluster Mode**
   ```bash
   pm2 start server.js -i max
   ```

3. **Enable HTTP/2**
   - Multiplexing support
   - Header compression
   - Server push capabilities

## 8. Monitoring Setup

### Required Tools

1. **Application Monitoring**
   - New Relic / DataDog / AppDynamics
   - Custom performance dashboard
   - Real-time alerts

2. **Database Monitoring**
   - pg_stat_statements extension
   - Slow query logs
   - Connection pool metrics

3. **Infrastructure Monitoring**
   - CPU, Memory, Disk I/O
   - Network throughput
   - Container metrics (if using Docker)

### Key Metrics to Track

- **Response Times**: p50, p95, p99
- **Error Rates**: 4xx, 5xx responses
- **Throughput**: Requests/second
- **Database**: Query time, connection count
- **WebSocket**: Active connections, messages/sec
- **Cache**: Hit rate, eviction rate

## 9. Load Testing

### Recommended Tools

1. **Artillery** for HTTP/WebSocket
   ```yaml
   config:
     target: "https://api.findingsports.com"
     phases:
       - duration: 300
         arrivalRate: 100
         rampTo: 1000
   ```

2. **K6** for complex scenarios
   ```javascript
   import ws from 'k6/ws';
   import { check } from 'k6';
   
   export default function() {
     const url = 'wss://api.findingsports.com';
     const response = ws.connect(url, function(socket) {
       socket.on('open', () => {
         socket.send(JSON.stringify({ type: 'authenticate', token: 'xxx' }));
       });
     });
   }
   ```

### Performance Targets

- **Response Time**: < 200ms (p95)
- **WebSocket Latency**: < 50ms
- **Cache Hit Rate**: > 80%
- **Error Rate**: < 0.1%
- **Concurrent Users**: 5,000+
- **Messages/Second**: 2,000+

## 10. Best Practices

### Code Optimization

1. **Avoid Blocking Operations**
   ```javascript
   // Bad
   const data = fs.readFileSync('large-file.txt');
   
   // Good
   const data = await fs.promises.readFile('large-file.txt');
   ```

2. **Use Streams for Large Data**
   ```javascript
   const stream = db.query(new QueryStream('SELECT * FROM large_table'));
   stream.on('data', processRow);
   ```

3. **Implement Circuit Breakers**
   ```javascript
   const CircuitBreaker = require('opossum');
   const breaker = new CircuitBreaker(databaseCall, {
     timeout: 3000,
     errorThresholdPercentage: 50,
     resetTimeout: 30000
   });
   ```

### Database Best Practices

1. **Connection Pooling**: Always use connection pools
2. **Prepared Statements**: Reduce parsing overhead
3. **Batch Operations**: Group similar queries
4. **Indexes**: Monitor and optimize regularly
5. **Partitioning**: Consider for very large tables

### Caching Best Practices

1. **Cache Warming**: Pre-load frequently accessed data
2. **TTL Strategy**: Balance freshness vs performance
3. **Cache Levels**: Memory → Redis → Database
4. **Invalidation**: Clear caches on data changes
5. **Monitoring**: Track hit rates and evictions

## Deployment Checklist

- [ ] Enable production mode (`NODE_ENV=production`)
- [ ] Configure connection pools
- [ ] Set up Redis for caching
- [ ] Enable WebSocket compression
- [ ] Configure rate limiting
- [ ] Set up monitoring alerts
- [ ] Enable cleanup jobs
- [ ] Test graceful shutdown
- [ ] Load test the system
- [ ] Document API limits

## Troubleshooting

### High Memory Usage
1. Check for memory leaks in event listeners
2. Review connection pool settings
3. Monitor cache sizes
4. Check for large result sets

### Slow Queries
1. Run `EXPLAIN ANALYZE` on slow queries
2. Check missing indexes
3. Review connection pool exhaustion
4. Consider query optimization

### WebSocket Issues
1. Check connection limits
2. Monitor message queue sizes
3. Review rate limiting settings
4. Check for connection leaks

### Cache Problems
1. Monitor eviction rates
2. Check TTL settings
3. Review memory limits
4. Validate invalidation logic