# 🌐 Finding Sports - MCP Data Collection Architecture

## The 3-Part Ecosystem

### 1️⃣ **MCP Server Network** (Data Collection Layer)
### 2️⃣ **Finding Sports Platform** (Aggregation & Display)
### 3️⃣ **User Authentication** (Google OAuth + Traditional)

---

## Part 1: MCP Server Network for Data Collection

### 🎯 MCP Server Registry

```yaml
# mcp-servers-registry.yaml
registered_servers:
  # Recreation Center Scrapers
  - id: mcp-vancouver-rec
    name: "Vancouver Recreation Centers"
    type: web_scraper
    data_provides:
      - venue_schedules
      - drop_in_times
      - facility_info
    update_frequency: hourly
    maintainer: "@community"
    stars: 124
    installs: 1.2k
    
  - id: mcp-burnaby-rec
    name: "Burnaby Rec Centers"
    type: web_scraper
    data_provides:
      - venue_schedules
      - programs
    update_frequency: daily
    maintainer: "@bobinzuks"
    stars: 89
    installs: 876

  # Sports League APIs
  - id: mcp-basketball-bc
    name: "Basketball BC League Data"
    type: api_integration
    data_provides:
      - league_games
      - tournament_schedules
      - team_rosters
    api_endpoint: "https://basketballbc.ca/api"
    auth_required: true
    
  # Social Media Monitors
  - id: mcp-facebook-sports
    name: "Facebook Sports Events"
    type: social_scraper
    data_provides:
      - community_games
      - pickup_events
    platforms:
      - facebook_events
      - facebook_groups
    
  # Email Parsers
  - id: mcp-gmail-sports
    name: "Gmail Sports Parser"
    type: email_parser
    data_provides:
      - registration_confirmations
      - game_reminders
      - schedule_updates
    
  # Weather Integration
  - id: mcp-weather-sports
    name: "Weather Impact Analyzer"
    type: api_integration
    data_provides:
      - outdoor_game_viability
      - weather_alerts
    
  # Facility Booking Systems
  - id: mcp-perfectmind
    name: "PerfectMind Integration"
    type: api_integration
    data_provides:
      - real_time_availability
      - booking_status
    used_by:
      - "City of Vancouver"
      - "City of Richmond"
```

### 🏗️ MCP Server Implementation Structure

```typescript
// Base MCP Server Interface
interface SportsMCPServer {
  id: string;
  name: string;
  version: string;
  
  // Core methods every server must implement
  async getVenues(): Promise<Venue[]>;
  async getSchedule(venueId: string, dateRange: DateRange): Promise<Schedule[]>;
  async getAvailability(venueId: string, sport: string): Promise<Availability>;
  
  // Optional methods
  async subscribeToUpdates?(callback: UpdateCallback): Promise<Subscription>;
  async getHistoricalData?(query: HistoricalQuery): Promise<HistoricalData>;
}

// Example: Vancouver Rec MCP Server
export class VancouverRecMCPServer implements SportsMCPServer {
  id = "mcp-vancouver-rec";
  name = "Vancouver Recreation Centers";
  version = "1.2.0";
  
  private scraper: WebScraper;
  private cache: CacheService;
  
  async getVenues(): Promise<Venue[]> {
    // Check cache first
    const cached = await this.cache.get('venues');
    if (cached && !this.isStale(cached)) {
      return cached.data;
    }
    
    // Scrape venues
    const venues = await this.scraper.scrapeVenues([
      'https://vancouver.ca/parks-recreation-culture/hillcrest-centre.aspx',
      'https://vancouver.ca/parks-recreation-culture/kitsilano-pool.aspx',
      'https://vancouver.ca/parks-recreation-culture/trout-lake-centre.aspx',
      // ... more venues
    ]);
    
    // Normalize data
    const normalized = venues.map(v => this.normalizeVenue(v));
    
    // Cache and return
    await this.cache.set('venues', normalized, TTL.ONE_HOUR);
    return normalized;
  }
  
  async getSchedule(venueId: string, dateRange: DateRange): Promise<Schedule[]> {
    const url = `https://vancouver.ca/schedules/${venueId}`;
    const html = await this.scraper.fetch(url);
    
    // Parse schedule tables
    const schedules = this.parseScheduleHTML(html);
    
    // Filter by sport types we care about
    return schedules.filter(s => 
      SUPPORTED_SPORTS.includes(s.sportType)
    );
  }
}
```

### 🔄 MCP Server Development Kit (SDK)

```bash
# Install Finding Sports MCP SDK
npm install -g @finding-sports/mcp-sdk

# Create new MCP server
finding-sports-mcp create my-rec-center-scraper

# Test your server
finding-sports-mcp test

# Publish to registry
finding-sports-mcp publish
```

### 📡 MCP Server Communication Protocol

```yaml
# Standard MCP message format for Finding Sports
message_format:
  version: "1.0"
  timestamp: "2025-01-04T12:00:00Z"
  server_id: "mcp-vancouver-rec"
  data_type: "venue_update"
  payload:
    venue_id: "hillcrest-centre"
    updates:
      - field: "drop_in_basketball"
        old_value: "2:00 PM - 4:00 PM"
        new_value: "CANCELLED - Maintenance"
        effective_date: "2025-01-04"
    confidence: 0.95
    source_url: "https://vancouver.ca/..."
```

---

## Part 2: Google OAuth + User Authentication

### 🔐 Enhanced Authentication System

```typescript
// Google OAuth Integration
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:8080/auth/google/callback'
);

// Auth routes
app.get('/auth/google', (req, res) => {
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/calendar.events', // For game scheduling
    ],
  });
  res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  const { tokens } = await client.getToken(code);
  
  // Get user info
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  
  const payload = ticket.getPayload();
  
  // Create or update user
  const user = await createOrUpdateUser({
    googleId: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    locale: payload.locale,
  });
  
  // Generate JWT
  const jwt = generateJWT(user);
  
  res.redirect(`/?token=${jwt}`);
});
```

### 👤 User Profile Schema

```sql
-- Enhanced user table with OAuth
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    
    -- Auth methods
    auth_provider VARCHAR(50) DEFAULT 'local', -- 'local', 'google', 'facebook'
    google_id VARCHAR(255) UNIQUE,
    facebook_id VARCHAR(255) UNIQUE,
    
    -- Profile data
    bio TEXT,
    preferred_sports TEXT[] DEFAULT '{}',
    skill_levels JSONB DEFAULT '{}',
    
    -- Location & preferences
    city VARCHAR(100),
    preferred_radius_km INTEGER DEFAULT 10,
    notification_preferences JSONB DEFAULT '{
        "game_reminders": true,
        "new_games": true,
        "friend_invites": true,
        "weather_alerts": true
    }',
    
    -- MCP server preferences
    enabled_mcp_servers TEXT[] DEFAULT '{
        "mcp-vancouver-rec",
        "mcp-burnaby-rec"
    }',
    
    -- Subscription info
    subscription_tier VARCHAR(50) DEFAULT 'free',
    subscription_expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User's favorite venues
CREATE TABLE user_favorite_venues (
    user_id UUID REFERENCES users(id),
    venue_id UUID REFERENCES venues(id),
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, venue_id)
);

-- User's sports preferences with detailed info
CREATE TABLE user_sport_preferences (
    user_id UUID REFERENCES users(id),
    sport_type VARCHAR(50),
    skill_level VARCHAR(50),
    preferred_times JSONB, -- {"weekday_evening": true, "weekend_morning": true}
    max_travel_distance_km INTEGER,
    preferred_game_types TEXT[], -- ['drop-in', 'organized', 'league']
    PRIMARY KEY (user_id, sport_type)
);
```

### 🎨 Enhanced Login UI

```html
<!-- Enhanced login with Google -->
<div class="auth-box">
    <h1 class="logo">Finding Sports</h1>
    
    <!-- Social login options -->
    <div class="social-auth">
        <button class="google-signin" onclick="signInWithGoogle()">
            <img src="/images/google-logo.svg" alt="Google">
            <span>Continue with Google</span>
        </button>
        
        <button class="facebook-signin" onclick="signInWithFacebook()">
            <img src="/images/facebook-logo.svg" alt="Facebook">
            <span>Continue with Facebook</span>
        </button>
    </div>
    
    <div class="divider">
        <span>OR</span>
    </div>
    
    <!-- Traditional login -->
    <form id="loginForm">
        <input type="email" placeholder="Email address" required>
        <input type="password" placeholder="Password" required>
        <button type="submit">Sign In</button>
    </form>
    
    <p class="signup-prompt">
        New to Finding Sports? 
        <a href="#" onclick="showSignup()">Create an account</a>
    </p>
</div>
```

---

## Part 3: User Onboarding & MCP Server Selection

### 🚀 Smart Onboarding Flow

```typescript
// Onboarding steps after signup
interface OnboardingFlow {
  steps: [
    {
      id: 'location',
      title: 'Where do you play?',
      component: LocationSelector,
      data: {
        detectedCity: 'Vancouver', // From IP
        nearbyOptions: ['Burnaby', 'Richmond', 'Surrey']
      }
    },
    {
      id: 'sports',
      title: 'What sports do you play?',
      component: SportsSelector,
      data: {
        popularSports: ['Basketball', 'Soccer', 'Volleyball'],
        allSports: AVAILABLE_SPORTS
      }
    },
    {
      id: 'data_sources',
      title: 'Where should we look for games?',
      component: MCPServerSelector,
      data: {
        recommended: [
          'mcp-vancouver-rec',
          'mcp-facebook-sports'
        ],
        available: MCP_REGISTRY
      }
    },
    {
      id: 'preferences',
      title: 'When do you like to play?',
      component: TimePreferences,
      data: {
        options: ['Weekday mornings', 'Evenings', 'Weekends']
      }
    }
  ]
}
```

### 🔌 MCP Server Marketplace UI

```jsx
// MCP Server selection component
function MCPServerMarketplace({ userLocation, userSports }) {
  const [servers, setServers] = useState([]);
  const [installed, setInstalled] = useState([]);
  
  return (
    <div className="mcp-marketplace">
      <h2>Data Sources for {userLocation}</h2>
      
      <div className="recommended-servers">
        <h3>Recommended for you</h3>
        {servers
          .filter(s => s.locations.includes(userLocation))
          .map(server => (
            <ServerCard
              key={server.id}
              server={server}
              onInstall={() => installServer(server.id)}
            />
          ))
        }
      </div>
      
      <div className="all-servers">
        <h3>Browse all data sources</h3>
        <div className="filter-bar">
          <input placeholder="Search servers..." />
          <select>
            <option>All types</option>
            <option>Web scrapers</option>
            <option>API integrations</option>
            <option>Social media</option>
          </select>
        </div>
        
        {servers.map(server => (
          <div className="server-card">
            <h4>{server.name}</h4>
            <p>{server.description}</p>
            <div className="stats">
              <span>⭐ {server.stars}</span>
              <span>📥 {server.installs}</span>
              <span>🔄 Updates {server.updateFrequency}</span>
            </div>
            <button onClick={() => toggleServer(server.id)}>
              {installed.includes(server.id) ? 'Disable' : 'Enable'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 📊 Unified Data Dashboard

```typescript
// Aggregate data from all enabled MCP servers
class DataAggregationService {
  async getUnifiedSchedule(userId: string): Promise<UnifiedSchedule> {
    const user = await this.getUser(userId);
    const enabledServers = user.enabled_mcp_servers;
    
    // Fetch from all sources in parallel
    const results = await Promise.allSettled(
      enabledServers.map(serverId => 
        this.fetchFromMCPServer(serverId, user.preferences)
      )
    );
    
    // Merge and deduplicate
    const allGames = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value.games);
    
    // Apply user preferences
    const filtered = this.applyUserPreferences(allGames, user);
    
    // Rank by relevance
    const ranked = this.rankByRelevance(filtered, user);
    
    return {
      games: ranked,
      sources: results.map(r => ({
        serverId: r.serverId,
        status: r.status,
        count: r.value?.games.length || 0
      })),
      lastUpdated: new Date()
    };
  }
}
```

---

## 🎯 Complete User Journey

1. **User visits Finding Sports**
2. **Clicks "Continue with Google"**
3. **Google OAuth flow** → Profile created
4. **Onboarding wizard**:
   - Select location
   - Choose sports
   - **Enable MCP data sources** (the key part!)
   - Set preferences
5. **Dashboard shows aggregated data** from all sources
6. **User can add/remove MCP servers** anytime

---

## 🚀 Implementation Roadmap

### Phase 1: Google OAuth (Week 1)
- Set up Google Cloud Console
- Implement OAuth flow
- Update user schema
- Enhanced login UI

### Phase 2: MCP Server Registry (Week 2-3)
- Create server registry database
- Build MCP SDK
- Implement first 3 scrapers
- Testing framework

### Phase 3: User Onboarding (Week 4)
- Onboarding wizard UI
- MCP server marketplace
- Preference system
- Data aggregation service

### Phase 4: Launch (Week 5-6)
- Beta testing
- Community MCP servers
- Documentation
- Marketing

This creates a complete ecosystem where:
- **Users** get personalized, comprehensive game data
- **Developers** can contribute MCP servers
- **Communities** maintain their local data sources
- **Platform** scales infinitely with community contributions

The MCP servers become like "apps" that users can install to get more data sources! 🚀