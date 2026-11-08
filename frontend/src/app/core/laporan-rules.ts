import { StatusLaporan } from './models';

export const STATUS_LABEL: Record<StatusLaporan, string> = {
  Draft: 'Draft',
  Submitted: 'Menunggu review',
  Revision: 'Perlu revisi',
  Approved: 'Disetujui',
  Rejected: 'Ditolak',
};

export const STATUS_OPTIONS = (Object.keys(STATUS_LABEL) as StatusLaporan[]).map(value => ({
  value,
  label: STATUS_LABEL[value],
}));

// Cermin aturan backend (tahap 4). Hanya untuk menyembunyikan tombol.
export const isEditable = (s: StatusLaporan) => s === 'Draft' || s === 'Revision';
export const isDeletable = (s: StatusLaporan) => s === 'Draft';

export const PERIODE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;