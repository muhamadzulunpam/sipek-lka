export interface LoginResponse {
  token: string;
  expiresAt: string;
  namaLengkap: string;
  role: 'Pimpinan' | 'KepalaBidang';
  bidangId: number | null;
  namaBidang: string | null;
}

export interface Bidang {
  id: number;
  nama: string;
}