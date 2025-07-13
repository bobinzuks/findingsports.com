# 🔍 FINDING SPORTS - LIVE PROOF REPORT

**Generated**: 2025-07-13T08:40:47.292Z
**Site URL**: https://findingsports.com
**Total Iterations**: 4

## TEST RESULTS - ITERATION 4

### ✅ WORKING ENDPOINTS
- ✅ Backend Health Check: 200 (193ms)
- ✅ Games List: 200 (101ms)
- ✅ Facilities List: 200 (164ms)
- ✅ Play Now - Basic GET: 200 (206ms)
- ✅ Play Now - With Vancouver Location: 200 (50ms)
- ✅ Play Now - Basketball in Vancouver: 200 (37ms)
- ✅ Play Now - Get Activities: 200 (41ms)
- ✅ BC Locations List: 200 (194ms)
- ✅ Location Autocomplete: 200 (169ms)
- ✅ WebSocket Stats: 200 (202ms)
- ✅ Data Aggregation Stats: 200 (168ms)
- ✅ Google OAuth: 301 (170ms)
- ✅ Homepage HTML: 200 (196ms)
- ✅ Login Page: 200 (581ms)
- ✅ App JavaScript: 200 (405ms)
- ✅ Play Now JavaScript: 200 (202ms)

### ❌ FAILED ENDPOINTS
- ❌ Health via API path: 404
- ❌ Venues List: 404
- ❌ Sports List: 404
- ❌ Play Now - POST Search: 404
- ❌ Location Details: 404
- ❌ Login Endpoint: 401
- ❌ Signup Endpoint: 404
- ❌ Auth Me (No Token): 401
- ❌ Dashboard Page: 404
- ❌ Play Now Page: 404
- ❌ Main JavaScript: 404
- ❌ Main Stylesheet: 404
- ❌ Assets Stylesheet: 404
- ❌ User Games: 404
- ❌ Create Game: 401
- ❌ Join Game: 401

## PROOF DATA

```json
[
  {
    "name": "Backend Health Check",
    "url": "https://findingsports.com/health",
    "method": "GET",
    "status": 200,
    "statusText": "OK",
    "success": true,
    "responseTime": 193,
    "headers": {
      "access-control-allow-credentials": "true",
      "content-length": "54",
      "content-type": "application/json; charset=utf-8",
      "date": "Sun, 13 Jul 2025 08:40:42 GMT",
      "etag": "W/\"36-aS5wfOlK4NSu61EsObr80XwYvTk\"",
      "server": "railway-edge",
      "vary": "Origin",
      "x-powered-by": "Express",
      "x-railway-edge": "railway/us-west2",
      "x-railway-request-id": "_eI63QZfRrO_Qor7npoFkQ"
    },
    "data": {
      "status": "ok",
      "timestamp": "2025-07-13T08:40:42.970Z"
    },
    "timestamp": "2025-07-13T08:40:42.995Z"
  },
  {
    "name": "Health via API path",
    "url": "https://findingsports.com/api/health",
    "method": "GET",
    "status": 404,
    "statusText": "Not Found",
    "success": false,
    "responseTime": 41,
    "headers": {
      "access-control-allow-credentials": "true",
      "content-length": "149",
      "content-security-policy": "default-src 'none'",
      "content-type": "text/html; charset=utf-8",
      "date": "Sun, 13 Jul 2025 08:40:43 GMT",
      "server": "railway-edge",
      "vary": "Origin",
      "x-content-type-options": "nosniff",
      "x-powered-by": "Express",
      "x-railway-edge": "railway/us-west2",
      "x-railway-request-id": "iZLndbO4Qr6Q3OPbnpoFkQ"
    },
    "data": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<title>Error</title>\n</head>\n<body>\n<pre>Cannot GET /api/health</pre>\n</body>\n</html>\n",
    "timestamp": "2025-07-13T08:40:43.038Z"
  },
  {
    "name": "Games List",
    "url": "https://findingsports.com/api/games",
    "method": "GET",
    "status": 200,
    "statusText": "OK",
    "success": true,
    "responseTime": 101,
    "headers": {
      "access-control-allow-credentials": "true",
      "content-length": "98",
      "content-type": "application/json; charset=utf-8",
      "date": "Sun, 13 Jul 2025 08:40:43 GMT",
      "etag": "W/\"62-Aem73eXqH8L4QRc41iuwjx3DGwk\"",
      "server": "railway-edge",
      "vary": "Origin",
      "x-powered-by": "Express",
      "x-railway-edge": "railway/us-west2",
      "x-railway-request-id": "V5mXKoFCQuK_pdhAnpoFkQ"
    },
    "data": {
      "games": [],
      "source": "aggregated",
      "searchInfo": {
        "normalizedLocation": null,
        "expandedSearch": false
      }
    },
    "timestamp": "2025-07-13T08:40:43.140Z"
  },
  {
    "name": "Venues List",
    "url": "https://findingsports.com/api/venues",
    "method": "GET",
    "status": 404,
    "statusText": "Not Found",
    "success": false,
    "responseTime": 102,
    "headers": {
      "access-control-allow-credentials": "true",
      "content-length": "149",
      "content-security-policy": "default-src 'none'",
      "content-type": "text/html; charset=utf-8",
      "date": "Sun, 13 Jul 2025 08:40:43 GMT",
      "server": "railway-edge",
      "vary": "Origin",
      "x-content-type-options": "nosniff",
      "x-powered-by": "Express",
      "x-railway-edge": "railway/us-west2",
      "x-railway-request-id": "rMW5C70ISrCQ50YpnpoFkQ"
    },
    "data": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<title>Error</title>\n</head>\n<body>\n<pre>Cannot GET /api/venues</pre>\n</body>\n</html>\n",
    "timestamp": "2025-07-13T08:40:43.242Z"
  },
  {
    "name": "Sports List",
    "url": "https://findingsports.com/api/sports",
    "method": "GET",
    "status": 404,
    "statusText": "Not Found",
    "success": false,
    "responseTime": 42,
    "headers": {
      "access-control-allow-credentials": "true",
      "content-length": "149",
      "content-security-policy": "default-src 'none'",
      "content-type": "text/html; charset=utf-8",
      "date": "Sun, 13 Jul 2025 08:40:43 GMT",
      "server": "railway-edge",
      "vary": "Origin",
      "x-content-type-options": "nosniff",
      "x-powered-by": "Express",
      "x-railway-edge": "railway/us-west2",
      "x-railway-request-id": "-rwQNfGqR7-Bgsr5npoFkQ"
    },
    "data": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<title>Error</title>\n</head>\n<body>\n<pre>Cannot GET /api/sports</pre>\n</body>\n</html>\n",
    "timestamp": "2025-07-13T08:40:43.284Z"
  },
  {
    "name": "Facilities List",
    "url": "https://findingsports.com/api/facilities",
    "method": "GET",
    "status": 200,
    "statusText": "OK",
    "success": true,
    "responseTime": 164,
    "headers": {
      "access-control-allow-credentials": "true",
      "content-length": "17",
      "content-type": "application/json; charset=utf-8",
      "date": "Sun, 13 Jul 2025 08:40:43 GMT",
      "etag": "W/\"11-4vvDab7nYP6EFbPJLxFzvpJTxWM\"",
      "server": "railway-edge",
      "vary": "Origin",
      "x-powered-by": "Express",
      "x-railway-edge": "railway/us-west2",
      "x-railway-request-id": "HdxXHc0HQXCajZyRnpoFkQ"
    },
    "data": {
      "facilities": []
    },
    "timestamp": "2025-07-13T08:40:43.449Z"
  },
  {
    "name": "Play Now - Basic GET",
    "url": "https://findingsports.com/api/play-now",
    "method": "GET",
    "status": 200,
    "statusText": "OK",
    "success": true,
    "responseTime": 206,
    "headers": {
      "access-control-allow-credentials": "true",
      "content-length": "2578",
      "content-type": "application/json; charset=utf-8",
      "date": "Sun, 13 Jul 2025 08:40:43 GMT",
      "etag": "W/\"a12-HFWGNpo/L4NbU7rjQIgqIPrQhoo\"",
      "server": "railway-edge",
      "vary": "Origin",
      "x-powered-by": "Express",
      "x-railway-edge": "railway/us-west2",
      "x-railway-request-id": "ZTr1TDUMSI2dT8I3npoFkQ"
    },
    "data": {
      "activities": {
        "happeningNow": [],
        "startingSoon": [
          {
            "id": "killarney-community-centre-soccer-Sun Jul 13 2025 10:00:00 GMT+0000 (Coordinated Universal Time)",
            "sport": "soccer",
            "type": "drop-in indoor",
            "venue": "Killarney Community Centre",
            "address": "6260 Killarney Street, Vancouver",
            "coordinates": {
              "lat": 49.2292,
              "lng": -123.0465
            },
            "distance": "8.0 km",
            "distanceValue": 8.02424595365533,
            "cost": 5.5,
            "ageGroup": "Adult (19+)",
            "capacity": 40,
            "status": "starting-soon",
            "timeString": "10:00 AM - 12:00 PM",
            "startTime": "2025-07-13T10:00:00.000Z",
            "endTime": "2025-07-13T12:00:00.000Z",
            "startsIn": "1 hour 20 min"
          }
        ],
        "laterToday": [],
        "openCourts": [
          {
            "id": "david-lam-basketball",
            "type": "basketball",
            "venue": "David Lam Park",
            "address": "Pacific Blvd & Drake St, Vancouver",
            "coordinates": {
              "lat": 49.2729,
              "lng": -123.1267
            },
            "status": "open",
            "courts": 2,
            "surface": "outdoor",
            "lights": "Until 10 PM",
            "busyTimes": "Usually busy 6-8 PM",
            "distance": "1.2 km",
            "distanceValue": 1.1734208166451519
          },
          {
            "id": "qe-tennis",
            "type": "tennis",
            "venue": "Queen Elizabeth Park",
            "address": "4600 Cambie St, Vancouver",
            "coordinates": {
              "lat": 49.2418,
              "lng": -123.1126
            },
            "status": "open",
            "courts": 17,
            "surface": "hard court",
            "availability": "First come, first served",
            "busyTimes": "Peak: 5-7 PM",
            "distance": "4.6 km",
            "distanceValue": 4.585698502410713
          },
          {
            "id": "trout-lake-soccer",
            "type": "soccer",
            "venue": "Trout Lake Park",
            "address": "3300 Victoria Dr, Vancouver",
            "coordinates": {
              "lat": 49.2558,
              "lng": -123.0655
            },
            "status": "partial",
            "fields": 2,
            "condition": "Field 1: Open (Good), Field 2: Closed (Standing water)",
            "surface": "grass",
            "distance": "5.0 km",
            "distanceValue": 4.998736720479954
          }
        ],
        "pickupGames": [
          {
            "id": "fb-soccer-andy",
            "sport": "soccer",
            "organizer": "Vancouver Pickup Soccer",
            "platform": "Facebook Group",
            "venue": "Andy Livingstone Park",
            "coordinates": {
              "lat": 49.2846,
              "lng": -123.1026
            },
            "status": "scheduled",
            "time": "6:00 PM - 8:00 PM",
            "playersNeeded": 3,
            "skillLevel": "Casual/Intermediate",
            "joinMethod": "Message on Facebook group",
            "distance": "1.3 km",
            "distanceValue": 1.3297574469657125
          },
          {
            "id": "opensports-basketball",
            "sport": "basketball",
            "organizer": "OpenSports App",
            "platform": "OpenSports",
            "venue": "Sunset Community Centre",
            "coordinates": {
              "lat": 49.2187,
              "lng": -123.1043
            },
            "status": "scheduled",
            "time": "8:00 PM",
            "spotsLeft": 2,
            "skillLevel": "Competitive",
            "joinMethod": "Join via OpenSports app",
            "distance": "7.2 km",
            "distanceValue": 7.215342125652746
          }
        ]
      },
      "summary": {
        "totalActivities": 1,
        "happeningNow": 0,
        "startingSoon": 1,
        "laterToday": 0,
        "openCourts": 3,
        "pickupGames": 2,
        "searchRadius": "10 km",
        "userLocation": {
          "lat": 49.2827,
          "lng": -123.1207
        },
        "currentTime": "2025-07-13T08:40:43.476Z"
      }
    },
    "timestamp": "2025-07-13T08:40:43.656Z"
  },
  {
    "name": "Play Now - With Vancouver Location",
    "url": "https://findingsports.com/api/play-now?lat=49.2827&lng=-123.1207&radius=10",
    "method": "GET",
    "status": 200,
    "statusText": "OK",
    "success": true,
    "responseTime": 50,
    "headers": {
      "access-control-allow-credentials": "true",
      "content-length": "2578",
      "content-type": "application/json; charset=utf-8",
      "date": "Sun, 13 Jul 2025 08:40:43 GMT",
      "etag": "W/\"a12-xCw0xeHOoR6yBUehgo2hl8i42hU\"",
      "server": "railway-edge",
      "vary": "Origin",
      "x-powered-by": "Express",
      "x-railway-edge": "railway/us-west2",
      "x-railway-request-id": "Si9ZZN86QMSM1LzVnpoFkQ"
    },
    "data": {
      "activities": {
        "happeningNow": [],
        "startingSoon": [
          {
            "id": "killarney-community-centre-soccer-Sun Jul 13 2025 10:00:00 GMT+0000 (Coordinated Universal Time)",
            "sport": "soccer",
            "type": "drop-in indoor",
            "venue": "Killarney Community Centre",
            "address": "6260 Killarney Street, Vancouver",
            "coordinates": {
              "lat": 49.2292,
              "lng": -123.0465
            },
            "distance": "8.0 km",
            "distanceValue": 8.02424595365533,
            "cost": 5.5,
            "ageGroup": "Adult (19+)",
            "capacity": 40,
            "status": "starting-soon",
            "timeString": "10:00 AM - 12:00 PM",
            "startTime": "2025-07-13T10:00:00.000Z",
            "endTime": "2025-07-13T12:00:00.000Z",
            "startsIn": "1 hour 20 min"
          }
        ],
        "laterToday": [],
        "openCourts": [
          {
            "id": "david-lam-basketball",
            "type": "basketball",
            "venue": "David Lam Park",
            "address": "Pacific Blvd & Drake St, Vancouver",
            "coordinates": {
              "lat": 49.2729,
              "lng": -123.1267
            },
            "status": "open",
            "courts": 2,
            "surface": "outdoor",
            "lights": "Until 10 PM",
            "busyTimes": "Usually busy 6-8 PM",
            "distance": "1.2 km",
            "distanceValue": 1.1734208166451519
          },
          {
            "id": "qe-tennis",
            "type": "tennis",
            "venue": "Queen Elizabeth Park",
            "address": "4600 Cambie St, Vancouver",
            "coordinates": {
              "lat": 49.2418,
              "lng": -123.1126
            },
            "status": "open",
            "courts": 17,
            "surface": "hard court",
            "availability": "First come, first served",
            "busyTimes": "Peak: 5-7 PM",
            "distance": "4.6 km",
            "distanceValue": 4.585698502410713
          },
          {
            "id": "trout-lake-soccer",
            "type": "soccer",
            "venue": "Trout Lake Park",
            "address": "3300 Victoria Dr, Vancouver",
            "coordinates": {
              "lat": 49.2558,
              "lng": -123.0655
            },
            "status": "partial",
            "fields": 2,
            "condition": "Field 1: Open (Good), Field 2: Closed (Standing water)",
            "surface": "grass",
            "distance": "5.0 km",
            "distanceValue": 4.998736720479954
          }
        ],
        "pickupGames": [
          {
            "id": "fb-soccer-andy",
            "sport": "soccer",
            "organizer": "Vancouver Pickup Soccer",
            "platform": "Facebook Group",
            "venue": "Andy Livingstone Park",
            "coordinates": {
              "lat": 49.2846,
              "lng": -123.1026
            },
            "status": "scheduled",
            "time": "6:00 PM - 8:00 PM",
            "playersNeeded": 3,
            "skillLevel": "Casual/Intermediate",
            "joinMethod": "Message on Facebook group",
            "distance": "1.3 km",
            "distanceValue": 1.3297574469657125
          },
          {
            "id": "opensports-basketball",
            "sport": "basketball",
            "organizer": "OpenSports App",
            "platform": "OpenSports",
            "venue": "Sunset Community Centre",
            "coordinates": {
              "lat": 49.2187,
              "lng": -123.1043
            },
            "status": "scheduled",
            "time": "8:00 PM",
            "spotsLeft": 2,
            "skillLevel": "Competitive",
            "joinMethod": "Join via OpenSports app",
            "distance": "7.2 km",
            "distanceValue": 7.215342125652746
          }
        ]
      },
      "summary": {
        "totalActivities": 1,
        "happeningNow": 0,
        "startingSoon": 1,
        "laterToday": 0,
        "openCourts": 3,
        "pickupGames": 2,
        "searchRadius": "10 km",
        "userLocation": {
          "lat": 49.2827,
          "lng": -123.1207
        },
        "currentTime": "2025-07-13T08:40:43.683Z"
      }
    },
    "timestamp": "2025-07-13T08:40:43.706Z"
  },
  {
    "name": "Play Now - Basketball in Vancouver",
    "url": "https://findingsports.com/api/play-now?lat=49.2827&lng=-123.1207&radius=10&sport=basketball",
    "method": "GET",
    "status": 200,
    "statusText": "OK",
    "success": true,
    "responseTime": 37,
    "headers": {
      "access-control-allow-credentials": "true",
      "content-length": "2578",
      "content-type": "application/json; charset=utf-8",
      "date": "Sun, 13 Jul 2025 08:40:43 GMT",
      "etag": "W/\"a12-Il2OGi0oVGYfhDvA113xlA7YoY4\"",
      "server": "railway-edge",
      "vary": "Origin",
      "x-powered-by": "Express",
      "x-railway-edge": "railway/us-west2",
      "x-railway-request-id": "4IHW7rFJSi-2pnGInpoFkQ"
    },
    "data": {
      "activities": {
        "happeningNow": [],
        "startingSoon": [
          {
            "id": "killarney-community-centre-soccer-Sun Jul 13 2025 10:00:00 GMT+0000 (Coordinated Universal Time)",
            "sport": "soccer",
            "type": "drop-in indoor",
            "venue": "Killarney Community Centre",
            "address": "6260 Killarney Street, Vancouver",
            "coordinates": {
              "lat": 49.2292,
              "lng": -123.0465
            },
            "distance": "8.0 km",
            "distanceValue": 8.02424595365533,
            "cost": 5.5,
            "ageGroup": "Adult (19+)",
            "capacity": 40,
            "status": "starting-soon",
            "timeString": "10:00 AM - 12:00 PM",
            "startTime": "2025-07-13T10:00:00.000Z",
            "endTime": "2025-07-13T12:00:00.000Z",
            "startsIn": "1 hour 20 min"
          }
        ],
        "laterToday": [],
        "openCourts": [
          {
            "id": "david-lam-basketball",
            "type": "basketball",
            "venue": "David Lam Park",
            "address": "Pacific Blvd & Drake St, Vancouver",
            "coordinates": {
              "lat": 49.2729,
              "lng": -123.1267
            },
            "status": "open",
            "courts": 2,
            "surface": "outdoor",
            "lights": "Until 10 PM",
            "busyTimes": "Usually busy 6-8 PM",
            "distance": "1.2 km",
            "distanceValue": 1.1734208166451519
          },
          {
            "id": "qe-tennis",
            "type": "tennis",
            "venue": "Queen Elizabeth Park",
            "address": "4600 Cambie St, Vancouver",
            "coordinates": {
              "lat": 49.2418,
              "lng": -123.1126
            },
            "status": "open",
            "courts": 17,
            "surface": "hard court",
            "availability": "First come, first served",
            "busyTimes": "Peak: 5-7 PM",
            "distance": "4.6 km",
            "distanceValue": 4.585698502410713
          },
          {
            "id": "trout-lake-soccer",
            "type": "soccer",
            "venue": "Trout Lake Park",
            "address": "3300 Victoria Dr, Vancouver",
            "coordinates": {
              "lat": 49.2558,
              "lng": -123.0655
            },
            "status": "partial",
            "fields": 2,
            "condition": "Field 1: Open (Good), Field 2: Closed (Standing water)",
            "surface": "grass",
            "distance": "5.0 km",
            "distanceValue": 4.998736720479954
          }
        ],
        "pickupGames": [
          {
            "id": "fb-soccer-andy",
            "sport": "soccer",
            "organizer": "Vancouver Pickup Soccer",
            "platform": "Facebook Group",
            "venue": "Andy Livingstone Park",
            "coordinates": {
              "lat": 49.2846,
              "lng": -123.1026
            },
            "status": "scheduled",
            "time": "6:00 PM - 8:00 PM",
            "playersNeeded": 3,
            "skillLevel": "Casual/Intermediate",
            "joinMethod": "Message on Facebook group",
            "distance": "1.3 km",
            "distanceValue": 1.3297574469657125
          },
          {
            "id": "opensports-basketball",
            "sport": "basketball",
            "organizer": "OpenSports App",
            "platform": "OpenSports",
            "venue": "Sunset Community Centre",
            "coordinates": {
              "lat": 49.2187,
              "lng": -123.1043
            },
            "status": "scheduled",
            "time": "8:00 PM",
            "spotsLeft": 2,
            "skillLevel": "Competitive",
            "joinMethod": "Join via OpenSports app",
            "distance": "7.2 km",
            "distanceValue": 7.215342125652746
          }
        ]
      },
      "summary": {
        "totalActivities": 1,
        "happeningNow": 0,
        "startingSoon": 1,
        "laterToday": 0,
        "openCourts": 3,
        "pickupGames": 2,
        "searchRadius": "10 km",
        "userLocation": {
          "lat": 49.2827,
          "lng": -123.1207
        },
        "currentTime": "2025-07-13T08:40:43.730Z"
      }
    },
    "timestamp": "2025-07-13T08:40:43.745Z"
  },
  {
    "name": "Play Now - POST Search",
    "url": "https://findingsports.com/api/play-now/search",
    "method": "POST",
    "status": 404,
    "statusText": "Not Found",
    "success": false,
    "responseTime": 169,
    "headers": {
      "access-control-allow-credentials": "true",
      "content-length": "159",
      "content-security-policy": "default-src 'none'",
      "content-type": "text/html; charset=utf-8",
      "date": "Sun, 13 Jul 2025 08:40:43 GMT",
      "server": "railway-edge",
      "vary": "Origin",
      "x-content-type-options": "nosniff",
      "x-powered-by": "Express",
      "x-railway-edge": "railway/us-west2",
      "x-railway-request-id": "W-bKPM_6TeOKmZHAnpoFkQ"
    },
    "data": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<title>Error</title>\n</head>\n<body>\n<pre>Cannot POST /api/play-now/search</pre>\n</body>\n</html>\n",
    "timestamp": "2025-07-13T08:40:43.914Z"
  },
  {
    "name": "Play Now - Get Activities",
    "url": "https://findingsports.com/api/play-now/activities?city=vancouver",
    "method": "GET",
    "status": 200,
    "statusText": "OK",
    "success": true,
    "responseTime": 41,
    "headers": {
      "access-control-allow-credentials": "true",
      "content-length": "453",
      "content-type": "application/json; charset=utf-8",
      "date": "Sun, 13 Jul 2025 08:40:43 GMT",
      "etag": "W/\"1c5-IDTV4tNMrKsHdMIPJb+NsQ5duxY\"",
      "server": "railway-edge",
      "vary": "Origin",
      "x-powered-by": "Express",
      "x-railway-edge": "railway/us-west2",
      "x-railway-request-id": "yZWPezfqS8S_RxpDnpoFkQ"
    },
    "data": {
      "id": "activities",
      "venue": {
        "name": "Hillcrest Community Centre",
        "address": "4575 Clancy Loranger Way, Vancouver",
        "phone": "604-257-8680",
        "website": "https://vancouver.ca/parks-recreation-culture/hillcrest-centre.aspx",
        "amenities": [
          "Parking",
          "Change rooms",
          "Water fountain",
          "Equipment rental"
        ]
      },
      "currentPlayers": 23,
      "recentActivity": [
        {
          "time": "10 mins ago",
          "message": "3 players joined"
        },
        {
          "time": "25 mins ago",
          "message": "Game started"
        }
      ],
      "similarActivities": []
    },
    "timestamp": "2025-07-13T08:40:43.957Z"
  },
  {
    "name": "BC Locations List",
    "url": "https://findingsports.com/api/locations/bc",
    "method": "GET",
    "status": 200,
    "statusText": "OK",
    "success": true,
    "responseTime": 194,
    "headers": {
      "access-control-allow-credentials": "true",
      "content-length": "2019",
      "content-type": "application/json; charset=utf-8",
      "date": "Sun, 13 Jul 2025 08:40:44 GMT",
      "etag": "W/\"7e3-h6JClBgAwdBui1QaM6FwzyqnUPw\"",
      "server": "railway-edge",
      "vary": "Origin",
      "x-powered-by": "Express",
      "x-railway-edge": "railway/us-west2",
      "x-railway-request-id": "XFlQ46lUSUi1VrMinpoFkQ"
    },
    "data": {
      "locations": [
        {
          "key": "salmon-arm",
          "name": "Salmon Arm",
          "coordinates": {
            "lat": 50.7031,
            "lng": -119.2733
          },
          "region": "Shuswap",
          "aliases": [
            "salmonarm",
            "salmon arm"
          ]
        },
        {
          "key": "kamloops",
          "name": "Kamloops",
          "coordinates": {
            "lat": 50.6745,
            "lng": -120.3273
          },
          "region": "Thompson-Nicola",
          "aliases": [
            "kamloops"
          ]
        },
        {
          "key": "vernon",
          "name": "Vernon",
          "coordinates": {
            "lat": 50.2671,
            "lng": -119.272
          },
          "region": "North Okanagan",
          "aliases": [
            "vernon"
          ]
        },
        {
          "key": "kelowna",
          "name": "Kelowna",
          "coordinates": {
            "lat": 49.888,
            "lng": -119.496
          },
          "region": "Central Okanagan",
          "aliases": [
            "kelowna"
          ]
        },
        {
          "key": "penticton",
          "name": "Penticton",
          "coordinates": {
            "lat": 49.4928,
            "lng": -119.5937
          },
          "region": "South Okanagan",
          "aliases": [
            "penticton"
          ]
        },
        {
          "key": "revelstoke",
          "name": "Revelstoke",
          "coordinates": {
            "lat": 50.7981,
            "lng": -118.2095
          },
          "region": "Columbia-Shuswap",
          "aliases": [
            "revelstoke"
          ]
        },
        {
          "key": "sicamous",
          "name": "Sicamous",
          "coordinates": {
            "lat": 50.85,
            "lng": -118.9773
          },
          "region": "Columbia-Shuswap",
          "aliases": [
            "sicamous"
          ]
        },
        {
          "key": "enderby",
          "name": "Enderby",
          "coordinates": {
            "lat": 50.5488,
            "lng": -119.1414
          },
          "region": "North Okanagan",
          "aliases": [
            "enderby"
          ]
        },
        {
          "key": "armstrong",
          "name": "Armstrong",
          "coordinates": {
            "lat": 50.449,
            "lng": -119.2017
          },
          "region": "North Okanagan",
          "aliases": [
            "armstrong"
          ]
        },
        {
          "key": "chase",
          "name": "Chase",
          "coordinates": {
            "lat": 50.8167,
            "lng": -119.6833
          },
          "region": "Thompson-Nicola",
          "aliases": [
            "chase"
          ]
        },
        {
          "key": "vancouver",
          "name": "Vancouver",
          "coordinates": {
            "lat": 49.2827,
            "lng": -123.1207
          },
          "region": "Metro Vancouver",
          "aliases": [
            "vancouver",
            "van"
          ]
        },
        {
          "key": "victoria",
          "name": "Victoria",
          "coordinates": {
            "lat": 48.4284,
            "lng": -123.3656
          },
          "region": "Capital Regional District",
          "aliases": [
            "victoria",
            "vic"
          ]
        },
        {
          "key": "burnaby",
          "name": "Burnaby",
          "coordinates": {
            "lat": 49.2488,
            "lng": -122.9805
          },
          "region": "Metro Vancouver",
          "aliases": [
            "burnaby"
          ]
        },
        {
          "key": "richmond",
          "name": "Richmond",
          "coordinates": {
            "lat": 49.1666,
            "lng": -123.1336
          },
          "region": "Metro Vancouver",
          "aliases": [
            "richmond"
          ]
        },
        {
          "key": "surrey",
          "name": "Surrey",
          "coordinates": {
            "lat": 49.1913,
            "lng": -122.849
          },
          "region": "Metro Vancouver",
          "aliases": [
            "surrey"
          ]
        }
      ]
    },
    "timestamp": "2025-07-13T08:40:44.152Z"
  },
  {
    "name": "Location Autocomplete",
    "url": "https://findingsports.com/api/locations/suggestions?q=vancouver",
    "method": "GET",
    "status": 200,
    "statusText": "OK",
    "success": true,
    "responseTime": 169,
    "headers": {
      "access-control-allow-credentials": "true",
      "content-length": "97",
      "content-type": "application/json; charset=utf-8",
      "date": "Sun, 13 Jul 2025 08:40:44 GMT",
      "etag": "W/\"61-buG3qNRuEl8/QFPRrJBPnGSd91E\"",
      "server": "railway-edge",
      "vary": "Origin",
      "x-powered-by": "Express",
      "x-railway-edge": "railway/us-west2",
      "x-railway-request-id": "lYvz9GSTQkio8thWnpoFkQ"
    },
    "data": {
      "suggestions": [
        {
          "key": "vancouver",
          "name": "Vancouver",
          "region": "Metro Vancouver",
          "type": "name"
        }
      ]
    },
    "timestamp": "2025-07-13T08:40:44.321Z"
  },
  {
    "name": "Location Details",
    "url": "https://findingsports.com/api/locations/vancouver",
    "method": "GET",
    "status": 404,
    "statusText": "Not Found",
    "success": false,
    "responseTime": 39,
    "headers": {
      "access-control-allow-credentials": "true",
      "content-length": "162",
      "content-security-policy": "default-src 'none'",
      "content-type": "text/html; charset=utf-8",
      "date": "Sun, 13 Jul 2025 08:40:44 GMT",
      "server": "railway-edge",
      "vary": "Origin",
      "x-content-type-options": "nosniff",
      "x-powered-by": "Express",
      "x-railway-edge": "railway/us-west2",
      "x-railway-request-id": "1KXyA3v3Rb6ziEyhnpoFkQ"
    },
    "data": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<title>Error</title>\n</head>\n<body>\n<pre>Cannot GET /api/locations/vancouver</pre>\n</body>\n</html>\n",
    "timestamp": "2025-07-13T08:40:44.360Z"
  },
  {
    "name": "WebSocket Stats",
    "url": "https://findingsports.com/api/ws/stats",
    "method": "GET",
    "status": 200,
    "statusText": "OK",
    "success": true,
    "responseTime": 202,
    "headers": {
      "access-control-allow-credentials": "true",
      "content-length": "112",
      "content-type": "application/json; charset=utf-8",
      "date": "Sun, 13 Jul 2025 08:40:44 GMT",
      "etag": "W/\"70-1Qsmj7cG6Toq/gRhLdpiw36DPjs\"",
      "server": "railway-edge",
      "vary": "Origin",
      "x-powered-by": "Express",
      "x-railway-edge": "railway/us-west2",
      "x-railway-request-id": "iT7N6fNHTaC5voiXnpoFkQ"
    },
    "data": {
      "totalConnections": 0,
      "gameRooms": 0,
      "locationRooms": 0,
      "channelRooms": 0,
      "authenticatedUsers": 0,
      "totalMessages": 0
    },
    "timestamp": "2025-07-13T08:40:44.562Z"
  },
  {
    "name": "Data Aggregation Stats",
    "url": "https://findingsports.com/api/data/stats",
    "method": "GET",
    "status": 200,
    "statusText": "OK",
    "success": true,
    "responseTime": 168,
    "headers": {
      "access-control-allow-credentials": "true",
      "content-length": "215",
      "content-type": "application/json; charset=utf-8",
      "date": "Sun, 13 Jul 2025 08:40:44 GMT",
      "etag": "W/\"d7-KpPQSjP2uJ6rwVVZ6zbapVY8GoM\"",
      "server": "railway-edge",
      "vary": "Origin",
      "x-powered-by": "Express",
      "x-railway-edge": "railway/us-west2",
      "x-railway-request-id": "Pu_cG2YTSYqFsx8vnpoFkQ"
    },
    "data": {
      "totalGames": 0,
      "totalFacilities": 0,
      "sources": [
        {
          "name": "vancouverOpenData",
          "lastUpdate": null,
          "type": "api"
        },
        {
          "name": "communityCenter",
          "lastUpdate": null,
          "type": "scrape"
        },
        {
          "name": "nvrcGymnasiums"
        }
      ],
      "sportBreakdown": {}
    },
    "timestamp": "2025-07-13T08:40:44.731Z"
  },
  {
    "name": "Login Endpoint",
    "url": "https://findingsports.com/api/auth/login",
    "method": "POST",
    "status": 401,
    "statusText": "Unauthorized",
    "success": false,
    "responseTime": 49,
    "headers": {
      "access-control-allow-credentials": "true",
      "content-length": "31",
      "content-type": "application/json; charset=utf-8",
      "date": "Sun, 13 Jul 2025 08:40:44 GMT",
      "etag": "W/\"1f-mRYQ6Yx/raK/ssDeWseqQCiH0yM\"",
      "server": "railway-edge",
      "vary": "Origin",
      "x-powered-by": "Express",
      "x-railway-edge": "railway/us-west2",
      "x-railway-request-id": "vURV95VoQlCit4MAnpoFkQ"
    },
    "data": {
      "error": "Invalid credentials"
    },
    "timestamp": "2025-07-13T08:40:44.781Z"
  },
  {
    "name": "Signup Endpoint",
    "url": "https://findingsports.com/api/auth/signup",
    "method": "POST",
    "status": 404,
    "statusText": "Not Found",
    "success": false,
    "responseTime": 188,
    "headers": {
      "access-control-allow-credentials": "true",
      "content-length": "155",
      "content-security-policy": "default-src 'none'",
      "content-type": "text/html; charset=utf-8",
      "date": "Sun, 13 Jul 2025 08:40:44 GMT",
      "server": "railway-edge",
      "vary": "Origin",
      "x-content-type-options": "nosniff",
      "x-powered-by": "Express",
      "x-railway-edge": "railway/us-west2",
      "x-railway-request-id": "xx3s-U2ATvu1KPFynpoFkQ"
    },
    "data": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<title>Error</title>\n</head>\n<body>\n<pre>Cannot POST /api/auth/signup</pre>\n</body>\n</html>\n",
    "timestamp": "2025-07-13T08:40:44.971Z"
  },
  {
    "name": "Google OAuth",
    "url": "https://findingsports.com/auth/google",
    "method": "GET",
    "status": 301,
    "statusText": "Moved Permanently",
    "success": true,
    "responseTime": 170,
    "headers": {
      "access-control-allow-credentials": "true",
      "content-length": "161",
      "content-security-policy": "default-src 'none'",
      "content-type": "text/html; charset=UTF-8",
      "date": "Sun, 13 Jul 2025 08:40:44 GMT",
      "location": "/auth/google/",
      "server": "railway-edge",
      "vary": "Origin",
      "x-content-type-options": "nosniff",
      "x-powered-by": "Express",
      "x-railway-edge": "railway/us-west2",
      "x-railway-request-id": "tISxACA3R7adHQD5npoFkQ"
    },
    "data": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<title>Redirecting</title>\n</head>\n<body>\n<pre>Redirecting to /auth/google/</pre>\n</body>\n</html>\n",
    "timestamp": "2025-07-13T08:40:45.142Z"
  },
  {
    "name": "Auth Me (No Token)",
    "url": "https://findingsports.com/api/auth/me",
    "method": "GET",
    "status": 401,
    "statusText": "Unauthorized",
    "success": false,
    "responseTime": 43,
    "headers": {
      "access-control-allow-credentials": "true",
      "content-length": "12",
      "content-type": "text/plain; charset=utf-8",
      "date": "Sun, 13 Jul 2025 08:40:45 GMT",
      "etag": "W/\"c-dAuDFQrdjS3hezqxDTNgW7AOlYk\"",
      "server": "railway-edge",
      "vary": "Origin",
      "x-powered-by": "Express",
      "x-railway-edge": "railway/us-west2",
      "x-railway-request-id": "wiw5B2UESxyYM1UTnpoFkQ"
    },
    "data": "Unauthorized",
    "timestamp": "2025-07-13T08:40:45.185Z"
  },
  {
    "name": "Homepage HTML",
    "url": "https://findingsports.com/",
    "method": "GET",
    "status": 200,
    "statusText": "OK",
    "success": true,
    "responseTime": 196,
    "headers": {
      "accept-ranges": "bytes",
      "access-control-allow-credentials": "true",
      "cache-control": "public, max-age=0",
      "content-length": "7020",
      "content-type": "text/html; charset=UTF-8",
      "date": "Sun, 13 Jul 2025 08:40:45 GMT",
      "etag": "W/\"1b6c-198023b3760\"",
      "last-modified": "Sun, 13 Jul 2025 05:21:32 GMT",
      "server": "railway-edge",
      "vary": "Origin",
      "x-powered-by": "Express",
      "x-railway-edge": "railway/us-west2",
      "x-railway-request-id": "LDCry2MlTrK1X7EynpoFkQ"
    },
    "data": "<!doctype html>\n<html lang=\"en\">\n    <head>\n        <meta charset=\"UTF-8\" />\n        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n        <title>Finding Sports - Find Sports Near You</title>\n        <link rel=\"stylesheet\" href=\"css/styles.css\" />\n        <link rel=\"stylesheet\" href=\"css/background-enhancement.css\" />\n        <link rel=\"stylesheet\" href=\"css/play-now.css\" />\n        <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\" />\n        <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin />\n        <link\n            href=\"https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Inter:wght@300;400;500;600;700&display=swap\"\n            rel=\"stylesheet\"\n        />\n        <link rel=\"stylesheet\" href=\"https://unpkg.com/leaflet@1.9.4/dist/leaflet.css\" />\n        <script>\n            // Google Maps API Key (replace with your own key in production)\n            window.GOOGLE_MAPS_API_KEY = 'AIzaSyD2ux0PIekUQLAqVDNhy0tHwhBht6vcXqA';\n            \n            // Load Google Maps API\n            function loadGoogleMapsScript() {\n                const script = document.createElement('script');\n                script.src = `https://maps.googleapis.com/maps/api/js?key=${window.GOOGLE_MAPS_API_KEY}&libraries=places&callback=onGoogleMapsReady`;\n                script.async = true;\n                script.defer = true;\n                document.head.appendChild(script);\n            }\n            \n            // Callback when Google Maps is ready\n            window.onGoogleMapsReady = function() {\n                console.log('Google Maps API loaded successfully');\n                window.googleMapsLoaded = true;\n                \n                // Dispatch event for any waiting code\n                window.dispatchEvent(new Event('googlemapsloaded'));\n            };\n            \n            // Start loading Google Maps\n            loadGoogleMapsScript();\n        </script>\n    </head>\n    <body>\n        <div class=\"sports-bg-pattern\"></div>\n        <div class=\"app-container\">\n            <!-- Header -->\n            <header class=\"header\">\n                <div class=\"header-content\">\n                    <div class=\"logo-section\">\n                        <img src=\"images/logo2.png\" alt=\"Finding Sports\" class=\"logo-image\" />\n                        <p class=\"tagline\">Wherever, whenever</p>\n                    </div>\n                    <div class=\"user-menu header-right\">\n                        <!-- User menu will be populated by JavaScript -->\n                    </div>\n                </div>\n            </header>\n\n            <!-- Search Section -->\n            <section class=\"search-section\">\n                <div class=\"search-container\">\n                    <select class=\"location-select\" id=\"locationSelect\">\n                        <option value=\"vancouver\">Vancouver</option>\n                        <option value=\"burnaby\">Burnaby</option>\n                        <option value=\"richmond\">Richmond</option>\n                        <option value=\"surrey\">Surrey</option>\n                    </select>\n\n                    <select class=\"sport-select\" id=\"sportSelect\">\n                        <option value=\"any\">Any sport</option>\n                        <option value=\"basketball\">Basketball</option>\n                        <option value=\"soccer\">Soccer</option>\n                        <option value=\"volleyball\">Volleyball</option>\n                        <option value=\"tennis\">Tennis</option>\n                        <option value=\"hockey\">Hockey</option>\n                    </select>\n\n                    <button class=\"search-btn\" onclick=\"searchGames()\">Search</button>\n                    <button class=\"play-now-btn\" onclick=\"playNow()\">Play Now</button>\n\n                    <div\n                        style=\"\n                            text-align: center;\n                            margin-top: 1rem;\n                            display: flex;\n                            justify-content: center;\n                            gap: 2rem;\n                            flex-wrap: wrap;\n                        \"\n                    >\n                        <a href=\"/submit-game.html\" style=\"color: #ff6b35; text-decoration: none; font-weight: 500\">\n                            Submit a Drop-in Game\n                        </a>\n                        <a href=\"sport-rules.html\" style=\"color: #f4c542; text-decoration: none; font-weight: 500\">\n                            Sport Rules Guide\n                        </a>\n                    </div>\n                </div>\n            </section>\n\n            <!-- Navigation Tabs -->\n            <nav class=\"tabs\">\n                <button class=\"tab active\" onclick=\"switchTab('social')\">Social Feed</button>\n                <button class=\"tab\" onclick=\"switchTab('upcoming')\">Upcoming Games</button>\n                <button class=\"tab\" onclick=\"showRulesPage()\">Sport Rules</button>\n            </nav>\n\n            <!-- Main Content Area -->\n            <main class=\"main-content\">\n                <div class=\"content-wrapper\">\n                    <!-- Games List -->\n                    <section class=\"games-section\">\n                        <h2 class=\"section-title\">Games near <span id=\"locationName\">Vancouver</span></h2>\n\n                        <div class=\"games-list\" id=\"gamesList\">\n                            <!-- Games will be loaded dynamically from the API -->\n                        </div>\n\n                        <!-- Join Game Section will be dynamically added when needed -->\n                    </section>\n\n                    <!-- Map Section -->\n                    <section class=\"map-section\">\n                        <div id=\"map\" class=\"map-container\"></div>\n                    </section>\n                </div>\n            </main>\n        </div>\n\n        <script src=\"https://unpkg.com/leaflet@1.9.4/dist/leaflet.js\"></script>\n        <script src=\"https://cdn.socket.io/4.5.4/socket.io.min.js\"></script>\n        <script src=\"js/config.js\"></script>\n        <script src=\"js/google-maps.js\"></script>\n        <script src=\"js/api.js\"></script>\n        <script src=\"js/websocket.js\"></script>\n        <script src=\"js/venue-search.js\"></script>\n        <script src=\"js/location-search-ui.js\"></script>\n        <script src=\"js/location-service.js\"></script>\n        <script src=\"js/play-now-service.js\"></script>\n        <script src=\"js/play-now.js\"></script>\n        <script src=\"js/drop-in-games.js\"></script>\n        <script src=\"js/social-feed.js\"></script>\n        <script src=\"js/leagues.js\"></script>\n        <script src=\"js/sport-rules.js\"></script>\n        <script src=\"js/language-service.js\"></script>\n        <script src=\"js/debug-utils.js\"></script>\n        <script src=\"js/map-debug.js\"></script>\n        <script src=\"js/map-init-fix.js\"></script>\n        <script src=\"js/app.js\"></script>\n        <script src=\"fix-play-now.js\"></script>\n    </body>\n</html>\n",
    "timestamp": "2025-07-13T08:40:45.382Z"
  },
  {
    "name": "Login Page",
    "url": "https://findingsports.com/login.html",
    "method": "GET",
    "status": 200,
    "statusText": "OK",
    "success": true,
    "responseTime": 581,
    "headers": {
      "accept-ranges": "bytes",
      "access-control-allow-credentials": "true",
      "cache-control": "public, max-age=0",
      "content-length": "4847",
      "content-type": "text/html; charset=UTF-8",
      "date": "Sun, 13 Jul 2025 08:40:45 GMT",
      "etag": "W/\"12ef-198023b3760\"",
      "last-modified": "Sun, 13 Jul 2025 05:21:32 GMT",
      "server": "railway-edge",
      "vary": "Origin",
      "x-powered-by": "Express",
      "x-railway-edge": "railway/us-west2",
      "x-railway-request-id": "Q-78I1nnREOf-1wBnpoFkQ"
    },
    "data": "<!doctype html>\n<html lang=\"en\">\n    <head>\n        <meta charset=\"UTF-8\" />\n        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n        <title>Finding Sports - Login</title>\n        <link rel=\"stylesheet\" href=\"css/styles.css\" />\n        <link rel=\"stylesheet\" href=\"css/background-enhancement.css\" />\n        <link rel=\"stylesheet\" href=\"css/auth.css\" />\n        <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\" />\n        <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin />\n        <link\n            href=\"https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Inter:wght@300;400;500;600;700&display=swap\"\n            rel=\"stylesheet\"\n        />\n    </head>\n    <body>\n        <div class=\"sports-bg-pattern\"></div>\n        <div class=\"app-container\">\n            <div class=\"auth-container\">\n                <div class=\"auth-box\">\n                    <div class=\"logo-section-auth\">\n                        <img src=\"images/logo2.png\" alt=\"Finding Sports\" class=\"logo-image-auth\" />\n                        <p class=\"tagline\">Wherever, whenever</p>\n                    </div>\n\n                    <div class=\"auth-tabs\">\n                        <button class=\"auth-tab active\" onclick=\"switchAuthTab('login')\">Login</button>\n                        <button class=\"auth-tab\" onclick=\"switchAuthTab('register')\">Sign Up</button>\n                    </div>\n\n                    <!-- Login Form -->\n                    <form id=\"loginForm\" class=\"auth-form\">\n                        <div class=\"form-group\">\n                            <label for=\"email\">Email</label>\n                            <input\n                                type=\"email\"\n                                id=\"email\"\n                                name=\"email\"\n                                required\n                                placeholder=\"demo@example.com\"\n                                value=\"demo@example.com\"\n                            />\n                        </div>\n\n                        <div class=\"form-group\">\n                            <label for=\"password\">Password</label>\n                            <input\n                                type=\"password\"\n                                id=\"password\"\n                                name=\"password\"\n                                required\n                                placeholder=\"Enter your password\"\n                                value=\"demo123\"\n                            />\n                        </div>\n\n                        <button type=\"submit\" class=\"auth-btn\">Login</button>\n\n                        <div class=\"demo-info\">\n                            <p>Demo Account:</p>\n                            <p>Email: demo@example.com</p>\n                            <p>Password: demo123</p>\n                        </div>\n                    </form>\n\n                    <!-- Register Form -->\n                    <form id=\"registerForm\" class=\"auth-form\" style=\"display: none\">\n                        <div class=\"form-group\">\n                            <label for=\"regEmail\">Email</label>\n                            <input type=\"email\" id=\"regEmail\" name=\"email\" required placeholder=\"your@email.com\" />\n                        </div>\n\n                        <div class=\"form-group\">\n                            <label for=\"regUsername\">Username</label>\n                            <input\n                                type=\"text\"\n                                id=\"regUsername\"\n                                name=\"username\"\n                                required\n                                placeholder=\"Choose a username\"\n                            />\n                        </div>\n\n                        <div class=\"form-group\">\n                            <label for=\"regFullName\">Full Name (Optional)</label>\n                            <input type=\"text\" id=\"regFullName\" name=\"fullName\" placeholder=\"Your full name\" />\n                        </div>\n\n                        <div class=\"form-group\">\n                            <label for=\"regPassword\">Password</label>\n                            <input\n                                type=\"password\"\n                                id=\"regPassword\"\n                                name=\"password\"\n                                required\n                                placeholder=\"Create a password\"\n                            />\n                        </div>\n\n                        <button type=\"submit\" class=\"auth-btn\">Sign Up</button>\n                    </form>\n\n                    <div id=\"authMessage\" class=\"auth-message\"></div>\n                </div>\n            </div>\n        </div>\n\n        <script src=\"js/auth.js\"></script>\n    </body>\n</html>\n",
    "timestamp": "2025-07-13T08:40:45.963Z"
  },
  {
    "name": "Dashboard Page",
    "url": "https://findingsports.com/dashboard.html",
    "method": "GET",
    "status": 404,
    "statusText": "Not Found",
    "success": false,
    "responseTime": 169,
    "headers": {
      "access-control-allow-credentials": "true",
      "content-length": "153",
      "content-security-policy": "default-src 'none'",
      "content-type": "text/html; charset=utf-8",
      "date": "Sun, 13 Jul 2025 08:40:45 GMT",
      "server": "railway-edge",
      "vary": "Origin",
      "x-content-type-options": "nosniff",
      "x-powered-by": "Express",
      "x-railway-edge": "railway/us-west2",
      "x-railway-request-id": "HDyJWGouQbOqyGyHnpoFkQ"
    },
    "data": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<title>Error</title>\n</head>\n<body>\n<pre>Cannot GET /dashboard.html</pre>\n</body>\n</html>\n",
    "timestamp": "2025-07-13T08:40:46.134Z"
  },
  {
    "name": "Play Now Page",
    "url": "https://findingsports.com/play-now.html",
    "method": "GET",
    "status": 404,
    "statusText": "Not Found",
    "success": false,
    "responseTime": 38,
    "headers": {
      "access-control-allow-credentials": "true",
      "content-length": "152",
      "content-security-policy": "default-src 'none'",
      "content-type": "text/html; charset=utf-8",
      "date": "Sun, 13 Jul 2025 08:40:46 GMT",
      "server": "railway-edge",
      "vary": "Origin",
      "x-content-type-options": "nosniff",
      "x-powered-by": "Express",
      "x-railway-edge": "railway/us-west2",
      "x-railway-request-id": "jeEATAbxSU-g3ZAinpoFkQ"
    },
    "data": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<title>Error</title>\n</head>\n<body>\n<pre>Cannot GET /play-now.html</pre>\n</body>\n</html>\n",
    "timestamp": "2025-07-13T08:40:46.173Z"
  },
  {
    "name": "App JavaScript",
    "url": "https://findingsports.com/js/app.js",
    "method": "GET",
    "status": 200,
    "statusText": "OK",
    "success": true,
    "responseTime": 405,
    "headers": {
      "accept-ranges": "bytes",
      "access-control-allow-credentials": "true",
      "cache-control": "public, max-age=0",
      "content-length": "46604",
      "content-type": "application/javascript; charset=UTF-8",
      "date": "Sun, 13 Jul 2025 08:40:46 GMT",
      "etag": "W/\"b60c-198023b3760\"",
      "last-modified": "Sun, 13 Jul 2025 05:21:32 GMT",
      "server": "railway-edge",
      "vary": "Origin",
      "x-powered-by": "Express",
      "x-railway-edge": "railway/us-west2",
      "x-railway-request-id": "DfPXxpQRTfGPz1spnpoFkQ"
    },
    "data": "// Initialize map\nlet map;\nlet markers = [];\n\n// Auth state\nconst authToken = localStorage.getItem('authToken');\nlet currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');\nlet isGuest = !authToken;\n\n// Load API and page components\nconst scriptsToLoad = ['js/api.js', 'js/play-now.js', 'js/drop-in-games.js', 'js/social-feed.js', 'js/leagues.js'];\n\nscriptsToLoad.forEach(src => {\n    if (!document.querySelector(`script[src=\"${src}\"]`)) {\n        const script = document.createElement('script');\n        script.src = src;\n        document.head.appendChild(script);\n    }\n});\n\n// Game data\nconst gamesData = {\n    vancouver: [\n        {\n            id: 1,\n            type: 'basketball',\n            title: 'Pick-up Basketball',\n            location: 'North Vancouver',\n            coords: [49.32, -123.0724],\n            attendees: 6,\n            host: 'Luke',\n            status: 'Signed-up',\n            indoor: false\n        },\n        {\n            id: 2,\n            type: 'basketball',\n            title: 'Basketball League',\n            location: 'Kitsilano',\n            coords: [49.2684, -123.1683],\n            attendees: 7,\n            host: 'Kristin',\n            status: 'Organizing',\n            indoor: true,\n            organized: true\n        },\n        {\n            id: 3,\n            type: 'basketball',\n            title: 'Pick-up Basketball',\n            location: 'Downtown',\n            coords: [49.2827, -123.1207],\n            attendees: 4,\n            host: 'Alana',\n            status: 'Attending',\n            indoor: true\n        },\n        {\n            id: 4,\n            type: 'soccer',\n            title: 'Drop-in Soccer',\n            location: 'UBC',\n            coords: [49.2606, -123.246],\n            attendees: 12,\n            host: 'Carlos',\n            status: 'Hosting',\n            indoor: false\n        }\n    ],\n    burnaby: [\n        {\n            id: 5,\n            type: 'volleyball',\n            title: 'Beach Volleyball',\n            location: 'Burnaby Lake',\n            coords: [49.2488, -122.9045],\n            attendees: 8,\n            host: 'Sarah',\n            status: 'Organizing',\n            indoor: false\n        }\n    ],\n    richmond: [\n        {\n            id: 6,\n            type: 'tennis',\n            title: 'Tennis Doubles',\n            location: 'Richmond Centre',\n            coords: [49.1666, -123.1368],\n            attendees: 3,\n            host: 'David',\n            status: 'Looking for 1 more',\n            indoor: true\n        }\n    ]\n};\n\n// Current page state\nwindow.currentPage = 'play-now';\n\n// Initialize app\ndocument.addEventListener('DOMContentLoaded', async () => {\n    console.log('DOM loaded, initializing app...');\n    // Wait for all scripts to load\n    await new Promise(resolve => {\n        const checkScripts = setInterval(() => {\n            if (\n                window.api &&\n                window.PlayNowPage &&\n                window.DropInGamesPage &&\n                window.SocialFeedPage &&\n                window.LeaguesPage\n            ) {\n                clearInterval(checkScripts);\n                resolve();\n            }\n        }, 100);\n    });\n\n    // Initialize WebSocket\n    window.initializeWebSocket();\n    window.setupConnectionIndicator();\n\n    // Verify authentication if logged in\n    if (authToken && window.api) {\n        try {\n            const { user } = await window.api.getCurrentUser();\n            currentUser = user;\n            localStorage.setItem('currentUser', JSON.stringify(user));\n            isGuest = false;\n\n            // Check if onboarding is needed\n            if (!user.onboarded) {\n                window.location.href = '/onboarding/';\n                return;\n            }\n        } catch (error) {\n            // Invalid token - continue as guest\n            localStorage.removeItem('authToken');\n            localStorage.removeItem('currentUser');\n            currentUser = null;\n            isGuest = true;\n        }\n    }\n\n    // Update UI for guest/logged in state\n    window.updateAuthUI();\n\n    // Initialize location detection\n    const locationResult = await window.initializeLocationDetection();\n\n    // Update navigation\n    window.updateNavigation();\n\n    // Initialize default page (Play Now)\n    window.switchPage('play-now');\n    \n    // Log map status for debugging\n    if (window.mapDebug) {\n        setTimeout(() => window.mapDebug.checkStatus(), 1000);\n    }\n});\n\n// Initialize map (delegates to Google Maps implementation)\nwindow.initializeMap = function (userLocation) {\n    const config = window.APP_CONFIG || {};\n    const useGoogleMaps = config.ENABLE_GOOGLE_MAPS !== false;\n    const apiKey = config.GOOGLE_MAPS_API_KEY || window.GOOGLE_MAPS_API_KEY || 'AIzaSyBqVDmKw7sY5lqqOJlk1b5cMYjCXf-xlG4';\n\n    if (useGoogleMaps && (typeof google === 'undefined' || !google.maps)) {\n        window.loadGoogleMapsAPI(apiKey).then(() => {\n            window.initializeGoogleMap(userLocation);\n        }).catch(error => {\n            console.error('Failed to load Google Maps:', error);\n            // Fallback to Leaflet if enabled\n            if (config.ENABLE_LEAFLET_FALLBACK !== false) {\n                initializeLeafletMap(userLocation);\n            }\n        });\n    } else if (useGoogleMaps) {\n        window.initializeGoogleMap(userLocation);\n    } else {\n        // Use Leaflet if Google Maps is disabled\n        initializeLeafletMap(userLocation);\n    }\n};\n\n// Fallback Leaflet map implementation\nfunction initializeLeafletMap(userLocation) {\n    try {\n        // Check if map element exists\n        const mapElement = document.getElementById('map');\n        if (!mapElement) {\n            console.error('Map element not found');\n            return;\n        }\n\n        // Use detected location or default to Vancouver\n        const defaultCenter = userLocation || [49.2827, -123.1207];\n        const defaultZoom = userLocation ? 12 : 11;\n\n        // Initialize map centered on user's location\n        map = L.map('map', {\n            center: defaultCenter,\n            zoom: defaultZoom,\n            zoomControl: true,\n            scrollWheelZoom: true\n        });\n\n        // Add tile layer with better contrast\n        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {\n            attribution: '© OpenStreetMap contributors © CARTO',\n            subdomains: 'abcd',\n            maxZoom: 19\n        }).addTo(map);\n\n        // Add user location marker if available\n        if (userLocation && window.locationService?.userLocation) {\n            const userMarker = L.marker(userLocation, {\n                icon: L.divIcon({\n                    className: 'user-location-marker',\n                    html: '<div style=\"background-color: #2196F3; color: white; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; box-shadow: 0 0 10px rgba(33, 150, 243, 0.5); border: 3px solid white; font-size: 10px;\">•</div>',\n                    iconSize: [22, 22],\n                    iconAnchor: [11, 11]\n                })\n            }).addTo(map);\n\n            userMarker.bindPopup(`\n                <div style=\"padding: 0.5rem; text-align: center;\">\n                    <strong>Your Location</strong><br>\n                    ${window.locationService.userLocation.city || 'Current position'}\n                </div>\n            `);\n        }\n\n        // Force a resize after a short delay to ensure proper rendering\n        setTimeout(() => {\n            map.invalidateSize();\n        }, 100);\n\n        console.log('Map initialized successfully');\n    } catch (error) {\n        console.error('Error initializing map:', error);\n    }\n}\n\n// Display games based on location\nwindow.displayGames = function (location) {\n    const games = gamesData[location] || [];\n    const gamesList = document.getElementById('gamesList');\n    const locationName = document.getElementById('locationName');\n\n    // Update location name\n    locationName.textContent = location.charAt(0).toUpperCase() + location.slice(1);\n\n    // Clear existing games\n    gamesList.innerHTML = '';\n\n    // Clear existing markers\n    if (window.googleMap && window.clearGoogleMarkers) {\n        window.clearGoogleMarkers();\n    } else if (map && markers) {\n        markers.forEach(marker => map.removeLayer(marker));\n        markers = [];\n    }\n\n    // Add games to list and map\n    games.forEach(game => {\n        // Create game card\n        const gameCard = window.createGameCard(game);\n        gamesList.appendChild(gameCard);\n\n        // Add marker to map\n        if (window.googleMap && window.addGoogleGameMarker) {\n            window.addGoogleGameMarker(game);\n        } else if (map) {\n            const marker = L.marker(game.coords).addTo(map).bindPopup(`\n                    <strong>${game.title}</strong><br>\n                    ${game.location}<br>\n                    ${game.attendees} attendees\n                `);\n            markers.push(marker);\n        }\n    });\n\n    // Adjust map view to show all markers\n    if (window.googleMap && window.fitMapToMarkers) {\n        window.fitMapToMarkers();\n    } else if (map && markers && markers.length > 0) {\n        const group = new L.FeatureGroup(markers);\n        map.fitBounds(group.getBounds().pad(0.1));\n    }\n};\n\n// Create game card element\nwindow.createGameCard = function (game) {\n    const card = document.createElement('div');\n    card.className = 'game-card';\n    card.dataset.gameId = game.id;\n    card.onclick = () => window.showGameDetails(game);\n\n    const sportIcon = window.getSportIcon(game.type || game.sport);\n    const venueName = game.venue?.name || game.venue || game.location || 'Unknown venue';\n    const hostName = game.host?.name || game.organizer?.name || 'Community';\n    const attendees = game.attendees || game.capacity?.current || 0;\n    const maxAttendees = game.maxAttendees || game.capacity?.max;\n\n    // Format time\n    let timeStr = '';\n    if (game.startTime) {\n        const date = new Date(game.startTime);\n        timeStr = date.toLocaleString('en-US', {\n            weekday: 'short',\n            month: 'short',\n            day: 'numeric',\n            hour: 'numeric',\n            minute: '2-digit'\n        });\n    } else if (game.date) {\n        timeStr = new Date(game.date).toLocaleDateString();\n    }\n\n    card.innerHTML = `\n        <div class=\"game-header\">\n            <span class=\"game-icon\">${sportIcon}</span>\n            <h3 class=\"game-title\">${game.title}</h3>\n            ${game.isIndoor ? '<span class=\"game-indoor\">Indoor</span>' : ''}\n        </div>\n        <div class=\"game-location\">\n            <span class=\"location-dot\">•</span>\n            <span>${venueName}</span>\n        </div>\n        ${timeStr ? `<div class=\"game-time\" style=\"color: #8892b0; font-size: 0.875rem; margin: 0.5rem 0;\">${timeStr}</div>` : ''}\n        <div class=\"game-info\">\n            <span class=\"attendees\">${attendees}${maxAttendees ? `/${maxAttendees}` : ''} players</span>\n            <div class=\"host-info\">\n                <img src=\"https://api.dicebear.com/7.x/avataaars/svg?seed=${hostName}\" \n                     alt=\"${hostName}\" class=\"host-avatar\">\n                <div class=\"host-details\">\n                    <span class=\"host-name\">${hostName}</span>\n                    ${game.source?.name ? `<span class=\"host-status\" style=\"font-size: 0.75rem; opacity: 0.8;\">${game.source.name}</span>` : ''}\n                </div>\n            </div>\n        </div>\n    `;\n\n    return card;\n};\n\n// Get sport icon\nwindow.getSportIcon = function (sport) {\n    const icons = {\n        basketball: 'B',\n        soccer: 'S',\n        volleyball: 'V',\n        tennis: 'T',\n        hockey: 'H',\n        baseball: 'BB'\n    };\n    return icons[sport] || 'SP';\n};\n\n// Search games\nwindow.searchGames = async function searchGames() {\n    const location = document.getElementById('locationSelect').value;\n    const sport = document.getElementById('sportSelect').value;\n\n    // Add search animation\n    const searchBtn = document.querySelector('.search-btn');\n    searchBtn.classList.add('loading');\n\n    try {\n        await window.loadGamesFromAPI(location, sport);\n    } catch (error) {\n        // Fall back to demo data\n        let games = gamesData[location] || [];\n        if (sport !== 'any') {\n            games = games.filter(game => game.type === sport);\n        }\n        window.displayFilteredGames(location, games);\n    }\n\n    searchBtn.classList.remove('loading');\n};\n\n// Display filtered games\nwindow.displayFilteredGames = function (location, games) {\n    const gamesList = document.getElementById('gamesList');\n    const locationName = document.getElementById('locationName');\n\n    locationName.textContent = location.charAt(0).toUpperCase() + location.slice(1);\n    gamesList.innerHTML = '';\n\n    // Clear markers\n    if (window.googleMap && window.clearGoogleMarkers) {\n        window.clearGoogleMarkers();\n    } else if (map && markers) {\n        markers.forEach(marker => map.removeLayer(marker));\n        markers = [];\n    }\n\n    if (games.length === 0) {\n        gamesList.innerHTML =\n            '<p style=\"text-align: center; color: #b8bdd8;\">No games found for your search criteria.</p>';\n        return;\n    }\n\n    games.forEach(game => {\n        const gameCard = window.createGameCard(game);\n        gamesList.appendChild(gameCard);\n\n        if (window.googleMap && window.addGoogleGameMarker) {\n            window.addGoogleGameMarker(game);\n        } else if (map) {\n            const marker = L.marker(game.coords).addTo(map).bindPopup(`\n                    <strong>${game.title}</strong><br>\n                    ${game.location}<br>\n                    ${game.attendees} attendees\n                `);\n            markers.push(marker);\n        }\n    });\n\n    // Adjust map view\n    if (window.googleMap && window.fitMapToMarkers) {\n        window.fitMapToMarkers();\n    } else if (map && markers && markers.length > 0) {\n        const group = new L.FeatureGroup(markers);\n        map.fitBounds(group.getBounds().pad(0.1));\n    }\n};\n\n// Update navigation\nwindow.updateNavigation = function () {\n    const navElement = document.querySelector('.tabs');\n    if (!navElement) {\n        return;\n    }\n\n    navElement.innerHTML = `\n        <button class=\"tab\" onclick=\"window.switchPage('play-now')\">Play Now</button>\n        <button class=\"tab\" onclick=\"window.switchPage('drop-in')\">Drop-in Games</button>\n        <button class=\"tab\" onclick=\"window.switchPage('social')\">Social Feed</button>\n        <button class=\"tab\" onclick=\"window.switchPage('leagues')\">Leagues</button>\n    `;\n};\n\n// Switch between pages\nwindow.switchPage = async function (page) {\n    // Update current page\n    window.currentPage = page;\n\n    // Update active tab\n    const tabs = document.querySelectorAll('.tab');\n    tabs.forEach((tab, index) => {\n        tab.classList.remove('active');\n        if (\n            (page === 'play-now' && index === 0) ||\n            (page === 'drop-in' && index === 1) ||\n            (page === 'social' && index === 2) ||\n            (page === 'leagues' && index === 3)\n        ) {\n            tab.classList.add('active');\n        }\n    });\n\n    // Hide search section for non-map pages\n    const searchSection = document.querySelector('.search-section');\n    if (searchSection) {\n        searchSection.style.display = page === 'social' || page === 'leagues' ? 'none' : 'block';\n    }\n\n    // Switch page content\n    switch (page) {\n    case 'play-now':\n        window.PlayNowPage.render();\n        await window.PlayNowPage.initialize();\n        break;\n    case 'drop-in':\n        window.DropInGamesPage.render();\n        await window.DropInGamesPage.initialize();\n        break;\n    case 'social':\n        window.SocialFeedPage.render();\n        await window.SocialFeedPage.initialize();\n        break;\n    case 'leagues':\n        window.LeaguesPage.render();\n        await window.LeaguesPage.initialize();\n        break;\n    }\n};\n\n// Switch between main tabs (Social Feed, Upcoming Games, Sport Rules)\nwindow.switchTab = function (tab) {\n    // Update active tab\n    const tabs = document.querySelectorAll('.tab');\n    tabs.forEach(t => t.classList.remove('active'));\n\n    // Find and activate the correct tab\n    if (tab === 'social') {\n        tabs[0]?.classList.add('active');\n        window.switchPage('social');\n    } else if (tab === 'upcoming') {\n        tabs[1]?.classList.add('active');\n        window.showUpcomingGames();\n    }\n};\n\n// Show upcoming games\nwindow.showUpcomingGames = function () {\n    const gamesList = document.getElementById('gamesList');\n    gamesList.innerHTML = '<h3 style=\"text-align: center; color: #b8bdd8;\">Your upcoming games will appear here</h3>';\n};\n\n// Show/hide sport rules page\nwindow.showRulesPage = function () {\n    // Update active tab\n    const tabs = document.querySelectorAll('.tab');\n    tabs.forEach(t => t.classList.remove('active'));\n    tabs[2]?.classList.add('active'); // Sport Rules tab\n\n    // Show rules page, hide main app\n    if (typeof window.showRulesPage !== 'undefined') {\n        document.querySelector('.app-container').style.display = 'none';\n\n        // Create or show the sport rules container\n        let rulesContainer = document.getElementById('sport-rules-container');\n        if (!rulesContainer) {\n            // The sport-rules.js will handle creating the container\n            // We just need to trigger its initialization\n            if (window.sportRulesManager) {\n                window.sportRulesManager.createRulesInterface();\n            }\n        }\n\n        rulesContainer = document.getElementById('sport-rules-container');\n        if (rulesContainer) {\n            rulesContainer.style.display = 'block';\n        }\n    }\n};\n\nwindow.hideRulesPage = function () {\n    const rulesContainer = document.getElementById('sport-rules-container');\n    if (rulesContainer) {\n        rulesContainer.style.display = 'none';\n    }\n    document.querySelector('.app-container').style.display = 'block';\n\n    // Reset main tabs\n    const tabs = document.querySelectorAll('.tab');\n    tabs.forEach(t => t.classList.remove('active'));\n    tabs[0]?.classList.add('active'); // Social Feed tab\n};\n\n// Show game details\nwindow.showGameDetails = function (game) {\n    if (isGuest) {\n        const join = confirm(`\n${game.title}\nLocation: ${game.location}\nAttendees: ${game.attendees}\nHost: ${game.host}\n${game.indoor ? 'Indoor facility' : 'Outdoor venue'}\n\nSign in to join this game?`);\n\n        if (join) {\n            // Save game ID to join after login\n            sessionStorage.setItem('joinGameAfterLogin', game.id);\n            window.location.href = '/login-google.html';\n        }\n    } else {\n        // Logged in user can join\n        if (confirm(`Join \"${game.title}\"?`)) {\n            window.joinGame(game.id);\n        }\n    }\n};\n\n// Join a game\nwindow.joinGame = async function (gameId) {\n    try {\n        await window.api.joinGame(gameId);\n        alert('Successfully joined the game!');\n\n        // Join WebSocket room for real-time updates\n        if (window.wsClient) {\n            window.wsClient.joinGame(gameId);\n        }\n\n        // Refresh games list\n        window.loadGamesFromAPI();\n    } catch (error) {\n        alert('Failed to join game. Please try again.');\n    }\n};\n\n// Show activity details (for Play Now drop-in activities)\nwindow.showActivityDetails = function (activity) {\n    const message = `\n${activity.sport.toUpperCase()} at ${activity.venue}\nTime: ${activity.timeString}\nCost: $${activity.cost}\n${activity.ageGroup ? `Age Group: ${activity.ageGroup}` : ''}\n${activity.skillLevel ? `Skill Level: ${activity.skillLevel}` : ''}\nDistance: ${activity.distance}\n${activity.note ? `\\nNote: ${activity.note}` : ''}\n\nGet directions to this location?`;\n\n    if (confirm(message)) {\n        window.getDirections(activity.coordinates.lat, activity.coordinates.lng);\n    }\n};\n\n// Show court details\nwindow.showCourtDetails = function (court) {\n    const message = `\n${court.type.toUpperCase()} - ${court.venue}\nStatus: ${court.status.toUpperCase()}\n${court.courts ? `Courts: ${court.courts}` : ''}\n${court.lights ? `Lights: ${court.lights}` : ''}\n${court.busyTimes ? `Busy Times: ${court.busyTimes}` : ''}\nDistance: ${court.distance}\n\nGet directions to this location?`;\n\n    if (confirm(message)) {\n        window.getDirections(court.coordinates.lat, court.coordinates.lng);\n    }\n};\n\n// Show pickup game details\nwindow.showPickupGameDetails = function (game) {\n    const message = `\n${game.sport.toUpperCase()} Pickup Game\nLocation: ${game.venue}\nOrganizer: ${game.organizer} via ${game.platform}\nTime: ${game.time}\nSkill Level: ${game.skillLevel}\n${game.playersNeeded ? `Players Needed: ${game.playersNeeded}` : ''}\n${game.spotsLeft ? `Spots Left: ${game.spotsLeft}` : ''}\nHow to Join: ${game.joinMethod}\nDistance: ${game.distance}\n\nGet directions to this location?`;\n\n    if (confirm(message)) {\n        window.getDirections(game.coordinates.lat, game.coordinates.lng);\n    }\n};\n\n// Get directions to a location\nwindow.getDirections = function (lat, lng) {\n    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;\n    window.open(url, '_blank');\n};\n\n// Update location\ndocument.getElementById('locationSelect').addEventListener('change', async e => {\n    const newLocation = e.target.value;\n\n    // Update WebSocket location subscription\n    if (window.wsClient && window.wsClient.connected) {\n        if (window.wsClient.currentLocation) {\n            window.wsClient.unsubscribeFromLocation(window.wsClient.currentLocation);\n        }\n        window.wsClient.subscribeToLocation(newLocation);\n    }\n\n    await window.loadGamesFromAPI(newLocation);\n});\n\n// Initialize location detection\nwindow.initializeLocationDetection = async function () {\n    // Wait for location service to load\n    await new Promise(resolve => {\n        const checkLocationService = setInterval(() => {\n            if (window.locationService) {\n                clearInterval(checkLocationService);\n                resolve();\n            }\n        }, 100);\n    });\n\n    // Wait for play now service to load\n    await new Promise(resolve => {\n        const checkPlayNowService = setInterval(() => {\n            if (window.playNowService) {\n                clearInterval(checkPlayNowService);\n                resolve();\n            }\n        }, 100);\n    });\n\n    try {\n        // Initialize location detection\n        const locationResult = await window.locationService.initializeLocation();\n\n        // Set user location for play now service\n        if (locationResult.userLocation) {\n            window.playNowService.setUserLocation(locationResult.userLocation.lat, locationResult.userLocation.lng);\n        }\n\n        // Update location dropdown with nearby cities\n        window.updateLocationDropdown(locationResult);\n\n        // Don't show location detection feedback on page load\n        // It will be shown when \"Find Games Now\" is clicked\n\n        console.log('Location detection initialized:', locationResult);\n        return locationResult;\n    } catch (error) {\n        console.error('Failed to initialize location detection:', error);\n        return null;\n    }\n};\n\n// Update location dropdown based on user location\nwindow.updateLocationDropdown = function (locationResult) {\n    const locationSelect = document.getElementById('locationSelect');\n    if (!locationSelect) {\n        return;\n    }\n\n    // Clear existing options\n    locationSelect.innerHTML = '';\n\n    // Add current city first\n    if (locationResult.currentCity) {\n        const currentOption = document.createElement('option');\n        currentOption.value = locationResult.currentCity.key;\n        currentOption.textContent = `${locationResult.currentCity.name} (Current)`;\n        currentOption.selected = true;\n        locationSelect.appendChild(currentOption);\n    }\n\n    // Add nearby cities\n    if (locationResult.nearbyCities && locationResult.nearbyCities.length > 0) {\n        locationResult.nearbyCities.forEach(city => {\n            // Skip if it's the same as current city\n            if (city.key === locationResult.currentCity?.key) {\n                return;\n            }\n\n            const option = document.createElement('option');\n            option.value = city.key;\n            option.textContent = `${city.name} (${city.distance}km)`;\n            locationSelect.appendChild(option);\n        });\n    }\n\n    // Add separator and other BC cities\n    const separator = document.createElement('option');\n    separator.disabled = true;\n    separator.textContent = '─────────────────';\n    locationSelect.appendChild(separator);\n\n    // Add other BC cities not in nearby list\n    const nearbyKeys = new Set(locationResult.nearbyCities?.map(c => c.key) || []);\n    nearbyKeys.add(locationResult.currentCity?.key);\n\n    const otherCities = window.locationService\n        .getAllCities()\n        .filter(city => !nearbyKeys.has(city.key))\n        .sort((a, b) => a.name.localeCompare(b.name));\n\n    otherCities.forEach(city => {\n        const option = document.createElement('option');\n        option.value = city.key;\n        option.textContent = city.name;\n        locationSelect.appendChild(option);\n    });\n};\n\n// Show location detection feedback\nwindow.showLocationFeedback = function (currentCity, isFallback, detectedLocationInfo) {\n    const feedbackDiv = document.createElement('div');\n    feedbackDiv.className = 'location-feedback';\n    feedbackDiv.style.cssText = `\n        position: fixed;\n        top: 20px;\n        right: 20px;\n        background: ${isFallback ? '#ff6b35' : '#4CAF50'};\n        color: white;\n        padding: 12px 20px;\n        border-radius: 8px;\n        font-size: 14px;\n        z-index: 1000;\n        box-shadow: 0 4px 12px rgba(0,0,0,0.3);\n        opacity: 0;\n        transition: opacity 0.3s ease;\n        max-width: 300px;\n    `;\n\n    let message;\n    if (isFallback) {\n        message = `Location detection failed - showing ${currentCity.name}, BC`;\n    } else {\n        message = `Location detected: ${currentCity.name}, BC`;\n\n        // Add detected city info if available and different\n        if (detectedLocationInfo && detectedLocationInfo.detectedCity) {\n            const { detectedCity } = detectedLocationInfo;\n            if (detectedCity.toLowerCase() !== currentCity.name.toLowerCase()) {\n                message += `\\nYour location: ${detectedCity}`;\n                if (detectedLocationInfo.detectedRegion) {\n                    message += `, ${detectedLocationInfo.detectedRegion}`;\n                }\n                message += `\\nNearest sports hub: ${currentCity.name}`;\n            }\n        }\n    }\n\n    feedbackDiv.style.whiteSpace = 'pre-line';\n    feedbackDiv.textContent = message;\n    document.body.appendChild(feedbackDiv);\n\n    // Animate in\n    setTimeout(() => {\n        feedbackDiv.style.opacity = '1';\n    }, 100);\n\n    // Remove after 6 seconds (longer for more detailed info)\n    setTimeout(() => {\n        feedbackDiv.style.opacity = '0';\n        setTimeout(() => {\n            if (document.body.contains(feedbackDiv)) {\n                document.body.removeChild(feedbackDiv);\n            }\n        }, 300);\n    }, 6000);\n};\n\n// Play Now functionality\nwindow.playNow = async function () {\n    // Switch to the Play Now page\n    window.switchPage('play-now');\n    \n    // Optionally trigger the search immediately\n    setTimeout(() => {\n        if (window.PlayNowPage && window.PlayNowPage.findGames) {\n            window.PlayNowPage.findGames();\n        }\n    }, 500);\n};\n\n// Show Play Now results\nwindow.showPlayNowResults = function (playNowGames, errorMessage, allRecommendations) {\n    const gamesList = document.getElementById('gamesList');\n    const locationName = document.getElementById('locationName');\n\n    // Clear existing games\n    gamesList.innerHTML = '';\n\n    // Clear map markers\n    if (window.googleMap && window.clearGoogleMarkers) {\n        window.clearGoogleMarkers();\n    } else if (map && markers) {\n        markers.forEach(marker => map.removeLayer(marker));\n        markers = [];\n    }\n\n    if (errorMessage) {\n        gamesList.innerHTML = `\n            <div style=\"text-align: center; padding: 3rem; color: #b8bdd8;\">\n                <h3 style=\"margin-bottom: 1rem;\">No Immediate Games</h3>\n                <p>${errorMessage}</p>\n                <button onclick=\"searchGames()\" style=\"margin-top: 1rem; padding: 0.5rem 1rem; background: #ff6b35; color: white; border: none; border-radius: 8px; cursor: pointer;\">\n                    View All Games\n                </button>\n            </div>\n        `;\n        return;\n    }\n\n    // Update section title\n    locationName.textContent = 'Ready to Play';\n\n    // Create Play Now header\n    const playNowHeader = document.createElement('div');\n    playNowHeader.style.cssText = `\n        background: linear-gradient(135deg, #ff6b35, #ff8a65);\n        color: white;\n        padding: 1.5rem;\n        border-radius: 12px;\n        margin-bottom: 1.5rem;\n        text-align: center;\n    `;\n    playNowHeader.innerHTML = `\n        <h3 style=\"margin: 0 0 0.5rem 0; font-size: 1.5rem;\">Best Games Right Now</h3>\n        <p style=\"margin: 0; opacity: 0.9;\">Games ranked by proximity and start time</p>\n    `;\n    gamesList.appendChild(playNowHeader);\n\n    // Add Play Now games\n    playNowGames.forEach((game, index) => {\n        const gameCard = window.createPlayNowCard(game, index + 1);\n        gamesList.appendChild(gameCard);\n\n        // Add marker to map\n        window.addGameMarker(game, 'P');\n    });\n\n    // Add recommendations section if available\n    if (allRecommendations) {\n        window.addRecommendationsSections(allRecommendations, gamesList);\n    }\n\n    // Adjust map view for Play Now games\n    if (markers.length > 0) {\n        const group = new L.FeatureGroup(markers);\n        map.fitBounds(group.getBounds().pad(0.1));\n    }\n};\n\n// Create Play Now game card\nwindow.createPlayNowCard = function (game, rank) {\n    const card = document.createElement('div');\n    card.className = 'game-card play-now-card';\n    card.style.cssText = `\n        position: relative;\n        border-left: 4px solid #ff6b35;\n        background: linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(255, 138, 101, 0.05));\n    `;\n\n    const sportIcon = window.getSportIcon(game.type || game.sport);\n    const venueName = game.venue?.name || game.venue || game.location || 'Unknown venue';\n    const timeText = window.playNowService.formatTimeUntilStart(game.timeUntilStart);\n    const distanceText = window.playNowService.formatDistance(game.distance);\n    const urgency = window.playNowService.getUrgencyLevel(game.timeUntilStart);\n\n    // Format time with better display\n    let startTimeText = '';\n    if (game.startTime) {\n        const date = new Date(game.startTime);\n        startTimeText = date.toLocaleString('en-US', {\n            weekday: 'short',\n            hour: 'numeric',\n            minute: '2-digit'\n        });\n    }\n\n    card.innerHTML = `\n        <div style=\"position: absolute; top: 1rem; right: 1rem; background: #ff6b35; color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.8rem; font-weight: 600;\">\n            #${rank}\n        </div>\n        \n        <div class=\"game-header\">\n            <span class=\"game-icon\" style=\"font-size: 1.5rem;\">${sportIcon}</span>\n            <div>\n                <h3 class=\"game-title\">${game.title}</h3>\n                <div style=\"color: #ff6b35; font-weight: 600; font-size: 0.9rem;\">\n                    ${startTimeText} • ${timeText} away • ${distanceText}\n                </div>\n            </div>\n        </div>\n        \n        <div class=\"game-location\">\n            <span class=\"location-dot\">•</span>\n            <span>${venueName}</span>\n        </div>\n        \n        <div class=\"game-info\" style=\"margin-top: 1rem;\">\n            <div style=\"display: flex; justify-content: space-between; align-items: center;\">\n                <span class=\"attendees\">${game.attendees || game.capacity?.current || 0}/${game.maxAttendees || game.capacity?.max || 20} players</span>\n                <div style=\"display: flex; gap: 0.5rem; align-items: center;\">\n                    <span style=\"background: ${window.getUrgencyColor(urgency)}; color: white; padding: 0.25rem 0.5rem; border-radius: 8px; font-size: 0.8rem;\">\n                        ${window.getUrgencyText(urgency)}\n                    </span>\n                    <button onclick=\"window.showGameDetails(${JSON.stringify(game).replace(/\"/g, '&quot;')})\" \n                            style=\"background: #ff6b35; color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 600;\">\n                        ${isGuest ? 'View Details' : 'Join Game'}\n                    </button>\n                </div>\n            </div>\n        </div>\n        \n        <div style=\"margin-top: 0.5rem; padding: 0.5rem; background: rgba(255, 107, 53, 0.1); border-radius: 8px; font-size: 0.8rem; color: #666;\">\n            Score: ${Math.round(game.playNowScore)}/100 • \n            ${window.playNowService.generateRecommendation(game)}\n        </div>\n    `;\n\n    return card;\n};\n\n// Add game marker to map\nwindow.addGameMarker = function (game, iconOverride) {\n    // Use Google Maps if available, otherwise fall back to Leaflet\n    if (window.googleMap && window.addGoogleGameMarker) {\n        return window.addGoogleGameMarker(game);\n    }\n\n    // Leaflet fallback\n    let coords = null;\n\n    if (game.coords && Array.isArray(game.coords)) {\n        coords = game.coords;\n    } else if (game.venue?.coordinates) {\n        coords = [game.venue.coordinates.lat, game.venue.coordinates.lng];\n    }\n\n    if (!coords || !map) {\n        return;\n    }\n\n    const icon = iconOverride || window.getSportIcon(game.type || game.sport);\n\n    const markerIcon = L.divIcon({\n        className: 'game-marker',\n        html: `<div style=\"background-color: #ff6b35; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; box-shadow: 0 3px 8px rgba(0,0,0,0.3); font-size: 1.1rem;\">${icon}</div>`,\n        iconSize: [32, 32],\n        iconAnchor: [16, 16]\n    });\n\n    const marker = L.marker(coords, { icon: markerIcon }).addTo(map);\n\n    const timeText = game.timeUntilStart ? window.playNowService.formatTimeUntilStart(game.timeUntilStart) : '';\n    const distanceText = game.distance ? window.playNowService.formatDistance(game.distance) : '';\n\n    const popupContent = `\n        <div style=\"padding: 0.5rem; min-width: 200px;\">\n            <strong>${game.title}</strong><br>\n            ${game.venue?.name || game.venue || game.location}<br>\n            ${game.attendees || 0}${game.maxAttendees ? `/${game.maxAttendees}` : ''} players<br>\n            ${timeText ? `${timeText}` : ''}\n            ${distanceText ? ` • ${distanceText}` : ''}\n        </div>\n    `;\n\n    marker.bindPopup(popupContent);\n    markers.push(marker);\n};\n\n// Add recommendations sections\nwindow.addRecommendationsSections = function (recommendations, gamesList) {\n    // Add separator\n    const separator = document.createElement('div');\n    separator.style.cssText = 'height: 2rem;';\n    gamesList.appendChild(separator);\n\n    // Other recommendations\n    if (recommendations.soonestGames.length > 0) {\n        window.addRecommendationSection(gamesList, 'Soonest Games', recommendations.soonestGames.slice(0, 3), '');\n    }\n\n    if (recommendations.nearestGames.length > 0) {\n        window.addRecommendationSection(gamesList, 'Nearest Games', recommendations.nearestGames.slice(0, 3), '');\n    }\n\n    if (recommendations.todayGames.length > 0) {\n        window.addRecommendationSection(gamesList, 'Today\\'s Games', recommendations.todayGames.slice(0, 3), '');\n    }\n};\n\n// Add recommendation section\nwindow.addRecommendationSection = function (gamesList, title, games, icon) {\n    const sectionHeader = document.createElement('div');\n    sectionHeader.style.cssText = `\n        background: rgba(255, 255, 255, 0.1);\n        padding: 1rem;\n        border-radius: 8px;\n        margin: 1rem 0 0.5rem 0;\n        border-left: 3px solid #ff6b35;\n    `;\n    sectionHeader.innerHTML = `<h4 style=\"margin: 0; color: #ff6b35;\">${title}</h4>`;\n    gamesList.appendChild(sectionHeader);\n\n    games.forEach(game => {\n        const gameCard = window.createGameCard(game);\n        gameCard.style.marginLeft = '1rem';\n        gameCard.style.background = 'rgba(255, 255, 255, 0.05)';\n        gamesList.appendChild(gameCard);\n    });\n};\n\n// Display user info\nwindow.updateAuthUI = function () {\n    const userMenu = document.querySelector('.user-menu');\n\n    if (!userMenu) {\n        return;\n    }\n\n    // Clear existing content\n    userMenu.innerHTML = '';\n\n    if (isGuest) {\n        // Guest UI\n        const guestSpan = document.createElement('span');\n        guestSpan.className = 'user-name';\n        guestSpan.textContent = 'Guest';\n        userMenu.appendChild(guestSpan);\n\n        const loginBtn = document.createElement('button');\n        loginBtn.className = 'guest-login-btn';\n        loginBtn.textContent = 'Sign In';\n        loginBtn.onclick = () => (window.location.href = '/login-google.html');\n        userMenu.appendChild(loginBtn);\n    } else if (currentUser) {\n        // Logged in user UI\n        const userInfo = document.createElement('div');\n        userInfo.className = 'user-name';\n\n        // Create avatar with initials\n        const avatar = document.createElement('div');\n        avatar.className = 'user-avatar';\n        const name = currentUser.name || currentUser.username || currentUser.email;\n        const initials = name\n            .split(' ')\n            .map(word => word[0])\n            .join('')\n            .toUpperCase()\n            .slice(0, 2);\n        avatar.textContent = initials;\n\n        // If user has picture, use it\n        if (currentUser.picture) {\n            const img = document.createElement('img');\n            img.src = currentUser.picture;\n            img.className = 'user-avatar';\n            img.style.objectFit = 'cover';\n            userInfo.appendChild(img);\n        } else {\n            userInfo.appendChild(avatar);\n        }\n\n        // Add name\n        const nameSpan = document.createElement('span');\n        nameSpan.textContent = name.split(' ')[0]; // First name only\n        userInfo.appendChild(nameSpan);\n\n        userMenu.appendChild(userInfo);\n\n        // Add logout button\n        const logoutBtn = document.createElement('button');\n        logoutBtn.className = 'auth-button';\n        logoutBtn.textContent = 'Sign Out';\n        logoutBtn.onclick = window.logout;\n        userMenu.appendChild(logoutBtn);\n    }\n};\n\n// Logout function\nwindow.logout = async function logout() {\n    if (window.api) {\n        try {\n            await window.api.logout();\n        } catch (error) {\n            // Ignore errors\n        }\n    }\n    localStorage.removeItem('authToken');\n    localStorage.removeItem('currentUser');\n    // Reload the page instead of redirecting to login\n    window.location.reload();\n};\n\n// Load games from API\nwindow.loadGamesFromAPI = async function (location = 'vancouver', sport = null) {\n    try {\n        console.log('Loading games from API...', { location, sport });\n\n        const filters = { location };\n        if (sport && sport !== 'any') {\n            filters.sport = sport;\n        }\n\n        const response = await window.api.getGames(filters);\n        console.log('API Response:', response);\n\n        const games = response.games || [];\n\n        if (games.length === 0) {\n            console.warn('No games returned from API');\n\n            // Check if scraping needs to be triggered\n            if (window.DebugUtils) {\n                console.log('Checking scraping status...');\n                const status = await window.DebugUtils.checkScrapingStatus();\n                if (status && status.dataAggregation.totalGames === 0) {\n                    console.log('No games in database, triggering auto-fix...');\n                    // Don't auto-trigger in production\n                    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {\n                        window.DebugUtils.autoFixGames();\n                    }\n                }\n            }\n        }\n\n        window.displayGamesOnMap(games);\n    } catch (error) {\n        console.error('Failed to load games:', error);\n        // Fall back to demo data\n        window.displayGames(location);\n    }\n};\n\n// Display games from API on map and list\nwindow.displayGamesOnMap = function (games) {\n    const gamesList = document.getElementById('gamesList');\n    const locationName = document.getElementById('locationName');\n\n    // Clear existing\n    gamesList.innerHTML = '';\n    if (window.googleMap && window.clearGoogleMarkers) {\n        window.clearGoogleMarkers();\n    } else if (map && markers) {\n        markers.forEach(marker => map.removeLayer(marker));\n        markers = [];\n    }\n\n    if (games.length === 0) {\n        gamesList.innerHTML =\n            '<p style=\"text-align: center; color: #b8bdd8; padding: 2rem;\">No games found. Check back later or try a different search.</p>';\n        return;\n    }\n\n    // Add games\n    games.forEach(game => {\n        // Ensure game has proper coordinates\n        let coords = null;\n        if (game.coords && Array.isArray(game.coords)) {\n            coords = game.coords;\n        } else if (game.venue?.coordinates) {\n            coords = [game.venue.coordinates.lat, game.venue.coordinates.lng];\n        }\n\n        // Create game card\n        const gameCard = window.createGameCard(game);\n        gamesList.appendChild(gameCard);\n\n        // Add marker to map if coordinates exist\n        if (coords) {\n            if (window.googleMap && window.addGoogleGameMarker) {\n                window.addGoogleGameMarker(game);\n            } else if (map) {\n                try {\n                    const markerIcon = L.divIcon({\n                        className: 'game-marker',\n                        html: `<div style=\"background-color: #ff6b35; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; box-shadow: 0 2px 6px rgba(0,0,0,0.3);\">${window.getSportIcon(game.type || game.sport)}</div>`,\n                        iconSize: [30, 30],\n                        iconAnchor: [15, 15]\n                    });\n\n                    const marker = L.marker(coords, { icon: markerIcon }).addTo(map);\n\n                    const popupContent = `\n                        <div style=\"padding: 0.5rem;\">\n                            <strong>${game.title}</strong><br>\n                            ${game.venue?.name || game.venue || game.location}<br>\n                            ${game.attendees || 0}${game.maxAttendees ? `/${game.maxAttendees}` : ''} players<br>\n                            ${\n        game.startTime ?\n            new Date(game.startTime).toLocaleString('en-US', {\n                weekday: 'short',\n                month: 'short',\n                day: 'numeric',\n                hour: 'numeric',\n                minute: '2-digit'\n            }) :\n            ''\n    }\n                        </div>\n                    `;\n\n                    marker.bindPopup(popupContent);\n                    markers.push(marker);\n            } catch (error) {\n                console.error('Error adding marker for game:', game, error);\n            }\n        }\n    });\n\n    // Adjust map view\n    if (window.googleMap && window.fitMapToMarkers) {\n        window.fitMapToMarkers();\n    } else if (markers && markers.length > 0 && map) {\n        try {\n            const group = new L.FeatureGroup(markers);\n            map.fitBounds(group.getBounds().pad(0.1));\n        } catch (error) {\n            console.error('Error adjusting map bounds:', error);\n        }\n    }\n};\n\n// Initialize WebSocket connection\nwindow.initializeWebSocket = function () {\n    if (window.wsClient) {\n        window.wsClient.connect();\n\n        // Set up event handlers\n        window.wsClient.on('connected', () => {\n            console.log('WebSocket connected');\n            window.updateConnectionStatus(true);\n\n            // Subscribe to current location\n            const currentLocation = document.getElementById('locationSelect').value;\n            if (currentLocation) {\n                window.wsClient.subscribeToLocation(currentLocation);\n            }\n        });\n\n        window.wsClient.on('disconnected', () => {\n            console.log('WebSocket disconnected');\n            window.updateConnectionStatus(false);\n        });\n\n        window.wsClient.on('new-game', data => {\n            // Reload games to show new game\n            window.loadGamesFromAPI();\n        });\n\n        window.wsClient.on('game-updated', data => {\n            // Game UI is updated automatically by websocket.js\n        });\n    }\n};\n\n// Set up connection status indicator\nwindow.setupConnectionIndicator = function () {\n    const indicator = document.createElement('div');\n    indicator.className = 'connection-status disconnected';\n    indicator.innerHTML = `\n        <span class=\"dot\"></span>\n        <span class=\"text\">Disconnected</span>\n    `;\n    indicator.style.display = 'none'; // Hidden by default\n    document.body.appendChild(indicator);\n};\n\n// Update connection status\nwindow.updateConnectionStatus = function (connected) {\n    const indicator = document.querySelector('.connection-status');\n    if (indicator) {\n        if (connected) {\n            indicator.classList.remove('disconnected');\n            indicator.querySelector('.text').textContent = 'Connected';\n            // Hide after 3 seconds when connected\n            setTimeout(() => {\n                indicator.style.display = 'none';\n            }, 3000);\n        } else {\n            indicator.classList.add('disconnected');\n            indicator.querySelector('.text').textContent = 'Disconnected';\n            indicator.style.display = 'flex';\n        }\n    }\n};\n\n// Helper functions for urgency display\nwindow.getUrgencyColor = function (urgency) {\n    if (urgency === 'urgent') {\n        return '#ff4444';\n    }\n    if (urgency === 'soon') {\n        return '#ff6b35';\n    }\n    return '#4CAF50';\n};\n\nwindow.getUrgencyText = function (urgency) {\n    if (urgency === 'urgent') {\n        return 'Urgent';\n    }\n    if (urgency === 'soon') {\n        return 'Soon';\n    }\n    return 'Good timing';\n};\n",
    "timestamp": "2025-07-13T08:40:46.578Z"
  },
  {
    "name": "Play Now JavaScript",
    "url": "https://findingsports.com/js/play-now.js",
    "method": "GET",
    "status": 200,
    "statusText": "OK",
    "success": true,
    "responseTime": 202,
    "headers": {
      "accept-ranges": "bytes",
      "access-control-allow-credentials": "true",
      "cache-control": "public, max-age=0",
      "content-length": "21436",
      "content-type": "application/javascript; charset=UTF-8",
      "date": "Sun, 13 Jul 2025 08:40:46 GMT",
      "etag": "W/\"53bc-198023b3760\"",
      "last-modified": "Sun, 13 Jul 2025 05:21:32 GMT",
      "server": "railway-edge",
      "vary": "Origin",
      "x-powered-by": "Express",
      "x-railway-edge": "railway/us-west2",
      "x-railway-request-id": "4Icp3H3iR7uLF0F6npoFkQ"
    },
    "data": "// Play Now page component\nconst API_BASE_URL = window.APP_CONFIG?.API_BASE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8080' : window.location.origin);\n\nwindow.PlayNowPage = {\n    // Initialize the Play Now page\n    async initialize() {\n        // Initialize location detection if not already done\n        if (!window.locationService) {\n            await window.initializeLocationDetection();\n        }\n\n        // Initialize map with user location\n        const locationResult = window.locationService?.getLocationInfo();\n        const userLocation = locationResult?.userLocation ?\n            [locationResult.userLocation.lat, locationResult.userLocation.lng] :\n            null;\n\n        if (!window.googleMap && !window.map) {\n            window.initializeMap(userLocation);\n        }\n\n        // Set up event listeners\n        this.setupEventListeners();\n    },\n\n    // Render the Play Now page content\n    render() {\n        const contentWrapper = document.querySelector('.content-wrapper');\n        if (!contentWrapper) {\n            return;\n        }\n\n        contentWrapper.innerHTML = `\n            <!-- Play Now Section -->\n            <section class=\"play-now-section\">\n                <div class=\"play-now-header\">\n                    <h2 class=\"section-title\">Find Your Game</h2>\n                    <p class=\"section-subtitle\">Select a sport and we'll show you available fields nearby</p>\n                </div>\n\n                <div class=\"play-now-controls\">\n                    <div class=\"sport-selector\">\n                        <label for=\"playNowSportSelect\">Choose your sport:</label>\n                        <select id=\"playNowSportSelect\" class=\"sport-select large\">\n                            <option value=\"any\">Any sport</option>\n                            <option value=\"soccer\">Soccer</option>\n                            <option value=\"basketball\">Basketball</option>\n                            <option value=\"tennis\">Tennis</option>\n                            <option value=\"badminton\">Badminton</option>\n                            <option value=\"volleyball\">Volleyball</option>\n                            <option value=\"hockey\">Hockey</option>\n                            <option value=\"football\">Football</option>\n                            <option value=\"ping-pong\">Ping pong</option>\n                            <option value=\"frisbee\">Frisbee</option>\n                            <option value=\"rugby\">Rugby</option>\n                            <option value=\"tag\">Tag</option>\n                            <option value=\"baseball\">Baseball</option>\n                            <option value=\"kabaddi\">Kabaddi</option>\n                            <option value=\"softball\">Softball</option>\n                        </select>\n                    </div>\n\n                    <div class=\"location-info\">\n                        <span class=\"location-label\">Your location:</span>\n                        <span id=\"userLocationDisplay\" class=\"location-value\">Detecting...</span>\n                    </div>\n\n                    <button class=\"play-now-action-btn\" onclick=\"window.PlayNowPage.findGames()\">\n                        <span class=\"btn-text\">Play Now</span>\n                        <span class=\"btn-icon\">→</span>\n                    </button>\n                </div>\n\n                <div id=\"playNowResults\" class=\"play-now-results\">\n                    <!-- Results will be displayed here -->\n                </div>\n            </section>\n\n            <!-- Map Section -->\n            <section class=\"map-section play-now-map\">\n                <div id=\"map\" class=\"map-container\"></div>\n            </section>\n        `;\n\n        // Update location display\n        this.updateLocationDisplay();\n    },\n\n    // Set up event listeners\n    setupEventListeners() {\n        const sportSelect = document.getElementById('playNowSportSelect');\n        if (sportSelect) {\n            sportSelect.addEventListener('change', () => this.onSportChange());\n        }\n    },\n\n    // Update location display\n    updateLocationDisplay() {\n        const locationDisplay = document.getElementById('userLocationDisplay');\n        if (!locationDisplay) {\n            return;\n        }\n\n        const locationInfo = window.locationService?.getLocationInfo();\n        if (locationInfo && locationInfo.currentCity) {\n            locationDisplay.textContent = `${locationInfo.currentCity.name}, BC`;\n            if (locationInfo.detectedLocationInfo?.detectedCity) {\n                locationDisplay.title = `Detected: ${locationInfo.detectedLocationInfo.detectedCity}`;\n            }\n        } else {\n            locationDisplay.textContent = 'Location not detected';\n        }\n    },\n\n    // Handle sport selection change\n    onSportChange() {\n        const sport = document.getElementById('playNowSportSelect').value;\n        console.log('Sport selected:', sport);\n        // Optionally update map markers based on sport\n    },\n\n    // Find games based on selected sport\n    async findGames() {\n        const sport = document.getElementById('playNowSportSelect').value;\n        const resultsDiv = document.getElementById('playNowResults');\n        const actionBtn = document.querySelector('.play-now-action-btn');\n\n        // Show loading state\n        actionBtn.classList.add('loading');\n        actionBtn.querySelector('.btn-text').textContent = 'Finding games...';\n\n        resultsDiv.innerHTML = '<div class=\"loading-message\">Searching for available games happening now...</div>';\n\n        try {\n            // Get user's current location\n            const locationInfo = window.locationService?.getLocationInfo();\n            const userLocation = locationInfo?.userLocation || { lat: 49.2827, lng: -123.1207 }; // Default to downtown Vancouver\n            \n            // Call the Play Now API\n            const params = new URLSearchParams({\n                lat: userLocation.lat,\n                lng: userLocation.lng,\n                radius: 10, // 10km radius\n                includeOpenCourts: true\n            });\n\n            const response = await fetch(`${API_BASE_URL}/api/play-now?${params}`);\n            const data = await response.json();\n\n            // Display results\n            this.displayPlayNowResults(data, sport);\n\n            // Update map markers with all activities\n            if (window.googleMap || window.map) {\n                this.updateMapMarkersForPlayNow(data.activities);\n            }\n        } catch (error) {\n            console.error('Failed to find games:', error);\n            resultsDiv.innerHTML = `\n                <div class=\"error-message\">\n                    <p>Failed to find games. Please try again.</p>\n                </div>\n            `;\n        } finally {\n            // Reset button state\n            actionBtn.classList.remove('loading');\n            actionBtn.querySelector('.btn-text').textContent = 'Play Now';\n        }\n    },\n\n    // Display Play Now results\n    displayPlayNowResults(data, sportFilter) {\n        const resultsDiv = document.getElementById('playNowResults');\n        const { activities, summary } = data;\n        \n        // Filter activities by sport if needed\n        let filteredActivities = {\n            happeningNow: activities.happeningNow,\n            startingSoon: activities.startingSoon,\n            openCourts: activities.openCourts,\n            pickupGames: activities.pickupGames\n        };\n        \n        if (sportFilter !== 'any') {\n            filteredActivities = {\n                happeningNow: activities.happeningNow.filter(a => a.sport === sportFilter),\n                startingSoon: activities.startingSoon.filter(a => a.sport === sportFilter),\n                openCourts: activities.openCourts.filter(a => a.type === sportFilter),\n                pickupGames: activities.pickupGames.filter(a => a.sport === sportFilter)\n            };\n        }\n        \n        const totalFiltered = \n            filteredActivities.happeningNow.length + \n            filteredActivities.startingSoon.length + \n            filteredActivities.openCourts.length + \n            filteredActivities.pickupGames.length;\n        \n        if (totalFiltered === 0) {\n            resultsDiv.innerHTML = `\n                <div class=\"no-results\">\n                    <h3>No ${sportFilter === 'any' ? '' : sportFilter} activities available right now</h3>\n                    <p>Try selecting a different sport or check back later.</p>\n                </div>\n            `;\n            return;\n        }\n        \n        let html = '<div class=\"play-now-results-container\">';\n        \n        // Happening Now\n        if (filteredActivities.happeningNow.length > 0) {\n            html += `\n                <div class=\"activity-section happening-now\">\n                    <h3 class=\"section-header\">\n                        <span class=\"status-icon\">🟢</span>\n                        Happening Now (${filteredActivities.happeningNow.length})\n                    </h3>\n                    <div class=\"activity-list\">\n            `;\n            \n            filteredActivities.happeningNow.forEach(activity => {\n                html += this.createActivityCard(activity, 'happening-now');\n            });\n            \n            html += '</div></div>';\n        }\n        \n        // Starting Soon\n        if (filteredActivities.startingSoon.length > 0) {\n            html += `\n                <div class=\"activity-section starting-soon\">\n                    <h3 class=\"section-header\">\n                        <span class=\"status-icon\">🟡</span>\n                        Starting Soon (${filteredActivities.startingSoon.length})\n                    </h3>\n                    <div class=\"activity-list\">\n            `;\n            \n            filteredActivities.startingSoon.forEach(activity => {\n                html += this.createActivityCard(activity, 'starting-soon');\n            });\n            \n            html += '</div></div>';\n        }\n        \n        // Open Courts\n        if (filteredActivities.openCourts.length > 0) {\n            html += `\n                <div class=\"activity-section open-courts\">\n                    <h3 class=\"section-header\">\n                        <span class=\"status-icon\">🏞️</span>\n                        Open Courts/Fields (${filteredActivities.openCourts.length})\n                    </h3>\n                    <div class=\"activity-list\">\n            `;\n            \n            filteredActivities.openCourts.forEach(court => {\n                html += this.createCourtCard(court);\n            });\n            \n            html += '</div></div>';\n        }\n        \n        // Pickup Games\n        if (filteredActivities.pickupGames.length > 0) {\n            html += `\n                <div class=\"activity-section pickup-games\">\n                    <h3 class=\"section-header\">\n                        <span class=\"status-icon\">👥</span>\n                        Pickup Games (${filteredActivities.pickupGames.length})\n                    </h3>\n                    <div class=\"activity-list\">\n            `;\n            \n            filteredActivities.pickupGames.forEach(game => {\n                html += this.createPickupGameCard(game);\n            });\n            \n            html += '</div></div>';\n        }\n        \n        html += '</div>';\n        resultsDiv.innerHTML = html;\n    },\n    \n    // Create activity card for drop-in activities\n    createActivityCard(activity, type) {\n        const sportEmoji = this.getSportEmoji(activity.sport);\n        const timeInfo = type === 'happening-now' ? \n            `Started ${activity.startedAgo}` : \n            `Starts in ${activity.startsIn}`;\n        \n        return `\n            <div class=\"activity-card ${type}\" onclick=\"window.showActivityDetails(${JSON.stringify(activity).replace(/\"/g, '&quot;')})\">\n                <div class=\"activity-header\">\n                    <span class=\"sport-icon\">${sportEmoji}</span>\n                    <span class=\"sport-name\">${activity.sport.toUpperCase()}</span>\n                    <span class=\"distance\">${activity.distance}</span>\n                </div>\n                <div class=\"activity-venue\">${activity.venue}</div>\n                <div class=\"activity-details\">\n                    <span class=\"time-info\">${activity.timeString}</span>\n                    <span class=\"status\">${timeInfo}</span>\n                </div>\n                <div class=\"activity-footer\">\n                    <span class=\"cost\">$${activity.cost}</span>\n                    ${activity.ageGroup ? `<span class=\"age-group\">${activity.ageGroup}</span>` : ''}\n                    ${activity.skillLevel ? `<span class=\"skill-level\">${activity.skillLevel}</span>` : ''}\n                </div>\n            </div>\n        `;\n    },\n    \n    // Create card for open courts\n    createCourtCard(court) {\n        const typeEmoji = this.getSportEmoji(court.type);\n        const statusClass = court.status === 'open' ? 'status-open' : 'status-partial';\n        \n        return `\n            <div class=\"court-card\" onclick=\"window.showCourtDetails(${JSON.stringify(court).replace(/\"/g, '&quot;')})\">\n                <div class=\"court-header\">\n                    <span class=\"court-icon\">${typeEmoji}</span>\n                    <span class=\"court-type\">${court.type.toUpperCase()}</span>\n                    <span class=\"distance\">${court.distance}</span>\n                </div>\n                <div class=\"court-venue\">${court.venue}</div>\n                <div class=\"court-status ${statusClass}\">${court.status.toUpperCase()}</div>\n                ${court.courts ? `<div class=\"court-count\">${court.courts} courts</div>` : ''}\n                ${court.busyTimes ? `<div class=\"busy-times\">${court.busyTimes}</div>` : ''}\n            </div>\n        `;\n    },\n    \n    // Create card for pickup games\n    createPickupGameCard(game) {\n        const sportEmoji = this.getSportEmoji(game.sport);\n        \n        return `\n            <div class=\"pickup-game-card\" onclick=\"window.showPickupGameDetails(${JSON.stringify(game).replace(/\"/g, '&quot;')})\">\n                <div class=\"game-header\">\n                    <span class=\"sport-icon\">${sportEmoji}</span>\n                    <span class=\"sport-name\">${game.sport.toUpperCase()}</span>\n                    <span class=\"distance\">${game.distance}</span>\n                </div>\n                <div class=\"game-venue\">${game.venue}</div>\n                <div class=\"game-organizer\">${game.organizer} via ${game.platform}</div>\n                <div class=\"game-details\">\n                    <span class=\"time\">${game.time}</span>\n                    <span class=\"skill-level\">${game.skillLevel}</span>\n                </div>\n                <div class=\"game-footer\">\n                    ${game.playersNeeded ? `<span class=\"players-needed\">Need ${game.playersNeeded} players</span>` : ''}\n                    ${game.spotsLeft ? `<span class=\"spots-left\">${game.spotsLeft} spots left</span>` : ''}\n                    <span class=\"join-method\">${game.joinMethod}</span>\n                </div>\n            </div>\n        `;\n    },\n    \n    // Get sport emoji\n    getSportEmoji(sport) {\n        const emojis = {\n            basketball: '🏀',\n            volleyball: '🏐',\n            soccer: '⚽',\n            badminton: '🏸',\n            hockey: '🏒',\n            skating: '⛸️',\n            tennis: '🎾',\n            swimming: '🏊',\n            football: '🏈',\n            'ping-pong': '🏓',\n            frisbee: '🥏',\n            rugby: '🏉',\n            baseball: '⚾',\n            softball: '🥎'\n        };\n        return emojis[sport] || '🏃';\n    },\n\n    // Display search results\n    displayResults(games, sport) {\n        const resultsDiv = document.getElementById('playNowResults');\n\n        if (games.length === 0) {\n            resultsDiv.innerHTML = `\n                <div class=\"no-results\">\n                    <h3>No ${sport === 'any' ? '' : sport} games available right now</h3>\n                    <p>Try selecting a different sport or check back later.</p>\n                </div>\n            `;\n            return;\n        }\n\n        // Group games by venue/field\n        const venueGames = this.groupGamesByVenue(games);\n\n        let html = `\n            <div class=\"results-header\">\n                <h3>${games.length} ${sport === 'any' ? '' : sport} games available</h3>\n            </div>\n            <div class=\"venue-list\">\n        `;\n\n        Object.entries(venueGames).forEach(([venueName, venueData]) => {\n            html += `\n                <div class=\"venue-card\">\n                    <div class=\"venue-header\">\n                        <h4 class=\"venue-name\">${venueName}</h4>\n                        <span class=\"game-count\">${venueData.games.length} games</span>\n                    </div>\n                    <div class=\"venue-games\">\n            `;\n\n            venueData.games.slice(0, 3).forEach(game => {\n                const timeStr = game.startTime ?\n                    new Date(game.startTime).toLocaleString('en-US', {\n                        weekday: 'short',\n                        hour: 'numeric',\n                        minute: '2-digit'\n                    }) :\n                    'Time TBD';\n\n                html += `\n                    <div class=\"venue-game-item\" onclick=\"window.showGameDetails(${JSON.stringify(game).replace(/\"/g, '&quot;')})\">\n                        <span class=\"game-time\">${timeStr}</span>\n                        <span class=\"game-sport\">${game.type || game.sport}</span>\n                        <span class=\"game-players\">${game.attendees || 0}/${game.maxAttendees || 20}</span>\n                    </div>\n                `;\n            });\n\n            if (venueData.games.length > 3) {\n                html += `<div class=\"more-games\">+${venueData.games.length - 3} more games</div>`;\n            }\n\n            html += `\n                    </div>\n                </div>\n            `;\n        });\n\n        html += '</div>';\n        resultsDiv.innerHTML = html;\n    },\n\n    // Group games by venue\n    groupGamesByVenue(games) {\n        const venues = {};\n\n        games.forEach(game => {\n            const venueName = game.venue?.name || game.location || 'Unknown venue';\n            if (!venues[venueName]) {\n                venues[venueName] = {\n                    games: [],\n                    coords:\n                        game.coords ||\n                        (game.venue?.coordinates ? [game.venue.coordinates.lat, game.venue.coordinates.lng] : null)\n                };\n            }\n            venues[venueName].games.push(game);\n        });\n\n        return venues;\n    },\n\n    // Update map markers for Play Now activities\n    updateMapMarkersForPlayNow(activities) {\n        if (!window.map && !window.googleMap) {\n            return;\n        }\n\n        // Clear existing markers\n        if (window.googleMap && window.clearGoogleMarkers) {\n            window.clearGoogleMarkers();\n        } else if (window.markers) {\n            window.markers.forEach(marker => window.map.removeLayer(marker));\n            window.markers = [];\n        }\n\n        // Add markers for all activity types\n        const allActivities = [\n            ...activities.happeningNow,\n            ...activities.startingSoon,\n            ...activities.openCourts,\n            ...activities.pickupGames\n        ];\n\n        allActivities.forEach(activity => {\n            if (activity.coordinates) {\n                const markerData = {\n                    id: activity.id,\n                    sport: activity.sport || activity.type,\n                    venue: { \n                        name: activity.venue,\n                        coordinates: activity.coordinates\n                    },\n                    coords: [activity.coordinates.lat, activity.coordinates.lng],\n                    type: activity.type || 'drop-in',\n                    status: activity.status,\n                    time: activity.timeString || activity.time\n                };\n                window.addGameMarker(markerData);\n            }\n        });\n\n        // Fit map to show all markers\n        if (window.googleMap && window.fitMapToMarkers) {\n            window.fitMapToMarkers();\n        } else if (window.markers && window.markers.length > 0) {\n            const group = new L.FeatureGroup(window.markers);\n            window.map.fitBounds(group.getBounds().pad(0.1));\n        }\n    },\n\n    // Update map markers\n    updateMapMarkers(games) {\n        if (!window.map && !window.googleMap) {\n            return;\n        }\n\n        // Clear existing markers\n        if (window.googleMap && window.clearGoogleMarkers) {\n            window.clearGoogleMarkers();\n        } else if (window.markers) {\n            window.markers.forEach(marker => window.map.removeLayer(marker));\n            window.markers = [];\n        }\n\n        // Add new markers\n        games.forEach(game => {\n            if (game.coords || game.venue?.coordinates) {\n                window.addGameMarker(game);\n            }\n        });\n\n        // Fit map to show all markers\n        if (window.googleMap && window.fitMapToMarkers) {\n            window.fitMapToMarkers();\n        } else if (window.markers && window.markers.length > 0) {\n            const group = new L.FeatureGroup(window.markers);\n            window.map.fitBounds(group.getBounds().pad(0.1));\n        }\n    }\n};\n",
    "timestamp": "2025-07-13T08:40:46.781Z"
  },
  {
    "name": "Main JavaScript",
    "url": "https://findingsports.com/assets/js/main.js",
    "method": "GET",
    "status": 404,
    "statusText": "Not Found",
    "success": false,
    "responseTime": 170,
    "headers": {
      "access-control-allow-credentials": "true",
      "content-length": "156",
      "content-security-policy": "default-src 'none'",
      "content-type": "text/html; charset=utf-8",
      "date": "Sun, 13 Jul 2025 08:40:46 GMT",
      "server": "railway-edge",
      "vary": "Origin",
      "x-content-type-options": "nosniff",
      "x-powered-by": "Express",
      "x-railway-edge": "railway/us-west2",
      "x-railway-request-id": "lI2LypnkTSysasX3npoFkQ"
    },
    "data": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<title>Error</title>\n</head>\n<body>\n<pre>Cannot GET /assets/js/main.js</pre>\n</body>\n</html>\n",
    "timestamp": "2025-07-13T08:40:46.952Z"
  },
  {
    "name": "Main Stylesheet",
    "url": "https://findingsports.com/css/style.css",
    "method": "GET",
    "status": 404,
    "statusText": "Not Found",
    "success": false,
    "responseTime": 38,
    "headers": {
      "access-control-allow-credentials": "true",
      "content-length": "152",
      "content-security-policy": "default-src 'none'",
      "content-type": "text/html; charset=utf-8",
      "date": "Sun, 13 Jul 2025 08:40:46 GMT",
      "server": "railway-edge",
      "vary": "Origin",
      "x-content-type-options": "nosniff",
      "x-powered-by": "Express",
      "x-railway-edge": "railway/us-west2",
      "x-railway-request-id": "XXW9aJmrT2C2Xls9npoFkQ"
    },
    "data": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<title>Error</title>\n</head>\n<body>\n<pre>Cannot GET /css/style.css</pre>\n</body>\n</html>\n",
    "timestamp": "2025-07-13T08:40:46.990Z"
  },
  {
    "name": "Assets Stylesheet",
    "url": "https://findingsports.com/assets/css/style.css",
    "method": "GET",
    "status": 404,
    "statusText": "Not Found",
    "success": false,
    "responseTime": 166,
    "headers": {
      "access-control-allow-credentials": "true",
      "content-length": "159",
      "content-security-policy": "default-src 'none'",
      "content-type": "text/html; charset=utf-8",
      "date": "Sun, 13 Jul 2025 08:40:47 GMT",
      "server": "railway-edge",
      "vary": "Origin",
      "x-content-type-options": "nosniff",
      "x-powered-by": "Express",
      "x-railway-edge": "railway/us-west2",
      "x-railway-request-id": "bL5QLE2gR1GZbyWXnpoFkQ"
    },
    "data": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<title>Error</title>\n</head>\n<body>\n<pre>Cannot GET /assets/css/style.css</pre>\n</body>\n</html>\n",
    "timestamp": "2025-07-13T08:40:47.157Z"
  },
  {
    "name": "User Games",
    "url": "https://findingsports.com/api/user/games",
    "method": "GET",
    "status": 404,
    "statusText": "Not Found",
    "success": false,
    "responseTime": 44,
    "headers": {
      "access-control-allow-credentials": "true",
      "content-length": "153",
      "content-security-policy": "default-src 'none'",
      "content-type": "text/html; charset=utf-8",
      "date": "Sun, 13 Jul 2025 08:40:47 GMT",
      "server": "railway-edge",
      "vary": "Origin",
      "x-content-type-options": "nosniff",
      "x-powered-by": "Express",
      "x-railway-edge": "railway/us-west2",
      "x-railway-request-id": "p8Lz_IOhQpCfrAA2npoFkQ"
    },
    "data": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<title>Error</title>\n</head>\n<body>\n<pre>Cannot GET /api/user/games</pre>\n</body>\n</html>\n",
    "timestamp": "2025-07-13T08:40:47.203Z"
  },
  {
    "name": "Create Game",
    "url": "https://findingsports.com/api/games",
    "method": "POST",
    "status": 401,
    "statusText": "Unauthorized",
    "success": false,
    "responseTime": 39,
    "headers": {
      "access-control-allow-credentials": "true",
      "content-length": "12",
      "content-type": "text/plain; charset=utf-8",
      "date": "Sun, 13 Jul 2025 08:40:47 GMT",
      "etag": "W/\"c-dAuDFQrdjS3hezqxDTNgW7AOlYk\"",
      "server": "railway-edge",
      "vary": "Origin",
      "x-powered-by": "Express",
      "x-railway-edge": "railway/us-west2",
      "x-railway-request-id": "eGBhEdLuQOa7hixwnpoFkQ"
    },
    "data": "Unauthorized",
    "timestamp": "2025-07-13T08:40:47.242Z"
  },
  {
    "name": "Join Game",
    "url": "https://findingsports.com/api/games/123/join",
    "method": "POST",
    "status": 401,
    "statusText": "Unauthorized",
    "success": false,
    "responseTime": 47,
    "headers": {
      "access-control-allow-credentials": "true",
      "content-length": "12",
      "content-type": "text/plain; charset=utf-8",
      "date": "Sun, 13 Jul 2025 08:40:47 GMT",
      "etag": "W/\"c-dAuDFQrdjS3hezqxDTNgW7AOlYk\"",
      "server": "railway-edge",
      "vary": "Origin",
      "x-powered-by": "Express",
      "x-railway-edge": "railway/us-west2",
      "x-railway-request-id": "bljNYa8QRqqhj6m7npoFkQ"
    },
    "data": "Unauthorized",
    "timestamp": "2025-07-13T08:40:47.290Z"
  }
]
```
