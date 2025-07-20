# API Keys Required for Finding Sports

## 🆓 Free APIs (No Key Required)

### 1. **Vancouver Open Data API**
- **Key Required**: ❌ No
- **URL**: https://opendata.vancouver.ca/
- **Usage**: Community centers, parks, facilities
- **Implementation**: Already working in `working-api-client.js`

## 🔑 Free Tier APIs (Key Required)

### 2. **OpenWeatherMap API**
- **Key Required**: ✅ Yes
- **Sign Up**: https://openweathermap.org/api
- **Free Tier**: 1,000 calls/day
- **Usage**: Field conditions based on weather
- **Key Format**: `OPENWEATHER_API_KEY=xxxxxxxxxxxxxxxxxxxxx`
- **Get Key**: 
  1. Sign up at https://home.openweathermap.org/users/sign_up
  2. Verify email
  3. Go to API keys section
  4. Generate key (active in ~2 hours)

### 3. **Meetup API (OAuth2)**
- **Key Required**: ✅ Yes (OAuth2)
- **Sign Up**: https://www.meetup.com/api/oauth/list/
- **Free Tier**: Basic access
- **Usage**: Sports meetups and pickup games
- **Keys Needed**:
  ```
  MEETUP_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxx
  MEETUP_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxx
  MEETUP_REDIRECT_URI=http://localhost:8080/auth/meetup/callback
  ```
- **Get Keys**:
  1. Log in to Meetup
  2. Go to https://www.meetup.com/api/oauth/list/
  3. Create new OAuth consumer
  4. Save Client ID and Secret

## 💰 Paid APIs (Free Trial Available)

### 4. **Google Places API**
- **Key Required**: ✅ Yes
- **Sign Up**: https://console.cloud.google.com/
- **Free Trial**: $300 credit for 90 days
- **Cost After**: ~$17 per 1,000 requests
- **Usage**: Venue details, busy times, reviews
- **Key Format**: `GOOGLE_PLACES_API_KEY=xxxxxxxxxxxxxxxxxxxxx`
- **Get Key**:
  1. Create Google Cloud account
  2. Enable Places API
  3. Create credentials → API Key
  4. Restrict key to Places API only

### 5. **EventBrite API**
- **Key Required**: ✅ Yes
- **Sign Up**: https://www.eventbrite.com/platform/api
- **Free Tier**: Public event data
- **Usage**: Organized sports events
- **Key Format**: `EVENTBRITE_TOKEN=xxxxxxxxxxxxxxxxxxxxx`
- **Get Key**:
  1. Create EventBrite account
  2. Go to Account Settings → App Management
  3. Create new app
  4. Get OAuth token

### 6. **Foursquare Places API**
- **Key Required**: ✅ Yes
- **Sign Up**: https://foursquare.com/developers/
- **Free Tier**: 99,500 calls/month
- **Usage**: Alternative to Google Places
- **Key Format**: `FOURSQUARE_API_KEY=xxxxxxxxxxxxxxxxxxxxx`
- **Get Key**:
  1. Sign up at https://foursquare.com/developers/signup
  2. Create new app
  3. Get API key from dashboard

### 7. **Yelp Fusion API**
- **Key Required**: ✅ Yes
- **Sign Up**: https://www.yelp.com/developers
- **Free Tier**: 5,000 calls/day
- **Usage**: Sports facilities and reviews
- **Key Format**: `YELP_API_KEY=xxxxxxxxxxxxxxxxxxxxx`
- **Get Key**:
  1. Create Yelp account
  2. Go to https://www.yelp.com/developers/v3/manage_app
  3. Create new app
  4. Get API key

## 🏃 Sports-Specific APIs

### 8. **Strava API**
- **Key Required**: ✅ Yes (OAuth2)
- **Sign Up**: https://www.strava.com/settings/api
- **Free Tier**: 100 requests/15 min, 1000/day
- **Usage**: Popular running/cycling routes
- **Keys Needed**:
  ```
  STRAVA_CLIENT_ID=xxxxx
  STRAVA_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxx
  STRAVA_REFRESH_TOKEN=xxxxxxxxxxxxxxxxxxxxx
  ```

### 9. **Active Network API**
- **Key Required**: ✅ Yes
- **Sign Up**: https://developer.active.com/
- **Usage**: Recreation programs
- **Key Format**: `ACTIVE_API_KEY=xxxxxxxxxxxxxxxxxxxxx`
- **Note**: Application process required

### 10. **SportsEngine API**
- **Key Required**: ✅ Yes
- **Sign Up**: Contact their sales team
- **Usage**: League and tournament data
- **Key Format**: `SPORTSENGINE_API_KEY=xxxxxxxxxxxxxxxxxxxxx`

## 🔐 Social Media APIs

### 11. **Facebook Graph API**
- **Key Required**: ✅ Yes (App ID + Secret)
- **Sign Up**: https://developers.facebook.com/
- **Usage**: Public sports events
- **Keys Needed**:
  ```
  FACEBOOK_APP_ID=xxxxxxxxxxxxxxxxxxxxx
  FACEBOOK_APP_SECRET=xxxxxxxxxxxxxxxxxxxxx
  FACEBOOK_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxx
  ```
- **Note**: Requires app review for public data access

## 📝 Environment File Setup

Create a `.env` file in your backend directory:

```bash
# Free APIs
OPENWEATHER_API_KEY=your_openweather_key_here

# OAuth APIs
MEETUP_CLIENT_ID=your_meetup_client_id
MEETUP_CLIENT_SECRET=your_meetup_secret
MEETUP_REDIRECT_URI=http://localhost:8080/auth/meetup/callback

# Google APIs
GOOGLE_PLACES_API_KEY=your_google_places_key

# Event APIs
EVENTBRITE_TOKEN=your_eventbrite_token

# Venue APIs
FOURSQUARE_API_KEY=your_foursquare_key
YELP_API_KEY=your_yelp_api_key

# Sports APIs
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_secret
ACTIVE_API_KEY=your_active_network_key

# Social APIs
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_secret
```

## 🚀 Priority Order for Implementation

### Phase 1 - Immediate (Free)
1. ✅ Vancouver Open Data (no key needed)
2. ⏳ OpenWeatherMap (free key)

### Phase 2 - Essential ($0-50/month)
3. ⏳ Meetup API (mostly free)
4. ⏳ EventBrite API (free tier)
5. ⏳ Yelp API (free tier)

### Phase 3 - Premium ($50-100/month)
6. ⏳ Google Places API (best data quality)
7. ⏳ Foursquare API (alternative to Google)

### Phase 4 - Advanced Features
8. ⏳ Strava API (fitness routes)
9. ⏳ Facebook Graph API (social events)
10. ⏳ Active Network (rec programs)

## 💡 Tips

1. **Start with free APIs** - Vancouver Open Data + OpenWeatherMap
2. **Test with free tiers** - Most APIs offer generous free tiers
3. **Use API key restrictions** - Limit by domain/IP for security
4. **Monitor usage** - Set up alerts for API limits
5. **Cache responses** - Reduce API calls and costs

## 🔒 Security Notes

- Never commit API keys to Git
- Use environment variables
- Restrict API keys by domain/IP
- Rotate keys regularly
- Monitor for unusual usage