# 🌐 Namecheap Domain Setup for Finding Sports

## Prerequisites
- Domain registered on Namecheap (e.g., findingsports.com)
- Railway app deployed and running
- Access to Namecheap account

## Step 1: Get Railway Domain Info

### In Railway Dashboard:
1. Go to your Railway project
2. Click on your service (finding-sports)
3. Go to **Settings** → **Domains**
4. Click **"Generate Domain"** to get a temporary Railway domain
5. Click **"+ Custom Domain"**
6. Enter your domain: `findingsports.com`
7. Railway will show you the DNS records needed

### Railway will provide:
- **CNAME Record** for `www` subdomain
- **A Records** for root domain (usually 2 IP addresses)

Example:
```
Type: A
Name: @
Value: 35.247.123.456

Type: A  
Name: @
Value: 35.247.124.567

Type: CNAME
Name: www
Value: finding-sports-production.up.railway.app
```

## Step 2: Configure Namecheap DNS

### Login to Namecheap:
1. Go to https://www.namecheap.com
2. Sign in to your account
3. Go to **Domain List**
4. Click **Manage** next to your domain

### Set up DNS Records:

1. **Go to Advanced DNS tab**

2. **Remove existing records** (if any):
   - Delete any existing A, CNAME records for @ and www
   - Keep MX records if you're using email

3. **Add Railway Records**:

   **For Root Domain (findingsports.com):**
   ```
   Type: A Record
   Host: @
   Value: [Railway IP 1]
   TTL: Automatic
   ```
   
   ```
   Type: A Record
   Host: @
   Value: [Railway IP 2]
   TTL: Automatic
   ```

   **For WWW Subdomain:**
   ```
   Type: CNAME Record
   Host: www
   Value: [your-app].up.railway.app
   TTL: Automatic
   ```

4. **Add Redirect** (optional but recommended):
   ```
   Type: URL Redirect Record
   Host: @
   Value: https://www.findingsports.com
   Redirect Type: Permanent (301)
   ```

## Step 3: SSL/HTTPS Setup

Railway automatically provides SSL certificates for custom domains. No additional configuration needed!

## Step 4: Advanced Setup (Recommended)

### Add these additional records:

1. **API Subdomain** (for backend):
   ```
   Type: CNAME
   Host: api
   Value: [your-backend].up.railway.app
   TTL: Automatic
   ```

2. **App Subdomain** (for web app):
   ```
   Type: CNAME
   Host: app
   Value: [your-frontend].up.railway.app
   TTL: Automatic
   ```

3. **CDN Subdomain** (for assets):
   ```
   Type: CNAME
   Host: cdn
   Value: [your-cdn].railway.app
   TTL: Automatic
   ```

## Step 5: Email Configuration (Optional)

If you want email@findingsports.com:

### Option A: Use Namecheap Email Hosting
1. Keep Namecheap's default MX records
2. Set up email forwarding in Namecheap

### Option B: Use Google Workspace
1. Add Google's MX records:
   ```
   MX 1  ASPMX.L.GOOGLE.COM         Priority: 1
   MX 2  ALT1.ASPMX.L.GOOGLE.COM    Priority: 5
   MX 3  ALT2.ASPMX.L.GOOGLE.COM    Priority: 5
   MX 4  ALT3.ASPMX.L.GOOGLE.COM    Priority: 10
   MX 5  ALT4.ASPMX.L.GOOGLE.COM    Priority: 10
   ```

### Option C: Use Email Forwarding
1. Go to **Domain** → **Manage** → **Email Forwarding**
2. Add forwarding rules:
   - info@findingsports.com → your@email.com
   - support@findingsports.com → your@email.com

## Step 6: Verify Domain Setup

### DNS Propagation Check:
1. Visit https://dnschecker.org
2. Enter `findingsports.com`
3. Check that A records point to Railway IPs
4. Check that www CNAME points to Railway

### Test Your Domain:
```bash
# Check DNS records
dig findingsports.com
dig www.findingsports.com

# Test HTTPS
curl -I https://findingsports.com
curl -I https://www.findingsports.com
```

## Step 7: Update Your App Configuration

### Update environment variables in Railway:
```env
APP_URL=https://findingsports.com
API_URL=https://api.findingsports.com
ALLOWED_ORIGINS=https://findingsports.com,https://www.findingsports.com
```

### Update Google OAuth:
1. Go to Google Cloud Console
2. Update authorized redirect URIs:
   - `https://findingsports.com/auth/google/callback`
   - `https://www.findingsports.com/auth/google/callback`

## Troubleshooting

### Domain not working after setup:
- **Wait 24-48 hours** - DNS propagation takes time
- **Check TTL** - Lower TTL speeds up propagation
- **Clear DNS cache**:
  ```bash
  # Mac
  sudo dscacheutil -flushcache
  
  # Windows
  ipconfig /flushdns
  
  # Linux
  sudo systemd-resolve --flush-caches
  ```

### SSL Certificate Issues:
- Railway auto-generates SSL certs
- If not working, remove and re-add domain in Railway
- Ensure DNS is properly configured first

### Common Namecheap Settings:
- **DNSSEC**: Usually leave disabled
- **Premium DNS**: Not required for basic setup
- **Domain Lock**: Keep enabled for security

## Complete DNS Record Example

Your Namecheap DNS should look like this:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | 35.247.xxx.xxx | Automatic |
| A | @ | 35.247.yyy.yyy | Automatic |
| CNAME | www | finding-sports.up.railway.app | Automatic |
| CNAME | api | finding-sports-api.up.railway.app | Automatic |
| CNAME | app | finding-sports.up.railway.app | Automatic |

## Final Steps

1. ✅ Wait for DNS propagation (15 mins - 48 hours)
2. ✅ Test all subdomains
3. ✅ Update all app configurations
4. ✅ Set up monitoring for domain
5. ✅ Configure domain renewal reminders

Your Finding Sports domain is now configured! 🎉

## Support Resources
- Namecheap Support: https://www.namecheap.com/support/
- Railway Docs: https://docs.railway.app/guides/public-networking#custom-domains
- DNS Checker: https://dnschecker.org