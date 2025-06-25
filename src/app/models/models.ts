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
