$ErrorActionPreference = "Stop"

Write-Host "`n🚀 Starting data import for Docker Swarm..." -ForegroundColor Cyan

# Get MongoDB container ID
Write-Host "`n📦 Finding MongoDB container..." -ForegroundColor Yellow
$containerId = docker ps --filter name=ecommerce_mongo --format "{{.ID}}"
if (-not $containerId) {
    Write-Host "❌ MongoDB container not found! Make sure the stack is deployed." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Found MongoDB container: $containerId" -ForegroundColor Green

# Create temp directory in container
Write-Host "`n📂 Creating temp directory in container..." -ForegroundColor Yellow
docker exec $containerId mkdir -p /tmp/db
Write-Host "✅ Temp directory created" -ForegroundColor Green

# Copy data files to container
Write-Host "`n📤 Copying data files to container..." -ForegroundColor Yellow
$sourceDir = Join-Path $PSScriptRoot "..\db"
if (-not (Test-Path $sourceDir)) {
    Write-Host "❌ Source directory not found: $sourceDir" -ForegroundColor Red
    exit 1
}
docker cp "$sourceDir/." "$($containerId):/tmp/db/"
Write-Host "✅ Files copied successfully" -ForegroundColor Green

# MongoDB connection string
$mongoUri = "mongodb://admin:password123@localhost:27017/ecommerce?authSource=admin"

# Collections to import
$collections = @(
    "users",
    "products",
    "carts",
    "orders",
    "reviews",
    "discountcodes"
)

# Import each collection
Write-Host "`n📥 Importing collections..." -ForegroundColor Yellow
foreach ($collection in $collections) {
    Write-Host "`n🔄 Importing $collection..." -ForegroundColor Cyan
    $fileName = "ecommerce.$collection.json"
    
    # Check if source file exists in container
    $fileExists = docker exec $containerId test -f "/tmp/db/$fileName" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️ File not found: $fileName - Skipping..." -ForegroundColor Yellow
        continue
    }
    
    # Import data
    $result = docker exec $containerId mongoimport --uri $mongoUri --collection $collection --file "/tmp/db/$fileName" --jsonArray 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully imported $collection" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to import $collection" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
    }
}

# Verify import
Write-Host "`n📊 Verifying imported data..." -ForegroundColor Yellow
foreach ($collection in $collections) {
    $count = docker exec $containerId mongosh $mongoUri --quiet --eval "db.$collection.count()"
    Write-Host "$($collection.PadRight(15)): $count documents" -ForegroundColor Cyan
}

# Cleanup
Write-Host "`n🧹 Cleaning up temporary files..." -ForegroundColor Yellow
docker exec $containerId rm -rf /tmp/db
Write-Host "✅ Temporary files removed" -ForegroundColor Green

Write-Host "`n✨ Import process completed!" -ForegroundColor Green
Write-Host "   Frontend: http://localhost"
Write-Host "   Backend API: http://localhost/api"
Write-Host "   Visualizer: http://localhost:9000`n"