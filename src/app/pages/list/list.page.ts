import { Component, OnInit, inject } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonIcon, IonButton, IonFab, IonFabButton, IonModal, IonInput, IonTextarea, IonButtons, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonBadge } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { add, checkmark, ellipsisVertical, pencil, trash } from 'ionicons/icons';
import { FirebaseService } from '../../services/firebase.service';

interface ListItem {
  id?: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high';
}

@Component({
  selector: 'app-list',
  templateUrl: './list.page.html',
  styleUrls: ['./list.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonIcon, IonButton,
    IonFab, IonFabButton, IonModal, IonInput, IonTextarea, IonButtons, IonCard, IonCardContent, IonBadge, CommonModule, FormsModule
  ],
})
export class ListPage implements OnInit {
  private firebaseService = inject(FirebaseService);
  
  items: ListItem[] = [];
  isModalOpen = false;
  editingItem: ListItem | null = null;
  
  newItem: ListItem = {
    title: '',
    description: '',
    completed: false,
    createdAt: new Date(),
    priority: 'medium'
  };

  constructor() {
    addIcons({ add, checkmark, ellipsisVertical, pencil, trash });
  }

  ngOnInit() {
    this.loadItems();
  }

  async loadItems() {
    try {
      const documents = await this.firebaseService.getDocuments('tasks');
      this.items = documents.map(doc => ({
        ...doc,
        createdAt: doc.createdAt?.toDate() || new Date()
      }));
      this.items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error al cargar items:', error);
    }
  }

  openModal(item?: ListItem) {
    if (item) {
      this.editingItem = item;
      this.newItem = { ...item };
    } else {
      this.editingItem = null;
      this.newItem = {
        title: '',
        description: '',
        completed: false,
        createdAt: new Date(),
        priority: 'medium'
      };
    }
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingItem = null;
  }

  async saveItem() {
    try {
      if (this.newItem.title.trim()) {
        if (this.editingItem?.id) {
          // Actualizar item existente
          await this.firebaseService.updateDocument('tasks', this.editingItem.id, {
            title: this.newItem.title,
            description: this.newItem.description,
            priority: this.newItem.priority,
            updatedAt: new Date()
          });
        } else {
          // Crear nuevo item
          await this.firebaseService.addDocument('tasks', {
            ...this.newItem,
            createdAt: new Date()
          });
        }
        this.closeModal();
        await this.loadItems();
      }
    } catch (error) {
      console.error('Error al guardar item:', error);
    }
  }

  async toggleComplete(item: ListItem) {
    try {
      if (item.id) {
        await this.firebaseService.updateDocument('tasks', item.id, {
          completed: !item.completed,
          updatedAt: new Date()
        });
        await this.loadItems();
      }
    } catch (error) {
      console.error('Error al actualizar item:', error);
    }
  }

  async deleteItem(item: ListItem) {
    try {
      if (item.id) {
        await this.firebaseService.deleteDocument('tasks', item.id);
        await this.loadItems();
      }
    } catch (error) {
      console.error('Error al eliminar item:', error);
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'medium';
    }
  }

  getPriorityText(priority: string): string {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Baja';
      default: return 'Media';
    }
  }
}
