import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { DocumentoModel } from '../models/models';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class DocumentosService {
  private firebaseService = inject(FirebaseService);
  private documentosSubject = new BehaviorSubject<DocumentoModel[]>([]);
  
  documentos$ = this.documentosSubject.asObservable();

  constructor() {
    // Cargar directamente desde Firebase
    this.loadDocumentos();
  }

  private async loadDocumentos() {
    try {
      // Cargar documentos desde Firebase
      const documentos = await this.firebaseService.getDocuments('documentos');
      this.documentosSubject.next(documentos);
      
    } catch (error) {
      console.error('Error loading documentos from Firebase:', error);
      // Solo mostrar lista vacía si hay error
      this.documentosSubject.next([]);
    }
  }

  getDocumentos(documento: string): Observable<DocumentoModel[]> {
    return new Observable(observer => {
      const subscription = this.documentos$.subscribe(documentos => {
        const filteredDocumentos = documentos.filter(doc => doc.documento === documento);
        observer.next(filteredDocumentos);
      });
      
      return () => subscription.unsubscribe();
    });
  }

  getDocumentoById(id: string): Observable<DocumentoModel | undefined> {
    return new Observable(observer => {
      const subscription = this.documentos$.subscribe(documentos => {
        const documento = documentos.find(doc => doc.id === id);
        observer.next(documento);
      });
      
      return () => subscription.unsubscribe();
    });
  }

  // Método para crear un nuevo documento (compatible con la versión anterior)
  async setDocumento(documento: DocumentoModel): Promise<void> {
    try {
      // Usar addDocument ya que no tenemos setDocument
      await this.firebaseService.addDocument('documentos', documento);
      // Recargar documentos después de crear uno nuevo
      await this.loadDocumentos();
    } catch (error) {
      console.error('Error setting documento:', error);
      throw error;
    }
  }

  // Método para crear un nuevo ID (compatible con la versión anterior)
  crearId(): string {
    // Generar un ID único usando timestamp y random
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Método específico para obtener documentos de donación (compatible con la versión anterior)
  getDocumentoDonacion(): Observable<DocumentoModel[]> {
    return this.getDocumentos('donacion');
  }

  // Método para recargar documentos manualmente
  async reloadDocumentos(): Promise<void> {
    await this.loadDocumentos();
  }

  // Método para actualizar un documento existente
  async updateDocumento(documento: DocumentoModel): Promise<void> {
    try {
      await this.firebaseService.updateDocument('documentos', documento.id, documento);
      // Recargar documentos después de actualizar
      await this.loadDocumentos();
    } catch (error) {
      console.error('Error updating documento:', error);
      throw error;
    }
  }

}
