import { Component, OnInit, inject } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonButton, IonList, IonItem, IonLabel } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  heartOutline, 
  bulbOutline, 
  bookOutline,
  searchOutline,
  bookmarkOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-list',
  templateUrl: './list.page.html',
  styleUrls: ['./list.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonButton,
    IonList, IonItem, IonLabel, CommonModule
  ],
})
export class ListPage implements OnInit {
  private router = inject(Router);

  constructor() {
    addIcons({ 
      heartOutline, 
      bulbOutline, 
      bookOutline,
      searchOutline,
      bookmarkOutline
    });
  }

  ngOnInit() {
    // Inicialización del componente
  }

  navigateToSection(section: string) {
    switch(section) {
      case 'practices':
        // Navegar a la sección de prácticas
        console.log('Navegando a Prácticas');
        break;
      case 'curiosities':
        // Navegar a la sección de datos curiosos
        console.log('Navegando a Datos Curiosos');
        break;
      case 'teachings':
        // Navegar a la sección de enseñanzas
        console.log('Navegando a Enseñanzas');
        break;
    }
  }

  openSearch() {
    console.log('Abriendo búsqueda');
    // Implementar funcionalidad de búsqueda
  }

  openFavorites() {
    console.log('Abriendo favoritos');
    // Implementar funcionalidad de favoritos
  }
}
