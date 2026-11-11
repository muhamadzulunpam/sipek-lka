export type StatusLaporan = 'Draft' | 'Submitted' | 'Revision' | 'Approved' | 'Rejected';
export type Keputusan = 'Approved' | 'Revision' | 'Rejected';

export interface LoginResponse {
  token: string;
  expiresAt: string;
  namaLengkap: string;
  role: 'Pimpinan' | 'KepalaBidang';
  bidangId: number | null;
  namaBidang: string | null;
  wajibGantiPassword: boolean;
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

export interface BuktiResponse {
  id: number;
  namaFile: string;
  tipeKonten: string;
  ukuranByte: number;
  diunggahPada: string;
}

export interface ReviewRequest {
  keputusan: Keputusan;
  catatan: string | null;
}

export interface ReviewResponse {
  id: number;
  keputusan: StatusLaporan;
  catatan: string;
  direviewPada: string;
  reviewer: string;
}

export interface RiwayatResponse {
  id: number;
  statusLama: StatusLaporan;
  statusBaru: StatusLaporan;
  keterangan: string | null;
  diubahPada: string;
  diubahOleh: string;
}

export interface BidangStat {
  bidangId: number;
  namaBidang: string;
  draft: number;
  submitted: number;
  revision: number;
  approved: number;
  rejected: number;
  total: number;
}

export interface DashboardResponse {
  periode: string | null;
  total: number;
  draft: number;
  submitted: number;
  revision: number;
  approved: number;
  rejected: number;
  totalKepalaBidang: number | null;
  perBidang: BidangStat[];
}

export interface UserItem {
  id: number;
  namaLengkap: string;
  email: string;
  bidangId: number | null;
  namaBidang: string | null;
  isAktif: boolean;
  wajibGantiPassword: boolean;
}

export interface UserRequest {
  namaLengkap: string;
  email: string;
  bidangId: number;
}

export interface UserWithPassword {
  user: UserItem;
  passwordSementara: string;
}

export interface PasswordReset {
  passwordSementara: string;
}