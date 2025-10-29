@echo off
echo Stopping any running Node.js processes...
taskkill /f /im node.exe 2>nul || echo No node processes to kill

echo Waiting 2 seconds...
timeout /t 2 /nobreak >nul

echo Starting backend server...
set JWT_SECRET=your-super-secret-jwt-key-here
set JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
set MONGODB_URI=mongodb://localhost:27017/ecommerce
set NODE_ENV=development
set PORT=5000
set CLIENT_URL=http://localhost:3000
set EMAIL_USER=your-email@gmail.com
set EMAIL_PASS=your-app-password

node server.js
