import { Injectable, inject } from '@angular/core';
import { Network } from '@capacitor/network';
import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { BehaviorSubject } from 'rxjs';
import { ToastController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root'
})
export class OfflineService {
  private isOnlineSubject = new BehaviorSubject<boolean>(true);
  public isOnline$ = this.isOnlineSubject.asObservable();
  private toastController = inject(ToastController);
  private wasOffline = false;

  constructor() {
    this.initializeNetworkMonitoring();
  }

  private async initializeNetworkMonitoring() {
    // Verificar estado inicial de la red
    const status = await Network.getStatus();
    this.isOnlineSubject.next(status.connected);
    this.wasOffline = !status.connected;

    // Escuchar cambios de conexión
    Network.addListener('networkStatusChange', async (status) => {
      const isOnline = status.connected;
      this.isOnlineSubject.next(isOnline);
      
      if (!isOnline && !this.wasOffline) {
        // Se perdió la conexión
        this.wasOffline = true;
        await this.showToast('Sin conexión a internet', 'danger');
      } else if (isOnline && this.wasOffline) {
        // Se recuperó la conexión
        this.wasOffline = false;
        await this.showToast('Conexión restaurada', 'success');
      }
      
      console.log('Network status changed:', isOnline);
    });
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'top',
      color: color,
      buttons: [
        {
          text: 'OK',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  // Métodos para Preferences (datos simples)
  async setData(key: string, value: any): Promise<void> {
    await Preferences.set({
      key,
      value: JSON.stringify(value)
    });
  }

  async getData(key: string): Promise<any> {
    const result = await Preferences.get({ key });
    return result.value ? JSON.parse(result.value) : null;
  }

  async removeData(key: string): Promise<void> {
    await Preferences.remove({ key });
  }

  // Métodos para File System (datos grandes, imágenes)
  async saveFile(fileName: string, data: string): Promise<void> {
    try {
      await Filesystem.writeFile({
        path: fileName,
        data: data,
        directory: Directory.Data,
        encoding: Encoding.UTF8
      });
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  }

  async readFile(fileName: string): Promise<string | null> {
    try {
      const result = await Filesystem.readFile({
        path: fileName,
        directory: Directory.Data,
        encoding: Encoding.UTF8
      });
      return result.data as string;
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    try {
      await Filesystem.deleteFile({
        path: fileName,
        directory: Directory.Data
      });
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  async fileExists(fileName: string): Promise<boolean> {
    try {
      await Filesystem.stat({
        path: fileName,
        directory: Directory.Data
      });
      return true;
    } catch {
      return false;
    }
  }

  // Descargar y guardar imagen
  async downloadAndSaveImage(url: string, fileName: string): Promise<string> {
    const filePath = `images/${fileName}`;
    try {
      // Paso 1: Asegurarse de que el directorio 'images' exista.
      try {
        await Filesystem.mkdir({
          path: 'images',
          directory: Directory.Data,
        });
      } catch (e) {
        // Es normal que falle si el directorio ya existe.
        // No hacemos nada en este caso.
      }

      // Paso 2: Descargar la imagen y convertirla a base64.
      const response = await fetch(url);
      const blob = await response.blob();
      const base64 = await this.blobToBase64(blob);
      
      // Paso 3: Guardar el archivo en el directorio.
      await Filesystem.writeFile({
        path: filePath,
        data: base64,
        directory: Directory.Data
      });

      return filePath;
    } catch (error) {
      console.error('Error downloading image:', error);
      throw error;
    }
  }

  async getLocalImagePath(filePath: string): Promise<string | null> {
    try {
      const result = await Filesystem.readFile({
        path: filePath, // La ruta ya viene completa (ej: "images/nombre.jpg")
        directory: Directory.Data
      });
      return `data:image/jpeg;base64,${result.data}`;
    } catch {
      return null;
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Obtener estado de conexión actual
  isConnected(): boolean {
    return this.isOnlineSubject.value;
  }
}
