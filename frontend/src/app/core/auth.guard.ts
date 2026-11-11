import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

// Halaman yang butuh login
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

// Halaman login: kalau sudah login, langsung ke dashboard
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? router.createUrlTree(['/dashboard']) : true;
};
// Halaman khusus satu role. Role lain dialihkan ke daftar laporan.
export const roleGuard = (role: 'Pimpinan' | 'KepalaBidang'): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.session()?.role === role ? true : router.createUrlTree(['/laporan']);
};

// Selama wajib ganti password, semua halaman diarahkan ke /ganti-password
export const passwordGuard: CanActivateChildFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const mustChange = auth.session()?.wajibGantiPassword === true;

  if (mustChange && !state.url.startsWith('/ganti-password')) {
    return router.createUrlTree(['/ganti-password']);
  }
  return true;
};