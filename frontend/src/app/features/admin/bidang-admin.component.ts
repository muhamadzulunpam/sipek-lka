import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../core/admin.service';
import { apiErrorMessage } from '../../core/api-error';
import { Bidang } from '../../core/models';

@Component({
  selector: 'app-bidang-admin',
  imports: [ReactiveFormsModule],
  template: `
    <!-- PAGE HEADER -->
    <div class="page-head">
      <div>
        <h2>Master Bidang</h2>
        <p class="subtitle">Kelola daftar bidang yang ada di lingkungan LKA Universitas Pamulang</p>
      </div>
    </div>

    @if (error()) {
      <div class="banner-err"><span>⚠️</span> {{ error() }}</div>
    }

    <!-- FORM PANEL -->
    <div class="panel form-panel">
      <div class="panel-header">
        <span class="header-icon">{{ editingId() === null ? '➕' : '✏️' }}</span>
        <div>
          <h3>{{ editingId() === null ? 'Tambah Bidang Baru' : 'Ubah Nama Bidang' }}</h3>
          <p class="header-sub">{{ editingId() === null ? 'Masukkan nama bidang baru untuk ditambahkan' : 'Perbarui nama bidang yang sudah ada' }}</p>
        </div>
      </div>

      <form (ngSubmit)="save()" class="inline-form">
        <div class="field-inline">
          <input 
            type="text" 
            [formControl]="nama" 
            maxlength="150" 
            placeholder="Contoh: Bidang Akademik"
          />
        </div>
        <div class="form-actions-inline">
          <button class="btn btn-primary" type="submit" [disabled]="saving()">
            @if (saving()) {
              <span class="spinner-sm"></span>
              <span>Menyimpan...</span>
            } @else {
              <span>{{ editingId() === null ? '➕ Tambah' : '💾 Simpan' }}</span>
            }
          </button>
          @if (editingId() !== null) {
            <button class="btn" type="button" (click)="cancel()">✕ Batal</button>
          }
        </div>
      </form>
      
      @if (nama.touched && nama.invalid) {
        <p class="err">⚠️ Nama bidang wajib diisi (maksimal 150 karakter).</p>
      }
    </div>

    <!-- TABLE SECTION -->
    <div class="table-section">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <span>Memuat daftar bidang...</span>
        </div>
      } @else if (items().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">🏛️</div>
          <h3>Belum Ada Bidang</h3>
          <p>Belum ada bidang yang terdaftar di sistem.</p>
        </div>
      } @else {
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th style="width: 80px">ID</th>
                <th>Nama Bidang</th>
                <th class="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              @for (b of items(); track b.id) {
                <tr>
                  <td>
                    <span class="id-badge">#{{ b.id }}</span>
                  </td>
                  <td>
                    <div class="bidang-cell">
                      <div class="bidang-avatar">{{ b.nama.charAt(0).toUpperCase() }}</div>
                      <strong class="bidang-name">{{ b.nama }}</strong>
                    </div>
                  </td>
                  <td class="text-right">
                    <button class="btn btn-sm" type="button" (click)="edit(b)">
                      ✏️ Ubah
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- INFO NOTE -->
    <div class="info-note">
      <span class="note-icon">ℹ️</span>
      <p>
        Bidang tidak bisa dihapus karena sudah terkait dengan laporan. Nama yang diubah
        langsung berlaku di semua laporan. Kepala Bidang melihat nama baru di header setelah login ulang.
      </p>
    </div>
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

    /* ===== BANNER ===== */
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
      box-shadow: 0 4px 20px rgba(74, 158, 255, 0.08);
      padding: 24px 28px;
    }
    .form-panel { margin-bottom: 24px; }

    .panel-header {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f1f5f9;
    }
    .header-icon {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: linear-gradient(135deg, #eaf4ff 0%, #d6e9ff 100%);
      display: grid;
      place-items: center;
      font-size: 20px;
      border: 1px solid #d6e9ff;
      flex-shrink: 0;
    }
    .panel-header h3 {
      margin: 0 0 4px;
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }
    .header-sub {
      margin: 0;
      font-size: 13px;
      color: #64748b;
    }

    /* ===== INLINE FORM ===== */
    .inline-form {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      flex-wrap: wrap;
    }
    .field-inline {
      flex: 1;
      min-width: 260px;
    }
    .field-inline input {
      width: 100%;
      box-sizing: border-box;
      padding: 12px 16px;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      font: inherit;
      font-size: 14px;
      background: #f8fafc;
      color: #0f172a;
      transition: all 0.2s ease;
      outline: none;
    }
    .field-inline input::placeholder { color: #94a3b8; }
    .field-inline input:focus {
      border-color: #4a9eff;
      background: #ffffff;
      box-shadow: 0 0 0 4px rgba(74, 158, 255, 0.14);
    }
    .form-actions-inline {
      display: flex;
      gap: 8px;
    }
    .form-actions-inline .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .err {
      margin: 10px 0 0;
      color: #b91c1c;
      font-size: 12px;
      font-weight: 600;
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
      margin-bottom: 20px;
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

    /* ID Badge */
    .id-badge {
      display: inline-block;
      background: #eaf4ff;
      color: #1f66bd;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 800;
      font-family: 'Courier New', monospace;
      border: 1px solid #d6e9ff;
    }

    /* Bidang Cell */
    .bidang-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .bidang-avatar {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #6baeff 0%, #4a9eff 100%);
      color: #ffffff;
      font-weight: 800;
      font-size: 14px;
      display: grid;
      place-items: center;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(74, 158, 255, 0.25);
    }
    .bidang-name {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
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

    /* ===== INFO NOTE ===== */
    .info-note {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: #f0f7ff;
      border: 1px dashed #8fc2ff;
      border-radius: 12px;
      padding: 16px 20px;
      color: #1f66bd;
    }
    .note-icon {
      font-size: 18px;
      flex-shrink: 0;
      line-height: 1.4;
    }
    .info-note p {
      margin: 0;
      font-size: 13px;
      font-weight: 600;
      line-height: 1.6;
    }

    @media (max-width: 640px) {
      .panel { padding: 20px; }
      .inline-form { flex-direction: column; }
      .form-actions-inline { width: 100%; }
      .form-actions-inline .btn { flex: 1; justify-content: center; }
    }
  `],
})
export class BidangAdminComponent implements OnInit {
  private readonly api = inject(AdminService);

  readonly items = signal<Bidang[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly editingId = signal<number | null>(null);

  readonly nama = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(150)],
  });

  ngOnInit() {
    this.load();
  }

  edit(b: Bidang) {
    this.editingId.set(b.id);
    this.nama.setValue(b.nama);
    this.nama.markAsUntouched();
  }

  cancel() {
    this.editingId.set(null);
    this.nama.reset();
  }

  save() {
    if (this.nama.invalid || this.nama.value.trim() === '') {
      this.nama.markAsTouched();
      return;
    }

    const nama = this.nama.value.trim();
    const id = this.editingId();

    this.error.set(null);
    this.saving.set(true);

    const request$ = id === null ? this.api.createBidang(nama) : this.api.updateBidang(id, nama);
    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancel();
        this.load();
      },
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(e, 'Gagal menyimpan bidang.'));
      },
    });
  }

  private load() {
    this.api.bidangs().subscribe({
      next: b => {
        this.items.set(b);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Gagal memuat daftar bidang.');
        this.loading.set(false);
      },
    });
  }
}