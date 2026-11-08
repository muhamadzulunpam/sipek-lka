import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './config';
import { BuktiResponse } from './models';

@Injectable({ providedIn: 'root' })
export class BuktiService {
  private readonly http = inject(HttpClient);

  private url(laporanId: number) {
    return `${API_URL}/laporan/${laporanId}/bukti`;
  }

  list(laporanId: number) {
    return this.http.get<BuktiResponse[]>(this.url(laporanId));
  }

  upload(laporanId: number, file: File) {
    const form = new FormData();
    form.append('file', file); // nama key harus sama dengan parameter di backend
    return this.http.post<BuktiResponse>(this.url(laporanId), form);
  }

  download(laporanId: number, buktiId: number) {
    return this.http.get(`${this.url(laporanId)}/${buktiId}`, { responseType: 'blob' });
  }

  remove(laporanId: number, buktiId: number) {
    return this.http.delete<void>(`${this.url(laporanId)}/${buktiId}`);
  }
}