import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Tema } from '../interfaces/tema.interface';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private readonly FAVORITES_KEY = 'apostol_favorites';
  private favoritesSubject = new BehaviorSubject<Tema[]>([]);
  
  public favorites$: Observable<Tema[]> = this.favoritesSubject.asObservable();

  constructor() {
    this.loadFavorites();
  }

  /**
   * Cargar favoritos desde localStorage
   */
  private loadFavorites(): void {
    try {
      const stored = localStorage.getItem(this.FAVORITES_KEY);
      if (stored) {
        const favorites = JSON.parse(stored) as Tema[];
        this.favoritesSubject.next(favorites);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      this.favoritesSubject.next([]);
    }
  }

  /**
   * Guardar favoritos en localStorage
   */
  private saveFavorites(favorites: Tema[]): void {
    try {
      localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favorites));
      this.favoritesSubject.next(favorites);
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  }

  /**
   * Obtener la lista actual de favoritos
   */
  getFavorites(): Tema[] {
    return this.favoritesSubject.value;
  }

  /**
   * Verificar si un tema está en favoritos
   */
  isFavorite(temaId: string): boolean {
    return this.favoritesSubject.value.some(tema => tema.id === temaId);
  }

  /**
   * Agregar un tema a favoritos
   */
  addFavorite(tema: Tema): void {
    const currentFavorites = this.getFavorites();
    
    // Verificar si ya existe
    if (!this.isFavorite(tema.id)) {
      const updatedFavorites = [...currentFavorites, tema];
      this.saveFavorites(updatedFavorites);
    }
  }

  /**
   * Remover un tema de favoritos
   */
  removeFavorite(temaId: string): void {
    const currentFavorites = this.getFavorites();
    const updatedFavorites = currentFavorites.filter(tema => tema.id !== temaId);
    this.saveFavorites(updatedFavorites);
  }

  /**
   * Alternar estado de favorito
   */
  toggleFavorite(tema: Tema): boolean {
    if (this.isFavorite(tema.id)) {
      this.removeFavorite(tema.id);
      return false;
    } else {
      this.addFavorite(tema);
      return true;
    }
  }

  /**
   * Limpiar todos los favoritos
   */
  clearFavorites(): void {
    this.saveFavorites([]);
  }

  /**
   * Obtener cantidad de favoritos
   */
  getFavoritesCount(): number {
    return this.getFavorites().length;
  }
}
