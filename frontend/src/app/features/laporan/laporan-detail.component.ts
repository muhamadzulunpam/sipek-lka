import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { LaporanService } from '../../core/laporan.service';
import { LaporanResponse } from '../../core/models';
import { isEditable } from '../../core/laporan-rules';
import { StatusBadgeComponent } from '../../shared/status-badge.component';

@Component({
  selector: 'app-laporan-detail',
  imports: [RouterLink, DatePipe, DecimalPipe, StatusBadgeComponent],
  template: `
    <!-- BACK LINK -->
    <a class="back-link" routerLink="/laporan">
      <span class="back-icon">←</span> Kembali ke daftar
    </a>

    @if (error()) {
      <div class="banner-err">
        <span>⚠️</span> {{ error() }}
      </div>
    }

    @if (laporan(); as l) {
      <!-- HERO HEADER -->
      <div class="hero">
        <div class="hero-content">
          <div class="hero-meta">
            <span class="periode-chip">{{ l.periode }}</span>
            <app-status-badge [status]="l.status" />
          </div>
          <h1 class="hero-title">{{ l.namaKegiatan }}</h1>
          <div class="hero-info">
            <span class="info-item">
              <span class="info-icon">🏛️</span> {{ l.namaBidang }}
            </span>
            <span class="info-divider">•</span>
            <span class="info-item">
              <span class="info-icon">👤</span> {{ l.dibuatOleh }}
            </span>
            <span class="info-divider">•</span>
            <span class="info-item">
              <span class="info-icon">📅</span> {{ l.tanggalPelaksanaan | date: 'dd MMM yyyy' }}
            </span>
          </div>
        </div>
        @if (showEdit()) {
          <a class="btn btn-primary" [routerLink]="['/laporan', l.id, 'ubah']">
            ✏️ Ubah Laporan
          </a>
        }
      </div>

      <!-- STAT CARDS: TARGET vs REALISASI -->
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

      <!-- SECTION: DETAIL KEGIATAN -->
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

      <!-- SECTION: HASIL & KENDALA -->
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

      <!-- INFO NOTICE -->
      <div class="info-notice">
        <span class="notice-icon">💡</span>
        <span>Bukti pendukung, tombol kirim, dan review pimpinan ditambahkan di tahap berikutnya.</span>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }

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
    .back-link:hover {
      background: #eaf4ff;
    }
    .back-icon {
      font-size: 16px;
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
      top: -60px;
      right: -60px;
      width: 200px;
      height: 200px;
      border-radius: 50%;
      background: rgba(74, 158, 255, 0.08);
      pointer-events: none;
    }
    .hero-content {
      flex: 1;
      min-width: 260px;
      position: relative;
      z-index: 1;
    }
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
    .info-item {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .info-icon {
      font-size: 13px;
      opacity: 0.8;
    }
    .info-divider {
      color: #8fc2ff;
    }

    /* ===== STATS ===== */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 20px;
    }
    @media (max-width: 720px) {
      .stats-grid { grid-template-columns: 1fr; }
    }
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
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: grid;
      place-items: center;
      font-size: 20px;
      flex-shrink: 0;
    }
    .target-icon { background: #eaf4ff; }
    .real-icon { background: #dcfce7; }
    .percent-icon { background: #fef3c7; }
    .stat-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .stat-label {
      font-size: 12px;
      color: #64748b;
      font-weight: 600;
    }
    .stat-value {
      margin: 0;
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.4px;
    }

    /* ===== DETAIL CARDS ===== */
    .detail-card {
      background: #ffffff;
      border-radius: 18px;
      border: 1px solid #f1f5f9;
      box-shadow: 0 4px 20px rgba(74, 158, 255, 0.06);
      padding: 28px 32px;
      margin-bottom: 20px;
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
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: linear-gradient(135deg, #eaf4ff 0%, #d6e9ff 100%);
      display: grid;
      place-items: center;
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
    .section-head p {
      margin: 0;
      font-size: 13px;
      color: #64748b;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px 32px;
    }
    .detail-grid .full { grid-column: 1 / -1; }
    @media (max-width: 640px) {
      .detail-grid { grid-template-columns: 1fr; gap: 16px; }
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
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
    .detail-value.pre-line {
      white-space: pre-line;
    }
    .detail-value.empty {
      color: #94a3b8;
      font-style: italic;
    }

    /* ===== NOTICE ===== */
    .info-notice {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #f0f7ff;
      border: 1px dashed #8fc2ff;
      border-radius: 12px;
      padding: 16px 20px;
      color: #1f66bd;
      font-size: 13px;
      font-weight: 600;
    }
    .notice-icon {
      font-size: 18px;
    }

    /* ===== BANNER ERROR ===== */
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
  `],
})
export class LaporanDetailComponent implements OnInit {
  private readonly api = inject(LaporanService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly laporan = signal<LaporanResponse | null>(null);
  readonly error = signal<string | null>(null);

  readonly showEdit = computed(() => {
    const l = this.laporan();
    return !!l && this.auth.session()?.role === 'KepalaBidang' && isEditable(l.status);
  });

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.get(id).subscribe({
      next: l => this.laporan.set(l),
      error: () => this.error.set('Laporan tidak ditemukan.'),
    });
  }
}