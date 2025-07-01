import { Component, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonSpinner, IonChip, IonLabel } from '@ionic/angular/standalone';
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
  
  temas: Tema[] = [];
  secciones: Seccion[] = [];
  temasAgrupados: { [seccion: string]: Tema[] } = {};
  isLoading = true;

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
    });

    this.firebaseService.temas$.subscribe(temas => {
      this.temas = temas;
      console.log('📋 Temas cargados:', this.temas.length);
      this.agruparTemas();
      this.isLoading = false;
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
  }

  getSecciones(): string[] {
    return Object.keys(this.temasAgrupados);
  }

  getSeccionInfo(seccionNombre: string): Seccion | null {
    return this.secciones.find(s => s.nombre === seccionNombre) || null;
  }

  onTemaClick(tema: Tema) {
    console.log('Tema seleccionado:', tema.titulo);
    // TODO: Navegar a la página de detalle del tema
  }
}
