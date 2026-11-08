import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth.service';
import { BuktiService } from '../../core/bukti.service';
import { BuktiResponse, StatusLaporan } from '../../core/models';
import { isEditable } from '../../core/laporan-rules';
import {
  ACCEPT_ATTR, MAX_FILES, formatBytes, uploadErrorMessage, validateFile,
} from '../../core/bukti-rules';
import { saveBlob } from '../../core/file-download';
import { UtcPipe } from '../../shared/utc.pipe';

@Component({
  selector: 'app-bukti-panel',
  imports: [DatePipe, UtcPipe],
  template: `
    <section class="panel">
      <div class="panel-header">
        <h3>
          <span class="header-icon">📎</span> Bukti Pendukung
        </h3>
        <span class="file-count">{{ items().length }} / {{ maxFiles }} file</span>
      </div>

      @if (error()) {
        <div class="banner-err">
          <span>⚠️</span> {{ error() }}
        </div>
      }

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <span>Memuat bukti...</span>
        </div>
      } @else if (items().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">📁</div>
          <p>Belum ada bukti pendukung yang diunggah.</p>
        </div>
      } @else {
        <ul class="item-list">
          @for (b of items(); track b.id) {
            <li class="file-item">
              <div class="file-icon">📄</div>
              <div class="file-info">
                <button type="button" class="btn-link" (click)="download(b)" title="Klik untuk mengunduh">
                  {{ b.namaFile }}
                </button>
                <span class="file-meta">
                  {{ size(b.ukuranByte) }} · {{ b.diunggahPada | utc | date: 'dd MMM yyyy HH:mm' }}
                </span>
              </div>
              @if (canManage()) {
                <button type="button" class="btn btn-sm btn-danger" [disabled]="busy()" (click)="remove(b)">
                  🗑️ Hapus
                </button>
              }
            </li>
          }
        </ul>
      }

      @if (canManage()) {
        <div class="upload-zone">
          <label for="bukti-file" class="upload-label">
            <div class="upload-icon">☁️</div>
            <div class="upload-text">
              <strong>Klik untuk mengunggah bukti</strong>
              <span>atau seret file ke area ini</span>
            </div>
            <input id="bukti-file" type="file" [accept]="accept" [disabled]="busy()" (change)="onPick($event)" />
          </label>
          <small class="hint">
            📌 PDF, JPG, PNG, DOCX, atau XLSX. Maksimal 5 MB per file.
          </small>
          @if (busy()) {
            <div class="upload-progress">
              <div class="spinner-sm"></div>
              <span>Memproses upload...</span>
            </div>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    :host { display: block; }

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

    /* ===== PANEL HEADER ===== */
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f1f5f9;
    }
    .panel-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 8px;
      letter-spacing: -0.2px;
    }
    .header-icon {
      font-size: 18px;
    }
    .file-count {
      font-size: 12px;
      color: #1f66bd;
      background: #eaf4ff;
      padding: 4px 12px;
      border-radius: 999px;
      font-weight: 700;
      border: 1px solid #d6e9ff;
    }

    /* ===== BANNER ERROR ===== */
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
      margin-bottom: 16px;
    }

    /* ===== LOADING ===== */
    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 32px 20px;
      color: #64748b;
      font-weight: 600;
      font-size: 13px;
    }
    .spinner {
      width: 18px;
      height: 18px;
      border: 2.5px solid #d6e9ff;
      border-top-color: #4a9eff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .spinner-sm {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(74, 158, 255, 0.3);
      border-top-color: #4a9eff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* ===== EMPTY STATE ===== */
    .empty-state {
      padding: 32px 20px;
      text-align: center;
      background: #f8fafc;
      border: 1.5px dashed #e2e8f0;
      border-radius: 12px;
      margin-bottom: 16px;
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

    /* ===== FILE LIST ===== */
    .item-list {
      list-style: none;
      margin: 0 0 16px;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .file-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: 12px;
      transition: all 0.2s ease;
      flex-wrap: wrap;
    }
    .file-item:hover {
      background: #eaf4ff;
      border-color: #d6e9ff;
    }
    .file-icon {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: linear-gradient(135deg, #eaf4ff 0%, #d6e9ff 100%);
      display: grid;
      place-items: center;
      font-size: 18px;
      flex-shrink: 0;
      border: 1px solid #d6e9ff;
    }
    .file-info {
      display: flex;
      flex-direction: column;
      gap: 3px;
      flex: 1;
      min-width: 180px;
    }
    .file-info button.btn-link {
      font-size: 14px;
      font-weight: 700;
      color: #1f66bd;
      text-align: left;
      word-break: break-all;
    }
    .file-meta {
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
    }

    /* ===== UPLOAD ZONE ===== */
    .upload-zone {
      margin-top: 16px;
    }
    .upload-label {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 24px 16px;
      background: #f0f7ff;
      border: 2px dashed #8fc2ff;
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
    }
    .upload-label:hover {
      background: #eaf4ff;
      border-color: #4a9eff;
      transform: translateY(-1px);
    }
    .upload-label input[type='file'] {
      display: none;
    }
    .upload-icon {
      font-size: 32px;
    }
    .upload-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .upload-text strong {
      font-size: 14px;
      color: #1f66bd;
      font-weight: 700;
    }
    .upload-text span {
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }
    .hint {
      display: block;
      font-size: 12px;
      color: #94a3b8;
      font-weight: 500;
      margin-top: 10px;
      text-align: center;
    }
    .upload-progress {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 10px;
      color: #1f66bd;
      font-size: 13px;
      font-weight: 600;
    }
  `],
})
export class BuktiPanelComponent implements OnInit {
  private readonly api = inject(BuktiService);
  private readonly auth = inject(AuthService);

  readonly laporanId = input.required<number>();
  readonly status = input.required<StatusLaporan>();
  readonly countChange = output<number>();

  readonly items = signal<BuktiResponse[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  readonly accept = ACCEPT_ATTR;
  readonly maxFiles = MAX_FILES;
  readonly size = formatBytes;

  readonly canManage = computed(
    () => this.auth.session()?.role === 'KepalaBidang' && isEditable(this.status()));

  ngOnInit() {
    this.load();
  }

  onPick(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.error.set(null);
    const problem = validateFile(file, this.items().length);
    if (problem) {
      this.error.set(problem);
      return;
    }

    this.busy.set(true);
    this.api.upload(this.laporanId(), file).subscribe({
      next: () => {
        this.busy.set(false);
        this.load();
      },
      error: (e: HttpErrorResponse) => {
        this.busy.set(false);
        this.error.set(uploadErrorMessage(e));
      },
    });
  }

  download(b: BuktiResponse) {
    this.error.set(null);
    this.api.download(this.laporanId(), b.id).subscribe({
      next: blob => saveBlob(blob, b.namaFile),
      error: () => this.error.set('Gagal mengunduh file.'),
    });
  }

  remove(b: BuktiResponse) {
    if (!confirm(`Hapus bukti "${b.namaFile}"?`)) return;

    this.error.set(null);
    this.busy.set(true);
    this.api.remove(this.laporanId(), b.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.load();
      },
      error: (e: HttpErrorResponse) => {
        this.busy.set(false);
        this.error.set(e.error?.message ?? 'Gagal menghapus bukti.');
      },
    });
  }

  private load() {
    this.api.list(this.laporanId()).subscribe({
      next: items => {
        this.items.set(items);
        this.loading.set(false);
        this.countChange.emit(items.length);
      },
      error: () => {
        this.error.set('Gagal memuat bukti.');
        this.loading.set(false);
      },
    });
  }
}