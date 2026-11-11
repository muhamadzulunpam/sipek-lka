import { HttpErrorResponse } from '@angular/common/http';

// Mengambil pesan dari { message } atau dari error validasi { errors: { Field: ["..."] } }
export function apiErrorMessage(e: HttpErrorResponse, fallback: string): string {
  if (e.status === 0) return 'Tidak dapat terhubung ke server.';
  if (e.error?.message) return e.error.message;

  const errors = e.error?.errors;
  if (errors && typeof errors === 'object') {
    const first = Object.values(errors as Record<string, string[]>)[0];
    if (Array.isArray(first) && first[0]) return first[0];
  }
  return fallback;
}