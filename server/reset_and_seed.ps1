# Stop on errors
$ErrorActionPreference = "Stop"

Write-Host "Removing old database..." -ForegroundColor Cyan
# Check if database exists and remove it
$dbPath = Join-Path -Path (Get-Location).Path -ChildPath "../data/kickmates.db"
if (Test-Path $dbPath) {
    Remove-Item $dbPath -Force
    Write-Host "Existing database removed." -ForegroundColor Green
} else {
    Write-Host "No existing database found." -ForegroundColor Yellow
}

Write-Host "Creating database schema..." -ForegroundColor Cyan
# Create database schema
npm run db:setup

Write-Host "Seeding database..." -ForegroundColor Cyan
# Seed database with sample data
npm run seed

Write-Host "Database reset and seeded successfully!" -ForegroundColor Green 