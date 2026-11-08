import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { LaporanService } from '../../core/laporan.service';
import { WorkflowService } from '../../core/workflow.service';
import { LaporanResponse } from '../../core/models';
import { isEditable } from '../../core/laporan-rules';
import { StatusBadgeComponent } from '../../shared/status-badge.component';
import { BuktiPanelComponent } from './bukti-panel.component';
import { ReviewPanelComponent } from './review-panel.component';
import { RiwayatPanelComponent } from './riwayat-panel.component';

@Component({
  selector: 'app-laporan-detail',
  imports: [
    RouterLink, DatePipe, DecimalPipe, StatusBadgeComponent,
    BuktiPanelComponent, ReviewPanelComponent, RiwayatPanelComponent,
  ],
  template: `
    <!-- BACK LINK -->
    <a class="back-link" routerLink="/laporan">
      <span class="back-icon">←</span> Kembali ke daftar
    </a>

    @if (error()) {
      <div class="banner-err"><span>⚠️</span> {{ error() }}</div>
    }
    @if (actionError()) {
      <div class="banner-err"><span>⚠️</span> {{ actionError() }}</div>
    }

    @if (laporan(); as l) {
      <!-- ===== HERO HEADER ===== -->
      <div class="hero">
        <div class="hero-content">
          <div class="hero-meta">
            <span class="periode-chip">{{ l.periode }}</span>
            <app-status-badge [status]="l.status" />
          </div>
          <h1 class="hero-title">{{ l.namaKegiatan }}</h1>
          <div class="hero-info">
            <span class="info-item"><span class="info-icon">🏛️</span> {{ l.namaBidang }}</span>
            <span class="info-divider">•</span>
            <span class="info-item"><span class="info-icon">👤</span> {{ l.dibuatOleh }}</span>
            <span class="info-divider">•</span>
            <span class="info-item"><span class="info-icon">📅</span> {{ l.tanggalPelaksanaan | date: 'dd MMM yyyy' }}</span>
          </div>
        </div>
        @if (showEdit()) {
          <a class="btn btn-primary" [routerLink]="['/laporan', l.id, 'ubah']">
            ✏️ Ubah Laporan
          </a>
        }
      </div>

      <!-- ===== WARNING BANNER (REVISION) ===== -->
      @if (l.status === 'Revision' && isKepala()) {
        <div class="banner-warn">
          <span class="warn-icon">🔄</span>
          <div>
            <strong>Laporan Dikembalikan untuk Revisi</strong>
            <p>Baca catatan review di bawah, perbaiki laporan dan bukti, lalu kirim ulang ke pimpinan.</p>
          </div>
        </div>
      }

      <div class="stack">
        <!-- ===== STATS CARDS ===== -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon target-icon">🎯</div>
            <div class="stat-body">
              <span class="stat-label">Target Kinerja</span>
              <h3 class="stat-value">{{ l.target | number: '1.0-2' }}</h3>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon real-icon">✅</div>
            <div class="stat-body">
              <span class="stat-label">Realisasi Kinerja</span>
              <h3 class="stat-value">{{ l.realisasi | number: '1.0-2' }}</h3>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon percent-icon">📈</div>
            <div class="stat-body">
              <span class="stat-label">Persentase Capaian</span>
              <h3 class="stat-value">
                {{ l.target > 0 ? ((l.realisasi / l.target) * 100 | number: '1.0-1') + '%' : '-' }}
              </h3>
            </div>
          </div>
        </div>

        <!-- ===== DETAIL KEGIATAN ===== -->
        <div class="detail-card">
          <div class="section-head">
            <span class="section-icon">📝</span>
            <div>
              <h3>Detail Kegiatan</h3>
              <p>Tujuan dan deskripsi pelaksanaan kegiatan</p>
            </div>
          </div>
          <div class="detail-grid">
            <div class="detail-item full">
              <span class="detail-label">🎯 Tujuan Kegiatan</span>
              <p class="detail-value pre-line">{{ l.tujuan }}</p>
            </div>
            <div class="detail-item full">
              <span class="detail-label">📄 Deskripsi Kegiatan</span>
              <p class="detail-value pre-line">{{ l.deskripsi }}</p>
            </div>
          </div>
        </div>

        <!-- ===== HASIL & KENDALA ===== -->
        <div class="detail-card">
          <div class="section-head">
            <span class="section-icon">🏆</span>
            <div>
              <h3>Hasil & Tindak Lanjut</h3>
              <p>Capaian dan kendala yang dihadapi</p>
            </div>
          </div>
          <div class="detail-grid">
            <div class="detail-item full">
              <span class="detail-label">🏅 Hasil / Capaian</span>
              <p class="detail-value pre-line">{{ l.capaian }}</p>
            </div>
            <div class="detail-item full">
              <span class="detail-label">🛠️ Kendala & Tindak Lanjut</span>
              <p class="detail-value pre-line" [class.empty]="!l.kendalaTindakLanjut">
                {{ l.kendalaTindakLanjut || 'Tidak ada kendala yang dilaporkan.' }}
              </p>
            </div>
          </div>
        </div>

        <!-- ===== PANEL BUKTI ===== -->
        <app-bukti-panel
          [laporanId]="l.id"
          [status]="l.status"
          (countChange)="buktiCount.set($event)" />

        <!-- ===== PANEL KIRIM ===== -->
        @if (canSubmit()) {
          <section class="panel submit-panel">
            <div class="submit-header">
              <span class="submit-icon">📤</span>
              <div>
                <h3>Kirim ke Pimpinan</h3>
                <p>Setelah dikirim, laporan dan bukti tidak bisa diubah sampai pimpinan memberi keputusan.</p>
              </div>
            </div>
            
            @if (!hasBukti()) {
              <div class="warning-inline">
                <span>⚠️</span> Unggah minimal satu bukti sebelum mengirim laporan.
              </div>
            }
            
            <div class="submit-actions">
              <button class="btn btn-primary btn-lg" type="button"
                      [disabled]="submitting() || !hasBukti()" (click)="submit()">
                @if (submitting()) {
                  <span class="spinner-sm"></span>
                  <span>Mengirim...</span>
                } @else {
                  <span>📤</span>
                  <span>Kirim Laporan Sekarang</span>
                }
              </button>
            </div>
          </section>
        }

        <!-- ===== PANEL REVIEW ===== -->
        @if (showReview()) {
          <app-review-panel [laporanId]="l.id" (reviewed)="refresh()" />
        }

        <!-- ===== PANEL RIWAYAT ===== -->
        <app-riwayat-panel [laporanId]="l.id" [refreshKey]="refreshKey()" />
      </div>
    }
  `,
  styles: [`
    :host { display: block; }

    /* ===== BACK LINK ===== */
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #2e82e6;
      text-decoration: none;
      font-size: 14px;
      font-weight: 700;
      padding: 8px 14px;
      border-radius: 8px;
      transition: all 0.2s ease;
      margin-bottom: 20px;
    }
    .back-link:hover { background: #eaf4ff; }

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
    .banner-warn {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #92400e;
      padding: 18px 20px;
      border-radius: 14px;
      margin-bottom: 20px;
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

    /* ===== HERO ===== */
    .hero {
      background: linear-gradient(135deg, #f0f7ff 0%, #eaf4ff 60%, #d6e9ff 100%);
      border-radius: 20px;
      padding: 32px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      margin-bottom: 20px;
      border: 1px solid #d6e9ff;
      position: relative;
      overflow: hidden;
      flex-wrap: wrap;
    }
    .hero::before {
      content: '';
      position: absolute;
      top: -60px; right: -60px;
      width: 200px; height: 200px;
      border-radius: 50%;
      background: rgba(74, 158, 255, 0.08);
      pointer-events: none;
    }
    .hero-content { flex: 1; min-width: 260px; position: relative; z-index: 1; }
    .hero-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
      flex-wrap: wrap;
    }
    .periode-chip {
      display: inline-block;
      background: #ffffff;
      color: #1f66bd;
      padding: 5px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      font-family: 'Courier New', monospace;
      border: 1px solid #d6e9ff;
    }
    .hero-title {
      margin: 0 0 16px;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0d3363;
      line-height: 1.3;
    }
    .hero-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      font-size: 13px;
      color: #1f66bd;
      font-weight: 600;
    }
    .info-item { display: inline-flex; align-items: center; gap: 5px; }
    .info-icon { font-size: 13px; opacity: 0.8; }
    .info-divider { color: #8fc2ff; }

    /* ===== STACK ===== */
    .stack {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* ===== STATS ===== */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    @media (max-width: 720px) { .stats-grid { grid-template-columns: 1fr; } }
    .stat-card {
      background: #ffffff;
      border-radius: 14px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 14px;
      border: 1px solid #f1f5f9;
      box-shadow: 0 2px 10px rgba(74, 158, 255, 0.06);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 22px rgba(74, 158, 255, 0.12);
    }
    .stat-icon {
      width: 48px; height: 48px;
      border-radius: 12px;
      display: grid; place-items: center;
      font-size: 20px;
      flex-shrink: 0;
    }
    .target-icon { background: #eaf4ff; }
    .real-icon { background: #dcfce7; }
    .percent-icon { background: #fef3c7; }
    .stat-body { display: flex; flex-direction: column; gap: 2px; }
    .stat-label { font-size: 12px; color: #64748b; font-weight: 600; }
    .stat-value {
      margin: 0;
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.4px;
    }

    /* ===== DETAIL CARD ===== */
    .detail-card {
      background: #ffffff;
      border-radius: 18px;
      border: 1px solid #f1f5f9;
      box-shadow: 0 4px 20px rgba(74, 158, 255, 0.06);
      padding: 28px 32px;
    }
    @media (max-width: 640px) {
      .detail-card { padding: 20px; }
      .hero { padding: 24px 20px; }
      .hero-title { font-size: 20px; }
    }
    .section-head {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      margin-bottom: 22px;
      padding-bottom: 18px;
      border-bottom: 1px solid #f1f5f9;
    }
    .section-icon {
      width: 42px; height: 42px;
      border-radius: 12px;
      background: linear-gradient(135deg, #eaf4ff 0%, #d6e9ff 100%);
      display: grid; place-items: center;
      font-size: 20px;
      flex-shrink: 0;
      border: 1px solid #d6e9ff;
    }
    .section-head h3 {
      margin: 0 0 4px;
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.2px;
    }
    .section-head p { margin: 0; font-size: 13px; color: #64748b; }
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px 32px;
    }
    .detail-grid .full { grid-column: 1 / -1; }
    @media (max-width: 640px) { .detail-grid { grid-template-columns: 1fr; gap: 16px; } }
    .detail-item { display: flex; flex-direction: column; gap: 8px; }
    .detail-label {
      font-size: 12px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .detail-value {
      margin: 0;
      font-size: 14px;
      color: #0f172a;
      font-weight: 500;
      line-height: 1.7;
    }
    .detail-value.pre-line { white-space: pre-line; }
    .detail-value.empty { color: #94a3b8; font-style: italic; }

    /* ===== SUBMIT PANEL ===== */
    .submit-panel {
      background: #ffffff;
      border-radius: 18px;
      border: 1px solid #f1f5f9;
      box-shadow: 0 4px 20px rgba(74, 158, 255, 0.06);
      padding: 24px 28px;
    }
    .submit-header {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      margin-bottom: 16px;
    }
    .submit-icon {
      width: 42px; height: 42px;
      border-radius: 12px;
      background: linear-gradient(135deg, #eaf4ff 0%, #d6e9ff 100%);
      display: grid; place-items: center;
      font-size: 20px;
      flex-shrink: 0;
      border: 1px solid #d6e9ff;
    }
    .submit-header h3 {
      margin: 0 0 4px;
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }
    .submit-header p {
      margin: 0;
      font-size: 13px;
      color: #64748b;
      line-height: 1.5;
    }
    .warning-inline {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .submit-actions {
      display: flex;
      justify-content: flex-end;
    }
    .btn-lg {
      padding: 14px 24px;
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
      .submit-actions .btn-lg { width: 100%; justify-content: center; }
    }
  `],
})
export class LaporanDetailComponent implements OnInit {
  private readonly api = inject(LaporanService);
  private readonly workflow = inject(WorkflowService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly id = Number(this.route.snapshot.paramMap.get('id'));

  readonly laporan = signal<LaporanResponse | null>(null);
  readonly error = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly buktiCount = signal(0);
  readonly refreshKey = signal(0);

  readonly isKepala = computed(() => this.auth.session()?.role === 'KepalaBidang');
  readonly isPimpinan = computed(() => this.auth.session()?.role === 'Pimpinan');
  readonly hasBukti = computed(() => this.buktiCount() > 0);

  readonly showEdit = computed(() => {
    const l = this.laporan();
    return !!l && this.isKepala() && isEditable(l.status);
  });
  readonly canSubmit = computed(() => {
    const l = this.laporan();
    return !!l && this.isKepala() && isEditable(l.status);
  });
  readonly showReview = computed(() => this.isPimpinan() && this.laporan()?.status === 'Submitted');

  ngOnInit() {
    this.load();
  }

  refresh() {
    this.load();
    this.refreshKey.update(k => k + 1);
  }

  submit() {
    if (!confirm('Kirim laporan ke pimpinan? Setelah dikirim, laporan tidak bisa diubah.')) return;

    this.actionError.set(null);
    this.submitting.set(true);
    this.workflow.submit(this.id).subscribe({
      next: () => {
        this.submitting.set(false);
        this.refresh();
      },
      error: (e: HttpErrorResponse) => {
        this.submitting.set(false);
        this.actionError.set(e.error?.message ?? 'Gagal mengirim laporan.');
        if (e.status === 409) this.refresh();
      },
    });
  }

  private load() {
    this.api.get(this.id).subscribe({
      next: l => this.laporan.set(l),
      error: () => this.error.set('Laporan tidak ditemukan.'),
    });
  }
}