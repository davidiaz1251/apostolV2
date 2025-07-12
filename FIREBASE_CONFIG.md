# Configuración de Firebase para Capacitor

## 📋 Plugins Firebase Instalados

Tu proyecto tiene los siguientes plugins de Firebase configurados:

- `@capacitor-firebase/authentication` - Autenticación
- `@capacitor-firebase/firestore` - Base de datos Firestore
- `@capacitor-firebase/remote-config` - Configuración remota
- `@capacitor-firebase/storage` - Almacenamiento en la nube

## 🔧 Configuración Actual en capacitor.config.json

```json
{
  "plugins": {
    "FirebaseAuthentication": {
      "skipNativeAuth": false,
      "providers": ["google.com"]
    },
    "FirebaseFirestore": {
      "emulatorHost": null,
      "emulatorPort": null
    },
    "FirebaseRemoteConfig": {
      "minimumFetchIntervalInSeconds": 3600
    },
    "FirebaseStorage": {
      "emulatorHost": null,
      "emulatorPort": null
    }
  }
}
```

## 🚀 Pasos Adicionales Necesarios

### 1. Archivos de Configuración Firebase

Necesitas agregar los archivos de configuración de Firebase:

#### Para Android:
```
android/app/google-services.json
```

#### Para iOS (cuando agregues iOS):
```
ios/App/GoogleService-Info.plist
```

### 2. Configuración de Android

Edita el archivo `android/app/build.gradle` y agrega:

```gradle
// En la parte superior del archivo
plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
    id 'com.google.gms.google-services'  // <-- Agregar esta línea
}

// En dependencies
dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-auth-ktx'
    implementation 'com.google.firebase:firebase-firestore-ktx'
    implementation 'com.google.firebase:firebase-config-ktx'
    implementation 'com.google.firebase:firebase-storage-ktx'
}
```

Y en `android/build.gradle` (nivel proyecto):

```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'  // <-- Agregar esta línea
    }
}
```

### 3. Configuración de Autenticación

Para usar proveedores de autenticación como Google, necesitas:

1. **Habilitar los proveedores en Firebase Console**
2. **Configurar SHA-1 fingerprint** para Android
3. **Agregar configuración específica** para cada proveedor

#### Google Sign-In:
```json
"FirebaseAuthentication": {
  "skipNativeAuth": false,
  "providers": ["google.com"],
  "googleClientId": "TU_GOOGLE_CLIENT_ID"
}
```

### 4. Configuración de Emuladores (Desarrollo)

Para usar emuladores de Firebase en desarrollo:

```json
"FirebaseFirestore": {
  "emulatorHost": "localhost",
  "emulatorPort": 8080
},
"FirebaseStorage": {
  "emulatorHost": "localhost",
  "emulatorPort": 9199
}
```

## 📱 Comandos para Aplicar Configuración

Después de realizar los cambios:

```bash
# Sincronizar cambios con las plataformas nativas
npx cap sync

# Copiar archivos web
npx cap copy

# Abrir en Android Studio para verificar
npx cap open android
```

## 🔍 Verificar Configuración

Para verificar que todo está configurado correctamente:

```bash
# Verificar plugins instalados
npx cap ls

# Verificar configuración
npx cap doctor
```

## 📝 Notas Importantes

1. **google-services.json**: Debe descargarse desde Firebase Console
2. **SHA-1 fingerprint**: Necesario para autenticación con Google
3. **Providers**: Configura solo los proveedores que vas a usar
4. **Emuladores**: Útiles para desarrollo, no para producción
5. **Permisos**: Algunos plugins requieren permisos específicos en Android

## 🔗 Recursos Adicionales

- [Firebase Console](https://console.firebase.google.com/)
- [Capacitor Firebase Auth](https://github.com/capawesome-team/capacitor-firebase/blob/main/packages/authentication/README.md)
- [Capacitor Firebase Firestore](https://github.com/capawesome-team/capacitor-firebase/blob/main/packages/firestore/README.md)
- [Firebase Android Setup](https://firebase.google.com/docs/android/setup)

¿Necesitas ayuda con algún paso específico de la configuración de Firebase?
