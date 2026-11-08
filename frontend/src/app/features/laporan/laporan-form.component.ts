import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { LaporanService } from '../../core/laporan.service';
import { LaporanRequest } from '../../core/models';
import { PERIODE_PATTERN, isEditable } from '../../core/laporan-rules';

@Component({
  selector: 'app-laporan-form',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <!-- PAGE HEADER -->
    <div class="page-head">
      <div>
        <h2>{{ isEdit ? 'Ubah Laporan' : 'Buat Laporan Baru' }}</h2>
        <p class="subtitle">
          {{ isEdit ? 'Perbarui data laporan kinerja yang sudah ada' : 'Isi formulir di bawah untuk membuat laporan kinerja baru' }}
        </p>
      </div>
      <span class="spacer"></span>
      <a class="btn" routerLink="/laporan">← Kembali</a>
    </div>

    @if (error()) {
      <div class="banner-err">
        <span>⚠️</span> {{ error() }}
      </div>
    }
    @for (m of serverMessages(); track m) {
      <p class="err">⚠️ {{ m }}</p>
    }

    @if (loading()) {
      <div class="panel loading-panel">
        <div class="spinner"></div>
        <span>Memuat data laporan...</span>
      </div>
    } @else if (!loadFailed()) {
      <form class="panel form-panel" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        
        <!-- SECTION 1: INFORMASI UMUM -->
        <div class="form-section">
          <div class="section-head">
            <span class="section-icon">📋</span>
            <div>
              <h3>Informasi Umum</h3>
              <p>Data dasar kegiatan yang dilaporkan</p>
            </div>
          </div>

          <div class="form-grid">
            <div class="field full">
              <label for="namaKegiatan">Nama Kegiatan <span class="required">*</span></label>
              <input 
                id="namaKegiatan" 
                type="text" 
                formControlName="namaKegiatan" 
                placeholder="Contoh: Sosialisasi Program Kerja Bidang Akademik"
              />
              @if (msg('namaKegiatan'); as m) { <small class="err">⚠️ {{ m }}</small> }
            </div>

            <div class="field">
              <label for="tanggalPelaksanaan">Tanggal Pelaksanaan <span class="required">*</span></label>
              <input id="tanggalPelaksanaan" type="date" formControlName="tanggalPelaksanaan" />
              @if (msg('tanggalPelaksanaan'); as m) { <small class="err">⚠️ {{ m }}</small> }
            </div>

            <div class="field">
              <label for="periode">Periode Pelaporan <span class="required">*</span></label>
              <input 
                id="periode" 
                type="text" 
                formControlName="periode" 
                placeholder="Contoh: 2026-11" 
                maxlength="7" 
              />
              <small class="hint">Format: YYYY-MM</small>
              @if (msg('periode'); as m) { <small class="err">⚠️ {{ m }}</small> }
            </div>
          </div>
        </div>

        <!-- SECTION 2: DETAIL KEGIATAN -->
        <div class="form-section">
          <div class="section-head">
            <span class="section-icon">📝</span>
            <div>
              <h3>Detail Kegiatan</h3>
              <p>Jelaskan tujuan dan deskripsi lengkap kegiatan</p>
            </div>
          </div>

          <div class="form-grid">
            <div class="field full">
              <label for="tujuan">Tujuan Kegiatan <span class="required">*</span></label>
              <textarea 
                id="tujuan" 
                rows="2" 
                formControlName="tujuan"
                placeholder="Apa tujuan dari kegiatan ini?"
              ></textarea>
              @if (msg('tujuan'); as m) { <small class="err">⚠️ {{ m }}</small> }
            </div>

            <div class="field full">
              <label for="deskripsi">Deskripsi Kegiatan <span class="required">*</span></label>
              <textarea 
                id="deskripsi" 
                rows="4" 
                formControlName="deskripsi"
                placeholder="Jelaskan secara rinci pelaksanaan kegiatan, peserta, waktu, dan hasil..."
              ></textarea>
              @if (msg('deskripsi'); as m) { <small class="err">⚠️ {{ m }}</small> }
            </div>
          </div>
        </div>

        <!-- SECTION 3: CAPAIAN KINERJA -->
        <div class="form-section">
          <div class="section-head">
            <span class="section-icon">📊</span>
            <div>
              <h3>Capaian Kinerja</h3>
              <p>Target, realisasi, dan hasil yang dicapai</p>
            </div>
          </div>

          <div class="form-grid">
            <div class="field">
              <label for="target">Target Kinerja <span class="required">*</span></label>
              <input 
                id="target" 
                type="number" 
                min="0" 
                step="any" 
                formControlName="target"
                placeholder="0"
              />
              @if (msg('target'); as m) { <small class="err">⚠️ {{ m }}</small> }
            </div>

            <div class="field">
              <label for="realisasi">Realisasi Kinerja <span class="required">*</span></label>
              <input 
                id="realisasi" 
                type="number" 
                min="0" 
                step="any" 
                formControlName="realisasi"
                placeholder="0"
              />
              @if (msg('realisasi'); as m) { <small class="err">⚠️ {{ m }}</small> }
            </div>

            <div class="field full">
              <label for="capaian">Hasil / Capaian <span class="required">*</span></label>
              <textarea 
                id="capaian" 
                rows="3" 
                formControlName="capaian"
                placeholder="Uraikan hasil atau capaian dari kegiatan ini..."
              ></textarea>
              @if (msg('capaian'); as m) { <small class="err">⚠️ {{ m }}</small> }
            </div>
          </div>
        </div>

        <!-- SECTION 4: KENDALA -->
        <div class="form-section">
          <div class="section-head">
            <span class="section-icon">🛠️</span>
            <div>
              <h3>Kendala & Tindak Lanjut</h3>
              <p>Opsional — catat kendala yang dihadapi beserta solusinya</p>
            </div>
          </div>

          <div class="form-grid">
            <div class="field full">
              <label for="kendala">
                Kendala dan Tindak Lanjut 
                <span class="optional">(Opsional)</span>
              </label>
              <textarea 
                id="kendala" 
                rows="3" 
                formControlName="kendalaTindakLanjut"
                placeholder="Kendala apa yang dihadapi? Bagaimana tindak lanjutnya?"
              ></textarea>
              @if (msg('kendalaTindakLanjut'); as m) { <small class="err">⚠️ {{ m }}</small> }
            </div>
          </div>
        </div>

        <!-- FORM ACTIONS -->
        <div class="form-actions">
          <a class="btn" routerLink="/laporan">Batal</a>
          <button class="btn btn-primary" type="submit" [disabled]="saving()">
            @if (saving()) {
              <span class="spinner-sm"></span>
              <span>Menyimpan...</span>
            } @else {
              <span>💾</span>
              <span>{{ isEdit ? 'Simpan Perubahan' : 'Simpan Laporan' }}</span>
            }
          </button>
        </div>
      </form>
    }
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

    /* ===== PANEL ===== */
    .form-panel {
      background: #ffffff;
      border-radius: 18px;
      border: 1px solid #f1f5f9;
      box-shadow: 0 4px 20px rgba(74, 158, 255, 0.08);
      padding: 0;
      max-width: 900px;
      overflow: hidden;
    }

    /* ===== SECTIONS ===== */
    .form-section {
      padding: 28px 32px;
      border-bottom: 1px solid #f1f5f9;
    }
    .form-section:last-of-type {
      border-bottom: none;
    }

    .section-head {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      margin-bottom: 20px;
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

    /* ===== FORM GRID ===== */
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
    }
    .form-grid .full {
      grid-column: 1 / -1;
    }
    @media (max-width: 640px) {
      .form-grid { grid-template-columns: 1fr; }
      .form-section { padding: 20px; }
    }

    /* ===== FIELDS ===== */
    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .field label {
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .required {
      color: #ef4444;
      font-weight: 800;
    }
    .optional {
      color: #94a3b8;
      font-weight: 500;
      font-size: 12px;
    }
    
    .field input, .field textarea {
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
      font-family: inherit;
    }
    .field input::placeholder, .field textarea::placeholder {
      color: #94a3b8;
    }
    .field input:focus, .field textarea:focus {
      border-color: #4a9eff;
      background: #ffffff;
      box-shadow: 0 0 0 4px rgba(74, 158, 255, 0.14);
    }
    .field textarea {
      resize: vertical;
      min-height: 60px;
      line-height: 1.5;
    }
    
    .hint {
      font-size: 11px;
      color: #94a3b8;
      font-weight: 500;
    }
    .err {
      color: #b91c1c;
      font-size: 12px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
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

    /* ===== LOADING ===== */
    .loading-panel {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 60px 20px;
      color: #64748b;
      font-weight: 600;
      font-size: 14px;
      max-width: 900px;
    }
    .spinner {
      width: 20px;
      height: 20px;
      border: 2.5px solid #d6e9ff;
      border-top-color: #4a9eff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .spinner-sm {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* ===== FORM ACTIONS ===== */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px 32px;
      background: #fafbfd;
      border-top: 1px solid #f1f5f9;
    }
    @media (max-width: 640px) {
      .form-actions {
        padding: 16px 20px;
        flex-direction: column-reverse;
      }
      .form-actions .btn {
        width: 100%;
        justify-content: center;
      }
    }
  `],
})
export class LaporanFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(LaporanService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Ada parameter :id di URL berarti mode ubah
  private readonly rawId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = this.rawId !== null;
  private readonly id = Number(this.rawId);

  readonly loading = signal(false);
  readonly loadFailed = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly serverMessages = signal<string[]>([]);

  readonly form = this.fb.nonNullable.group({
    namaKegiatan: ['', [Validators.required, Validators.maxLength(200)]],
    tanggalPelaksanaan: ['', Validators.required],
    periode: ['', [Validators.required, Validators.pattern(PERIODE_PATTERN)]],
    tujuan: ['', [Validators.required, Validators.maxLength(1000)]],
    deskripsi: ['', [Validators.required, Validators.maxLength(4000)]],
    target: [0, [Validators.required, Validators.min(0), Validators.max(1_000_000_000)]],
    realisasi: [0, [Validators.required, Validators.min(0), Validators.max(1_000_000_000)]],
    capaian: ['', [Validators.required, Validators.maxLength(2000)]],
    kendalaTindakLanjut: ['', Validators.maxLength(2000)],
  });

  ngOnInit() {
    if (!this.isEdit) return;

    this.loading.set(true);
    this.api.get(this.id).subscribe({
      next: l => {
        // Laporan yang sudah dikirim atau final tidak boleh diubah
        if (!isEditable(l.status)) {
          this.router.navigate(['/laporan', l.id]);
          return;
        }
        this.form.patchValue({
          ...l,
          tanggalPelaksanaan: l.tanggalPelaksanaan.slice(0, 10), // <input type="date"> butuh YYYY-MM-DD
          kendalaTindakLanjut: l.kendalaTindakLanjut ?? '',
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Laporan tidak ditemukan.');
        this.loadFailed.set(true);
        this.loading.set(false);
      },
    });
  }

  submit() {
    this.error.set(null);
    this.serverMessages.set([]);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const body: LaporanRequest = { ...v, kendalaTindakLanjut: v.kendalaTindakLanjut.trim() || null };

    this.saving.set(true);
    const request$: Observable<unknown> = this.isEdit
      ? this.api.update(this.id, body)
      : this.api.create(body);

    request$.subscribe({
      next: () => this.router.navigateByUrl('/laporan'),
      error: (err: HttpErrorResponse) => this.handleError(err),
    });
  }

  // Pesan di bawah field, hanya setelah field disentuh
  msg(name: string): string | null {
    const c = this.form.get(name);
    if (!c || !c.touched || !c.errors) return null;
    if (c.errors['server']) return c.errors['server'];
    if (c.errors['required']) return 'Wajib diisi.';
    if (c.errors['maxlength']) return `Maksimal ${c.errors['maxlength'].requiredLength} karakter.`;
    if (c.errors['pattern']) return 'Format harus YYYY-MM, contoh 2026-11.';
    if (c.errors['min']) return 'Tidak boleh negatif.';
    if (c.errors['max']) return 'Angka terlalu besar.';
    return 'Isian tidak valid.';
  }

  private handleError(err: HttpErrorResponse) {
    this.saving.set(false);

    // 400 dari [ApiController]: { errors: { NamaKegiatan: ["..."], ... } }
    if (err.status === 400 && err.error?.errors) {
      const unmatched: string[] = [];
      for (const [field, messages] of Object.entries(err.error.errors as Record<string, string[]>)) {
        const key = field.charAt(0).toLowerCase() + field.slice(1); // NamaKegiatan -> namaKegiatan
        const control = this.form.get(key);
        if (control) {
          control.setErrors({ server: messages[0] });
          control.markAsTouched();
        } else {
          unmatched.push(...messages);
        }
      }
      this.serverMessages.set(unmatched);
      this.error.set('Periksa kembali isian yang ditandai.');
      return;
    }

    this.error.set(err.error?.message ?? 'Gagal menyimpan laporan.');
  }
}