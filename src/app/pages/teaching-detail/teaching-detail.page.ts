import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonImg, IonButton, IonIcon, IonSpinner, IonChip, IonLabel } from '@ionic/angular/standalone';
import { DocumentosService } from '../../services/documentos.service';
import { DocumentoModel } from '../../models/models';
import { StyleDocumentoPipe } from '../../pipes/style-documento.pipe';
import { VideoPipe } from '../../pipes/video.pipe';
import { addIcons } from 'ionicons';
import { shareOutline, chevronUp, chevronDown, playCircle } from 'ionicons/icons';

@Component({
  selector: 'app-teaching-detail',
  templateUrl: './teaching-detail.page.html',
  styleUrls: ['./teaching-detail.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, 
    IonImg, IonButton, IonIcon, IonSpinner, IonChip, IonLabel, CommonModule, StyleDocumentoPipe, VideoPipe
  ]
})
export class TeachingDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private documentosService = inject(DocumentosService);
  private cdr = inject(ChangeDetectorRef);
  
  documento: DocumentoModel | null = null;
  isLoading = true;
  documentoId: string | null = null;
  showVideo = false;

  constructor() {
    addIcons({ shareOutline, chevronUp, chevronDown, playCircle });
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
        // Detectar cambios manualmente para aplicaciones zoneless
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading documento:', error);
        this.isLoading = false;
        // Detectar cambios manualmente para aplicaciones zoneless
        this.cdr.detectChanges();
      }
    });
  }

  onPlayVideo() {
    this.showVideo = !this.showVideo;
    // Detectar cambios manualmente para aplicaciones zoneless
    this.cdr.detectChanges();
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
}
