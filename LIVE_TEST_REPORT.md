# 🌐 LIVE SITE TEST RESULTS

**Test Time**: 2025-07-13T10:00:55.353Z
**Live URL**: https://findingsports.com
**Iteration**: 18

## Summary
- **Total Tests**: 19
- **✅ Passed**: 14
- **❌ Failed**: 5
- **Success Rate**: 74%

## Detailed Results

### Health Check
- **URL**: GET /health
- **Status**: ✅ PASS (200)
- **Response Time**: 195ms

### Play Now Core
- **URL**: GET /api/play-now
- **Status**: ✅ PASS (200)
- **Response Time**: 67ms

### Play Now with Location
- **URL**: GET /api/play-now?lat=49.2827&lng=-123.1207&radius=10
- **Status**: ✅ PASS (200)
- **Response Time**: 74ms

### Games API
- **URL**: GET /api/games
- **Status**: ✅ PASS (200)
- **Response Time**: 181ms

### Play Now POST Search
- **URL**: POST /api/play-now/search
- **Status**: ❌ FAIL (404)
- **Response Time**: 124ms

### Venues List
- **URL**: GET /api/venues
- **Status**: ❌ FAIL (404)
- **Response Time**: 104ms

### Sports List
- **URL**: GET /api/sports
- **Status**: ❌ FAIL (404)
- **Response Time**: 64ms

### BC Locations
- **URL**: GET /api/locations/bc
- **Status**: ✅ PASS (200)
- **Response Time**: 67ms

### Location Suggestions
- **URL**: GET /api/locations/suggestions?q=van
- **Status**: ✅ PASS (200)
- **Response Time**: 70ms

### WebSocket Stats
- **URL**: GET /api/ws/stats
- **Status**: ✅ PASS (200)
- **Response Time**: 65ms

### Data Stats
- **URL**: GET /api/data/stats
- **Status**: ✅ PASS (200)
- **Response Time**: 57ms

### Facilities
- **URL**: GET /api/facilities
- **Status**: ✅ PASS (200)
- **Response Time**: 67ms

### Homepage
- **URL**: GET /
- **Status**: ✅ PASS (200)
- **Response Time**: 58ms

### Login Page
- **URL**: GET /login.html
- **Status**: ✅ PASS (200)
- **Response Time**: 66ms

### Dashboard
- **URL**: GET /dashboard.html
- **Status**: ❌ FAIL (404)
- **Response Time**: 62ms

### App JavaScript
- **URL**: GET /js/app.js
- **Status**: ✅ PASS (200)
- **Response Time**: 148ms

### Play Now JavaScript
- **URL**: GET /js/play-now.js
- **Status**: ✅ PASS (200)
- **Response Time**: 126ms

### Google OAuth
- **URL**: GET /auth/google
- **Status**: ✅ PASS (301)
- **Response Time**: 58ms

### Login Attempt
- **URL**: POST /api/auth/login
- **Status**: ❌ FAIL (401)
- **Response Time**: 65ms


⚠️ **Some tests failed - continuing loop...**
