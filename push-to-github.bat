@echo off
setlocal
if "%~1"=="" (
  echo Usage: push-to-github.bat YOUR_REPO_URL
  echo Example: push-to-github.bat https://github.com/YourUsername/SS-Tournaments.git
  exit /b 1
)
set REPO=%~1
cd /d "%~dp0"
"C:\Program Files\Git\bin\git.exe" remote remove origin 2>nul
"C:\Program Files\Git\bin\git.exe" remote add origin %REPO%
"C:\Program Files\Git\bin\git.exe" push -u origin main
echo.
echo Next: On GitHub go to Settings - Pages - Source: GitHub Actions
pause
