export interface Tema {
  id: string;
  titulo: string;
  descripcion: string;
  imagen?: string;
  imagenLocal?: string;
  seccion: string;
  orden: number;
  activo: boolean;
  fechaCreacion: Date;
  fechaModificacion?: Date;
}

export interface Seccion {
  id: string;
  nombre: string;
  descripcion: string;
  imagen?: string;
  imagenLocal?: string;
  orden: number;
  activo: boolean;
  fechaCreacion: Date;
  fechaModificacion?: Date;
}

export interface Practica {
  id: string;
  titulo: string;
  descripcion: string;
  contenido: string;
  tema: string;
  orden: number;
  activo: boolean;
  fechaCreacion: Date;
  fechaModificacion?: Date;
}

export interface SyncStatus {
  lastSync: Date;
  version: number;
  hasChanges: boolean;
}
