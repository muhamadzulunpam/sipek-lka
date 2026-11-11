import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../core/admin.service';
import { apiErrorMessage } from '../../core/api-error';
import { Bidang, UserItem, UserRequest } from '../../core/models';

@Component({
  selector: 'app-users',
  imports: [ReactiveFormsModule],
  template: `
    <!-- PAGE HEADER -->
    <div class="page-head">
      <div>
        <h2>Pengguna (Kepala Bidang)</h2>
        <p class="subtitle">Kelola akun Kepala Bidang di lingkungan LKA Universitas Pamulang</p>
      </div>
      <span class="spacer"></span>
      <button class="btn btn-primary" type="button" (click)="openCreate()">
        <span>+</span> Tambah Kepala Bidang
      </button>
    </div>

    @if (error()) {
      <div class="banner-err"><span>⚠️</span> {{ error() }}</div>
    }

    <!-- SECRET PASSWORD BANNER -->
    @if (secret(); as s) {
      <div class="banner-secret">
        <div class="secret-head">
          <span class="secret-icon">🔑</span>
          <strong>{{ s.label }}</strong>
        </div>
        <div class="secret-body">
          <div class="secret-pw">
            <code>{{ s.password }}</code>
            <button class="btn btn-sm copy-btn" type="button" (click)="copy(s.password)" [class.copied]="copied()">
              {{ copied() ? '✓ Tersalin' : '📋 Salin' }}
            </button>
          </div>
          <p class="secret-note">
            ⚠️ Password ini hanya tampil sekali. Sampaikan langsung ke yang bersangkutan.
            Ia wajib menggantinya saat login pertama.
          </p>
        </div>
        <button class="btn btn-sm close-secret" type="button" (click)="secret.set(null)">✕</button>
      </div>
    }

    <!-- FORM TAMBAH/EDIT -->
    @if (mode() !== 'closed') {
      <div class="panel form-panel">
        <div class="panel-header">
          <span class="header-icon">{{ mode() === 'create' ? '➕' : '✏️' }}</span>
          <h3>{{ mode() === 'create' ? 'Tambah Kepala Bidang' : 'Ubah Kepala Bidang' }}</h3>
        </div>
        
        <form [formGroup]="form" (ngSubmit)="save()" novalidate>
          <div class="form-grid">
            <div class="field full">
              <label for="nama">Nama Lengkap <span class="required">*</span></label>
              <input id="nama" type="text" formControlName="namaLengkap" placeholder="Nama lengkap kepala bidang" />
              @if (form.controls.namaLengkap.touched && form.controls.namaLengkap.invalid) {
                <small class="err">⚠️ Nama wajib diisi (maksimal 150 karakter).</small>
              }
            </div>
            <div class="field">
              <label for="email">Email <span class="required">*</span></label>
              <input id="email" type="email" formControlName="email" autocomplete="off" placeholder="nama@unpam.ac.id" />
              @if (form.controls.email.touched && form.controls.email.invalid) {
                <small class="err">⚠️ Masukkan email yang valid.</small>
              }
            </div>
            <div class="field">
              <label for="bidang">Bidang <span class="required">*</span></label>
              <select id="bidang" formControlName="bidangId">
                <option value="">-- Pilih bidang --</option>
                @for (b of bidangs(); track b.id) {
                  <option [value]="b.id">{{ b.nama }}</option>
                }
              </select>
              @if (form.controls.bidangId.touched && form.controls.bidangId.invalid) {
                <small class="err">⚠️ Pilih bidang.</small>
              }
            </div>
          </div>
          
          <div class="form-actions">
            <button class="btn" type="button" (click)="closeForm()">Batal</button>
            <button class="btn btn-primary" type="submit" [disabled]="saving()">
              @if (saving()) {
                <span class="spinner-sm"></span>
                <span>Menyimpan...</span>
              } @else {
                <span>💾</span>
                <span>Simpan</span>
              }
            </button>
          </div>
        </form>
      </div>
    }

    <!-- TABLE LIST -->
    <div class="table-section">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <span>Memuat data pengguna...</span>
        </div>
      } @else if (users().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">👥</div>
          <h3>Belum Ada Akun</h3>
          <p>Belum ada akun Kepala Bidang yang terdaftar.</p>
        </div>
      } @else {
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Bidang</th>
                <th>Status</th>
                <th class="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              @for (u of users(); track u.id) {
                <tr>
                  <td>
                    <div class="user-cell">
                      <div class="avatar">{{ u.namaLengkap.charAt(0).toUpperCase() }}</div>
                      <strong>{{ u.namaLengkap }}</strong>
                    </div>
                  </td>
                  <td><span class="email-text">{{ u.email }}</span></td>
                  <td><span class="bidang-text">{{ u.namaBidang }}</span></td>
                  <td>
                    <div class="status-group">
                      @if (u.isAktif) {
                        <span class="pill pill-ok">✓ Aktif</span>
                      } @else {
                        <span class="pill pill-off">✕ Nonaktif</span>
                      }
                      @if (u.wajibGantiPassword) {
                        <span class="pill pill-warn">🔑 Belum ganti</span>
                      }
                    </div>
                  </td>
                  <td>
                    <div class="actions">
                      <button class="btn btn-sm" type="button" [disabled]="working()" (click)="openEdit(u)" title="Ubah">
                        ✏️ Ubah
                      </button>
                      <button class="btn btn-sm" type="button" [disabled]="working()" (click)="reset(u)" title="Reset password">
                        🔑 Reset
                      </button>
                      <button class="btn btn-sm" [class.btn-danger]="u.isAktif" type="button"
                              [disabled]="working()" (click)="toggle(u)">
                        {{ u.isAktif ? '🚫 Nonaktifkan' : '✓ Aktifkan' }}
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    /* ===== HEADER ===== */
    .page-head {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
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
    .spacer { flex: 1; }

    /* ===== BANNERS ===== */
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

    .banner-secret {
      position: relative;
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 1px solid #f59e0b;
      border-radius: 16px;
      padding: 20px 24px;
      margin-bottom: 20px;
      box-shadow: 0 4px 20px rgba(245, 158, 11, 0.15);
    }
    .secret-head {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
      color: #92400e;
    }
    .secret-icon { font-size: 20px; }
    .secret-head strong {
      font-size: 15px;
      font-weight: 800;
    }
    .secret-body { padding-right: 32px; }
    .secret-pw {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #ffffff;
      border: 1.5px dashed #f59e0b;
      border-radius: 10px;
      padding: 10px 14px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }
    .secret-pw code {
      flex: 1;
      font-family: 'Courier New', monospace;
      font-size: 15px;
      font-weight: 800;
      color: #92400e;
      letter-spacing: 1px;
      word-break: break-all;
    }
    .copy-btn {
      background: #92400e;
      color: #ffffff;
      border-color: #92400e;
      font-weight: 700;
    }
    .copy-btn:hover {
      background: #78350f;
    }
    .copy-btn.copied {
      background: #15803d;
      border-color: #15803d;
    }
    .secret-note {
      margin: 0;
      font-size: 12px;
      color: #92400e;
      font-weight: 600;
      line-height: 1.5;
    }
    .close-secret {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(255, 255, 255, 0.6);
      border: 1px solid #f59e0b;
      color: #92400e;
      width: 28px;
      height: 28px;
      padding: 0;
      border-radius: 50%;
    }

    /* ===== FORM PANEL ===== */
    .panel {
      background: #ffffff;
      border-radius: 18px;
      border: 1px solid #f1f5f9;
      box-shadow: 0 4px 20px rgba(74, 158, 255, 0.08);
      padding: 24px 28px;
    }
    .form-panel { margin-bottom: 24px; }

    .panel-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f1f5f9;
    }
    .header-icon {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: linear-gradient(135deg, #eaf4ff 0%, #d6e9ff 100%);
      display: grid;
      place-items: center;
      font-size: 18px;
      border: 1px solid #d6e9ff;
    }
    .panel-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }

    /* ===== FORM ===== */
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
    }
    .form-grid .full { grid-column: 1 / -1; }
    @media (max-width: 640px) {
      .form-grid { grid-template-columns: 1fr; }
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .field label {
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
    }
    .required { color: #ef4444; font-weight: 800; }
    
    .field input, .field select {
      width: 100%;
      box-sizing: border-box;
      padding: 11px 14px;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      font: inherit;
      font-size: 14px;
      background: #f8fafc;
      color: #0f172a;
      transition: all 0.2s ease;
      outline: none;
    }
    .field input::placeholder { color: #94a3b8; }
    .field input:focus, .field select:focus {
      border-color: #4a9eff;
      background: #ffffff;
      box-shadow: 0 0 0 4px rgba(74, 158, 255, 0.14);
    }
    .err {
      color: #b91c1c;
      font-size: 12px;
      font-weight: 600;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #f1f5f9;
    }
    .form-actions .btn-primary {
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

    /* ===== TABLE SECTION ===== */
    .table-section {
      background: #ffffff;
      border-radius: 18px;
      border: 1px solid #f1f5f9;
      box-shadow: 0 4px 20px rgba(74, 158, 255, 0.08);
      overflow: hidden;
    }

    .table-wrap { overflow-x: auto; }
    .table {
      width: 100%;
      border-collapse: collapse;
    }
    .table th {
      padding: 14px 20px;
      text-align: left;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      background: linear-gradient(135deg, #f8fbff 0%, #ffffff 100%);
      border-bottom: 1px solid #f1f5f9;
      white-space: nowrap;
    }
    .table td {
      padding: 16px 20px;
      font-size: 14px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .table tbody tr { transition: background 0.2s ease; }
    .table tbody tr:hover { background: #f8fbff; }
    .table tbody tr:last-child td { border-bottom: none; }
    .text-right { text-align: right; }

    /* User Cell */
    .user-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6baeff 0%, #4a9eff 100%);
      color: #ffffff;
      font-weight: 800;
      font-size: 13px;
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .user-cell strong {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }
    .email-text { color: #475569; font-size: 13px; font-weight: 500; }
    .bidang-text { color: #1f66bd; font-size: 13px; font-weight: 600; }

    /* Status Pills */
    .status-group {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      border: 1px solid transparent;
    }
    .pill-ok {
      background: #dcfce7;
      color: #15803d;
      border-color: #bbf7d0;
    }
    .pill-off {
      background: #f1f5f9;
      color: #475569;
      border-color: #e2e8f0;
    }
    .pill-warn {
      background: #fef3c7;
      color: #b45309;
      border-color: #fde68a;
    }

    /* Actions */
    .actions {
      display: flex;
      gap: 6px;
      justify-content: flex-end;
      flex-wrap: wrap;
    }

    /* ===== EMPTY & LOADING ===== */
    .empty-state {
      padding: 60px 24px;
      text-align: center;
    }
    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.7;
    }
    .empty-state h3 {
      margin: 0 0 6px;
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
    }
    .empty-state p {
      margin: 0;
      font-size: 14px;
      color: #64748b;
    }
    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 60px 20px;
      color: #64748b;
      font-weight: 600;
      font-size: 14px;
    }
    .spinner {
      width: 20px;
      height: 20px;
      border: 2.5px solid #d6e9ff;
      border-top-color: #4a9eff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class UsersComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AdminService);

  readonly users = signal<UserItem[]>([]);
  readonly bidangs = signal<Bidang[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly working = signal(false);
  readonly error = signal<string | null>(null);
  readonly copied = signal(false);
  readonly secret = signal<{ label: string; password: string } | null>(null);

  readonly mode = signal<'closed' | 'create' | 'edit'>('closed');
  private editId: number | null = null;

  readonly form = this.fb.nonNullable.group({
    namaLengkap: ['', [Validators.required, Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    bidangId: ['', Validators.required],
  });

  ngOnInit() {
    this.api.bidangs().subscribe(b => this.bidangs.set(b));
    this.load();
  }

  openCreate() {
    this.editId = null;
    this.form.reset();
    this.mode.set('create');
  }

  openEdit(u: UserItem) {
    this.editId = u.id;
    this.form.reset({
      namaLengkap: u.namaLengkap,
      email: u.email,
      bidangId: u.bidangId ? String(u.bidangId) : '',
    });
    this.mode.set('edit');
  }

  closeForm() {
    this.mode.set('closed');
    this.editId = null;
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const body: UserRequest = {
      namaLengkap: v.namaLengkap.trim(),
      email: v.email.trim(),
      bidangId: Number(v.bidangId),
    };

    this.error.set(null);
    this.saving.set(true);

    if (this.editId === null) {
      this.api.createUser(body).subscribe({
        next: r => {
          this.saving.set(false);
          this.closeForm();
          this.secret.set({
            label: `Akun dibuat untuk ${r.user.namaLengkap} (${r.user.email})`,
            password: r.passwordSementara,
          });
          this.load();
        },
        error: (e: HttpErrorResponse) => this.fail(e, 'Gagal menambah akun.'),
      });
    } else {
      this.api.updateUser(this.editId, body).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeForm();
          this.load();
        },
        error: (e: HttpErrorResponse) => this.fail(e, 'Gagal menyimpan perubahan.'),
      });
    }
  }

  toggle(u: UserItem) {
    const aktifkan = !u.isAktif;
    const text = aktifkan
      ? `Aktifkan kembali akun ${u.namaLengkap}?`
      : `Nonaktifkan akun ${u.namaLengkap}? Sesi yang sedang berjalan akan langsung berakhir.`;
    if (!confirm(text)) return;

    this.error.set(null);
    this.working.set(true);
    this.api.setActive(u.id, aktifkan).subscribe({
      next: () => {
        this.working.set(false);
        this.load();
      },
      error: (e: HttpErrorResponse) => {
        this.working.set(false);
        this.error.set(apiErrorMessage(e, 'Gagal mengubah status akun.'));
      },
    });
  }

  reset(u: UserItem) {
    if (!confirm(`Reset password ${u.namaLengkap}? Password lama dan sesi yang sedang berjalan tidak berlaku lagi.`)) return;

    this.error.set(null);
    this.working.set(true);
    this.api.resetPassword(u.id).subscribe({
      next: r => {
        this.working.set(false);
        this.secret.set({ label: `Password direset untuk ${u.namaLengkap}`, password: r.passwordSementara });
        this.load();
      },
      error: (e: HttpErrorResponse) => {
        this.working.set(false);
        this.error.set(apiErrorMessage(e, 'Gagal mereset password.'));
      },
    });
  }

  async copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      this.error.set('Gagal menyalin. Salin manual dari layar.');
    }
  }

  private fail(e: HttpErrorResponse, fallback: string) {
    this.saving.set(false);
    this.error.set(apiErrorMessage(e, fallback));
  }

  private load() {
    this.api.users().subscribe({
      next: u => {
        this.users.set(u);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Gagal memuat daftar pengguna.');
        this.loading.set(false);
      },
    });
  }
}