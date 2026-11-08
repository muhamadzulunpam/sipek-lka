import { Component, computed, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { WorkflowService } from '../../core/workflow.service';
import { Keputusan } from '../../core/models';

@Component({
  selector: 'app-review-panel',
  imports: [ReactiveFormsModule],
  template: `
    <section class="panel">
      <div class="panel-header">
        <span class="header-icon">⚖️</span>
        <h3>Review Laporan</h3>
      </div>

      @if (error()) {
        <div class="banner-err">
          <span>⚠️</span> {{ error() }}
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        
        <!-- KEPUTUSAN -->
        <div class="field">
          <label class="field-label">Pilih Keputusan <span class="required">*</span></label>
          <div class="decision-group">
            <!-- APPROVED -->
            <label class="decision-card" [class.selected-approved]="form.controls.keputusan.value === 'Approved'">
              <input type="radio" formControlName="keputusan" value="Approved" class="hidden-radio" />
              <div class="decision-content">
                <div class="decision-icon">✅</div>
                <div>
                  <strong>Setujui</strong>
                  <span>Laporan disetujui final</span>
                </div>
              </div>
            </label>

            <!-- REVISION -->
            <label class="decision-card" [class.selected-revision]="form.controls.keputusan.value === 'Revision'">
              <input type="radio" formControlName="keputusan" value="Revision" class="hidden-radio" />
              <div class="decision-content">
                <div class="decision-icon">📝</div>
                <div>
                  <strong>Minta Revisi</strong>
                  <span>Dikembalikan ke kepala bidang</span>
                </div>
              </div>
            </label>

            <!-- REJECTED -->
            <label class="decision-card" [class.selected-rejected]="form.controls.keputusan.value === 'Rejected'">
              <input type="radio" formControlName="keputusan" value="Rejected" class="hidden-radio" />
              <div class="decision-content">
                <div class="decision-icon">❌</div>
                <div>
                  <strong>Tolak</strong>
                  <span>Laporan ditolak final</span>
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- CATATAN -->
        <div class="field" style="margin-top: 20px">
          <label for="catatan" class="field-label">
            Catatan Review 
            @if (catatanWajib()) {
              <span class="required">* (Wajib)</span>
            } @else {
              <span class="optional">(Opsional)</span>
            }
          </label>
          <textarea 
            id="catatan" 
            rows="4" 
            maxlength="2000" 
            formControlName="catatan"
            placeholder="Tuliskan catatan untuk kepala bidang terkait keputusan ini..."
          ></textarea>
        </div>

        <!-- FORM ACTIONS -->
        <div class="form-actions">
          <button class="btn btn-primary" type="submit" [disabled]="saving()">
            @if (saving()) {
              <span class="spinner-sm"></span>
              <span>Menyimpan...</span>
            } @else {
              <span>💾</span>
              <span>Simpan Keputusan</span>
            }
          </button>
        </div>
      </form>
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
    }
    .panel-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.2px;
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

    /* ===== FIELDS ===== */
    .field {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .field-label {
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
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
    
    .field textarea {
      width: 100%;
      box-sizing: border-box;
      padding: 12px 14px;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      font: inherit;
      font-size: 14px;
      background: #f8fafc;
      color: #0f172a;
      transition: all 0.2s ease;
      outline: none;
      resize: vertical;
      min-height: 100px;
      line-height: 1.5;
    }
    .field textarea::placeholder {
      color: #94a3b8;
    }
    .field textarea:focus {
      border-color: #4a9eff;
      background: #ffffff;
      box-shadow: 0 0 0 4px rgba(74, 158, 255, 0.14);
    }

    /* ===== DECISION CARDS (RADIO BUTTON) ===== */
    .decision-group {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    @media (max-width: 640px) {
      .decision-group { grid-template-columns: 1fr; }
    }

    .decision-card {
      position: relative;
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: block;
    }
    .decision-card:hover {
      border-color: #b3d6ff;
      background: #f0f7ff;
    }
    .hidden-radio {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }
    .decision-content {
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }
    .decision-icon {
      font-size: 20px;
      line-height: 1;
      flex-shrink: 0;
    }
    .decision-content strong {
      display: block;
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 2px;
    }
    .decision-content span {
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
      line-height: 1.3;
    }

    /* Selected States */
    .decision-card.selected-approved {
      border-color: #22c55e;
      background: #f0fdf4;
      box-shadow: 0 4px 14px rgba(34, 197, 94, 0.15);
    }
    .decision-card.selected-approved .decision-content strong {
      color: #15803d;
    }
    
    .decision-card.selected-revision {
      border-color: #f59e0b;
      background: #fffbeb;
      box-shadow: 0 4px 14px rgba(245, 158, 11, 0.15);
    }
    .decision-card.selected-revision .decision-content strong {
      color: #b45309;
    }
    
    .decision-card.selected-rejected {
      border-color: #ef4444;
      background: #fef2f2;
      box-shadow: 0 4px 14px rgba(239, 68, 68, 0.15);
    }
    .decision-card.selected-rejected .decision-content strong {
      color: #b91c1c;
    }

    /* ===== FORM ACTIONS ===== */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #f1f5f9;
    }
    .form-actions .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    @media (max-width: 640px) {
      .form-actions .btn-primary {
        width: 100%;
        justify-content: center;
      }
    }

    /* ===== SPINNER ===== */
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
  `],
})
export class ReviewPanelComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(WorkflowService);

  readonly laporanId = input.required<number>();
  readonly reviewed = output<void>();

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    keputusan: '' as Keputusan | '',
    catatan: '',
  });

  // Mengubah valueChanges (Observable) menjadi signal supaya label "wajib/opsional" ikut berubah
  private readonly keputusan = toSignal(this.form.controls.keputusan.valueChanges, {
    initialValue: this.form.controls.keputusan.value,
  });
  readonly catatanWajib = computed(() => this.keputusan() !== 'Approved');

  submit() {
    this.error.set(null);
    const { keputusan, catatan } = this.form.getRawValue();
    const note = catatan.trim();

    if (!keputusan) {
      this.error.set('Pilih keputusan terlebih dahulu.');
      return;
    }
    if (keputusan !== 'Approved' && !note) {
      this.error.set('Catatan wajib diisi untuk keputusan Minta revisi atau Tolak.');
      return;
    }
    if (keputusan === 'Approved' && !confirm('Setujui laporan ini? Keputusan ini final.')) return;
    if (keputusan === 'Rejected' && !confirm('Tolak laporan ini? Keputusan ini final.')) return;

    this.saving.set(true);
    this.api.review(this.laporanId(), { keputusan, catatan: note || null }).subscribe({
      next: () => {
        this.saving.set(false);
        this.reviewed.emit();
      },
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(e.error?.message ?? 'Gagal menyimpan review.');
      },
    });
  }
}