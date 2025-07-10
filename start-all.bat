@echo off
echo Starting Genfuze.ai - Complete Application...
echo.

echo Starting Landing Page (Port 5173)...
start "Landing Page" cmd /k "cd content-genesis-optimizer-main && npm run dev"

echo Starting Main Application (Port 5174)...
start "Main App" cmd /k "cd auto_browser/project && npm run dev"

echo Starting Backend Server (Port 5000)...
start "Backend" cmd /k "cd auto_browser/project/backend && npm start"

echo.
echo All services are starting...
echo.
echo Landing Page: http://localhost:5173
echo Main App: http://localhost:5174
echo Backend API: http://localhost:5000
echo.
echo Press any key to close this window...
pause > nul 