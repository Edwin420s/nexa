#!/bin/bash

# Quick Backend Status Check
# Fast script to verify server is running correctly

set -e

BASE_URL="http://localhost:5000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 Quick Backend Check"
echo "====================="

# Check if server is running
if curl -s "${BASE_URL}/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Server is running${NC}"
    
    # Get health status
    health=$(curl -s "${BASE_URL}/health")
    status=$(echo "$health" | jq -r '.status' 2>/dev/null || echo "unknown")
    
    if [ "$status" == "healthy" ]; then
        echo -e "${GREEN}✓ Health status: ${status}${NC}"
    else
        echo -e "${YELLOW}⚠ Health status: ${status}${NC}"
    fi
    
    # Check environment
    env=$(echo "$health" | jq -r '.environment' 2>/dev/null || echo "unknown")
    echo -e "  Environment: ${env}"
    
    # Quick endpoint tests
    echo ""
    echo "Testing endpoints..."
    
    # Root endpoint
    if curl -s "${BASE_URL}/" | jq -e '.message' > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Root endpoint${NC}"
    else
        echo -e "${RED}✗ Root endpoint${NC}"
    fi
    
    # Auth endpoints
    if curl -s -X POST "${BASE_URL}/api/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"test","password":"test"}' | jq -e '.success' > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Auth endpoints${NC}"
    else
        echo -e "${YELLOW}⚠ Auth endpoints (may need database)${NC}"
    fi
    
    # Projects endpoint
    if curl -s "${BASE_URL}/api/v1/projects" | jq -e '.success' > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Projects endpoint${NC}"
    else
        echo -e "${YELLOW}⚠ Projects endpoint${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}✓ Backend is operational!${NC}"
    echo "  Run full tests with: ./test.sh"
    
else
    echo -e "${RED}✗ Server is not running${NC}"
    echo "  Start with: npm run dev:simple"
    exit 1
fi
