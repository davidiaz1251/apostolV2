export interface Tema {
  id: string;
  img: string;
  intro: string;
  seccion: string;
  texto: string;
  titulo: string;
  video: string;
  orden: number;
  // Campos adicionales para offline
  imagenLocal?: string;
}

export interface Seccion {
  id: string;
  nombre: string;
  titulo: string;
  // Campos adicionales para offline
  imagenLocal?: string;
}

export interface Practica {
  id: string;
  pregunta: string;
  respuesta: string;
  A: string;
  B: string;
  C: string;
  tema: string;
}

export interface SyncStatus {
  lastSync: Date;
  version: number;
  hasChanges: boolean;
}
