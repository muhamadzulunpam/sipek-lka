import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { API_URL } from './config';
import { LoginResponse } from './models';

const STORAGE_KEY = 'sipek_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _session = signal<LoginResponse | null>(this.readStored());
  readonly session = this._session.asReadonly();

  login(email: string, password: string) {
    return this.http
      .post<LoginResponse>(`${API_URL}/auth/login`, { email, password })
      .pipe(tap(res => this.store(res)));
  }

  logout() {
    this.clear();
    this.router.navigateByUrl('/login');
  }

  token(): string | null {
    return this._session()?.token ?? null;
  }

  isAuthenticated(): boolean {
    const s = this._session();
    if (!s) return false;
    if (new Date(s.expiresAt).getTime() <= Date.now()) {
      this.clear();
      return false;
    }
    return true;
  }

  private store(res: LoginResponse) {
    this._session.set(res);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(res)); } catch { /* abaikan */ }
  }

  private clear() {
    this._session.set(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* abaikan */ }
  }

  private readStored(): LoginResponse | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as LoginResponse) : null;
    } catch {
      return null;
    }
  }
  
  changePassword(passwordLama: string, passwordBaru: string) {
    return this.http
      .post<LoginResponse>(`${API_URL}/auth/change-password`, { passwordLama, passwordBaru })
      .pipe(tap(res => this.store(res))); // simpan token baru dari server
  }
}