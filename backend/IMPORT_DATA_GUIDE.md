# 📥 Hướng Dẫn Import Dữ Liệu Backup

## Tổng Quan

Script `import-data.js` tự động import dữ liệu từ các file backup JSON (trong thư mục `db/`) vào MongoDB.

**6 Collections sẽ được import:**
- `users` - Người dùng (admin, customers)
- `products` - Sản phẩm
- `carts` - Giỏ hàng
- `orders` - Đơn hàng
- `reviews` - Đánh giá
- `discountcodes` - Mã giảm giá

---

## 🚀 Cách Sử Dụng

### Option 1: Import cho LOCAL (không dùng Docker)

```bash
# 1. Vào thư mục backend
cd ecommerce-project/backend

# 2. Chạy script import
node import-data.js
```

**Kết quả mong đợi:**
```
╔════════════════════════════════════════════════════════════════════╗
║              📥 IMPORTING BACKUP DATA TO MONGODB                  ║
╚════════════════════════════════════════════════════════════════════╝

🔌 Connecting to MongoDB...
URI: mongodb://admin:****@localhost:27017/ecommerce?authSource=admin
✅ Connected to MongoDB: ecommerce

📦 Importing users...
✅ Imported 5 documents to users

📦 Importing products...
✅ Imported 20 documents to products

... (các collections khác)

╔════════════════════════════════════════════════════════════════════╗
║                  ✅ IMPORT COMPLETED SUCCESSFULLY!                ║
╚════════════════════════════════════════════════════════════════════╝

📊 Database Summary:
   users                : 5 documents
   products             : 20 documents
   carts                : 3 documents
   orders               : 10 documents
   reviews              : 15 documents
   discountcodes        : 5 documents

✅ Ready to use!
```

---

### Option 2: Import cho DOCKER

#### Cách 2A: Manual Import (Đơn giản nhất)

```bash
# 1. Deploy Docker Stack (MongoDB đã chạy)
cd ecommerce-project/swarm
.\deploy-stack.ps1

# 2. Đợi MongoDB khởi động (30 giây)
Start-Sleep -Seconds 30

# 3. Vào thư mục backend và import
cd ../backend
node import-data.js
```

#### Cách 2B: Auto Import khi Backend Start (Khuyên dùng)

**Bước 1:** Sửa file `backend/server.js` để auto import khi start:

```javascript
// Thêm vào đầu file
const { importAllData } = require('./import-data');

// Trong hàm startServer(), sau khi connect MongoDB:
async function startServer() {
  try {
    await connectDB();
    console.log('✅ MongoDB connected');

    // 🆕 AUTO IMPORT DATA (chỉ chạy 1 lần khi database trống)
    if (process.env.AUTO_IMPORT_DATA === 'true') {
      console.log('🔍 Checking if data needs to be imported...');
      const usersCount = await mongoose.connection.collection('users').countDocuments();
      
      if (usersCount === 0) {
        console.log('📥 Database is empty. Starting auto import...');
        await importAllData();
      } else {
        console.log('✅ Database already has data. Skipping import.');
      }
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}
```

**Bước 2:** Thêm biến môi trường vào `backend/.env`:

```env
# Auto import data on first startup
AUTO_IMPORT_DATA=true
```

**Bước 3:** Deploy lại:

```bash
cd ecommerce-project/swarm
.\deploy-stack.ps1
```

**Backend sẽ tự động:**
1. Connect MongoDB
2. Kiểm tra database có trống không
3. Nếu trống → Import data từ backup
4. Start server

---

## 🎯 Tính Năng Script

### ✅ An Toàn
- **Không duplicate data**: Kiểm tra collection có data chưa trước khi import
- **Skip nếu đã có data**: Tránh import trùng
- **Convert format MongoDB**: Tự động xử lý `$oid`, `$date`, `$numberInt`

### ⚡ Smart Features
- Convert MongoDB Extended JSON → JavaScript Objects
- Skip collections đã có data
- Hiển thị progress chi tiết
- Summary sau khi import xong

### 🔒 Security
- Ẩn password trong console log
- Disconnect MongoDB sau khi xong

---

## 📝 Format Dữ Liệu Backup

**Cấu trúc file JSON:**
```json
[
  {
    "_id": { "$oid": "68e7caa2de8d916fbbeef59a" },
    "email": "admin@ecommerce.com",
    "createdAt": { "$date": "2025-10-09T14:45:54.107Z" },
    "quantity": { "$numberInt": "10" }
  }
]
```

**Sẽ được convert thành:**
```javascript
[
  {
    _id: "68e7caa2de8d916fbbeef59a",
    email: "admin@ecommerce.com",
    createdAt: new Date("2025-10-09T14:45:54.107Z"),
    quantity: 10
  }
]
```

---

## 🐛 Troubleshooting

### Lỗi: "Authentication failed"
```bash
# Fix: Kiểm tra MongoDB URI trong .env
MONGODB_URI=mongodb://admin:password123@localhost:27017/ecommerce?authSource=admin
```

### Lỗi: "File not found"
```bash
# Fix: Đảm bảo các file backup tồn tại trong thư mục db/
ls ../db/ecommerce.*.json
```

### Lỗi: "Collection already has data"
```bash
# Đây KHÔNG phải lỗi - script skip collection để tránh duplicate
# Nếu muốn import lại:
# 1. Xóa collection:
mongo ecommerce --eval "db.users.drop()"

# 2. Chạy lại import:
node import-data.js
```

### Lỗi: "Connection timeout" (Docker)
```bash
# Fix: Đợi MongoDB start đủ lâu
Start-Sleep -Seconds 30

# Hoặc check MongoDB đã ready chưa:
docker service ls | findstr mongo
```

---

## 📦 Package Dependencies

Script sử dụng các package có sẵn trong `package.json`:
- `mongoose` - MongoDB ODM
- `fs` - File system (built-in Node.js)
- `path` - Path utilities (built-in Node.js)

**Không cần install thêm gì!**

---

## 🎓 Best Practices

### Development (Local)
```bash
# 1. Start MongoDB
# 2. Import data
node import-data.js
# 3. Start backend
npm start
```

### Production (Docker)
```bash
# Enable auto import trong .env
AUTO_IMPORT_DATA=true

# Deploy stack (backend sẽ tự import)
.\deploy-stack.ps1
```

---

## 📊 Kiểm Tra Data Sau Import

### Qua MongoDB Shell
```bash
# Connect MongoDB
mongo mongodb://admin:password123@localhost:27017/ecommerce?authSource=admin

# Check collections
show collections

# Count documents
db.users.count()
db.products.count()
db.orders.count()

# Sample data
db.users.findOne()
db.products.findOne()
```

### Qua Backend API
```bash
# Get all products
curl http://localhost:5000/api/products

# Get all users (cần login admin)
curl http://localhost:5000/api/users

# Login với admin account
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ecommerce.com","password":"Admin@123"}'
```

---

## 📝 Log Files

Script log ra console, có thể redirect vào file:

```bash
# Save import log
node import-data.js > import-log.txt 2>&1

# View log
cat import-log.txt
```

---

## 🔄 Workflow Khuyên Dùng

### First Time Setup (Docker)
1. Deploy stack: `.\deploy-stack.ps1`
2. Wait 30s for MongoDB
3. Import data: `node import-data.js`
4. Verify: Check API endpoints

### Cleanup & Re-import
```bash
# 1. Remove stack
.\remove-stack.ps1

# 2. Remove volumes
docker volume prune -f

# 3. Deploy lại
.\deploy-stack.ps1

# 4. Import lại
cd ../backend
node import-data.js
```

---

## ✅ Checklist

Sau khi import xong, verify:

- [ ] MongoDB có 6 collections: users, products, carts, orders, reviews, discountcodes
- [ ] Mỗi collection có số documents đúng
- [ ] Backend API trả về data đúng
- [ ] Frontend hiển thị products
- [ ] Login với admin account hoạt động
- [ ] Giỏ hàng, đơn hàng hoạt động bình thường

---

## 📞 Support

Nếu gặp vấn đề:
1. Check console log để xem lỗi cụ thể
2. Verify MongoDB connection string
3. Đảm bảo các file backup tồn tại
4. Check MongoDB service đã start chưa (Docker)

---

**Happy Importing! 🎉**
