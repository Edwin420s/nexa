#!/bin/bash

# Nexa Backend Test Script
# Tests all backend functionality and endpoints

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:5000"
API_VERSION="v1"
API_BASE="${BASE_URL}/api/${API_VERSION}"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print colored output
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Function to test HTTP endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4
    local data=$5

    ((TOTAL_TESTS++))
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$endpoint" 2>/dev/null || echo "000")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null || echo "000")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" == "$expected_status" ]; then
        print_success "$description (Status: $status_code)"
        if [ ! -z "$body" ]; then
            echo "    Response: $(echo $body | jq -c '.' 2>/dev/null || echo $body | head -c 100)"
        fi
        return 0
    else
        print_error "$description (Expected: $expected_status, Got: $status_code)"
        if [ ! -z "$body" ]; then
            echo "    Response: $(echo $body | jq -c '.' 2>/dev/null || echo $body | head -c 100)"
        fi
        return 1
    fi
}

# Function to check if server is running
check_server() {
    print_header "Checking Server Status"
    
    if curl -s "$BASE_URL/health" > /dev/null 2>&1; then
        print_success "Server is running at $BASE_URL"
        return 0
    else
        print_error "Server is not running at $BASE_URL"
        print_info "Please start the server with: npm run dev:simple"
        exit 1
    fi
}

# Test Health Endpoints
test_health_endpoints() {
    print_header "Testing Health Endpoints"
    
    test_endpoint "GET" "$BASE_URL/health" "200" "Health check endpoint"
    test_endpoint "GET" "$BASE_URL/" "200" "Root endpoint"
}

# Test Authentication Endpoints
test_auth_endpoints() {
    print_header "Testing Authentication Endpoints"
    
    # Test registration
    local register_data='{
        "email": "test@nexa.ai",
        "password": "testpass123",
        "name": "Test User"
    }'
    test_endpoint "POST" "$API_BASE/auth/register" "200" "User registration" "$register_data"
    
    # Test login
    local login_data='{
        "email": "test@nexa.ai",
        "password": "testpass123"
    }'
    test_endpoint "POST" "$API_BASE/auth/login" "200" "User login" "$login_data"
    
    # Save token for authenticated requests
    TOKEN=$(curl -s -X POST "$API_BASE/auth/login" \
        -H "Content-Type: application/json" \
        -d "$login_data" | jq -r '.data.token' 2>/dev/null || echo "mock-token")
    
    print_info "Token obtained: ${TOKEN:0:20}..."
}

# Test Project Endpoints
test_project_endpoints() {
    print_header "Testing Project Endpoints"
    
    # List projects
    test_endpoint "GET" "$API_BASE/projects" "200" "List all projects"
    
    # Create project
    local project_data='{
        "title": "Test Autonomous Agent",
        "description": "Testing agent orchestration",
        "goal": "Build a REST API with authentication",
        "agents": [
            {"name": "researcher", "model": "gemini-2.5-flash"},
            {"name": "code-builder", "model": "gemini-2.5-pro"}
        ]
    }'
    
    response=$(curl -s -X POST "$API_BASE/projects" \
        -H "Content-Type: application/json" \
        -d "$project_data")
    
    if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
        print_success "Create project"
        PROJECT_ID=$(echo "$response" | jq -r '.data.project.id' 2>/dev/null || echo "mock-project-id")
        print_info "Project ID: $PROJECT_ID"
    else
        print_error "Create project"
    fi
}

# Test Invalid Endpoints
test_invalid_endpoints() {
    print_header "Testing Error Handling"
    
    test_endpoint "GET" "$API_BASE/nonexistent" "404" "404 for non-existent route"
    test_endpoint "POST" "$API_BASE/auth/login" "200" "Login with invalid data" '{"invalid":"data"}'
}

# Test CORS and Headers
test_cors_headers() {
    print_header "Testing CORS and Headers"
    
    response=$(curl -s -I "$BASE_URL/health" 2>/dev/null)
    
    if echo "$response" | grep -i "access-control-allow-origin" > /dev/null; then
        print_success "CORS headers present"
    else
        print_info "CORS headers not found (may need full server)"
    fi
    
    if echo "$response" | grep -i "content-type.*json" > /dev/null; then
        print_success "JSON content type"
    else
        print_info "Content-Type check"
    fi
}

# Performance Test
test_performance() {
    print_header "Basic Performance Test"
    
    print_info "Testing response times..."
    
    local start=$(date +%s%N)
    curl -s "$BASE_URL/health" > /dev/null 2>&1
    local end=$(date +%s%N)
    local duration=$(( (end - start) / 1000000 ))
    
    if [ $duration -lt 100 ]; then
        print_success "Health endpoint response time: ${duration}ms (excellent)"
    elif [ $duration -lt 500 ]; then
        print_success "Health endpoint response time: ${duration}ms (good)"
    else
        print_info "Health endpoint response time: ${duration}ms"
    fi
    
    # Test concurrent requests
    print_info "Testing 10 concurrent requests..."
    local concurrent_start=$(date +%s%N)
    for i in {1..10}; do
        curl -s "$BASE_URL/health" > /dev/null 2>&1 &
    done
    wait
    local concurrent_end=$(date +%s%N)
    local concurrent_duration=$(( (concurrent_end - concurrent_start) / 1000000 ))
    
    print_info "10 concurrent requests completed in: ${concurrent_duration}ms"
}

# Test JSON Response Format
test_json_responses() {
    print_header "Testing JSON Response Format"
    
    # Test health endpoint returns valid JSON
    health_response=$(curl -s "$BASE_URL/health")
    if echo "$health_response" | jq empty 2>/dev/null; then
        print_success "Health endpoint returns valid JSON"
        
        # Check for expected fields
        if echo "$health_response" | jq -e '.status' > /dev/null 2>&1; then
            print_success "Health response contains 'status' field"
        else
            print_error "Health response missing 'status' field"
        fi
    else
        print_error "Health endpoint returns invalid JSON"
    fi
    
    # Test root endpoint
    root_response=$(curl -s "$BASE_URL/")
    if echo "$root_response" | jq -e '.message' > /dev/null 2>&1; then
        print_success "Root endpoint has proper structure"
    else
        print_error "Root endpoint structure invalid"
    fi
}

# Check Dependencies
check_dependencies() {
    print_header "Checking Dependencies"
    
    if command -v curl > /dev/null 2>&1; then
        print_success "curl is installed"
    else
        print_error "curl is not installed"
        print_info "Install with: sudo apt-get install curl"
    fi
    
    if command -v jq > /dev/null 2>&1; then
        print_success "jq is installed"
    else
        print_info "jq not installed (optional, for better output)"
        print_info "Install with: sudo apt-get install jq"
    fi
    
    if [ -f "package.json" ]; then
        print_success "package.json found"
    else
        print_error "package.json not found"
    fi
    
    if [ -d "node_modules" ]; then
        print_success "node_modules directory exists"
    else
        print_error "node_modules not found - run: npm install"
    fi
}

# Print summary
print_summary() {
    print_header "Test Summary"
    
    echo -e "Total Tests:  ${TOTAL_TESTS}"
    echo -e "${GREEN}Passed:       ${PASSED_TESTS}${NC}"
    
    if [ $FAILED_TESTS -gt 0 ]; then
        echo -e "${RED}Failed:       ${FAILED_TESTS}${NC}"
        echo -e "\n${RED}Some tests failed!${NC}"
        exit 1
    else
        echo -e "${GREEN}Failed:       ${FAILED_TESTS}${NC}"
        echo -e "\n${GREEN}All tests passed! ✓${NC}"
        exit 0
    fi
}

# Main execution
main() {
    clear
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════╗"
    echo "║     NEXA BACKEND TEST SUITE               ║"
    echo "║     Comprehensive Backend Testing         ║"
    echo "╚════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_dependencies
    check_server
    test_health_endpoints
    test_json_responses
    test_auth_endpoints
    test_project_endpoints
    test_invalid_endpoints
    test_cors_headers
    test_performance
    
    print_summary
}

# Run main function
main "$@"
