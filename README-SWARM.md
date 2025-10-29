# 🐳 Docker Swarm Deployment Guide

## 📋 Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Service Management](#service-management)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [Architecture](#architecture)

---

## 🎯 Overview

This guide covers deploying the E-commerce application to Docker Swarm with:
- **3 Backend replicas** for high availability
- **2 Frontend replicas** for load distribution
- **2 Worker replicas** for async job processing
- **Nginx load balancer** for traffic distribution
- **MongoDB & Redis** with persistent storage
- **Docker Secrets** for secure credential management
- **Health checks** for all services
- **Rolling updates** with zero downtime

---

## ✅ Prerequisites

### Required Software
- Docker Desktop for Windows (latest version)
- PowerShell 5.1 or later
- Git (for version control)

### System Requirements
- **CPU**: 4+ cores recommended
- **RAM**: 8GB minimum, 16GB recommended
- **Disk**: 20GB free space
- **OS**: Windows 10/11 Pro/Enterprise (Hyper-V support)

### Before You Start
1. Ensure Docker Desktop is running
2. Enable Kubernetes in Docker Desktop (optional)
3. Close other resource-intensive applications
4. Have your email credentials ready for worker service

---

## 🚀 Quick Start

### 1. Build Docker Images
```powershell
# Navigate to project root
cd ecommerce-project

# Build all images
docker-compose build

# Verify images
docker images | Select-String "ecommerce"
```

Expected output:
```
ecommerce-backend    latest    ...
ecommerce-frontend   latest    ...
ecommerce-nginx      latest    ...
```

### 2. Configure Secrets
```powershell
# Navigate to swarm directory
cd swarm

# Edit secret files with your credentials
notepad secrets\db-password.txt      # MongoDB password
notepad secrets\jwt-secret.txt       # JWT secret key
notepad secrets\email-user.txt       # Your email address
notepad secrets\email-password.txt   # Email app password
```

**Important**: Use app-specific passwords for Gmail (not your main password)

### 3. Initialize Swarm
```powershell
# Run initialization script
.\init-swarm.ps1
```

This script will:
- ✅ Check Docker status
- ✅ Initialize Docker Swarm (if needed)
- ✅ Create Docker secrets from files
- ✅ Display Swarm node information

### 4. Deploy Stack
```powershell
# Deploy the application stack
.\deploy-stack.ps1
```

This script will:
- ✅ Validate stack file
- ✅ Check required images
- ✅ Deploy all services
- ✅ Show deployment status

### 5. Verify Deployment
```powershell
# Check services
docker service ls

# Check tasks
docker stack ps ecommerce

# View service logs
docker service logs -f ecommerce_backend
```

### 6. Access Application
- **Application**: http://localhost
- **Nginx Status**: http://localhost:8080
- **Swarm Visualizer**: http://localhost:9000

---

## 🔧 Detailed Setup

### Step 1: Prepare Environment

#### Update .env File (if needed)
```powershell
# Create/edit .env in backend directory
cd ..\backend
notepad .env
```

Add these variables:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://admin:password123@mongo:27017/ecommerce?authSource=admin
REDIS_URL=redis://:redispass123@redis:6379
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
CLIENT_URL=http://localhost

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

#### Build Optimized Images
```powershell
# Return to project root
cd ..

# Build with no cache for clean build
docker-compose build --no-cache

# Tag images for Swarm
docker tag ecommerce-backend:latest ecommerce-backend:1.0
docker tag ecommerce-frontend:latest ecommerce-frontend:1.0
docker tag ecommerce-nginx:latest ecommerce-nginx:1.0
```

### Step 2: Configure Secrets

#### Understanding Secrets
Docker Swarm secrets provide secure storage for sensitive data:
- Encrypted at rest
- Encrypted in transit
- Only available to services that need them
- Mounted as files in containers

#### Create Secrets
```powershell
cd swarm

# Method 1: From files (recommended)
.\init-swarm.ps1

# Method 2: Manual creation
echo "password123" | docker secret create db_password -
echo "your-jwt-secret-key" | docker secret create jwt_secret -
echo "your-email@gmail.com" | docker secret create email_user -
echo "your-app-password" | docker secret create email_password -

# Verify secrets
docker secret ls
```

### Step 3: Initialize Swarm

#### Single Node Setup (Development)
```powershell
# Initialize Swarm on current machine
docker swarm init

# View node info
docker node ls
```

Output:
```
ID                            HOSTNAME   STATUS    AVAILABILITY   MANAGER STATUS
abc123...                     docker-desktop   Ready     Active         Leader
```

#### Multi-Node Setup (Production - Optional)
```powershell
# On manager node
docker swarm init --advertise-addr <MANAGER-IP>

# Get join token for workers
docker swarm join-token worker

# On worker nodes, run the join command shown
docker swarm join --token SWMTKN-1-... <MANAGER-IP>:2377
```

### Step 4: Deploy Stack

#### Deploy Command
```powershell
cd swarm

# Deploy stack
docker stack deploy -c docker-stack.yml ecommerce

# Alternative: Use script
.\deploy-stack.ps1
```

#### Deployment Process
1. **Network Creation**: Overlay network for service communication
2. **Secret Distribution**: Secrets mounted to services
3. **Volume Creation**: Persistent storage for MongoDB and Redis
4. **Service Creation**: All services started with replicas
5. **Health Checks**: Services monitored for readiness

#### Monitor Deployment
```powershell
# Watch services come up
docker service ls

# Detailed task view
docker stack ps ecommerce --no-trunc

# Real-time logs
docker service logs -f ecommerce_backend

# Check specific service
docker service ps ecommerce_backend
```

### Step 5: Verify Deployment

#### Health Check Endpoints
```powershell
# Basic health
Invoke-WebRequest http://localhost/api/health

# Detailed health
Invoke-WebRequest http://localhost/api/health/detailed

# Readiness probe
Invoke-WebRequest http://localhost/api/health/ready

# Liveness probe
Invoke-WebRequest http://localhost/api/health/live
```

#### Service Status
```powershell
# All services should show 3/3, 2/2, etc.
docker service ls

# Example output:
# NAME                MODE         REPLICAS   IMAGE
# ecommerce_backend   replicated   3/3        ecommerce-backend:latest
# ecommerce_frontend  replicated   2/2        ecommerce-frontend:latest
# ecommerce_worker    replicated   2/2        ecommerce-backend:latest
```

#### Test Application
1. Open browser to http://localhost
2. Register a new account
3. Browse products
4. Add items to cart
5. Place an order
6. Check email for confirmation

---

## 🎮 Service Management

### Scaling Services

#### Using Script (Recommended)
```powershell
cd swarm

# Interactive mode
.\scale-services.ps1

# Command line mode
.\scale-services.ps1 -Service backend -Replicas 5
```

#### Manual Scaling
```powershell
# Scale backend to 5 replicas
docker service scale ecommerce_backend=5

# Scale multiple services
docker service scale ecommerce_backend=5 ecommerce_frontend=3 ecommerce_worker=3

# Verify scaling
docker service ps ecommerce_backend
```

#### Scaling Strategies

**Development Testing**
```powershell
docker service scale ecommerce_backend=1 ecommerce_frontend=1 ecommerce_worker=1
```
- Minimal resources
- Fast startup
- Good for testing

**Production Load (Recommended)**
```powershell
docker service scale ecommerce_backend=3 ecommerce_frontend=2 ecommerce_worker=2
```
- Balanced performance
- High availability
- Fault tolerance

**High Traffic**
```powershell
docker service scale ecommerce_backend=5 ecommerce_frontend=3 ecommerce_worker=3
```
- Maximum throughput
- Best for peak loads
- Higher resource usage

### Updating Services

#### Rolling Update with Script
```powershell
cd swarm

# Interactive mode
.\update-service.ps1

# Direct update
.\update-service.ps1 -Service backend -Image ecommerce-backend:2.0
```

#### Manual Rolling Update
```powershell
# Build new image version
cd ..
docker-compose build backend
docker tag ecommerce-backend:latest ecommerce-backend:2.0

# Update service
cd swarm
docker service update --image ecommerce-backend:2.0 ecommerce_backend

# Monitor update
docker service ps ecommerce_backend

# Update with custom strategy
docker service update `
  --image ecommerce-backend:2.0 `
  --update-parallelism 1 `
  --update-delay 10s `
  --update-failure-action rollback `
  ecommerce_backend
```

#### Rollback Service
```powershell
# Automatic rollback (if update fails)
# Already configured in stack file

# Manual rollback
docker service rollback ecommerce_backend

# Using script
.\update-service.ps1
# Select option 5 (Rollback)
```

#### Force Update (Restart)
```powershell
# Force update without image change
docker service update --force ecommerce_backend

# Using script
.\update-service.ps1
# Select option 6 (Force Update)
```

### Removing Stack

#### Using Script (Recommended)
```powershell
cd swarm

# Interactive mode with options
.\remove-stack.ps1
```

Options:
1. Remove stack only (preserve data)
2. Remove stack and volumes (⚠️ DATA LOSS)
3. Remove everything and leave Swarm

#### Manual Removal
```powershell
# Remove stack (preserves volumes)
docker stack rm ecommerce

# Wait for complete removal
Start-Sleep -Seconds 30

# Remove volumes (optional)
docker volume rm ecommerce_mongo-data ecommerce_redis-data

# Leave Swarm (optional)
docker swarm leave --force
```

---

## 📊 Monitoring

### Service Logs

#### View Logs
```powershell
# All backend instances
docker service logs -f ecommerce_backend

# Last 100 lines
docker service logs --tail 100 ecommerce_backend

# Specific time range
docker service logs --since 30m ecommerce_backend

# All services
docker service logs -f ecommerce_backend ecommerce_frontend ecommerce_worker
```

#### Log Filtering
```powershell
# Filter by pattern
docker service logs ecommerce_backend | Select-String "ERROR"

# Count errors
docker service logs ecommerce_backend | Select-String "ERROR" | Measure-Object
```

### Service Stats

#### Real-time Stats
```powershell
# All containers
docker stats

# Specific service
docker stats $(docker ps -q -f name=ecommerce_backend)

# Formatted output
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

### Health Monitoring

#### Service Health
```powershell
# Check health status
docker service ps ecommerce_backend --filter desired-state=running

# Inspect service health
docker service inspect ecommerce_backend --format '{{.Spec.TaskTemplate.ContainerSpec.Healthcheck}}'
```

#### Health Check Endpoints
```powershell
# Basic health
curl http://localhost/api/health

# Detailed health with metrics
curl http://localhost/api/health/detailed

# Check specific service
curl http://localhost:8080/health  # Nginx status
```

### Swarm Visualizer

Access http://localhost:9000 to see:
- Visual representation of services
- Container distribution across nodes
- Real-time updates
- Service health status

---

## 🔍 Troubleshooting

### Common Issues

#### 1. Services Not Starting

**Problem**: Services stuck in "Starting" state

**Solution**:
```powershell
# Check service logs
docker service logs ecommerce_backend

# Check events
docker service ps ecommerce_backend --no-trunc

# Common causes:
# - Image not found: Build images first
# - Port conflict: Check if port already in use
# - Secret missing: Run init-swarm.ps1
# - Health check failing: Check application logs
```

#### 2. Cannot Access Application

**Problem**: Browser shows "Connection refused"

**Solution**:
```powershell
# Check nginx service
docker service ps ecommerce_nginx

# Check if port is listening
netstat -an | Select-String ":80"

# Test nginx directly
curl http://localhost:8080/health

# Check backend connectivity
docker exec -it $(docker ps -q -f name=ecommerce_nginx) curl http://backend:5000/api/health
```

#### 3. Database Connection Failed

**Problem**: Backend cannot connect to MongoDB

**Solution**:
```powershell
# Check MongoDB service
docker service ps ecommerce_mongo

# Check MongoDB logs
docker service logs ecommerce_mongo

# Verify secret
docker secret inspect db_password

# Test connection from backend
docker exec -it $(docker ps -q -f name=ecommerce_backend) mongosh mongodb://admin:password123@mongo:27017
```

#### 4. Email Queue Not Working

**Problem**: Order confirmation emails not sent

**Solution**:
```powershell
# Check worker logs
docker service logs ecommerce_worker

# Check Redis connection
docker service logs ecommerce_redis

# Test email credentials
# Update secrets with correct credentials:
notepad swarm\secrets\email-user.txt
notepad swarm\secrets\email-password.txt

# Recreate secrets
docker secret rm email_user email_password
docker secret create email_user swarm\secrets\email-user.txt
docker secret create email_password swarm\secrets\email-password.txt

# Force update worker
docker service update --force ecommerce_worker
```

#### 5. High Memory Usage

**Problem**: Services consuming too much memory

**Solution**:
```powershell
# Check current usage
docker stats --no-stream

# Scale down if needed
docker service scale ecommerce_backend=2

# Restart high-memory service
docker service update --force ecommerce_backend

# Update resource limits in docker-stack.yml
```

### Diagnostic Commands

```powershell
# Complete system status
docker system df

# Service inspection
docker service inspect ecommerce_backend --pretty

# Network inspection
docker network inspect ecommerce_ecommerce-overlay

# Volume inspection
docker volume inspect ecommerce_mongo-data

# Node resources
docker node ls
docker node inspect self --pretty

# Swarm info
docker info | Select-String -Pattern "Swarm"
```

---

## 🏗️ Architecture

### Service Architecture

```
                                    Internet
                                       |
                                       |
                              +--------v--------+
                              |  Nginx (Port 80)|
                              |  Load Balancer  |
                              +--------+--------+
                                       |
                    +------------------+------------------+
                    |                  |                  |
            +-------v-------+  +-------v-------+  +-------v-------+
            | Backend #1    |  | Backend #2    |  | Backend #3    |
            | (Port 5000)   |  | (Port 5000)   |  | (Port 5000)   |
            +-------+-------+  +-------+-------+  +-------+-------+
                    |                  |                  |
                    +------------------+------------------+
                                       |
                    +------------------+------------------+
                    |                  |                  |
            +-------v-------+  +-------v-------+  +-------v-------+
            |   MongoDB     |  |    Redis      |  | Frontend #1-2 |
            | (Persistent)  |  | (Queue/Cache) |  | (Static)      |
            +---------------+  +-------+-------+  +---------------+
                                       |
                              +--------v--------+
                              | Worker #1-2     |
                              | (Email Queue)   |
                              +-----------------+
```

### Network Architecture

- **Overlay Network**: `ecommerce-overlay` (10.0.9.0/24)
- **Service Discovery**: Automatic DNS resolution
- **Load Balancing**: Nginx least_conn algorithm
- **Health Checks**: Every 30 seconds
- **Ingress Network**: External access on port 80

### Data Flow

1. **User Request** → Nginx (Port 80)
2. **Load Balancing** → Backend instance (Round-robin)
3. **API Processing** → MongoDB/Redis
4. **Async Jobs** → Redis Queue → Worker
5. **Response** → Nginx → User

---

## 📚 Additional Resources

### Docker Swarm Documentation
- Official Docs: https://docs.docker.com/engine/swarm/
- Stack Deploy: https://docs.docker.com/engine/swarm/stack-deploy/
- Secrets: https://docs.docker.com/engine/swarm/secrets/

### Project Documentation
- `../README.md` - Main project documentation
- `../PHASE1_TESTING_GUIDE.md` - Testing procedures
- `../PHASE1_SUMMARY.md` - Implementation details
- `docker-stack.yml` - Complete stack configuration

### Scripts Reference
- `init-swarm.ps1` - Initialize Swarm cluster
- `deploy-stack.ps1` - Deploy application stack
- `scale-services.ps1` - Scale services
- `update-service.ps1` - Update/rollback services
- `remove-stack.ps1` - Remove stack and cleanup

---

## 🎯 Best Practices

### Security
- ✅ Use Docker secrets for all credentials
- ✅ Rotate secrets regularly
- ✅ Use specific image tags (not `:latest`)
- ✅ Run containers as non-root user
- ✅ Keep images updated

### Performance
- ✅ Scale based on load metrics
- ✅ Use health checks for reliability
- ✅ Monitor resource usage
- ✅ Optimize Docker images (multi-stage builds)
- ✅ Use overlay networks efficiently

### Reliability
- ✅ Configure restart policies
- ✅ Use rolling updates
- ✅ Enable automatic rollback
- ✅ Monitor service health
- ✅ Test failover scenarios

### Maintenance
- ✅ Regular backups of volumes
- ✅ Clean unused images/volumes
- ✅ Update services during low-traffic periods
- ✅ Document all changes
- ✅ Test in development first

---

**Last Updated**: October 28, 2025  
**Version**: 1.0  
**Maintainer**: E-commerce Team
