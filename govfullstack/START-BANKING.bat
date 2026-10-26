@echo off
setlocal enabledelayedexpansion
title Apex Banking Management System Launcher

echo ==========================================================
echo         APEX BANKING MANAGEMENT SYSTEM LAUNCHER
echo ==========================================================
echo Starting launcher via PowerShell...
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0START-BANKING.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo PowerShell launcher exited with code %ERRORLEVEL%.
    pause
)
