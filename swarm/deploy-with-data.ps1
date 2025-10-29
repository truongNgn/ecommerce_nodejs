# Deploy Stack va Test Auto Import Data# Deploy Stack và Test Auto Import Data

# Script nay se rebuild images va deploy stack voi data auto-import# Script này sẽ rebuild images và deploy stack với data auto-import



Write-Host "`n================================================================" -ForegroundColor CyanWrite-Host "`n╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan

Write-Host "  DEPLOY DOCKER STACK WITH AUTO IMPORT DATA" -ForegroundColor CyanWrite-Host "║                                                                    ║" -ForegroundColor Cyan

Write-Host "================================================================`n" -ForegroundColor CyanWrite-Host "║          🐳 DEPLOY DOCKER STACK WITH AUTO IMPORT DATA            ║" -ForegroundColor Cyan

Write-Host "║                                                                    ║" -ForegroundColor Cyan

# Change to project rootWrite-Host "╚════════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Set-Location $PSScriptRoot/..

# Change to project root

# Step 1: Remove old stack (if exists)Set-Location $PSScriptRoot/..

Write-Host "Step 1: Removing old stack..." -ForegroundColor Yellow

docker stack rm ecommerce 2>$null# Step 1: Remove old stack (if exists)

if ($LASTEXITCODE -eq 0) {Write-Host "📋 Step 1: Removing old stack..." -ForegroundColor Yellow

    Write-Host "   [OK] Old stack removed" -ForegroundColor Greendocker stack rm ecommerce 2>$null

    Write-Host "   Waiting 15 seconds for cleanup..." -ForegroundColor Yellowif ($LASTEXITCODE -eq 0) {

    Start-Sleep -Seconds 15    Write-Host "   ✅ Old stack removed" -ForegroundColor Green

} else {    Write-Host "   ⏳ Waiting 15 seconds for cleanup..." -ForegroundColor Yellow

    Write-Host "   [INFO] No existing stack found" -ForegroundColor Gray    Start-Sleep -Seconds 15

}} else {

    Write-Host "   ℹ️  No existing stack found" -ForegroundColor Gray

# Step 2: Build new images with updated code}

Write-Host "`nStep 2: Building Docker images..." -ForegroundColor Yellow

Write-Host "   Building backend image..." -ForegroundColor Cyan# Step 2: Build new images with updated code

docker build -t ecommerce-backend:latest ./backendWrite-Host "`n📋 Step 2: Building Docker images..." -ForegroundColor Yellow

if ($LASTEXITCODE -ne 0) {Write-Host "   🔨 Building backend image..." -ForegroundColor Cyan

    Write-Host "   [ERROR] Backend build failed!" -ForegroundColor Reddocker build -t ecommerce-backend:latest ./backend

    exit 1if ($LASTEXITCODE -ne 0) {

}    Write-Host "   ❌ Backend build failed!" -ForegroundColor Red

Write-Host "   [OK] Backend image built" -ForegroundColor Green    exit 1

}

Write-Host "   Building frontend image..." -ForegroundColor CyanWrite-Host "   ✅ Backend image built" -ForegroundColor Green

docker build -t ecommerce-frontend:latest ./frontend

if ($LASTEXITCODE -ne 0) {Write-Host "   🔨 Building frontend image..." -ForegroundColor Cyan

    Write-Host "   [ERROR] Frontend build failed!" -ForegroundColor Reddocker build -t ecommerce-frontend:latest ./frontend

    exit 1if ($LASTEXITCODE -ne 0) {

}    Write-Host "   ❌ Frontend build failed!" -ForegroundColor Red

Write-Host "   [OK] Frontend image built" -ForegroundColor Green    exit 1

}

Write-Host "   Building nginx image..." -ForegroundColor CyanWrite-Host "   ✅ Frontend image built" -ForegroundColor Green

docker build -t ecommerce-nginx:latest ./nginx

if ($LASTEXITCODE -ne 0) {Write-Host "   🔨 Building nginx image..." -ForegroundColor Cyan

    Write-Host "   [ERROR] Nginx build failed!" -ForegroundColor Reddocker build -t ecommerce-nginx:latest ./nginx

    exit 1if ($LASTEXITCODE -ne 0) {

}    Write-Host "   ❌ Nginx build failed!" -ForegroundColor Red

Write-Host "   [OK] Nginx image built" -ForegroundColor Green    exit 1

}

# Step 3: Deploy stackWrite-Host "   ✅ Nginx image built" -ForegroundColor Green

Write-Host "`nStep 3: Deploying stack..." -ForegroundColor Yellow

docker stack deploy -c swarm/docker-stack.yml ecommerce# Step 3: Deploy stack

if ($LASTEXITCODE -ne 0) {Write-Host "`n📋 Step 3: Deploying stack..." -ForegroundColor Yellow

    Write-Host "   [ERROR] Stack deployment failed!" -ForegroundColor Reddocker stack deploy -c swarm/docker-stack.yml ecommerce

    exit 1if ($LASTEXITCODE -ne 0) {

}    Write-Host "   ❌ Stack deployment failed!" -ForegroundColor Red

Write-Host "   [OK] Stack deployed successfully" -ForegroundColor Green    exit 1

}

# Step 4: Wait for services to startWrite-Host "   ✅ Stack deployed successfully" -ForegroundColor Green

Write-Host "`nStep 4: Waiting for services to start..." -ForegroundColor Yellow

Write-Host "   Waiting 30 seconds for MongoDB initialization..." -ForegroundColor Cyan# Step 4: Wait for services to start

Start-Sleep -Seconds 30Write-Host "`n📋 Step 4: Waiting for services to start..." -ForegroundColor Yellow

Write-Host "   ⏳ Waiting 30 seconds for MongoDB initialization..." -ForegroundColor Cyan

Write-Host "   Waiting 20 seconds for backend startup + auto import..." -ForegroundColor CyanStart-Sleep -Seconds 30

Start-Sleep -Seconds 20

Write-Host "   ⏳ Waiting 20 seconds for backend startup + auto import..." -ForegroundColor Cyan

# Step 5: Check service statusStart-Sleep -Seconds 20

Write-Host "`nStep 5: Checking service status..." -ForegroundColor Yellow

Write-Host ""# Step 5: Check service status

docker stack services ecommerceWrite-Host "`n📋 Step 5: Checking service status..." -ForegroundColor Yellow

Write-Host ""

# Step 6: Get backend logs to verify auto importdocker stack services ecommerce

Write-Host "`nStep 6: Checking backend logs for auto import..." -ForegroundColor Yellow

Write-Host "================================================================`n" -ForegroundColor Cyan# Step 6: Get backend logs to verify auto import

Write-Host "`n📋 Step 6: Checking backend logs for auto import..." -ForegroundColor Yellow

# Get backend container IDWrite-Host "════════════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

$backendContainerId = docker ps --filter "name=ecommerce_backend" --format "{{.ID}}" | Select-Object -First 1

# Get backend container ID

if ($backendContainerId) {$backendContainerId = docker ps --filter "name=ecommerce_backend" --format "{{.ID}}" | Select-Object -First 1

    Write-Host "Backend logs (last 50 lines):`n" -ForegroundColor Cyan

    docker logs $backendContainerId --tail 50if ($backendContainerId) {

} else {    Write-Host "📝 Backend logs (last 50 lines):`n" -ForegroundColor Cyan

    Write-Host "[WARNING] Backend container not found yet. Service might still be starting..." -ForegroundColor Yellow    docker logs $backendContainerId --tail 50

}} else {

    Write-Host "⚠️  Backend container not found yet. Service might still be starting..." -ForegroundColor Yellow

# Step 7: Test API endpoints}

Write-Host "`n================================================================`n" -ForegroundColor Cyan

Write-Host "Step 7: Testing API endpoints..." -ForegroundColor Yellow# Step 7: Test API endpoints

Write-Host "   Waiting 10 seconds for API to be ready..." -ForegroundColor CyanWrite-Host "`n════════════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Start-Sleep -Seconds 10Write-Host "📋 Step 7: Testing API endpoints..." -ForegroundColor Yellow

Write-Host "   ⏳ Waiting 10 seconds for API to be ready..." -ForegroundColor Cyan

Write-Host "`n   Testing health endpoint..." -ForegroundColor CyanStart-Sleep -Seconds 10

try {

    $health = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get -TimeoutSec 5Write-Host "`n   Testing health endpoint..." -ForegroundColor Cyan

    Write-Host "   [OK] Health check passed" -ForegroundColor Greentry {

    Write-Host "   Response: $($health | ConvertTo-Json -Compress)" -ForegroundColor Gray    $health = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get -TimeoutSec 5

} catch {    Write-Host "   ✅ Health check passed" -ForegroundColor Green

    Write-Host "   [WARNING] Health check failed: $_" -ForegroundColor Yellow    Write-Host "   Response: $($health | ConvertTo-Json -Compress)" -ForegroundColor Gray

}} catch {

    Write-Host "   ⚠️  Health check failed: $_" -ForegroundColor Yellow

Write-Host "`n   Testing products endpoint..." -ForegroundColor Cyan}

try {

    $products = Invoke-RestMethod -Uri "http://localhost:5000/api/products" -Method Get -TimeoutSec 5Write-Host "`n   Testing products endpoint..." -ForegroundColor Cyan

    Write-Host "   [OK] Products endpoint working" -ForegroundColor Greentry {

    Write-Host "   Total products: $($products.products.Length)" -ForegroundColor Gray    $products = Invoke-RestMethod -Uri "http://localhost:5000/api/products" -Method Get -TimeoutSec 5

} catch {    Write-Host "   ✅ Products endpoint working" -ForegroundColor Green

    Write-Host "   [WARNING] Products endpoint failed: $_" -ForegroundColor Yellow    Write-Host "   Total products: $($products.products.Length)" -ForegroundColor Gray

}} catch {

    Write-Host "   ⚠️  Products endpoint failed: $_" -ForegroundColor Yellow

# Final summary}

Write-Host "`n================================================================" -ForegroundColor Green

Write-Host "  DEPLOYMENT COMPLETED!" -ForegroundColor Green# Final summary

Write-Host "================================================================`n" -ForegroundColor GreenWrite-Host "`n╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green

Write-Host "║                                                                    ║" -ForegroundColor Green

Write-Host "Service URLs:" -ForegroundColor CyanWrite-Host "║                  ✅ DEPLOYMENT COMPLETED!                         ║" -ForegroundColor Green

Write-Host "   Frontend:    http://localhost:3000" -ForegroundColor WhiteWrite-Host "║                                                                    ║" -ForegroundColor Green

Write-Host "   Backend:     http://localhost:5000" -ForegroundColor WhiteWrite-Host "╚════════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "   Nginx:       http://localhost" -ForegroundColor White

Write-Host "   Visualizer:  http://localhost:8080" -ForegroundColor WhiteWrite-Host "🌐 Service URLs:" -ForegroundColor Cyan

Write-Host "   Frontend:    http://localhost:3000" -ForegroundColor White

Write-Host "`nNext steps:" -ForegroundColor CyanWrite-Host "   Backend:     http://localhost:5000" -ForegroundColor White

Write-Host "   1. Check backend logs: docker service logs ecommerce_backend" -ForegroundColor WhiteWrite-Host "   Nginx:       http://localhost" -ForegroundColor White

Write-Host "   2. Verify data imported: Open browser -> http://localhost:3000" -ForegroundColor WhiteWrite-Host "   Visualizer:  http://localhost:8080" -ForegroundColor White

Write-Host "   3. Monitor services: docker stack ps ecommerce" -ForegroundColor White

Write-Host "`n📝 Next steps:" -ForegroundColor Cyan

Write-Host "`nUseful commands:" -ForegroundColor CyanWrite-Host "   1. Check backend logs: docker service logs ecommerce_backend" -ForegroundColor White

Write-Host "   - View logs:    docker service logs ecommerce_backend -f" -ForegroundColor WhiteWrite-Host "   2. Verify data imported: Open browser -> http://localhost:3000" -ForegroundColor White

Write-Host "   - Scale up:     docker service scale ecommerce_backend=5" -ForegroundColor WhiteWrite-Host "   3. Monitor services: docker stack ps ecommerce" -ForegroundColor White

Write-Host "   - Remove stack: docker stack rm ecommerce" -ForegroundColor White

Write-Host "`n💡 Useful commands:" -ForegroundColor Cyan

Write-Host "`nHappy testing!`n" -ForegroundColor GreenWrite-Host "   - View logs:    docker service logs ecommerce_backend -f" -ForegroundColor White

Write-Host "   - Scale up:     docker service scale ecommerce_backend=5" -ForegroundColor White
Write-Host "   - Remove stack: docker stack rm ecommerce" -ForegroundColor White

Write-Host "`n🎉 Happy testing!`n" -ForegroundColor Green
