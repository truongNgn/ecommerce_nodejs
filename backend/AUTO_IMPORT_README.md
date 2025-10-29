# 📥 Auto Import Data - Quick Start

## ✨ Tính Năng Mới

Backend hiện hỗ trợ **tự động import data** từ backup files khi khởi động!

## 🚀 Cách Sử dụng

### 1. Enable Auto Import

Mở file `.env` và đảm bảo:

```env
AUTO_IMPORT_DATA=true
```

### 2. Chạy Backend

**Option A: LOCAL**
```bash
cd backend
npm start
```

**Option B: DOCKER**
```bash
cd swarm
.\deploy-stack.ps1
```

### 3. Kết Quả

Backend sẽ tự động:
- ✅ Connect MongoDB
- ✅ Kiểm tra database có data chưa
- ✅ Nếu trống → Import data từ `db/*.json`
- ✅ Start server

**Console log:**
```
✅ MongoDB connected successfully

╔════════════════════════════════════════════════════════════════════╗
║         🔍 CHECKING IF DATA NEEDS TO BE IMPORTED...              ║
╚════════════════════════════════════════════════════════════════════╝

📦 Database is empty. Starting auto import...

📥 Importing users...
✅ Imported 5 documents to users

📥 Importing products...
✅ Imported 20 documents to products

... (các collections khác)

╔════════════════════════════════════════════════════════════════════╗
║              ✅ AUTO IMPORT COMPLETED SUCCESSFULLY!               ║
╚════════════════════════════════════════════════════════════════════╝

📊 Database Summary:
   users                : 5 documents
   products             : 20 documents
   carts                : 3 documents
   orders               : 10 documents
   reviews              : 15 documents
   discountcodes        : 5 documents

🚀 Server running on port 5000
```

## 📝 Manual Import (Nếu Cần)

Nếu muốn import thủ công:

```bash
# Option 1: Chạy script trực tiếp
cd backend
node import-data.js

# Option 2: Dùng PowerShell script (có verify)
cd backend
.\test-import.ps1
```

## ⚙️ Configuration

**Disable auto import:**
```env
AUTO_IMPORT_DATA=false
```

**MongoDB connection strings:**

- LOCAL: `mongodb://admin:password123@localhost:27017/ecommerce?authSource=admin`
- DOCKER: `mongodb://admin:password123@mongo:27017/ecommerce?authSource=admin`

## 📦 Data Files

Backup data trong thư mục `db/`:
- `ecommerce.users.json` - Users
- `ecommerce.products.json` - Products
- `ecommerce.carts.json` - Carts
- `ecommerce.orders.json` - Orders
- `ecommerce.reviews.json` - Reviews
- `ecommerce.discountcodes.json` - Discount codes

## 🔒 An Toàn

- ✅ Chỉ import nếu database **trống**
- ✅ Không duplicate data
- ✅ Tự động convert MongoDB JSON format
- ✅ Không crash server nếu import fail

## 📖 Chi Tiết

Xem thêm: [IMPORT_DATA_GUIDE.md](./IMPORT_DATA_GUIDE.md)

---

**Happy Importing! 🎉**
