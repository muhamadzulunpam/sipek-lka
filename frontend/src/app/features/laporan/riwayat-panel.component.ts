import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { WorkflowService } from '../../core/workflow.service';
import { ReviewResponse, RiwayatResponse } from '../../core/models';
import { STATUS_LABEL } from '../../core/laporan-rules';
import { StatusBadgeComponent } from '../../shared/status-badge.component';
import { UtcPipe } from '../../shared/utc.pipe';

@Component({
  selector: 'app-riwayat-panel',
  imports: [DatePipe, StatusBadgeComponent, UtcPipe],
  template: `
    <div class="stack">
      @if (error()) {
        <div class="banner-err">
          <span>⚠️</span> {{ error() }}
        </div>
      }

      <!-- ===== SECTION: CATATAN REVIEW ===== -->
      <section class="panel">
        <div class="panel-header">
          <span class="header-icon">💬</span>
          <h3>Catatan Review Pimpinan</h3>
        </div>

        @if (reviews().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">📭</div>
            <p>Belum ada review dari pimpinan.</p>
          </div>
        } @else {
          <div class="review-list">
            @for (r of reviews(); track r.id) {
              <div class="review-item">
                <div class="review-avatar">
                  {{ r.reviewer.charAt(0).toUpperCase() }}
                </div>
                <div class="review-body">
                  <div class="review-head">
                    <div class="review-meta">
                      <strong class="reviewer-name">{{ r.reviewer }}</strong>
                      <span class="review-time">
                        {{ r.direviewPada | utc | date: 'dd MMM yyyy HH:mm' }}
                      </span>
                    </div>
                    <app-status-badge [status]="r.keputusan" />
                  </div>
                  @if (r.catatan) {
                    <p class="note">{{ r.catatan }}</p>
                  } @else {
                    <p class="note empty-note">Tidak ada catatan tambahan.</p>
                  }
                </div>
              </div>
            }
          </div>
        }
      </section>

      <!-- ===== SECTION: TIMELINE STATUS ===== -->
      <section class="panel">
        <div class="panel-header">
          <span class="header-icon">📜</span>
          <h3>Riwayat Status</h3>
        </div>

        @if (riwayat().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">📭</div>
            <p>Belum ada perubahan status.</p>
          </div>
        } @else {
          <ol class="timeline">
            @for (h of riwayat(); track h.id) {
              <li class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <div class="timeline-status">
                    <span class="status-old">{{ label[h.statusLama] }}</span>
                    <span class="status-arrow">→</span>
                    <span class="status-new">{{ label[h.statusBaru] }}</span>
                  </div>
                  <div class="timeline-meta">
                    <span class="meta-item">👤 {{ h.diubahOleh }}</span>
                    <span class="meta-dot">·</span>
                    <span class="meta-item">🕒 {{ h.diubahPada | utc | date: 'dd MMM yyyy HH:mm' }}</span>
                  </div>
                  @if (h.keterangan) {
                    <p class="timeline-note">{{ h.keterangan }}</p>
                  }
                </div>
              </li>
            }
          </ol>
        }
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .stack {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* ===== PANEL ===== */
    .panel {
      background: #ffffff;
      border-radius: 18px;
      border: 1px solid #f1f5f9;
      box-shadow: 0 4px 20px rgba(74, 158, 255, 0.06);
      padding: 24px 28px;
    }
    @media (max-width: 640px) {
      .panel { padding: 20px; }
    }

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
      flex-shrink: 0;
    }
    .panel-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.2px;
    }

    /* ===== BANNER ===== */
    .banner-err {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
    }

    /* ===== EMPTY STATE ===== */
    .empty-state {
      padding: 32px 20px;
      text-align: center;
      background: #f8fafc;
      border: 1.5px dashed #e2e8f0;
      border-radius: 12px;
    }
    .empty-icon {
      font-size: 36px;
      margin-bottom: 10px;
      opacity: 0.7;
    }
    .empty-state p {
      margin: 0;
      font-size: 13px;
      color: #64748b;
      font-weight: 600;
    }

    /* ===== REVIEW LIST ===== */
    .review-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .review-item {
      display: flex;
      gap: 14px;
      padding: 16px;
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: 14px;
      transition: all 0.2s ease;
    }
    .review-item:hover {
      background: #f0f7ff;
      border-color: #d6e9ff;
    }
    .review-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6baeff 0%, #4a9eff 100%);
      color: #ffffff;
      font-weight: 800;
      font-size: 14px;
      display: grid;
      place-items: center;
      flex-shrink: 0;
      box-shadow: 0 4px 10px rgba(74, 158, 255, 0.25);
    }
    .review-body {
      flex: 1;
      min-width: 0;
    }
    .review-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }
    .review-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .reviewer-name {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
    }
    .review-time {
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
    }
    .note {
      margin: 0;
      font-size: 13px;
      color: #1e293b;
      line-height: 1.6;
      padding: 12px 14px;
      background: #ffffff;
      border-radius: 10px;
      border-left: 3px solid #4a9eff;
      white-space: pre-line;
      word-break: break-word;
    }
    .note.empty-note {
      color: #94a3b8;
      font-style: italic;
      border-left-color: #cbd5e1;
    }

    /* ===== TIMELINE ===== */
    .timeline {
      list-style: none;
      margin: 0;
      padding: 0;
      position: relative;
    }
    .timeline-item {
      position: relative;
      padding: 0 0 24px 32px;
    }
    .timeline-item:last-child {
      padding-bottom: 0;
    }
    /* Garis vertikal timeline */
    .timeline-item::before {
      content: '';
      position: absolute;
      left: 11px;
      top: 24px;
      bottom: 0;
      width: 2px;
      background: #e2e8f0;
    }
    .timeline-item:last-child::before {
      display: none;
    }
    .timeline-dot {
      position: absolute;
      left: 0;
      top: 2px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #ffffff;
      border: 3px solid #4a9eff;
      box-shadow: 0 0 0 4px #eaf4ff;
      z-index: 1;
    }
    .timeline-content {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .timeline-status {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .status-old {
      font-size: 13px;
      font-weight: 600;
      color: #94a3b8;
      text-decoration: line-through;
    }
    .status-arrow {
      color: #4a9eff;
      font-weight: 800;
      font-size: 14px;
    }
    .status-new {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
    }
    .timeline-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }
    .meta-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .meta-dot {
      color: #cbd5e1;
    }
    .timeline-note {
      margin: 4px 0 0;
      font-size: 13px;
      color: #475569;
      line-height: 1.6;
      padding: 10px 14px;
      background: #f8fafc;
      border-radius: 8px;
      border-left: 3px solid #8fc2ff;
      white-space: pre-line;
      word-break: break-word;
    }
  `],
})
export class RiwayatPanelComponent {
  private readonly api = inject(WorkflowService);

  readonly laporanId = input.required<number>();
  readonly refreshKey = input(0); // dinaikkan induk setiap status berubah

  readonly reviews = signal<ReviewResponse[]>([]);
  readonly riwayat = signal<RiwayatResponse[]>([]);
  readonly error = signal<string | null>(null);
  readonly label = STATUS_LABEL;

  constructor() {
    // Jalan saat pertama kali, dan setiap laporanId atau refreshKey berubah
    effect(() => {
      const id = this.laporanId();
      this.refreshKey();
      untracked(() => this.load(id));
    });
  }

  private load(id: number) {
    this.error.set(null);
    this.api.reviews(id).subscribe({
      next: r => this.reviews.set(r),
      error: () => this.error.set('Gagal memuat riwayat laporan.'),
    });
    this.api.riwayat(id).subscribe({
      next: r => this.riwayat.set(r),
      error: () => this.error.set('Gagal memuat riwayat laporan.'),
    });
  }
}