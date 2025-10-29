# ============================================================================
# Service Update Script for E-commerce Project
# ============================================================================
# This script updates services with rolling update strategy
# For Windows PowerShell
# ============================================================================

param(
    [string]$Service = "",
    [string]$Image = ""
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔄 SERVICE UPDATE TOOL" -ForegroundColor Cyan
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
    Write-Host "❌ Stack '$STACK_NAME' not found" -ForegroundColor Red
    exit 1
}

# Show current services
Write-Host "📋 Current services:" -ForegroundColor Yellow
docker stack services $STACK_NAME
Write-Host ""

# If parameters provided, use them
if ($Service -ne "" -and $Image -ne "") {
    Write-Host "🔄 Updating service: $Service with image: $Image" -ForegroundColor Yellow
    docker service update --image $Image "$STACK_NAME`_$Service"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Update initiated successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Update failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "⏳ Monitoring update progress..." -ForegroundColor Yellow
    docker service ps "$STACK_NAME`_$Service"
    exit 0
}

# Interactive mode
Write-Host "🔧 Service Update Options:" -ForegroundColor Cyan
Write-Host ""
Write-Host "[1] Update Backend Service" -ForegroundColor White
Write-Host "[2] Update Frontend Service" -ForegroundColor White
Write-Host "[3] Update Worker Service" -ForegroundColor White
Write-Host "[4] Update Nginx Service" -ForegroundColor White
Write-Host "[5] Rollback Service" -ForegroundColor White
Write-Host "[6] Force Update (Redeploy)" -ForegroundColor White
Write-Host "[q] Quit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Select option"

$serviceName = ""
$imageTag = ""

switch ($choice) {
    "1" {
        $serviceName = "backend"
        $imageTag = "ecommerce-backend:latest"
    }
    "2" {
        $serviceName = "frontend"
        $imageTag = "ecommerce-frontend:latest"
    }
    "3" {
        $serviceName = "worker"
        $imageTag = "ecommerce-backend:latest"
    }
    "4" {
        $serviceName = "nginx"
        $imageTag = "ecommerce-nginx:latest"
    }
    "5" {
        Write-Host ""
        $rollbackService = Read-Host "Enter service name to rollback (backend/frontend/worker/nginx)"
        Write-Host "🔄 Rolling back service: $rollbackService" -ForegroundColor Yellow
        docker service rollback "$STACK_NAME`_$rollbackService"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Rollback completed" -ForegroundColor Green
        } else {
            Write-Host "❌ Rollback failed" -ForegroundColor Red
        }
        exit 0
    }
    "6" {
        Write-Host ""
        $forceService = Read-Host "Enter service name to force update (backend/frontend/worker/nginx)"
        Write-Host "🔄 Force updating service: $forceService" -ForegroundColor Yellow
        docker service update --force "$STACK_NAME`_$forceService"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Force update completed" -ForegroundColor Green
        } else {
            Write-Host "❌ Force update failed" -ForegroundColor Red
        }
        exit 0
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
Write-Host "📝 Update Configuration:" -ForegroundColor Yellow
Write-Host "Service: $serviceName" -ForegroundColor White
Write-Host "Current Image: $imageTag" -ForegroundColor White
Write-Host ""

$customImage = Read-Host "Enter new image tag (or press Enter to use $imageTag)"
if ($customImage -ne "") {
    $imageTag = $customImage
}

Write-Host ""
Write-Host "⚠️  This will perform a rolling update of $serviceName" -ForegroundColor Yellow
$confirm = Read-Host "Continue? (y/n)"

if ($confirm -ne "y") {
    Write-Host "❌ Update cancelled" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🔄 Starting rolling update..." -ForegroundColor Yellow
Write-Host "Update strategy: 1 container at a time, 10s delay" -ForegroundColor Gray
Write-Host ""

# Perform the update
docker service update --image $imageTag "$STACK_NAME`_$serviceName"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Update initiated successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Update failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "⏳ Monitoring update progress..." -ForegroundColor Yellow
Write-Host ""

# Monitor update for 30 seconds
for ($i = 1; $i -le 6; $i++) {
    Write-Host "Progress check $i/6:" -ForegroundColor Gray
    docker service ps "$STACK_NAME`_$serviceName" --filter "desired-state=running"
    
    if ($i -lt 6) {
        Start-Sleep -Seconds 5
        Write-Host ""
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📊 UPDATE STATUS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Service Details:" -ForegroundColor Yellow
docker service inspect "$STACK_NAME`_$serviceName" --format "{{.Spec.TaskTemplate.ContainerSpec.Image}}"
Write-Host ""

Write-Host "📋 All Tasks:" -ForegroundColor Yellow
docker service ps "$STACK_NAME`_$serviceName" --no-trunc
Write-Host ""

Write-Host "✅ Update process completed!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "  - Check logs: docker service logs -f $STACK_NAME`_$serviceName" -ForegroundColor White
Write-Host "  - Rollback if needed: docker service rollback $STACK_NAME`_$serviceName" -ForegroundColor White
Write-Host "  - Check health: docker service ps $STACK_NAME`_$serviceName" -ForegroundColor White
Write-Host ""
