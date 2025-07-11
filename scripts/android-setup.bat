@echo off
title Configuracion Android - Apostol V2
color 0A

echo.
echo ===============================================
echo   🚀 CONFIGURACION ANDROID AUTOMATIZADA
echo ===============================================
echo.

echo 📁 Directorio actual: %CD%
echo.

echo 🔨 Paso 1: Construyendo proyecto web...
echo ===============================================
call pnpm build
if %errorlevel% neq 0 (
    echo.
    echo ❌ Error al construir el proyecto web
    pause
    exit /b 1
)
echo ✅ Proyecto web construido exitosamente
echo.

echo 🗑️ Paso 2: Eliminando carpeta Android existente...
echo ===============================================
if exist "android" (
    rmdir /s /q "android"
    if %errorlevel% neq 0 (
        echo ❌ Error al eliminar carpeta Android
        pause
        exit /b 1
    )
    echo ✅ Carpeta Android eliminada
) else (
    echo ℹ️ No existe carpeta Android previa
)
echo.

echo 📱 Paso 3: Agregando plataforma Android...
echo ===============================================
call npx cap add android
if %errorlevel% neq 0 (
    echo.
    echo ❌ Error al agregar plataforma Android
    pause
    exit /b 1
)
echo ✅ Plataforma Android agregada exitosamente
echo.

echo 🔄 Paso 4: Sincronizando proyecto...
echo ===============================================
call npx cap sync android
if %errorlevel% neq 0 (
    echo.
    echo ❌ Error al sincronizar proyecto
    pause
    exit /b 1
)
echo ✅ Proyecto sincronizado exitosamente
echo.

echo 🎨 Paso 5: Generando recursos (iconos y splash screens)...
echo ===============================================
call pnpm run resources:android
if %errorlevel% neq 0 (
    echo.
    echo ❌ Error al generar recursos
    pause
    exit /b 1
)
echo ✅ Recursos generados exitosamente
echo.

echo 🔍 Paso 6: Verificando configuracion...
echo ===============================================
call npx cap doctor
echo.

echo ===============================================
echo   🎉 ¡CONFIGURACION COMPLETADA!
echo ===============================================
echo.
echo 📋 Resumen:
echo    ✅ Proyecto web construido
echo    ✅ Carpeta Android eliminada
echo    ✅ Plataforma Android agregada
echo    ✅ Proyecto sincronizado
echo    ✅ Recursos generados
echo    ✅ Configuracion verificada
echo.
echo 🚀 Proximos pasos:
echo    • Abrir Android Studio: npx cap open android
echo    • Ejecutar en dispositivo: npx cap run android
echo.
echo ===============================================

pause
