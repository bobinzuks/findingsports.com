# How to Login to Railway CLI

## Step 1: Open Terminal
Press `Ctrl+Alt+T` or open Terminal from your applications menu

## Step 2: Run Login Command
Type this command and press Enter:
```bash
railway login
```

## Step 3: What Happens Next
- Your default web browser will automatically open
- You'll see a Railway authorization page
- Since you're already logged into Railway in your browser, you just need to click **"Authorize"**

## Step 4: Confirm Success
- Go back to your terminal
- You should see a message like "Logged in as [your-email]"

## Step 5: Deploy Your Project
Once logged in, run these commands:
```bash
cd /home/terry/Desktop/finding-sports
railway link
```
- Select your project from the list (findingsports-com)

Then deploy:
```bash
railway up
```

## Alternative: Copy-Paste Commands
You can copy and run all these commands at once:
```bash
cd /home/terry/Desktop/finding-sports && \
railway login && \
echo "After browser authorization, press Enter to continue..." && \
read && \
railway link && \
railway up
```

## Troubleshooting
- If browser doesn't open automatically, look in the terminal for a URL like `https://railway.app/cli-login?token=...` and open it manually
- Make sure you're using the same browser where you're logged into Railway
- If you see "Unauthorized", try `railway logout` first, then `railway login` again