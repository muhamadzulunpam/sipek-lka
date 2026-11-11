import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_URL } from './config';
import { AuditAksi, AuditLogItem, PagedResult } from './models';

export interface AuditFilter {
  page: number;
  pageSize: number;
  aksi?: string;
  pengguna?: string;
  dari?: string;   // ISO 8601 (UTC), inklusif
  sampai?: string; // ISO 8601 (UTC), eksklusif
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly http = inject(HttpClient);

  list(f: AuditFilter) {
    let params = new HttpParams().set('page', f.page).set('pageSize', f.pageSize);
    if (f.aksi) params = params.set('aksi', f.aksi);
    if (f.pengguna) params = params.set('pengguna', f.pengguna);
    if (f.dari) params = params.set('dari', f.dari);
    if (f.sampai) params = params.set('sampai', f.sampai);
    return this.http.get<PagedResult<AuditLogItem>>(`${API_URL}/audit`, { params });
  }

  actions() {
    return this.http.get<AuditAksi[]>(`${API_URL}/audit/aksi`);
  }
}