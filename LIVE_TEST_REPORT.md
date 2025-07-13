# 🌐 LIVE SITE TEST RESULTS

**Test Time**: 2025-07-13T09:41:42.392Z
**Live URL**: https://findingsports.com
**Iteration**: 2

## Summary
- **Total Tests**: 19
- **✅ Passed**: 13
- **❌ Failed**: 6
- **Success Rate**: 68%

## Detailed Results

### Health Check
- **URL**: GET /health
- **Status**: ✅ PASS (200)
- **Response Time**: 266ms

### Play Now Core
- **URL**: GET /api/play-now
- **Status**: ✅ PASS (200)
- **Response Time**: 209ms

### Play Now with Location
- **URL**: GET /api/play-now?lat=49.2827&lng=-123.1207&radius=10
- **Status**: ✅ PASS (200)
- **Response Time**: 54ms

### Games API
- **URL**: GET /api/games
- **Status**: ✅ PASS (200)
- **Response Time**: 350ms

### Play Now POST Search
- **URL**: POST /api/play-now/search
- **Status**: ❌ FAIL (404)
- **Response Time**: 190ms

### Venues List
- **URL**: GET /api/venues
- **Status**: ❌ FAIL (404)
- **Response Time**: 216ms

### Sports List
- **URL**: GET /api/sports
- **Status**: ❌ FAIL (404)
- **Response Time**: 119ms

### BC Locations
- **URL**: GET /api/locations/bc
- **Status**: ✅ PASS (200)
- **Response Time**: 193ms

### Location Suggestions
- **URL**: GET /api/locations/suggestions?q=van
- **Status**: ✅ PASS (200)
- **Response Time**: 206ms

### WebSocket Stats
- **URL**: GET /api/ws/stats
- **Status**: ✅ PASS (200)
- **Response Time**: 456ms

### Data Stats
- **URL**: GET /api/data/stats
- **Status**: ✅ PASS (200)
- **Response Time**: 225ms

### Facilities
- **URL**: GET /api/facilities
- **Status**: ✅ PASS (200)
- **Response Time**: 206ms

### Homepage
- **URL**: GET /
- **Status**: ✅ PASS (200)
- **Response Time**: 211ms

### Login Page
- **URL**: GET /login.html
- **Status**: ✅ PASS (200)
- **Response Time**: 209ms

### Dashboard
- **URL**: GET /dashboard.html
- **Status**: ❌ FAIL (Timeout)
- **Response Time**: N/Ams

### App JavaScript
- **URL**: GET /js/app.js
- **Status**: ❌ FAIL (connect ENETUNREACH 66.33.22.129:443)
- **Response Time**: N/Ams

### Play Now JavaScript
- **URL**: GET /js/play-now.js
- **Status**: ✅ PASS (200)
- **Response Time**: 1082ms

### Google OAuth
- **URL**: GET /auth/google
- **Status**: ✅ PASS (301)
- **Response Time**: 101ms

### Login Attempt
- **URL**: POST /api/auth/login
- **Status**: ❌ FAIL (401)
- **Response Time**: 103ms


⚠️ **Some tests failed - continuing loop...**
