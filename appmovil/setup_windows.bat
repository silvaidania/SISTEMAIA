@echo off
chcp 65001 >nul
title Configuración Velocímetro GPS - Flutter

echo =========================================
echo Configuración de Entorno - Velocímetro GPS
echo =========================================
echo.

REM Verificar Flutter
set FLUTTER_PATH=%USERPROFILE%\flutter\bin
if exist "%FLUTTER_PATH%" (
    echo ✓ Flutter encontrado en: %FLUTTER_PATH%
    
    REM Agregar al PATH
    setx PATH "%PATH%;%FLUTTER_PATH%" >nul 2>&1
    echo   ^> Agregado al PATH del usuario
) else (
    echo ✗ Flutter NO encontrado
    echo   Por favor instala Flutter desde: https://docs.flutter.dev/get-started/install
)

REM Verificar Java
echo.
java -version >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo ✓ Java instalado
    for /f "tokens=*" %%i in ('java -version 2^>^&1 ^| findstr /R "version"') do (
        echo   %%i
    )
) else (
    echo ✗ Java NO instalado
    echo   Instalando Java JDK 17...
    winget install Microsoft.OpenJDK.17 --accept-package-agreements --accept-source-agreements
)

REM Verificar Android SDK
set ANDROID_SDK=%LOCALAPPDATA%\Android\Sdk
if exist "%ANDROID_SDK%" (
    echo ✓ Android SDK encontrado: %ANDROID_SDK%
    setx ANDROID_HOME "%ANDROID_SDK%" >nul 2>&1
    setx ANDROID_SDK_ROOT "%ANDROID_SDK%" >nul 2>&1
    echo   ^> ANDROID_HOME configurado
) else (
    echo ✗ Android SDK NO encontrado
    echo   Por favor instala Android Studio desde: https://developer.android.com/studio
)

echo.
echo =========================================
echo Configuración completada
echo =========================================
echo.
echo Próximos pasos:
echo 1. Cierra y vuelve a abrir esta terminal
echo 2. cd appmovil
echo 3. flutter pub get
echo 4. flutter doctor
echo 5. flutter build apk --release
echo.
pause
