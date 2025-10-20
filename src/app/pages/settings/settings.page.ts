import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonIcon, IonButton, IonToggle, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSelect, IonSelectOption, IonInput } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { person, notifications, shield, moon, sunny, language, help, logOut, save, mail, logIn, logoGoogle, refresh } from 'ionicons/icons';
import { FirebaseService } from '../../services/firebase.service';
import { ThemeService, ThemeMode } from '../../services/theme.service';
import { AlertController, ToastController, Platform } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonIcon, IonButton,
    IonToggle, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSelect, IonSelectOption,
    IonInput, CommonModule, FormsModule
  ],
})
export class SettingsPage implements OnInit, OnDestroy {
  private firebaseService = inject(FirebaseService);
  private themeService = inject(ThemeService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private cdr = inject(ChangeDetectorRef);
  private platform = inject(Platform);
  
  private userSubscription?: Subscription;
  
  user: any = null;
  isAuthenticated = false;
  isLoading = false;
  
  loginData = {
    email: '',
    password: ''
  };
  
  settings = {
    theme: 'system' as ThemeMode,
    notifications: false,
    language: 'es',
    autoSave: true
  };
  
  themeOptions = [
    { value: 'system', label: 'Sistema', icon: 'phone' },
    { value: 'light', label: 'Claro', icon: 'sunny' },
    { value: 'dark', label: 'Oscuro', icon: 'moon' }
  ];
  
  profile = {
    displayName: '',
    email: '',
    bio: '',
    photoURL: ''
  };

  constructor() {
    addIcons({ person, notifications, shield, moon, sunny, language, help, logOut, save, mail, logIn, logoGoogle, refresh });
  }

  ngOnInit() {
    this.loadUserData();
    this.loadSettings();
    this.checkGoogleRedirectResult();
    this.themeService.initSystemThemeListener();
  }

  ionViewWillEnter() {
    this.cdr.detectChanges();
    
    const currentUser = this.firebaseService.getCurrentUser();
    
    if (currentUser) {
      this.user = currentUser;
      this.isAuthenticated = true;
      this.profile.email = currentUser.email || '';
      this.profile.displayName = currentUser.displayName || '';
      this.profile.photoURL = currentUser.photoURL || '';
      
      this.cdr.detectChanges();
      this.cdr.markForCheck();
      
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 100);
      
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 500);
    }
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  private async checkGoogleRedirectResult() {
    try {
      const result = await this.firebaseService.checkRedirectResult();
      if (result && result.user) {
        this.showToast('¡Bienvenido! Has iniciado sesión con Google');
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 500);
      }
    } catch (error: any) {
      console.error('Error verificando redirect result:', error);
      if (error.code !== 'auth/no-auth-event') {
        this.showToast('Error al completar el inicio de sesión con Google');
      }
    } finally {
      this.isLoading = false;
    }
  }

  private isMobileDevice(): boolean {
    return this.platform.is('mobile') || this.platform.is('tablet');
  }

  loadUserData() {
    this.userSubscription = this.firebaseService.user$.subscribe(user => {
      this.user = user;
      this.isAuthenticated = !!user;
      
      if (user) {
        this.profile.email = user.email || '';
        this.profile.displayName = user.displayName || '';
        this.profile.photoURL = user.photoURL || '';

        if (this.profile.photoURL) {
          this.validateImageUrl(this.profile.photoURL);
        }
      } else {
        this.profile = {
          displayName: '',
          email: '',
          bio: '',
          photoURL: ''
        };
      }
      
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 100);
    });
  }

  loadSettings() {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      this.settings = { 
        ...this.settings, 
        ...parsed,
        theme: parsed.theme || (parsed.darkMode ? 'dark' : 'system')
      };
    }
    
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
              await this.firebaseService.updateDocument('users', this.user.uid, {
                displayName: data.displayName,
                bio: data.bio,
                updatedAt: new Date()
              });
              this.profile.displayName = data.displayName;
              this.profile.bio = data.bio;
              this.showToast('Perfil actualizado');
            } catch (error) {
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
    this.showToast('Página de ayuda próximamente');
  }

  openPrivacyPolicy() {
    this.showToast('Política de privacidad próximamente');
  }

  async loginWithEmail() {
    if (!this.loginData.email || !this.loginData.password) {
      this.showToast('Por favor completa todos los campos');
      return;
    }

    this.isLoading = true;
    try {
      await this.firebaseService.login(this.loginData.email, this.loginData.password);
      this.showToast('¡Bienvenido!');
      this.loginData = { email: '', password: '' };
    } catch (error: any) {
      let message = 'Error al iniciar sesión';
      
      if (error.code === 'auth/user-not-found') {
        message = 'Usuario no encontrado';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Contraseña incorrecta';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Email inválido';
      } else if (error.code === 'auth/user-disabled') {
        message = 'Usuario deshabilitado';
      }
      
      this.showToast(message);
    } finally {
      this.isLoading = false;
    }
  }

  async loginWithGoogle() {
    this.isLoading = true;
    
    if (this.isMobileDevice()) {
      this.showToast('Redirigiendo a Google...');
    }
    
    try {
      const result = await this.firebaseService.loginWithGoogle();
      
      if (result && 'pending' in result && result.pending) {
        return;
      }
      
      this.showToast('¡Bienvenido!');
      
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 500);
      
    } catch (error: any) {
      let message = 'Error al iniciar sesión con Google';
      
      if (error.code === 'auth/popup-closed-by-user') {
        message = 'Proceso cancelado por el usuario';
      } else if (error.code === 'auth/popup-blocked') {
        message = 'Popup bloqueado. Permite los popups e intenta nuevamente';
      } else if (error.code === 'auth/cancelled-popup-request') {
        message = 'Solicitud cancelada. Intenta nuevamente';
      } else if (error.code === 'auth/network-request-failed') {
        message = 'Error de conexión. Verifica tu internet';
      }
      
      this.showToast(message);
    } finally {
      if (!this.isMobileDevice()) {
        this.isLoading = false;
      }
    }
  }

  async showRegisterForm() {
    const alert = await this.alertController.create({
      header: 'Crear Cuenta',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'Correo electrónico'
        },
        {
          name: 'password',
          type: 'password',
          placeholder: 'Contraseña (mínimo 6 caracteres)'
        },
        {
          name: 'confirmPassword',
          type: 'password',
          placeholder: 'Confirmar contraseña'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Registrar',
          handler: async (data) => {
            if (!data.email || !data.password || !data.confirmPassword) {
              this.showToast('Por favor completa todos los campos');
              return false;
            }
            
            if (data.password !== data.confirmPassword) {
              this.showToast('Las contraseñas no coinciden');
              return false;
            }
            
            if (data.password.length < 6) {
              this.showToast('La contraseña debe tener al menos 6 caracteres');
              return false;
            }
            
            try {
              await this.firebaseService.register(data.email, data.password);
              this.showToast('¡Cuenta creada exitosamente!');
              return true;
            } catch (error: any) {
              let message = 'Error al crear la cuenta';
              
              if (error.code === 'auth/email-already-in-use') {
                message = 'Este email ya está registrado';
              } else if (error.code === 'auth/weak-password') {
                message = 'La contraseña es muy débil';
              } else if (error.code === 'auth/invalid-email') {
                message = 'Email inválido';
              }
              
              this.showToast(message);
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  forceRefresh() {
    const currentUser = this.firebaseService.getCurrentUser();
    if (currentUser) {
      this.user = currentUser;
      this.isAuthenticated = true;
      this.profile.email = currentUser.email || '';
      this.profile.displayName = currentUser.displayName || '';
      this.profile.photoURL = currentUser.photoURL || '';
      
      this.cdr.detectChanges();
      this.cdr.markForCheck();
      
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 50);
      
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 200);
      
      this.showToast('Perfil actualizado');
    } else {
      this.showToast('No hay usuario autenticado');
    }
  }

  onImageLoad() {
    this.cdr.detectChanges();
  }

  onImageError(event: any) {
    this.profile.photoURL = '';
    this.cdr.detectChanges();
  }

  private validateImageUrl(url: string) {
    if (!url) return;
    
    const img = new Image();
    img.onload = () => {
      this.cdr.detectChanges();
    };
    
    img.onerror = (error) => {
      this.profile.photoURL = '';
      this.cdr.detectChanges();
    };
    
    img.src = url;
  }
}
