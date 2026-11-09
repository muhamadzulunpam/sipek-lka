import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { LaporanService } from '../../core/laporan.service';
import { Bidang, LaporanListItem, PagedResult, StatusLaporan } from '../../core/models';
import { PERIODE_PATTERN, STATUS_OPTIONS, isDeletable, isEditable } from '../../core/laporan-rules';
import { StatusBadgeComponent } from '../../shared/status-badge.component';

@Component({
  selector: 'app-laporan-list',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, DecimalPipe, StatusBadgeComponent],
  template: `
    <!-- PAGE HEADER -->
    <div class="page-head">
      <div>
        <h2>Laporan Kinerja</h2>
        <p class="subtitle">Kelola dan pantau seluruh laporan kinerja bidang LKA</p>
      </div>
      <span class="spacer"></span>
      @if (isKepala()) {
        <a class="btn btn-primary" routerLink="/laporan/baru">
          <span>+</span> Buat Laporan
        </a>
      }
    </div>

    <!-- FILTERS -->
    <form class="filters" [formGroup]="filter" (ngSubmit)="apply()">
      <label>
        <span class="label-text">Periode</span>
        <input type="text" formControlName="periode" placeholder="Contoh: 2026-11" maxlength="7" />
      </label>
      <label>
        <span class="label-text">Status</span>
        <select formControlName="status">
          <option value="">Semua Status</option>
          @for (s of statusOptions(); track s.value) {
            <option [value]="s.value">{{ s.label }}</option>
          }
        </select>
      </label>
      @if (isPimpinan()) {
        <label>
          <span class="label-text">Bidang</span>
          <select formControlName="bidangId">
            <option value="">Semua Bidang</option>
            @for (b of bidangs(); track b.id) {
              <option [value]="b.id">{{ b.nama }}</option>
            }
          </select>
        </label>
      }
      <div class="filter-actions">
        <button class="btn btn-primary" type="submit">Terapkan</button>
        <button class="btn" type="button" (click)="reset()">Reset</button>
      </div>
    </form>
    
    @if (filter.controls.periode.invalid) {
      <p class="err">⚠️ Format periode: YYYY-MM, contoh 2026-11.</p>
    }

    @if (error()) {
      <div class="banner-err">
        <span>⚠️</span> {{ error() }}
      </div>
    }

    <!-- TABLE SECTION -->
    <div class="table-section">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <span>Memuat data laporan...</span>
        </div>
      } @else if (result(); as r) {
        @if (r.items.length === 0) {
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <h3>Belum Ada Laporan</h3>
            <p>Tidak ada laporan yang cocok dengan filter Anda.</p>
          </div>
        } @else {
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Kegiatan</th>
                  <th>Bidang</th>
                  <th>Periode</th>
                  <th class="text-right">Target / Realisasi</th>
                  <th>Status</th>
                  <th>Dibuat</th>
                  <th class="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                @for (l of r.items; track l.id) {
                  <tr>
                    <td><strong class="kegiatan-text">{{ l.namaKegiatan }}</strong></td>
                    <td><span class="bidang-text">{{ l.namaBidang }}</span></td>
                    <td><span class="periode-badge">{{ l.periode }}</span></td>
                    <td class="text-right">
                      <span class="num-text">{{ l.target | number: '1.0-2' }}</span>
                      <span class="num-divider">/</span>
                      <span class="num-text realisasi">{{ l.realisasi | number: '1.0-2' }}</span>
                    </td>
                    <td><app-status-badge [status]="l.status" /></td>
                    <td><span class="date-text">{{ l.dibuatPada | date: 'dd MMM yyyy' }}</span></td>
                    <td>
                      <div class="actions">
                        <a class="btn btn-sm" [routerLink]="['/laporan', l.id]" title="Lihat Detail">
                          👁️ Lihat
                        </a>
                        @if (isKepala() && canEdit(l)) {
                          <a class="btn btn-sm" [routerLink]="['/laporan', l.id, 'ubah']" title="Ubah">
                            ✏️ Ubah
                          </a>
                        }
                        @if (isKepala() && canDelete(l)) {
                          <button class="btn btn-sm btn-danger" type="button" (click)="remove(l)" title="Hapus">
                            🗑️ Hapus
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- PAGINATION -->
          <div class="pager">
            <button class="btn btn-sm pager-btn" type="button" [disabled]="page() <= 1 || loading()" (click)="go(page() - 1)">
              ← Sebelumnya
            </button>
            <span class="pager-info">
              Halaman <strong>{{ r.page }}</strong> dari <strong>{{ totalPages() }}</strong> · {{ r.totalItems }} laporan
            </span>
            <button class="btn btn-sm pager-btn" type="button" [disabled]="page() >= totalPages() || loading()" (click)="go(page() + 1)">
              Berikutnya →
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

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

    /* ===== FILTERS ===== */
    .filters {
      display: flex;
      gap: 16px;
      align-items: flex-end;
      flex-wrap: wrap;
      margin-bottom: 16px;
      background: #ffffff;
      padding: 20px;
      border-radius: 16px;
      border: 1px solid #f1f5f9;
      box-shadow: 0 4px 16px rgba(74, 158, 255, 0.06);
    }
    .filters label {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .label-text {
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
    }
    .filters input, .filters select {
      padding: 10px 14px;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      font: inherit;
      font-size: 14px;
      background: #f8fafc;
      color: #0f172a;
      min-width: 160px;
      transition: all 0.2s ease;
      outline: none;
    }
    .filters input:focus, .filters select:focus {
      border-color: #4a9eff;
      background: #ffffff;
      box-shadow: 0 0 0 4px rgba(74, 158, 255, 0.14);
    }
    .filter-actions {
      display: flex;
      gap: 8px;
      margin-left: auto;
    }

    /* ===== TABLE SECTION ===== */
    .table-section {
      background: #ffffff;
      border-radius: 18px;
      border: 1px solid #f1f5f9;
      box-shadow: 0 4px 20px rgba(74, 158, 255, 0.08);
      overflow: hidden;
    }

    /* ===== LOADING ===== */
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
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* ===== EMPTY ===== */
    .empty-state {
      padding: 64px 24px;
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

    /* ===== TABLE ===== */
    .table-wrap {
      overflow-x: auto;
    }
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
    .table tbody tr {
      transition: background 0.2s ease;
    }
    .table tbody tr:hover {
      background: #f8fbff;
    }
    .table tbody tr:last-child td {
      border-bottom: none;
    }
    .text-right {
      text-align: right;
    }

    .kegiatan-text {
      font-weight: 700;
      color: #0f172a;
    }
    .bidang-text {
      color: #475569;
      font-weight: 600;
      font-size: 13px;
    }
    .periode-badge {
      display: inline-block;
      background: #eaf4ff;
      color: #1f66bd;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      font-family: 'Courier New', monospace;
      border: 1px solid #d6e9ff;
    }
    .num-text {
      font-weight: 700;
      color: #0f172a;
      font-variant-numeric: tabular-nums;
    }
    .num-text.realisasi {
      color: #15803d;
    }
    .num-divider {
      color: #cbd5e1;
      margin: 0 6px;
      font-weight: 600;
    }
    .date-text {
      color: #64748b;
      font-size: 13px;
      font-weight: 500;
    }

    /* ===== ACTIONS ===== */
    .actions {
      display: flex;
      gap: 6px;
      justify-content: flex-end;
    }

    /* ===== PAGINATION ===== */
    .pager {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 16px 20px;
      border-top: 1px solid #f1f5f9;
      background: #fafbfd;
      flex-wrap: wrap;
    }
    .pager-info {
      font-size: 13px;
      color: #64748b;
      font-weight: 500;
    }
    .pager-info strong {
      color: #0f172a;
      font-weight: 700;
    }
    .pager-btn {
      padding: 8px 16px;
      font-size: 13px;
    }
  `],
})
export class LaporanListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(LaporanService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);


  private readonly pageSize = 10;

  readonly isPimpinan = computed(() => this.auth.session()?.role === 'Pimpinan');
  readonly isKepala = computed(() => this.auth.session()?.role === 'KepalaBidang');
  readonly statusOptions = computed(() =>
    this.isPimpinan() ? STATUS_OPTIONS.filter(s => s.value !== 'Draft') : STATUS_OPTIONS);

  readonly bidangs = signal<Bidang[]>([]);
  readonly result = signal<PagedResult<LaporanListItem> | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly totalPages = computed(() => Math.max(this.result()?.totalPages ?? 1, 1));

  readonly filter = this.fb.nonNullable.group({
    periode: ['', Validators.pattern(PERIODE_PATTERN)],
    status: [''],
    bidangId: [''],
  });

  canEdit = (l: LaporanListItem) => isEditable(l.status);
  canDelete = (l: LaporanListItem) => isDeletable(l.status);

  ngOnInit() {
    // Filter awal dari URL, mis. /laporan?status=Submitted. Nilai yang tidak valid diabaikan.
    const q = this.route.snapshot.queryParamMap;
    const status = q.get('status');
    const periode = q.get('periode');
    const bidangId = q.get('bidangId');

    this.filter.patchValue({
      status: STATUS_OPTIONS.some(s => s.value === status) ? status! : '',
      periode: periode && PERIODE_PATTERN.test(periode) ? periode : '',
      bidangId: bidangId && /^\d+$/.test(bidangId) ? bidangId : '',
    });

    this.load();
    if (this.isPimpinan()) {
      this.api.bidangs().subscribe(b => this.bidangs.set(b));
    }
  }

  apply() {
    if (this.filter.invalid) {
      this.filter.markAllAsTouched();
      return;
    }
    this.page.set(1);
    this.load();
  }

  reset() {
    this.filter.reset();
    this.page.set(1);
    this.load();
  }

  go(p: number) {
    this.page.set(p);
    this.load();
  }

  remove(item: LaporanListItem) {
    if (!confirm(`Hapus laporan "${item.namaKegiatan}"?`)) return;

    this.api.remove(item.id).subscribe({
      next: () => {
        if (this.result()?.items.length === 1 && this.page() > 1) {
          this.page.update(p => p - 1);
        }
        this.load();
      },
      error: (e: HttpErrorResponse) =>
        this.error.set(e.error?.message ?? 'Gagal menghapus laporan.'),
    });
  }

  private load() {
    this.loading.set(true);
    this.error.set(null);

    const v = this.filter.getRawValue();
    this.api
      .list({
        page: this.page(),
        pageSize: this.pageSize,
        periode: v.periode.trim() || undefined,
        status: (v.status || undefined) as StatusLaporan | undefined,
        bidangId: v.bidangId ? Number(v.bidangId) : undefined,
      })
      .subscribe({
        next: r => {
          this.result.set(r);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Gagal memuat daftar laporan.');
          this.loading.set(false);
        },
      });
  }
}