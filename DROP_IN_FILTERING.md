# Drop-in Games Filtering & Venue Request System

## Overview

The Finding Sports app now exclusively focuses on drop-in, open public games - filtering out leagues, closed groups, and members-only activities.

## Drop-in Detection System

### 1. Keyword-Based Filtering

The system identifies drop-in games by looking for:

**✅ Drop-in Indicators:**
- "drop-in", "dropin", "drop in"
- "open play", "open gym"
- "public", "casual", "pickup", "pick-up"
- "free play", "all welcome"
- "no registration", "first come"

**❌ League/Closed Indicators:**
- "league", "team", "club"
- "members only", "registration required"
- "tryouts", "season", "tournament"
- "closed", "private", "membership", "roster"

### 2. Implementation

```javascript
// In base-source.js
isDropIn(text) {
    const dropInKeywords = [...];
    const leagueKeywords = [...];
    
    // Reject if has league keywords WITHOUT drop-in keywords
    // Accept if has explicit drop-in keywords
    // Default to true for community centers
}
```

### 3. Data Sources Filtering

- **Vancouver Open Data**: Only facility info (no schedules)
- **Community Centers**: Filtered for drop-in activities only
- **User Submissions**: Clear notice about drop-in only policy

## Venue Request System

### User Flow

1. **Venue Selection**
   - User sees dropdown with known venues
   - Last option: "🔍 Other venue (search or add new)"

2. **Search Process**
   ```
   User types venue name
   ↓
   Real-time search in existing venues
   ↓
   If found → Select and continue
   If not found → Request new venue
   ```

3. **Request Submission**
   - Venue name
   - Full address
   - Sport type
   - Additional info (optional)
   - **Promise**: Added within 24 hours

### Technical Implementation

#### Frontend (`venue-search.js`)
```javascript
class VenueSearch {
    - Real-time search with 300ms debounce
    - Autocomplete from existing venues
    - Seamless request form for new venues
    - Success confirmation with request ID
}
```

#### Backend Routes (`/api/venue-requests/`)
```
POST   /request        - Submit new venue request
GET    /my-requests    - View user's requests
GET    /:requestId     - Check request status
GET    /search/:query  - Search existing venues
```

#### Admin Routes
```
GET    /admin/pending       - View all pending requests
PUT    /admin/:id/status    - Update request status
```

### Request Processing

1. **User submits request**
   - Stored with unique ID
   - Status: "pending"
   - Estimated completion: 24 hours

2. **Admin review** (manual process)
   - Research venue for drop-in availability
   - Verify it's not a league/closed facility
   - Add to database if approved

3. **User notification**
   - WebSocket notification when complete
   - Email notification (if implemented)
   - Request ID for tracking

## Game Submission Form

### Drop-in Only Notice
```
🏃 Drop-in Games Only
Please only submit games that are:
• Open to the public (no membership required)
• Drop-in style (no pre-registration needed)
• First-come, first-served
• NOT league games or closed groups
```

### Venue Selection Enhanced
- Organized by category (Community Centers, Universities, Sports Facilities)
- "Other venue" option with search
- Automatic venue request if not found

### Validation
- Only future dates allowed
- Skill level options (all welcome, beginner, intermediate, advanced)
- Cost field (0 for free)
- Recurring option for weekly games

## Database Schema Updates

```javascript
// Game schema additions
{
    type: 'drop-in', // Explicitly marked
    requirements: ['First come, first served', 'All skill levels welcome'],
    openToPublic: true
}

// Venue request schema
{
    id: String,
    venueName: String,
    address: String,
    sport: String,
    additionalInfo: String,
    requestedBy: Object,
    status: 'pending' | 'researching' | 'completed' | 'rejected',
    submittedAt: Date,
    estimatedCompletion: Date,
    notes: Array
}
```

## User Experience

### Finding Games
1. All games shown are drop-in only
2. Clear indicators (no "League" or "Members only" tags)
3. Requirements show "First come, first served"

### Can't Find Venue?
1. Search in dropdown
2. If not found → request form appears
3. Submit with address and info
4. Get confirmation with 24-hour promise
5. Continue with game submission once approved

### Tracking Requests
- View all your venue requests
- See status updates
- Get notified when complete
- Request ID for reference

## Admin Dashboard (Future)

### Venue Request Management
```
Pending Requests
┌─────────────────────────────────────────┐
│ VR_001 | YMCA Downtown | Pending       │
│ VR_002 | Local Park    | Researching   │
│ VR_003 | School Gym    | Completed     │
└─────────────────────────────────────────┘

Actions: [Research] [Approve] [Reject]
```

### Research Process
1. Check venue website
2. Call if needed
3. Verify drop-in availability
4. Add to approved venues database

## Benefits

1. **Quality Control**: Only genuine drop-in games
2. **User Trust**: No surprises (leagues requiring signup)
3. **Community Growth**: Easy to request new venues
4. **24-hour SLA**: Quick turnaround on requests
5. **Comprehensive Coverage**: Crowd-sourced venue discovery

## Future Enhancements

1. **Auto-Research**: Web scraping for requested venues
2. **Venue Partnerships**: Direct API access
3. **Community Verification**: Users verify drop-in status
4. **Photo Uploads**: Venue photos with requests
5. **Nearby Suggestions**: "Similar venues near you"