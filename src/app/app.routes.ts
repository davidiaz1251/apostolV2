import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'list',
        loadComponent: () => import('./pages/list/list.page').then((m) => m.ListPage),
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.page').then((m) => m.SettingsPage),
      },
      {
        path: 'practices',
        loadComponent: () => import('./pages/practices/practices.page').then( m => m.PracticesPage)
      },
      {
        path: 'favorites',
        loadComponent: () => import('./pages/favorites/favorites.page').then( m => m.FavoritesPage)
      },
      {
        path: 'pruebas/:id',
        loadComponent: () => import('./pages/pruebas/pruebas.page').then( m => m.PruebasPage)
      },
      {
        path: '',
        redirectTo: '/home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'tema/:id',
    loadComponent: () => import('./pages/tema-detail/tema-detail.page').then((m) => m.TemaDetailPage),
  },
];
