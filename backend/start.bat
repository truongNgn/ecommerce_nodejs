@echo off
echo Starting TechStore Backend Server...
echo.

REM Server Configuration
set NODE_ENV=development
set PORT=5000

REM Database Configuration
set MONGODB_URI=mongodb://localhost:27017/ecommerce

REM JWT Configuration
set JWT_SECRET=8d5b9f7c3edsadfs3312fs3
set JWT_REFRESH_SECRET=8d5b9f7c3eds8d5b9f7c3edsadfs3312fs3adfs3312fs3
set JWT_EXPIRE=15m
set JWT_REFRESH_EXPIRE=7d

REM Email Configuration
set EMAIL_HOST=smtp.gmail.com
set EMAIL_PORT=587
set EMAIL_USER=namhuynhfree@gmail.com
set EMAIL_PASS=lyyf efca nern dguc

REM CORS Configuration
set CLIENT_URL=http://localhost:3000

REM Rate Limiting
set RATE_LIMIT_WINDOW_MS=900000
set RATE_LIMIT_MAX_REQUESTS=1000

echo ================================
echo Environment Variables Configured:
echo ================================
echo NODE_ENV: %NODE_ENV%
echo PORT: %PORT%
echo MONGODB_URI: %MONGODB_URI%
echo CLIENT_URL: %CLIENT_URL%
echo EMAIL_USER: %EMAIL_USER%
echo EMAIL_HOST: %EMAIL_HOST%
echo ================================
echo.
echo Starting server...
echo.

node server.js

