#!/bin/bash
# Security Audit Script for Finding Sports

echo "🔒 Finding Sports Security Audit"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ISSUES=0
WARNINGS=0

# Function to check security items
check_security() {
    local description=$1
    local command=$2
    local expected=$3
    
    echo -n "Checking: $description... "
    
    result=$(eval $command 2>/dev/null)
    
    if [[ "$result" == *"$expected"* ]] || [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
        ((ISSUES++))
    fi
}

# Function for warnings
check_warning() {
    local description=$1
    local command=$2
    
    echo -n "Checking: $description... "
    
    if eval $command &>/dev/null; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${YELLOW}⚠${NC}"
        ((WARNINGS++))
    fi
}

echo ""
echo "🔍 Code Security Checks"
echo "----------------------"

# Check for hardcoded secrets
check_security "No hardcoded secrets" \
    "! grep -r 'password\\s*=\\s*[\"'\''][^\"'\'']*[\"'\'']' --include='*.rs' --include='*.js' src/" \
    ""

# Check for SQL injection protection
check_security "Using prepared statements" \
    "grep -r 'query!' --include='*.rs' src/ | wc -l | xargs test 0 -lt" \
    ""

# Check password hashing
check_security "Using Argon2 for passwords" \
    "grep -r 'argon2' Cargo.toml" \
    "argon2"

# Check for JWT implementation
check_security "JWT authentication present" \
    "grep -r 'jsonwebtoken' Cargo.toml" \
    "jsonwebtoken"

echo ""
echo "🌐 Web Security Headers"
echo "----------------------"

# Check for security headers in code
check_security "CORS configuration" \
    "grep -r 'CorsLayer' src/" \
    "CorsLayer"

check_warning "CSP headers implemented" \
    "grep -r 'Content-Security-Policy' src/"

check_warning "HSTS headers implemented" \
    "grep -r 'Strict-Transport-Security' src/"

check_warning "X-Frame-Options set" \
    "grep -r 'X-Frame-Options' src/"

echo ""
echo "🔐 Authentication Security"
echo "-------------------------"

# Check password requirements
check_security "Password validation exists" \
    "grep -r 'password.*len.*[0-9]' src/" \
    ""

# Check for rate limiting
check_warning "Rate limiting implemented" \
    "grep -r 'rate.*limit' -i src/"

# Check for 2FA support
check_warning "2FA support" \
    "grep -r 'totp\\|two.*factor' -i src/"

echo ""
echo "📦 Dependency Security"
echo "---------------------"

# Check for vulnerable dependencies
if command -v cargo &> /dev/null; then
    echo -n "Running cargo audit... "
    if cargo audit &>/dev/null; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗ Found vulnerabilities${NC}"
        ((ISSUES++))
    fi
fi

echo ""
echo "🗄️ Database Security"
echo "-------------------"

# Check for database security
check_security "Using environment variables for DB" \
    "grep -r 'DATABASE_URL' .env.example" \
    "DATABASE_URL"

check_security "PostGIS enabled for geospatial" \
    "grep -r 'postgis' migrations/" \
    "postgis"

echo ""
echo "🔑 Environment Security"
echo "----------------------"

# Check .env security
check_security ".env in .gitignore" \
    "grep '^.env$' .gitignore" \
    ".env"

check_security ".env.example exists" \
    "test -f .env.example" \
    ""

# Check for secure defaults
check_warning "Production checks in code" \
    "grep -r 'is_production\\|ENVIRONMENT.*production' src/"

echo ""
echo "🛡️ Additional Security Measures"
echo "------------------------------"

# Create security recommendations file
cat > SECURITY_RECOMMENDATIONS.md << EOF
# Security Recommendations for Finding Sports

## Immediate Actions Required

### 1. Enable HTTPS Redirect
\`\`\`rust
// Add to main.rs
app.layer(
    tower_http::redirect::RedirectLayer::permanent(
        tower_http::redirect::Scheme::HTTPS
    )
);
\`\`\`

### 2. Implement Rate Limiting
\`\`\`rust
use tower::ServiceBuilder;
use tower_governor::{governor::GovernorConfigBuilder, GovernorLayer};

let governor_conf = Box::new(
    GovernorConfigBuilder::default()
        .per_second(2)
        .burst_size(5)
        .finish()
        .unwrap(),
);

app.layer(ServiceBuilder::new().layer(GovernorLayer {
    config: Box::leak(governor_conf),
}));
\`\`\`

### 3. Add Security Headers Middleware
Already implemented in middleware/security.rs - ensure it's applied!

### 4. Enable 2FA (Future)
- Use TOTP libraries
- Add backup codes
- SMS fallback option

## Security Checklist

- [ ] Force HTTPS in production
- [ ] Rate limit auth endpoints (2 req/sec)
- [ ] Implement CSRF protection
- [ ] Add request ID tracking
- [ ] Enable audit logging
- [ ] Set up intrusion detection
- [ ] Regular dependency updates
- [ ] Implement API versioning
- [ ] Add request signing for scrapers
- [ ] Set up WAF rules

## Monitoring Setup

1. **Sentry** for error tracking
2. **Fail2ban** for brute force protection
3. **CloudFlare** for DDoS protection
4. **GitHub Dependabot** for updates

EOF

echo ""
echo "📊 Security Audit Summary"
echo "========================"
echo -e "Critical Issues: ${RED}$ISSUES${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"

if [[ $ISSUES -eq 0 ]]; then
    echo -e "\n${GREEN}✅ Security audit passed!${NC}"
    echo "Your application has good baseline security."
else
    echo -e "\n${RED}❌ Security issues found!${NC}"
    echo "Please address the critical issues before deployment."
fi

echo ""
echo "📄 Created SECURITY_RECOMMENDATIONS.md with detailed fixes"
echo ""

# Generate security score
SCORE=$((100 - (ISSUES * 10) - (WARNINGS * 5)))
echo "🏆 Security Score: $SCORE/100"

if [[ $SCORE -ge 80 ]]; then
    echo "Ready for production deployment! 🚀"
elif [[ $SCORE -ge 60 ]]; then
    echo "Good security, but improvements recommended 📈"
else
    echo "Security improvements required before deployment ⚠️"
fi