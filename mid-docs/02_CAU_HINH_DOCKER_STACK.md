# 📝 CẤU HÌNH DOCKER STACK - CHI TIẾT & GIẢI THÍCH

**Tài liệu**: Cấu hình Docker Stack  
**File**: `swarm/docker-stack.yml`  
**Ngày**: 28/10/2025  
**Tác giả**: Team T10_N12

---

## 📋 MỤC LỤC

1. [Tổng quan](#1-tổng-quan)
2. [Cấu trúc file](#2-cấu-trúc-file)
3. [Chi tiết từng service](#3-chi-tiết-từng-service)
4. [Networks & Volumes](#4-networks--volumes)
5. [Secrets & Configs](#5-secrets--configs)
6. [Deploy Configuration](#6-deploy-configuration)

---

## 1. TỔNG QUAN

### 1.1. Thông tin file

```yaml
version: '3.8'
# Compose file format version 3.8 - hỗ trợ đầy đủ Swarm features
```

**File**: `swarm/docker-stack.yml` (323 lines)  
**Services**: 7 (backend, frontend, worker, nginx, mongo, redis, visualizer)  
**Networks**: 1 overlay network  
**Volumes**: 3 persistent volumes  
**Secrets**: 4 Docker secrets  
**Configs**: 1 Docker config

### 1.2. Cấu trúc tổng quan

```
docker-stack.yml
├── services (7)
│   ├── mongo          # Database
│   ├── redis          # Message queue
│   ├── backend        # API server (3 replicas)
│   ├── worker         # Background jobs (2 replicas)
│   ├── frontend       # React app (2 replicas)
│   ├── nginx          # Load balancer (1 replica)
│   └── visualizer     # Monitoring (1 replica)
├── networks (1)
│   └── ecommerce-overlay  # Overlay network
├── volumes (3)
│   ├── mongo-data
│   ├── redis-data
│   └── backend-uploads
├── secrets (4)
│   ├── db_password
│   ├── jwt_secret
│   ├── email_user
│   └── email_password
└── configs (1)
    └── nginx_final_config
```

---

## 2. CẤU TRÚC FILE

### 2.1. Services Section

Mỗi service có các thành phần chính:

```yaml
service_name:
  image: ...              # Docker image
  command: ...            # Override CMD (optional)
  environment: ...        # Environment variables
  volumes: ...            # Volume mounts
  networks: ...           # Networks to join
  ports: ...              # Published ports
  secrets: ...            # Docker secrets
  configs: ...            # Docker configs
  deploy: ...             # Swarm deployment config
    mode: ...             # replicated hoặc global
    replicas: ...         # Số lượng replicas
    placement: ...        # Node placement constraints
    update_config: ...    # Rolling update strategy
    restart_policy: ...   # Restart behavior
    resources: ...        # CPU/Memory limits
    labels: ...           # Service labels
  healthcheck: ...        # Health check configuration
```

---

## 3. CHI TIẾT TỪNG SERVICE

### 3.1. MongoDB Service

```yaml
mongo:
  image: mongo:latest
  environment:
    MONGO_INITDB_ROOT_USERNAME: admin
    MONGO_INITDB_ROOT_PASSWORD_FILE: /run/secrets/db_password
    MONGO_INITDB_DATABASE: ecommerce
  volumes:
    - mongo-data:/data/db
  networks:
    - ecommerce-overlay
  deploy:
    mode: replicated
    replicas: 1
    placement:
      constraints:
        - node.role == manager  # Chỉ chạy trên manager node
    restart_policy:
      condition: on-failure
      delay: 5s
      max_attempts: 3
      window: 120s
    update_config:
      parallelism: 1
      delay: 10s
      failure_action: rollback
    resources:
      limits:
        cpus: '1.0'
        memory: 1G
      reservations:
        cpus: '0.5'
        memory: 512M
  secrets:
    - db_password
  healthcheck:
    test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
```

**Giải thích**:
- **`mode: replicated`**: Service chạy với số lượng replicas cố định
- **`replicas: 1`**: Chỉ 1 instance (database không nên scale ngang đơn giản)
- **`placement.constraints`**: Bắt buộc chạy trên manager node (stateful service)
- **`restart_policy.condition: on-failure`**: Chỉ restart khi container bị lỗi
- **`restart_policy.delay: 5s`**: Đợi 5s trước khi restart
- **`restart_policy.max_attempts: 3`**: Tối đa 3 lần restart trong window
- **`restart_policy.window: 120s`**: Window time 120s
- **`update_config.parallelism: 1`**: Update 1 replica tại một thời điểm
- **`update_config.failure_action: rollback`**: Auto rollback nếu update fail
- **`resources.limits`**: Giới hạn tối đa CPU/RAM
- **`resources.reservations`**: Đảm bảo tối thiểu CPU/RAM
- **`healthcheck.start_period: 40s`**: Grace period 40s cho MongoDB khởi động

### 3.2. Redis Service

```yaml
redis:
  image: redis:alpine
  command: redis-server --appendonly yes --requirepass redispass123
  volumes:
    - redis-data:/data
  networks:
    - ecommerce-overlay
  deploy:
    mode: replicated
    replicas: 1
    restart_policy:
      condition: on-failure
      delay: 5s
      max_attempts: 3
    resources:
      limits:
        cpus: '0.25'
        memory: 256M
      reservations:
        cpus: '0.1'
        memory: 128M
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 30s
    timeout: 5s
    retries: 3
    start_period: 20s
```

**Giải thích**:
- **`command`**: Override default command
  - `--appendonly yes`: Enable AOF persistence
  - `--requirepass`: Set password authentication
- **`resources`**: Redis dùng ít tài nguyên (0.25 CPU, 256MB RAM)
- **`healthcheck.test`**: Check qua `redis-cli ping`

### 3.3. Backend Service

```yaml
backend:
  image: ecommerce-backend:latest
  environment:
    - NODE_ENV=production
    - PORT=5000
    - MONGODB_URI=mongodb://admin:password123@mongo:27017/ecommerce?authSource=admin
    - REDIS_URL=redis://:redispass123@redis:6379
    - JWT_SECRET=8d5b9f7c3edsadfs3312fs3
    - JWT_REFRESH_SECRET=8d5b9f7c3edsadfs3312fs3
    - CLIENT_URL=http://localhost
    - GOOGLE_CLIENT_ID=...
    - GOOGLE_CLIENT_SECRET=...
    - FACEBOOK_APP_ID=...
    - FACEBOOK_APP_SECRET=...
    - EMAIL_HOST=smtp.gmail.com
    - EMAIL_PORT=587
    - EMAIL_USER=t10n12namjore@gmail.com
    - EMAIL_PASS=ahpx cpvb rjds xqvh
  volumes:
    - backend-uploads:/app/uploads
  networks:
    - ecommerce-overlay
  deploy:
    mode: replicated
    replicas: 3                    # 3 replicas cho high availability
    update_config:
      parallelism: 1               # Update từng replica một
      delay: 10s                   # Đợi 10s giữa các updates
      failure_action: rollback     # Auto rollback nếu fail
      monitor: 60s                 # Monitor 60s sau update
      max_failure_ratio: 0.3       # Cho phép 30% failure
    rollback_config:
      parallelism: 1
      delay: 10s
      failure_action: pause
      monitor: 60s
    restart_policy:
      condition: on-failure
      delay: 5s
      max_attempts: 3
      window: 120s
    resources:
      limits:
        cpus: '0.5'
        memory: 512M
      reservations:
        cpus: '0.25'
        memory: 256M
    labels:
      - "com.ecommerce.service=backend"
      - "com.ecommerce.version=1.0"
  secrets:
    - jwt_secret
    - email_user
    - email_password
  healthcheck:
    test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:5000/api/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
```

**Giải thích**:
- **`replicas: 3`**: 3 instances để handle high traffic
- **`update_config.parallelism: 1`**: Zero-downtime deployment (update từng cái)
- **`update_config.monitor: 60s`**: Theo dõi 60s sau khi update để đảm bảo stable
- **`update_config.max_failure_ratio: 0.3`**: Nếu >30% replicas fail → rollback
- **`rollback_config`**: Cấu hình cho automatic rollback
- **`resources.limits`**: Mỗi replica tối đa 0.5 CPU, 512MB RAM
- **`labels`**: Metadata cho service identification
- **`healthcheck.retries: 3`**: Retry 3 lần trước khi mark unhealthy

**Lưu ý**: 
- Đã chuyển từ `JWT_SECRET_FILE` sang `JWT_SECRET` trực tiếp (workaround)
- Production nên implement file-based secret reading

### 3.4. Worker Service

```yaml
worker:
  image: ecommerce-backend:latest
  command: ["node", "src/services/queue/worker.js"]
  environment:
    # Same as backend
    ...
  networks:
    - ecommerce-overlay
  deploy:
    mode: replicated
    replicas: 2                    # 2 workers cho parallel processing
    restart_policy:
      condition: on-failure
      delay: 5s
      max_attempts: 3
    resources:
      limits:
        cpus: '0.5'
        memory: 512M
      reservations:
        cpus: '0.25'
        memory: 256M
  secrets:
    - jwt_secret
    - email_user
    - email_password
  healthcheck:
    test: ["CMD", "pgrep", "-f", "worker.js"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 30s
```

**Giải thích**:
- **`command`**: Override để chạy worker script thay vì server
- **`replicas: 2`**: 2 workers để process jobs parallel
- **`healthcheck.test`**: Check process còn chạy không qua `pgrep`
- Dùng same image với backend nhưng run mode khác

### 3.5. Frontend Service

```yaml
frontend:
  image: ecommerce-frontend:latest
  environment:
    - REACT_APP_API_URL=http://localhost:8080
    - REACT_APP_WS_URL=ws://localhost:8080
  networks:
    - ecommerce-overlay
  deploy:
    mode: replicated
    replicas: 2                    # 2 replicas cho frontend
    restart_policy:
      condition: on-failure
      delay: 5s
      max_attempts: 3
    resources:
      limits:
        cpus: '0.25'
        memory: 256M
      reservations:
        cpus: '0.1'
        memory: 128M
  healthcheck:
    test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 30s
```

**Giải thích**:
- **`replicas: 2`**: 2 instances cho redundancy
- **`resources.limits`**: Frontend dùng ít tài nguyên hơn backend
- **`healthcheck.test`**: Check port 3000 (React dev server trong container)
- **Lưu ý**: ĐÃ SỬA từ port 80 → 3000 trong healthcheck

### 3.6. Nginx Service

```yaml
nginx:
  image: nginx:alpine
  ports:
    - target: 80
      published: 80
      mode: ingress              # Swarm routing mesh
    - target: 8080
      published: 8080
      mode: ingress
  networks:
    - ecommerce-overlay
  configs:
    - source: nginx_final_config
      target: /etc/nginx/conf.d/default.conf
      mode: 0444                 # Read-only
  deploy:
    mode: replicated
    replicas: 1
    placement:
      constraints:
        - node.role == manager
    restart_policy:
      condition: any             # Restart always
      delay: 5s
      max_attempts: 3
    resources:
      limits:
        cpus: '0.25'
        memory: 128M
      reservations:
        cpus: '0.1'
        memory: 64M
  healthcheck:
    test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:8080/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 20s
```

**Giải thích**:
- **`mode: ingress`**: Dùng Swarm routing mesh (ĐÃ SỬA từ mode: host)
  - Cho phép load balancing across nodes
  - Tránh port conflicts
- **`configs`**: Mount Docker Config thay vì volume
  - Immutable configuration
  - Versioned và tracked by Swarm
- **`mode: 0444`**: Read-only permission (important for security)
- **`restart_policy.condition: any`**: Restart dù exit với code gì
- **Lưu ý**: Dùng `nginx:alpine` base image + Docker Config thay vì custom image

### 3.7. Visualizer Service

```yaml
visualizer:
  image: dockersamples/visualizer:latest
  ports:
    - target: 8080
      published: 9000
      mode: ingress
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock:ro
  networks:
    - ecommerce-overlay
  deploy:
    mode: replicated
    replicas: 1
    placement:
      constraints:
        - node.role == manager   # Cần access Docker socket
    restart_policy:
      condition: on-failure
    resources:
      limits:
        cpus: '0.1'
        memory: 64M
```

**Giải thích**:
- **`volumes`**: Mount Docker socket để đọc Swarm state
  - `:ro` = read-only (security best practice)
- **`placement.constraints`**: Phải chạy trên manager node (có Docker socket)
- **`published: 9000`**: External port khác internal port 8080
- **`resources`**: Rất ít tài nguyên (chỉ hiển thị UI)

---

## 4. NETWORKS & VOLUMES

### 4.1. Networks

```yaml
networks:
  ecommerce-overlay:
    driver: overlay
    attachable: true
    ipam:
      config:
        - subnet: 10.0.9.0/24
```

**Giải thích**:
- **`driver: overlay`**: Overlay network cho cross-node communication
- **`attachable: true`**: Cho phép non-Swarm containers attach (debugging)
- **`ipam.config`**: IP Address Management
  - `subnet: 10.0.9.0/24`: 254 IPs available (10.0.9.1 - 10.0.9.254)

**Service IPs** (tự động assign):
- frontend: 10.0.9.2
- backend: 10.0.9.3, 10.0.9.4, 10.0.9.5
- mongo: 10.0.9.10
- redis: 10.0.9.12
- nginx: 10.0.9.20

### 4.2. Volumes

```yaml
volumes:
  mongo-data:
    driver: local
  redis-data:
    driver: local
  backend-uploads:
    driver: local
```

**Giải thích**:
- **`driver: local`**: Local volume driver (default)
- **Persistent storage**: Data không mất khi container restart
- **Location**: `/var/lib/docker/volumes/` trên host

**Volume usage**:
- `mongo-data`: MongoDB database files
- `redis-data`: Redis AOF/RDB persistence
- `backend-uploads`: User uploaded files (product images)

---

## 5. SECRETS & CONFIGS

### 5.1. Docker Secrets

```yaml
secrets:
  db_password:
    external: true
  jwt_secret:
    external: true
  email_user:
    external: true
  email_password:
    external: true
```

**Giải thích**:
- **`external: true`**: Secrets đã tạo trước bằng `docker secret create`
- **Encrypted**: At rest và in transit
- **Mount path**: `/run/secrets/<secret_name>` trong container
- **Security**: Tự động remove khi container stop

**Tạo secrets**:
```bash
docker secret create db_password ./secrets/db-password.txt
docker secret create jwt_secret ./secrets/jwt-secret.txt
docker secret create email_user ./secrets/email-user.txt
docker secret create email_password ./secrets/email-password.txt
```

### 5.2. Docker Configs

```yaml
configs:
  nginx_final_config:
    external: true
```

**Giải thích**:
- **`external: true`**: Config đã tạo trước
- **Immutable**: Không thể modify, chỉ versioning
- **Use case**: Configuration files (nginx.conf)

**Tạo config**:
```bash
docker config create nginx_final_config ./nginx/conf.d/swarm-dynamic.conf
```

---

## 6. DEPLOY CONFIGURATION

### 6.1. Update Config

```yaml
update_config:
  parallelism: 1              # Update 1 replica/time
  delay: 10s                  # Wait 10s giữa updates
  failure_action: rollback    # Rollback nếu fail
  monitor: 60s                # Monitor 60s sau update
  max_failure_ratio: 0.3      # 30% failure threshold
  order: stop-first           # Stop old trước khi start new
```

**Rolling Update Flow**:
1. Stop replica 1 (old version)
2. Start replica 1 (new version)
3. Wait 10s (delay)
4. Monitor 60s (health checks)
5. If healthy → Continue to replica 2
6. If >30% fail → Automatic rollback

### 6.2. Rollback Config

```yaml
rollback_config:
  parallelism: 1              # Rollback 1 replica/time
  delay: 10s
  failure_action: pause       # Pause nếu rollback fail
  monitor: 60s
```

**Khi nào rollback**:
- Update failure rate > max_failure_ratio
- Health check failures
- Manual rollback: `docker service rollback <service>`

### 6.3. Restart Policy

```yaml
restart_policy:
  condition: on-failure       # on-failure | any | none
  delay: 5s                   # Wait before restart
  max_attempts: 3             # Max restart trong window
  window: 120s                # Reset counter after 120s
```

**Conditions**:
- **`on-failure`**: Chỉ restart khi exit code ≠ 0
- **`any`**: Restart dù exit code gì (nginx dùng)
- **`none`**: Không restart

**Example scenario**:
- Container crash → wait 5s → restart (attempt 1)
- Crash again → wait 5s → restart (attempt 2)
- Crash again → wait 5s → restart (attempt 3)
- Crash again → stop trying (max_attempts reached)
- Wait 120s → counter reset → có thể restart lại

### 6.4. Resources

```yaml
resources:
  limits:                     # Giới hạn tối đa
    cpus: '0.5'               # 50% của 1 CPU core
    memory: 512M              # 512MB RAM
  reservations:               # Đảm bảo tối thiểu
    cpus: '0.25'              # 25% của 1 CPU core
    memory: 256M              # 256MB RAM
```

**Giải thích**:
- **`limits`**: Hard limit, container không thể vượt quá
- **`reservations`**: Swarm đảm bảo có đủ resources trước khi schedule
- **CPU format**: `'0.5'` = 50% core, `'1'` = 1 full core, `'2'` = 2 cores

**Resource allocation tổng**:
- Backend: 3 × 0.5 = 1.5 CPU, 3 × 512MB = 1.5GB
- Frontend: 2 × 0.25 = 0.5 CPU, 2 × 256MB = 512MB
- Worker: 2 × 0.5 = 1.0 CPU, 2 × 512MB = 1GB
- Others: ~0.6 CPU, ~500MB
- **Total**: ~3.6 CPU, ~2.5GB RAM

---

## 7. KẾT LUẬN

### 7.1. Key Takeaways

✅ **Deploy replicas** cho high availability  
✅ **Update config** cho zero-downtime deployment  
✅ **Restart policy** cho fault tolerance  
✅ **Health checks** cho service monitoring  
✅ **Resource limits** cho resource management  
✅ **Secrets** cho security  
✅ **Overlay network** cho service communication  

### 7.2. Best Practices Applied

1. **Separation of concerns**: Backend, worker, frontend riêng biệt
2. **Configuration management**: Docker Configs cho immutable configs
3. **Secret management**: Sensitive data trong Docker Secrets
4. **Health monitoring**: Health checks cho tất cả services
5. **Resource control**: Limits & reservations cho mọi service
6. **Update strategy**: Rolling updates với rollback tự động
7. **Placement constraints**: Stateful services trên manager node

### 7.3. Commands thường dùng

```bash
# Deploy stack
docker stack deploy -c docker-stack.yml ecommerce

# Update service
docker service update --image ecommerce-backend:v2 ecommerce_backend

# Scale service
docker service scale ecommerce_backend=5

# Rollback service
docker service rollback ecommerce_backend

# View logs
docker service logs ecommerce_backend --follow

# Inspect service
docker service inspect ecommerce_backend
```

---

**Tài liệu chi tiết cấu hình Docker Stack với giải thích từng tham số và best practices.**

**Người tạo**: Team T10_N12  
**Ngày**: 28/10/2025
