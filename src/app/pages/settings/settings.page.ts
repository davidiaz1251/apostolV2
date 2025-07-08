import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonIcon, IonButton, IonToggle, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSelect, IonSelectOption, IonInput } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { person, notifications, shield, moon, sunny, language, help, logOut, save, mail, logIn, logoGoogle, refresh } from 'ionicons/icons';
import { FirebaseService } from '../../services/firebase.service';
import { ThemeService, ThemeMode } from '../../services/theme.service';
import { AlertController, ToastController } from '@ionic/angular';
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
  
  private userSubscription?: Subscription;
  
  user: any = null;
  isAuthenticated = false;
  isLoading = false;
  
  // Datos de login
  loginData = {
    email: '',
    password: ''
  };
  
  // Configuraciones de la app
  settings = {
    theme: 'system' as ThemeMode,
    notifications: false,
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
    // Inicializar el listener para cambios del sistema
    this.themeService.initSystemThemeListener();
  }

  ionViewWillEnter() {
    // Este método se ejecuta cada vez que la página se vuelve visible
    // Forzar actualización de la vista
    this.cdr.detectChanges();
    
    // Verificar el estado de autenticación actual
    const currentUser = this.firebaseService.getCurrentUser();
    if (currentUser && !this.isAuthenticated) {
      // Si hay un usuario autenticado pero no se ha actualizado la vista
      this.user = currentUser;
      this.isAuthenticated = true;
      this.profile.email = currentUser.email || '';
      this.profile.displayName = currentUser.displayName || '';
      this.profile.photoURL = currentUser.photoURL || '';
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  // Verificar si el usuario regresó de un redirect de Google
  private async checkGoogleRedirectResult() {
    try {
      const result = await this.firebaseService.checkRedirectResult();
      if (result && result.user) {
        this.showToast('¡Bienvenido! Has iniciado sesión con Google');
        // Forzar actualización de la vista después del redirect
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 500);
      }
    } catch (error: any) {
      console.error('Error verificando redirect result:', error);
      if (error.code !== 'auth/no-auth-event') {
        this.showToast('Error al completar el inicio de sesión con Google');
      }
    }
  }

  // Verificar si estamos en un dispositivo móvil
  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  loadUserData() {
    this.userSubscription = this.firebaseService.user$.subscribe(user => {
      console.log('User state changed:', user);
      this.user = user;
      this.isAuthenticated = !!user;
      
      if (user) {
        this.profile.email = user.email || '';
        this.profile.displayName = user.displayName || '';
        this.profile.photoURL = user.photoURL || '';
        console.log('Profile updated:', this.profile);
      } else {
        // Reset profile data when user logs out
        this.profile = {
          displayName: '',
          email: '',
          bio: '',
          photoURL: ''
        };
      }
      
      // Forzar detección de cambios para actualizar la vista inmediatamente
      this.cdr.detectChanges();
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

  // ===== MÉTODOS DE AUTENTICACIÓN =====

  async loginWithEmail() {
    if (!this.loginData.email || !this.loginData.password) {
      this.showToast('Por favor completa todos los campos');
      return;
    }

    this.isLoading = true;
    try {
      await this.firebaseService.login(this.loginData.email, this.loginData.password);
      this.showToast('¡Bienvenido!');
      // Limpiar formulario
      this.loginData = { email: '', password: '' };
    } catch (error: any) {
      console.error('Error en login:', error);
      let message = 'Error al iniciar sesión';
      
      // Personalizar mensajes de error
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
    
    // Mostrar mensaje específico para móviles
    if (this.isMobileDevice()) {
      this.showToast('Redirigiendo a Google...');
    }
    
    try {
      const result = await this.firebaseService.loginWithGoogle();
      
      // Si estamos en móvil, el resultado será { user: null, pending: true }
      if (result && 'pending' in result && result.pending) {
        // El usuario será redirigido automáticamente
        // El resultado se manejará cuando regrese a la app
        return;
      }
      
      // Si estamos en desktop, mostramos el mensaje de éxito y forzamos actualización
      this.showToast('¡Bienvenido!');
      
      // Forzar actualización de la vista
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 500);
      
    } catch (error: any) {
      console.error('Error en login con Google:', error);
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
      this.isLoading = false;
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
              console.error('Error en registro:', error);
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

  // Método para forzar actualización manual de la vista
  forceRefresh() {
    const currentUser = this.firebaseService.getCurrentUser();
    if (currentUser) {
      this.user = currentUser;
      this.isAuthenticated = true;
      this.profile.email = currentUser.email || '';
      this.profile.displayName = currentUser.displayName || '';
      this.profile.photoURL = currentUser.photoURL || '';
      this.cdr.detectChanges();
      this.showToast('Perfil actualizado');
    }
  }

  // Handle image loading success
  onImageLoad() {
    console.log('User profile image loaded successfully');
    this.cdr.detectChanges();
  }

  // Handle image loading errors
  onImageError(event: any) {
    console.warn('Error loading user profile image:', event);
    // Clear the photoURL to show the default icon
    this.profile.photoURL = '';
    this.cdr.detectChanges();
  }
}
