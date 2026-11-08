export type StatusLaporan = 'Draft' | 'Submitted' | 'Revision' | 'Approved' | 'Rejected';

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

export interface LaporanListItem {
  id: number;
  namaKegiatan: string;
  periode: string;
  target: number;
  realisasi: number;
  status: StatusLaporan;
  dibuatPada: string;
  bidangId: number;
  namaBidang: string;
}

export interface LaporanResponse {
  id: number;
  namaKegiatan: string;
  tanggalPelaksanaan: string;
  periode: string;
  tujuan: string;
  deskripsi: string;
  target: number;
  realisasi: number;
  capaian: string;
  kendalaTindakLanjut: string | null;
  status: StatusLaporan;
  dibuatPada: string;
  bidangId: number;
  namaBidang: string;
  dibuatOleh: string;
}

export interface LaporanRequest {
  namaKegiatan: string;
  tanggalPelaksanaan: string;
  periode: string;
  tujuan: string;
  deskripsi: string;
  target: number;
  realisasi: number;
  capaian: string;
  kendalaTindakLanjut: string | null;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}