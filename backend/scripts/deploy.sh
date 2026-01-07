#!/bin/bash

# Nexa Backend Deployment Script
# This script handles the deployment of the Nexa backend to various environments

set -e # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENV=${ENVIRONMENT:-"production"}
APP_NAME="nexa-backend"
DOCKER_REGISTRY=${DOCKER_REGISTRY:-"ghcr.io"}
DOCKER_IMAGE="${DOCKER_REGISTRY}/${DOCKER_USERNAME:-yourusername}/${APP_NAME}:${ENV}-${VERSION:-latest}"
K8S_NAMESPACE="nexa-${ENV}"
HELM_CHART="./k8s/charts/nexa"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker login
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running or not logged in"
        exit 1
    fi
    
    # Check Node.js for building
    if ! command -v node &> /dev/null; then
        log_warning "Node.js is not installed, Docker build only"
    fi
    
    log_success "Prerequisites check passed"
}

# Build the application
build() {
    log_info "Building ${APP_NAME} for ${ENV} environment..."
    
    # Install dependencies if node exists
    if command -v npm &> /dev/null; then
        log_info "Installing dependencies..."
        npm ci --only=production
    fi
    
    # Run tests if in development/staging
    if [[ "$ENV" != "production" ]]; then
        log_info "Running tests..."
        npm test -- --passWithNoTests
    fi
    
    # Build TypeScript
    log_info "Building TypeScript..."
    npm run build
    
    # Create .env file for environment
    log_info "Creating environment configuration..."
    if [[ -f ".env.${ENV}" ]]; then
        cp ".env.${ENV}" ".env"
    elif [[ -f ".env.example" ]]; then
        cp ".env.example" ".env"
        log_warning "Using example environment file. Please check configuration."
    fi
    
    log_success "Build completed"
}

# Build Docker image
build_docker() {
    log_info "Building Docker image: ${DOCKER_IMAGE}"
    
    # Build the image
    docker build \
        --build-arg NODE_ENV=${ENV} \
        --build-arg APP_VERSION=${VERSION:-$(git rev-parse --short HEAD)} \
        -t ${DOCKER_IMAGE} \
        .
    
    log_success "Docker image built: ${DOCKER_IMAGE}"
}

# Run security scans
security_scan() {
    log_info "Running security scans..."
    
    # Check for trivy (vulnerability scanner)
    if command -v trivy &> /dev/null; then
        log_info "Running Trivy vulnerability scan..."
        trivy image --exit-code 1 --severity HIGH,CRITICAL ${DOCKER_IMAGE}
    else
        log_warning "Trivy not installed, skipping vulnerability scan"
    fi
    
    # Check for hadolint (Dockerfile linter)
    if command -v hadolint &> /dev/null; then
        log_info "Running Hadolint Dockerfile lint..."
        hadolint Dockerfile
    fi
    
    log_success "Security scans completed"
}

# Push Docker image
push_docker() {
    log_info "Pushing Docker image to registry..."
    
    # Tag for latest if specified
    if [[ "$TAG_LATEST" == "true" ]]; then
        LATEST_IMAGE="${DOCKER_IMAGE%-*}:latest"
        docker tag ${DOCKER_IMAGE} ${LATEST_IMAGE}
        docker push ${LATEST_IMAGE}
        log_success "Pushed latest tag: ${LATEST_IMAGE}"
    fi
    
    # Push the main image
    docker push ${DOCKER_IMAGE}
    
    log_success "Docker image pushed: ${DOCKER_IMAGE}"
}

# Deploy to Kubernetes
deploy_k8s() {
    log_info "Deploying to Kubernetes namespace: ${K8S_NAMESPACE}"
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi
    
    # Check if namespace exists
    if ! kubectl get namespace ${K8S_NAMESPACE} &> /dev/null; then
        log_info "Creating namespace: ${K8S_NAMESPACE}"
        kubectl create namespace ${K8S_NAMESPACE}
    fi
    
    # Check Helm
    if command -v helm &> /dev/null && [[ -f "${HELM_CHART}/Chart.yaml" ]]; then
        deploy_helm
    else
        deploy_manifests
    fi
    
    log_success "Kubernetes deployment completed"
}

deploy_helm() {
    log_info "Deploying with Helm..."
    
    # Update Helm dependencies
    helm dependency update ${HELM_CHART}
    
    # Install/Upgrade the chart
    helm upgrade --install ${APP_NAME} ${HELM_CHART} \
        --namespace ${K8S_NAMESPACE} \
        --set image.repository=${DOCKER_IMAGE%:*} \
        --set image.tag=${DOCKER_IMAGE##*:} \
        --set environment=${ENV} \
        --values "${HELM_CHART}/values-${ENV}.yaml" \
        --atomic \
        --wait
    
    log_success "Helm deployment completed"
}

deploy_manifests() {
    log_info "Deploying with Kubernetes manifests..."
    
    # Apply namespace
    kubectl apply -f ./k8s/namespace.yaml
    
    # Apply config maps and secrets
    kubectl apply -f ./k8s/config/ -n ${K8S_NAMESPACE}
    
    # Apply deployments and services
    kubectl apply -f ./k8s/deployments/ -n ${K8S_NAMESPACE}
    kubectl apply -f ./k8s/services/ -n ${K8S_NAMESPACE}
    
    # Apply ingress if exists
    if [[ -f "./k8s/ingress.yaml" ]]; then
        kubectl apply -f ./k8s/ingress.yaml -n ${K8S_NAMESPACE}
    fi
    
    # Wait for rollout
    kubectl rollout status deployment/${APP_NAME} -n ${K8S_NAMESPACE} --timeout=300s
    
    log_success "Kubernetes manifests deployed"
}

# Deploy to Docker Swarm
deploy_swarm() {
    log_info "Deploying to Docker Swarm..."
    
    # Check if swarm is initialized
    if ! docker node ls &> /dev/null; then
        log_error "Docker Swarm is not initialized"
        exit 1
    fi
    
    # Deploy stack
    docker stack deploy -c docker-compose.${ENV}.yaml ${APP_NAME}-${ENV}
    
    log_success "Docker Swarm deployment completed"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    # Different approaches based on environment
    case ${ENV} in
        "development")
            npm run migrate:dev
            ;;
        "staging")
            npm run migrate:staging
            ;;
        "production")
            npm run migrate:prod
            ;;
        *)
            log_warning "No migration script for environment: ${ENV}"
            ;;
    esac
    
    log_success "Database migrations completed"
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    local retries=10
    local delay=10
    local service_url=""
    
    # Determine service URL based on deployment
    if [[ "$DEPLOYMENT_TYPE" == "k8s" ]]; then
        service_url=$(kubectl get svc ${APP_NAME} -n ${K8S_NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
        if [[ -z "$service_url" ]]; then
            service_url=$(kubectl get svc ${APP_NAME} -n ${K8S_NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
        fi
        service_url="http://${service_url}:3000/health"
    elif [[ "$DEPLOYMENT_TYPE" == "swarm" ]]; then
        service_url="http://localhost:3000/health"
    fi
    
    if [[ -n "$service_url" ]]; then
        for i in $(seq 1 $retries); do
            log_info "Health check attempt $i/$retries..."
            if curl -s -f "$service_url" | grep -q "healthy"; then
                log_success "Health check passed"
                return 0
            fi
            sleep $delay
        done
        
        log_error "Health check failed after $retries attempts"
        return 1
    else
        log_warning "Skipping health check, service URL not determined"
    fi
}

# Rollback deployment
rollback() {
    log_info "Rolling back deployment..."
    
    case ${DEPLOYMENT_TYPE} in
        "k8s")
            if command -v helm &> /dev/null; then
                helm rollback ${APP_NAME} --namespace ${K8S_NAMESPACE} 0
            else
                kubectl rollout undo deployment/${APP_NAME} -n ${K8S_NAMESPACE}
            fi
            ;;
        "swarm")
            docker service update --rollback ${APP_NAME}-${ENV}_${APP_NAME}
            ;;
        *)
            log_error "Unknown deployment type: ${DEPLOYMENT_TYPE}"
            exit 1
            ;;
    esac
    
    log_success "Rollback completed"
}

# Cleanup old images
cleanup() {
    log_info "Cleaning up old Docker images..."
    
    # Remove old images (keep last 5)
    docker images ${DOCKER_REGISTRY}/${DOCKER_USERNAME:-yourusername}/${APP_NAME} \
        --format "{{.Tag}}\t{{.ID}}" \
        | sort -r \
        | tail -n +6 \
        | cut -f2 \
        | xargs -r docker rmi || true
    
    # Clean up dangling images
    docker image prune -f
    
    log_success "Cleanup completed"
}

# Backup deployment configuration
backup_config() {
    log_info "Backing up deployment configuration..."
    
    local backup_dir="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p ${backup_dir}
    
    # Backup environment files
    cp .env* ${backup_dir}/ 2>/dev/null || true
    
    # Backup Kubernetes manifests
    if [[ -d "./k8s" ]]; then
        cp -r ./k8s ${backup_dir}/
    fi
    
    # Backup Docker Compose files
    cp docker-compose*.yaml ${backup_dir}/ 2>/dev/null || true
    
    # Create archive
    tar -czf "${backup_dir}.tar.gz" -C ./backups $(basename ${backup_dir})
    
    log_success "Configuration backed up to: ${backup_dir}.tar.gz"
}

# Main deployment function
deploy() {
    log_info "Starting deployment for ${ENV} environment"
    
    # Backup current configuration
    backup_config
    
    # Check prerequisites
    check_prerequisites
    
    # Build
    build
    
    # Build Docker image
    build_docker
    
    # Security scan
    if [[ "$SKIP_SECURITY_SCAN" != "true" ]]; then
        security_scan
    fi
    
    # Push Docker image
    push_docker
    
    # Run migrations
    if [[ "$SKIP_MIGRATIONS" != "true" ]]; then
        run_migrations
    fi
    
    # Deploy based on type
    case ${DEPLOYMENT_TYPE} in
        "k8s")
            deploy_k8s
            ;;
        "swarm")
            deploy_swarm
            ;;
        "compose")
            log_info "Deploying with Docker Compose..."
            docker-compose -f docker-compose.${ENV}.yaml up -d
            ;;
        *)
            log_warning "No deployment type specified, skipping deployment"
            ;;
    esac
    
    # Health check
    if [[ "$SKIP_HEALTH_CHECK" != "true" ]]; then
        health_check
    fi
    
    # Cleanup
    cleanup
    
    log_success "Deployment completed successfully!"
}

# Show usage
usage() {
    echo "Nexa Backend Deployment Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -e, --env ENV          Deployment environment (development, staging, production)"
    echo "  -t, --type TYPE        Deployment type (k8s, swarm, compose)"
    echo "  -v, --version VERSION  Version tag for Docker image"
    echo "  --skip-migrations      Skip database migrations"
    echo "  --skip-security        Skip security scans"
    echo "  --skip-health-check    Skip health check"
    echo "  --tag-latest           Also tag as latest"
    echo "  --rollback             Rollback to previous version"
    echo "  --cleanup              Cleanup old images only"
    echo "  --help                 Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  DOCKER_REGISTRY        Docker registry URL (default: ghcr.io)"
    echo "  DOCKER_USERNAME        Docker registry username"
    echo ""
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--env)
                ENV="$2"
                shift 2
                ;;
            -t|--type)
                DEPLOYMENT_TYPE="$2"
                shift 2
                ;;
            -v|--version)
                VERSION="$2"
                shift 2
                ;;
            --skip-migrations)
                SKIP_MIGRATIONS="true"
                shift
                ;;
            --skip-security)
                SKIP_SECURITY_SCAN="true"
                shift
                ;;
            --skip-health-check)
                SKIP_HEALTH_CHECK="true"
                shift
                ;;
            --tag-latest)
                TAG_LATEST="true"
                shift
                ;;
            --rollback)
                ROLLBACK="true"
                shift
                ;;
            --cleanup)
                CLEANUP_ONLY="true"
                shift
                ;;
            --help)
                usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done
}

# Main script execution
main() {
    parse_args "$@"
    
    # Set default deployment type based on environment
    if [[ -z "$DEPLOYMENT_TYPE" ]]; then
        case $ENV in
            "development")
                DEPLOYMENT_TYPE="compose"
                ;;
            "staging")
                DEPLOYMENT_TYPE="k8s"
                ;;
            "production")
                DEPLOYMENT_TYPE="k8s"
                ;;
            *)
                DEPLOYMENT_TYPE="compose"
                ;;
        esac
    fi
    
    # Execute based on options
    if [[ "$ROLLBACK" == "true" ]]; then
        rollback
    elif [[ "$CLEANUP_ONLY" == "true" ]]; then
        cleanup
    else
        deploy
    fi
}

# Run main function
main "$@"