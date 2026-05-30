"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getToken, clearSession } from "@/lib/auth";
import { getMyTabungan, getMutasi, type MutasiResult } from "@/lib/api";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { IconReceipt, IconArrowRight, IconClock, IconChevronDown, IconList } from "@/components/icons";
import { Reveal } from "@/components/reveal";

const LIMIT = 10;
const JENIS_OPTS = [
  { value: "", label: "Semua jenis" },
  { value: "SETORAN", label: "Setoran" },
  { value: "PENARIKAN", label: "Penarikan" },
];

export default function MutasiPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"loading" | "no-account" | "ready" | "error">("loading");
  const [tabunganId, setTabunganId] = useState<string | null>(null);
  const [data, setData] = useState<MutasiResult | null>(null);
  const [page, setPage] = useState(1);
  const [jenis, setJenis] = useState("");
  const [listLoading, setListLoading] = useState(false);

  const handleAuthError = useCallback(() => {
    clearSession();
    router.replace("/login");
  }, [router]);

  // Tahap 1: cari tabungan milik user
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      const token = getToken();
      if (!token) return;
      try {
        const tab = await getMyTabungan(token);
        if (cancelled) return;
        if (!tab) {
          setPhase("no-account");
          return;
        }
        setTabunganId(tab.id);
        setPhase("ready");
      } catch (e) {
        if (cancelled) return;
        if (e instanceof Error && e.message === "UNAUTHORIZED") return handleAuthError();
        setPhase("error");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [handleAuthError]);

  // Tahap 2: muat mutasi tiap perubahan page/jenis
  useEffect(() => {
    if (!tabunganId) return;
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled) return;
      setListLoading(true);
      const token = getToken();
      if (!token) return;
      try {
        const res = await getMutasi(tabunganId, token, { page, limit: LIMIT, jenis: jenis || undefined });
        if (!cancelled) setData(res);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof Error && e.message === "UNAUTHORIZED") return handleAuthError();
      } finally {
        if (!cancelled) setListLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [tabunganId, page, jenis, handleAuthError]);

  return (
    <>
      <Reveal>
        <header className="mb-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-edge bg-surface-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted backdrop-blur-xl">
            <IconClock aria-hidden className="h-3.5 w-3.5 text-primary" />
            Riwayat Rekening
          </span>
          <h1 className="mt-4 text-3xl font-bold md:text-4xl">
            <span className="gold-text">Mutasi Transaksi</span>
          </h1>
          <p className="mt-2 max-w-xl text-base text-muted">Riwayat setoran dan transaksi rekening Anda, tersaji rapi dalam satu lini masa.</p>
          <div className="divider-gold mt-6 max-w-xs" />
        </header>
      </Reveal>

      {phase === "loading" ? (
        <div role="status" aria-busy="true" className="overflow-hidden rounded-3xl border border-edge bg-surface p-6 shadow-ambient backdrop-blur-xl md:p-8">
          <div className="mb-6 h-10 w-40 animate-pulse rounded-xl bg-surface-3 motion-reduce:animate-none" />
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface-2 motion-reduce:animate-none" style={{ animationDelay: `${i * 90}ms` }} />
            ))}
          </div>
          <span className="sr-only">Memuat mutasi…</span>
        </div>
      ) : phase === "error" ? (
        <Reveal>
          <div role="alert" className="rounded-3xl border border-danger/20 bg-danger/5 p-10 text-center backdrop-blur-xl">
            <div aria-hidden className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 text-danger">
              <IconReceipt className="h-8 w-8" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-danger">Gagal memuat mutasi</h2>
            <p className="mt-2 text-sm text-muted">Coba muat ulang halaman.</p>
          </div>
        </Reveal>
      ) : phase === "no-account" ? (
        <Reveal>
          <div className="rounded-3xl border border-edge bg-surface p-10 text-center shadow-ambient backdrop-blur-xl">
            <div aria-hidden className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary ring-glow">
              <IconReceipt className="h-8 w-8" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-primary-deep">Belum ada rekening</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">Buka rekening tabungan haji dulu untuk melihat mutasi.</p>
            <Link href="/dashboard/tabungan" className="btn-shine hover-lift mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-dark px-6 py-3 text-sm font-semibold text-on-accent shadow-lg shadow-primary/25 transition-all hover:bg-primary-deep">
              Ke Halaman Tabungan
              <IconArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      ) : (
        <Reveal delay={80}>
          <div className="relative overflow-hidden rounded-3xl border border-edge bg-surface p-6 shadow-ambient backdrop-blur-xl md:p-8">
            <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-[0.4]" />
            <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />

            <div className="relative">
              {/* Filter */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div aria-hidden className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <IconList className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Daftar Transaksi</p>
                    {data && (
                      <p className="text-sm font-semibold text-ink">
                        <span className="gold-text">{data.total}</span> transaksi tercatat
                      </p>
                    )}
                  </div>
                </div>
                <label htmlFor="jenis" className="sr-only">Filter jenis transaksi</label>
                <div className="relative">
                  <select
                    id="jenis"
                    value={jenis}
                    onChange={(e) => { setJenis(e.target.value); setPage(1); }}
                    className="appearance-none rounded-xl border border-edge-strong bg-surface-2 py-2.5 pl-4 pr-10 text-sm font-medium text-ink outline-none transition-all hover:border-primary/40 focus:border-primary-dark focus:ring-4 focus:ring-primary/15"
                  >
                    {JENIS_OPTS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <IconChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                </div>
              </div>

              <div className="divider-gold mb-6" />

              {listLoading ? (
                <div role="status" aria-busy="true" className="flex flex-col gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface-2 motion-reduce:animate-none" style={{ animationDelay: `${i * 90}ms` }} />
                  ))}
                  <span className="sr-only">Memuat…</span>
                </div>
              ) : !data || data.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div aria-hidden className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-3 text-muted">
                    <IconReceipt className="h-7 w-7" />
                  </div>
                  <p className="mt-4 text-sm text-muted">Belum ada transaksi.</p>
                </div>
              ) : (
                <>
                  {/* Lini masa transaksi */}
                  <ol className="relative flex flex-col">
                    <span aria-hidden className="absolute bottom-6 left-[19px] top-6 w-px bg-edge md:left-[23px]" />
                    {data.items.map((t, i) => {
                      const isOut = t.jenis === "PENARIKAN";
                      return (
                      <Reveal key={t.id} delay={i * 55}>
                        <li className="group relative flex items-start gap-4 rounded-2xl border border-transparent px-2 py-3 transition-all hover:-translate-y-0.5 hover:border-edge hover:bg-surface-2 md:px-3">
                          {/* Penanda lini masa */}
                          <span
                            aria-hidden
                            className={`relative z-[1] mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ring-surface transition-transform group-hover:scale-110 md:h-12 md:w-12 ${isOut ? "bg-danger/10 text-danger" : "bg-success/10 text-success"}`}
                          >
                            <IconReceipt className={`h-5 w-5 ${isOut ? "rotate-180" : ""}`} />
                          </span>

                          <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-deep">{t.jenis}</span>
                                {t.metode && (
                                  <span className="rounded-full border border-edge px-2.5 py-0.5 text-[11px] font-medium text-muted">{t.metode}</span>
                                )}
                              </div>
                              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
                                <IconClock aria-hidden className="h-3.5 w-3.5" />
                                {formatTanggal(t.waktu)}
                              </p>
                            </div>

                            <div className="flex shrink-0 flex-col sm:items-end">
                              <span className={`text-base font-bold tabular-nums ${isOut ? "text-danger" : "text-success"}`}>{isOut ? "−" : "+"}{formatRupiah(t.nominal)}</span>
                              <span className="text-xs text-muted">
                                Saldo <span className="font-medium tabular-nums text-ink">{formatRupiah(t.saldoSesudah)}</span>
                              </span>
                            </div>
                          </div>
                        </li>
                      </Reveal>
                      );
                    })}
                  </ol>

                  {/* Pagination */}
                  <div className="mt-8 flex items-center justify-between gap-3 border-t border-edge pt-6">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="inline-flex items-center gap-2 rounded-xl border border-edge-strong bg-surface-2 px-4 py-2 text-sm font-medium text-primary-deep transition-all hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <IconArrowRight aria-hidden className="h-4 w-4 rotate-180" />
                      Sebelumnya
                    </button>
                    <span className="text-sm text-muted">
                      Halaman <span className="font-semibold text-ink">{data.page}</span> dari {data.totalPages || 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(data.totalPages || 1, p + 1))}
                      disabled={page >= (data.totalPages || 1)}
                      className="inline-flex items-center gap-2 rounded-xl border border-edge-strong bg-surface-2 px-4 py-2 text-sm font-medium text-primary-deep transition-all hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Berikutnya
                      <IconArrowRight aria-hidden className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </Reveal>
      )}
    </>
  );
}
