"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUser, clearSession, saveSession } from "@/lib/auth";
import {
  getNasabah,
  getMyTabungan,
  updateNasabah,
  type NasabahDetail,
  type Tabungan,
} from "@/lib/api";
import { formatTanggal } from "@/lib/format";
import { IconVerified, IconEdit, IconBank } from "@/components/icons";

function initials(nama: string): string {
  const p = nama.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "?";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HP_RE = /^08\d{8,11}$/;
type Errs = Partial<Record<"nama" | "email" | "nomorHp", string>>;

export default function ProfilPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [nasabah, setNasabah] = useState<NasabahDetail | null>(null);
  const [tabungan, setTabungan] = useState<Tabungan | null>(null);
  const [loadError, setLoadError] = useState(false);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nama: "", email: "", nomorHp: "" });
  const [errs, setErrs] = useState<Errs>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleAuthError = useCallback(() => {
    clearSession();
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      const token = getToken();
      const user = getUser();
      if (!token || !user) return;
      try {
        const [n, tab] = await Promise.all([getNasabah(user.id, token), getMyTabungan(token)]);
        if (cancelled) return;
        if (!n) {
          setLoadError(true);
        } else {
          setNasabah(n);
          setForm({ nama: n.nama, email: n.email, nomorHp: n.nomorHp });
        }
        setTabungan(tab);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof Error && e.message === "UNAUTHORIZED") return handleAuthError();
        setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [handleAuthError]);

  function startEdit() {
    if (!nasabah) return;
    setForm({ nama: nasabah.nama, email: nasabah.email, nomorHp: nasabah.nomorHp });
    setErrs({});
    setSaveError(null);
    setNotice(null);
    setEditing(true);
  }

  function setField(k: "nama" | "email" | "nomorHp", val: string) {
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
    return e;
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveError(null);
    setNotice(null);
    const v = validate();
    if (Object.keys(v).length) {
      setErrs(v);
      return;
    }
    const token = getToken();
    if (!nasabah || !token) return;
    setSaving(true);
    const res = await updateNasabah(nasabah.id, token, {
      nama: form.nama.trim(),
      email: form.email.trim(),
      nomorHp: form.nomorHp.trim(),
    });
    if (res.ok) {
      setNasabah(res.nasabah);
      setEditing(false);
      setNotice("Profil berhasil diperbarui.");
      // Sinkronkan nama/email di sesi (dipakai dashboard & topbar)
      const u = getUser();
      if (u) saveSession(token, { id: u.id, nama: res.nasabah.nama, email: res.nasabah.email });
    } else {
      if (res.fieldErrors) {
        const m: Errs = {};
        for (const k of ["nama", "email", "nomorHp"] as const) {
          if (res.fieldErrors[k]?.length) m[k] = res.fieldErrors[k][0];
        }
        setErrs(m);
      }
      setSaveError(res.message);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div role="status" aria-busy="true" className="h-72 animate-pulse rounded-2xl bg-white/60 motion-reduce:animate-none">
        <span className="sr-only">Memuat profil…</span>
      </div>
    );
  }
  if (loadError || !nasabah) {
    return (
      <div role="alert" className="rounded-2xl border border-danger/20 bg-danger/5 p-10 text-center">
        <h2 className="text-xl font-bold text-danger">Gagal memuat profil</h2>
        <p className="mt-2 text-sm text-muted">Coba muat ulang halaman.</p>
      </div>
    );
  }

  const info = [
    { label: "NIK", value: nasabah.nik },
    { label: "Email", value: nasabah.email },
    { label: "Nomor HP", value: nasabah.nomorHp },
    { label: "Nomor Rekening", value: tabungan?.nomorRekening ?? "Belum ada rekening" },
  ];

  return (
    <>
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-primary-deep md:text-4xl">Profil Saya</h1>
        <p className="mt-2 text-base text-muted">Kelola data diri dan informasi akun Anda.</p>
      </header>

      {notice && (
        <p role="status" className="mb-6 rounded-xl border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">{notice}</p>
      )}

      {/* Kartu profil */}
      <section className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/75 p-8 shadow-[0_8px_32px_0_rgba(0,79,76,0.06)] backdrop-blur-xl md:p-10">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative z-10 flex flex-col items-center gap-8 md:flex-row md:items-start">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-primary-dark text-4xl font-bold text-white shadow-lg shadow-primary/10">
              <span aria-hidden>{initials(nasabah.nama)}</span>
            </div>
            <span aria-label="Akun terverifikasi" title="Akun terverifikasi" className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-secondary text-white">
              <IconVerified className="h-5 w-5" />
            </span>
          </div>
          {/* Detail */}
          <div className="w-full text-center md:text-left">
            <span className="inline-block rounded-full border border-secondary/20 bg-gold-soft/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-secondary">
              Nasabah BSI
            </span>
            <h2 className="mt-3 text-2xl font-bold text-primary-deep md:text-3xl">{nasabah.nama}</h2>
            <p className="mt-1 text-sm text-muted">Nasabah Tabungan Haji BSI · Terdaftar {formatTanggal(nasabah.createdAt, false)}</p>

            <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {info.map((it) => (
                <div key={it.label} className="rounded-xl border border-line/30 bg-white/50 p-4 text-left">
                  <dt className="text-xs uppercase tracking-wider text-muted">{it.label}</dt>
                  <dd className="mt-1 font-semibold text-ink">{it.value}</dd>
                </div>
              ))}
            </dl>

            {!editing && (
              <button
                type="button"
                onClick={startEdit}
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-primary-dark/30 px-5 py-2.5 text-sm font-semibold text-primary-deep transition-colors hover:bg-primary/5"
              >
                <IconEdit className="h-4 w-4" />
                Edit Profil
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Form edit */}
      {editing && (
        <section aria-label="Edit profil" className="mt-6 rounded-2xl border border-white/60 bg-white/75 p-8 shadow-[0_8px_32px_0_rgba(0,79,76,0.06)] backdrop-blur-xl">
          <h2 className="mb-5 text-lg font-bold text-primary-deep">Edit Data Diri</h2>
          <form onSubmit={handleSave} className="flex flex-col gap-4" noValidate aria-busy={saving}>
            {([
              { id: "nama", label: "Nama Lengkap", type: "text", inputMode: undefined },
              { id: "email", label: "Email", type: "email", inputMode: "email" as const },
              { id: "nomorHp", label: "Nomor HP", type: "tel", inputMode: "numeric" as const },
            ] as const).map((f) => {
              const err = errs[f.id];
              return (
                <div key={f.id} className="flex flex-col gap-1.5">
                  <label htmlFor={f.id} className="ml-1 text-sm font-semibold text-ink">{f.label}</label>
                  <input
                    id={f.id}
                    type={f.type}
                    inputMode={f.inputMode}
                    disabled={saving}
                    value={form[f.id]}
                    onChange={(e) => setField(f.id, f.id === "nomorHp" ? e.target.value.replace(/\D/g, "").slice(0, 13) : e.target.value)}
                    aria-invalid={!!err}
                    aria-describedby={err ? `${f.id}-err` : undefined}
                    className={`w-full rounded-xl border bg-white/70 py-3.5 px-4 text-base text-ink outline-none transition-all placeholder:text-muted focus:bg-white focus:ring-4 focus:ring-primary/20 disabled:opacity-60 ${err ? "border-danger/60 focus:border-danger" : "border-line/70 focus:border-primary-dark"}`}
                  />
                  {err && <p id={`${f.id}-err`} className="ml-1 text-xs text-danger">{err}</p>}
                </div>
              );
            })}

            <div className="rounded-xl border border-line/30 bg-line/10 p-3 text-xs text-muted">
              NIK ({nasabah.nik}) tidak dapat diubah.
            </div>

            {saveError && (
              <p role="alert" className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-2 text-sm text-danger">{saveError}</p>
            )}

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-primary-dark py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-deep active:scale-[0.98] disabled:opacity-70">
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
              <button type="button" disabled={saving} onClick={() => setEditing(false)} className="rounded-xl border border-line/70 px-6 py-3 text-sm font-semibold text-muted transition-colors hover:bg-line/10 disabled:opacity-60">
                Batal
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Info rekening ringkas */}
      {tabungan && (
        <section aria-label="Ringkasan rekening" className="mt-6 flex items-center gap-4 rounded-2xl border border-white/60 bg-white/75 p-6 shadow-[0_8px_32px_0_rgba(0,79,76,0.06)] backdrop-blur-xl">
          <div aria-hidden className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconBank className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted">Status Rekening</p>
            <p className="font-semibold text-primary-deep">{tabungan.status} · {tabungan.nomorRekening}</p>
          </div>
        </section>
      )}
    </>
  );
}
