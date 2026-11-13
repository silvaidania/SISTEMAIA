# Script de configuración automática para Windows
# Ejecutar en PowerShell como Administrador

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Configuración de Entorno - Velocímetro GPS" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si Flutter está instalado
$flutterPath = "$env:USERPROFILE\flutter\bin"
if (Test-Path $flutterPath) {
    Write-Host "✓ Flutter encontrado en: $flutterPath" -ForegroundColor Green
    
    # Agregar al PATH del usuario
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($userPath -notlike "*$flutterPath*") {
        [Environment]::SetEnvironmentVariable("Path", "$userPath;$flutterPath", "User")
        Write-Host "  → Agregado al PATH del usuario" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ Flutter NO encontrado" -ForegroundColor Red
    Write-Host "  Instalando Flutter..." -ForegroundColor Yellow
    
    # Descargar Flutter
    $flutterUrl = "https://storage.googleapis.com/flutter_infra_release/releases/stable/windows/flutter_windows_3.24.0-stable.zip"
    $flutterZip = "$env:TEMP\flutter_windows.zip"
    
    Write-Host "  Descargando Flutter SDK..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $flutterUrl -OutFile $flutterZip
    
    Write-Host "  Extrayendo Flutter..." -ForegroundColor Yellow
    Expand-Archive -Path $flutterZip -DestinationPath "$env:USERPROFILE" -Force
    
    # Agregar al PATH
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$flutterPath", "User")
    Write-Host "  ✓ Flutter instalado" -ForegroundColor Green
}

# Verificar Java
try {
    $javaVersion = java -version 2>&1 | Select-Object -First 1
    Write-Host "✓ Java instalado: $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Java NO instalado" -ForegroundColor Red
    Write-Host "  Instalando Java JDK 17..." -ForegroundColor Yellow
    
    winget install Microsoft.OpenJDK.17 --accept-package-agreements --accept-source-agreements
    Write-Host "  ✓ Java instalado" -ForegroundColor Green
}

# Verificar Android SDK
$androidSdkPath = "$env:LOCALAPPDATA\Android\Sdk"
if (Test-Path $androidSdkPath) {
    Write-Host "✓ Android SDK encontrado: $androidSdkPath" -ForegroundColor Green
    
    # Configurar ANDROID_HOME
    [Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidSdkPath, "User")
    [Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $androidSdkPath, "User")
    Write-Host "  → ANDROID_HOME configurado" -ForegroundColor Yellow
} else {
    Write-Host "✗ Android SDK NO encontrado" -ForegroundColor Red
    Write-Host "  Por favor instala Android Studio desde:" -ForegroundColor Yellow
    Write-Host "  https://developer.android.com/studio" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Configuración completada" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Reinicia tu terminal/PowerShell" -ForegroundColor White
Write-Host "2. Ejecuta: cd appmovil" -ForegroundColor White
Write-Host "3. Ejecuta: flutter pub get" -ForegroundColor White
Write-Host "4. Ejecuta: flutter doctor" -ForegroundColor White
Write-Host "5. Ejecuta: flutter build apk --release" -ForegroundColor White
