"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUser, clearSession } from "@/lib/auth";
import {
  getMyTabungan,
  getEstimasi,
  bukaRekening,
  setor,
  type Tabungan,
  type Estimasi,
} from "@/lib/api";
import { formatRupiah, toHijri, formatTanggal } from "@/lib/format";
import { IconWallet, IconArrowRight, IconFlight, IconCheck } from "@/components/icons";

const METODE = ["TRANSFER", "QRIS", "TUNAI", "VIRTUAL_ACCOUNT"];
const MIN_SETOR = 100_000;

export default function TabunganPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tabungan, setTabungan] = useState<Tabungan | null>(null);
  const [estimasi, setEstimasi] = useState<Estimasi | null>(null);
  const [loadError, setLoadError] = useState(false);

  // Buka rekening
  const [bukaLoading, setBukaLoading] = useState(false);
  const [bukaError, setBukaError] = useState<string | null>(null);

  // Setor
  const [nominal, setNominal] = useState("");
  const [metode, setMetode] = useState(METODE[0]);
  const [setorLoading, setSetorLoading] = useState(false);
  const [setorError, setSetorError] = useState<string | null>(null);
  const [setorNotice, setSetorNotice] = useState<string | null>(null);

  const handleAuthError = useCallback(() => {
    clearSession();
    router.replace("/login");
  }, [router]);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const tab = await getMyTabungan(token);
      setTabungan(tab);
      if (tab) {
        const est = await getEstimasi(tab.id, token);
        setEstimasi(est);
      }
    } catch (e) {
      if (e instanceof Error && e.message === "UNAUTHORIZED") return handleAuthError();
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function handleBuka() {
    const user = getUser();
    const token = getToken();
    if (!user || !token) return;
    setBukaLoading(true);
    setBukaError(null);
    const res = await bukaRekening(user.id, token);
    if (res.ok) {
      setTabungan(res.tabungan);
      await load();
    } else {
      setBukaError(res.message);
      setBukaLoading(false);
    }
  }

  async function handleSetor(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSetorError(null);
    setSetorNotice(null);
    const n = Number(nominal);
    if (!Number.isFinite(n) || n < MIN_SETOR) {
      setSetorError(`Minimum setoran ${formatRupiah(MIN_SETOR)}.`);
      return;
    }
    const token = getToken();
    if (!tabungan || !token) return;
    setSetorLoading(true);
    const key = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `k-${nominal}-${Math.random().toString(16).slice(2)}`;
    const res = await setor(tabungan.id, n, metode, key, token);
    if (res.ok) {
      setSetorNotice(`Setoran ${formatRupiah(n)} berhasil. Saldo terbaru ${formatRupiah(res.transaksi.saldoSesudah)}.`);
      setNominal("");
      await load();
    } else {
      setSetorError(res.message);
    }
    setSetorLoading(false);
  }

  const saldo = tabungan ? Number(tabungan.saldo) : 0;
  const tahunM = estimasi?.estimasiTahunBerangkat ?? null;
  const nominalNum = Number(nominal);

  return (
    <>
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-primary-deep md:text-4xl">Tabungan Haji</h1>
        <p className="mt-2 text-base text-muted">Kelola rekening dan setoran tabungan haji Anda.</p>
      </header>

      {loading ? (
        <div role="status" aria-busy="true" className="h-72 animate-pulse rounded-2xl bg-white/60 motion-reduce:animate-none">
          <span className="sr-only">Memuat data tabungan…</span>
        </div>
      ) : loadError ? (
        <div role="alert" className="rounded-2xl border border-danger/20 bg-danger/5 p-10 text-center">
          <h2 className="text-xl font-bold text-danger">Gagal memuat data</h2>
          <p className="mt-2 text-sm text-muted">Coba muat ulang halaman.</p>
        </div>
      ) : !tabungan ? (
        /* Belum punya rekening → buka */
        <div className="rounded-2xl border border-white/60 bg-white/75 p-10 text-center shadow-[0_8px_32px_0_rgba(0,79,76,0.06)] backdrop-blur-xl">
          <div aria-hidden className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconWallet className="h-8 w-8" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-primary-deep">Belum ada rekening tabungan haji</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Buka rekening sekarang untuk mulai menabung menuju Baitullah.
          </p>
          {bukaError && (
            <p role="alert" className="mx-auto mt-4 max-w-md rounded-lg border border-danger/20 bg-danger/5 px-4 py-2 text-sm text-danger">
              {bukaError}
            </p>
          )}
          <button
            type="button"
            onClick={handleBuka}
            disabled={bukaLoading}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-dark px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-deep active:scale-[0.98] disabled:opacity-70"
          >
            {bukaLoading ? "Memproses..." : "Buka Rekening Baru"}
            {!bukaLoading && <IconArrowRight className="h-4 w-4" />}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Detail rekening */}
          <section aria-label="Detail rekening" className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/60 bg-white/75 p-8 shadow-[0_8px_32px_0_rgba(0,79,76,0.06)] backdrop-blur-xl lg:col-span-7">
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Total Saldo</h3>
                <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">{tabungan.status}</span>
              </div>
              <div className="mt-2 text-4xl font-bold text-primary-deep md:text-5xl">{formatRupiah(saldo)}</div>
              <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-line/40 bg-white/50 p-4">
                  <dt className="text-xs uppercase tracking-wider text-muted">Nomor Rekening</dt>
                  <dd className="mt-1 font-semibold text-ink">{tabungan.nomorRekening}</dd>
                </div>
                <div className="rounded-xl border border-line/40 bg-white/50 p-4">
                  <dt className="text-xs uppercase tracking-wider text-muted">Dibuka</dt>
                  <dd className="mt-1 font-semibold text-ink">{formatTanggal(tabungan.dibukaAt, false)}</dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Estimasi */}
          <section aria-label="Estimasi keberangkatan" className="flex flex-col items-center justify-center rounded-2xl border border-white/60 bg-gradient-to-br from-white to-[#eef5f4] p-8 text-center shadow-[0_8px_32px_0_rgba(0,79,76,0.06)] backdrop-blur-xl lg:col-span-5">
            <div aria-hidden className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <IconFlight className="h-7 w-7" />
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Estimasi Keberangkatan</h3>
            <div className="mt-2 text-2xl font-bold text-secondary">
              {tahunM ? `${tahunM} M / ${toHijri(tahunM)} H` : "Belum tersedia"}
            </div>
            <p className="mt-3 px-2 text-xs text-muted">{estimasi?.catatan ?? "Mulai menabung untuk melihat estimasi."}</p>
          </section>

          {/* Setor */}
          <section aria-label="Setor saldo" className="rounded-2xl border border-white/60 bg-white/75 p-8 shadow-[0_8px_32px_0_rgba(0,79,76,0.06)] backdrop-blur-xl lg:col-span-12">
            <h2 className="mb-5 text-lg font-bold text-primary-deep">Setor Saldo</h2>
            <form onSubmit={handleSetor} className="flex flex-col gap-4 md:flex-row md:items-end" noValidate aria-busy={setorLoading}>
              <div className="flex flex-1 flex-col gap-1.5">
                <label htmlFor="nominal" className="ml-1 text-sm font-semibold text-ink">Nominal</label>
                <input
                  id="nominal"
                  inputMode="numeric"
                  value={nominal}
                  disabled={setorLoading}
                  onChange={(e) => setNominal(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  placeholder="Minimal 100.000"
                  aria-invalid={!!setorError}
                  aria-describedby="nominal-hint"
                  className={`w-full rounded-xl border bg-white/70 py-3.5 px-4 text-base text-ink outline-none transition-all placeholder:text-muted focus:bg-white focus:ring-4 focus:ring-primary/20 disabled:opacity-60 ${setorError ? "border-danger/60 focus:border-danger" : "border-line/70 focus:border-primary-dark"}`}
                />
                <p id="nominal-hint" className="ml-1 text-xs text-muted">
                  {nominal && Number.isFinite(nominalNum) ? `= ${formatRupiah(nominalNum)}` : "Minimum Rp 100.000"}
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="metode" className="ml-1 text-sm font-semibold text-ink">Metode</label>
                <select
                  id="metode"
                  value={metode}
                  disabled={setorLoading}
                  onChange={(e) => setMetode(e.target.value)}
                  className="rounded-xl border border-line/70 bg-white/70 py-3.5 px-4 text-base text-ink outline-none transition-all focus:border-primary-dark focus:bg-white focus:ring-4 focus:ring-primary/20 disabled:opacity-60"
                >
                  {METODE.map((m) => (
                    <option key={m} value={m}>{m.replace("_", " ")}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={setorLoading}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary-dark py-3.5 px-8 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-deep active:scale-95 disabled:opacity-70"
              >
                {setorLoading ? "Memproses..." : "Setor Sekarang"}
              </button>
            </form>
            {setorError && (
              <p role="alert" className="mt-3 rounded-lg border border-danger/20 bg-danger/5 px-4 py-2 text-sm text-danger">{setorError}</p>
            )}
            {setorNotice && (
              <p role="status" className="mt-3 flex items-center gap-2 rounded-lg border border-success/20 bg-success/5 px-4 py-2 text-sm text-success">
                <IconCheck className="h-4 w-4 shrink-0" />
                {setorNotice}
              </p>
            )}
          </section>
        </div>
      )}
    </>
  );
}
