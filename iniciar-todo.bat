@echo off
echo ============================================================
echo    Hospital Senyor de Malta - Iniciando sistema...
echo ============================================================
echo.

:: Verificar que existen las carpetas
if not exist "%~dp0backend\venv\Scripts\activate.bat" (
    echo ERROR: No se encontro el entorno virtual del backend.
    echo Crea el venv primero: cd backend ^& python -m venv venv ^& venv\Scripts\pip install -r requirements.txt
    pause
    exit /b 1
)

if not exist "%~dp0frontend\node_modules" (
    echo ERROR: No se encontran las dependencias del frontend.
    echo Instalalas primero: cd frontend ^& npm install
    pause
    exit /b 1
)

:: Iniciar backend
echo [1/2] Iniciando backend Django en puerto 8000...
start "Hospital Backend" cmd /k "cd /d %~dp0backend && venv\Scripts\activate && python manage.py runserver 8000"

:: Esperar un momento para que el backend arranque
timeout /t 3 >nul

:: Iniciar frontend
echo [2/2] Iniciando frontend Vite en puerto 5173...
start "Hospital Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

:: Esperar y abrir el navegador
echo.
echo Esperando que los servicios arranquen...
timeout /t 5 >nul

echo Abriendo http://localhost:5173 en el navegador...
start http://localhost:5173

echo.
echo Sistema iniciado. Puedes cerrar esta ventana.
echo - Backend:  http://localhost:8000/graphql/
echo - Frontend: http://localhost:5173
echo.
