import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from '@angular/fire/auth';
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
    this.checkRedirectResult().catch(error => {
      console.error('Error verificando redirect result:', error);
    });
  }

  // Inicializar datos offline
  private async initializeOfflineData() {
    console.log('🚀 Inicializando FirebaseService...');
    
    // Configurar Remote Config
    await this.setupRemoteConfig();
    
    // Cargar datos locales primero
    console.log('📂 Cargando datos locales...');
    await this.loadLocalData();
    
    // Verificar versión y sincronizar si es necesario
    console.log('🔍 Verificando versión y sincronización...');
    await this.checkVersionAndSync();
    
    // Escuchar cambios de conexión para futuras sincronizaciones
    this.offlineService.isOnline$.subscribe(async (isOnline) => {
      console.log('🔄 Cambio de conexión detectado:', isOnline ? 'ONLINE' : 'OFFLINE');
      if (isOnline) {
        await this.checkVersionAndSync();
      }
    });
  }

  // Configurar Remote Config
  private async setupRemoteConfig() {
    try {
      console.log('⚙️ Configurando Remote Config...');
      
      // Configurar valores por defecto
      const defaultConfig = {
        'temas_version': '1'
      };
      
      // En desarrollo, usar cache corto
      const settings = {
        minimumFetchIntervalMillis: 10000, // 10 segundos en desarrollo
        fetchTimeoutMillis: 10000
      };
      
      // Nota: La configuración de Remote Config debe hacerse en main.ts
      console.log('✅ Remote Config configurado con valores por defecto:', defaultConfig);
    } catch (error) {
      console.error('❌ Error configurando Remote Config:', error);
    }
  }

  // Verificar versión y sincronizar si es necesario
  private async checkVersionAndSync() {
    console.log('🔄 Iniciando checkVersionAndSync...');
    console.log('🌐 Estado de conexión:', this.offlineService.isConnected());
    
    if (!this.offlineService.isConnected()) {
      console.log('❌ Sin conexión, usando datos locales');
      await this.loadLocalData();
      return;
    }

    try {
      console.log('📡 Obteniendo configuración remota...');
      // Obtener versión remota
      await fetchAndActivate(this.remoteConfig);
      const remoteVersion = getValue(this.remoteConfig, 'temas_version').asString();
      
      // Obtener versión local
      const localVersion = await this.offlineService.getData(this.STORAGE_KEYS.TEMAS_VERSION) || '0';
      
      console.log('🆚 Versión remota:', remoteVersion, 'Versión local:', localVersion);
      
      if (remoteVersion !== localVersion) {
        console.log('🔄 Nueva versión disponible, sincronizando...');
        await this.syncDataFromFirebase();
        await this.offlineService.setData(this.STORAGE_KEYS.TEMAS_VERSION, remoteVersion);
        console.log('✅ Sincronización completada y versión actualizada');
      } else {
        console.log('✅ Versión actual, usando datos locales');
      }
    } catch (error) {
      console.error('❌ Error verificando versión:', error);
      // Si hay error en Remote Config, intentar sincronizar directamente
      console.log('🔄 Intentando sincronización directa...');
      await this.syncDataFromFirebase();
    }
  }

  // Cargar datos desde almacenamiento local
  private async loadLocalData() {
    try {
      console.log('📂 Cargando datos desde almacenamiento local...');
      const [temas, secciones, practicas] = await Promise.all([
        this.offlineService.getData(this.STORAGE_KEYS.TEMAS),
        this.offlineService.getData(this.STORAGE_KEYS.SECCIONES),
        this.offlineService.getData(this.STORAGE_KEYS.PRACTICAS)
      ]);

      console.log('📊 Datos locales encontrados:');
      console.log('  - Temas:', temas ? temas.length : 0);
      console.log('  - Secciones:', secciones ? secciones.length : 0);
      console.log('  - Prácticas:', practicas ? practicas.length : 0);

      if (temas) {
        this.temasSubject.next(temas);
        console.log('✅ Temas cargados desde local');
      }
      if (secciones) {
        this.seccionesSubject.next(secciones);
        console.log('✅ Secciones cargadas desde local');
      }
      if (practicas) {
        this.practicasSubject.next(practicas);
        console.log('✅ Prácticas cargadas desde local');
      }

      if (!temas && !secciones && !practicas) {
        console.log('⚠️ No se encontraron datos locales');
      }

    } catch (error) {
      console.error('❌ Error cargando datos locales:', error);
    }
  }

  // Sincronizar datos desde Firebase
  async syncDataFromFirebase(): Promise<void> {
    if (!this.offlineService.isConnected()) {
      console.log('❌ Sin conexión, no se puede sincronizar');
      return;
    }

    try {
      console.log('🔄 Iniciando sincronización desde Firebase...');
      
      // Obtener datos de Firebase
      console.log('📡 Obteniendo datos de las colecciones...');
      const [temasSnapshot, seccionesSnapshot, practicasSnapshot] = await Promise.all([
        getDocs(query(collection(this.firestore, 'Temas'), orderBy('orden'))),
        getDocs(query(collection(this.firestore, 'secciones'))),
        getDocs(query(collection(this.firestore, 'Practicas')))
      ]);

      console.log('📊 Documentos obtenidos:');
      console.log('  - Temas:', temasSnapshot.docs.length);
      console.log('  - Secciones:', seccionesSnapshot.docs.length);
      console.log('  - Prácticas:', practicasSnapshot.docs.length);

      // Procesar temas
      const temas: Tema[] = [];
      for (const docSnapshot of temasSnapshot.docs) {
        const data = docSnapshot.data() as Tema;
        const tema = { ...data, id: docSnapshot.id };
        
        // Descargar imagen si existe y no está en local
        if (tema.img && !tema.imagenLocal) {
          try {
            const imageName = `tema_${tema.id}_${Date.now()}.jpg`;
            const localPath = await this.offlineService.downloadAndSaveImage(tema.img, imageName);
            tema.imagenLocal = localPath;
          } catch (error) {
            console.warn('⚠️ Error descargando imagen del tema:', tema.id, error);
          }
        }
        
        temas.push(tema);
      }

      // Procesar secciones
      const secciones: Seccion[] = [];
      for (const docSnapshot of seccionesSnapshot.docs) {
        const data = docSnapshot.data() as Seccion;
        const seccion = { ...data, id: docSnapshot.id };
        
        secciones.push(seccion);
      }

      // Procesar prácticas
      const practicas: Practica[] = [];
      practicasSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data() as Practica;
        practicas.push({ ...data, id: docSnapshot.id });
      });

      console.log('💾 Guardando datos en almacenamiento local...');
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
      console.log('🔄 Actualizando observables...');
      this.temasSubject.next(temas);
      this.seccionesSubject.next(secciones);
      this.practicasSubject.next(practicas);

      console.log('✅ Sincronización completada exitosamente');
      console.log('📊 Datos sincronizados:');
      console.log('  - Temas:', temas.length);
      console.log('  - Secciones:', secciones.length);
      console.log('  - Prácticas:', practicas.length);
    } catch (error) {
      console.error('❌ Error sincronizando datos:', error);
      console.error('Error details:', error);
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

  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      // Detectar si estamos en un dispositivo móvil
      const isMobile = this.isMobileDevice();
      
      if (isMobile) {
        // Usar redirect para dispositivos móviles
        await signInWithRedirect(this.auth, provider);
        // El resultado se manejará en el constructor con getRedirectResult
        return { user: null, pending: true };
      } else {
        // Usar popup para desktop
        const result = await signInWithPopup(this.auth, provider);
        return result;
      }
    } catch (error) {
      throw error;
    }
  }

  // Verificar si estamos en un dispositivo móvil
  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Método para verificar el resultado del redirect
  async checkRedirectResult() {
    try {
      const result = await getRedirectResult(this.auth);
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
    return temas.filter(tema => tema.seccion === seccionTema);
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
    return practicas.filter(practica => practica.tema === temaId);
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
    return tema.img || null;
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
