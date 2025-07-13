# 🚀 Quick Deployment Steps - Finding Sports Backend

## 📍 You Are Here
You're logged into Railway in Firefox and need to connect your backend to findingsports.com

## ⚡ Fastest Path to Success (10 minutes)

### 1️⃣ Get Your Railway URL (2 min)
1. Go to Railway dashboard in Firefox
2. Click your project → Click your service
3. Copy the URL shown (like `https://finding-sports-xyz.up.railway.app`)

### 2️⃣ Set Environment Variables (3 min)
In Railway service, click **Variables** tab and add:
```
PORT = 8080
NODE_ENV = production
JWT_SECRET = ChangeThisToARandomString32CharsLong
GOOGLE_CLIENT_ID = 386932037035-k8v833noqjk7m4t641js92fvjmm5ri71.apps.googleusercontent.com
CORS_ORIGIN = https://findingsports.com,https://www.findingsports.com,https://finding-sports-xyz.up.railway.app
```

### 3️⃣ Quick Test (2 min)
Open new tab and visit:
- `https://your-railway-url.up.railway.app/health`
- Should show: `{"status":"ok","timestamp":"..."}`

### 4️⃣ Temporary Frontend Fix (3 min)
While waiting for DNS, update your frontend to use Railway URL directly:

1. Find where your frontend calls the API
2. Change the API URL to your Railway URL
3. Redeploy frontend

---

## 🎯 For Permanent Domain Setup

### Add Custom Domain in Railway
1. In Railway: **Settings** → **Domains** → **+ Custom Domain**
2. Add `findingsports.com`
3. Railway shows DNS records to add

### Update Your DNS
Go to your domain provider and add:
```
Type: CNAME
Name: @ (or empty)
Value: your-railway-url.up.railway.app
```

**Note:** DNS can take 5-48 hours to work!

---

## ✅ Success Indicators
- [ ] `/health` endpoint returns OK
- [ ] `/api/games` returns game data (even if empty array)
- [ ] No CORS errors in browser console
- [ ] Frontend can search for games

## 🚨 If Something's Wrong
Check Railway **Logs** tab for errors - they'll tell you exactly what's wrong!