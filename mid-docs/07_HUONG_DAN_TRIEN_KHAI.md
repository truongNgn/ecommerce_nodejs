# 🚀 HƯỚNG DẪN TRIỂN KHAI (DEPLOYMENT GUIDE)

**Tài liệu**: Hướng dẫn deploy hệ thống Docker Swarm  
**Ngày**: 28/10/2025  
**Tác giả**: Team T10_N12

---

## 📋 MỤC LỤC

1. [Prerequisites](#1-prerequisites)
2. [Cài đặt ban đầu](#2-cài-đặt-ban-đầu)
3. [Deploy Stack](#3-deploy-stack)
4. [Verification](#4-verification)
5. [Troubleshooting](#5-troubleshooting)

---

## 1. PREREQUISITES

### 1.1. System Requirements

**Hardware**:
- CPU: Minimum 4 cores (Recommended: 8 cores)
- RAM: Minimum 6GB (Recommended: 12GB)
- Disk: 50GB free space
- Network: Stable internet connection

**Software**:
- OS: Windows 10/11, Linux (Ubuntu 20.04+), macOS 11+
- Docker Desktop: Version 20.10+ hoặc Docker Engine
- Git: Latest version

**Network ports**:
```
80    - Nginx (HTTP)
8080  - Nginx (API)
9000  - Visualizer
27017 - MongoDB (internal only)
6379  - Redis (internal only)
5000  - Backend API (internal only)
3000  - Frontend (internal only)
```

### 1.2. Kiểm tra Docker

```powershell
# Check Docker version
docker --version
# Output: Docker version 24.0.0+

# Check Docker Compose
docker compose version
# Output: Docker Compose version v2.20.0+

# Check Docker Swarm status
docker info | Select-String "Swarm"
# Output: Swarm: inactive (nếu chưa init)
```

---

## 2. CÀI ĐẶT BAN ĐẦU

### 2.1. Clone Repository

```powershell
# Clone project
git clone https://github.com/NamJore04/Economic-store-NodeJs.git
cd Economic-store-NodeJs\ecommerce-project

# Check structure
dir
```

### 2.2. Build Docker Images

**Build backend image**:
```powershell
cd backend
docker build -t ecommerce-backend:latest .
cd ..
```

**Build frontend image**:
```powershell
cd frontend
docker build -t ecommerce-frontend:latest .
cd ..
```

**Verify images**:
```powershell
docker images | Select-String "ecommerce"
# Output:
# ecommerce-backend    latest    abc123...   2GB
# ecommerce-frontend   latest    def456...   500MB
```

### 2.3. Tạo Docker Secrets

```powershell
cd swarm

# Tạo thư mục secrets nếu chưa có
New-Item -ItemType Directory -Force -Path secrets

# Tạo secret files
@"
password123
"@ | Out-File -FilePath secrets\db-password.txt -NoNewline

@"
8d5b9f7c3edsadfs3312fs3
"@ | Out-File -FilePath secrets\jwt-secret.txt -NoNewline

@"
t10n12namjore@gmail.com
"@ | Out-File -FilePath secrets\email-user.txt -NoNewline

@"
ahpx cpvb rjds xqvh
"@ | Out-File -FilePath secrets\email-password.txt -NoNewline

# Verify
dir secrets\
```

### 2.4. Tạo Docker Config

```powershell
# Tạo Nginx config
docker config create nginx_final_config ..\nginx\conf.d\swarm-dynamic.conf

# Verify
docker config ls
```

### 2.5. Initialize Docker Swarm

**Windows**:
```powershell
# Init Swarm
docker swarm init

# Output:
# Swarm initialized: current node (xyz...) is now a manager.
# To add a worker to this swarm, run:
#   docker swarm join --token SWMTKN-1-...

# Check status
docker info | Select-String "Swarm"
# Output: Swarm: active

# Check node
docker node ls
```

**Nếu gặp lỗi nhiều IPs**:
```powershell
# Get local IP
ipconfig | Select-String "IPv4"

# Init with specific IP
docker swarm init --advertise-addr <YOUR-IP>
```

---

## 3. DEPLOY STACK

### 3.1. Tạo Docker Secrets trong Swarm

```powershell
# Tạo secrets
docker secret create db_password secrets\db-password.txt
docker secret create jwt_secret secrets\jwt-secret.txt
docker secret create email_user secrets\email-user.txt
docker secret create email_password secrets\email-password.txt

# Verify
docker secret ls
```

### 3.2. Deploy Stack

```powershell
# Deploy
docker stack deploy -c docker-stack.yml ecommerce

# Output:
# Creating network ecommerce_ecommerce-overlay
# Creating service ecommerce_mongo
# Creating service ecommerce_redis
# Creating service ecommerce_backend
# Creating service ecommerce_worker
# Creating service ecommerce_frontend
# Creating service ecommerce_nginx
# Creating service ecommerce_visualizer
```

### 3.3. Monitor Deployment

```powershell
# Check services
docker service ls

# Expected output:
# ID       NAME                MODE        REPLICAS   IMAGE
# ...      ecommerce_mongo     replicated  1/1        mongo:latest
# ...      ecommerce_redis     replicated  1/1        redis:alpine
# ...      ecommerce_backend   replicated  3/3        ecommerce-backend:latest
# ...      ecommerce_worker    replicated  2/2        ecommerce-backend:latest
# ...      ecommerce_frontend  replicated  2/2        ecommerce-frontend:latest
# ...      ecommerce_nginx     replicated  1/1        nginx:alpine
# ...      ecommerce_visualizer replicated 1/1        dockersamples/visualizer

# Watch deployment progress
docker service ls --format "table {{.Name}}\t{{.Replicas}}"

# Wait until all services show X/X (e.g., 3/3)
```

### 3.4. Seed Database

```powershell
# Get backend container ID
$BACKEND_ID = docker ps --filter name=ecommerce_backend --format "{{.ID}}" | Select-Object -First 1

# Run seed script
docker exec $BACKEND_ID node seed.js

# Output:
# ✅ Connected to MongoDB
# ✅ Database cleared
# ✅ 2 users created
# ✅ 10 products created
# ⚠️ Some validation errors (non-critical)
# ✅ Seed completed
```

---

## 4. VERIFICATION

### 4.1. Health Checks

**Check all services healthy**:
```powershell
docker service ls
# All replicas should show X/X (no 0/X)
```

**Check individual service logs**:
```powershell
# Backend logs
docker service logs ecommerce_backend --tail 50

# Expected: No errors, "Server running on port 5000"

# Worker logs
docker service logs ecommerce_worker --tail 50

# Expected: "Worker started, waiting for jobs..."

# Frontend logs
docker service logs ecommerce_frontend --tail 20

# Nginx logs
docker service logs ecommerce_nginx --tail 20
```

### 4.2. API Testing

**Test health endpoint**:
```powershell
curl http://localhost:8080/api/health

# Expected:
# {
#   "status": "healthy",
#   "timestamp": "2025-10-28T...",
#   ...
# }
```

**Test products endpoint**:
```powershell
curl http://localhost:8080/api/products | ConvertFrom-Json | Select-Object -First 1

# Expected: Product data
```

**Test authentication**:
```powershell
# Login
$body = @{
  email = "admin@example.com"
  password = "Admin123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -Body $body -ContentType "application/json"

$response
# Expected: { success: true, token: "...", user: {...} }
```

### 4.3. Frontend Testing

**Open in browser**:
```
http://localhost
```

**Expected**:
- ✅ Landing page loads
- ✅ Products display
- ✅ Login/Register works
- ✅ No console errors

### 4.4. Load Balancing Test

```powershell
# Send 10 requests, check distribution
for ($i=1; $i -le 10; $i++) {
  curl -s http://localhost:8080/api/health | ConvertFrom-Json | Select-Object -ExpandProperty hostname
}

# Expected: Mix of backend-1, backend-2, backend-3
```

### 4.5. Visualizer Check

**Open Visualizer**:
```
http://localhost:9000
```

**Expected**:
- ✅ See all 7 services
- ✅ See 12 containers total
- ✅ Visual representation of cluster

---

## 5. TROUBLESHOOTING

### 5.1. Common Issues

**Issue 1: Services not starting (0/X replicas)**

```powershell
# Check service status
docker service ps ecommerce_backend --no-trunc

# Look for error in "ERROR" column

# Common causes:
# - Image not found: Build images first
# - Port conflicts: Stop conflicting services
# - Resource limits: Increase Docker resources
```

**Solution**:
```powershell
# Remove stack
docker stack rm ecommerce

# Wait 30s for cleanup
Start-Sleep -Seconds 30

# Redeploy
docker stack deploy -c docker-stack.yml ecommerce
```

**Issue 2: Database empty after seed**

```powershell
# Check MongoDB logs
docker service logs ecommerce_mongo --tail 50

# Reseed
$BACKEND_ID = docker ps --filter name=ecommerce_backend --format "{{.ID}}" | Select-Object -First 1
docker exec $BACKEND_ID node seed.js
```

**Issue 3: JWT_SECRET error**

```powershell
# Check secret exists
docker secret ls | Select-String "jwt_secret"

# Recreate if missing
docker secret create jwt_secret secrets\jwt-secret.txt

# Restart backend
docker service update --force ecommerce_backend
```

**Issue 4: Nginx not routing**

```powershell
# Check Nginx logs
docker service logs ecommerce_nginx --tail 50

# Check Nginx config
docker exec $(docker ps -q -f name=ecommerce_nginx) cat /etc/nginx/conf.d/default.conf

# Recreate config if needed
docker config rm nginx_final_config
docker config create nginx_final_config ..\nginx\conf.d\swarm-dynamic.conf
docker service update --config-rm nginx_final_config --config-add source=nginx_final_config,target=/etc/nginx/conf.d/default.conf ecommerce_nginx
```

### 5.2. Debug Commands

**Service details**:
```powershell
docker service inspect ecommerce_backend --pretty
```

**Container logs**:
```powershell
# Get container ID
docker ps -f name=ecommerce_backend

# View logs
docker logs <container-id> --tail 100 --follow
```

**Network inspect**:
```powershell
docker network inspect ecommerce_ecommerce-overlay
```

**Secret verify**:
```powershell
docker secret ls
docker service inspect ecommerce_backend --format '{{.Spec.TaskTemplate.ContainerSpec.Secrets}}'
```

### 5.3. Complete Reset

```powershell
# Remove stack
docker stack rm ecommerce

# Wait for cleanup
Start-Sleep -Seconds 30

# Remove secrets
docker secret rm db_password jwt_secret email_user email_password

# Remove config
docker config rm nginx_final_config

# Remove volumes (WARNING: deletes data!)
docker volume rm $(docker volume ls -q | Select-String "ecommerce")

# Leave Swarm (if needed)
docker swarm leave --force

# Start fresh from step 2.3
```

---

## 6. SCALING & MANAGEMENT

### 6.1. Scaling Services

```powershell
# Scale backend to 5 replicas
docker service scale ecommerce_backend=5

# Scale worker to 3
docker service scale ecommerce_worker=3

# Scale frontend to 3
docker service scale ecommerce_frontend=3

# Verify
docker service ls
```

### 6.2. Update Services

```powershell
# Update backend image
docker service update --image ecommerce-backend:v2.0 ecommerce_backend

# Update with env variable
docker service update --env-add NEW_VAR=value ecommerce_backend

# Rollback if needed
docker service rollback ecommerce_backend
```

### 6.3. Remove Stack

```powershell
# Remove entire stack
docker stack rm ecommerce

# Verify removal
docker service ls
# Output: (empty)

docker stack ls
# Output: (empty)
```

---

## 7. PRODUCTION CHECKLIST

### 7.1. Pre-deployment

- [ ] All images built successfully
- [ ] Secrets created và secured
- [ ] Config files validated
- [ ] Resource limits reviewed
- [ ] Health checks configured
- [ ] Backup strategy defined
- [ ] Monitoring tools ready

### 7.2. Post-deployment

- [ ] All services healthy (X/X replicas)
- [ ] Database seeded
- [ ] API endpoints responding
- [ ] Frontend accessible
- [ ] Load balancing working
- [ ] Health checks passing
- [ ] Logs monitored
- [ ] Visualizer accessible

### 7.3. Ongoing

- [ ] Daily health checks
- [ ] Weekly log reviews
- [ ] Monthly security updates
- [ ] Regular backups
- [ ] Performance monitoring
- [ ] Capacity planning

---

## 8. KẾT LUẬN

**Deployment summary**:
- ✅ 7 services deployed
- ✅ 12 replicas total
- ✅ Zero downtime updates
- ✅ Auto-recovery enabled
- ✅ Production-ready

**Time estimate**:
- Initial setup: 30-45 minutes
- Subsequent deploys: 5-10 minutes

**Support**:
- Documentation: `mid-docs/` folder
- Issues: GitHub Issues
- Email: t10n12namjore@gmail.com

---

**Hướng dẫn triển khai chi tiết đã được test và verify thành công trong Phase 3.**

**Người tạo**: Team T10_N12  
**Ngày**: 28/10/2025
