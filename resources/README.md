# Recursos para Iconos de la App

Esta carpeta contiene los recursos necesarios para generar los iconos de la aplicación en diferentes plataformas.

## Archivos necesarios:

### 1. Icono de la aplicación
- **Archivo**: `icon.png`
- **Tamaño**: 1024x1024 píxeles
- **Formato**: PNG con fondo transparente o sólido
- **Descripción**: Este será el icono principal de tu aplicación

### 2. Splash Screen (Pantalla de carga)
- **Archivo**: `splash.png`
- **Tamaño**: 2732x2732 píxeles
- **Formato**: PNG
- **Descripción**: Imagen para la pantalla de carga (splash screen)

## Cómo usar:

1. Coloca tus imágenes `icon.png` y `splash.png` en esta carpeta
2. Ejecuta el comando: `npx capacitor-assets generate`
3. Los recursos se generarán automáticamente para todas las plataformas

## Especificaciones técnicas:

### Para el icono (icon.png):
- Debe ser cuadrado (1024x1024)
- Formato PNG
- Sin bordes redondeados (el sistema los aplicará automáticamente)
- Contenido importante centrado, evitando los bordes

### Para el splash screen (splash.png):
- Debe ser cuadrado (2732x2732)
- El contenido importante debe estar centrado
- Considera que se recortará para diferentes relaciones de aspecto

## Comando para generar recursos:

```bash
npx capacitor-assets generate
```

Este comando generará automáticamente:
- Iconos para Android en diferentes tamaños
- Iconos para iOS en diferentes tamaños
- Splash screens para ambas plataformas
- Iconos adaptivos para Android
