import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { IonBackButton, IonButtons, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonRow, IonSpinner, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bookOutline, refreshOutline } from 'ionicons/icons';
import { CardDocumentosComponent } from '../../components/card-documentos/card-documentos.component';
import { DocumentoModel } from '../../models/models';
import { DocumentosService } from '../../services/documentos.service';

@Component({
  selector: 'app-teachings',
  templateUrl: './teachings.page.html',
  styleUrls: ['./teachings.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, 
    IonGrid, IonRow, IonCol, IonSpinner, IonIcon, CommonModule, CardDocumentosComponent
  ]
})
export class TeachingsPage implements OnInit {
  private documentosService = inject(DocumentosService);
  
  ensenanzas: DocumentoModel[] = [];
  isLoading = true;

  constructor() {
    addIcons({ bookOutline, refreshOutline });
  }

  ngOnInit() {
    this.loadEnsenanzas();
  }

  private loadEnsenanzas() {
    this.isLoading = true;
    
    this.documentosService.getDocumentos('enseñanzas').subscribe({
      next: (data) => {
        this.ensenanzas = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        // Mostrar mensaje de error al usuario
        this.ensenanzas = [];
      }
    });
  }


  trackByEnsenanza(index: number, ensenanza: DocumentoModel): string {
    return ensenanza.id;
  }
}
