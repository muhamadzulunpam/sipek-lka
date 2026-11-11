import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { AuditService } from '../../core/audit.service';
import { AuditAksi, AuditLogItem, PagedResult } from '../../core/models';
import { UtcPipe } from '../../shared/utc.pipe';

// Kejadian yang patut diwaspadai ditandai merah
const WARN_ACTIONS = new Set(['LoginGagal', 'LoginDitolak', 'GantiPasswordGagal']);

function validRange(g: AbstractControl): ValidationErrors | null {
  const dari = g.get('dari')?.value as string;
  const sampai = g.get('sampai')?.value as string;
  return dari && sampai && dari > sampai ? { range: true } : null; // YYYY-MM-DD aman dibandingkan sebagai teks
}

// "2026-11-11" -> awal hari tersebut menurut zona waktu pengguna, dalam UTC
function startOfLocalDayIso(value: string, addDays = 0): string | undefined {
  if (!value) return undefined;
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d + addDays).toISOString();
}

@Component({
  selector: 'app-audit',
  imports: [ReactiveFormsModule, DatePipe, UtcPipe],
  template: `
    <!-- PAGE HEADER -->
    <div class="page-head">
      <div>
        <h2>Audit Log</h2>
        <p class="subtitle">Rekam jejak aktivitas pengguna dan perubahan data di sistem</p>
      </div>
    </div>

    <!-- FILTERS -->
    <form class="filters" [formGroup]="filter" (ngSubmit)="apply()">
      <div class="filter-grid">
        <div class="field">
          <label for="aksi">Aksi</label>
          <select id="aksi" formControlName="aksi">
            <option value="">Semua Aksi</option>
            @for (a of actions(); track a.kode) {
              <option [value]="a.kode">{{ a.label }}</option>
            }
          </select>
        </div>
        <div class="field">
          <label for="pengguna">Pengguna</label>
          <input type="text" id="pengguna" formControlName="pengguna" maxlength="100" placeholder="Nama pengguna" />
        </div>
        <div class="field">
          <label for="dari">Dari Tanggal</label>
          <input type="date" id="dari" formControlName="dari" />
        </div>
        <div class="field">
          <label for="sampai">Sampai Tanggal</label>
          <input type="date" id="sampai" formControlName="sampai" />
        </div>
      </div>
      
      <div class="filter-actions">
        <button class="btn btn-primary" type="submit">Terapkan</button>
        <button class="btn" type="button" (click)="reset()">Reset</button>
      </div>
    </form>
    
    @if (filter.hasError('range')) {
      <p class="err">⚠️ Tanggal awal tidak boleh lebih besar dari tanggal akhir.</p>
    }

    @if (error()) {
      <div class="banner-err"><span>⚠️</span> {{ error() }}</div>
    }

    <!-- TABLE SECTION -->
    <div class="table-section">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <span>Memuat log audit...</span>
        </div>
      } @else if (result(); as r) {
        @if (r.items.length === 0) {
          <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <h3>Tidak Ada Log</h3>
            <p>Tidak ada catatan yang cocok dengan filter Anda.</p>
          </div>
        } @else {
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Pengguna</th>
                  <th>Aksi</th>
                  <th>Data</th>
                  <th>Keterangan</th>
                  <th class="text-right">IP</th>
                </tr>
              </thead>
              <tbody>
                @for (l of r.items; track l.id) {
                  <tr [class.warn-row]="isWarn(l)">
                    <td><span class="time-text">{{ l.waktuUtc | utc | date: 'dd MMM yyyy HH:mm:ss' }}</span></td>
                    <td><strong class="user-name">{{ l.namaPengguna }}</strong></td>
                    <td>
                      <span class="pill" [class.pill-warn]="isWarn(l)" [class.pill-info]="!isWarn(l)">
                        {{ l.aksiLabel }}
                      </span>
                    </td>
                    <td><span class="data-text">{{ dataLabel(l) || '-' }}</span></td>
                    <td><span class="ket-text">{{ l.keterangan || '-' }}</span></td>
                    <td class="text-right"><code class="ip-code">{{ l.ipAddress }}</code></td>
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
              Halaman <strong>{{ r.page }}</strong> dari <strong>{{ totalPages() }}</strong> · {{ r.totalItems }} catatan
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

    /* ===== FILTERS ===== */
    .filters {
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #f1f5f9;
      box-shadow: 0 4px 16px rgba(74, 158, 255, 0.06);
      padding: 20px;
      margin-bottom: 16px;
    }
    .filter-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
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
    .field input, .field select {
      padding: 10px 14px;
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
    .filter-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
    .err {
      margin: -8px 0 16px;
      color: #b91c1c;
      font-size: 13px;
      font-weight: 600;
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
      padding: 14px 20px;
      font-size: 13px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .table tbody tr { transition: background 0.2s ease; }
    .table tbody tr:hover { background: #f8fbff; }
    .table tbody tr:last-child td { border-bottom: none; }
    
    /* Warning Row */
    .warn-row {
      background: #fef2f2 !important;
    }
    .warn-row:hover {
      background: #fee2e2 !important;
    }

    .text-right { text-align: right; }

    /* Content Styles */
    .time-text { color: #475569; font-weight: 600; font-size: 12px; font-family: 'Courier New', monospace; }
    .user-name { color: #0f172a; font-weight: 700; font-size: 13px; }
    .data-text { color: #64748b; font-weight: 500; font-size: 12px; }
    .ket-text { color: #475569; font-weight: 500; font-size: 12px; }
    .ip-code {
      background: #f1f5f9;
      color: #1e293b;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-family: 'Courier New', monospace;
      font-weight: 600;
    }

    /* Pills */
    .pill {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      border: 1px solid transparent;
    }
    .pill-info {
      background: #eaf4ff;
      color: #1f66bd;
      border-color: #d6e9ff;
    }
    .pill-warn {
      background: #fee2e2;
      color: #b91c1c;
      border-color: #fecaca;
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
    .pager-info { font-size: 13px; color: #64748b; font-weight: 500; }
    .pager-info strong { color: #0f172a; font-weight: 700; }
    .pager-btn { padding: 8px 16px; font-size: 13px; }

    /* ===== EMPTY & LOADING ===== */
    .empty-state { padding: 60px 24px; text-align: center; }
    .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.7; }
    .empty-state h3 { margin: 0 0 6px; font-size: 18px; font-weight: 700; color: #0f172a; }
    .empty-state p { margin: 0; font-size: 14px; color: #64748b; }
    .loading-state {
      display: flex; align-items: center; justify-content: center;
      gap: 12px; padding: 60px 20px;
      color: #64748b; font-weight: 600; font-size: 14px;
    }
    .spinner {
      width: 20px; height: 20px;
      border: 2.5px solid #d6e9ff; border-top-color: #4a9eff;
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 640px) {
      .filter-actions { flex-direction: column; }
      .filter-actions .btn { width: 100%; }
    }
  `],
})
export class AuditComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AuditService);

  private readonly pageSize = 20;
  private seq = 0;

  readonly actions = signal<AuditAksi[]>([]);
  readonly result = signal<PagedResult<AuditLogItem> | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly totalPages = computed(() => Math.max(this.result()?.totalPages ?? 1, 1));

  readonly filter = this.fb.nonNullable.group(
    { aksi: '', pengguna: '', dari: '', sampai: '' },
    { validators: validRange },
  );

  ngOnInit() {
    this.api.actions().subscribe(a => this.actions.set(a));
    this.load();
  }

  apply() {
    if (this.filter.invalid) return;
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

  isWarn(l: AuditLogItem) {
    return WARN_ACTIONS.has(l.aksi);
  }

  dataLabel(l: AuditLogItem) {
    return l.tipeData ? (l.dataId ? `${l.tipeData} #${l.dataId}` : l.tipeData) : '';
  }

  private load() {
    const my = ++this.seq;
    const v = this.filter.getRawValue();

    this.loading.set(true);
    this.error.set(null);

    this.api
      .list({
        page: this.page(),
        pageSize: this.pageSize,
        aksi: v.aksi || undefined,
        pengguna: v.pengguna.trim() || undefined,
        dari: startOfLocalDayIso(v.dari),
        sampai: startOfLocalDayIso(v.sampai, 1), // sampai akhir hari yang dipilih
      })
      .subscribe({
        next: r => {
          if (my !== this.seq) return;
          this.result.set(r);
          this.loading.set(false);
        },
        error: () => {
          if (my !== this.seq) return;
          this.error.set('Gagal memuat audit log.');
          this.loading.set(false);
        },
      });
  }
}