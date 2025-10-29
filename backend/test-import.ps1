# Test Import Data Script
# Script này test chức năng import data vào MongoDB

Write-Host "`n╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                    ║" -ForegroundColor Cyan
Write-Host "║              📥 TEST IMPORT DATA TO MONGODB                       ║" -ForegroundColor Cyan
Write-Host "║                                                                    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Check if MongoDB is running
Write-Host "🔍 Checking MongoDB connection..." -ForegroundColor Yellow

try {
    # Test MongoDB connection
    $mongoTest = mongo --eval "db.version()" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ MongoDB is not running!" -ForegroundColor Red
        Write-Host "   Please start MongoDB first." -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ MongoDB is running`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Cannot connect to MongoDB!" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    exit 1
}

# Check if backup files exist
Write-Host "🔍 Checking backup files..." -ForegroundColor Yellow
$backupPath = Join-Path $PSScriptRoot "..\db"
$backupFiles = @(
    "ecommerce.users.json",
    "ecommerce.products.json",
    "ecommerce.carts.json",
    "ecommerce.orders.json",
    "ecommerce.reviews.json",
    "ecommerce.discountcodes.json"
)

$missingFiles = @()
foreach ($file in $backupFiles) {
    $filePath = Join-Path $backupPath $file
    if (!(Test-Path $filePath)) {
        $missingFiles += $file
        Write-Host "   ⚠️  Missing: $file" -ForegroundColor Red
    } else {
        Write-Host "   ✅ Found: $file" -ForegroundColor Green
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "`n❌ Missing $($missingFiles.Count) backup file(s)!" -ForegroundColor Red
    Write-Host "   Cannot proceed with import.`n" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ All backup files found!`n" -ForegroundColor Green

# Ask user for confirmation
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "⚠️  WARNING: This will import data into MongoDB database" -ForegroundColor Yellow
Write-Host "   Database: ecommerce" -ForegroundColor Yellow
Write-Host "   Collections: users, products, carts, orders, reviews, discountcodes" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

$confirm = Read-Host "Do you want to proceed? (y/n)"

if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "`n❌ Import cancelled by user.`n" -ForegroundColor Red
    exit 0
}

# Run import script
Write-Host "`n🚀 Starting import process...`n" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

try {
    # Change to backend directory
    Set-Location $PSScriptRoot

    # Run import script
    node import-data.js

    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n════════════════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host "✅ Import completed successfully!" -ForegroundColor Green
        Write-Host "════════════════════════════════════════════════════════════════════`n" -ForegroundColor Green

        Write-Host "📝 Next steps:" -ForegroundColor Cyan
        Write-Host "   1. Start backend:  npm start" -ForegroundColor White
        Write-Host "   2. Start frontend: cd ../frontend && npm start" -ForegroundColor White
        Write-Host "   3. Open browser:   http://localhost:3000`n" -ForegroundColor White
    } else {
        Write-Host "`n❌ Import failed with exit code: $LASTEXITCODE`n" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "`n❌ Error during import:" -ForegroundColor Red
    Write-Host "   $_`n" -ForegroundColor Red
    exit 1
}

# Optional: Verify import
Write-Host "════════════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan
$verify = Read-Host "Do you want to verify the import? (y/n)"

if ($verify -eq 'y' -or $verify -eq 'Y') {
    Write-Host "`n🔍 Verifying import...`n" -ForegroundColor Yellow

    # Count documents in each collection
    Write-Host "📊 Document counts:" -ForegroundColor Cyan
    
    $collections = @("users", "products", "carts", "orders", "reviews", "discountcodes")
    
    foreach ($collection in $collections) {
        try {
            $count = mongo ecommerce --quiet --eval "db.$collection.count()" 2>&1
            Write-Host "   $collection`.PadRight(20) : $count documents" -ForegroundColor White
        } catch {
            Write-Host "   $collection`.PadRight(20) : Error getting count" -ForegroundColor Red
        }
    }

    Write-Host "`n✅ Verification complete!`n" -ForegroundColor Green
}

Write-Host "════════════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan
Write-Host "🎉 All done! Happy coding!`n" -ForegroundColor Green
