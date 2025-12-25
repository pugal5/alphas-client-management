# PowerShell script to generate JWT secrets for Windows
# Run: powershell -ExecutionPolicy Bypass -File scripts/generate-secrets.ps1

Write-Host "🔐 Generating JWT Secrets for Render..." -ForegroundColor Cyan
Write-Host ""

$jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
$jwtRefreshSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

Write-Host "Copy these to your Render environment variables:" -ForegroundColor Yellow
Write-Host ""
Write-Host "JWT_SECRET=$jwtSecret" -ForegroundColor Green
Write-Host "JWT_REFRESH_SECRET=$jwtRefreshSecret" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Done! Paste these into Render's environment variables." -ForegroundColor Cyan

