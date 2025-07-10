# 🏀 Finding Sports - Local Drop-in Games & Open Fields Aggregation

## 🎯 What This System Does

This backend aggregates **publicly available drop-in sports games** and **open fields/courts** from 100+ local sources across Vancouver and surrounding areas. Perfect for people who want to just show up and play!

## 📍 Data Sources for Local Drop-in Sports

### 🏢 Municipal Recreation Centers
- **Vancouver Parks & Rec** - Drop-in basketball, volleyball, soccer, badminton
- **Burnaby Recreation** - Drop-in schedules for all rec centers
- **Richmond Recreation** - Drop-in sports activities
- **Surrey Recreation** - Drop-in programs at all facilities
- **North Vancouver Rec** - NVRC drop-in schedules
- **Coquitlam Recreation** - Drop-in sports programs

### 🏫 Universities & Colleges
- **UBC Recreation** - Drop-in sports for students and public
- **SFU Recreation** - Open gym times and drop-in sports
- **Langara Recreation** - Drop-in basketball and volleyball
- **VCC Gym** - Open gym hours

### 🏋️ Fitness Centers & Gyms
- **YMCA Greater Vancouver** - Drop-in sports at all locations
- **Jewish Community Centre** - Drop-in basketball, volleyball
- **Steve Nash Fitness** - Drop-in sports programs
- **Club 16** - Basketball courts drop-in times

### 🌳 Parks & Open Fields
- **Vancouver Park Board** - Field status and availability
  - Soccer fields open for public use
  - Tennis courts (first-come, first-served)
  - Basketball courts in parks
  - Beach volleyball courts
- **Baseball diamonds** - When not booked
- **Running tracks** - Public access times

### 📱 Pickup Game Apps & Websites
- **OpenSports** - Pickup games organized by locals
- **Javelin App** - Find and join pickup games
- **PlaySports App** - Local pickup game finder
- **Courts of the World** - Basketball court finder

### 👥 Social Media & Community
- **Meetup Groups** - Drop-in sports meetups
  - Vancouver Drop-in Basketball
  - Vancouver Pickup Soccer
  - Beach Volleyball Meetups
- **Facebook Groups** - Public pickup game posts
  - Vancouver Pickup Sports
  - Drop-in Basketball Vancouver
- **Craigslist** - Activity section for pickup games

### 🏸 Sport-Specific Facilities
- **Basketball City** - Drop-in basketball sessions
- **Urban Rec** - Drop-in sports leagues
- **Vancouver Badminton Club** - Drop-in badminton
- **Pickleball BC** - Drop-in pickleball locations

### 🌦️ Weather & Field Status
- **Rainout Line** - Real-time field conditions
- **Park Board Field Status** - Updated field closures
- **Weather Impact** - Which outdoor games are on/off

## 🎮 Types of Games/Activities Tracked

### Drop-in Sports
- **Basketball** - Indoor gyms, outdoor courts
- **Volleyball** - Indoor courts, beach volleyball
- **Soccer** - Indoor soccer, outdoor fields
- **Badminton** - Recreation center courts
- **Pickleball** - Growing number of courts
- **Tennis** - Public courts availability
- **Hockey** - Shinny/drop-in ice times
- **Swimming** - Lane swim times

### Open Play Areas
- **Basketball Courts** - Outdoor public courts
- **Soccer Fields** - When not booked for leagues
- **Tennis Courts** - First-come, first-served
- **Beach Volleyball** - Kitsilano, English Bay, Jericho
- **Baseball Diamonds** - Open for casual use
- **Running Tracks** - Public access hours

### Pickup Games
- **Organized Pickups** - Regular weekly games
- **Spontaneous Games** - "Playing now" notifications
- **Skill-Level Games** - Beginner to advanced

## 🔍 How It Works

### 1. Data Collection
The system continuously monitors all sources for:
- Drop-in schedules at rec centers
- Open gym/field times
- Pickup game posts on social media
- Real-time field conditions
- Court/field availability

### 2. Smart Filtering
- Filters out league games (not drop-in)
- Removes registration-required events
- Focuses on "just show up and play"
- Checks weather impact on outdoor games

### 3. Real-time Updates
- First daily request triggers fresh data
- Caches for optimal performance
- Weather-based updates for outdoor venues
- Live "playing now" notifications

## 📡 API Usage Examples

### Get Drop-in Basketball Games
```bash
curl "http://localhost:8080/api/v2/games?sport=basketball&type=drop-in"
```

### Find Open Soccer Fields
```bash
curl "http://localhost:8080/api/v2/games?sport=soccer&type=open-field"
```

### Get All Drop-in Sports Near Me
```bash
curl "http://localhost:8080/api/v2/games?lat=49.2827&lng=-123.1207&radius=5&type=drop-in"
```

### Check Today's Pickup Games
```bash
curl "http://localhost:8080/api/v2/games?date=today&type=pickup"
```

## 🗺️ Location Coverage

### Primary Coverage
- **Vancouver** - Complete coverage
- **Burnaby** - All rec centers
- **Richmond** - Major facilities
- **North Vancouver** - NVRC facilities
- **Surrey** - Recreation centers
- **New Westminster** - Community centers

### Secondary Coverage
- **Coquitlam/Port Coquitlam**
- **Delta/Tsawwassen**
- **White Rock**
- **West Vancouver**
- **Langley**

## 📊 Sample Data Response

```json
{
  "games": [
    {
      "id": "hillcrest-basketball-dropin-2025-01-10-18",
      "title": "Drop-in Basketball",
      "sport": "basketball",
      "type": "drop-in",
      "venue": {
        "name": "Hillcrest Community Centre",
        "address": "4575 Clancy Loranger Way, Vancouver",
        "coordinates": { "lat": 49.2435, "lng": -123.1089 }
      },
      "startTime": "2025-01-10T18:00:00",
      "endTime": "2025-01-10T20:00:00",
      "price": 5.50,
      "capacity": { "max": 30, "current": null },
      "requirements": ["Indoor shoes", "Valid admission"],
      "source": "vancouver-rec-drop-in",
      "reliability": 0.95
    },
    {
      "id": "kits-beach-volleyball-open",
      "title": "Beach Volleyball Courts",
      "sport": "volleyball", 
      "type": "open-court",
      "venue": {
        "name": "Kitsilano Beach",
        "address": "Kitsilano Beach, Vancouver",
        "coordinates": { "lat": 49.2744, "lng": -123.1551 }
      },
      "startTime": "2025-01-10T08:00:00",
      "endTime": "2025-01-10T22:00:00",
      "price": 0,
      "capacity": { "max": null, "current": null },
      "requirements": ["First-come, first-served"],
      "weather_dependent": true,
      "source": "vancouver-fields-status",
      "reliability": 0.90
    }
  ],
  "meta": {
    "totalSources": 45,
    "successfulSources": 42,
    "totalGames": 127,
    "breakdown": {
      "drop-in": 89,
      "open-field": 23,
      "pickup": 15
    }
  }
}
```

## 🚀 Key Features

### For Players
- Find drop-in games happening right now
- See which courts/fields are available
- Get notifications when games start
- Filter by skill level and sport
- Check real-time capacity

### For Developers  
- RESTful API with caching
- Real-time WebSocket updates
- Weather integration
- Location-based search
- Automatic data normalization

## 🎯 Perfect For

- **Casual Players** - No commitment, just show up
- **Visitors** - Find games while traveling
- **Beginners** - Friendly drop-in environments
- **Busy Schedules** - Play when you can
- **Social Players** - Meet new people

## 🔮 Coming Soon

- Push notifications for favorite venues
- "I'm playing" social features
- Skill-level matching
- Equipment sharing board
- Carpool coordination
- Live game updates from players

This system makes it easy to answer: **"Where can I play basketball/soccer/volleyball RIGHT NOW?"**