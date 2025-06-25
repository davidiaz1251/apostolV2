import { Component, inject, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private themeService = inject(ThemeService);

  constructor() {}

  ngOnInit() {
    // Inicializar el tema y el listener para cambios del sistema
    this.themeService.initSystemThemeListener();
  }
}
