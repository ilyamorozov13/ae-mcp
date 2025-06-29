@echo off
REM AE-MCP Pro Package Builder for Windows

echo Building AE-MCP Pro Package for Windows...

REM Configuration
set VERSION=1.0.0
set PRODUCT_NAME=AE-MCP-Pro
set BUILD_DIR=.\build
set DIST_DIR=.\dist
set PKG_DIR=%DIST_DIR%\%PRODUCT_NAME%-v%VERSION%

REM Clean previous builds
if exist %BUILD_DIR% rmdir /s /q %BUILD_DIR%
if exist %DIST_DIR% rmdir /s /q %DIST_DIR%
mkdir %BUILD_DIR%
mkdir %PKG_DIR%

REM Step 1: Build MCP Server
echo Building MCP Server...
cd ..
call npm install
call npm run build

REM Step 2: Create standalone executable using pkg
echo Creating standalone executable...
call npm install -g pkg
call pkg . --targets node18-win-x64 --output %BUILD_DIR%\ae-mcp-server.exe

REM Step 3: Copy CEP Extension
echo Copying CEP Extension...
xcopy /E /I cep-extension distribution\%PKG_DIR%\cep-extension

REM Step 4: Create installer batch file
echo Creating installer scripts...

(
echo @echo off
echo echo AE-MCP Pro Installer
echo echo ====================
echo echo.
echo.
echo REM Check for admin rights
echo net session ^>nul 2^>^&1
echo if %%errorLevel%% neq 0 ^(
echo     echo This installer requires administrator privileges.
echo     echo Please right-click and select "Run as administrator"
echo     pause
echo     exit /b 1
echo ^)
echo.
echo REM Create directories
echo echo Creating directories...
echo mkdir "C:\Program Files\AE-MCP-Pro" 2^>nul
echo mkdir "%%APPDATA%%\Adobe\CEP\extensions" 2^>nul
echo.
echo REM Copy MCP Server
echo echo Installing MCP Server...
echo copy /Y "ae-mcp-server.exe" "C:\Program Files\AE-MCP-Pro\"
echo.
echo REM Copy CEP Extension
echo echo Installing After Effects Extension...
echo xcopy /E /I /Y "cep-extension" "%%APPDATA%%\Adobe\CEP\extensions\ae-mcp"
echo.
echo REM Enable CEP Debug Mode
echo echo Configuring After Effects...
echo reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.12" /v PlayerDebugMode /t REG_SZ /d 1 /f
echo reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f
echo reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.10" /v PlayerDebugMode /t REG_SZ /d 1 /f
echo.
echo REM Create uninstaller
echo echo Creating uninstaller...
echo ^(
echo echo @echo off
echo echo echo Uninstalling AE-MCP Pro...
echo echo rmdir /s /q "C:\Program Files\AE-MCP-Pro"
echo echo rmdir /s /q "%%%%APPDATA%%%%\Adobe\CEP\extensions\ae-mcp"
echo echo echo AE-MCP Pro has been uninstalled.
echo echo pause
echo ^) ^> "C:\Program Files\AE-MCP-Pro\uninstall.bat"
echo.
echo echo.
echo echo Installation complete!
echo echo.
echo echo Next steps:
echo echo 1. Restart After Effects
echo echo 2. Go to Window ^> Extensions ^> AE-MCP
echo echo 3. Configure your AI assistant ^(see INSTALLATION_GUIDE.md^)
echo echo.
echo pause
) > distribution\%PKG_DIR%\install-windows.bat

REM Step 5: Copy documentation
echo Copying documentation...
copy distribution\INSTALLATION_GUIDE.md %PKG_DIR%\
copy ..\README.md %PKG_DIR%\README-ORIGINAL.md

REM Create product README
(
echo AE-MCP Pro v%VERSION%
echo ===================
echo.
echo Thank you for purchasing AE-MCP Pro!
echo.
echo Quick Start:
echo 1. Right-click install-windows.bat and select "Run as administrator"
echo 2. Open After Effects
echo 3. Configure your AI assistant ^(see INSTALLATION_GUIDE.md^)
echo.
echo Support: support@aemcppro.com
echo.
echo Your license key has been sent to your email.
) > %PKG_DIR%\README.txt

REM Step 6: Copy server files
echo Copying server executable...
copy %BUILD_DIR%\ae-mcp-server.exe %PKG_DIR%\

REM Step 7: Create examples directory
echo Creating examples...
mkdir %PKG_DIR%\examples
(
echo // Example 1: Create a simple animation
echo "Create a new composition called 'Logo Animation' that's 1920x1080, 30fps, 5 seconds long"
echo "Add a text layer with the text 'HELLO WORLD'"
echo "Animate the text sliding in from the left over 1 second"
echo.
echo // Example 2: Batch operations
echo "Create 10 shape layers with random colors"
echo "Arrange them in a grid pattern"
echo "Add a wiggle expression to their position"
echo.
echo // Example 3: Complex workflow
echo "Import all PNG files from my desktop"
echo "Create a composition for each image"
echo "Add a fade in and fade out to each comp"
echo "Add all comps to the render queue"
) > %PKG_DIR%\examples\basic-automation.txt

REM Step 8: Create ZIP archive
echo Creating ZIP archive...
cd %DIST_DIR%
powershell Compress-Archive -Path "%PRODUCT_NAME%-v%VERSION%" -DestinationPath "%PRODUCT_NAME%-v%VERSION%-windows.zip"
cd ..

echo.
echo Build complete!
echo Package location: %PKG_DIR%
echo.
echo To test the installer:
echo cd %PKG_DIR% ^&^& install-windows.bat
pause