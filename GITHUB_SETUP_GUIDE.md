# 🚀 GitHub Setup Guide for Finding Sports

## 📋 Prerequisites
- GitHub account (create at https://github.com)
- Git installed on your system

## 🔧 Step-by-Step Setup

### 1. Initialize Git Repository
```bash
cd /home/terry/Desktop/finding-sports
git init
```

### 2. Create .gitignore File
```bash
# Create comprehensive .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
target/
dist/
build/

# Environment files
.env
.env.local
.env.production
*.env

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Database
*.sqlite
*.sqlite3
*.db

# Compiled files
*.pyc
*.pyo
__pycache__/

# Rust
Cargo.lock
target/
**/*.rs.bk

# OS files
.DS_Store
Thumbs.db

# Backup files
*.backup
*.bak

# Sensitive data
secrets/
*.pem
*.key
*.cert

# Local development
.local/
EOF
```

### 3. Add All Files to Git
```bash
# Add all files
git add .

# Check what will be committed
git status

# Commit with meaningful message
git commit -m "Initial commit: Finding Sports - Full deployment-ready application with authentication, monetization, and deployment scripts"
```

### 4. Create GitHub Repository

#### Option A: Using GitHub CLI (Recommended)
```bash
# Install GitHub CLI if not installed
# On macOS: brew install gh
# On Ubuntu: sudo apt install gh

# Login to GitHub
gh auth login

# Create repository and push
gh repo create finding-sports --public --source=. --remote=origin --push
```

#### Option B: Using Web Interface
1. Go to https://github.com/new
2. Repository name: `finding-sports`
3. Description: "Find and join local drop-in sports games - Basketball, Soccer, Volleyball and more!"
4. Choose: Public
5. Don't initialize with README (we already have one)
6. Click "Create repository"

### 5. Connect Local Repo to GitHub
```bash
# If you used Option B, add the remote
git remote add origin https://github.com/YOUR_USERNAME/finding-sports.git

# Verify remote
git remote -v

# Push to GitHub
git push -u origin main
```

### 6. If 'main' branch doesn't exist
```bash
# Check current branch
git branch

# If on 'master', rename to 'main'
git branch -M main

# Push
git push -u origin main
```

## 📁 Repository Structure to Push

```
finding-sports/
├── README.md                        # Main documentation
├── DEPLOYMENT_GUIDE.md             # Deployment instructions
├── DEPLOYMENT_MATRIX.md            # Platform comparisons
├── MONETIZATION_STRATEGY.md        # Revenue model
├── SECURITY_RECOMMENDATIONS.md     # Security guide
├── .gitignore                      # Git ignore file
├── docker-compose.yml              # Docker setup
├── deploy-railway.sh               # Railway deployment
├── deploy-fly.sh                   # Fly.io deployment
├── security-audit.sh               # Security check script
├── mockup/                         # Frontend application
│   ├── index.html
│   ├── login.html
│   ├── css/
│   ├── js/
│   └── images/
├── finding-sports-backend/         # Rust backend
│   ├── Cargo.toml
│   ├── src/
│   ├── migrations/
│   └── Dockerfile
└── scripts/                        # Deployment scripts
    └── full-send-deploy.sh
```

## 🏷️ Recommended GitHub Settings

### 1. Add Description and Topics
```bash
# Using GitHub CLI
gh repo edit --description "Find and join local drop-in sports games. Built with Rust, PostgreSQL, and modern web tech." --add-topic "sports,rust,postgresql,react,webapp"
```

### 2. Create Initial Release
```bash
# Tag the version
git tag -a v0.1.0 -m "Initial release - MVP with auth, basic features"
git push origin v0.1.0

# Create GitHub release
gh release create v0.1.0 --title "Finding Sports v0.1.0" --notes "Initial release with:
- User authentication
- Venue search
- Game discovery
- Basic social features
- Deployment scripts"
```

### 3. Add GitHub Actions for CI/CD
```bash
# Create workflow directory
mkdir -p .github/workflows

# Create CI workflow
cat > .github/workflows/ci.yml << 'EOF'
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgis/postgis:16-3.4
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Install Rust
      uses: actions-rs/toolchain@v1
      with:
        toolchain: stable
        
    - name: Run tests
      run: |
        cd finding-sports-backend
        cargo test
        
    - name: Run security audit
      run: |
        chmod +x security-audit.sh
        ./security-audit.sh
EOF

git add .github/
git commit -m "Add GitHub Actions CI workflow"
git push
```

## 🚀 Quick Push Commands

```bash
# One-liner to push everything
git add . && git commit -m "Update: Add new features" && git push

# Push with tags
git push --tags

# Force push (careful!)
git push -f origin main
```

## 📝 Good Commit Messages

```bash
# Features
git commit -m "feat: Add user authentication with JWT"
git commit -m "feat: Implement venue search with PostGIS"

# Fixes
git commit -m "fix: Correct timezone handling in game schedules"
git commit -m "fix: Resolve CORS issues in production"

# Documentation
git commit -m "docs: Add deployment guide for Railway"
git commit -m "docs: Update API documentation"

# Performance
git commit -m "perf: Optimize database queries for venue search"
git commit -m "perf: Add Redis caching layer"
```

## 🔐 Sensitive Information

### NEVER commit these files:
- `.env` files with real credentials
- Private keys or certificates
- Database dumps with user data
- API keys or secrets

### Instead, create example files:
```bash
cp .env .env.example
# Edit .env.example to remove sensitive values
git add .env.example
```

## 🌟 Making Your Repo Shine

### 1. Add Badges to README
```markdown
![Build Status](https://github.com/YOUR_USERNAME/finding-sports/workflows/CI/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)
```

### 2. Add Screenshots
```bash
# Create screenshots directory
mkdir -p docs/screenshots
# Add screenshots of your app
# Reference in README
```

### 3. Create Issues for TODO items
```bash
gh issue create --title "Implement real-time chat" --body "Add WebSocket-based chat for game coordination"
gh issue create --title "Add payment processing" --body "Integrate Stripe for premium subscriptions"
```

## 🎯 Complete Push Workflow

```bash
#!/bin/bash
# push-to-github.sh

# 1. Initialize and configure
git init
git config user.name "Your Name"
git config user.email "your.email@example.com"

# 2. Add files
git add .
git status

# 3. Commit
git commit -m "Initial commit: Finding Sports - Complete application"

# 4. Create and push to GitHub
gh repo create finding-sports --public --push

# 5. Open in browser
gh repo view --web

echo "✅ Successfully pushed to GitHub!"
echo "🔗 View at: https://github.com/$(gh api user -q .login)/finding-sports"
```

## 🆘 Troubleshooting

### Permission Denied
```bash
# Use SSH instead of HTTPS
git remote set-url origin git@github.com:YOUR_USERNAME/finding-sports.git

# Or use personal access token
git remote set-url origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/finding-sports.git
```

### Large Files Error
```bash
# Remove large files from history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/large/file" \
  --prune-empty --tag-name-filter cat -- --all
```

### Wrong Branch Name
```bash
# Rename branch
git branch -M main
git push -u origin main
```

Your Finding Sports project is now ready to be shared with the world on GitHub! 🚀