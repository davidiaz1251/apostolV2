import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonImg, IonButton, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { DocumentosService } from '../../services/documentos.service';
import { DocumentoModel } from '../../models/models';
import { StyleDocumentoPipe } from '../../pipes/style-documento.pipe';
import { addIcons } from 'ionicons';
import { playCircleOutline, shareOutline, bookmarkOutline } from 'ionicons/icons';

@Component({
  selector: 'app-teaching-detail',
  templateUrl: './teaching-detail.page.html',
  styleUrls: ['./teaching-detail.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, 
    IonImg, IonButton, IonIcon, IonSpinner, CommonModule, StyleDocumentoPipe
  ]
})
export class TeachingDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private documentosService = inject(DocumentosService);
  
  documento: DocumentoModel | null = null;
  isLoading = true;
  documentoId: string | null = null;

  constructor() {
    addIcons({ playCircleOutline, shareOutline, bookmarkOutline });
  }

  ngOnInit() {
    this.documentoId = this.route.snapshot.paramMap.get('id');
    if (this.documentoId) {
      this.loadDocumento();
    }
  }

  private loadDocumento() {
    if (!this.documentoId) return;
    
    this.documentosService.getDocumentoById(this.documentoId).subscribe({
      next: (documento) => {
        this.documento = documento || null;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading documento:', error);
        this.isLoading = false;
      }
    });
  }

  onPlayVideo() {
    if (this.documento?.video) {
      window.open(this.documento.video, '_blank');
    }
  }

  onShare() {
    if (this.documento && navigator.share) {
      navigator.share({
        title: this.documento.titulo,
        text: this.documento.intro,
        url: window.location.href
      });
    }
  }

  onBookmark() {
    // Implementar funcionalidad de favoritos
    console.log('Agregando a favoritos:', this.documento?.titulo);
  }
}
