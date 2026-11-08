import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/shell.component').then(m => m.ShellComponent),
    children: [
      {
        path: 'laporan',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/laporan/laporan-list.component').then(m => m.LaporanListComponent),
          },
          {
            path: 'baru',
            canActivate: [roleGuard('KepalaBidang')],
            loadComponent: () =>
              import('./features/laporan/laporan-form.component').then(m => m.LaporanFormComponent),
          },
          {
            path: ':id/ubah',
            canActivate: [roleGuard('KepalaBidang')],
            loadComponent: () =>
              import('./features/laporan/laporan-form.component').then(m => m.LaporanFormComponent),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/laporan/laporan-detail.component').then(m => m.LaporanDetailComponent),
          },
        ],
      },

      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },

      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '**', redirectTo: '' },
];