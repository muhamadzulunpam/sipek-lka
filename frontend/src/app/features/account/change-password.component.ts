import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { apiErrorMessage } from '../../core/api-error';

const LETTER_AND_DIGIT = /^(?=.*[A-Za-z])(?=.*\d).+$/;

function sameAsNew(group: AbstractControl): ValidationErrors | null {
  return group.get('passwordBaru')?.value === group.get('konfirmasi')?.value ? null : { mismatch: true };
}

@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule],
  template: `
    <!-- PAGE HEADER -->
    <div class="page-head">
      <div>
        <h2>Ganti Password</h2>
        <p class="subtitle">Perbarui kata sandi akun Anda untuk menjaga keamanan</p>
      </div>
    </div>

    <!-- BANNERS -->
    @if (mustChange()) {
      <div class="banner-warn">
        <span class="warn-icon">🔐</span>
        <div>
          <strong>Wajib Ganti Password</strong>
          <p>Password Anda masih password bawaan atau hasil reset. Buat password baru sebelum memakai aplikasi.</p>
        </div>
      </div>
    }
    @if (done()) {
      <div class="banner-ok">
        <span>✅</span> Password berhasil diganti.
      </div>
    }
    @if (error()) {
      <div class="banner-err">
        <span>⚠️</span> {{ error() }}
      </div>
    }

    <!-- FORM -->
    <form class="panel" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      
      <!-- PASSWORD LAMA -->
      <div class="field">
        <label for="lama">Password Lama <span class="required">*</span></label>
        <div class="input-wrap">
          <span class="input-icon">🔒</span>
          <input 
            id="lama" 
            [type]="showOld() ? 'text' : 'password'" 
            formControlName="passwordLama" 
            autocomplete="current-password"
            placeholder="Masukkan password saat ini"
          />
          <button type="button" class="toggle-pw" (click)="showOld.set(!showOld())" tabindex="-1">
            {{ showOld() ? '🙈' : '👁️' }}
          </button>
        </div>
        @if (form.controls.passwordLama.touched && form.controls.passwordLama.invalid) {
          <small class="err">⚠️ Password lama wajib diisi.</small>
        }
      </div>

      <!-- PASSWORD BARU -->
      <div class="field" style="margin-top: 20px">
        <label for="baru">Password Baru <span class="required">*</span></label>
        <div class="input-wrap">
          <span class="input-icon">🔑</span>
          <input 
            id="baru" 
            [type]="showNew() ? 'text' : 'password'" 
            formControlName="passwordBaru" 
            autocomplete="new-password"
            placeholder="Masukkan password baru"
          />
          <button type="button" class="toggle-pw" (click)="showNew.set(!showNew())" tabindex="-1">
            {{ showNew() ? '🙈' : '👁️' }}
          </button>
        </div>
        
        <div class="hint-box">
          <div class="hint-item">• Minimal 8 sampai 72 karakter</div>
          <div class="hint-item">• Mengandung huruf dan angka</div>
        </div>

        @if (form.controls.passwordBaru.touched && form.controls.passwordBaru.invalid) {
          <small class="err">⚠️ Password baru harus 8-72 karakter dan mengandung huruf & angka.</small>
        }
      </div>

      <!-- KONFIRMASI -->
      <div class="field" style="margin-top: 20px">
        <label for="konfirmasi">Ulangi Password Baru <span class="required">*</span></label>
        <div class="input-wrap" [class.has-error]="form.controls.konfirmasi.touched && form.hasError('mismatch')">
          <span class="input-icon">🔁</span>
          <input 
            id="konfirmasi" 
            [type]="showConfirm() ? 'text' : 'password'" 
            formControlName="konfirmasi" 
            autocomplete="new-password"
            placeholder="Ulangi password baru"
          />
          <button type="button" class="toggle-pw" (click)="showConfirm.set(!showConfirm())" tabindex="-1">
            {{ showConfirm() ? '🙈' : '👁️' }}
          </button>
        </div>
        @if (form.controls.konfirmasi.touched && form.hasError('mismatch')) {
          <small class="err">⚠️ Konfirmasi tidak sama dengan password baru.</small>
        }
      </div>

      <!-- ACTIONS -->
      <div class="form-actions">
        <button class="btn btn-primary btn-lg" type="submit" [disabled]="saving()">
          @if (saving()) {
            <span class="spinner-sm"></span>
            <span>Menyimpan...</span>
          } @else {
            <span>💾</span>
            <span>Simpan Password</span>
          }
        </button>
      </div>
    </form>
  `,
  styles: [`
    :host { display: block; }

    /* ===== HEADER ===== */
    .page-head {
      margin-bottom: 24px;
    }
    .page-head h2 {
      margin: 0 0 6px;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0f172a;
    }
    .subtitle {
      margin: 0;
      font-size: 14px;
      color: #64748b;
    }

    /* ===== BANNERS ===== */
    .banner-warn {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #92400e;
      padding: 18px 20px;
      border-radius: 14px;
      margin-bottom: 16px;
    }
    .warn-icon {
      font-size: 22px;
      flex-shrink: 0;
    }
    .banner-warn strong {
      display: block;
      font-size: 14px;
      font-weight: 800;
      margin-bottom: 4px;
    }
    .banner-warn p {
      margin: 0;
      font-size: 13px;
      line-height: 1.5;
      opacity: 0.9;
    }

    .banner-ok {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #15803d;
      padding: 14px 18px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .banner-err {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      padding: 14px 18px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 16px;
    }

    /* ===== PANEL ===== */
    .panel {
      background: #ffffff;
      border-radius: 18px;
      border: 1px solid #f1f5f9;
      box-shadow: 0 4px 20px rgba(74, 158, 255, 0.06);
      padding: 28px 32px;
      max-width: 640px;
    }
    @media (max-width: 640px) {
      .panel { padding: 20px; }
    }

    /* ===== FIELDS ===== */
    .field {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .field label {
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
    }
    .required {
      color: #ef4444;
      font-weight: 800;
    }

    .input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }
    .input-wrap.has-error input {
      border-color: #fca5a5;
      background: #fef2f2;
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
      padding: 12px 44px 12px 42px;
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

    .toggle-pw {
      position: absolute;
      right: 8px;
      background: transparent;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 15px;
      display: grid;
      place-items: center;
      transition: background 0.2s;
    }
    .toggle-pw:hover {
      background: #eaf4ff;
    }

    /* ===== HINT BOX ===== */
    .hint-box {
      display: flex;
      flex-direction: column;
      gap: 4px;
      background: #f8fafc;
      border: 1px dashed #e2e8f0;
      border-radius: 10px;
      padding: 10px 14px;
      margin-top: 4px;
    }
    .hint-item {
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }

    .err {
      color: #b91c1c;
      font-size: 12px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    /* ===== ACTIONS ===== */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 28px;
      padding-top: 20px;
      border-top: 1px solid #f1f5f9;
    }
    .btn-lg {
      padding: 12px 24px;
      font-size: 15px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .spinner-sm {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 640px) {
      .form-actions .btn-lg {
        width: 100%;
        justify-content: center;
      }
    }
  `],
})
export class ChangePasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly mustChange = computed(() => this.auth.session()?.wajibGantiPassword === true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly done = signal(false);

  // State Show/Hide password
  readonly showOld = signal(false);
  readonly showNew = signal(false);
  readonly showConfirm = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      passwordLama: ['', Validators.required],
      passwordBaru: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72),
                          Validators.pattern(LETTER_AND_DIGIT)]],
      konfirmasi: ['', Validators.required],
    },
    { validators: sameAsNew },
  );

  submit() {
    this.error.set(null);
    this.done.set(false);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { passwordLama, passwordBaru } = this.form.getRawValue();
    const wasForced = this.mustChange();

    this.saving.set(true);
    this.auth.changePassword(passwordLama, passwordBaru).subscribe({
      next: () => {
        this.saving.set(false);
        this.form.reset();
        if (wasForced) {
          this.router.navigateByUrl('/dashboard');
        } else {
          this.done.set(true);
        }
      },
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(e, 'Gagal mengganti password.'));
      },
    });
  }
}