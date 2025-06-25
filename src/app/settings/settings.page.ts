import { Component, OnInit, inject } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonIcon, IonButton, IonToggle, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonInput, IonAlert } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { person, notifications, shield, moon, language, help, logOut, save, mail } from 'ionicons/icons';
import { FirebaseService } from '../services/firebase.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonIcon, IonButton,
    IonToggle, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonInput, IonAlert,
    CommonModule, FormsModule
  ],
})
export class SettingsPage implements OnInit {
  private firebaseService = inject(FirebaseService);
  private alertController = inject(AlertController);
  
  user: any = null;
  isAuthenticated = false;
  
  // Configuraciones de la app
  settings = {
    darkMode: false,
    notifications: true,
    language: 'es',
    autoSave: true
  };
  
  // Datos del perfil
  profile = {
    displayName: '',
    email: '',
    bio: ''
  };

  constructor() {
    addIcons({ person, notifications, shield, moon, language, help, logOut, save, mail });
  }

  ngOnInit() {
    this.loadUserData();
    this.loadSettings();
  }

  loadUserData() {
    this.firebaseService.user$.subscribe(user => {
      this.user = user;
      this.isAuthenticated = !!user;
      if (user) {
        this.profile.email = user.email || '';
        this.profile.displayName = user.displayName || '';
      }
    });
  }

  loadSettings() {
    // Cargar configuraciones del localStorage
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
    }
    
    // Aplicar tema oscuro si está activado
    this.toggleDarkMode(this.settings.darkMode, false);
  }

  saveSettings() {
    localStorage.setItem('appSettings', JSON.stringify(this.settings));
    this.showToast('Configuración guardada');
  }

  toggleDarkMode(enabled: boolean, save = true) {
    this.settings.darkMode = enabled;
    document.body.classList.toggle('dark', enabled);
    if (save) {
      this.saveSettings();
    }
  }

  async updateProfile() {
    const alert = await this.alertController.create({
      header: 'Actualizar Perfil',
      inputs: [
        {
          name: 'displayName',
          type: 'text',
          placeholder: 'Nombre de usuario',
          value: this.profile.displayName
        },
        {
          name: 'bio',
          type: 'textarea',
          placeholder: 'Biografía',
          value: this.profile.bio
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Guardar',
          handler: async (data) => {
            try {
              // Aquí puedes guardar en Firestore el perfil del usuario
              await this.firebaseService.updateDocument('users', this.user.uid, {
                displayName: data.displayName,
                bio: data.bio,
                updatedAt: new Date()
              });
              this.profile.displayName = data.displayName;
              this.profile.bio = data.bio;
              this.showToast('Perfil actualizado');
            } catch (error) {
              console.error('Error al actualizar perfil:', error);
              this.showToast('Error al actualizar perfil');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async changePassword() {
    const alert = await this.alertController.create({
      header: 'Cambiar Contraseña',
      message: 'Se enviará un email para restablecer tu contraseña',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Enviar',
          handler: () => {
            // Implementar reset de contraseña
            this.showToast('Email de restablecimiento enviado');
          }
        }
      ]
    });

    await alert.present();
  }

  async deleteAccount() {
    const alert = await this.alertController.create({
      header: 'Eliminar Cuenta',
      message: '¿Estás seguro? Esta acción no se puede deshacer.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            // Implementar eliminación de cuenta
            this.showToast('Funcionalidad próximamente');
          }
        }
      ]
    });

    await alert.present();
  }

  async logout() {
    try {
      await this.firebaseService.logout();
      this.showToast('Sesión cerrada');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  async showToast(message: string) {
    // Implementar toast notification
    console.log(message);
  }

  openHelp() {
    // Implementar página de ayuda
    this.showToast('Página de ayuda próximamente');
  }

  openPrivacyPolicy() {
    // Implementar política de privacidad
    this.showToast('Política de privacidad próximamente');
  }
}
