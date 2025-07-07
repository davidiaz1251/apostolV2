import { Component, OnInit, inject } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonIcon, IonButton, IonToggle, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { person, notifications, shield, moon, sunny, language, help, logOut, save, mail } from 'ionicons/icons';
import { FirebaseService } from '../../services/firebase.service';
import { ThemeService, ThemeMode } from '../../services/theme.service';
import { AlertController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonIcon, IonButton,
    IonToggle, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSelect, IonSelectOption,
    CommonModule, FormsModule
  ],
})
export class SettingsPage implements OnInit {
  private firebaseService = inject(FirebaseService);
  private themeService = inject(ThemeService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  
  user: any = null;
  isAuthenticated = false;
  
  // Configuraciones de la app
  settings = {
    theme: 'system' as ThemeMode,
    notifications: true,
    language: 'es',
    autoSave: true
  };
  
  // Opciones de tema disponibles
  themeOptions = [
    { value: 'system', label: 'Sistema', icon: 'phone' },
    { value: 'light', label: 'Claro', icon: 'sunny' },
    { value: 'dark', label: 'Oscuro', icon: 'moon' }
  ];
  
  // Datos del perfil
  profile = {
    displayName: '',
    email: '',
    bio: ''
  };

  constructor() {
    addIcons({ person, notifications, shield, moon, sunny, language, help, logOut, save, mail });
  }

  ngOnInit() {
    this.loadUserData();
    this.loadSettings();
    // Inicializar el listener para cambios del sistema
    this.themeService.initSystemThemeListener();
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
      const parsed = JSON.parse(savedSettings);
      this.settings = { 
        ...this.settings, 
        ...parsed,
        // Migrar darkMode legacy a theme
        theme: parsed.theme || (parsed.darkMode ? 'dark' : 'system')
      };
    }
    
    // Establecer el tema usando el servicio
    this.themeService.setTheme(this.settings.theme);
  }

  saveSettings() {
    localStorage.setItem('appSettings', JSON.stringify(this.settings));
    this.showToast('Configuración guardada');
  }

  onThemeChange(newTheme: ThemeMode) {
    this.settings.theme = newTheme;
    this.themeService.setTheme(newTheme);
    this.saveSettings();
    
    let message = '';
    switch (newTheme) {
      case 'system':
        const systemPref = this.themeService.getSystemPreference();
        message = `Tema del sistema activado (${systemPref === 'dark' ? 'oscuro' : 'claro'})`;
        break;
      case 'light':
        message = 'Tema claro activado';
        break;
      case 'dark':
        message = 'Tema oscuro activado';
        break;
    }
    this.showToast(message);
  }

  getCurrentThemeLabel(): string {
    const currentTheme = this.settings.theme;
    const option = this.themeOptions.find(opt => opt.value === currentTheme);
    return option?.label || 'Sistema';
  }

  getCurrentThemeIcon(): string {
    const currentTheme = this.settings.theme;
    
    if (currentTheme === 'system') {
      // Mostrar el icono basado en lo que realmente se está mostrando
      const effective = this.themeService.getEffectiveTheme();
      return effective === 'dark' ? 'moon' : 'sunny';
    }
    
    const option = this.themeOptions.find(opt => opt.value === currentTheme);
    return option?.icon || 'moon';
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
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: 'success',
      buttons: [
        {
          text: 'OK',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
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
