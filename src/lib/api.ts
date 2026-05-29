// Klien API untuk backend Tabungan Haji (Express).
// Base URL dari env (NEXT_PUBLIC_*), dengan fallback ke localhost.

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export interface ApiUser {
  id: string;
  nama: string;
  email: string;
}

export interface LoginResult {
  token: string;
  tokenType: string;
  expiresAt: string | null;
  user: ApiUser;
}

// Login ke /auth/login. Mengembalikan data sesi, atau melempar Error
// dengan pesan dari backend (envelope { data, error, meta }).
export async function login(
  email: string,
  password: string,
): Promise<LoginResult> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error(
      "Tidak dapat terhubung ke server. Pastikan API berjalan di " + BASE_URL,
    );
  }

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.data?.token) {
    const msg: string =
      json?.error?.message ?? "Email atau password salah";
    throw new Error(msg);
  }

  return json.data as LoginResult;
}

export interface RegisterInput {
  nik: string;
  nama: string;
  email: string;
  nomorHp: string;
  password: string;
}

export type RegisterResult =
  | { ok: true; user: ApiUser }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

// Registrasi nasabah baru (publik). Mengembalikan hasil terstruktur:
// - ok:true  → 201, akun dibuat
// - ok:false → 422 (fieldErrors), 409 (duplikat), atau error lain (message)
export async function register(input: RegisterInput): Promise<RegisterResult> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/nasabah`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    return {
      ok: false,
      message: "Tidak dapat terhubung ke server. Pastikan API berjalan di " + BASE_URL,
    };
  }

  const json = await res.json().catch(() => null);

  if (res.status === 201 && json?.data?.nasabah) {
    const n = json.data.nasabah;
    return { ok: true, user: { id: n.id, nama: n.nama, email: n.email } };
  }
  if (res.status === 422) {
    // Backend menaruh map fieldErrors langsung di error.details ({nik:[...], email:[...]})
    return {
      ok: false,
      message: json?.error?.message ?? "Validasi input gagal",
      fieldErrors: json?.error?.details,
    };
  }
  return {
    ok: false,
    message: json?.error?.message ?? "Registrasi gagal. Coba lagi.",
  };
}

export interface Tabungan {
  id: string;
  nomorRekening: string;
  saldo: string; // BigInt diserialisasi sebagai string oleh backend
  status: string;
  dibukaAt: string;
  nasabahId: string;
}

export interface Estimasi {
  tabunganId: string;
  saldoSekarang: string;
  targetPorsi: string;
  sudahMencapaiTarget: boolean;
  rataRataSetoranBulanan: string | null;
  bulanDibutuhkan: number | null;
  tahunMencapaiTarget: number | null;
  antrianTahun: number;
  estimasiTahunBerangkat: number | null;
  catatan: string;
}

// Tabungan aktif milik nasabah yang login.
// - null  : 200 dengan data null (belum punya rekening) → empty-state
// - throw "UNAUTHORIZED" : 401 (sesi mati) → logout
// - throw "SERVER_ERROR" : 5xx → state error (bukan disamarkan jadi "belum punya rekening")
export async function getMyTabungan(token: string): Promise<Tabungan | null> {
  const res = await fetch(`${API_URL}/tabungan-haji/saya`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (res.status >= 500) throw new Error("SERVER_ERROR");
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  return (json?.data as Tabungan | null) ?? null;
}

// Estimasi tahun keberangkatan untuk satu tabungan.
export async function getEstimasi(
  tabunganId: string,
  token: string,
): Promise<Estimasi | null> {
  const res = await fetch(`${API_URL}/tabungan-haji/${tabunganId}/estimasi`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  return (json?.data as Estimasi | null) ?? null;
}

export interface Transaksi {
  id: string;
  tabunganId: string;
  jenis: string;
  nominal: string;
  saldoSebelum: string;
  saldoSesudah: string;
  referensi: string;
  metode: string | null;
  waktu: string;
}

export interface MutasiResult {
  items: Transaksi[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface NasabahDetail {
  id: string;
  nik: string;
  nama: string;
  email: string;
  nomorHp: string;
  createdAt: string;
  updatedAt: string;
}

type Ok<T> = { ok: true } & T;
type Fail = { ok: false; message: string; fieldErrors?: Record<string, string[]> };

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// Buka rekening tabungan haji untuk nasabah.
export async function bukaRekening(
  nasabahId: string,
  token: string,
): Promise<Ok<{ tabungan: Tabungan }> | Fail> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/tabungan-haji`, {
      method: "POST",
      headers: { ...authHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({ nasabahId }),
    });
  } catch {
    return { ok: false, message: "Tidak dapat terhubung ke server." };
  }
  const json = await res.json().catch(() => null);
  if (res.status === 201 && json?.data?.tabungan) {
    return { ok: true, tabungan: json.data.tabungan };
  }
  return { ok: false, message: json?.error?.message ?? "Gagal membuka rekening." };
}

// Setor saldo (butuh Idempotency-Key unik per setoran).
export async function setor(
  tabunganId: string,
  nominal: number,
  metode: string,
  idempotencyKey: string,
  token: string,
): Promise<Ok<{ transaksi: Transaksi; replayed: boolean }> | Fail> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/tabungan-haji/${tabunganId}/setor`, {
      method: "POST",
      headers: {
        ...authHeaders(token),
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({ nominal, metode: metode || undefined }),
    });
  } catch {
    return { ok: false, message: "Tidak dapat terhubung ke server." };
  }
  const json = await res.json().catch(() => null);
  if (res.status === 201) {
    const t = json?.data?.transaksi;
    return {
      ok: true,
      transaksi: t,
      replayed: res.headers.get("Idempotency-Replayed") === "true",
    };
  }
  return {
    ok: false,
    message: json?.error?.message ?? "Setoran gagal.",
    fieldErrors: json?.error?.details,
  };
}

// Riwayat mutasi transaksi sebuah tabungan.
export async function getMutasi(
  tabunganId: string,
  token: string,
  params: { page?: number; limit?: number; jenis?: string } = {},
): Promise<MutasiResult> {
  const q = new URLSearchParams();
  q.set("page", String(params.page ?? 1));
  q.set("limit", String(params.limit ?? 10));
  if (params.jenis) q.set("jenis", params.jenis);
  const res = await fetch(`${API_URL}/tabungan-haji/${tabunganId}/mutasi?${q}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  const json = await res.json().catch(() => null);
  const p = json?.meta?.pagination ?? {};
  return {
    items: (json?.data as Transaksi[]) ?? [],
    page: p.page ?? 1,
    limit: p.limit ?? 10,
    total: p.total ?? 0,
    totalPages: p.totalPages ?? 1,
  };
}

// Detail nasabah by id.
export async function getNasabah(id: string, token: string): Promise<NasabahDetail | null> {
  const res = await fetch(`${API_URL}/nasabah/${id}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  return (json?.data as NasabahDetail | null) ?? null;
}

// Update data nasabah (nama/email/nomorHp).
export async function updateNasabah(
  id: string,
  token: string,
  input: { nama?: string; email?: string; nomorHp?: string },
): Promise<Ok<{ nasabah: NasabahDetail }> | Fail> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/nasabah/${id}`, {
      method: "PATCH",
      headers: { ...authHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    return { ok: false, message: "Tidak dapat terhubung ke server." };
  }
  const json = await res.json().catch(() => null);
  if (res.ok && json?.data?.nasabah) {
    return { ok: true, nasabah: json.data.nasabah };
  }
  return {
    ok: false,
    message: json?.error?.message ?? "Gagal memperbarui profil.",
    fieldErrors: json?.error?.details,
  };
}

// Unduh laporan CSV transaksi bulanan (month: YYYY-MM).
export async function downloadReport(
  month: string,
  token: string,
): Promise<Ok<{ csv: string; rows: number }> | Fail> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/reports/transaksi-bulanan?month=${encodeURIComponent(month)}`, {
      headers: authHeaders(token),
      cache: "no-store",
    });
  } catch {
    return { ok: false, message: "Tidak dapat terhubung ke server." };
  }
  if (res.status === 401) return { ok: false, message: "Sesi tidak valid." };
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    return { ok: false, message: json?.error?.message ?? "Gagal mengambil laporan." };
  }
  const csv = await res.text();
  const rows = Number(res.headers.get("X-Report-Rows") ?? 0);
  return { ok: true, csv, rows };
}

// Cek koneksi backend via /health. true bila status "ok".
export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/health`, { cache: "no-store" });
    if (!res.ok) return false;
    const json = await res.json();
    return json?.status === "ok";
  } catch {
    return false;
  }
}
