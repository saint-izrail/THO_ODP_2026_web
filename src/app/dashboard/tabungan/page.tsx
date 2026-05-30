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
import { Reveal } from "@/components/reveal";
import { AnimatedCounter } from "@/components/animated-counter";

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
      <Reveal>
        <header className="mb-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Tabungan Haji</p>
          <h1 className="gold-text text-3xl font-bold md:text-4xl">Menabung Menuju Baitullah</h1>
          <p className="mt-3 max-w-xl text-base text-muted">Kelola rekening dan setoran tabungan haji Anda dengan tenang.</p>
          <div className="divider-gold mt-6 h-px w-28" />
        </header>
      </Reveal>

      {loading ? (
        <div role="status" aria-busy="true" className="h-72 animate-pulse rounded-2xl bg-surface motion-reduce:animate-none">
          <span className="sr-only">Memuat data tabungan…</span>
        </div>
      ) : loadError ? (
        <div role="alert" className="rounded-2xl border border-danger/20 bg-danger/5 p-10 text-center">
          <h2 className="text-xl font-bold text-danger">Gagal memuat data</h2>
          <p className="mt-2 text-sm text-muted">Coba muat ulang halaman.</p>
        </div>
      ) : !tabungan ? (
        /* Belum punya rekening → buka */
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-edge bg-surface p-10 text-center shadow-ambient backdrop-blur-xl">
            <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative z-10">
              <div aria-hidden className="mx-auto flex h-16 w-16 animate-float items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-edge">
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
                className="btn-shine ring-glow mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-dark px-6 py-3 text-sm font-semibold text-on-accent shadow-lg shadow-primary/25 transition-all hover:bg-primary-deep active:scale-[0.98] disabled:opacity-70"
              >
                {bukaLoading ? "Memproses..." : "Buka Rekening Baru"}
                {!bukaLoading && <IconArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </Reveal>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Detail rekening */}
          <Reveal className="lg:col-span-7" delay={80}>
            <section aria-label="Detail rekening" className="hover-lift relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-edge bg-surface p-8 shadow-ambient backdrop-blur-xl">
              <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
              <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Total Saldo</h3>
                  <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success ring-1 ring-success/20">{tabungan.status}</span>
                </div>
                <div className="mt-2 text-4xl font-bold md:text-5xl">
                  <AnimatedCounter value={saldo} format={(x) => formatRupiah(x)} className="gold-text" />
                </div>
                <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-edge bg-surface-2 p-4">
                    <dt className="text-xs uppercase tracking-wider text-muted">Nomor Rekening</dt>
                    <dd className="mt-1 font-semibold text-ink">{tabungan.nomorRekening}</dd>
                  </div>
                  <div className="rounded-xl border border-edge bg-surface-2 p-4">
                    <dt className="text-xs uppercase tracking-wider text-muted">Dibuka</dt>
                    <dd className="mt-1 font-semibold text-ink">{formatTanggal(tabungan.dibukaAt, false)}</dd>
                  </div>
                </dl>
              </div>
            </section>
          </Reveal>

          {/* Estimasi */}
          <Reveal className="lg:col-span-5" delay={160}>
            <section aria-label="Estimasi keberangkatan" className="hover-lift relative flex h-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-edge bg-gradient-to-br from-primary/10 to-gold/10 p-8 text-center shadow-ambient backdrop-blur-xl">
              <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/10 blur-3xl" />
              <div aria-hidden className="relative mb-4 flex h-14 w-14 animate-float-slow items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-edge">
                <IconFlight className="h-7 w-7" />
              </div>
              <h3 className="relative text-xs font-semibold uppercase tracking-wider text-muted">Estimasi Keberangkatan</h3>
              <div className="relative mt-2 text-2xl font-bold">
                {tahunM ? <span className="gold-text">{`${tahunM} M / ${toHijri(tahunM)} H`}</span> : <span className="text-secondary">Belum tersedia</span>}
              </div>
              <p className="relative mt-3 px-2 text-xs text-muted">{estimasi?.catatan ?? "Mulai menabung untuk melihat estimasi."}</p>
            </section>
          </Reveal>

          {/* Setor */}
          <Reveal className="lg:col-span-12" delay={120}>
          <section aria-label="Setor saldo" className="rounded-2xl border border-edge bg-surface p-8 shadow-ambient backdrop-blur-xl">
            <h2 className="mb-1 gold-text text-lg font-bold">Setor Saldo</h2>
            <p className="mb-5 text-sm text-muted">Tambah saldo tabungan haji untuk mempercepat keberangkatan.</p>
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
                  className={`w-full rounded-xl border bg-surface py-3.5 px-4 text-base text-ink outline-none transition-all placeholder:text-muted focus:bg-surface-3 focus:ring-4 focus:ring-primary/20 disabled:opacity-60 ${setorError ? "border-danger/60 focus:border-danger" : "border-edge-strong focus:border-primary-dark"}`}
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
                  className="rounded-xl border border-edge-strong bg-surface py-3.5 px-4 text-base text-ink outline-none transition-all focus:border-primary-dark focus:bg-surface-3 focus:ring-4 focus:ring-primary/20 disabled:opacity-60"
                >
                  {METODE.map((m) => (
                    <option key={m} value={m}>{m.replace("_", " ")}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={setorLoading}
                className="btn-shine ring-glow flex items-center justify-center gap-2 rounded-xl bg-primary-dark py-3.5 px-8 text-sm font-semibold text-on-accent shadow-lg shadow-primary/20 transition-all hover:bg-primary-deep active:scale-95 disabled:opacity-70"
              >
                {setorLoading ? "Memproses..." : "Setor Sekarang"}
                {!setorLoading && <IconArrowRight className="h-4 w-4" />}
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
          </Reveal>
        </div>
      )}
    </>
  );
}
