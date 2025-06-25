import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User } from '@angular/fire/auth';
import { Firestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { RemoteConfig, getRemoteConfig, fetchAndActivate, getValue } from '@angular/fire/remote-config';
import { Observable, BehaviorSubject, from } from 'rxjs';
import { authState } from '@angular/fire/auth';
import { OfflineService } from './offline.service';
import { Tema, Seccion, Practica, SyncStatus } from '../interfaces/tema.interface';
import { PracticaModel, SeccionModel } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private storage = inject(Storage);
  private remoteConfig = inject(RemoteConfig);
  private offlineService = inject(OfflineService);

  // Observable del estado de autenticación
  user$: Observable<User | null> = authState(this.auth);

  // BehaviorSubjects para datos offline
  private temasSubject = new BehaviorSubject<Tema[]>([]);
  private seccionesSubject = new BehaviorSubject<Seccion[]>([]);
  private practicasSubject = new BehaviorSubject<Practica[]>([]);

  public temas$ = this.temasSubject.asObservable();
  public secciones$ = this.seccionesSubject.asObservable();
  public practicas$ = this.practicasSubject.asObservable();

  private readonly STORAGE_KEYS = {
    TEMAS: 'temas_local',
    SECCIONES: 'secciones_local',
    PRACTICAS: 'practicas_local',
    SYNC_STATUS: 'sync_status',
    VERSION: 'data_version',
    TEMAS_VERSION: 'temas_version'
  };

  constructor() {
    this.initializeOfflineData();
  }

  // Inicializar datos offline
  private async initializeOfflineData() {
    // Configurar Remote Config
    await this.setupRemoteConfig();
    
    // Cargar datos locales primero
    await this.loadLocalData();
    
    // Verificar versión y sincronizar si es necesario
    await this.checkVersionAndSync();
    
    // Escuchar cambios de conexión para futuras sincronizaciones
    this.offlineService.isOnline$.subscribe(async (isOnline) => {
      if (isOnline) {
        await this.checkVersionAndSync();
      }
    });
  }

  // Configurar Remote Config
  private async setupRemoteConfig() {
    try {
      // Configurar valores por defecto
      const defaultConfig = {
        'temas_version': '1'
      };
      
      // En desarrollo, usar cache corto
      const settings = {
        minimumFetchIntervalMillis: 10000, // 10 segundos en desarrollo
        fetchTimeoutMillis: 10000
      };
      
      // Configurar Remote Config (esto se debe hacer en la inicialización de la app)
      console.log('Remote Config configurado');
    } catch (error) {
      console.error('Error configurando Remote Config:', error);
    }
  }

  // Verificar versión y sincronizar si es necesario
  private async checkVersionAndSync() {
    if (!this.offlineService.isConnected()) {
      console.log('Sin conexión, usando datos locales');
      return;
    }

    try {
      // Obtener versión remota
      await fetchAndActivate(this.remoteConfig);
      const remoteVersion = getValue(this.remoteConfig, 'temas_version').asString();
      
      // Obtener versión local
      const localVersion = await this.offlineService.getData(this.STORAGE_KEYS.TEMAS_VERSION) || '0';
      
      console.log('Versión remota:', remoteVersion, 'Versión local:', localVersion);
      
      if (remoteVersion !== localVersion) {
        console.log('Nueva versión disponible, sincronizando...');
        await this.syncDataFromFirebase();
        await this.offlineService.setData(this.STORAGE_KEYS.TEMAS_VERSION, remoteVersion);
      } else {
        console.log('Versión actual, usando datos locales');
      }
    } catch (error) {
      console.error('Error verificando versión:', error);
      // Si hay error en Remote Config, cargar datos locales
      await this.loadLocalData();
    }
  }

  // Cargar datos desde almacenamiento local
  private async loadLocalData() {
    try {
      const [temas, secciones, practicas] = await Promise.all([
        this.offlineService.getData(this.STORAGE_KEYS.TEMAS),
        this.offlineService.getData(this.STORAGE_KEYS.SECCIONES),
        this.offlineService.getData(this.STORAGE_KEYS.PRACTICAS)
      ]);

      if (temas) this.temasSubject.next(temas);
      if (secciones) this.seccionesSubject.next(secciones);
      if (practicas) this.practicasSubject.next(practicas);

      console.log('Datos locales cargados');
    } catch (error) {
      console.error('Error cargando datos locales:', error);
    }
  }

  // Sincronizar datos desde Firebase
  async syncDataFromFirebase(): Promise<void> {
    if (!this.offlineService.isConnected()) {
      console.log('Sin conexión, usando datos locales');
      return;
    }

    try {
      console.log('Sincronizando datos desde Firebase...');
      
      // Obtener datos de Firebase
      const [temasSnapshot, seccionesSnapshot, practicasSnapshot] = await Promise.all([
        getDocs(query(collection(this.firestore, 'Temas'), orderBy('orden'))),
        getDocs(query(collection(this.firestore, 'secciones'), orderBy('orden'))),
        getDocs(query(collection(this.firestore, 'Practicas'), orderBy('orden')))
      ]);

      // Procesar temas
      const temas: Tema[] = [];
      for (const docSnapshot of temasSnapshot.docs) {
        const data = docSnapshot.data() as Tema;
        const tema = { ...data, id: docSnapshot.id };
        
        // Descargar imagen si existe y no está en local
        if (tema.imagen && !tema.imagenLocal) {
          try {
            const imageName = `tema_${tema.id}_${Date.now()}.jpg`;
            const localPath = await this.offlineService.downloadAndSaveImage(tema.imagen, imageName);
            tema.imagenLocal = localPath;
          } catch (error) {
            console.warn('Error descargando imagen del tema:', tema.id, error);
          }
        }
        
        temas.push(tema);
      }

      // Procesar secciones
      const secciones: Seccion[] = [];
      for (const docSnapshot of seccionesSnapshot.docs) {
        const data = docSnapshot.data() as Seccion;
        const seccion = { ...data, id: docSnapshot.id };
        
        // Descargar imagen si existe y no está en local
        if (seccion.imagen && !seccion.imagenLocal) {
          try {
            const imageName = `seccion_${seccion.id}_${Date.now()}.jpg`;
            const localPath = await this.offlineService.downloadAndSaveImage(seccion.imagen, imageName);
            seccion.imagenLocal = localPath;
          } catch (error) {
            console.warn('Error descargando imagen de la sección:', seccion.id, error);
          }
        }
        
        secciones.push(seccion);
      }

      // Procesar prácticas
      const practicas: Practica[] = [];
      practicasSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data() as Practica;
        practicas.push({ ...data, id: docSnapshot.id });
      });

      // Guardar en almacenamiento local
      await Promise.all([
        this.offlineService.setData(this.STORAGE_KEYS.TEMAS, temas),
        this.offlineService.setData(this.STORAGE_KEYS.SECCIONES, secciones),
        this.offlineService.setData(this.STORAGE_KEYS.PRACTICAS, practicas),
        this.offlineService.setData(this.STORAGE_KEYS.SYNC_STATUS, {
          lastSync: new Date(),
          version: Date.now(),
          hasChanges: false
        })
      ]);

      // Actualizar observables
      this.temasSubject.next(temas);
      this.seccionesSubject.next(secciones);
      this.practicasSubject.next(practicas);

      console.log('Sincronización completada');
    } catch (error) {
      console.error('Error sincronizando datos:', error);
    }
  }

  // Métodos de Autenticación
  async login(email: string, password: string) {
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async register(email: string, password: string) {
    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, password);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async logout() {
    try {
      await signOut(this.auth);
    } catch (error) {
      throw error;
    }
  }

  // Métodos de Firestore
  async addDocument(collectionName: string, data: any) {
    try {
      const docRef = await addDoc(collection(this.firestore, collectionName), data);
      return docRef;
    } catch (error) {
      throw error;
    }
  }

  async getDocuments(collectionName: string) {
    try {
      const querySnapshot = await getDocs(collection(this.firestore, collectionName));
      const documents: any[] = [];
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      return documents;
    } catch (error) {
      throw error;
    }
  }

  async updateDocument(collectionName: string, docId: string, data: any) {
    try {
      const docRef = doc(this.firestore, collectionName, docId);
      await updateDoc(docRef, data);
    } catch (error) {
      throw error;
    }
  }

  async deleteDocument(collectionName: string, docId: string) {
    try {
      const docRef = doc(this.firestore, collectionName, docId);
      await deleteDoc(docRef);
    } catch (error) {
      throw error;
    }
  }

  async queryDocuments(collectionName: string, field: string, operator: any, value: any) {
    try {
      const q = query(collection(this.firestore, collectionName), where(field, operator, value));
      const querySnapshot = await getDocs(q);
      const documents: any[] = [];
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      return documents;
    } catch (error) {
      throw error;
    }
  }

  // Métodos de Storage
  async uploadFile(file: File, path: string) {
    try {
      const storageRef = ref(this.storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      throw error;
    }
  }

  async getFileDownloadURL(path: string) {
    try {
      const storageRef = ref(this.storage, path);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      throw error;
    }
  }

  // ===== MÉTODOS DE TEMAS (compatibles con el servicio anterior) =====
  
  getTemasAll(): Observable<Tema[]> {
    return this.temas$;
  }

  getTemasSeccion(seccionTema: string): Observable<Tema[]> {
    return from(this.getTemasSeccionAsync(seccionTema));
  }

  private async getTemasSeccionAsync(seccionTema: string): Promise<Tema[]> {
    const temas = this.temasSubject.value;
    return temas.filter(tema => tema.seccion === seccionTema && tema.activo);
  }

  getTemaId(id: string): Observable<Tema[]> {
    return from(this.getTemaIdAsync(id));
  }

  private async getTemaIdAsync(id: string): Promise<Tema[]> {
    const temas = this.temasSubject.value;
    const tema = temas.find(t => t.id === id);
    return tema ? [tema] : [];
  }

  // ===== MÉTODOS DE SECCIONES =====
  
  getSecciones(): Observable<Seccion[]> {
    return this.secciones$;
  }

  async updateSeccion(item: SeccionModel, operacion: string): Promise<boolean> {
    try {
      if (this.offlineService.isConnected()) {
        const seccionesRef = collection(this.firestore, 'secciones');
        
        if (operacion === 'nuevo') {
          const docRef = await addDoc(seccionesRef, item);
          item.id = docRef.id;
        } else {
          await updateDoc(doc(this.firestore, 'secciones', item.id), { ...item });
        }
        
        // Actualizar datos locales
        await this.syncDataFromFirebase();
      } else {
        // TODO: Guardar cambios pendientes para sincronizar después
        console.log('Sin conexión, cambios guardados para sincronizar después');
      }
      return true;
    } catch (error) {
      console.error('Error actualizando sección:', error);
      return false;
    }
  }

  async borrarSeccion(id: string): Promise<boolean> {
    try {
      if (this.offlineService.isConnected()) {
        await deleteDoc(doc(this.firestore, 'secciones', id));
        await this.syncDataFromFirebase();
      } else {
        // TODO: Marcar para eliminar cuando haya conexión
        console.log('Sin conexión, eliminación pendiente');
      }
      return true;
    } catch (error) {
      console.error('Error eliminando sección:', error);
      return false;
    }
  }

  // ===== MÉTODOS DE PRÁCTICAS =====
  
  getPracticasAll(): Observable<Practica[]> {
    return this.practicas$;
  }

  getPracticas(temaId: string): Observable<Practica[]> {
    return from(this.getPracticasAsync(temaId));
  }

  private async getPracticasAsync(temaId: string): Promise<Practica[]> {
    const practicas = this.practicasSubject.value;
    return practicas.filter(practica => practica.tema === temaId && practica.activo);
  }

  async setPractica(practica: PracticaModel): Promise<boolean> {
    try {
      if (this.offlineService.isConnected()) {
        const practicasRef = collection(this.firestore, 'Practicas');
        const docRef = await addDoc(practicasRef, practica);
        practica.id = docRef.id;
        await this.syncDataFromFirebase();
      } else {
        console.log('Sin conexión, práctica guardada para sincronizar después');
      }
      return true;
    } catch (error) {
      console.error('Error creando práctica:', error);
      return false;
    }
  }

  async updatePractica(practica: PracticaModel): Promise<boolean> {
    try {
      if (this.offlineService.isConnected()) {
        await updateDoc(doc(this.firestore, 'Practicas', practica.id), { ...practica });
        await this.syncDataFromFirebase();
      } else {
        console.log('Sin conexión, actualización pendiente');
      }
      return true;
    } catch (error) {
      console.error('Error actualizando práctica:', error);
      return false;
    }
  }

  async deletePractica(id: string): Promise<boolean> {
    try {
      if (this.offlineService.isConnected()) {
        await deleteDoc(doc(this.firestore, 'Practicas', id));
        await this.syncDataFromFirebase();
      } else {
        console.log('Sin conexión, eliminación pendiente');
      }
      return true;
    } catch (error) {
      console.error('Error eliminando práctica:', error);
      return false;
    }
  }

  async updateOrdenTemas(temas: Tema[]): Promise<boolean> {
    try {
      if (this.offlineService.isConnected()) {
        const batch = temas.map(tema => 
          updateDoc(doc(this.firestore, 'Temas', tema.id), { orden: tema.orden })
        );
        await Promise.all(batch);
        await this.syncDataFromFirebase();
      } else {
        console.log('Sin conexión, reordenamiento pendiente');
      }
      return true;
    } catch (error) {
      console.error('Error actualizando orden de temas:', error);
      return false;
    }
  }

  // ===== MÉTODOS DE UTILIDAD =====
  
  // Forzar sincronización manual
  async forceSyncData(): Promise<void> {
    await this.syncDataFromFirebase();
  }

  // Obtener imagen local o remota
  async getImageUrl(tema: Tema): Promise<string | null> {
    if (tema.imagenLocal) {
      return await this.offlineService.getLocalImagePath(tema.imagenLocal);
    }
    return tema.imagen || null;
  }

  // Verificar si hay datos locales
  async hasLocalData(): Promise<boolean> {
    const temas = await this.offlineService.getData(this.STORAGE_KEYS.TEMAS);
    return temas && temas.length > 0;
  }

  // Obtener estado de sincronización
  async getSyncStatus(): Promise<SyncStatus | null> {
    return await this.offlineService.getData(this.STORAGE_KEYS.SYNC_STATUS);
  }
}
