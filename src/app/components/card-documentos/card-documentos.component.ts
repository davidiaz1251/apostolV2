import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonImg, IonIcon, IonButton } from '@ionic/angular/standalone';
import { DocumentoModel } from '../../models/models';
import { addIcons } from 'ionicons';
import { playCircleOutline, bookOutline, heartOutline } from 'ionicons/icons';

@Component({
  selector: 'app-card-documentos',
  templateUrl: './card-documentos.component.html',
  styleUrls: ['./card-documentos.component.scss'],
  standalone: true,
  imports: [CommonModule, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonImg, IonIcon, IonButton]
})
export class CardDocumentosComponent {
  @Input() documento!: DocumentoModel;
  private router = inject(Router);

  constructor() {
    addIcons({ playCircleOutline, bookOutline, heartOutline });
  }

  onDocumentoClick() {
    this.router.navigate(['/teaching-detail', this.documento.id]);
  }

  onVideoClick(event: Event) {
    event.stopPropagation();
    if (this.documento.video) {
      window.open(this.documento.video, '_blank');
    }
  }
}
