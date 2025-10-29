# 🚀 Hướng Dẫn Chạy Backend Server

## ⚠️ QUAN TRỌNG: Cấu Hình Email

Backend server cần các biến môi trường (environment variables) để gửi email. 

### Cách 1: Sử Dụng Script `start.bat` (KHUYẾN NGHỊ)

**Đơn giản nhất** - Chỉ cần chạy file `start.bat`:

```bash
cd backend
start.bat
```

Script này đã cấu hình sẵn tất cả environment variables cần thiết:
- ✅ JWT secrets
- ✅ MongoDB connection
- ✅ Email credentials
- ✅ CORS settings

### Cách 2: Tạo File `.env`

Nếu muốn dùng file `.env`, tạo file `.env` trong thư mục `backend/`:

```bash
# Copy từ env.example
cp env.example .env
```

Sau đó chỉnh sửa `.env` với thông tin của bạn:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
```

**Lưu ý về Gmail App Password:**
1. Vào Google Account Settings
2. Bật 2-Step Verification
3. Tạo App Password cho "Mail"
4. Dùng App Password này cho `EMAIL_PASS`

### Cách 3: Set Env Variables Thủ Công (Windows CMD)

```cmd
set EMAIL_USER=namhuynhfree@gmail.com
set EMAIL_PASS=lyyf efca nern dguc
set EMAIL_HOST=smtp.gmail.com
set EMAIL_PORT=587
set JWT_SECRET=8d5b9f7c3edsadfs3312fs3
set JWT_REFRESH_SECRET=8d5b9f7c3eds8d5b9f7c3edsadfs3312fs3adfs3312fs3
set MONGODB_URI=mongodb://localhost:27017/ecommerce
set CLIENT_URL=http://localhost:3000
node server.js
```

## 🧪 Test Forgot Password

Sau khi server chạy, test API:

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\"}"
```

Nếu thành công, bạn sẽ nhận được:
```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent"
}
```

## 📧 Kiểm Tra Email

- Kiểm tra hộp thư của bạn
- Link reset password có dạng: `http://localhost:3000/reset-password/{token}`
- Token có hiệu lực **10 phút**

## ❗ Troubleshooting

### Lỗi: "Email could not be sent"

**Nguyên nhân:** Email credentials chưa được cấu hình

**Giải pháp:**
1. Dùng `start.bat` với credentials đã có
2. Hoặc tạo `.env` với email credentials của bạn
3. Đảm bảo Gmail App Password đúng (không phải password thường)

### Lỗi: "Invalid credentials"

**Nguyên nhân:** Gmail App Password sai

**Giải pháp:**
1. Tạo lại App Password mới từ Google Account
2. Cập nhật vào `start.bat` hoặc `.env`
3. Restart server

### Lỗi: "Connection timeout"

**Nguyên nhân:** Firewall hoặc antivirus block port 587

**Giải pháp:**
1. Tắt tạm firewall/antivirus
2. Hoặc thêm exception cho port 587
3. Thử dùng port 465 (secure) thay vì 587

## ✅ Checklist Trước Khi Chạy

- [ ] MongoDB đang chạy (`mongod`)
- [ ] Email credentials đã cấu hình
- [ ] Port 5000 không bị chiếm
- [ ] Node.js version >= 14
- [ ] `npm install` đã chạy

## 🎯 Quick Start (Recommended)

```bash
# 1. Đảm bảo MongoDB đang chạy
mongod

# 2. Di chuyển vào thư mục backend
cd backend

# 3. Chạy script start
start.bat
```

Done! Server sẽ chạy tại `http://localhost:5000` 🚀

