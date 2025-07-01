import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, 
  IonButton, IonIcon, IonSpinner, IonChip, IonLabel, IonFab, IonFabButton 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  heartOutline, heart, shareOutline, documentText, playCircle, 
  chevronUp, chevronDown, chevronBack, chevronForward, home, alertCircle 
} from 'ionicons/icons';
import { Subscription } from 'rxjs';

import { FirebaseService } from '../../services/firebase.service';
import { Tema } from '../../interfaces/tema.interface';
import { StyleDocumentoPipe } from '../../pipes/style-documento.pipe';
import { VideoPipe } from '../../pipes/video.pipe';

@Component({
  selector: 'app-tema-detail',
  templateUrl: './tema-detail.page.html',
  styleUrls: ['./tema-detail.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonButton, IonIcon, IonSpinner, IonChip, IonLabel, IonFab, IonFabButton,
    StyleDocumentoPipe, VideoPipe
  ]
})
export class TemaDetailPage implements OnInit, OnDestroy {
  @ViewChild('textContent', { static: false }) textContent!: ElementRef;
  
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private firebaseService = inject(FirebaseService);
  
  tema: Tema | null = null;
  videos: string[] = [];
  isLoading = true;
  isFavorite = false;
  showScrollToTop = false;
  expandedVideos: boolean[] = [];
  
  // Navegación entre temas
  previousTema: Tema | null = null;
  nextTema: Tema | null = null;
  allTemas: Tema[] = [];
  
  private subscriptions: Subscription[] = [];

  constructor() {
    addIcons({ 
      heartOutline, heart, shareOutline, documentText, playCircle,
      chevronUp, chevronDown, chevronBack, chevronForward, home, alertCircle 
    });
  }

  ngOnInit() {
    this.loadTema();
    this.setupScrollListener();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadTema() {
    const temaId = this.route.snapshot.paramMap.get('id');
    
    if (!temaId) {
      this.isLoading = false;
      return;
    }

    // Suscribirse a los temas
    const temasSub = this.firebaseService.temas$.subscribe(temas => {
      this.allTemas = temas;
      this.tema = temas.find(t => t.id === temaId) || null;
      
      if (this.tema) {
        this.processVideos();
        this.setupNavigation();
        this.checkFavoriteStatus();
      }
      
      this.isLoading = false;
    });

    this.subscriptions.push(temasSub);
  }

  private processVideos() {
    if (!this.tema?.video) {
      this.videos = [];
      return;
    }

    // Procesar videos - pueden ser URLs separadas por comas o una sola URL
    this.videos = this.tema.video
      .split(',')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    // Inicializar estado expandido de videos (todos colapsados inicialmente)
    this.expandedVideos = new Array(this.videos.length).fill(false);
  }

  private setupNavigation() {
    if (!this.tema || this.allTemas.length === 0) return;

    // Ordenar temas por orden
    const sortedTemas = this.allTemas
      .filter(t => t.seccion === this.tema!.seccion)
      .sort((a, b) => a.orden - b.orden);

    const currentIndex = sortedTemas.findIndex(t => t.id === this.tema!.id);
    
    if (currentIndex > 0) {
      this.previousTema = sortedTemas[currentIndex - 1];
    }
    
    if (currentIndex < sortedTemas.length - 1) {
      this.nextTema = sortedTemas[currentIndex + 1];
    }
  }

  private setupScrollListener() {
    // Listener para mostrar/ocultar el botón de scroll to top
    const content = document.querySelector('ion-content');
    if (content) {
      content.addEventListener('ionScroll', (event: any) => {
        this.showScrollToTop = event.detail.scrollTop > 300;
      });
    }
  }

  private checkFavoriteStatus() {
    // TODO: Implementar lógica de favoritos
    this.isFavorite = false;
  }

  // Métodos de acción
  toggleFavorite() {
    if (!this.tema) return;
    
    this.isFavorite = !this.isFavorite;
    // TODO: Implementar lógica de favoritos en el servicio
    console.log('Toggle favorite for tema:', this.tema.id, this.isFavorite);
  }

  shareContent() {
    if (!this.tema) return;

    if (navigator.share) {
      navigator.share({
        title: this.tema.titulo,
        text: this.tema.intro || 'Contenido interesante',
        url: window.location.href
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback para navegadores que no soportan Web Share API
      const shareData = {
        title: this.tema.titulo,
        url: window.location.href
      };
      
      // Copiar al clipboard o usar método alternativo
      navigator.clipboard?.writeText(shareData.url)
        .then(() => {
          // TODO: Mostrar toast de confirmación
          console.log('URL copied to clipboard');
        })
        .catch(err => console.log('Error copying to clipboard:', err));
    }
  }

  toggleVideoExpand(index: number) {
    this.expandedVideos[index] = !this.expandedVideos[index];
  }

  navigateToTema(tema: Tema) {
    this.router.navigate(['/tema', tema.id]);
  }

  scrollToTop() {
    const content = document.querySelector('ion-content');
    if (content) {
      content.scrollToTop(500);
    }
  }

  // Método para navegar de vuelta a home
  goHome() {
    this.router.navigate(['/home']);
  }
}
