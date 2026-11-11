
import { Routes } from '@angular/router';
import { authGuard, guestGuard, passwordGuard, roleGuard } from './core/auth.guard';

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
    canActivateChild: [passwordGuard],
    loadComponent: () =>
      import('./layout/shell.component').then(m => m.ShellComponent),
    children: [
      {
        path: 'ganti-password',
        loadComponent: () =>
          import('./features/account/change-password.component').then(m => m.ChangePasswordComponent),
      },
      {
        path: 'pengguna',
        canActivate: [roleGuard('Pimpinan')],
        loadComponent: () =>
          import('./features/admin/users.component').then(m => m.UsersComponent),
      },
      {
        path: 'bidang',
        canActivate: [roleGuard('Pimpinan')],
        loadComponent: () =>
          import('./features/admin/bidang-admin.component').then(m => m.BidangAdminComponent),
      },
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
      {
        path: 'audit',
        canActivate: [roleGuard('Pimpinan')],
        loadComponent: () =>
          import('./features/admin/audit.component').then(m => m.AuditComponent),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
