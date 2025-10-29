# ============================================================================
# Stack Removal Script for E-commerce Project
# ============================================================================
# This script removes the Docker Swarm stack and optionally cleans up resources
# For Windows PowerShell
# ============================================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🗑️  STACK REMOVAL TOOL" -ForegroundColor Cyan
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
    Write-Host "⚠️  Stack '$STACK_NAME' not found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Available stacks:" -ForegroundColor Yellow
    docker stack ls
    exit 0
}

Write-Host "📋 Current stack services:" -ForegroundColor Yellow
docker stack services $STACK_NAME
Write-Host ""

Write-Host "⚠️  WARNING: This will remove the '$STACK_NAME' stack" -ForegroundColor Yellow
Write-Host ""
Write-Host "Options:" -ForegroundColor Cyan
Write-Host "[1] Remove stack only (preserve data volumes)" -ForegroundColor White
Write-Host "[2] Remove stack and clean volumes (⚠️  DATA LOSS)" -ForegroundColor White
Write-Host "[3] Remove stack, volumes, and leave Swarm" -ForegroundColor White
Write-Host "[q] Cancel" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Select option"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🗑️  Removing stack (preserving volumes)..." -ForegroundColor Yellow
        docker stack rm $STACK_NAME
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Stack removal initiated" -ForegroundColor Green
            Write-Host ""
            Write-Host "⏳ Waiting for complete removal (30 seconds)..." -ForegroundColor Yellow
            Start-Sleep -Seconds 30
            
            Write-Host "✅ Stack removed successfully" -ForegroundColor Green
            Write-Host ""
            Write-Host "📊 Remaining resources:" -ForegroundColor Yellow
            Write-Host "Volumes:" -ForegroundColor White
            docker volume ls --filter "name=$STACK_NAME"
        } else {
            Write-Host "❌ Failed to remove stack" -ForegroundColor Red
            exit 1
        }
    }
    "2" {
        Write-Host ""
        Write-Host "⚠️  WARNING: This will DELETE all data!" -ForegroundColor Red
        $confirm = Read-Host "Type 'DELETE' to confirm"
        
        if ($confirm -ne "DELETE") {
            Write-Host "❌ Cancelled" -ForegroundColor Red
            exit 0
        }
        
        Write-Host ""
        Write-Host "🗑️  Removing stack..." -ForegroundColor Yellow
        docker stack rm $STACK_NAME
        
        Write-Host "⏳ Waiting for stack removal (30 seconds)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 30
        
        Write-Host "🗑️  Removing volumes..." -ForegroundColor Yellow
        docker volume ls --filter "name=$STACK_NAME" --format "{{.Name}}" | ForEach-Object {
            Write-Host "  Removing volume: $_" -ForegroundColor Gray
            docker volume rm $_ 2>$null
        }
        
        Write-Host "✅ Stack and volumes removed" -ForegroundColor Green
    }
    "3" {
        Write-Host ""
        Write-Host "⚠️  WARNING: This will remove stack, volumes, and leave Swarm!" -ForegroundColor Red
        $confirm = Read-Host "Type 'LEAVE' to confirm"
        
        if ($confirm -ne "LEAVE") {
            Write-Host "❌ Cancelled" -ForegroundColor Red
            exit 0
        }
        
        Write-Host ""
        Write-Host "🗑️  Removing stack..." -ForegroundColor Yellow
        docker stack rm $STACK_NAME
        
        Write-Host "⏳ Waiting for stack removal (30 seconds)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 30
        
        Write-Host "🗑️  Removing volumes..." -ForegroundColor Yellow
        docker volume ls --filter "name=$STACK_NAME" --format "{{.Name}}" | ForEach-Object {
            Write-Host "  Removing volume: $_" -ForegroundColor Gray
            docker volume rm $_ 2>$null
        }
        
        Write-Host "🚪 Leaving Docker Swarm..." -ForegroundColor Yellow
        docker swarm leave --force
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Left Swarm successfully" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Failed to leave Swarm (may already be left)" -ForegroundColor Yellow
        }
        
        Write-Host "✅ Complete cleanup finished" -ForegroundColor Green
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
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ OPERATION COMPLETED" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Show remaining resources
Write-Host "📊 Remaining Swarm resources:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Stacks:" -ForegroundColor White
docker stack ls 2>$null
Write-Host ""
Write-Host "Services:" -ForegroundColor White
docker service ls 2>$null
Write-Host ""
Write-Host "Networks:" -ForegroundColor White
docker network ls --filter "name=$STACK_NAME" 2>$null
Write-Host ""
