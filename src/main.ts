import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { provideZonelessChangeDetection } from '@angular/core';
import { environment } from './environments/environment';

// Importar Firebase para web
import { initializeApp } from 'firebase/app';

import { EdgeToEdge } from '@capawesome/capacitor-android-edge-to-edge-support';

// Inicializar Firebase para web si es necesario
if (!Capacitor.isNativePlatform()) {
  EdgeToEdge.disable();
  initializeApp(environment.firebase);
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideZonelessChangeDetection(),
  ],
});
