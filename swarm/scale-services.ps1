# ============================================================================
# Service Scaling Script for E-commerce Project
# ============================================================================
# This script scales services in the Docker Swarm stack
# For Windows PowerShell
# ============================================================================

param(
    [string]$Service = "",
    [int]$Replicas = 0
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📊 SERVICE SCALING TOOL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$STACK_NAME = "ecommerce"

# Check if Swarm is active
$swarmInfo = docker info --format "{{.Swarm.LocalNodeState}}" 2>$null
if ($swarmInfo -ne "active") {
    Write-Host "❌ Docker Swarm is not active" -ForegroundColor Red
    exit 1
}

# Check if stack exists
$stackExists = docker stack ls --format "{{.Name}}" | Select-String -Pattern "^$STACK_NAME$" -Quiet
if (-Not $stackExists) {
    Write-Host "❌ Stack '$STACK_NAME' not found. Deploy the stack first." -ForegroundColor Red
    exit 1
}

# Function to scale service
function Scale-Service {
    param($serviceName, $replicaCount)
    
    Write-Host "🔄 Scaling $serviceName to $replicaCount replicas..." -ForegroundColor Yellow
    docker service scale "$STACK_NAME`_$serviceName=$replicaCount" 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $serviceName scaled successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to scale $serviceName" -ForegroundColor Red
    }
}

# If service and replicas provided via parameters
if ($Service -ne "" -and $Replicas -gt 0) {
    Scale-Service $Service $Replicas
    Write-Host ""
    Write-Host "📋 Current service status:" -ForegroundColor Yellow
    docker service ls --filter "name=$STACK_NAME`_$Service"
    exit 0
}

# Interactive mode
Write-Host "📋 Current services:" -ForegroundColor Yellow
docker stack services $STACK_NAME
Write-Host ""

Write-Host "📝 Recommended scaling configurations:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Development Testing (Minimal)" -ForegroundColor Yellow
Write-Host "   - Backend:  1 replica" -ForegroundColor White
Write-Host "   - Frontend: 1 replica" -ForegroundColor White
Write-Host "   - Worker:   1 replica" -ForegroundColor White
Write-Host ""
Write-Host "2. Production Load (Balanced)" -ForegroundColor Yellow
Write-Host "   - Backend:  3 replicas" -ForegroundColor White
Write-Host "   - Frontend: 2 replicas" -ForegroundColor White
Write-Host "   - Worker:   2 replicas" -ForegroundColor White
Write-Host ""
Write-Host "3. High Traffic (Maximum)" -ForegroundColor Yellow
Write-Host "   - Backend:  5 replicas" -ForegroundColor White
Write-Host "   - Frontend: 3 replicas" -ForegroundColor White
Write-Host "   - Worker:   3 replicas" -ForegroundColor White
Write-Host ""

Write-Host "Choose a preset or manual:" -ForegroundColor Cyan
Write-Host "[1] Development Testing" -ForegroundColor White
Write-Host "[2] Production Load (Recommended)" -ForegroundColor White
Write-Host "[3] High Traffic" -ForegroundColor White
Write-Host "[4] Manual Configuration" -ForegroundColor White
Write-Host "[q] Quit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Select option"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🔄 Applying Development configuration..." -ForegroundColor Yellow
        Scale-Service "backend" 1
        Scale-Service "frontend" 1
        Scale-Service "worker" 1
    }
    "2" {
        Write-Host ""
        Write-Host "🔄 Applying Production configuration..." -ForegroundColor Yellow
        Scale-Service "backend" 3
        Scale-Service "frontend" 2
        Scale-Service "worker" 2
    }
    "3" {
        Write-Host ""
        Write-Host "🔄 Applying High Traffic configuration..." -ForegroundColor Yellow
        Scale-Service "backend" 5
        Scale-Service "frontend" 3
        Scale-Service "worker" 3
    }
    "4" {
        Write-Host ""
        Write-Host "📝 Manual Configuration:" -ForegroundColor Yellow
        Write-Host ""
        
        $backendReplicas = Read-Host "Backend replicas (current: press Enter to skip)"
        if ($backendReplicas -match '^\d+$' -and [int]$backendReplicas -gt 0) {
            Scale-Service "backend" ([int]$backendReplicas)
        }
        
        $frontendReplicas = Read-Host "Frontend replicas (current: press Enter to skip)"
        if ($frontendReplicas -match '^\d+$' -and [int]$frontendReplicas -gt 0) {
            Scale-Service "frontend" ([int]$frontendReplicas)
        }
        
        $workerReplicas = Read-Host "Worker replicas (current: press Enter to skip)"
        if ($workerReplicas -match '^\d+$' -and [int]$workerReplicas -gt 0) {
            Scale-Service "worker" ([int]$workerReplicas)
        }
    }
    "q" {
        Write-Host "❌ Cancelled" -ForegroundColor Red
        exit 0
    }
    default {
        Write-Host "❌ Invalid option" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "⏳ Waiting for services to scale (10 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📊 UPDATED SERVICE STATUS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
docker stack services $STACK_NAME

Write-Host ""
Write-Host "📋 Task Distribution:" -ForegroundColor Yellow
docker stack ps $STACK_NAME --filter "desired-state=running"

Write-Host ""
Write-Host "✅ Scaling completed!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "  - Monitor logs: docker service logs -f $STACK_NAME`_backend" -ForegroundColor White
Write-Host "  - View stats: docker stats" -ForegroundColor White
Write-Host "  - Check health: docker service ps $STACK_NAME`_backend" -ForegroundColor White
Write-Host ""
