import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonButtons, 
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonSpinner,
  IonButton,
  IonChip
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  arrowBackOutline, 
  bookOutline, 
  playCircleOutline, 
  checkmarkCircleOutline,
  timeOutline,
  alertCircleOutline,
  refreshOutline,
  libraryOutline
} from 'ionicons/icons';

import { FirebaseService } from '../../services/firebase.service';
import { Tema, Seccion } from '../../interfaces/tema.interface';

@Component({
  selector: 'app-practices',
  templateUrl: './practices.page.html',
  styleUrls: ['./practices.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonList, IonItem, IonLabel, IonIcon, IonSpinner, IonButton, IonChip,
    CommonModule, FormsModule
  ]
})
export class PracticesPage implements OnInit, OnDestroy {
  private firebaseService = inject(FirebaseService);
  private router = inject(Router);

  secciones: Seccion[] = [];
  allTemas: { [key: string]: Tema[] } = {};
  isLoading = true;
  error: string | null = null;

  private subscriptions: Subscription[] = [];

  constructor() {
    addIcons({ 
      arrowBackOutline, 
      bookOutline, 
      playCircleOutline, 
      checkmarkCircleOutline,
      timeOutline,
      alertCircleOutline,
      refreshOutline,
      libraryOutline
    });
  }

  ngOnInit() {
    this.loadDataFromObservables();
  }

  ngOnDestroy() {
    // Limpiar suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadDataFromObservables() {
    this.isLoading = true;
    this.error = null;

    let temasData: Tema[] = [];
    let seccionesData: Seccion[] = [];

    // Suscribirse a las secciones desde el observable del servicio
    const seccionesSub = this.firebaseService.secciones$.subscribe({
      next: (secciones) => {
        console.log('📂 Secciones obtenidas desde observable:', secciones);
        seccionesData = secciones;
        this.secciones = secciones;
        this.organizeTemasData(temasData, seccionesData);
      },
      error: (error) => {
        console.error('❌ Error obteniendo secciones:', error);
        this.error = 'Error al cargar las secciones';
        this.isLoading = false;
      }
    });

    // Suscribirse a los temas desde el observable del servicio
    const temasSub = this.firebaseService.temas$.subscribe({
      next: (temas) => {
        console.log('📚 Temas obtenidos desde observable:', temas);
        temasData = temas;
        this.organizeTemasData(temasData, seccionesData);
      },
      error: (error) => {
        console.error('❌ Error obteniendo temas:', error);
        this.error = 'Error al cargar los temas';
        this.isLoading = false;
      }
    });

    this.subscriptions.push(seccionesSub, temasSub);

    // Si después de 5 segundos no hay datos, intentar sincronización forzada
    setTimeout(() => {
      if (this.isLoading && (this.secciones.length === 0 || Object.keys(this.allTemas).length === 0)) {
        console.log('⚠️ Datos no disponibles después de 5s, intentando sincronización...');
        this.forceSync();
      }
    }, 5000);
  }

  private organizeTemasData(temas: Tema[], secciones: Seccion[]) {
    // Solo procesar si tenemos ambos datasets
    if (secciones.length === 0 || temas.length === 0) {
      console.log('⏳ Esperando datos completos...');
      return;
    }

    console.log('🔄 Organizando temas por sección...');
    
    // Limpiar el objeto de temas
    this.allTemas = {};

    // Organizar temas por sección
    for (const seccion of secciones) {
      const temasDeSeccion = temas
        .filter((tema: Tema) => tema.seccion === seccion.nombre)
        .sort((a: Tema, b: Tema) => a.orden - b.orden);
      
      this.allTemas[seccion.nombre] = temasDeSeccion;
      console.log(`📋 Sección "${seccion.nombre}": ${temasDeSeccion.length} temas`);
    }

    this.isLoading = false;
    console.log('✅ Datos organizados correctamente');
  }

  async forceSync() {
    try {
      console.log('🔄 Iniciando sincronización forzada...');
      this.isLoading = true;
      this.error = null;
      
      await this.firebaseService.syncDataFromFirebase();
      console.log('✅ Sincronización completada');
    } catch (error) {
      console.error('❌ Error en sincronización forzada:', error);
      this.error = 'Error al sincronizar datos. Verifique su conexión.';
      this.isLoading = false;
    }
  }

  async loadData() {
    // Método mantenido para compatibilidad con el botón de reintento
    await this.forceSync();
  }

  async openPractice(tema: Tema) {
    // Navegar a las pruebas del tema
    this.router.navigate(['/pruebas', tema.id]);
  }

  goBack() {
    this.router.navigate(['/list']);
  }

  getTotalTemas(): number {
    return Object.values(this.allTemas).reduce((total, temas) => total + temas.length, 0);
  }

  getSeccionTemas(seccionNombre: string): Tema[] {
    return this.allTemas[seccionNombre] || [];
  }
}
