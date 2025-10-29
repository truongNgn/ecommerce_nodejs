# ============================================================================
# Docker Stack Deployment Script for E-commerce Project
# ============================================================================
# This script deploys the e-commerce application stack to Docker Swarm
# For Windows PowerShell
# ============================================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 DEPLOYING E-COMMERCE STACK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$STACK_NAME = "ecommerce"
$STACK_FILE = "docker-stack.yml"

# Function to check if command executed successfully
function Test-CommandSuccess {
    param($exitCode, $errorMessage)
    if ($exitCode -ne 0) {
        Write-Host "❌ ERROR: $errorMessage" -ForegroundColor Red
        exit 1
    }
}

# Check if Docker Swarm is initialized
Write-Host "📋 Step 1: Checking Swarm status..." -ForegroundColor Yellow
$swarmInfo = docker info --format "{{.Swarm.LocalNodeState}}" 2>$null
if ($swarmInfo -ne "active") {
    Write-Host "❌ Docker Swarm is not initialized. Run .\init-swarm.ps1 first." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker Swarm is active" -ForegroundColor Green
Write-Host ""

# Check if stack file exists
Write-Host "📋 Step 2: Checking stack file..." -ForegroundColor Yellow
$stackPath = Join-Path $PSScriptRoot $STACK_FILE
if (-Not (Test-Path $stackPath)) {
    Write-Host "❌ Stack file not found: $stackPath" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Stack file found: $STACK_FILE" -ForegroundColor Green
Write-Host ""

# Check if images are available
Write-Host "📋 Step 3: Checking required Docker images..." -ForegroundColor Yellow
$requiredImages = @(
    "ecommerce-backend:latest",
    "ecommerce-frontend:latest",
    "ecommerce-nginx:latest"
)

$missingImages = @()
foreach ($image in $requiredImages) {
    $imageExists = docker images --format "{{.Repository}}:{{.Tag}}" | Select-String -Pattern "^$image$" -Quiet
    if (-Not $imageExists) {
        $missingImages += $image
        Write-Host "⚠️  Missing image: $image" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Found image: $image" -ForegroundColor Green
    }
}

if ($missingImages.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠️  WARNING: Some images are missing!" -ForegroundColor Yellow
    Write-Host "You need to build images first:" -ForegroundColor White
    Write-Host "  cd .." -ForegroundColor Gray
    Write-Host "  docker-compose build" -ForegroundColor Gray
    Write-Host "  docker tag ecommerce-backend:latest ecommerce-backend:latest" -ForegroundColor Gray
    Write-Host "  docker tag ecommerce-frontend:latest ecommerce-frontend:latest" -ForegroundColor Gray
    Write-Host "  docker tag ecommerce-nginx:latest ecommerce-nginx:latest" -ForegroundColor Gray
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        Write-Host "❌ Deployment cancelled" -ForegroundColor Red
        exit 0
    }
}
Write-Host ""

# Check if stack already exists
Write-Host "📋 Step 4: Checking existing stack..." -ForegroundColor Yellow
$existingStack = docker stack ls --format "{{.Name}}" | Select-String -Pattern "^$STACK_NAME$" -Quiet
if ($existingStack) {
    Write-Host "⚠️  Stack '$STACK_NAME' already exists" -ForegroundColor Yellow
    $action = Read-Host "Choose action: [u]pdate, [r]emove and redeploy, [c]ancel (u/r/c)"
    
    switch ($action.ToLower()) {
        "u" {
            Write-Host "🔄 Updating existing stack..." -ForegroundColor Yellow
        }
        "r" {
            Write-Host "🗑️  Removing existing stack..." -ForegroundColor Yellow
            docker stack rm $STACK_NAME
            Write-Host "⏳ Waiting for stack removal (30 seconds)..." -ForegroundColor Yellow
            Start-Sleep -Seconds 30
            Write-Host "✅ Stack removed" -ForegroundColor Green
        }
        default {
            Write-Host "❌ Deployment cancelled" -ForegroundColor Red
            exit 0
        }
    }
}
Write-Host ""

# Deploy the stack
Write-Host "📋 Step 5: Deploying stack..." -ForegroundColor Yellow
Write-Host "Executing: docker stack deploy -c $STACK_FILE $STACK_NAME" -ForegroundColor Gray
docker stack deploy -c $stackPath $STACK_NAME
Test-CommandSuccess $LASTEXITCODE "Failed to deploy stack"
Write-Host "✅ Stack deployment initiated" -ForegroundColor Green
Write-Host ""

# Wait for services to start
Write-Host "⏳ Waiting for services to initialize (15 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15
Write-Host ""

# Show stack information
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📊 STACK DEPLOYMENT STATUS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Stack Services:" -ForegroundColor Yellow
docker stack services $STACK_NAME
Write-Host ""

Write-Host "📋 Running Tasks:" -ForegroundColor Yellow
docker stack ps $STACK_NAME --no-trunc
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Access Points:" -ForegroundColor Yellow
Write-Host "  Application:       http://localhost" -ForegroundColor White
Write-Host "  Nginx Status:      http://localhost:8080" -ForegroundColor White
Write-Host "  Swarm Visualizer:  http://localhost:9000" -ForegroundColor White
Write-Host ""
Write-Host "📊 Monitoring Commands:" -ForegroundColor Yellow
Write-Host "  docker stack services $STACK_NAME        # List services" -ForegroundColor White
Write-Host "  docker stack ps $STACK_NAME              # List tasks" -ForegroundColor White
Write-Host "  docker service logs $STACK_NAME`_backend  # View backend logs" -ForegroundColor White
Write-Host "  docker service scale $STACK_NAME`_backend=5  # Scale backend to 5 replicas" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Management Commands:" -ForegroundColor Yellow
Write-Host "  .\scale-services.ps1                     # Scale services" -ForegroundColor White
Write-Host "  .\update-service.ps1                     # Update a service" -ForegroundColor White
Write-Host "  .\remove-stack.ps1                       # Remove stack" -ForegroundColor White
Write-Host ""
