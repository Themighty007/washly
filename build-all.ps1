$apps = @("washly-customer", "washly-cleaner", "washly-admin")
$baseDir = "c:\Users\test\Downloads\workspace-f42"

foreach ($app in $apps) {
    Write-Host "Processing $app..."
    Set-Location -Path (Join-Path $baseDir $app)
    
    Write-Host "Installing plugin-legacy and terser in $app..."
    npm install -D @vitejs/plugin-legacy terser
}

Set-Location -Path $baseDir
Write-Host "Running fix-all.js..."
node fix-all.js

foreach ($app in $apps) {
    Write-Host "Building and syncing $app..."
    Set-Location -Path (Join-Path $baseDir $app)
    
    npm run build
    npx cap sync
    
    Write-Host "Building APK for $app..."
    Set-Location -Path "android"
    .\gradlew.bat assembleDebug
}
Write-Host "ALL DONE"
