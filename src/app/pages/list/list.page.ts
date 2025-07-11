import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonButton, IonList, IonItem, IonLabel, IonBadge, ToastController } from '@ionic/angular/standalone';
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
import { Subscription } from 'rxjs';

import { FavoritesService } from '../../services/favorites.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.page.html',
  styleUrls: ['./list.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonButton,
    IonList, IonItem, IonLabel, IonBadge, CommonModule
  ],
})
export class ListPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private favoritesService = inject(FavoritesService);
  private toastController = inject(ToastController);

  favoritesCount = 0;
  private subscription?: Subscription;

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
    this.subscription = this.favoritesService.favorites$.subscribe(favorites => {
      this.favoritesCount = favorites.length;
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  navigateToSection(section: string) {
    switch (section) {
      case 'practices':
        // Navegar a la sección de prácticas
        this.router.navigate(['/practices']);
        break;
      case 'curiosities':
        // Mostrar toast de próximamente
        this.showComingSoonToast();
        break;
      case 'teachings':
        // Navegar a la sección de enseñanzas
        this.router.navigate(['/teachings']);
        break;
    }
  }

  openSearch() {
    console.log('Abriendo búsqueda');
    // Implementar funcionalidad de búsqueda
    this.showComingSoonToast();

  }

  openFavorites() {
    this.router.navigate(['/favorites']);
  }

  private async showComingSoonToast() {
    const toast = await this.toastController.create({
      message: 'Próximamente disponible',
      duration: 2000,
      position: 'bottom',
      color: 'primary'
    });
    toast.present();
  }
}
