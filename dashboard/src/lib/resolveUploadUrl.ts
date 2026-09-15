import { API_URL } from "./auth";

/**
 * Backend kadang mengembalikan URL relatif (/uploads/...) kalau
 * BACKEND_BASE_URL tidak diset di .env server. Di development,
 * frontend & backend jalan di port beda — browser akan cari file itu
 * di origin frontend (salah) kalau URL-nya dipakai apa adanya.
 * Fungsi ini menambahkan alamat backend di depan URL relatif.
 */
export function resolveUploadUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}
