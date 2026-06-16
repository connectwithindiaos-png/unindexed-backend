@echo off
REM Build APK with embedded token for Windows
REM Usage: build-apk.bat <token>

if "%1"=="" (
    echo Usage: %0 ^<token^>
    echo Example: %0 abc123
    exit /b 1
)

set TOKEN=%1
set SCRIPT_DIR=%~dp0
set BACKEND_DIR=%SCRIPT_DIR%..
set ANDROID_DIR=%BACKEND_DIR%\..\android-app
set CONFIG_FILE=%ANDROID_DIR%\app\src\main\assets\config.json
set GRADLE=%USERPROFILE%\.gradle\wrapper\dists\gradle-8.7-bin\bhs2wmbdwecv87pi65oeuq5iu\gradle-8.7\bin\gradle

if not exist "%CONFIG_FILE%" (
    echo Error: Config file not found
    exit /b 1
)

echo Writing token to config...
echo {"apiUrl":"https://unindexed-backend.onrender.com","token":"%TOKEN%"} > "%CONFIG_FILE%"
echo Token embedded: %TOKEN%

echo Building APK...
cd /d "%ANDROID_DIR%"
"%GRADLE%" assembleDebug

copy /y "%ANDROID_DIR%\app\build\outputs\apk\debug\app-debug.apk" "%BACKEND_DIR%\public\apks\app-base.apk"
echo APK ready: %BACKEND_DIR%\public\apks\app-base.apk
echo.
echo Next: Commit and push the updated config to trigger a frontend rebuild.
