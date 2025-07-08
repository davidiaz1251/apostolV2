import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, 
  IonLabel, IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, 
  IonCardContent, IonButtons, IonThumbnail, IonImg, IonChip, IonText,
  IonGrid, IonRow, IonCol, IonSearchbar, IonSegment, IonSegmentButton,
  IonRefresher, IonRefresherContent,
  AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  heart, heartOutline, bookOutline, playCircle, documentText, 
  searchOutline, gridOutline, listOutline, timeOutline, trashOutline,
  shareOutline, refreshOutline, chevronForwardOutline
} from 'ionicons/icons';
import { Subscription } from 'rxjs';

import { FavoritesService } from '../../services/favorites.service';
import { Tema } from '../../interfaces/tema.interface';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.page.html',
  styleUrls: ['./favorites.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
    IonLabel, IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonButtons, IonThumbnail, IonImg, IonChip, IonText,
    IonGrid, IonRow, IonCol, IonSearchbar, IonSegment, IonSegmentButton,
    IonRefresher, IonRefresherContent
  ]
})
export class FavoritesPage implements OnInit, OnDestroy {
  private favoritesService = inject(FavoritesService);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  
  favorites: Tema[] = [];
  filteredFavorites: Tema[] = [];
  searchTerm = '';
  viewMode: 'grid' | 'list' = 'grid';
  sortBy: 'recent' | 'title' | 'section' = 'recent';
  isLoading = false;
  
  private subscriptions: Subscription[] = [];

  constructor() {
    addIcons({ 
      heart, heartOutline, bookOutline, playCircle, documentText,
      searchOutline, gridOutline, listOutline, timeOutline, trashOutline,
      shareOutline, refreshOutline, chevronForwardOutline
    });
  }

  ngOnInit() {
    this.loadFavorites();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadFavorites() {
    const favoritesSub = this.favoritesService.favorites$.subscribe(favorites => {
      this.favorites = favorites;
      this.applyFiltersAndSort();
    });
    
    this.subscriptions.push(favoritesSub);
  }

  private applyFiltersAndSort() {
    let filtered = [...this.favorites];

    // Aplicar filtro de búsqueda
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(tema => 
        tema.titulo.toLowerCase().includes(searchLower) ||
        tema.intro.toLowerCase().includes(searchLower) ||
        tema.seccion.toLowerCase().includes(searchLower)
      );
    }

    // Aplicar ordenamiento
    switch (this.sortBy) {
      case 'title':
        filtered.sort((a, b) => a.titulo.localeCompare(b.titulo));
        break;
      case 'section':
        filtered.sort((a, b) => {
          const sectionCompare = a.seccion.localeCompare(b.seccion);
          return sectionCompare !== 0 ? sectionCompare : a.orden - b.orden;
        });
        break;
      case 'recent':
      default:
        // Mantener el orden original (más recientes primero)
        break;
    }

    this.filteredFavorites = filtered;
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value || '';
    this.applyFiltersAndSort();
  }

  onSortChange(event: any) {
    this.sortBy = event.detail.value;
    this.applyFiltersAndSort();
  }

  onViewModeChange(event: any) {
    this.viewMode = event.detail.value;
  }

  openTema(tema: Tema) {
    this.router.navigate(['/tema', tema.id]);
  }

  removeFavorite(tema: Tema, event: Event) {
    event.stopPropagation();
    this.favoritesService.removeFavorite(tema.id);
    
    // Mostrar toast de confirmación
    this.showToast(`"${tema.titulo}" removido de favoritos`, 'medium');
  }

  shareContent(tema: Tema, event: Event) {
    event.stopPropagation();
    
    if (navigator.share) {
      navigator.share({
        title: tema.titulo,
        text: tema.intro || 'Contenido interesante',
        url: `${window.location.origin}/tema/${tema.id}`
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback para navegadores que no soportan Web Share API
      const shareUrl = `${window.location.origin}/tema/${tema.id}`;
      navigator.clipboard?.writeText(shareUrl)
        .then(() => {
          console.log('URL copied to clipboard');
        })
        .catch(err => console.log('Error copying to clipboard:', err));
    }
  }

  async clearAllFavorites() {
    const alert = await this.alertController.create({
      header: 'Limpiar favoritos',
      message: '¿Estás seguro de que quieres eliminar todos los favoritos?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.favoritesService.clearFavorites();
            this.showToast('Todos los favoritos han sido eliminados', 'medium');
          }
        }
      ]
    });

    await alert.present();
  }

  doRefresh(event: any) {
    // Simular actualización
    setTimeout(() => {
      this.loadFavorites();
      event.target.complete();
    }, 1000);
  }

  hasVideo(tema: Tema): boolean {
    return !!(tema.video && typeof tema.video === 'string' && tema.video.trim().length > 0);
  }

  getSectionDisplayName(seccion: string): string {
    // Capitalizar primera letra de cada palabra
    return seccion.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private async showToast(message: string, color: string = 'medium') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color
    });

    await toast.present();
  }
}
