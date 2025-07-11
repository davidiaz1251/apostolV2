# Guía Completa para Recursos de Iconos

## 📁 Estructura de Recursos Creada

Tu proyecto ahora tiene la siguiente estructura de recursos:

```
/Users/david/Developer/apostolV2/
├── resources/
│   ├── README.md           # Documentación completa
│   ├── icon-placeholder.md # Coloca aquí tu icon.png
│   └── splash-placeholder.md # Coloca aquí tu splash.png
├── assets.config.json      # Configuración de assets
├── capacitor.config.json   # Configuración de Capacitor
└── android/               # Plataforma Android agregada
```

## 🚀 Pasos para Generar Recursos

### 1. Preparar tus imágenes:
- **icon.png**: 1024x1024 píxeles (icono de la app)
- **splash.png**: 2732x2732 píxeles (pantalla de carga)

### 2. Colocar las imágenes:
```bash
# Coloca tus imágenes en la carpeta resources/
/Users/david/Developer/apostolV2/resources/icon.png
/Users/david/Developer/apostolV2/resources/splash.png
```

### 3. Generar recursos:
```bash
# Generar todos los recursos
pnpm run resources

# Solo para Android
pnpm run resources:android

# Solo para iOS (cuando agregues iOS)
pnpm run resources:ios
```

## 📱 Comandos Disponibles

Agregué estos scripts útiles a tu `package.json`:

```json
{
  "scripts": {
    "resources": "capacitor-assets generate",
    "resources:android": "capacitor-assets generate --android",
    "resources:ios": "capacitor-assets generate --ios"
  }
}
```

## 🔧 Configuración Actual

### Capacitor Config (`capacitor.config.json`):
- **App ID**: com.apostol.app
- **App Name**: Apostol
- **Web Dir**: www
- **Android Scheme**: https

### Assets Config (`assets.config.json`):
- **Iconos adaptativos**: Habilitados para Android
- **Colores de fondo**: Blanco (claro) / Negro (oscuro)
- **Soporte para modo oscuro**: Configurado

## 🛠️ Próximos Pasos

1. **Reemplaza los placeholders**: Coloca tus archivos `icon.png` y `splash.png` reales
2. **Genera recursos**: Ejecuta `pnpm run resources`
3. **Construye la app**: Ejecuta `pnpm run build`
4. **Sincroniza Capacitor**: Ejecuta `npx cap sync`
5. **Abre Android Studio**: Ejecuta `npx cap open android`

## 📝 Notas Importantes

- Los recursos se generan automáticamente en `android/app/src/main/res/`
- Para iOS, necesitarás agregar la plataforma: `npx cap add ios`
- Los iconos adaptativos de Android se generan automáticamente
- Puedes personalizar colores y configuraciones en `assets.config.json`

## 🔍 Verificar Recursos Generados

Después de ejecutar `pnpm run resources`, encontrarás:

```
android/app/src/main/res/
├── drawable/
├── drawable-land-hdpi/
├── drawable-land-mdpi/
├── drawable-land-xhdpi/
├── drawable-land-xxhdpi/
├── drawable-land-xxxhdpi/
├── drawable-port-hdpi/
├── drawable-port-mdpi/
├── drawable-port-xhdpi/
├── drawable-port-xxhdpi/
├── drawable-port-xxxhdpi/
├── mipmap-hdpi/
├── mipmap-mdpi/
├── mipmap-xhdpi/
├── mipmap-xxhdpi/
├── mipmap-xxxhdpi/
└── values/
```

¡Ya tienes todo configurado para generar los recursos de tu aplicación! 🎉
