"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getToken, clearSession } from "@/lib/auth";
import { getMyTabungan, getMutasi, type MutasiResult } from "@/lib/api";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { IconReceipt, IconArrowRight } from "@/components/icons";

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
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-primary-deep md:text-4xl">Mutasi Transaksi</h1>
        <p className="mt-2 text-base text-muted">Riwayat setoran dan transaksi rekening Anda.</p>
      </header>

      {phase === "loading" ? (
        <div role="status" aria-busy="true" className="h-64 animate-pulse rounded-2xl bg-white/60 motion-reduce:animate-none">
          <span className="sr-only">Memuat mutasi…</span>
        </div>
      ) : phase === "error" ? (
        <div role="alert" className="rounded-2xl border border-danger/20 bg-danger/5 p-10 text-center">
          <h2 className="text-xl font-bold text-danger">Gagal memuat mutasi</h2>
          <p className="mt-2 text-sm text-muted">Coba muat ulang halaman.</p>
        </div>
      ) : phase === "no-account" ? (
        <div className="rounded-2xl border border-white/60 bg-white/75 p-10 text-center shadow-[0_8px_32px_0_rgba(0,79,76,0.06)] backdrop-blur-xl">
          <div aria-hidden className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconReceipt className="h-8 w-8" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-primary-deep">Belum ada rekening</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">Buka rekening tabungan haji dulu untuk melihat mutasi.</p>
          <Link href="/dashboard/tabungan" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-dark px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-deep">
            Ke Halaman Tabungan
            <IconArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/60 bg-white/75 p-6 shadow-[0_8px_32px_0_rgba(0,79,76,0.06)] backdrop-blur-xl md:p-8">
          {/* Filter */}
          <div className="mb-5 flex items-center justify-between gap-4">
            <label htmlFor="jenis" className="sr-only">Filter jenis transaksi</label>
            <select
              id="jenis"
              value={jenis}
              onChange={(e) => { setJenis(e.target.value); setPage(1); }}
              className="rounded-xl border border-line/70 bg-white/70 py-2.5 px-4 text-sm text-ink outline-none transition-all focus:border-primary-dark focus:ring-4 focus:ring-primary/15"
            >
              {JENIS_OPTS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {data && <span className="text-sm text-muted">{data.total} transaksi</span>}
          </div>

          {listLoading ? (
            <div role="status" aria-busy="true" className="h-48 animate-pulse rounded-xl bg-white/50 motion-reduce:animate-none">
              <span className="sr-only">Memuat…</span>
            </div>
          ) : !data || data.items.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted">Belum ada transaksi.</p>
          ) : (
            <>
              {/* Tabel (desktop) */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-line/50 text-xs uppercase tracking-wider text-muted">
                      <th scope="col" className="py-3 pr-4 font-semibold">Waktu</th>
                      <th scope="col" className="py-3 pr-4 font-semibold">Jenis</th>
                      <th scope="col" className="py-3 pr-4 font-semibold">Metode</th>
                      <th scope="col" className="py-3 pr-4 text-right font-semibold">Nominal</th>
                      <th scope="col" className="py-3 text-right font-semibold">Saldo Akhir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((t) => (
                      <tr key={t.id} className="border-b border-line/30 last:border-0">
                        <td className="py-3 pr-4 text-muted">{formatTanggal(t.waktu)}</td>
                        <td className="py-3 pr-4">
                          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary-deep">{t.jenis}</span>
                        </td>
                        <td className="py-3 pr-4 text-muted">{t.metode ?? "-"}</td>
                        <td className="py-3 pr-4 text-right font-semibold text-success">+{formatRupiah(t.nominal)}</td>
                        <td className="py-3 text-right font-medium text-ink">{formatRupiah(t.saldoSesudah)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Kartu (mobile) */}
              <ul className="flex flex-col gap-3 md:hidden">
                {data.items.map((t) => (
                  <li key={t.id} className="rounded-xl border border-line/40 bg-white/50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary-deep">{t.jenis}</span>
                      <span className="font-semibold text-success">+{formatRupiah(t.nominal)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted">
                      <span>{formatTanggal(t.waktu)}</span>
                      <span>Saldo {formatRupiah(t.saldoSesudah)}</span>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Pagination */}
              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-line/70 px-4 py-2 text-sm font-medium text-primary-deep transition-colors hover:bg-primary/5 disabled:opacity-40"
                >
                  Sebelumnya
                </button>
                <span className="text-sm text-muted">Halaman {data.page} dari {data.totalPages || 1}</span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(data.totalPages || 1, p + 1))}
                  disabled={page >= (data.totalPages || 1)}
                  className="rounded-lg border border-line/70 px-4 py-2 text-sm font-medium text-primary-deep transition-colors hover:bg-primary/5 disabled:opacity-40"
                >
                  Berikutnya
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
