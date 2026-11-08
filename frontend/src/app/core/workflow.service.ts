import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './config';
import { ReviewRequest, ReviewResponse, RiwayatResponse, StatusLaporan } from './models';

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  private readonly http = inject(HttpClient);

  private url(id: number) {
    return `${API_URL}/laporan/${id}`;
  }

  submit(id: number) {
    return this.http.post<{ status: StatusLaporan }>(`${this.url(id)}/submit`, {});
  }

  review(id: number, body: ReviewRequest) {
    return this.http.post<{ status: StatusLaporan }>(`${this.url(id)}/review`, body);
  }

  reviews(id: number) {
    return this.http.get<ReviewResponse[]>(`${this.url(id)}/review`);
  }

  riwayat(id: number) {
    return this.http.get<RiwayatResponse[]>(`${this.url(id)}/riwayat`);
  }
}