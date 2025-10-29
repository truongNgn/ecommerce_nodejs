# ============================================================================
# Docker Swarm Initialization Script for E-commerce Project - V2
# ============================================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 E-COMMERCE DOCKER SWARM SETUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "📋 Step 1: Checking Docker status..." -ForegroundColor Yellow
docker info 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker is running" -ForegroundColor Green
Write-Host ""

# Initialize Swarm
Write-Host "📋 Step 2: Checking Swarm status..." -ForegroundColor Yellow
$swarmInfo = docker info --format '{{.Swarm.LocalNodeState}}' 2>$null

if ($swarmInfo -eq "active") {
    Write-Host "⚠️  Swarm is already initialized" -ForegroundColor Yellow
} else {
    Write-Host "🔧 Initializing Docker Swarm..." -ForegroundColor Yellow
    docker swarm init
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker Swarm initialized successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to initialize Docker Swarm" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Create secrets
Write-Host "📋 Step 3: Creating Docker secrets..." -ForegroundColor Yellow
$secretsDir = Join-Path $PSScriptRoot "secrets"

if (-Not (Test-Path $secretsDir)) {
    Write-Host "❌ Secrets directory not found: $secretsDir" -ForegroundColor Red
    exit 1
}

# List of secrets to create
$secrets = @("db_password", "jwt_secret", "email_user", "email_password")
$secretsCreated = 0
$secretsSkipped = 0

foreach ($secretName in $secrets) {
    $secretFile = Join-Path $secretsDir "$secretName.txt"
    
    if (-Not (Test-Path $secretFile)) {
        Write-Host "⚠️  Secret file not found: $secretFile" -ForegroundColor Yellow
        continue
    }
    
    # Check if secret already exists
    $existingSecret = docker secret ls --filter "name=$secretName" --format "{{.Name}}" 2>$null
    
    if ($existingSecret -eq $secretName) {
        Write-Host "⏭️  Secret '$secretName' already exists, skipping..." -ForegroundColor Yellow
        $secretsSkipped++
    } else {
        Write-Host "📝 Creating secret: $secretName" -ForegroundColor Cyan
        docker secret create $secretName $secretFile 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Secret '$secretName' created" -ForegroundColor Green
            $secretsCreated++
        } else {
            Write-Host "  ❌ Failed to create secret '$secretName'" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "  • Secrets created: $secretsCreated" -ForegroundColor White
Write-Host "  • Secrets skipped: $secretsSkipped" -ForegroundColor White
Write-Host ""

# List all secrets
Write-Host "📋 Step 4: Listing Docker secrets..." -ForegroundColor Yellow
docker secret ls
Write-Host ""

# Success message
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ SWARM SETUP COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Review secrets in ./secrets/ directory" -ForegroundColor White
Write-Host "2. Deploy stack: .\deploy-stack.ps1" -ForegroundColor White
Write-Host ""

Write-Host "📊 Useful Commands:" -ForegroundColor Yellow
Write-Host "  docker node ls        # List Swarm nodes" -ForegroundColor White
Write-Host "  docker secret ls      # List secrets" -ForegroundColor White
Write-Host "  docker stack ls       # List stacks" -ForegroundColor White
Write-Host ""
