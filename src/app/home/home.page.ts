import { Component, OnInit, inject } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonItem, IonInput, IonList } from '@ionic/angular/standalone';
import { FirebaseService } from '../services/firebase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonItem, IonInput, IonList, CommonModule, FormsModule],
})
export class HomePage implements OnInit {
  private firebaseService = inject(FirebaseService);
  
  testData = '';
  documents: any[] = [];
  isAuthenticated = false;
  email = '';
  password = '';

  constructor() {}

  ngOnInit() {
    // Suscribirse al estado de autenticación
    this.firebaseService.user$.subscribe(user => {
      this.isAuthenticated = !!user;
      console.log('Usuario autenticado:', !!user);
    });
  }

  async testFirestore() {
    try {
      if (this.testData.trim()) {
        await this.firebaseService.addDocument('test', { 
          message: this.testData,
          timestamp: new Date()
        });
        console.log('Documento añadido exitosamente');
        this.testData = '';
        await this.loadDocuments();
      }
    } catch (error) {
      console.error('Error al añadir documento:', error);
    }
  }

  async loadDocuments() {
    try {
      this.documents = await this.firebaseService.getDocuments('test');
      console.log('Documentos cargados:', this.documents);
    } catch (error) {
      console.error('Error al cargar documentos:', error);
    }
  }

  async testAuth() {
    try {
      if (this.email && this.password) {
        await this.firebaseService.register(this.email, this.password);
        console.log('Usuario registrado exitosamente');
      }
    } catch (error) {
      console.error('Error en autenticación:', error);
    }
  }

  async logout() {
    try {
      await this.firebaseService.logout();
      console.log('Sesión cerrada');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}
