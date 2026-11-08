import { HttpErrorResponse } from '@angular/common/http';

export const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.docx', '.xlsx'];
export const ACCEPT_ATTR = ALLOWED_EXTENSIONS.join(',');
export const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_FILES = 10;

// Mengembalikan pesan error, atau null kalau file boleh diunggah
export function validateFile(file: File, currentCount: number): string | null {
  if (currentCount >= MAX_FILES) return `Maksimal ${MAX_FILES} bukti per laporan.`;
  if (file.size === 0) return 'File kosong.';
  if (file.size > MAX_FILE_BYTES) return 'Ukuran file maksimal 5 MB.';

  const dot = file.name.lastIndexOf('.');
  const ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : '';
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return 'Tipe file tidak diizinkan. Gunakan PDF, JPG, PNG, DOCX, atau XLSX.';
  }
  return null;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function uploadErrorMessage(e: HttpErrorResponse): string {
  if (e.status === 413) return 'Ukuran file terlalu besar.';
  if (e.status === 0) return 'Tidak dapat terhubung ke server.';
  return e.error?.message ?? 'Gagal mengunggah file.';
}