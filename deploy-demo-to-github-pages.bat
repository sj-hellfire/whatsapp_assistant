@echo off
echo ========================================
echo WhatsApp AI Assistant Demo Deployment
echo ========================================
echo.

echo This script will help you deploy the demo to GitHub Pages
echo.

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git is not installed or not in PATH
    echo Please install Git from https://git-scm.com/
    pause
    exit /b 1
)

echo Git is installed. Proceeding...
echo.

REM Create deployment directory
set DEPLOY_DIR=whatsapp_assistant_demo_deploy
if exist %DEPLOY_DIR% (
    echo Removing existing deployment directory...
    rmdir /s /q %DEPLOY_DIR%
)

echo Creating deployment directory...
mkdir %DEPLOY_DIR%
cd %DEPLOY_DIR%

echo Copying demo files...
copy ..\demo\index.html .
copy ..\demo\styles.css .
copy ..\demo\README.md .

echo.
echo ========================================
echo Files ready for deployment:
echo ========================================
dir /b
echo.

echo Initializing git repository...
git init
git add .
git commit -m "Initial demo commit for GitHub Pages"

echo.
echo ========================================
echo NEXT STEPS:
echo ========================================
echo.
echo 1. Create a new repository on GitHub:
echo    - Go to https://github.com/new
echo    - Repository name: whatsapp_assistant_demo
echo    - Make it Public
echo    - Don't initialize with README (we already have one)
echo    - Click "Create repository"
echo.
echo 2. Connect and push to GitHub:
echo    git remote add origin https://github.com/sj-hellfire/whatsapp_assistant_demo.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 3. Enable GitHub Pages:
echo    - Go to repository Settings
echo    - Scroll to "Pages" section
echo    - Source: "Deploy from a branch"
echo    - Branch: "main", Folder: "/ (root)"
echo    - Click "Save"
echo.
echo 4. Wait a few minutes for deployment
echo.
echo 5. Your demo will be available at:
echo    https://sj-hellfire.github.io/whatsapp_assistant_demo/
echo.

echo Current directory: %CD%
echo.
echo Would you like to run the git commands now? (y/n)
set /p choice=
if /i "%choice%"=="y" (
    echo.
    echo Running git commands...
    git remote add origin https://github.com/sj-hellfire/whatsapp_assistant_demo.git
    git branch -M main
    git push -u origin main
    echo.
    echo Done! Now enable GitHub Pages in your repository settings.
) else (
    echo.
    echo Manual steps required. See instructions above.
)

echo.
echo Press any key to exit...
pause >nul 