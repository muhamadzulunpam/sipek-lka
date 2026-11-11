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
      <!-- LEFT PANEL (BRAND) -->
      <section class="brand-panel">
        <div class="brand-decor decor-1"></div>
        <div class="brand-decor decor-2"></div>
        <div class="brand-decor decor-3"></div>

        <div class="brand-content">
          <div class="brand-logo">
            <div class="logo-icon">📊</div>
            <span>SIPEK-LKA</span>
          </div>

          <h1 class="brand-title">
            Sistem Informasi<br />
            <span>Pelaporan Kinerja</span><br />
            LKA Universitas Pamulang
          </h1>

          <p class="brand-sub">
            Kelola laporan kinerja kepala bidang secara efisien, terukur,
            dan real-time dalam satu platform terintegrasi.
          </p>

          <div class="brand-features">
            <div class="feature-item">
              <span class="feature-icon">✅</span>
              <div>
                <strong>Pelaporan Terpusat</strong>
                <span>Semua data kinerja dalam satu dashboard</span>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📈</span>
              <div>
                <strong>Monitoring Real-time</strong>
                <span>Pantau progress setiap bidang kapan saja</span>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🔒</span>
              <div>
                <strong>Aman & Terverifikasi</strong>
                <span>Akses berbasis token dengan keamanan berlapis</span>
              </div>
            </div>
          </div>
        </div>

        <div class="brand-footer">
          © {{ year }} LKA Universitas Pamulang
        </div>
      </section>

      <!-- RIGHT PANEL (FORM) -->
      <section class="form-panel">
        <form class="card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="card-header">
            <h2>Selamat Datang 👋</h2>
            <p>Silakan masuk untuk melanjutkan ke dashboard</p>
          </div>

          <!-- EMAIL -->
          <div class="form-group">
            <label for="email">Email</label>
            <div class="input-wrap">
              <span class="input-icon">✉️</span>
              <input
                id="email"
                type="email"
                formControlName="email"
                autocomplete="username"
                placeholder="nama@unpam.ac.id"
              />
            </div>
            @if (form.controls.email.touched && form.controls.email.invalid) {
              <small class="err">
                <span>⚠️</span> Masukkan email yang valid.
              </small>
            }
          </div>

          <!-- PASSWORD -->
          <div class="form-group">
            <label for="password">Password</label>
            <div class="input-wrap">
              <span class="input-icon">🔒</span>
              <input
                id="password"
                type="password"
                formControlName="password"
                autocomplete="current-password"
                placeholder="••••••••"
              />
            </div>
            @if (form.controls.password.touched && form.controls.password.invalid) {
              <small class="err">
                <span>⚠️</span> Password wajib diisi.
              </small>
            }
          </div>

          <!-- ERROR BANNER -->
          @if (error()) {
            <div class="err-banner">
              <span class="banner-icon">⚠️</span>
              <span>{{ error() }}</span>
            </div>
          }

          <!-- SUBMIT BUTTON -->
          <button type="submit" class="btn-primary" [disabled]="loading()">
            @if (loading()) {
              <span class="spinner"></span>
              <span>Memproses...</span>
            } @else {
              <span>Masuk</span>
              <span class="arrow">→</span>
            }
          </button>

          <p class="form-footer">
            Butuh bantuan? <a href="#">Hubungi Administrator</a>
          </p>
        </form>
      </section>
    </main>
  `,
  styles: [`
    :host {
      display: block;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
      color: #0f172a;
    }

    /* ===== LAYOUT ===== */
    .wrap {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1.1fr 1fr;
      background: #ffffff;
    }

    /* ===== LEFT: BRAND PANEL ===== */
    .brand-panel {
      position: relative;
      overflow: hidden;
      background: linear-gradient(135deg, #6baeff 0%, #4a9eff 55%, #2e82e6 100%);
      color: #ffffff;
      padding: 48px 56px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* Dekorasi lingkaran */
    .brand-decor {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.12);
      pointer-events: none;
    }
    .decor-1 { width: 380px; height: 380px; top: -120px; right: -100px; }
    .decor-2 { width: 240px; height: 240px; bottom: -80px; left: -60px; background: rgba(255,255,255,0.08); }
    .decor-3 { width: 140px; height: 140px; top: 45%; right: 15%; background: rgba(255,255,255,0.10); }

    .brand-content {
      position: relative;
      z-index: 1;
    }

    .brand-logo {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 40px;
      font-weight: 800;
      font-size: 18px;
      letter-spacing: -0.3px;
    }
    .brand-logo .logo-icon {
      width: 44px;
      height: 44px;
      background: rgba(255, 255, 255, 0.22);
      backdrop-filter: blur(8px);
      border-radius: 12px;
      display: grid;
      place-items: center;
      font-size: 20px;
      border: 1px solid rgba(255, 255, 255, 0.25);
    }

    .brand-title {
      font-size: 34px;
      font-weight: 800;
      line-height: 1.2;
      letter-spacing: -0.8px;
      margin: 0 0 16px;
    }
    .brand-title span {
      background: linear-gradient(120deg, #ffffff 0%, #d6e9ff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .brand-sub {
      font-size: 14px;
      line-height: 1.7;
      opacity: 0.9;
      max-width: 440px;
      margin: 0 0 40px;
    }

    .brand-features {
      display: flex;
      flex-direction: column;
      gap: 18px;
      max-width: 440px;
    }
    .feature-item {
      display: flex;
      gap: 14px;
      align-items: flex-start;
      background: rgba(255, 255, 255, 0.10);
      backdrop-filter: blur(10px);
      padding: 14px 18px;
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.18);
    }
    .feature-icon {
      font-size: 18px;
      flex-shrink: 0;
      line-height: 1.2;
    }
    .feature-item strong {
      display: block;
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 2px;
    }
    .feature-item span:not(.feature-icon) {
      font-size: 12px;
      opacity: 0.85;
      line-height: 1.4;
    }

    .brand-footer {
      position: relative;
      z-index: 1;
      font-size: 12px;
      opacity: 0.75;
      font-weight: 500;
    }

    /* ===== RIGHT: FORM PANEL ===== */
    .form-panel {
      display: grid;
      place-items: center;
      padding: 32px;
      background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
    }

    .card {
      width: 100%;
      max-width: 420px;
      background: #ffffff;
      padding: 40px 36px;
      border-radius: 20px;
      box-shadow: 0 20px 50px rgba(74, 158, 255, 0.12),
                  0 2px 8px rgba(15, 23, 42, 0.04);
      border: 1px solid #f1f5f9;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .card-header {
      margin-bottom: 4px;
    }
    .card-header h2 {
      margin: 0 0 6px;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0f172a;
    }
    .card-header p {
      margin: 0;
      font-size: 13px;
      color: #64748b;
      line-height: 1.5;
    }

    /* ===== FORM FIELDS ===== */
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .form-group label {
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
    }

    .input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }
    .input-icon {
      position: absolute;
      left: 14px;
      font-size: 15px;
      pointer-events: none;
      opacity: 0.7;
    }
    .input-wrap input {
      width: 100%;
      padding: 13px 14px 13px 42px;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      font-size: 14px;
      font-family: inherit;
      color: #0f172a;
      background: #f8fafc;
      transition: all 0.2s ease;
      outline: none;
    }
    .input-wrap input::placeholder {
      color: #94a3b8;
    }
    .input-wrap input:focus {
      border-color: #4a9eff;
      background: #ffffff;
      box-shadow: 0 0 0 4px rgba(74, 158, 255, 0.14);
    }

    /* ===== ERROR ===== */
    .err {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #b91c1c;
      font-size: 12px;
      font-weight: 600;
    }

    .err-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      padding: 12px 14px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
    }
    .banner-icon { font-size: 16px; }

    /* ===== BUTTON ===== */
    .btn-primary {
      margin-top: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px;
      border: 0;
      border-radius: 12px;
      background: linear-gradient(135deg, #6baeff 0%, #4a9eff 100%);
      color: #ffffff;
      font-size: 15px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      box-shadow: 0 8px 20px rgba(74, 158, 255, 0.30);
      transition: all 0.2s ease;
    }
    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 12px 26px rgba(74, 158, 255, 0.38);
    }
    .btn-primary:active:not(:disabled) {
      transform: translateY(0);
    }
    .btn-primary:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }
    .btn-primary .arrow {
      transition: transform 0.2s;
    }
    .btn-primary:hover:not(:disabled) .arrow {
      transform: translateX(3px);
    }

    /* Spinner */
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* ===== FOOTER ===== */
    .form-footer {
      text-align: center;
      font-size: 12px;
      color: #64748b;
      margin: 4px 0 0;
    }
    .form-footer a {
      color: #2e82e6;
      font-weight: 700;
      text-decoration: none;
    }
    .form-footer a:hover {
      text-decoration: underline;
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 900px) {
      .wrap {
        grid-template-columns: 1fr;
      }
      .brand-panel {
        display: none;
      }
      .form-panel {
        padding: 24px 16px;
      }
      .card {
        padding: 32px 24px;
      }
    }
  `],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly year = new Date().getFullYear();

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