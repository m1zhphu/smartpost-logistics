@echo off
set BASE_DIR=%~dp0
echo ========================================================
echo   KHOI CHAY HE THONG SMARTPOST LOGISTICS (MVP)
echo ========================================================

:: 1. Khoi chay Redis (Chay ngam)
echo [*] Dang khoi chay Redis Server...
start "" /b "%BASE_DIR%redis_bin\redis-server.exe" "%BASE_DIR%redis_bin\redis.windows.conf"
timeout /t 2 >nul

:: 2. Khoi chay Backend FastAPI
echo [*] Dang khoi chay Backend API (Uvicorn)...
start "SmartPost Backend" cmd /k "cd /d %BASE_DIR%backend && .\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

:: 3. Khoi chay Frontend Vue
echo [*] Dang thiet lap Node.js va khoi chay Frontend (Vite)...
start "SmartPost Frontend" cmd /k "nvm use 22.14.0 && cd /d %BASE_DIR%frontend && npm run dev"

:: 4. Khoi chay Mobile App Expo
echo [*] Dang khoi chay Mobile App (Expo)...
start "SmartPost Mobile" cmd /k "cd /d %BASE_DIR%mobile && npm run start"

echo ========================================================
echo   DA KHOI CHAY TAT CA CAC DICH VU:
echo   - Redis: Port 6379 (Chay ngam)
echo   - Backend: http://localhost:8000
echo   - Frontend: http://localhost:5173
echo   - Mobile Expo: http://localhost:8081
echo ========================================================
pause
