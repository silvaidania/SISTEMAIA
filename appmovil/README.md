# Velocímetro GPS - App Móvil Flutter

Una aplicación móvil de velocímetro que utiliza el GPS físico del dispositivo para medir la velocidad en tiempo real.

## Características

- **Velocímetro circular** con indicador visual de velocidad
- **Velocidad en tiempo real** usando GPS del dispositivo
- **Velocidad máxima** registrada durante la sesión
- **Distancia total** recorrida
- **Precisión GPS** y altitud
- **Diseño responsivo** optimizado para móvil
- **Permisos de ubicación** manejados automáticamente
- **Colores dinámicos** según la velocidad (verde < 50, naranja < 80, rojo >= 80 km/h)

## Requisitos Previos

Para compilar y generar el APK necesitas:

1. **Flutter SDK** - [Instalar Flutter](https://docs.flutter.dev/get-started/install)
2. **Android Studio** - [Descargar Android Studio](https://developer.android.com/studio)
3. **Android SDK** - Incluido en Android Studio
4. **Java JDK 17** - Requerido para Android Gradle Plugin

## Instalación

### 1. Instalar Flutter

```bash
# Windows (descargar desde flutter.dev)
git clone https://github.com/flutter/flutter.git -b stable

# Agregar Flutter al PATH
echo export PATH="$PATH:/c/Users/tu-usuario/flutter/bin" >> ~/.bashrc
source ~/.bashrc

# Verificar instalación
flutter doctor
```

### 2. Instalar Android Studio

1. Descargar desde [developer.android.com/studio](https://developer.android.com/studio)
2. Instalar Android SDK, Android SDK Platform-Tools, y Android Emulator
3. Configurar el SDK path en Flutter:

```bash
flutter config --android-sdk "C:\Users\tu-usuario\AppData\Local\Android\Sdk"
```

### 3. Instalar Java JDK 17

```bash
# Windows - Descargar desde adoptium.net o usar winget
winget install Microsoft.OpenJDK.17

# Verificar
java -version
```

## Configuración del Proyecto

### 1. Actualizar dependencias

```bash
cd appmovil
flutter pub get
```

### 2. Configurar Android SDK

Editar `android/local.properties` con tu ruta de Android SDK:

```properties
sdk.dir=C:\Users\tu-usuario\AppData\Local\Android\Sdk
flutter.sdk=C:\Users\tu-usuario\flutter
```

## Generar el APK

### APK de Depuración (Debug)

```bash
cd appmovil
flutter build apk --debug
```

El APK se generará en: `build/app/outputs/flutter-apk/app-debug.apk`

### APK de Producción (Release)

```bash
cd appmovil
flutter build apk --release
```

El APK se generará en: `build/app/outputs/flutter-apk/app-release.apk`

### APK para Arquitecturas Específicas

```bash
# Solo ARM64 (más común en dispositivos modernos)
flutter build apk --release --target-platform android-arm64

# Todas las arquitecturas
flutter build apk --release --split-per-abi
```

## Ejecutar en Emulador/Dispositivo

```bash
# Listar dispositivos disponibles
flutter devices

# Ejecutar en dispositivo/emulador
flutter run
```

## Estructura del Proyecto

```
appmovil/
├── lib/
│   ├── main.dart                 # Punto de entrada de la app
│   ├── speedometer_screen.dart   # UI del velocímetro
│   └── speedometer_provider.dart # Lógica de GPS y estado
├── android/
│   ├── app/
│   │   ├── build.gradle          # Configuración de la app Android
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       └── kotlin/com/example/speedometer/
│   │           └── MainActivity.kt
│   ├── build.gradle              # Configuración del proyecto Android
│   ├── settings.gradle           # Configuración de plugins
│   ├── gradle.properties         # Propiedades de Gradle
│   └── local.properties          # Rutas locales (SDK, Flutter)
├── pubspec.yaml                  # Dependencias de Flutter
└── test/
    └── widget_test.dart          # Tests
```

## Dependencias

- `geolocator`: Acceso al GPS del dispositivo
- `permission_handler`: Manejo de permisos de ubicación
- `provider`: Gestión de estado
- `google_fonts`: Tipografías

## Permisos de Android

La app requiere los siguientes permisos en `AndroidManifest.xml`:

- `ACCESS_FINE_LOCATION`: Ubicación precisa
- `ACCESS_COARSE_LOCATION`: Ubicación aproximada
- `ACCESS_BACKGROUND_LOCATION`: Ubicación en segundo plano (opcional)

## Solución de Problemas

### Error: "flutter: command not found"

Asegúrate de que Flutter esté en tu PATH:
```bash
export PATH="$PATH:/c/Users/tu-usuario/flutter/bin"
```

### Error: "Android SDK not found"

Configura el SDK path:
```bash
git config --global --add safe.directory '*'
flutter config --android-sdk "C:\Users\tu-usuario\AppData\Local\Android\Sdk"
```

### Error: "Gradle build failed"

Limpia el proyecto:
```bash
flutter clean
flutter pub get
flutter build apk
```

### Error de permisos de ubicación

Asegúrate de que el dispositivo tenga:
1. GPS habilitado
2. Permisos de ubicación concedidos
3. Servicios de ubicación activos

## Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.
