@echo off
REM Enable Debug Mode for Adobe CEP Extensions on Windows
REM This allows unsigned extensions to run in After Effects

echo Adobe CEP Debug Mode Enabler for Windows
echo ========================================
echo.

echo Enabling debug mode in Windows Registry...
echo.

REM Enable for all CEP versions
for %%v in (5 6 7 8 9 10 11 12) do (
    reg add "HKCU\Software\Adobe\CSXS.%%v" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
    if errorlevel 1 (
        echo x Failed to enable debug mode for CSXS.%%v
    ) else (
        echo + Enabled debug mode for CSXS.%%v
    )
)

echo.
echo Debug mode enabled successfully!
echo.
echo You can now run unsigned CEP extensions in After Effects.
echo Please restart After Effects if it's currently running.
echo.
pause