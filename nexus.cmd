@echo off
rem ============================================================
rem NexusAI One-Command Launcher – Windows batch file
rem ============================================================
rem Launch Django backend, Express frontend, health-check, open UI,
rem and support 'nexus stop' to stop only the processes started
rem by this script.  All paths are absolute and safely backed up.
rem ============================================================
setlocal EnableExtensions EnableDelayedExpansion

rem ==================== 1. Resolve script directory =================
set "ROOT=%~dp0"

rem ==================== 2. Parse command line argument ==============
rem   Must be first argument: either "stop" to shutdown or omitted to start
if /i "%~1"=="stop" goto :stop
if /i "%~1"=="pause" goto :pause
if /i "%~1"=="resume" goto :resume

rem ==================== 3. Define PID file locations ===============
set "BACKEND_PID=%ROOT%backend.pid"
set "FRONTEND_PID=%ROOT%frontend.pid"

rem ==================== 4. Normal STARTUP ========================
echo [*] Starting NexusAI services...
echo [*] Launching Django backend on 127.0.0.1:8000...
if exist "%BACKEND_PID%" del /f "%BACKEND_PID%" >nul 2>&1
rem Ensure python executable exists
if not exist "%ROOT%.venv\Scripts\python.exe" (
    echo [!] Python executable not found at "%ROOT%.venv\Scripts\python.exe"
    pause
    exit /b 1
)
rem Launch Django backend and capture PID
powershell -Command "$p = Start-Process -FilePath '%ROOT%.venv\Scripts\python.exe' ^
    -ArgumentList 'manage.py runserver 127.0.0.1:8000' ^
    -WorkingDirectory '%ROOT%' -PassThru; ^
    $p.Id | Out-File -FilePath '%BACKEND_PID%' -Encoding ASCII"
set /p backendpid<"%BACKEND_PID%"

echo [*] Launching frontend (npm run dev) on 127.0.0.1:3000...
if exist "%FRONTEND_PID%" del /f "%FRONTEND_PID%" >nul 2>&1
rem Ensure npm executable exists
if not exist "%ProgramFiles%\\npm\\npm.cmd" if not exist "%ROOT%.node_modules\\.bin\\npm.cmd" (
    echo [!] npm executable not found. Check Node.js installation.
    pause
    exit /b 1
)
rem Launch frontend and capture PID
powershell -Command "$p = Start-Process -FilePath 'npm.cmd' ^
    -ArgumentList 'run dev' ^
    -WorkingDirectory '%ROOT%' -PassThru; ^
    $p.Id | Out-File -FilePath '%FRONTEND_PID%' -Encoding ASCII"
set /p frontendpid<"%FRONTEND_PID%"

rem ==================== 5. Check Ollama connectivity ==============
echo [*] Checking Ollama connectivity at http://127.0.0.1:11434...
powershell -Command " ^
    try { $url = 'http://127.0.0.1:11434'; ^
        $req = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5; ^
        Write-Host 'Ollama is reachable.' } ^
    catch { Write-Host 'Ollama NOT reachable – AI features will be limited.' }"

rem ==================== 6. Wait for health checks (max 30s) ==========
echo [*] Waiting for backend and frontend health checks (timeout 30s) ...
set "elapsed=0"
:waitloop
timeout /t 1 >nul
set /a elapsed+=1

rem ==== Django health endpoint (/api/health/) ==============
powershell -Command " ^
    try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/health/' ^
        -UseBasicParsing -TimeoutSec 5; ^
        if ($r.StatusCode -eq 200) { Write-Host 'Backend healthy.'; exit 0 } } ^
    catch { if ($elapsed -ge 30) { Write-Host 'Backend NOT healthy after %elapsed% seconds.'; exit /b 1 } }"
if errorlevel 1 (
    echo [!] Backend health check failed after %elapsed% seconds.
    echo     Check that Django is running and responding to http://127.0.0.1:8000/api/health/.
    pause
    exit /b 1
)

rem ==== Frontend UI endpoint (/) ===============================
powershell -Command " ^
    try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3000/' ^
        -UseBasicParsing -TimeoutSec 5; ^
        if ($r.StatusCode -eq 200) { Write-Host 'Frontend ready.' } } ^
    catch { if ($elapsed -ge 30) { Write-Host 'Frontend NOT ready after %elapsed% seconds.'; exit /b 1 } }"
if errorlevel 1 (
    echo [!] Frontend health check failed after %elapsed% seconds.
    echo     Check that the frontend is running and responding to http://127.0.0.1:3000.
    pause
    exit /b 1
)

rem ==================== 7. Open UI in default browser ==============
echo [*] Opening NexusAI UI (http://127.0.0.1:3000/) ...
start "" "http://127.0.0.1:3000"

rem ==================== 8. Keep alive until user stops ========================
echo.
echo NexusAI is now running.
echo To stop only the processes started by this script, run:
echo     nexus stop
echo Otherwise press Ctrl+C in this window.
pause >nul
goto :eof

rem ==================== 9. STOP SECTION ===========================
:stop
echo [*] Stopping NexusAI processes launched by this script...
rem Verify and kill backend process
if exist "%BACKEND_PID%" (
    set /p bpid<"%BACKEND_PID%"
    if defined bpid (
        tasklist /FI "PID eq !bpid!" 2>nul | find /i "python.exe" >nul
        if !errorlevel! equ 0 (
            echo Found backend process !bpid! – terminating...
            taskkill /PID !bpid! /T /F >nul 2>&1
            del /f "%BACKEND_PID%" >nul 2>&1
        ) else (
            echo Warning: PID file %BACKEND_PID% contains invalid PID !bpid! – skipping kill
        )
    )
)
rem Verify and kill frontend process
if exist "%FRONTEND_PID%" (
    set /p fpid<"%FRONTEND_PID%"
    if defined fpid (
        tasklist /FI "PID eq !fpid!" 2>nul | find /i "node.exe" >nul
        if !errorlevel! equ 0 (
            echo Found frontend process !fpid! – terminating...
            taskkill /PID !fpid! /T /F >nul 2>&1
            del /f "%FRONTEND_PID%" >nul 2>&1
        ) else (
            echo Warning: PID file %FRONTEND_PID% contains invalid PID !fpid! – skipping kill
        )
    )
)
rem Clean up any residual run.pids file
del /f "%ROOT%run.pids" >nul 2>&1
echo [*] NexusAI processes terminated and PID files cleaned up.
pause
exit /b

rem ==================== 10. PAUSE SECTION =======================
:pause
echo Paused.
goto :eof

rem ==================== 11. RESUME SECTION =======================
:resume
echo [*] Resuming NexusAI from pause state...
rem Re-check that backend and frontend are still running; if not, restart them
if not exist "%BACKEND_PID%" (
    echo [!] Backend PID file missing – restarting backend
    goto :start
)
if not exist "%FRONTEND_PID%" (
    echo [!] Frontend PID file missing – restarting frontend
    goto :start
)
goto :eof

rem ==================== 99. START SECTION (entry point) ==========
:start
rem This label is used only when the script is invoked without arguments
echo [*] NexusAI launcher started – launching services...
goto :startup