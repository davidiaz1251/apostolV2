import { Component, inject, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { ThemeService } from './services/theme.service';
import { FirebaseService } from './services/firebase.service';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private themeService = inject(ThemeService);
  private firebaseService = inject(FirebaseService);
  private platform = inject(Platform);

  constructor() {}

  async ngOnInit() {
    await this.platform.ready();
    
    this.themeService.initSystemThemeListener();
  }
}
