// Controller admin untuk manajemen data nasabah (CRUD penuh).
// Memakai endpoint /nasabah backend (POST publik; GET/PATCH/DELETE butuh auth).
// Operasi yang berbagi logika dengan api client umum (get/update) di-re-export
// dari "./api" agar tidak terjadi duplikasi.
import { getNasabah, updateNasabah, type NasabahDetail } from "./api";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

export type { NasabahDetail };
export { getNasabah, updateNasabah };

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

type Ok<T> = { ok: true } & T;
type Fail = {
  ok: false;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export interface ListNasabahResult {
  items: NasabahDetail[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CreateNasabahInput {
  nik: string;
  nama: string;
  email: string;
  nomorHp: string;
  password: string;
}

// GET /nasabah — daftar nasabah berhalaman (auth). Lempar "UNAUTHORIZED" saat 401.
export async function listNasabah(
  token: string,
  params: { page?: number; limit?: number; search?: string } = {},
): Promise<ListNasabahResult> {
  const q = new URLSearchParams();
  q.set("page", String(params.page ?? 1));
  q.set("limit", String(params.limit ?? 10));
  if (params.search) q.set("search", params.search);
  const res = await fetch(`${API_URL}/nasabah?${q}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  const json = await res.json().catch(() => null);
  const p = json?.meta?.pagination ?? {};
  return {
    items: (json?.data as NasabahDetail[]) ?? [],
    page: p.page ?? 1,
    limit: p.limit ?? 10,
    total: p.total ?? 0,
    totalPages: p.totalPages ?? 1,
  };
}

// POST /nasabah — buat nasabah baru (butuh password). 422 → fieldErrors,
// 409 → duplikat (NIK/email).
export async function createNasabah(
  token: string,
  input: CreateNasabahInput,
): Promise<Ok<{ nasabah: NasabahDetail }> | Fail> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/nasabah`, {
      method: "POST",
      headers: { ...authHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    return { ok: false, message: "Tidak dapat terhubung ke server." };
  }
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  const json = await res.json().catch(() => null);
  if (res.status === 201 && json?.data?.nasabah) {
    return { ok: true, nasabah: json.data.nasabah };
  }
  return {
    ok: false,
    message: json?.error?.message ?? "Gagal menambah nasabah.",
    fieldErrors: json?.error?.details,
  };
}

// DELETE /nasabah/:id — hapus nasabah. 409 bila masih punya tabungan terkait.
export async function removeNasabah(
  id: string,
  token: string,
): Promise<{ ok: true } | Fail> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/nasabah/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
  } catch {
    return { ok: false, message: "Tidak dapat terhubung ke server." };
  }
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (res.ok) return { ok: true };
  const json = await res.json().catch(() => null);
  return {
    ok: false,
    message: json?.error?.message ?? "Gagal menghapus nasabah.",
  };
}
