import { Injectable, inject } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Observable, BehaviorSubject, from } from 'rxjs';
import { OfflineService } from './offline.service';
import { Tema, Seccion, Practica, SyncStatus } from '../interfaces/tema.interface';
import { PracticaModel, SeccionModel } from '../models/models';
import { environment } from '../../environments/environment';

import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { FirebaseFirestore } from '@capacitor-firebase/firestore';
import { FirebaseStorage } from '@capacitor-firebase/storage';
import { FirebaseRemoteConfig } from '@capacitor-firebase/remote-config';
import { Capacitor } from '@capacitor/core';

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

  private firebaseApp: FirebaseApp | null = null;
  private auth: Auth | null = null;
  private firestore: Firestore | null = null;
  private storage: any = null;
  private remoteConfig: RemoteConfig | null = null;

  private currentUser$ = new BehaviorSubject<any>(null);
  public user$ = this.currentUser$.asObservable();

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

  private async initializeFirebase() {
    if (Capacitor.isNativePlatform()) {
      try {
        await this.initializeNativeFirebase();
      } catch (error) {
        console.error('Error initializing native Firebase:', error);
      }
    } else {
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

  private async initializeNativeFirebase() {
    try {
      if (typeof FirebaseAuthentication !== 'undefined') {
        try {
          await FirebaseAuthentication.getCurrentUser();
        } catch (error) {
        }
      }
      
      if (typeof FirebaseFirestore === 'undefined') { /* No-op */ }
      if (typeof FirebaseStorage === 'undefined') { /* No-op */ }
      if (typeof FirebaseRemoteConfig === 'undefined') {
      }
      
    } catch (error) {
      console.error('Error initializing Firebase for native platform:', error);
      throw error;
    }
  }

  private async initializeAuth() {
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await FirebaseAuthentication.getCurrentUser();
        this.currentUser$.next(result.user);
      } catch (error) {
      }
    } else {
      if (this.auth) {
        onAuthStateChanged(this.auth, (user) => {
          this.currentUser$.next(user);
        });
      }
    }
  }

  private async initializeOfflineData() {
    await this.setupRemoteConfig();
    
    await this.loadLocalData();
    
    await this.checkVersionAndSync();
    
    this.offlineService.isOnline$.subscribe(async (isOnline) => {
      if (isOnline) {
        await this.checkVersionAndSync();
      }
    });
  }

  private async setupRemoteConfig() {
    try {
      if (Capacitor.isNativePlatform()) {
        await FirebaseRemoteConfig.setSettings({
          minimumFetchIntervalInSeconds: 10, // 10 segundos en desarrollo
          fetchTimeoutInSeconds: 10
        });
      } else {
        if (this.remoteConfig) {
          this.remoteConfig.settings.minimumFetchIntervalMillis = 10000;
          this.remoteConfig.settings.fetchTimeoutMillis = 10000;
        }
      }
    } catch (error) {
      console.error('❌ Error configurando Remote Config:', error);
    }
  }

  private async checkVersionAndSync() {
    if (!this.offlineService.isConnected()) {
      await this.loadLocalData();
      return;
    }

    try {
      if (Capacitor.isNativePlatform()) {
        await FirebaseRemoteConfig.fetchAndActivate();
        const result = await FirebaseRemoteConfig.getString({ key: 'temas_version' });
        const remoteVersion = result.value || '1';
        
        const localVersion = await this.offlineService.getData(this.STORAGE_KEYS.TEMAS_VERSION) || '0';
        if (remoteVersion !== localVersion) {
          await this.syncDataFromFirebase();
          await this.offlineService.setData(this.STORAGE_KEYS.TEMAS_VERSION, remoteVersion);
        }
      } else {
        if (this.remoteConfig) {
          await fetchAndActivate(this.remoteConfig);
          const remoteVersion = getValue(this.remoteConfig, 'temas_version').asString();
          
          const localVersion = await this.offlineService.getData(this.STORAGE_KEYS.TEMAS_VERSION) || '0';
          if (remoteVersion !== localVersion) {
            await this.syncDataFromFirebase();
            await this.offlineService.setData(this.STORAGE_KEYS.TEMAS_VERSION, remoteVersion);
          }
        } else {
          await this.syncDataFromFirebase();
        }
      }
    } catch (error) {
      console.error('❌ Error verificando versión:', error);
      await this.syncDataFromFirebase();
    }
  }

  private async loadLocalData() {
    try {
      const [temas, secciones, practicas] = await Promise.all([
        this.offlineService.getData(this.STORAGE_KEYS.TEMAS),
        this.offlineService.getData(this.STORAGE_KEYS.SECCIONES),
        this.offlineService.getData(this.STORAGE_KEYS.PRACTICAS)
      ]);

      if (temas) {
        this.temasSubject.next(temas);
      }
      if (secciones) {
        this.seccionesSubject.next(secciones);
      }
      if (practicas) {
        this.practicasSubject.next(practicas);
      }

      if (!temas && !secciones && !practicas) {
        console.log('⚠️ No se encontraron datos locales');
      }

    } catch (error) {
      console.error('❌ Error cargando datos locales:', error);
    }
  }

  async syncDataFromFirebase(): Promise<void> {
    if (!this.offlineService.isConnected()) {
      return;
    }

    try {
      let temasResult: any;
      let seccionesResult: any;
      let practicasResult: any;

      if (Capacitor.isNativePlatform()) {
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

      const temas: Tema[] = [];
      
      if (Capacitor.isNativePlatform()) {
        for (const snapshot of temasResult.snapshots) {
          const data = snapshot.data as Tema;
          const tema = { ...data, id: snapshot.id };
          
          if (tema.img && !tema.imagenLocal) {
            try {
              const imageName = `tema_${tema.id}_${Date.now()}.jpg`;
              const localPath = await this.offlineService.downloadAndSaveImage(tema.img, imageName);
              tema.imagenLocal = localPath;
            } catch (error) {
            }
          }
          
          temas.push(tema);
        }
      } else {
        for (const docSnapshot of temasResult.docs) {
          const data = docSnapshot.data() as Tema;
          const tema = { ...data, id: docSnapshot.id };
          
          if (tema.img && !tema.imagenLocal) {
            try {
              const imageName = `tema_${tema.id}_${Date.now()}.jpg`;
              const localPath = await this.offlineService.downloadAndSaveImage(tema.img, imageName);
              tema.imagenLocal = localPath;
            } catch (error) {
            }
          }
          
          temas.push(tema);
        }
      }
      
      temas.sort((a, b) => (a.orden || 0) - (b.orden || 0));

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

      this.temasSubject.next(temas);
      this.seccionesSubject.next(secciones);
      this.practicasSubject.next(practicas);
    } catch (error) {
      console.error('❌ Error sincronizando datos:', error);
    }
  }

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
        try {
          await FirebaseAuthentication.getCurrentUser();
        } catch (initError) {
          console.error('❌ Firebase no está inicializado correctamente:', initError);
          throw new Error('Firebase no está inicializado. Verifica tu configuración.');
        }
        
        const result = await FirebaseAuthentication.signInWithGoogle();
        
        const normalizedUser = this.normalizeUserData(result.user);
        
        this.currentUser$.next(normalizedUser);
        return result;
      } else {
        const provider = new GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        const result = await signInWithPopup(this.auth!, provider);
        
        const normalizedUser = this.normalizeUserData(result.user);
        
        this.currentUser$.next(normalizedUser);
        return result;
      }
    } catch (error) {
      console.error('❌ Error en login con Google:', error);
      throw error;
    }
  }

  async logout() {
    try {
      if (Capacitor.isNativePlatform()) {
        await FirebaseAuthentication.signOut();
        this.currentUser$.next(null);
      } else {
        await signOut(this.auth!);
      }
    } catch (error) {
      throw error;
    }
  }

  getCurrentUser(): any {
    return this.currentUser$.value;
  }

  private normalizeUserData(user: any): any {
    if (!user) return null;
    
    const photoURL = user.photoURL || user.photoUrl || '';
    
    const normalizedUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: photoURL,
      providerId: user.providerId || user.providerData?.[0]?.providerId || 'unknown'
    };
    
    return normalizedUser;
  }

  private isMobileDevice(): boolean {
    return this.platform.is('mobile') || this.platform.is('tablet');
  }

  async checkRedirectResult(): Promise<UserCredential | null> {
    try {
      if (Capacitor.isNativePlatform()) {
        return null;
      } else {
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

  async addDocument(collectionName: string, data: any) {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await FirebaseFirestore.addDocument({
          reference: collectionName,
          data
        });
        return result;
      } else {
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
        const storageRef = ref(this.storage, path);
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
      }
    } catch (error) {
      throw error;
    }
  }

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
            item.id = result.reference.id;
          } else {
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
            await updateDoc(doc(this.firestore!, 'secciones', item.id), { ...item });
          }
        }
        
        await this.syncDataFromFirebase();
      } else {
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
          await deleteDoc(doc(this.firestore!, 'secciones', id));
        }
        await this.syncDataFromFirebase();
      } else {
      }
      return true;
    } catch (error) {
      console.error('Error eliminando sección:', error);
      return false;
    }
  }

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
          const docRef = await addDoc(collection(this.firestore!, 'Practicas'), practica);
          practica.id = docRef.id;
        }
        await this.syncDataFromFirebase();
      } else {
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
          await updateDoc(doc(this.firestore!, 'Practicas', practica.id), { ...practica });
        }
        await this.syncDataFromFirebase();
      } else {
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
          await deleteDoc(doc(this.firestore!, 'Practicas', id));
        }
        await this.syncDataFromFirebase();
      } else {
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
          const batch = temas.map(tema => 
            updateDoc(doc(this.firestore!, 'Temas', tema.id), { orden: tema.orden })
          );
          await Promise.all(batch);
        }
        await this.syncDataFromFirebase();
      } else {
      }
      return true;
    } catch (error) {
      console.error('Error actualizando orden de temas:', error);
      return false;
    }
  }

  async forceSyncData(): Promise<void> {
    await this.syncDataFromFirebase();
  }

  async getImageUrl(tema: Tema): Promise<string | null> {
    if (tema.imagenLocal) {
      return await this.offlineService.getLocalImagePath(tema.imagenLocal);
    }
    return tema.img || null;
  }

  async hasLocalData(): Promise<boolean> {
    const temas = await this.offlineService.getData(this.STORAGE_KEYS.TEMAS);
    return temas && temas.length > 0;
  }

  async getSyncStatus(): Promise<SyncStatus | null> {
    return await this.offlineService.getData(this.STORAGE_KEYS.SYNC_STATUS);
  }
}
