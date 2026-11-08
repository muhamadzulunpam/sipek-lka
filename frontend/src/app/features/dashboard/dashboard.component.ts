import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../core/config';
import { Bidang } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  template: `
    <!-- PAGE HEADER -->
    <div class="page-header">
      <div>
        <h2>Dashboard</h2>
        <p>Daftar bidang LKA dari API. Data ini hanya muncul kalau token terkirim dengan benar.</p>
      </div>
      <div class="header-badge">
        <span class="dot"></span>
        <span>Live Data</span>
      </div>
    </div>

    <!-- ERROR STATE -->
    @if (error()) {
      <div class="alert-error">
        <span class="alert-icon">⚠️</span>
        <span>{{ error() }}</span>
      </div>
    }

    <!-- LIST BIDANG -->
    <div class="card">
      <div class="card-header">
        <h3>Daftar Bidang</h3>
        <span class="count-pill">{{ bidangs().length }} bidang</span>
      </div>

      @if (bidangs().length === 0 && !error()) {
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <p>Memuat data bidang…</p>
        </div>
      } @else {
        <ul class="bidang-list">
          @for (b of bidangs(); track b.id) {
            <li class="bidang-item">
              <div class="bidang-avatar">
                {{ b.nama.charAt(0).toUpperCase() }}
              </div>
              <div class="bidang-info">
                <strong>{{ b.nama }}</strong>
                <span class="bidang-id">ID: {{ b.id }}</span>
              </div>
              <span class="bidang-arrow">→</span>
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    /* ===== PAGE HEADER ===== */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      gap: 16px;
      flex-wrap: wrap;
    }
    .page-header h2 {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0 0 6px;
      color: #0f172a;
    }
    .page-header p {
      margin: 0;
      font-size: 14px;
      color: #64748b;
      max-width: 560px;
      line-height: 1.5;
    }
    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #eaf4ff;
      color: #1f66bd;
      padding: 8px 16px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 700;
      border: 1px solid #d6e9ff;
    }
    .header-badge .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.18);
      animation: pulse 1.8s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    /* ===== ALERT ERROR ===== */
    .alert-error {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      padding: 14px 18px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .alert-icon { font-size: 18px; }

    /* ===== CARD ===== */
    .card {
      background: #ffffff;
      border-radius: 18px;
      border: 1px solid #f1f5f9;
      box-shadow: 0 4px 16px rgba(74, 158, 255, 0.08);
      overflow: hidden;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #f1f5f9;
      background: linear-gradient(135deg, #f8fbff 0%, #ffffff 100%);
    }
    .card-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.2px;
    }
    .count-pill {
      background: #eaf4ff;
      color: #1f66bd;
      font-size: 12px;
      font-weight: 700;
      padding: 5px 14px;
      border-radius: 999px;
      border: 1px solid #d6e9ff;
    }

    /* ===== LIST BIDANG ===== */
    .bidang-list {
      list-style: none;
      margin: 0;
      padding: 8px;
    }
    .bidang-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      border-radius: 12px;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .bidang-item:hover {
      background: linear-gradient(135deg, #eaf4ff 0%, #f8fbff 100%);
      transform: translateX(4px);
    }
    .bidang-item:hover .bidang-arrow {
      color: #4a9eff;
      transform: translateX(4px);
    }
    .bidang-avatar {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #6baeff 0%, #4a9eff 100%);
      color: #ffffff;
      font-weight: 800;
      font-size: 16px;
      display: grid;
      place-items: center;
      flex-shrink: 0;
      box-shadow: 0 4px 10px rgba(74, 158, 255, 0.25);
    }
    .bidang-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      min-width: 0;
    }
    .bidang-info strong {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }
    .bidang-id {
      font-size: 12px;
      color: #94a3b8;
      font-weight: 500;
    }
    .bidang-arrow {
      color: #cbd5e1;
      font-size: 18px;
      font-weight: 700;
      transition: all 0.2s ease;
    }

    /* ===== EMPTY STATE ===== */
    .empty-state {
      padding: 48px 24px;
      text-align: center;
      color: #94a3b8;
    }
    .empty-state .empty-icon {
      font-size: 40px;
      margin-bottom: 12px;
    }
    .empty-state p {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
    }
  `],
})
export class DashboardComponent implements OnInit {
  private readonly http = inject(HttpClient);

  readonly bidangs = signal<Bidang[]>([]);
  readonly error = signal<string | null>(null);

  ngOnInit() {
    this.http.get<Bidang[]>(`${API_URL}/bidang`).subscribe({
      next: data => this.bidangs.set(data),
      error: () => this.error.set('Gagal memuat data bidang.'),
    });
  }
}