import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_URL } from './config';
import { DashboardResponse } from './models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  get(periode?: string) {
    let params = new HttpParams();
    if (periode) params = params.set('periode', periode);
    return this.http.get<DashboardResponse>(`${API_URL}/dashboard`, { params });
  }
}