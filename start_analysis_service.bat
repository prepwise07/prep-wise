@echo off
echo ============================================================
echo  PrepWise - Face Detection Service Installer & Launcher
echo ============================================================
echo.

:: Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Please install Python 3.9+ from https://python.org
    pause
    exit /b 1
)

echo [1/3] Upgrading pip...
python -m pip install --upgrade pip --quiet

echo [2/3] Installing dependencies (this may take a few minutes on first run)...
pip install flask flask-cors opencv-python deepface tf-keras --quiet

echo [3/3] Starting analysis service on http://localhost:5001 ...
echo.
echo  Press Ctrl+C to stop the service.
echo ============================================================
python analysis_service.py

pause
