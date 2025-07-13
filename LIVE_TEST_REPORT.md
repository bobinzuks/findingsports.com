# 🌐 LIVE SITE TEST RESULTS

**Test Time**: 2025-07-13T09:57:42.500Z
**Live URL**: https://findingsports.com
**Iteration**: 15

## Summary
- **Total Tests**: 19
- **✅ Passed**: 14
- **❌ Failed**: 5
- **Success Rate**: 74%

## Detailed Results

### Health Check
- **URL**: GET /health
- **Status**: ✅ PASS (200)
- **Response Time**: 202ms

### Play Now Core
- **URL**: GET /api/play-now
- **Status**: ✅ PASS (200)
- **Response Time**: 57ms

### Play Now with Location
- **URL**: GET /api/play-now?lat=49.2827&lng=-123.1207&radius=10
- **Status**: ✅ PASS (200)
- **Response Time**: 64ms

### Games API
- **URL**: GET /api/games
- **Status**: ✅ PASS (200)
- **Response Time**: 61ms

### Play Now POST Search
- **URL**: POST /api/play-now/search
- **Status**: ❌ FAIL (404)
- **Response Time**: 255ms

### Venues List
- **URL**: GET /api/venues
- **Status**: ❌ FAIL (404)
- **Response Time**: 308ms

### Sports List
- **URL**: GET /api/sports
- **Status**: ❌ FAIL (404)
- **Response Time**: 306ms

### BC Locations
- **URL**: GET /api/locations/bc
- **Status**: ✅ PASS (200)
- **Response Time**: 201ms

### Location Suggestions
- **URL**: GET /api/locations/suggestions?q=van
- **Status**: ✅ PASS (200)
- **Response Time**: 62ms

### WebSocket Stats
- **URL**: GET /api/ws/stats
- **Status**: ✅ PASS (200)
- **Response Time**: 58ms

### Data Stats
- **URL**: GET /api/data/stats
- **Status**: ✅ PASS (200)
- **Response Time**: 68ms

### Facilities
- **URL**: GET /api/facilities
- **Status**: ✅ PASS (200)
- **Response Time**: 51ms

### Homepage
- **URL**: GET /
- **Status**: ✅ PASS (200)
- **Response Time**: 63ms

### Login Page
- **URL**: GET /login.html
- **Status**: ✅ PASS (200)
- **Response Time**: 51ms

### Dashboard
- **URL**: GET /dashboard.html
- **Status**: ❌ FAIL (404)
- **Response Time**: 62ms

### App JavaScript
- **URL**: GET /js/app.js
- **Status**: ✅ PASS (200)
- **Response Time**: 143ms

### Play Now JavaScript
- **URL**: GET /js/play-now.js
- **Status**: ✅ PASS (200)
- **Response Time**: 417ms

### Google OAuth
- **URL**: GET /auth/google
- **Status**: ✅ PASS (301)
- **Response Time**: 96ms

### Login Attempt
- **URL**: POST /api/auth/login
- **Status**: ❌ FAIL (401)
- **Response Time**: 211ms


⚠️ **Some tests failed - continuing loop...**
