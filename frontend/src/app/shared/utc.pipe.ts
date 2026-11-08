import { Pipe, PipeTransform } from '@angular/core';

// Backend mengirim waktu UTC tanpa "Z", sehingga browser menganggapnya waktu lokal.
// Pipe ini menambahkan "Z" supaya DatePipe mengonversinya ke zona waktu pengguna.
// Pakai hanya untuk timestamp lengkap (ada jam), bukan untuk tanggal saja.
@Pipe({ name: 'utc' })
export class UtcPipe implements PipeTransform {
  transform(value: string | null | undefined): string | null {
    if (!value) return null;
    return /(Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : value + 'Z';
  }
}