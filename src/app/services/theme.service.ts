import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'system' | 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'app-theme';
  private currentTheme = new BehaviorSubject<ThemeMode>('system');
  
  // Observable para que los componentes puedan suscribirse a cambios de tema
  public theme$ = this.currentTheme.asObservable();

  constructor() {
    this.initializeTheme();
  }

  /**
   * Inicializa el tema desde localStorage o usa 'system' como default
   */
  private initializeTheme(): void {
    const savedTheme = localStorage.getItem(this.THEME_KEY) as ThemeMode;
    const theme = savedTheme || 'system';
    this.setTheme(theme);
  }

  /**
   * Establece el tema y lo aplica al DOM
   */
  setTheme(theme: ThemeMode): void {
    this.currentTheme.next(theme);
    localStorage.setItem(this.THEME_KEY, theme);
    this.applyTheme(theme);
  }

  /**
   * Obtiene el tema actual
   */
  getCurrentTheme(): ThemeMode {
    return this.currentTheme.value;
  }

  /**
   * Aplica el tema al DOM
   */
  private applyTheme(theme: ThemeMode): void {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Remover clases existentes
    document.documentElement.classList.remove('ion-palette-dark');
    document.body.classList.remove('dark');
    
    let shouldApplyDark = false;
    
    switch (theme) {
      case 'dark':
        shouldApplyDark = true;
        break;
      case 'light':
        shouldApplyDark = false;
        break;
      case 'system':
      default:
        shouldApplyDark = prefersDark;
        break;
    }
    
    if (shouldApplyDark) {
      document.documentElement.classList.add('ion-palette-dark');
      document.body.classList.add('dark');
    }
  }

  /**
   * Detecta cambios en las preferencias del sistema y actualiza el tema si está en modo 'system'
   */
  initSystemThemeListener(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    mediaQuery.addEventListener('change', (e) => {
      if (this.getCurrentTheme() === 'system') {
        this.applyTheme('system');
      }
    });
  }

  /**
   * Verifica si actualmente se está mostrando el tema oscuro
   */
  isDarkMode(): boolean {
    return document.body.classList.contains('dark');
  }

  /**
   * Obtiene el estado efectivo del tema (lo que realmente se está mostrando)
   */
  getEffectiveTheme(): 'light' | 'dark' {
    const currentTheme = this.getCurrentTheme();
    
    if (currentTheme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    return currentTheme === 'dark' ? 'dark' : 'light';
  }

  /**
   * Obtiene las preferencias del sistema
   */
  getSystemPreference(): 'light' | 'dark' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
