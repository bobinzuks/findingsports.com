#!/bin/bash

# Swarm initialization script - Mesh topology with 5 agents
echo "🐝 Initializing ruv-swarm with mesh topology..."
echo "=================================="

# Check if ruv-swarm is installed
if ! command -v ruv-swarm &> /dev/null; then
    echo "📦 Installing ruv-swarm..."
    npm install -g ruv-swarm
fi

# Initialize swarm with mesh topology
echo "🔗 Creating mesh topology with 5 agents..."
ruv-swarm init mesh 5 --claude --force

# Configure swarm for Finding Sports project
echo "⚙️  Configuring swarm for Finding Sports..."

cat > .swarm-config.json << EOF
{
  "topology": "mesh",
  "agents": 5,
  "project": "finding-sports",
  "tasks": [
    {
      "id": "monitor-deployment",
      "description": "Monitor Railway deployment status",
      "agent": "monitor"
    },
    {
      "id": "fix-apis",
      "description": "Ensure all APIs are working",
      "agent": "backend"
    },
    {
      "id": "test-endpoints",
      "description": "Test all live endpoints",
      "agent": "tester"
    },
    {
      "id": "optimize-performance",
      "description": "Optimize deployment performance",
      "agent": "optimizer"
    },
    {
      "id": "document-fixes",
      "description": "Document all fixes and changes",
      "agent": "documenter"
    }
  ]
}
EOF

echo "✅ Swarm configuration created"

# Start swarm agents
echo "🚀 Starting swarm agents..."
ruv-swarm start

# Show status
echo "📊 Swarm status:"
ruv-swarm status

echo ""
echo "🎯 Next steps:"
echo "1. Run 'ruv-swarm assign monitor-deployment' to start monitoring"
echo "2. Run 'ruv-swarm status' to check agent status"
echo "3. Run 'ruv-swarm logs' to see agent activity"