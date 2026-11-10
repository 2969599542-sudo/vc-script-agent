@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
if errorlevel 1 (
  echo Installation did not finish. Please read the error above.
  pause
  exit /b 1
)
pause
