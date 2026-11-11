import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './config';
import { Bidang, PasswordReset, UserItem, UserRequest, UserWithPassword } from './models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  users() {
    return this.http.get<UserItem[]>(`${API_URL}/users`);
  }

  createUser(body: UserRequest) {
    return this.http.post<UserWithPassword>(`${API_URL}/users`, body);
  }

  updateUser(id: number, body: UserRequest) {
    return this.http.put<UserItem>(`${API_URL}/users/${id}`, body);
  }

  setActive(id: number, active: boolean) {
    return this.http.post<void>(`${API_URL}/users/${id}/${active ? 'activate' : 'deactivate'}`, {});
  }

  resetPassword(id: number) {
    return this.http.post<PasswordReset>(`${API_URL}/users/${id}/reset-password`, {});
  }

  bidangs() {
    return this.http.get<Bidang[]>(`${API_URL}/bidang`);
  }

  createBidang(nama: string) {
    return this.http.post<Bidang>(`${API_URL}/bidang`, { nama });
  }

  updateBidang(id: number, nama: string) {
    return this.http.put<Bidang>(`${API_URL}/bidang/${id}`, { nama });
  }
}