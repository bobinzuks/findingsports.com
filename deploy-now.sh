#!/bin/bash

echo "🚂 DEPLOYING TO RAILWAY"
echo "===================="

# Navigate to project directory
cd /home/terry/Desktop/finding-sports

# Link and deploy
echo "Linking to your Railway project..."
railway link

echo -e "\n📦 Deploying your project..."
railway up

echo -e "\n✅ Deployment initiated!"
echo "Check status at: https://railway.app/dashboard"