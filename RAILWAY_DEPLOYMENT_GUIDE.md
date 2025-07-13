# 🚀 Railway Deployment Guide for Finding Sports Backend

## 📌 Current Situation
- Your backend code is ready and tested locally
- Railway project exists but domain isn't properly connected
- findingsports.com is currently serving only static files
- You're logged into Railway in Firefox

## 🎯 Goal
Connect your Finding Sports backend on Railway to your domain so the API endpoints work properly.

---

## 📋 Step 1: Find Your Railway App URL

1. **Open Railway Dashboard**
   - In Firefox, go to [https://railway.app](https://railway.app)
   - You should see your projects dashboard

2. **Click on Your Project**
   - Look for a project related to "finding-sports" or similar
   - Click on the project card to open it

3. **Find Your Service**
   - Inside the project, you'll see one or more services
   - Click on your backend service (might be named "web", "server", or similar)

4. **Copy Your Railway URL**
   - In the service view, look for the **Deployments** tab
   - At the top, you'll see a URL like: `https://your-app-name.up.railway.app`
   - **Copy this URL** - you'll need it!

---

## 🔧 Step 2: Set Environment Variables in Railway

1. **Stay in Your Service View**
   - Make sure you're still viewing your backend service in Railway

2. **Click on "Variables" Tab**
   - You'll see this tab next to "Deployments", "Logs", etc.

3. **Add Required Environment Variables**
   Click "New Variable" or "Add Variable" and add these one by one:

   ```
   PORT = 8080
   NODE_ENV = production
   JWT_SECRET = [generate a secure random string - at least 32 characters]
   GOOGLE_CLIENT_ID = 386932037035-k8v833noqjk7m4t641js92fvjmm5ri71.apps.googleusercontent.com
   CORS_ORIGIN = https://findingsports.com,https://www.findingsports.com
   ```

   **To generate a secure JWT_SECRET:**
   - Use a password generator or
   - Run this in your terminal: `openssl rand -base64 32`

4. **Save All Variables**
   - Railway will automatically redeploy your app with the new variables

---

## 🌐 Step 3: Configure Your Domain (Two Options)

### Option A: Point Domain Directly to Railway (Recommended)

1. **In Railway, Configure Custom Domain**
   - In your service view, click on **"Settings"** tab
   - Scroll to **"Domains"** section
   - Click **"+ Custom Domain"**
   - Enter: `findingsports.com`
   - Railway will show you DNS records to add

2. **Update Your Domain's DNS**
   - Go to your domain registrar (where you bought findingsports.com)
   - Find DNS settings/management
   - Add the records Railway shows you (usually a CNAME or A record)
   - Example:
     ```
     Type: CNAME
     Name: @ (or blank for root domain)
     Value: your-app-name.up.railway.app
     ```

3. **Add www Subdomain (Optional)**
   - Back in Railway, add another custom domain: `www.findingsports.com`
   - Add corresponding DNS record

### Option B: Use a Reverse Proxy (If You Can't Change DNS)

If you have a web server already serving static files at findingsports.com:

1. **Configure Your Web Server** (Apache/Nginx)
   
   **For Nginx:**
   ```nginx
   location /api {
       proxy_pass https://your-app-name.up.railway.app;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```

   **For Apache:**
   ```apache
   ProxyPreserveHost On
   ProxyPass /api https://your-app-name.up.railway.app/api
   ProxyPassReverse /api https://your-app-name.up.railway.app/api
   ```

---

## ✅ Step 4: Verify Your Deployment

1. **Check Railway Logs**
   - In Railway service view, click **"Logs"** tab
   - Look for: `Finding Sports backend running on http://0.0.0.0:8080`
   - Check for any error messages

2. **Test Health Endpoint**
   - Open a new browser tab
   - Go to: `https://your-app-name.up.railway.app/health`
   - You should see: `{"status":"ok","timestamp":"..."}`

3. **Test API Endpoints**
   ```bash
   # Test games endpoint
   curl https://your-app-name.up.railway.app/api/games

   # Test with your domain (after DNS propagation)
   curl https://findingsports.com/api/games
   ```

4. **Test Frontend Integration**
   - Visit your frontend at `https://findingsports.com`
   - Try searching for games
   - Check browser console for any API errors

---

## 🚨 Troubleshooting Common Issues

### "502 Bad Gateway" or "Application Error"
- Check Railway logs for crash messages
- Verify all environment variables are set correctly
- Make sure `PORT` is set to `8080`

### "CORS Error" in Browser Console
- Update `CORS_ORIGIN` in Railway variables to include your domain
- Format: `https://findingsports.com,https://www.findingsports.com`

### "Cannot Connect to API"
- DNS changes can take 5-48 hours to propagate
- Use Railway URL directly while waiting for DNS
- Check if Railway app is running (green status)

### "JWT_SECRET not set" Error
- Make sure you added `JWT_SECRET` in Railway variables
- Redeploy after adding variables

---

## 🔄 Alternative: Update Frontend to Use Railway URL Directly

If DNS setup is taking too long, temporarily update your frontend:

1. **Find Your Frontend Config**
   Look for API URL configuration in your frontend code

2. **Update API URL**
   ```javascript
   // Change from:
   const API_URL = 'https://findingsports.com/api';
   
   // To:
   const API_URL = 'https://your-app-name.up.railway.app/api';
   ```

3. **Deploy Frontend Changes**
   This lets you use the backend immediately while DNS propagates

---

## 📱 Quick Checklist

- [ ] Found Railway app URL
- [ ] Set all environment variables in Railway
- [ ] Configured custom domain in Railway
- [ ] Updated DNS records at domain registrar
- [ ] Tested health endpoint
- [ ] Verified API endpoints work
- [ ] Frontend can connect to backend

---

## 🆘 Need More Help?

1. **Railway Documentation**: https://docs.railway.app/deploy/custom-domains
2. **Check Railway Status**: https://railway.app/status
3. **Railway Discord**: https://discord.gg/railway

Remember: DNS changes take time! Your Railway URL works immediately, but custom domain may take a few hours.