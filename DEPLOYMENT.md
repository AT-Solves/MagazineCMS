# MagazineOS Deployment Guide

## Overview

This guide covers deployment strategies for MagazineOS across different environments: development, staging, and production.

## Table of Contents
1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Kubernetes Deployment](#kubernetes-deployment)
4. [AWS Deployment](#aws-deployment)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Monitoring & Logs](#monitoring--logs)
7. [Troubleshooting](#troubleshooting)

## Local Development

### Prerequisites
- Node.js 18+
- Docker Desktop
- PostgreSQL 16 (or Docker)
- Redis (or Docker)

### Quick Start
```bash
# 1. Clone repository
git clone https://github.com/yourorg/magazineos.git
cd magazineos

# 2. Setup environment
cp .env.example .env

# 3. Start with Docker Compose
docker-compose up

# 4. Access applications
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
# GraphQL: http://localhost:3000/graphql
```

### Manual Setup
```bash
# Backend
cd backend
npm install
npm run db:migrate
npm run start:dev

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

## Docker Deployment

### Building Images

**Backend**
```bash
cd backend
docker build -t magazineos-backend:latest .
docker tag magazineos-backend:latest \
  ghcr.io/yourorg/magazineos-backend:latest
```

**Frontend**
```bash
cd frontend
docker build -t magazineos-frontend:latest .
docker tag magazineos-frontend:latest \
  ghcr.io/yourorg/magazineos-frontend:latest
```

### Pushing to Registry
```bash
# Authenticate
docker login ghcr.io

# Push images
docker push ghcr.io/yourorg/magazineos-backend:latest
docker push ghcr.io/yourorg/magazineos-frontend:latest
```

### Running with Docker Compose
```bash
# Build and start all services
docker-compose up --build

# Background mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Remove volumes (careful!)
docker-compose down -v
```

## Kubernetes Deployment

### Prerequisites
- kubectl configured
- Kubernetes cluster (1.24+)
- cert-manager for TLS
- nginx-ingress controller

### Cluster Setup

1. **Create namespace**
```bash
kubectl create namespace magazineos
```

2. **Create secrets**
```bash
kubectl apply -f k8s/secrets.yaml
# Edit with real values
kubectl edit secret magazineos-secrets -n magazineos
```

3. **Create config**
```bash
kubectl apply -f k8s/config.yaml
```

4. **Deploy services**
```bash
# Deploy database, cache, and services
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Verify deployments
kubectl get deployments -n magazineos
kubectl get pods -n magazineos
```

### Verifying Deployment
```bash
# Check pod status
kubectl get pods -n magazineos

# View logs
kubectl logs -n magazineos \
  deployment/magazineos-backend

# Port forward for testing
kubectl port-forward -n magazineos \
  svc/magazineos-backend 3000:80

# Test API
curl http://localhost:3000/health
```

### Scaling
```bash
# Scale backend
kubectl scale deployment magazineos-backend \
  --replicas=5 -n magazineos

# Autoscaling
kubectl autoscale deployment magazineos-backend \
  --min=2 --max=10 -n magazineos
```

### Upgrading
```bash
# Update image
kubectl set image deployment/magazineos-backend \
  backend=ghcr.io/yourorg/magazineos-backend:v1.1.0 \
  -n magazineos

# Rollback
kubectl rollout undo deployment/magazineos-backend \
  -n magazineos
```

## AWS Deployment

### Architecture
```
┌─────────────────────────────────────────┐
│         CloudFront (CDN)                │
├─────────────────────────────────────────┤
│      Application Load Balancer          │
├──────────────────┬──────────────────────┤
│  ECS Fargate     │  ECS Fargate         │
│  Backend (3)     │  Frontend (2)        │
├──────────────────┼──────────────────────┤
│ RDS PostgreSQL   │ ElastiCache Redis    │
│ Multi-AZ         │                      │
├──────────────────┼──────────────────────┤
│         S3 (Media Storage)              │
└─────────────────────────────────────────┘
```

### Setup Steps

1. **Create ECR repositories**
```bash
aws ecr create-repository --repository-name magazineos-backend
aws ecr create-repository --repository-name magazineos-frontend

# Get login token
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com
```

2. **Create RDS database**
```bash
aws rds create-db-instance \
  --db-instance-identifier magazineos-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 16.0 \
  --master-username postgres \
  --allocated-storage 100 \
  --backup-retention-period 7 \
  --multi-az
```

3. **Create ElastiCache cluster**
```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id magazineos-cache \
  --cache-node-type cache.t3.small \
  --engine redis \
  --num-cache-nodes 1
```

4. **Create S3 bucket**
```bash
aws s3 mb s3://magazineos-media-us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket magazineos-media-us-east-1 \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket magazineos-media-us-east-1 \
  --server-side-encryption-configuration '{...}'
```

5. **Create ECS cluster**
```bash
aws ecs create-cluster --cluster-name magazineos

# Register task definition
aws ecs register-task-definition \
  --cli-input-json file://ecs-task-definition.json
```

6. **Create services**
```bash
# Backend service
aws ecs create-service \
  --cluster magazineos \
  --service-name magazineos-api \
  --task-definition magazineos-backend:1 \
  --desired-count 3 \
  --launch-type FARGATE \
  --network-configuration "..."

# Frontend service
aws ecs create-service \
  --cluster magazineos \
  --service-name magazineos-app \
  --task-definition magazineos-frontend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "..."
```

### Terraform Configuration
See `terraform/` directory for infrastructure-as-code.

```bash
# Initialize
terraform init

# Plan changes
terraform plan

# Apply changes
terraform apply

# Destroy (careful!)
terraform destroy
```

## CI/CD Pipeline

### GitHub Actions Workflow
Configured in `.github/workflows/ci-cd.yml`

**Pipeline Stages**:
1. **Lint & Format** - Code quality checks
2. **Unit Tests** - Isolated component testing
3. **Build** - Compile applications
4. **Security Scan** - Vulnerability detection
5. **Integration Tests** - API and workflow testing
6. **Docker Build** - Image creation and push
7. **Staging Deploy** - Deploy to staging
8. **Production Deploy** - Deploy to production

### Triggering Deployments

**Automatic Deployment**
```bash
# Deploy to staging
git push origin develop

# Deploy to production
git push origin main
```

**Manual Deployment**
```bash
# Via GitHub UI
# Actions → CI/CD Pipeline → Run workflow
```

### Deployment Environments

**Staging**
- Auto-deployed from `develop` branch
- URL: https://staging.magazineos.com
- Database: RDS staging
- Logs retained: 7 days

**Production**
- Auto-deployed from `main` branch
- URL: https://app.magazineos.com
- Database: RDS production (Multi-AZ)
- Logs retained: 30 days
- Blue-green deployment with rollback

## Monitoring & Logs

### CloudWatch Logs
```bash
# View logs
aws logs tail /ecs/magazineos-backend --follow

# Search logs
aws logs filter-log-events \
  --log-group-name /ecs/magazineos-backend \
  --filter-pattern "ERROR"
```

### Metrics & Alarms
```bash
# Create alarm
aws cloudwatch put-metric-alarm \
  --alarm-name magazineos-backend-cpu \
  --alarm-description "Backend CPU usage" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:...
```

### Application Monitoring

**Prometheus**
```bash
# Access Prometheus
kubectl port-forward -n magazineos \
  svc/prometheus 9090:9090
# Visit: http://localhost:9090
```

**Grafana**
```bash
# Access Grafana
kubectl port-forward -n magazineos \
  svc/grafana 3000:3000
# Visit: http://localhost:3000
# Default credentials: admin/admin
```

### Health Checks
```bash
# Backend health
curl http://localhost:3000/health

# Backend readiness
curl http://localhost:3000/ready

# Database health
curl http://localhost:3000/health/db

# Cache health
curl http://localhost:3000/health/cache
```

## Database Migrations

### Local Migrations
```bash
cd backend

# Create migration
npm run db:generate -- --name AddNewColumn

# Apply migrations
npm run db:migrate

# Revert last
npm run db:revert
```

### Production Migrations
```bash
# Run migrations on deployment
kubectl exec -it magazineos-backend-<pod-id> \
  -n magazineos -- npm run db:migrate
```

### Backup & Recovery
```bash
# Create snapshot
aws rds create-db-snapshot \
  --db-instance-identifier magazineos-db \
  --db-snapshot-identifier magazineos-backup-20260513

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier magazineos-db-restored \
  --db-snapshot-identifier magazineos-backup-20260513
```

## Disaster Recovery

### RTO/RPO Targets
- RTO: 1 hour
- RPO: 15 minutes

### Backup Strategy
- Automated daily snapshots
- Cross-region replication
- Point-in-time recovery enabled
- 30-day retention

### Failover
```bash
# Database failover
aws rds modify-db-instance \
  --db-instance-identifier magazineos-db \
  --multi-az --apply-immediately

# Manual failover
aws rds reboot-db-instance \
  --db-instance-identifier magazineos-db \
  --force-failover
```

## Troubleshooting

### Pods not starting
```bash
# Check pod status
kubectl describe pod <pod-name> -n magazineos

# View logs
kubectl logs <pod-name> -n magazineos

# Check resource requests
kubectl top nodes
kubectl top pods -n magazineos
```

### Database connection issues
```bash
# Test connection from pod
kubectl exec -it <pod> -n magazineos -- \
  psql -h magazineos-postgres -U postgres -d magazineos

# Check connection pooling
kubectl logs <backend-pod> | grep "pool"
```

### High memory usage
```bash
# Scale deployment
kubectl scale deployment magazineos-backend \
  --replicas=5 -n magazineos

# Increase resource limits
kubectl set resources deployment magazineos-backend \
  --limits=memory=2Gi,cpu=2000m -n magazineos
```

### Slow API response
```bash
# Check database logs
kubectl logs <postgres-pod> -n magazineos | grep "slow"

# Analyze slow queries
psql -h <db-host> -U postgres
SELECT * FROM pg_stat_statements ORDER BY mean_time DESC;
```

## Security

### Network Policy
```bash
kubectl apply -f k8s/network-policy.yaml
```

### Pod Security Policy
```bash
kubectl apply -f k8s/pod-security-policy.yaml
```

### Secrets Management
```bash
# Rotate secrets
kubectl create secret generic magazineos-secrets \
  --from-literal=db-password=<new-password> \
  -n magazineos --dry-run=client -o yaml | \
  kubectl apply -f -
```

## Rollback

### Kubernetes Rollback
```bash
# View rollout history
kubectl rollout history deployment/magazineos-backend \
  -n magazineos

# Rollback to previous
kubectl rollout undo deployment/magazineos-backend \
  -n magazineos

# Rollback to specific revision
kubectl rollout undo deployment/magazineos-backend \
  --to-revision=2 -n magazineos
```

### AWS ECS Rollback
```bash
# Update service with previous task definition
aws ecs update-service \
  --cluster magazineos \
  --service magazineos-api \
  --task-definition magazineos-backend:1
```

---

**Last Updated**: May 2026
**Status**: Production Ready
