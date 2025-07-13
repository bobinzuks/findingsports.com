#!/bin/bash

# Railway Deployment Metrics Collector
# Tracks and reports deployment metrics and performance

echo "📊 Railway Deployment Metrics v1.0"
echo "=================================="
echo ""

# Configuration
METRICS_FILE="deployment-metrics.json"
LOG_FILE="deployment.log"
APP_URL="https://finding-sports-production.up.railway.app"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Initialize metrics file if not exists
init_metrics() {
    if [ ! -f "$METRICS_FILE" ]; then
        echo '{
  "deployments": [],
  "summary": {
    "total_deployments": 0,
    "successful_deployments": 0,
    "failed_deployments": 0,
    "average_deploy_time": 0,
    "last_deployment": null
  }
}' > "$METRICS_FILE"
    fi
}

# Function to measure response time
measure_response_time() {
    local endpoint=$1
    local response_time=$(curl -o /dev/null -s -w '%{time_total}' "$endpoint" 2>/dev/null)
    echo "$response_time"
}

# Function to collect current metrics
collect_metrics() {
    local deployment_id=$(date +%s)
    local start_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    echo -e "${BLUE}Collecting deployment metrics...${NC}"
    
    # Measure health endpoint
    local health_time=$(measure_response_time "$APP_URL/health")
    local health_status=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/health" 2>/dev/null)
    
    # Measure API endpoint
    local api_time=$(measure_response_time "$APP_URL/api/games")
    local api_status=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/games" 2>/dev/null)
    
    # Check if deployment is successful
    local status="failed"
    if [ "$health_status" == "200" ] && [ "$api_status" == "200" ]; then
        status="successful"
    fi
    
    # Create metrics entry
    local metrics_entry=$(cat <<EOF
{
  "deployment_id": "$deployment_id",
  "timestamp": "$start_time",
  "status": "$status",
  "health_check": {
    "status_code": $health_status,
    "response_time": $health_time
  },
  "api_check": {
    "status_code": $api_status,
    "response_time": $api_time
  },
  "git_commit": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
  "branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')"
}
EOF
)
    
    # Update metrics file
    local temp_file=$(mktemp)
    jq --argjson entry "$metrics_entry" '.deployments += [$entry]' "$METRICS_FILE" > "$temp_file"
    mv "$temp_file" "$METRICS_FILE"
    
    # Update summary
    update_summary
    
    echo -e "${GREEN}✅ Metrics collected successfully${NC}"
    
    # Display current metrics
    display_metrics
}

# Function to update summary statistics
update_summary() {
    local temp_file=$(mktemp)
    
    jq '
    .summary.total_deployments = (.deployments | length) |
    .summary.successful_deployments = ([.deployments[] | select(.status == "successful")] | length) |
    .summary.failed_deployments = ([.deployments[] | select(.status == "failed")] | length) |
    .summary.last_deployment = (.deployments | last) |
    .summary.average_deploy_time = if .deployments | length > 0 then
        ([.deployments[].health_check.response_time | tonumber] | add / length)
    else 0 end
    ' "$METRICS_FILE" > "$temp_file"
    
    mv "$temp_file" "$METRICS_FILE"
}

# Function to display metrics
display_metrics() {
    echo -e "\n${YELLOW}📊 Current Deployment Metrics:${NC}"
    echo "------------------------------"
    
    local summary=$(jq -r '.summary' "$METRICS_FILE")
    
    echo "$summary" | jq -r '
    "Total Deployments: \(.total_deployments)",
    "Successful: \(.successful_deployments)",
    "Failed: \(.failed_deployments)",
    "Success Rate: \(if .total_deployments > 0 then (.successful_deployments / .total_deployments * 100 | round) else 0 end)%",
    "Avg Response Time: \(.average_deploy_time | . * 1000 | round)ms"
    '
    
    if [ $(jq -r '.summary.last_deployment' "$METRICS_FILE") != "null" ]; then
        echo -e "\n${YELLOW}Last Deployment:${NC}"
        jq -r '.summary.last_deployment | 
        "- Timestamp: \(.timestamp)",
        "- Status: \(.status)",
        "- Health Response: \(.health_check.response_time | . * 1000 | round)ms (HTTP \(.health_check.status_code))",
        "- API Response: \(.api_check.response_time | . * 1000 | round)ms (HTTP \(.api_check.status_code))",
        "- Git Commit: \(.git_commit)"
        ' "$METRICS_FILE"
    fi
}

# Function to generate deployment report
generate_report() {
    local report_file="deployment-report-$(date +%Y%m%d-%H%M%S).html"
    
    echo -e "${BLUE}Generating deployment report...${NC}"
    
    cat > "$report_file" <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>Railway Deployment Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        .metric { margin: 10px 0; padding: 10px; background-color: #f8f9fa; border-radius: 4px; }
        .success { color: #28a745; }
        .failed { color: #dc3545; }
        .chart { margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Railway Deployment Report</h1>
        <p>Generated on: $(date)</p>
        
        <h2>Summary</h2>
        <div class="metric">
$(jq -r '.summary | 
"<p><strong>Total Deployments:</strong> \(.total_deployments)</p>
<p><strong>Successful:</strong> <span class=\"success\">\(.successful_deployments)</span></p>
<p><strong>Failed:</strong> <span class=\"failed\">\(.failed_deployments)</span></p>
<p><strong>Success Rate:</strong> \(if .total_deployments > 0 then (.successful_deployments / .total_deployments * 100 | round) else 0 end)%</p>
<p><strong>Average Response Time:</strong> \(.average_deploy_time | . * 1000 | round)ms</p>"
' "$METRICS_FILE")
        </div>
        
        <h2>Recent Deployments</h2>
        <table>
            <tr>
                <th>Timestamp</th>
                <th>Status</th>
                <th>Health Check</th>
                <th>API Check</th>
                <th>Commit</th>
            </tr>
$(jq -r '.deployments | reverse | .[0:10] | .[] | 
"<tr>
    <td>\(.timestamp)</td>
    <td class=\"\(.status)\">\(.status)</td>
    <td>\(.health_check.response_time | . * 1000 | round)ms (HTTP \(.health_check.status_code))</td>
    <td>\(.api_check.response_time | . * 1000 | round)ms (HTTP \(.api_check.status_code))</td>
    <td>\(.git_commit)</td>
</tr>"
' "$METRICS_FILE")
        </table>
    </div>
</body>
</html>
EOF
    
    echo -e "${GREEN}✅ Report generated: $report_file${NC}"
}

# Main execution
main() {
    init_metrics
    
    case "${1:-collect}" in
        "collect")
            collect_metrics
            ;;
        "display")
            display_metrics
            ;;
        "report")
            generate_report
            ;;
        "reset")
            echo "Resetting metrics..."
            rm -f "$METRICS_FILE"
            init_metrics
            echo -e "${GREEN}✅ Metrics reset${NC}"
            ;;
        *)
            echo "Usage: $0 [collect|display|report|reset]"
            echo ""
            echo "Commands:"
            echo "  collect  - Collect current deployment metrics (default)"
            echo "  display  - Display current metrics summary"
            echo "  report   - Generate HTML deployment report"
            echo "  reset    - Reset all metrics data"
            exit 1
            ;;
    esac
}

main "$@"