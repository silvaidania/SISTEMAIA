#!/bin/bash
# Script de verificación de entorno para la app Velocímetro GPS

echo "========================================="
echo "Verificación de Entorno - Velocímetro GPS"
echo "========================================="
echo ""

# Verificar Flutter
if command -v flutter &> /dev/null; then
    echo "✓ Flutter instalado: $(flutter --version | head -1)"
else
    echo "✗ Flutter NO instalado"
    echo "  Instalar desde: https://docs.flutter.dev/get-started/install"
fi

# Verificar Java
if command -v java &> /dev/null; then
    echo "✓ Java instalado: $(java -version 2>&1 | head -1)"
else
    echo "✗ Java NO instalado"
    echo "  Instalar JDK 17 desde: https://adoptium.net/"
fi

# Verificar Android SDK
if [ -n "$ANDROID_HOME" ]; then
    echo "✓ ANDROID_HOME configurado: $ANDROID_HOME"
elif [ -d "$HOME/AppData/Local/Android/Sdk" ]; then
    echo "✓ Android SDK encontrado en ubicación por defecto"
    export ANDROID_HOME="$HOME/AppData/Local/Android/Sdk"
else
    echo "✗ Android SDK NO encontrado"
    echo "  Instalar Android Studio desde: https://developer.android.com/studio"
fi

# Verificar ADB
if command -v adb &> /dev/null; then
    echo "✓ ADB instalado"
else
    echo "✗ ADB NO instalado (instalar Android SDK Platform-Tools)"
fi

# Verificar Flutter doctor
if command -v flutter &> /dev/null; then
    echo ""
    echo "Ejecutando flutter doctor..."
    flutter doctor
fi

echo ""
echo "========================================="
echo "Verificación completada"
echo "========================================="
