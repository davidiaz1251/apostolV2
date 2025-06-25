import { Component, OnInit, inject } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon, IonSpinner, IonGrid, IonRow, IonCol } from '@ionic/angular/standalone';
import { FirebaseService } from '../../services/firebase.service';
import { CommonModule } from '@angular/common';
import { Tema } from '../../interfaces/tema.interface';
import { addIcons } from 'ionicons';
import { book } from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, 
    IonCardContent, IonIcon, IonSpinner, IonGrid, IonRow, IonCol, CommonModule
  ],
})
export class HomePage implements OnInit {
  private firebaseService = inject(FirebaseService);
  
  temas: Tema[] = [];
  isLoading = true;

  constructor() {
    addIcons({ book });
  }

  ngOnInit() {
    this.loadTemas();
  }

  private async loadTemas() {
    // Cargar temas (el servicio maneja offline/online automáticamente)
    this.firebaseService.temas$.subscribe(temas => {
      console.log('📋 Todos los temas recibidos:', temas.length);
      if (temas.length > 0) {
        console.log('📋 Primer tema:', {
          id: temas[0].id,
          titulo: temas[0].titulo,
          img: temas[0].img,
          intro: temas[0].intro
        });
      }
      
      this.temas = temas;
      this.isLoading = false;
      console.log('Temas mostrados en UI:', this.temas.length);
    });
  }

  onTemaClick(tema: Tema) {
    console.log('Tema seleccionado:', tema.titulo);
    // TODO: Navegar a la página de detalle del tema
  }
}
