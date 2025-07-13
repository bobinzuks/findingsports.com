# 🚨 IMMEDIATE FIX INSTRUCTIONS

Your deployment is failing because JWT_SECRET is not set. Here's the fastest fix:

## Option 1: Quick Browser Fix (30 seconds)

1. **Open this link in Firefox** (where you're logged into Railway):
   https://railway.app/project/findingsports-com/service/findingsports-com/variables

2. **Click "New Variable" and add:**
   ```
   Key: JWT_SECRET
   Value: my-secret-key-2024-finding-sports
   ```

3. **Railway will automatically redeploy**

4. **Check deployment logs** for "Server running on port 8080"

## Option 2: Use Browser Console (1 minute)

1. **Go to your Railway Variables page** in Firefox

2. **Press F12** to open console

3. **Copy and paste this code:**

```javascript
// Quick fix - adds JWT_SECRET
const addVar = async (key, value) => {
    console.log(`Adding ${key}...`);
    
    // Click New Variable button
    const btn = Array.from(document.querySelectorAll('button'))
        .find(b => b.textContent.includes('New Variable') || b.textContent.includes('Add'));
    if (btn) btn.click();
    
    await new Promise(r => setTimeout(r, 1000));
    
    // Fill inputs
    const inputs = document.querySelectorAll('input[type="text"]');
    if (inputs.length >= 2) {
        inputs[inputs.length - 2].value = key;
        inputs[inputs.length - 1].value = value;
        
        // Trigger events
        inputs[inputs.length - 2].dispatchEvent(new Event('input', { bubbles: true }));
        inputs[inputs.length - 1].dispatchEvent(new Event('input', { bubbles: true }));
        
        // Press Enter
        inputs[inputs.length - 1].dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' }));
    }
};

// Add the critical variable
addVar('JWT_SECRET', 'my-secret-key-2024-finding-sports-' + Date.now());
```

4. **Press Enter** to run it

## Option 3: Railway CLI (if you can open a terminal)

```bash
# Login first
railway login

# Link to your project (select findingsports-com)
railway link

# Set the variable
railway variables set JWT_SECRET="my-secret-key-2024"

# Deploy
railway up
```

## 🔍 How to Verify It's Working:

1. Go to Deployments tab
2. Latest deployment should show "Deployment successful"
3. In logs, look for "✅ Server running on port 8080"
4. Test: https://findingsports.com/health

## ⚠️ Why This Is Happening:

Your server code checks for JWT_SECRET and exits if not found:
```javascript
if (!process.env.JWT_SECRET) {
    console.error('CRITICAL: JWT_SECRET not set!');
    process.exit(1);  // This kills the server!
}
```

That's why you see the restart loop - Railway keeps trying to start the server, but it immediately exits.

## 🎯 Just Add JWT_SECRET and Everything Will Work!