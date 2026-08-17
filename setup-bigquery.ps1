# BigQuery Setup Script for Incident Response Dashboard
# This script configures GCP credentials and environment variables

Write-Host "================================" -ForegroundColor Cyan
Write-Host "BigQuery Setup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Define paths
$projectRoot = Split-Path -Parent $MyInvocation.MyCommandPath
$credentialsSource = "$env:APPDATA\gcloud\application_default_credentials.json"
$credentialsDestination = "$projectRoot\gcp-credentials.json"
$envFile = "$projectRoot\.env"

# Step 1: Copy credentials
Write-Host "`n[Step 1/3] Copying GCP credentials..." -ForegroundColor Yellow

if (Test-Path $credentialsSource) {
    Copy-Item $credentialsSource $credentialsDestination -Force
    Write-Host "✓ Credentials copied to: $credentialsDestination" -ForegroundColor Green
} else {
    Write-Host "✗ Credentials not found at: $credentialsSource" -ForegroundColor Red
    Write-Host "Please run 'gcloud auth application-default login' first" -ForegroundColor Yellow
    exit 1
}

# Step 2: Create/Update .env file
Write-Host "`n[Step 2/3] Creating/updating .env file..." -ForegroundColor Yellow

$envContent = @"
# BigQuery Configuration
CONNECTOR_MODE_BIGQUERY=real
GCP_PROJECT_ID=ml-mps-app-mcs-df-app-p-72d7
GOOGLE_APPLICATION_CREDENTIALS=./gcp-credentials.json

# Staging Project (optional - for cross-project queries)
GCP_STAGING_PROJECT_ID=ml-mps-app-mcs-df-app-s-bbca

# Server Configuration
SERVER_PORT=4000
CORS_ORIGIN=http://localhost:3000

# Database Configuration
# DATABASE_URL=your_database_url_here

# Auth Configuration
AUTH_JWT_SECRET=dev-insecure-secret-change-me
DEV_BYPASS_AUTH=false

# Mock Generator Interval (milliseconds)
MOCK_GENERATOR_INTERVAL_MS=8000
"@

# Check if .env already exists and backup
if (Test-Path $envFile) {
    $backup = "$envFile.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item $envFile $backup
    Write-Host "✓ Existing .env backed up to: $backup" -ForegroundColor Green
}

# Write .env file
Set-Content -Path $envFile -Value $envContent -Force
Write-Host "✓ .env file created/updated: $envFile" -ForegroundColor Green

# Step 3: Verify setup
Write-Host "`n[Step 3/3] Verifying setup..." -ForegroundColor Yellow

$checks = @(
    @{ Name = "GCP Credentials"; Path = $credentialsDestination },
    @{ Name = ".env File"; Path = $envFile }
)

$allGood = $true
foreach ($check in $checks) {
    if (Test-Path $check.Path) {
        Write-Host "✓ $($check.Name): Found" -ForegroundColor Green
    } else {
        Write-Host "✗ $($check.Name): Not found" -ForegroundColor Red
        $allGood = $false
    }
}

# Final Summary
Write-Host "`n================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "✓ Setup completed successfully!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Review the .env file: $envFile" -ForegroundColor White
    Write-Host "2. Update DATABASE_URL if needed" -ForegroundColor White
    Write-Host "3. Run 'npm install' in the project root" -ForegroundColor White
    Write-Host "4. Run 'npm run dev' to start the app" -ForegroundColor White
} else {
    Write-Host "✗ Setup encountered errors. Please fix the issues above." -ForegroundColor Red
    exit 1
}
Write-Host "================================" -ForegroundColor Cyan
