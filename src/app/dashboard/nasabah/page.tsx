"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, clearSession } from "@/lib/auth";
import {
  listNasabah,
  createNasabah,
  updateNasabah,
  removeNasabah,
  type NasabahDetail,
} from "@/lib/nasabah";
import { NasabahRow } from "@/components/nasabah-row";
import { IconPlus, IconSearch, IconUsers } from "@/components/icons";
import { Reveal } from "@/components/reveal";

const NIK_RE = /^\d{16}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HP_RE = /^08\d{8,11}$/;
const LIMIT = 10;

type FormState = {
  nik: string;
  nama: string;
  email: string;
  nomorHp: string;
  password: string;
};
type FieldKey = keyof FormState;
type Errs = Partial<Record<FieldKey, string>>;

const EMPTY_FORM: FormState = { nik: "", nama: "", email: "", nomorHp: "", password: "" };

export default function NasabahPage() {
  const router = useRouter();

  const [list, setList] = useState<NasabahDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Form tambah/edit. editingId === null → mode tambah.
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errs, setErrs] = useState<Errs>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [notice, setNotice] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAuthError = useCallback(() => {
    clearSession();
    router.replace("/login");
  }, [router]);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return handleAuthError();
    setLoading(true);
    setLoadError(false);
    try {
      const res = await listNasabah(token, {
        page,
        limit: LIMIT,
        search: search || undefined,
      });
      setList(res.items);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch (e) {
      if (e instanceof Error && e.message === "UNAUTHORIZED") return handleAuthError();
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [page, search, handleAuthError]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrs({});
    setSubmitError(null);
    setPanelOpen(true);
  }

  function openEdit(n: NasabahDetail) {
    setEditingId(n.id);
    setForm({ nik: n.nik, nama: n.nama, email: n.email, nomorHp: n.nomorHp, password: "" });
    setErrs({});
    setSubmitError(null);
    setNotice(null);
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrs({});
    setSubmitError(null);
  }

  function setField(k: FieldKey, val: string) {
    setForm((s) => ({ ...s, [k]: val }));
    setErrs((e) => {
      if (!e[k]) return e;
      const n = { ...e };
      delete n[k];
      return n;
    });
  }

  function validate(): Errs {
    const e: Errs = {};
    if (form.nama.trim().length < 3) e.nama = "Nama minimal 3 karakter.";
    if (!EMAIL_RE.test(form.email.trim())) e.email = "Format email tidak valid.";
    if (!HP_RE.test(form.nomorHp.trim())) e.nomorHp = "Format 08xxxxxxxxxx (10–13 digit).";
    if (editingId === null) {
      if (!NIK_RE.test(form.nik.trim())) e.nik = "NIK harus tepat 16 digit angka.";
      if (form.password.length < 8) e.password = "Password minimal 8 karakter.";
    }
    return e;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);
    setNotice(null);
    const v = validate();
    if (Object.keys(v).length) {
      setErrs(v);
      return;
    }
    const token = getToken();
    if (!token) return handleAuthError();
    setSubmitting(true);
    try {
      const res =
        editingId === null
          ? await createNasabah(token, {
              nik: form.nik.trim(),
              nama: form.nama.trim(),
              email: form.email.trim(),
              nomorHp: form.nomorHp.trim(),
              password: form.password,
            })
          : await updateNasabah(editingId, token, {
              nama: form.nama.trim(),
              email: form.email.trim(),
              nomorHp: form.nomorHp.trim(),
            });

      if (res.ok) {
        setNotice(
          editingId === null
            ? "Nasabah berhasil ditambahkan."
            : "Data nasabah berhasil diperbarui.",
        );
        closePanel();
        await load();
      } else {
        if (res.fieldErrors) {
          const m: Errs = {};
          for (const k of ["nik", "nama", "email", "nomorHp", "password"] as const) {
            if (res.fieldErrors[k]?.length) m[k] = res.fieldErrors[k][0];
          }
          setErrs(m);
        }
        setSubmitError(res.message);
      }
    } catch (err) {
      if (err instanceof Error && err.message === "UNAUTHORIZED") return handleAuthError();
      setSubmitError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(n: NasabahDetail) {
    if (!window.confirm(`Hapus nasabah "${n.nama}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    const token = getToken();
    if (!token) return handleAuthError();
    setNotice(null);
    setDeletingId(n.id);
    try {
      const res = await removeNasabah(n.id, token);
      if (res.ok) {
        setNotice(`Nasabah "${n.nama}" berhasil dihapus.`);
        // Bila item terakhir di halaman > 1 dihapus, mundur satu halaman
        // (perubahan page memicu reload via useEffect).
        if (list.length === 1 && page > 1) setPage((p) => p - 1);
        else await load();
      } else {
        window.alert(res.message);
      }
    } catch (err) {
      if (err instanceof Error && err.message === "UNAUTHORIZED") return handleAuthError();
      window.alert("Gagal menghapus nasabah.");
    } finally {
      setDeletingId(null);
    }
  }

  function submitSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  // Field yang tampil di form: NIK & password hanya saat tambah (tak bisa diubah).
  const fields = (
    [
      { id: "nik", label: "NIK", type: "text", inputMode: "numeric" as const, createOnly: true },
      { id: "nama", label: "Nama Lengkap", type: "text", inputMode: undefined, createOnly: false },
      { id: "email", label: "Email", type: "email", inputMode: "email" as const, createOnly: false },
      { id: "nomorHp", label: "Nomor HP", type: "tel", inputMode: "numeric" as const, createOnly: false },
      { id: "password", label: "Password Awal", type: "password", inputMode: undefined, createOnly: true },
    ] as const
  ).filter((f) => editingId === null || !f.createOnly);

  return (
    <>
      <Reveal>
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <IconUsers className="h-4 w-4" aria-hidden />
              Manajemen Nasabah
            </p>
            <h1 className="gold-text text-3xl font-bold md:text-4xl">Data Nasabah</h1>
            <p className="mt-2 text-base text-muted">
              Kelola data nasabah (admin) — tambah, ubah, dan hapus.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="btn-shine ring-glow inline-flex items-center justify-center gap-2 rounded-xl bg-primary-dark px-5 py-3 text-sm font-semibold text-on-accent shadow-lg shadow-primary/20 transition-all hover:bg-primary-deep active:scale-[0.98]"
          >
            <IconPlus className="h-4 w-4" />
            Tambah Nasabah
          </button>
        </header>
      </Reveal>

      {notice && (
        <p role="status" className="mb-6 rounded-xl border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
          {notice}
        </p>
      )}

      {/* Form tambah/edit */}
      {panelOpen && (
        <Reveal>
        <section
          aria-label={editingId === null ? "Tambah nasabah" : "Edit nasabah"}
          className="hover-lift mb-6 rounded-2xl border border-edge-strong bg-surface-2 p-8 shadow-ambient backdrop-blur-xl"
        >
          <div className="mb-5 flex items-center gap-3">
            <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-xl border border-edge bg-primary/10 text-primary">
              {editingId === null ? <IconPlus className="h-5 w-5" /> : <IconUsers className="h-5 w-5" />}
            </span>
            <h2 className="text-lg font-bold text-primary-deep">
              {editingId === null ? "Tambah Nasabah Baru" : "Edit Data Nasabah"}
            </h2>
          </div>
          <div className="divider-gold mb-6" />
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate aria-busy={submitting}>
            {fields.map((f) => {
              const err = errs[f.id];
              return (
                <div key={f.id} className="flex flex-col gap-1.5">
                  <label htmlFor={f.id} className="ml-1 text-xs font-semibold uppercase tracking-wider text-muted">{f.label}</label>
                  <input
                    id={f.id}
                    type={f.type}
                    inputMode={f.inputMode}
                    disabled={submitting}
                    value={form[f.id]}
                    onChange={(e) =>
                      setField(
                        f.id,
                        f.id === "nomorHp"
                          ? e.target.value.replace(/\D/g, "").slice(0, 13)
                          : f.id === "nik"
                            ? e.target.value.replace(/\D/g, "").slice(0, 16)
                            : e.target.value,
                      )
                    }
                    aria-invalid={!!err}
                    aria-describedby={err ? `${f.id}-err` : undefined}
                    className={`w-full rounded-xl border bg-surface py-3.5 px-4 text-base text-ink outline-none transition-all placeholder:text-muted focus:bg-surface-3 focus:ring-4 focus:ring-primary/20 disabled:opacity-60 ${err ? "border-danger/60 focus:border-danger" : "border-edge-strong focus:border-primary-dark"}`}
                  />
                  {err && <p id={`${f.id}-err`} className="ml-1 text-xs text-danger">{err}</p>}
                </div>
              );
            })}

            {editingId !== null && (
              <div className="rounded-xl border border-edge bg-surface-2 p-3 text-xs text-muted sm:col-span-2">
                NIK ({form.nik}) tidak dapat diubah.
              </div>
            )}

            {submitError && (
              <p role="alert" className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-2 text-sm text-danger sm:col-span-2">
                {submitError}
              </p>
            )}

            <div className="flex gap-3 sm:col-span-2">
              <button type="submit" disabled={submitting} className="btn-shine flex-1 rounded-xl bg-primary-dark py-3 text-sm font-semibold text-on-accent shadow-lg shadow-primary/20 transition-all hover:bg-primary-deep active:scale-[0.98] disabled:opacity-70">
                {submitting ? "Menyimpan..." : editingId === null ? "Tambah Nasabah" : "Simpan Perubahan"}
              </button>
              <button type="button" disabled={submitting} onClick={closePanel} className="rounded-xl border border-edge-strong px-6 py-3 text-sm font-semibold text-muted transition-colors hover:bg-surface-3 disabled:opacity-60">
                Batal
              </button>
            </div>
          </form>
        </section>
        </Reveal>
      )}

      {/* Pencarian */}
      <form onSubmit={submitSearch} className="mb-5 flex gap-3" role="search">
        <div className="relative flex-1">
          <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <IconSearch className="h-5 w-5" />
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari nama, NIK, atau email..."
            aria-label="Cari nasabah"
            className="w-full rounded-xl border border-edge-strong bg-surface py-3 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted focus:border-primary-dark focus:ring-4 focus:ring-primary/15"
          />
        </div>
        <button type="submit" className="rounded-xl border border-primary-dark/30 px-5 py-3 text-sm font-semibold text-primary-deep transition-colors hover:bg-primary/5">
          Cari
        </button>
      </form>

      {/* Tabel */}
      <Reveal delay={120}>
      <section className="overflow-hidden rounded-2xl border border-edge bg-surface shadow-ambient backdrop-blur-xl">
        {loading ? (
          <div role="status" aria-busy="true" className="h-72 animate-pulse bg-surface motion-reduce:animate-none">
            <span className="sr-only">Memuat data nasabah…</span>
          </div>
        ) : loadError ? (
          <div role="alert" className="p-10 text-center">
            <h2 className="text-lg font-bold text-danger">Gagal memuat data nasabah</h2>
            <button type="button" onClick={load} className="mt-4 rounded-xl border border-primary-dark/30 px-5 py-2.5 text-sm font-semibold text-primary-deep transition-colors hover:bg-primary/5">
              Coba lagi
            </button>
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
            <span
              aria-hidden
              className="animate-float relative flex h-20 w-20 items-center justify-center rounded-2xl border border-edge bg-gradient-to-br from-primary/10 to-gold/10 text-primary shadow-ambient motion-reduce:animate-none"
            >
              <IconUsers className="h-9 w-9" />
            </span>
            <p className="text-lg font-bold text-primary-deep">
              {search ? "Tidak ada nasabah yang cocok" : "Belum ada data nasabah"}
            </p>
            <p className="max-w-xs text-sm text-muted">
              {search ? "Coba kata kunci lain atau periksa ejaan pencarian." : "Mulai dengan menambahkan nasabah pertama lewat tombol di atas."}
            </p>
            {!search && (
              <button
                type="button"
                onClick={openCreate}
                className="btn-shine mt-1 inline-flex items-center gap-2 rounded-xl bg-primary-dark px-5 py-2.5 text-sm font-semibold text-on-accent shadow-lg shadow-primary/20 transition-all hover:bg-primary-deep active:scale-[0.98]"
              >
                <IconPlus className="h-4 w-4" />
                Tambah Nasabah
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-edge-strong bg-gradient-to-r from-primary/[0.06] to-gold/[0.04]">
                  <th scope="col" className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-primary-deep">#</th>
                  <th scope="col" className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-primary-deep">Nama / NIK</th>
                  <th scope="col" className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-primary-deep">Email</th>
                  <th scope="col" className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-primary-deep">Nomor HP</th>
                  <th scope="col" className="hidden px-4 py-4 text-xs font-semibold uppercase tracking-wider text-primary-deep lg:table-cell">Terdaftar</th>
                  <th scope="col" className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-primary-deep">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {list.map((n, i) => (
                  <NasabahRow
                    key={n.id}
                    nasabah={n}
                    index={(page - 1) * LIMIT + i + 1}
                    deleting={deletingId === n.id}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      </Reveal>

      {/* Pagination */}
      {!loading && !loadError && total > 0 && (
        <div className="mt-5 flex items-center justify-between gap-4">
          <p className="text-sm text-muted">
            Menampilkan {list.length} dari {total} nasabah · Halaman {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-xl border border-edge-strong px-4 py-2 text-sm font-semibold text-primary-deep transition-colors hover:bg-primary/5 disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-xl border border-edge-strong px-4 py-2 text-sm font-semibold text-primary-deep transition-colors hover:bg-primary/5 disabled:opacity-40"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}
    </>
  );
}
