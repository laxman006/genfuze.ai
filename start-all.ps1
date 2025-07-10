Write-Host "Starting Genfuze.ai - Complete Application..." -ForegroundColor Green
Write-Host ""

Write-Host "Starting Landing Page (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd content-genesis-optimizer-main; npm run dev"

Write-Host "Starting Main Application (Port 5174)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd auto_browser/project; npm run dev"

Write-Host "Starting Backend Server (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd auto_browser/project/backend; npm start"

Write-Host ""
Write-Host "All services are starting..." -ForegroundColor Green
Write-Host ""
Write-Host "Landing Page: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Main App: http://localhost:5174" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray
Read-Host 