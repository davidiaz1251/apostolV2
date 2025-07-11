# Servicio de Documentos - Configuración Firebase

## 📋 Resumen de Cambios

El `DocumentosService` ha sido actualizado para conectarse directamente con Firebase Firestore, reemplazando los datos de prueba por datos reales desde la base de datos.

## 🔧 Características Implementadas

### Métodos Disponibles:

1. **`getDocumentos(documento: string)`**
   - Obtiene todos los documentos filtrados por tipo (ej: 'enseñanzas')
   - Retorna un Observable con los documentos filtrados

2. **`getDocumentoById(id: string)`**
   - Obtiene un documento específico por su ID
   - Retorna un Observable con el documento encontrado

3. **`setDocumento(documento: DocumentoModel)`**
   - Crea un nuevo documento en Firebase
   - Recarga automáticamente la lista de documentos

4. **`updateDocumento(documento: DocumentoModel)`**
   - Actualiza un documento existente
   - Recarga automáticamente la lista de documentos

5. **`crearId()`**
   - Genera un ID único para nuevos documentos
   - Formato: `timestamp_randomstring`

6. **`getDocumentoDonacion()`**
   - Método específico para obtener documentos de donación
   - Compatible con la versión anterior

7. **`reloadDocumentos()`**
   - Recarga manualmente los documentos desde Firebase

## 🗄️ Estructura de Datos

### Colección Firebase: `documentos`

Los documentos deben tener la siguiente estructura:

```typescript
{
  id: string;
  documento: string;    // Tipo: 'enseñanzas', 'donacion', etc.
  img: string;         // URL de la imagen
  intro: string;       // Descripción breve
  texto: string;       // Contenido completo
  titulo: string;      // Título del documento
  video: string;       // URL del video (opcional)
  orden?: number;      // Orden de visualización
  activo?: boolean;    // Si está activo
  fechaCreacion?: Date;
  fechaModificacion?: Date;
  imagenLocal?: string; // Para uso offline
}
```

## 🚀 Uso del Servicio

### En el componente de enseñanzas:

```typescript
// Obtener todas las enseñanzas
this.documentosService.getDocumentos('enseñanzas').subscribe(ensenanzas => {
  this.ensenanzas = ensenanzas;
});

// Obtener un documento específico
this.documentosService.getDocumentoById('id_documento').subscribe(documento => {
  this.documento = documento;
});
```

### Para crear un nuevo documento:

```typescript
const nuevoDocumento: DocumentoModel = {
  id: this.documentosService.crearId(),
  documento: 'enseñanzas',
  titulo: 'Nueva Enseñanza',
  // ... otros campos
};

await this.documentosService.setDocumento(nuevoDocumento);
```

## 📦 Funcionalidades Agregadas

- **Conexión Firebase**: Datos reales desde Firestore
- **Filtrado por tipo**: Obtener documentos específicos por categoría
- **Manejo de errores**: Fallback a datos vacíos si hay problemas
- **Recarga automática**: Los datos se actualizan automáticamente
- **Compatibilidad**: Mantiene la API de la versión anterior

## 🔄 Sincronización

El servicio:
- Carga automáticamente los datos al inicializarse
- Mantiene un cache local usando BehaviorSubject
- Actualiza automáticamente cuando hay cambios
- Funciona tanto en plataformas nativas como web

## 📱 Próximos Pasos

1. **Asegurar datos en Firebase**: Crear documentos de enseñanzas en la colección 'documentos'
2. **Configurar imágenes**: Subir imágenes reales a Firebase Storage
3. **Implementar offline**: Usar el OfflineService para funcionalidad sin conexión
4. **Agregar paginación**: Para grandes cantidades de documentos

El servicio está listo para usar y se conectará automáticamente a tu base de datos Firebase cuando esté configurada.
