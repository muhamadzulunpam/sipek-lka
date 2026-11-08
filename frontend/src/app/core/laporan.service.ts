import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_URL } from './config';
import {
  Bidang, LaporanListItem, LaporanRequest, LaporanResponse, PagedResult, StatusLaporan,
} from './models';

export interface LaporanFilter {
  page: number;
  pageSize: number;
  periode?: string;
  status?: StatusLaporan;
  bidangId?: number;
}

@Injectable({ providedIn: 'root' })
export class LaporanService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/laporan`;

  list(f: LaporanFilter) {
    let params = new HttpParams().set('page', f.page).set('pageSize', f.pageSize);
    if (f.periode) params = params.set('periode', f.periode);
    if (f.status) params = params.set('status', f.status);
    if (f.bidangId) params = params.set('bidangId', f.bidangId);
    return this.http.get<PagedResult<LaporanListItem>>(this.url, { params });
  }

  get(id: number) {
    return this.http.get<LaporanResponse>(`${this.url}/${id}`);
  }

  create(body: LaporanRequest) {
    return this.http.post<LaporanResponse>(this.url, body);
  }

  update(id: number, body: LaporanRequest) {
    return this.http.put<void>(`${this.url}/${id}`, body);
  }

  remove(id: number) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  bidangs() {
    return this.http.get<Bidang[]>(`${API_URL}/bidang`);
  }
}