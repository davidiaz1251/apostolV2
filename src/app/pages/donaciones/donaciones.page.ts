import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButtons, 
  IonBackButton, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent, 
  IonIcon
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import {
  giftOutline
} from 'ionicons/icons';

// Importar el pipe de video y el servicio
import { VideoPipe } from '../../pipes/video.pipe';
import { DocumentosService } from '../../services/documentos.service';

@Component({
  selector: 'app-donaciones',
  templateUrl: './donaciones.page.html',
  styleUrls: ['./donaciones.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon,
    CommonModule, VideoPipe
  ]
})
export class DonacionesPage implements OnInit {
  private documentosService = inject(DocumentosService);
  private cdr = inject(ChangeDetectorRef);
  
  documento: any;
  videos: string[] = [];

  constructor() {
    addIcons({
      giftOutline
    });
  }

  ngOnInit() {
    // Cargar datos de donación desde Firebase
    this.loadDonationData();
  }

  private loadDonationData() {
    // Cargar datos desde Firebase usando el servicio
    this.documentosService.getDocumentoDonacion().subscribe(data => {
      if (data && data.length > 0) {
        this.documento = data[0];
        // Procesar videos si existen
        this.videos = data[0]['video'] != undefined ? data[0]['video'].split(',') : [];
        console.log('Documento de donación cargado:', this.documento);
        // Detectar cambios manualmente para aplicaciones zoneless
        this.cdr.detectChanges();
      }
    });
  }
}
