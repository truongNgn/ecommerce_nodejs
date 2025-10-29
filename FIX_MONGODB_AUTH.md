# 🔧 FIX MONGODB AUTHENTICATION ERROR

## ❌ Vấn đề

```
MongoServerError: Command find requires authentication
code: 13, codeName: 'Unauthorized'
```

## 🎯 Nguyên nhân

MongoDB local của bạn có **authentication enabled** nhưng backend đang connect **không có username/password**.

---

## ✅ GIẢI PHÁP 1: Thêm authentication vào .env (RECOMMENDED)

### Bước 1: Kiểm tra username/password MongoDB

Mở **MongoDB Compass** hoặc **mongo shell**:

```bash
# Mở mongo shell
mongo

# Kiểm tra users
use admin
db.system.users.find()
```

Nếu thấy user `admin`, password thường là `password123` (từ Docker setup).

### Bước 2: Update file .env

File `.env` đã được update:

```env
# LOCAL (with authentication)
MONGODB_URI=mongodb://admin:password123@localhost:27017/ecommerce?authSource=admin
```

**Lưu ý**: 
- Username: `admin`
- Password: `password123` (hoặc password bạn đã set)
- `authSource=admin` - Bắt buộc phải có!

### Bước 3: Restart backend

```powershell
# Ctrl+C để stop backend
# Chạy lại
npm start
```

---

## ✅ GIẢI PHÁP 2: Tắt authentication MongoDB local

Nếu không nhớ password hoặc muốn đơn giản hơn:

### Bước 1: Stop MongoDB service

```powershell
# Windows
net stop MongoDB

# Hoặc qua Services (services.msc)
```

### Bước 2: Start MongoDB WITHOUT authentication

```powershell
# Tìm file mongod.cfg (thường ở C:\Program Files\MongoDB\Server\[version]\bin\mongod.cfg)

# Edit file, comment dòng security:
# security:
#   authorization: enabled

# Hoặc start với --noauth
mongod --dbpath "C:\data\db" --noauth
```

### Bước 3: Update .env

```env
# Không cần username/password
MONGODB_URI=mongodb://localhost:27017/ecommerce
```

### Bước 4: Restart backend

```powershell
npm start
```

---

## ✅ GIẢI PHÁP 3: Tạo user mới trong MongoDB

Nếu MongoDB yêu cầu auth nhưng không có user:

### Bước 1: Start MongoDB với --noauth (temporary)

```powershell
mongod --dbpath "C:\data\db" --noauth
```

### Bước 2: Tạo user admin

Mở mongo shell khác:

```javascript
mongo

use admin

db.createUser({
  user: "admin",
  pwd: "password123",
  roles: [
    { role: "userAdminAnyDatabase", db: "admin" },
    { role: "readWriteAnyDatabase", db: "admin" }
  ]
})
```

### Bước 3: Restart MongoDB với auth

Stop MongoDB, bật lại với authentication:

```powershell
mongod --dbpath "C:\data\db" --auth
```

### Bước 4: Update .env

```env
MONGODB_URI=mongodb://admin:password123@localhost:27017/ecommerce?authSource=admin
```

---

## 🔍 KIỂM TRA CONNECTION

### Test connection với mongo shell:

```bash
# Với authentication
mongo "mongodb://admin:password123@localhost:27017/ecommerce?authSource=admin"

# Không authentication
mongo "mongodb://localhost:27017/ecommerce"
```

### Test connection trong backend:

```javascript
// Thêm vào backend/server.js (temporary)
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully!');
  console.log('Host:', mongoose.connection.host);
  console.log('Database:', mongoose.connection.name);
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});
```

---

## 📝 SO SÁNH: LOCAL vs DOCKER

### Local (.env):
```env
# Với authentication
MONGODB_URI=mongodb://admin:password123@localhost:27017/ecommerce?authSource=admin

# Không authentication (nếu tắt auth)
MONGODB_URI=mongodb://localhost:27017/ecommerce
```

### Docker (docker-stack.yml):
```yaml
# Backend service
environment:
  - MONGODB_URI=mongodb://admin:password123@mongo:27017/ecommerce?authSource=admin
  # hostname: mongo (không phải localhost!)
```

**Key difference**: 
- Local: `localhost:27017`
- Docker: `mongo:27017` (DNS service name)

---

## 🎯 KHUYẾN NGHỊ

### Cho development local:
1. ✅ **Tắt authentication** - Đơn giản nhất
2. ✅ Hoặc dùng **Docker** cho consistent environment

### Cho Docker/Production:
1. ✅ **Bật authentication** - Bắt buộc
2. ✅ Dùng **Docker Secrets** (đã implement)
3. ✅ **Strong passwords**

---

## 🆘 NẾU VẪN LỖI

### Check MongoDB đang chạy:

```powershell
# Windows
Get-Process mongod

# Check port
netstat -ano | findstr :27017
```

### Check MongoDB logs:

```powershell
# Thường ở: C:\Program Files\MongoDB\Server\[version]\log\mongod.log
Get-Content "C:\Program Files\MongoDB\Server\7.0\log\mongod.log" -Tail 50
```

### Test với MongoDB Compass:

1. Mở MongoDB Compass
2. Connection string: `mongodb://admin:password123@localhost:27017/?authSource=admin`
3. Nếu connect được → backend cũng sẽ work

---

## ✅ VERIFICATION

Sau khi fix, bạn sẽ thấy:

```
✅ Connected to MongoDB: ecommerce
Server running on port 5000
```

Và API requests sẽ work:

```
GET /api/products 200 50ms
GET /api/cart 200 30ms
```

---

**Created**: October 28, 2025  
**Author**: Team T10_N12
