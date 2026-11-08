import { Component, computed, input } from '@angular/core';
import { StatusLaporan } from '../core/models';
import { STATUS_LABEL } from '../core/laporan-rules';

@Component({
  selector: 'app-status-badge',
  template: `<span class="badge" [attr.data-status]="status()">{{ label() }}</span>`,
  styles: [`
    :host {
      display: inline-flex;
    }
    
    .badge { 
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px; 
      border-radius: 999px; 
      font-size: 12px; 
      font-weight: 700;
      letter-spacing: 0.2px;
      background: #f1f5f9; 
      color: #475569; 
      border: 1px solid transparent;
    }

    /* Titik indikator status (dot) */
    .badge::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
      opacity: 0.8;
    }

    /* Warna-warna status yang modern */
    .badge[data-status='Submitted'] { 
      background: #eaf4ff; 
      color: #1f66bd; 
      border-color: #d6e9ff;
    }
    .badge[data-status='Revision'] { 
      background: #fef3c7; 
      color: #b45309; 
      border-color: #fde68a;
    }
    .badge[data-status='Approved'] { 
      background: #dcfce7; 
      color: #15803d; 
      border-color: #bbf7d0;
    }
    .badge[data-status='Rejected'] { 
      background: #fee2e2; 
      color: #b91c1c; 
      border-color: #fecaca;
    }
  `],
})
export class StatusBadgeComponent {
  readonly status = input.required<StatusLaporan>();
  protected readonly label = computed(() => STATUS_LABEL[this.status()]);
}