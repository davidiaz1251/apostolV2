import { Component, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonSpinner, IonChip, IonLabel } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { CommonModule } from '@angular/common';
import { Tema, Seccion } from '../../interfaces/tema.interface';
import { addIcons } from 'ionicons';
import { book, chevronForward, play, image } from 'ionicons/icons';
import { register } from 'swiper/element/bundle';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonSpinner, IonChip, IonLabel, CommonModule
  ],
})
export class HomePage implements OnInit {
  private firebaseService = inject(FirebaseService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  
  temas: Tema[] = [];
  secciones: Seccion[] = [];
  temasAgrupados: { [seccion: string]: Tema[] } = {};
  isLoading = true;
  // Evita navegaciones duplicadas al tocar en mobile (touchend + click)
  isNavigating = false;

  constructor() {
    addIcons({ book, chevronForward, play, image });
    register();
  }

  ngOnInit() {
    this.loadData();
  }

  private async loadData() {
    // Cargar secciones y temas
    this.firebaseService.secciones$.subscribe(secciones => {
      this.secciones = secciones;
      console.log('📂 Secciones cargadas:', this.secciones.length);
      this.agruparTemas();
      // Detectar cambios manualmente para aplicaciones zoneless
      this.cdr.detectChanges();
    });

    this.firebaseService.temas$.subscribe(temas => {
      this.temas = temas;
      console.log('📋 Temas cargados:', this.temas.length);
      this.agruparTemas();
      this.isLoading = false;
      // Detectar cambios manualmente para aplicaciones zoneless
      this.cdr.detectChanges();
    });
  }

  private agruparTemas() {
    if (this.temas.length === 0 || this.secciones.length === 0) return;

    this.temasAgrupados = {};
    
    // Agrupar temas por sección
    this.secciones.forEach(seccion => {
      const temasDeSeccion = this.temas
        .filter(tema => tema.seccion === seccion.nombre)
        .sort((a, b) => a.orden - b.orden); // Ordenar por orden
      
      if (temasDeSeccion.length > 0) {
        this.temasAgrupados[seccion.nombre] = temasDeSeccion;
      }
    });

    console.log('📊 Temas agrupados:', this.temasAgrupados);
    // Detectar cambios manualmente para aplicaciones zoneless
    this.cdr.detectChanges();
  }

  getSecciones(): string[] {
    return Object.keys(this.temasAgrupados);
  }

  getSeccionInfo(seccionNombre: string): Seccion | null {
    return this.secciones.find(s => s.nombre === seccionNombre) || null;
  }

  async onTemaClick(tema: Tema) {
    // Protege contra dobles disparos de eventos en dispositivos táctiles
    if (this.isNavigating) {
      console.log('Navegación en progreso, ignorando click adicional');
      return;
    }
    this.isNavigating = true;
    console.log('Tema seleccionado:', tema.titulo);
    try {
      await this.router.navigate(['/tema', tema.id]);
    } catch (err) {
      console.error('Error navegando al tema:', err);
    } finally {
      // Liberar el lock después de un pequeño retardo para permitir interacciones posteriores
      setTimeout(() => { this.isNavigating = false; }, 300);
    }
  }
}
