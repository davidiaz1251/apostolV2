import { Injectable, inject } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Observable, BehaviorSubject, from } from 'rxjs';
import { OfflineService } from './offline.service';
import { Tema, Seccion, Practica, SyncStatus } from '../interfaces/tema.interface';
import { PracticaModel, SeccionModel } from '../models/models';
import { environment } from '../../environments/environment';

// Capacitor Firebase imports
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { FirebaseFirestore } from '@capacitor-firebase/firestore';
import { FirebaseStorage } from '@capacitor-firebase/storage';
import { FirebaseRemoteConfig } from '@capacitor-firebase/remote-config';
import { Capacitor } from '@capacitor/core';

// Web Firebase imports (for web platform)
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, UserCredential, getRedirectResult } from 'firebase/auth';
import { getFirestore, Firestore, collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getRemoteConfig, RemoteConfig, fetchAndActivate, getValue } from 'firebase/remote-config';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private offlineService = inject(OfflineService);
  private platform = inject(Platform);

  // Web Firebase instances
  private firebaseApp: FirebaseApp | null = null;
  private auth: Auth | null = null;
  private firestore: Firestore | null = null;
  private storage: any = null;
  private remoteConfig: RemoteConfig | null = null;

  // Observable del estado de autenticación
  private currentUser$ = new BehaviorSubject<any>(null);
  public user$ = this.currentUser$.asObservable();

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
    this.initializeFirebase();
    this.initializeOfflineData();
    this.initializeAuth();
  }

  // Inicializar Firebase
  private initializeFirebase() {
    if (!Capacitor.isNativePlatform()) {
      // Initialize Firebase for web platform
      if (getApps().length === 0) {
        this.firebaseApp = initializeApp(environment.firebase);
      } else {
        this.firebaseApp = getApps()[0];
      }
      
      this.auth = getAuth(this.firebaseApp);
      this.firestore = getFirestore(this.firebaseApp);
      this.storage = getStorage(this.firebaseApp);
      this.remoteConfig = getRemoteConfig(this.firebaseApp);
    }
  }

  // Inicializar autenticación
  private async initializeAuth() {
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await FirebaseAuthentication.getCurrentUser();
        this.currentUser$.next(result.user);
      } catch (error) {
        console.log('No user is currently signed in');
      }
    } else {
      // Web platform
      if (this.auth) {
        onAuthStateChanged(this.auth, (user) => {
          this.currentUser$.next(user);
        });
      }
    }
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
      
      if (Capacitor.isNativePlatform()) {
        await FirebaseRemoteConfig.setSettings({
          minimumFetchIntervalInSeconds: 10, // 10 segundos en desarrollo
          fetchTimeoutInSeconds: 10
        });
      } else {
        // Web platform
        if (this.remoteConfig) {
          this.remoteConfig.settings.minimumFetchIntervalMillis = 10000;
          this.remoteConfig.settings.fetchTimeoutMillis = 10000;
        }
      }
      
      console.log('✅ Remote Config configurado');
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
      
      if (Capacitor.isNativePlatform()) {
        // Obtener versión remota
        await FirebaseRemoteConfig.fetchAndActivate();
        const result = await FirebaseRemoteConfig.getString({ key: 'temas_version' });
        const remoteVersion = result.value || '1';
        
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
      } else {
        // Web platform
        if (this.remoteConfig) {
          await fetchAndActivate(this.remoteConfig);
          const remoteVersion = getValue(this.remoteConfig, 'temas_version').asString();
          
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
        } else {
          // Fallback: sincronizar directamente
          await this.syncDataFromFirebase();
        }
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
      
      // Obtener datos de Firebase usando las consultas nativas
      console.log('📡 Obteniendo datos de las colecciones...');
      
      let temasResult: any;
      let seccionesResult: any;
      let practicasResult: any;

      if (Capacitor.isNativePlatform()) {
        // Native platform
        [temasResult, seccionesResult, practicasResult] = await Promise.all([
          FirebaseFirestore.getCollection({
            reference: 'Temas'
          }),
          FirebaseFirestore.getCollection({
            reference: 'secciones'
          }),
          FirebaseFirestore.getCollection({
            reference: 'Practicas'
          })
        ]);
      } else {
        // Web platform
        [temasResult, seccionesResult, practicasResult] = await Promise.all([
          getDocs(query(collection(this.firestore!, 'Temas'), orderBy('orden'))),
          getDocs(collection(this.firestore!, 'secciones')),
          getDocs(collection(this.firestore!, 'Practicas'))
        ]);
      }

      let temasCount: number;
      let seccionesCount: number;
      let practicasCount: number;

      if (Capacitor.isNativePlatform()) {
        temasCount = temasResult.snapshots.length;
        seccionesCount = seccionesResult.snapshots.length;
        practicasCount = practicasResult.snapshots.length;
      } else {
        temasCount = temasResult.docs.length;
        seccionesCount = seccionesResult.docs.length;
        practicasCount = practicasResult.docs.length;
      }

      console.log('📊 Documentos obtenidos:');
      console.log('  - Temas:', temasCount);
      console.log('  - Secciones:', seccionesCount);
      console.log('  - Prácticas:', practicasCount);

      // Procesar temas
      const temas: Tema[] = [];
      
      if (Capacitor.isNativePlatform()) {
        for (const snapshot of temasResult.snapshots) {
          const data = snapshot.data as Tema;
          const tema = { ...data, id: snapshot.id };
          
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
      } else {
        for (const docSnapshot of temasResult.docs) {
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
      }
      
      // Ordenar temas por orden si existe la propiedad
      temas.sort((a, b) => (a.orden || 0) - (b.orden || 0));

      // Procesar secciones
      const secciones: Seccion[] = [];
      
      if (Capacitor.isNativePlatform()) {
        for (const snapshot of seccionesResult.snapshots) {
          const data = snapshot.data as Seccion;
          const seccion = { ...data, id: snapshot.id };
          secciones.push(seccion);
        }
      } else {
        for (const docSnapshot of seccionesResult.docs) {
          const data = docSnapshot.data() as Seccion;
          const seccion = { ...data, id: docSnapshot.id };
          secciones.push(seccion);
        }
      }

      // Procesar prácticas
      const practicas: Practica[] = [];
      
      if (Capacitor.isNativePlatform()) {
        for (const snapshot of practicasResult.snapshots) {
          const data = snapshot.data as Practica;
          practicas.push({ ...data, id: snapshot.id });
        }
      } else {
        practicasResult.forEach((docSnapshot: any) => {
          const data = docSnapshot.data() as Practica;
          practicas.push({ ...data, id: docSnapshot.id });
        });
      }

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
    }
  }

  // Métodos de Autenticación
  async login(email: string, password: string) {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await FirebaseAuthentication.signInWithEmailAndPassword({
          email,
          password
        });
        this.currentUser$.next(result.user);
        return result;
      } else {
        // Web platform
        const result = await signInWithEmailAndPassword(this.auth!, email, password);
        return result;
      }
    } catch (error) {
      throw error;
    }
  }

  async register(email: string, password: string) {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await FirebaseAuthentication.createUserWithEmailAndPassword({
          email,
          password
        });
        this.currentUser$.next(result.user);
        return result;
      } else {
        // Web platform
        const result = await createUserWithEmailAndPassword(this.auth!, email, password);
        return result;
      }
    } catch (error) {
      throw error;
    }
  }

  async loginWithGoogle() {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await FirebaseAuthentication.signInWithGoogle();
        this.currentUser$.next(result.user);
        return result;
      } else {
        // Web platform
        const provider = new GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        const result = await signInWithPopup(this.auth!, provider);
        return result;
      }
    } catch (error) {
      throw error;
    }
  }

  async logout() {
    try {
      if (Capacitor.isNativePlatform()) {
        await FirebaseAuthentication.signOut();
        this.currentUser$.next(null);
      } else {
        // Web platform
        await signOut(this.auth!);
      }
    } catch (error) {
      throw error;
    }
  }

  // Método público para obtener el usuario actual
  getCurrentUser(): any {
    return this.currentUser$.value;
  }

  // Verificar si estamos en un dispositivo móvil
  private isMobileDevice(): boolean {
    return this.platform.is('mobile') || this.platform.is('tablet');
  }

  // Método para verificar el resultado del redirect (compatibility)
  async checkRedirectResult(): Promise<UserCredential | null> {
    try {
      if (Capacitor.isNativePlatform()) {
        // En el plugin nativo, esto no es necesario
        return null;
      } else {
        // En web, usar Firebase Web SDK
        if (!this.auth) {
          throw new Error('Auth not initialized');
        }
        const result = await getRedirectResult(this.auth);
        return result;
      }
    } catch (error) {
      throw error;
    }
  }

  // Métodos de Firestore
  async addDocument(collectionName: string, data: any) {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await FirebaseFirestore.addDocument({
          reference: collectionName,
          data
        });
        return result;
      } else {
        // Web platform
        const docRef = await addDoc(collection(this.firestore!, collectionName), data);
        return docRef;
      }
    } catch (error) {
      throw error;
    }
  }

  async getDocuments(collectionName: string) {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await FirebaseFirestore.getCollection({
          reference: collectionName
        });
        return result.snapshots.map(snapshot => ({
          id: snapshot.id,
          ...snapshot.data
        }));
      } else {
        // Web platform
        const querySnapshot = await getDocs(collection(this.firestore!, collectionName));
        const documents: any[] = [];
        querySnapshot.forEach((doc) => {
          documents.push({ id: doc.id, ...doc.data() });
        });
        return documents;
      }
    } catch (error) {
      throw error;
    }
  }

  async updateDocument(collectionName: string, docId: string, data: any) {
    try {
      if (Capacitor.isNativePlatform()) {
        await FirebaseFirestore.updateDocument({
          reference: `${collectionName}/${docId}`,
          data
        });
      } else {
        // Web platform
        const docRef = doc(this.firestore!, collectionName, docId);
        await updateDoc(docRef, data);
      }
    } catch (error) {
      throw error;
    }
  }

  async deleteDocument(collectionName: string, docId: string) {
    try {
      if (Capacitor.isNativePlatform()) {
        await FirebaseFirestore.deleteDocument({
          reference: `${collectionName}/${docId}`
        });
      } else {
        // Web platform
        const docRef = doc(this.firestore!, collectionName, docId);
        await deleteDoc(docRef);
      }
    } catch (error) {
      throw error;
    }
  }

  async queryDocuments(collectionName: string, field: string, operator: any, value: any) {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await FirebaseFirestore.getCollection({
          reference: collectionName
        });
        // Filter manually since the query API might not be available
        return result.snapshots
          .filter(snapshot => {
            const data = snapshot.data as any;
            switch (operator) {
              case '==':
                return data[field] === value;
              case '!=':
                return data[field] !== value;
              case '>':
                return data[field] > value;
              case '>=':
                return data[field] >= value;
              case '<':
                return data[field] < value;
              case '<=':
                return data[field] <= value;
              default:
                return true;
            }
          })
          .map(snapshot => ({
            id: snapshot.id,
            ...snapshot.data
          }));
      } else {
        // Web platform
        const q = query(collection(this.firestore!, collectionName), where(field, operator, value));
        const querySnapshot = await getDocs(q);
        const documents: any[] = [];
        querySnapshot.forEach((doc) => {
          documents.push({ id: doc.id, ...doc.data() });
        });
        return documents;
      }
    } catch (error) {
      throw error;
    }
  }

  // Métodos de Storage
  async uploadFile(file: File, path: string) {
    try {
      if (Capacitor.isNativePlatform()) {
        const blob = new Blob([file], { type: file.type });
        const result = await FirebaseStorage.uploadFile({
          path,
          blob
        }, (progress) => {
          console.log('Upload progress:', progress);
        });
        return result;
      } else {
        // Web platform
        const storageRef = ref(this.storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
      }
    } catch (error) {
      throw error;
    }
  }

  async getFileDownloadURL(path: string) {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await FirebaseStorage.getDownloadUrl({
          path
        });
        return result.downloadUrl;
      } else {
        // Web platform
        const storageRef = ref(this.storage, path);
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
      }
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
        if (operacion === 'nuevo') {
          if (Capacitor.isNativePlatform()) {
            const result = await FirebaseFirestore.addDocument({
              reference: 'secciones',
              data: { ...item }
            });
            // The result contains the document reference, extract the ID
            item.id = result.reference.id;
          } else {
            // Web platform
            const docRef = await addDoc(collection(this.firestore!, 'secciones'), item);
            item.id = docRef.id;
          }
        } else {
          if (Capacitor.isNativePlatform()) {
            await FirebaseFirestore.updateDocument({
              reference: `secciones/${item.id}`,
              data: { ...item }
            });
          } else {
            // Web platform
            await updateDoc(doc(this.firestore!, 'secciones', item.id), { ...item });
          }
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
        if (Capacitor.isNativePlatform()) {
          await FirebaseFirestore.deleteDocument({
            reference: `secciones/${id}`
          });
        } else {
          // Web platform
          await deleteDoc(doc(this.firestore!, 'secciones', id));
        }
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
        if (Capacitor.isNativePlatform()) {
          const result = await FirebaseFirestore.addDocument({
            reference: 'Practicas',
            data: { ...practica }
          });
          practica.id = result.reference.id;
        } else {
          // Web platform
          const docRef = await addDoc(collection(this.firestore!, 'Practicas'), practica);
          practica.id = docRef.id;
        }
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
        if (Capacitor.isNativePlatform()) {
          await FirebaseFirestore.updateDocument({
            reference: `Practicas/${practica.id}`,
            data: { ...practica }
          });
        } else {
          // Web platform
          await updateDoc(doc(this.firestore!, 'Practicas', practica.id), { ...practica });
        }
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
        if (Capacitor.isNativePlatform()) {
          await FirebaseFirestore.deleteDocument({
            reference: `Practicas/${id}`
          });
        } else {
          // Web platform
          await deleteDoc(doc(this.firestore!, 'Practicas', id));
        }
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
        if (Capacitor.isNativePlatform()) {
          const updates = temas.map(tema => 
            FirebaseFirestore.updateDocument({
              reference: `Temas/${tema.id}`,
              data: { orden: tema.orden }
            })
          );
          await Promise.all(updates);
        } else {
          // Web platform
          const batch = temas.map(tema => 
            updateDoc(doc(this.firestore!, 'Temas', tema.id), { orden: tema.orden })
          );
          await Promise.all(batch);
        }
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
