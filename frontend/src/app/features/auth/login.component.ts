import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <main class="wrap">
      <form class="card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <h1>SIPEK-LKA</h1>
        <p class="sub">Sistem Informasi Pelaporan Kinerja LKA</p>

        <label>
          Email
          <input type="email" formControlName="email" autocomplete="username" />
        </label>
        @if (form.controls.email.touched && form.controls.email.invalid) {
          <small class="err">Masukkan email yang valid.</small>
        }

        <label>
          Password
          <input type="password" formControlName="password" autocomplete="current-password" />
        </label>
        @if (form.controls.password.touched && form.controls.password.invalid) {
          <small class="err">Password wajib diisi.</small>
        }

        @if (error()) {
          <p class="err banner">{{ error() }}</p>
        }

        <button type="submit" [disabled]="loading()">
          {{ loading() ? 'Memproses...' : 'Masuk' }}
        </button>
      </form>
    </main>
  `,
  styles: [`
    .wrap { min-height: 100vh; display: grid; place-items: center; background: #f1f5f9; padding: 16px; }
    .card { width: 100%; max-width: 380px; background: #fff; padding: 28px; border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,.08); display: flex; flex-direction: column; gap: 10px; }
    h1 { margin: 0; font-size: 1.5rem; }
    .sub { margin: 0 0 12px; color: #64748b; font-size: .9rem; }
    label { display: flex; flex-direction: column; gap: 4px; font-size: .9rem; }
    input { padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; }
    button { margin-top: 8px; padding: 10px; border: 0; border-radius: 8px; background: #1d4ed8;
             color: #fff; font-size: 1rem; cursor: pointer; }
    button:disabled { opacity: .6; cursor: not-allowed; }
    .err { color: #b91c1c; }
    .banner { background: #fee2e2; padding: 8px 10px; border-radius: 8px; margin: 0; }
  `],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigateByUrl('/dashboard'),
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(
          err.status === 401
            ? 'Email atau password salah.'
            : 'Tidak dapat terhubung ke server.'
        );
      },
    });
  }
}