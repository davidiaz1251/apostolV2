export interface PracticaModel {
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

export interface SeccionModel {
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

export interface DocumentoModel {
  id: string;
  documento: string;
  img: string;
  intro: string;
  texto: string;
  titulo: string;
  video: string;
  // Campos adicionales para offline
  imagenLocal?: string;
  orden?: number;
  activo?: boolean;
  fechaCreacion?: Date;
  fechaModificacion?: Date;
}
