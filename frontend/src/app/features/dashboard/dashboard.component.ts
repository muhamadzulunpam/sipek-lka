import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { DashboardService } from '../../core/dashboard.service';
import { LaporanService } from '../../core/laporan.service';
import { BidangStat, DashboardResponse, LaporanListItem, StatusLaporan } from '../../core/models';
import { PERIODE_PATTERN, STATUS_LABEL } from '../../core/laporan-rules';
import { StatusBadgeComponent } from '../../shared/status-badge.component';
import { UtcPipe } from '../../shared/utc.pipe';

interface Card {
  label: string;
  value: number;
  tone: string;
  status?: StatusLaporan;
  link: boolean;
  icon: string;
}

// Urutan segmen batang dari kiri ke kanan
const ORDER: StatusLaporan[] = ['Approved', 'Submitted', 'Revision', 'Rejected', 'Draft'];
const KEY: Record<StatusLaporan, keyof BidangStat> = {
  Approved: 'approved',
  Submitted: 'submitted',
  Revision: 'revision',
  Rejected: 'rejected',
  Draft: 'draft',
};

@Component({
  selector: 'app-dashboard',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, StatusBadgeComponent, UtcPipe],
  template: `
    <!-- PAGE HEADER -->
    <div class="page-head">
      <div>
        <h2>Dashboard</h2>
        <p class="subtitle">Ringkasan kinerja dan tindak lanjut laporan</p>
      </div>
      <span class="spacer"></span>
      <form class="filters" (ngSubmit)="apply()">
        <label>
          <span class="label-text">Periode</span>
          <input type="text" [formControl]="periode" placeholder="Contoh: 2026-11" maxlength="7" />
        </label>
        <div class="filter-actions">
          <button class="btn btn-primary" type="submit">Terapkan</button>
          <button class="btn" type="button" (click)="reset()">Reset</button>
        </div>
      </form>
    </div>
    @if (periode.invalid) {
      <p class="err">⚠️ Format periode: YYYY-MM, contoh 2026-11.</p>
    }

    @if (error()) {
      <div class="banner-err"><span>⚠️</span> {{ error() }}</div>
    }

    @if (data(); as d) {
      <!-- INFO PERIODE -->
      <div class="periode-info">
        <span class="info-icon">📅</span>
        <span>
          @if (d.periode) { Menampilkan periode <strong>{{ d.periode }}</strong>. } 
          @else { Menampilkan <strong>semua periode</strong>. }
          @if (loading()) { <span class="loading-text">Memuat...</span> }
        </span>
      </div>

      <!-- STAT CARDS -->
      <div class="dash-cards">
        @for (c of cards(); track c.label) {
          @if (c.link) {
            <a class="dash-card" [attr.data-tone]="c.tone" routerLink="/laporan"
               [queryParams]="{ status: c.status, periode: d.periode }">
              <div class="card-icon">{{ c.icon }}</div>
              <div class="card-body">
                <div class="value">{{ c.value }}</div>
                <div class="label">{{ c.label }}</div>
              </div>
            </a>
          } @else {
            <div class="dash-card" [attr.data-tone]="c.tone">
              <div class="card-icon">{{ c.icon }}</div>
              <div class="card-body">
                <div class="value">{{ c.value }}</div>
                <div class="label">{{ c.label }}</div>
              </div>
            </div>
          }
        }
      </div>

      <!-- CHART SECTION -->
      <section class="panel panel-wide">
        <div class="section-head">
          <span class="section-icon">📊</span>
          <h3>{{ isPimpinan() ? 'Perbandingan Laporan Antar Bidang' : 'Laporan Bidang Anda per Status' }}</h3>
        </div>

        @if (d.total === 0) {
          <div class="empty-state">
            <div class="empty-icon">📊</div>
            <p>Belum ada laporan pada pilihan ini.</p>
          </div>
        } @else {
          <div class="chart-container">
            @for (r of rows(); track r.bidang.bidangId) {
              <div class="chart-row">
                <div class="chart-label">
                  @if (isPimpinan()) {
                    <a class="btn-link" routerLink="/laporan"
                       [queryParams]="{ bidangId: r.bidang.bidangId, periode: d.periode }">{{ r.bidang.namaBidang }}</a>
                  } @else {
                    <strong>{{ r.bidang.namaBidang }}</strong>
                  }
                </div>
                <div class="chart-bar" role="img" [attr.aria-label]="r.aria">
                  @for (s of r.segs; track s.status) {
                    <span class="chart-seg" [attr.data-status]="s.status"
                          [style.width.%]="s.pct" [title]="s.label + ': ' + s.n"></span>
                  }
                </div>
                <div class="chart-total">{{ r.bidang.total }}</div>
              </div>
            }
          </div>
          <div class="chart-legend">
            @for (l of legend(); track l.status) {
              <span class="legend-item">
                <span class="legend-dot" [attr.data-status]="l.status"></span>
                {{ l.label }}
              </span>
            }
          </div>
        }
      </section>

      <!-- TASK LIST -->
      <section class="panel panel-wide" style="margin-top: 20px">
        <div class="section-head">
          <span class="section-icon">📋</span>
          <h3>{{ isPimpinan() ? 'Menunggu Review Anda' : 'Perlu Direvisi' }}</h3>
        </div>

        @if (tasks().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">✅</div>
            <p>Tidak ada laporan yang perlu ditindaklanjuti.</p>
          </div>
        } @else {
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Kegiatan</th>
                  <th>Bidang</th>
                  <th>Periode</th>
                  <th>Dibuat</th>
                  <th>Status</th>
                  <th class="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                @for (t of tasks(); track t.id) {
                  <tr>
                    <td><strong>{{ t.namaKegiatan }}</strong></td>
                    <td><span class="bidang-text">{{ t.namaBidang }}</span></td>
                    <td><span class="periode-badge">{{ t.periode }}</span></td>
                    <td><span class="date-text">{{ t.dibuatPada | utc | date: 'dd MMM yyyy' }}</span></td>
                    <td><app-status-badge [status]="t.status" /></td>
                    <td class="text-right">
                      <a class="btn btn-sm" [routerLink]="['/laporan', t.id]">👁️ Buka</a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="task-footer">
            <a class="btn-link" routerLink="/laporan"
               [queryParams]="{ status: taskStatus(), periode: d.periode }">
              Lihat semua →
            </a>
          </div>
        }
      </section>
    } @else if (loading()) {
      <div class="loading-state">
        <div class="spinner"></div>
        <span>Memuat dashboard...</span>
      </div>
    }
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

    /* ===== FILTERS ===== */
    .filters {
      display: flex;
      gap: 12px;
      align-items: flex-end;
      background: #ffffff;
      padding: 16px 20px;
      border-radius: 14px;
      border: 1px solid #f1f5f9;
      box-shadow: 0 4px 16px rgba(74, 158, 255, 0.06);
      flex-wrap: wrap;
    }
    .filters label {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .label-text {
      font-size: 12px;
      font-weight: 700;
      color: #1e293b;
    }
    .filters input {
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
    .filters input:focus {
      border-color: #4a9eff;
      background: #ffffff;
      box-shadow: 0 0 0 4px rgba(74, 158, 255, 0.14);
    }
    .filter-actions { display: flex; gap: 8px; }

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
    .err {
      color: #b91c1c;
      font-size: 13px;
      font-weight: 600;
      margin: -12px 0 16px;
    }

    /* ===== INFO ===== */
    .periode-info {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #64748b;
      font-weight: 500;
      margin-bottom: 16px;
      background: #f8fafc;
      padding: 8px 14px;
      border-radius: 999px;
      border: 1px solid #f1f5f9;
    }
    .periode-info strong { color: #0f172a; font-weight: 700; }
    .loading-text {
      color: #4a9eff;
      font-weight: 700;
      margin-left: 4px;
    }

    /* ===== STAT CARDS ===== */
    .dash-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .dash-card {
      display: flex;
      align-items: center;
      gap: 14px;
      background: #ffffff;
      border-radius: 16px;
      padding: 18px 20px;
      color: inherit;
      text-decoration: none;
      border: 1px solid #f1f5f9;
      box-shadow: 0 2px 10px rgba(74, 158, 255, 0.06);
      transition: all 0.25s ease;
      position: relative;
      overflow: hidden;
      border-left: 4px solid #94a3b8;
    }
    a.dash-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(74, 158, 255, 0.15);
    }
    .dash-card::after {
      content: '';
      position: absolute;
      top: 0; right: 0;
      width: 80px; height: 80px;
      border-radius: 50%;
      opacity: 0.08;
      transform: translate(30%, -30%);
    }
    .dash-card[data-tone='Total'] { border-left-color: #4a9eff; }
    .dash-card[data-tone='Total']::after { background: #4a9eff; }
    .dash-card[data-tone='Draft'] { border-left-color: #94a3b8; }
    .dash-card[data-tone='Draft']::after { background: #94a3b8; }
    .dash-card[data-tone='Submitted'] { border-left-color: #3b82f6; }
    .dash-card[data-tone='Submitted']::after { background: #3b82f6; }
    .dash-card[data-tone='Revision'] { border-left-color: #f59e0b; }
    .dash-card[data-tone='Revision']::after { background: #f59e0b; }
    .dash-card[data-tone='Approved'] { border-left-color: #22c55e; }
    .dash-card[data-tone='Approved']::after { background: #22c55e; }
    .dash-card[data-tone='Rejected'] { border-left-color: #ef4444; }
    .dash-card[data-tone='Rejected']::after { background: #ef4444; }

    .card-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #f0f7ff;
      display: grid;
      place-items: center;
      font-size: 22px;
      flex-shrink: 0;
      border: 1px solid #eaf4ff;
    }
    .card-body { display: flex; flex-direction: column; gap: 2px; }
    .dash-card .value {
      font-size: 26px;
      font-weight: 800;
      line-height: 1.1;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .dash-card .label {
      color: #64748b;
      font-size: 12px;
      font-weight: 600;
    }

    /* ===== PANELS ===== */
    .panel {
      background: #ffffff;
      border-radius: 18px;
      border: 1px solid #f1f5f9;
      box-shadow: 0 4px 20px rgba(74, 158, 255, 0.06);
      padding: 24px 28px;
    }
    .panel-wide { max-width: none; }
    @media (max-width: 640px) {
      .panel { padding: 20px; }
    }

    .section-head {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f1f5f9;
    }
    .section-icon {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: linear-gradient(135deg, #eaf4ff 0%, #d6e9ff 100%);
      display: grid;
      place-items: center;
      font-size: 18px;
      border: 1px solid #d6e9ff;
      flex-shrink: 0;
    }
    .section-head h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.2px;
    }

    /* ===== CHART ===== */
    .chart-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .chart-row {
      display: grid;
      grid-template-columns: minmax(120px, 240px) 1fr 44px;
      gap: 16px;
      align-items: center;
    }
    .chart-label {
      font-size: 13px;
      color: #1e293b;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .chart-label .btn-link {
      font-weight: 700;
      color: #2e82e6;
      text-decoration: none;
    }
    .chart-label .btn-link:hover {
      text-decoration: underline;
    }
    .chart-bar {
      display: flex;
      height: 24px;
      background: #f1f5f9;
      border-radius: 8px;
      overflow: hidden;
      gap: 2px;
      padding: 2px;
    }
    .chart-seg {
      height: 100%;
      min-width: 4px;
      background: #94a3b8;
      border-radius: 4px;
      transition: opacity 0.2s;
    }
    .chart-seg:hover {
      opacity: 0.85;
    }
    .chart-total {
      text-align: right;
      font-weight: 800;
      font-size: 14px;
      color: #0f172a;
      font-variant-numeric: tabular-nums;
    }

    /* Warna Segmen */
    .chart-seg[data-status='Submitted'], .legend-dot[data-status='Submitted'] { background: #3b82f6; }
    .chart-seg[data-status='Revision'], .legend-dot[data-status='Revision'] { background: #f59e0b; }
    .chart-seg[data-status='Approved'], .legend-dot[data-status='Approved'] { background: #22c55e; }
    .chart-seg[data-status='Rejected'], .legend-dot[data-status='Rejected'] { background: #ef4444; }
    .chart-seg[data-status='Draft'], .legend-dot[data-status='Draft'] { background: #94a3b8; }

    .chart-legend {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid #f1f5f9;
      font-size: 13px;
      font-weight: 600;
    }
    .legend-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #475569;
    }
    .legend-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #94a3b8;
    }

    @media (max-width: 640px) {
      .chart-row { grid-template-columns: 1fr 44px; gap: 8px 12px; }
      .chart-label { grid-column: 1 / -1; }
    }

    /* ===== TABLE ===== */
    .table-wrap {
      overflow-x: auto;
      border-radius: 12px;
      border: 1px solid #f1f5f9;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
    }
    .table th {
      padding: 14px 16px;
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
      padding: 14px 16px;
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
    .table tbody tr:last-child td { border-bottom: none; }
    .text-right { text-align: right; }
    
    .bidang-text { color: #475569; font-weight: 600; font-size: 13px; }
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
    .date-text { color: #64748b; font-size: 13px; font-weight: 500; }

    .task-footer {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #f1f5f9;
      text-align: right;
    }

    /* ===== EMPTY STATE ===== */
    .empty-state {
      padding: 40px 20px;
      text-align: center;
      background: #f8fafc;
      border: 1.5px dashed #e2e8f0;
      border-radius: 12px;
    }
    .empty-icon {
      font-size: 40px;
      margin-bottom: 12px;
      opacity: 0.7;
    }
    .empty-state p {
      margin: 0;
      font-size: 14px;
      color: #64748b;
      font-weight: 600;
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
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(DashboardService);
  private readonly laporanApi = inject(LaporanService);
  private readonly auth = inject(AuthService);

  readonly isPimpinan = computed(() => this.auth.session()?.role === 'Pimpinan');
  readonly taskStatus = computed<StatusLaporan>(() => (this.isPimpinan() ? 'Submitted' : 'Revision'));

  readonly periode = new FormControl('', {
    nonNullable: true,
    validators: Validators.pattern(PERIODE_PATTERN),
  });

  readonly data = signal<DashboardResponse | null>(null);
  readonly tasks = signal<LaporanListItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private seq = 0;

  readonly cards = computed<Card[]>(() => {
    const d = this.data();
    if (!d) return [];

    const cards: Card[] = [];
    if (this.isPimpinan()) {
      cards.push({ label: 'Kepala bidang', value: d.totalKepalaBidang ?? 0, tone: 'Total', link: false, icon: '👥' });
      cards.push({ label: 'Laporan dikirim', value: d.total, tone: 'Total', link: true, icon: '📤' });
    } else {
      cards.push({ label: 'Total laporan', value: d.total, tone: 'Total', link: true, icon: '📊' });
      cards.push({ label: 'Draft', value: d.draft, tone: 'Draft', status: 'Draft', link: true, icon: '📝' });
    }
    cards.push(
      { label: 'Menunggu review', value: d.submitted, tone: 'Submitted', status: 'Submitted', link: true, icon: '⏳' },
      { label: 'Perlu revisi', value: d.revision, tone: 'Revision', status: 'Revision', link: true, icon: '🔄' },
      { label: 'Disetujui', value: d.approved, tone: 'Approved', status: 'Approved', link: true, icon: '✅' },
      { label: 'Ditolak', value: d.rejected, tone: 'Rejected', status: 'Rejected', link: true, icon: '❌' },
    );
    return cards;
  });

  readonly rows = computed(() => {
    const d = this.data();
    if (!d) return [];

    const max = Math.max(...d.perBidang.map(b => b.total), 1);
    return d.perBidang.map(bidang => {
      const segs = ORDER
        .map(status => ({ status, n: bidang[KEY[status]] as number }))
        .filter(x => x.n > 0)
        .map(x => ({ ...x, label: STATUS_LABEL[x.status], pct: (x.n / max) * 100 }));

      const detail = segs.length ? ` (${segs.map(s => `${s.label} ${s.n}`).join(', ')})` : '';
      return { bidang, segs, aria: `${bidang.namaBidang}: ${bidang.total} laporan${detail}` };
    });
  });

  readonly legend = computed(() =>
    ORDER.filter(s => s !== 'Draft' || !this.isPimpinan()).map(status => ({
      status,
      label: STATUS_LABEL[status],
    })));

  ngOnInit() {
    this.load();
  }

  apply() {
    if (this.periode.invalid) {
      this.periode.markAsTouched();
      return;
    }
    this.load();
  }

  reset() {
    this.periode.reset();
    this.load();
  }

  private load() {
    const my = ++this.seq;
    const periode = this.periode.value.trim() || undefined;

    this.loading.set(true);
    this.error.set(null);

    this.api.get(periode).subscribe({
      next: d => {
        if (my !== this.seq) return;
        this.data.set(d);
        this.loading.set(false);
      },
      error: () => {
        if (my !== this.seq) return;
        this.error.set('Gagal memuat dashboard.');
        this.loading.set(false);
      },
    });

    this.laporanApi
      .list({ page: 1, pageSize: 5, periode, status: this.taskStatus() })
      .subscribe({
        next: r => {
          if (my === this.seq) this.tasks.set(r.items);
        },
        error: () => {
          if (my === this.seq) this.error.set('Gagal memuat dashboard.');
        },
      });
  }
}