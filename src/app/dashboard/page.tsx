"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUser, clearSession } from "@/lib/auth";
import { getMyTabungan, getEstimasi, type Tabungan, type Estimasi } from "@/lib/api";
import { formatRupiah, toHijri } from "@/lib/format";
import {
  IconFlight,
  IconArrowRight,
  IconCheck,
  IconMosque,
  IconWallet,
  IconList,
  IconBook,
  IconHeadset,
  IconPlus,
} from "@/components/icons";

const DEFAULT_TARGET = 25_000_000;

const QUICK_SERVICES = [
  { label: "Cek Antrian", icon: IconList },
  { label: "Panduan Manasik", icon: IconBook },
  { label: "Bantuan", icon: IconHeadset },
  { label: "Tambah Layanan", icon: IconPlus, dashed: true },
];

type LoadError = "server" | "unknown" | null;

export default function DashboardPage() {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [loading, setLoading] = useState(true);
  const [tabungan, setTabungan] = useState<Tabungan | null>(null);
  const [estimasi, setEstimasi] = useState<Estimasi | null>(null);
  const [loadError, setLoadError] = useState<LoadError>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.resolve(); // defer agar tidak setState sinkron di effect
      if (cancelled) return;
      const token = getToken();
      const user = getUser();
      if (user) setNama(user.nama);
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const tab = await getMyTabungan(token);
        if (cancelled) return;
        setTabungan(tab);
        if (tab) {
          const est = await getEstimasi(tab.id, token);
          if (!cancelled) setEstimasi(est);
        }
      } catch (e) {
        if (cancelled) return;
        if (e instanceof Error && e.message === "UNAUTHORIZED") {
          // Sesi tidak valid → bersihkan & kembali ke login
          clearSession();
          router.replace("/login");
          return;
        }
        setLoadError(e instanceof Error && e.message === "SERVER_ERROR" ? "server" : "unknown");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const saldo = tabungan ? Number(tabungan.saldo) : 0;
  const target = estimasi ? Number(estimasi.targetPorsi) : DEFAULT_TARGET;
  const pct = target > 0 ? Math.min(100, Math.round((saldo / target) * 100)) : 0;
  const tahunM = estimasi?.estimasiTahunBerangkat ?? null;

  return (
    <>
      {/* Greeting */}
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-primary-deep md:text-4xl">
          Assalamu&apos;alaikum{nama ? `, ${nama}` : ""}
        </h1>
        <p className="mt-2 text-base text-muted">
          Selamat datang di Digital Sanctuary perjalanan ibadah Anda.
        </p>
      </header>

      {loading ? (
        <div role="status" aria-busy="true" className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <span className="sr-only">Memuat data tabungan…</span>
          <div className="h-[300px] animate-pulse rounded-2xl bg-surface motion-reduce:animate-none md:col-span-8" />
          <div className="h-[300px] animate-pulse rounded-2xl bg-surface motion-reduce:animate-none md:col-span-4" />
        </div>
      ) : loadError ? (
        /* State error muat (dibedakan dari empty-state) */
        <div role="alert" className="rounded-2xl border border-danger/20 bg-danger/5 p-10 text-center">
          <h2 className="text-xl font-bold text-danger">Gagal memuat data</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            {loadError === "server"
              ? "Server sedang bermasalah. Coba lagi beberapa saat."
              : "Tidak dapat memuat data tabungan. Periksa koneksi Anda."}
          </p>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="mt-6 rounded-xl bg-primary-dark px-6 py-3 text-sm font-semibold text-on-accent transition-all hover:bg-primary-deep active:scale-[0.98]"
          >
            Muat Ulang
          </button>
        </div>
      ) : !tabungan ? (
        /* Empty state — belum punya rekening */
        <div className="rounded-2xl border border-edge bg-surface p-10 text-center shadow-[0_8px_32px_0_rgba(0,79,76,0.06)] backdrop-blur-xl">
          <div aria-hidden className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconWallet className="h-8 w-8" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-primary-deep">Belum ada rekening tabungan haji</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Buka rekening tabungan haji untuk mulai menabung dan melihat estimasi keberangkatan Anda.
          </p>
          <button type="button" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-dark px-6 py-3 text-sm font-semibold text-on-accent shadow-lg shadow-primary/25 transition-all hover:bg-primary-deep active:scale-[0.98]">
            Buka Rekening Baru
            <IconArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          {/* Ringkasan (bento) */}
          <section aria-labelledby="ringkasan-heading">
            <h2 id="ringkasan-heading" className="sr-only">Ringkasan Tabungan</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
              {/* Kartu saldo */}
              <div className="relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-2xl border border-edge bg-surface p-8 shadow-[0_8px_32px_0_rgba(0,79,76,0.06)] backdrop-blur-xl md:col-span-8 md:p-10">
                <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
                <div aria-hidden className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-gold/10 blur-2xl" />
                <div className="relative z-10">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                    Total Saldo Tabungan
                  </h3>
                  <div className="mb-1 text-4xl font-bold text-primary-deep md:text-5xl">
                    {formatRupiah(saldo)}
                  </div>
                  <p className="text-xs text-muted">Rekening {tabungan.nomorRekening}</p>
                </div>
                <div className="relative z-10 mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <button type="button" className="flex items-center gap-2 rounded-xl bg-primary-dark px-8 py-3 text-sm font-semibold text-on-accent shadow-lg shadow-primary/20 transition-all hover:bg-primary-deep active:scale-95">
                    Setor Sekarang
                    <IconArrowRight className="h-4 w-4" />
                  </button>
                  <button type="button" className="rounded-xl border border-secondary/60 px-6 py-3 text-sm font-semibold text-secondary transition-all hover:bg-secondary/5 active:scale-95">
                    Riwayat Transaksi
                  </button>
                </div>
              </div>

              {/* Kartu estimasi */}
              <div className="relative flex min-h-[300px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-edge bg-gradient-to-br from-primary/10 to-gold/10 p-8 text-center shadow-[0_8px_32px_0_rgba(0,79,76,0.06)] backdrop-blur-xl md:col-span-4">
                <div aria-hidden className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <IconFlight className="h-8 w-8" />
                </div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                  Estimasi Keberangkatan
                </h3>
                <div className="text-2xl font-bold text-secondary">
                  {tahunM ? `${tahunM} M / ${toHijri(tahunM)} H` : "Belum tersedia"}
                </div>
                <p className="mt-4 px-4 text-xs text-muted">
                  {estimasi?.catatan ?? "Estimasi berdasarkan porsi Haji reguler saat ini."}
                </p>
                <div aria-hidden className="absolute bottom-0 h-1 w-full bg-gradient-to-r from-transparent via-secondary to-transparent opacity-50" />
              </div>
            </div>
          </section>

          {/* Progress */}
          <section className="mt-20">
            <h2 className="mb-6 text-xl font-bold text-primary-deep">Langkah Menuju Baitullah</h2>
            <div className="rounded-2xl border border-edge bg-surface p-8 shadow-[0_8px_32px_0_rgba(0,79,76,0.06)] backdrop-blur-xl">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <p className="mb-1 text-xs text-muted">Target Saldo Pelunasan</p>
                  <p className="text-lg font-semibold text-primary-deep">{formatRupiah(target)}</p>
                </div>
                <div className="text-right">
                  <p className="mb-1 text-xs text-muted">Tercapai</p>
                  <p className="text-2xl font-bold text-secondary">{pct}%</p>
                </div>
              </div>
              <div
                className="relative mb-8 h-3 w-full overflow-hidden rounded-full bg-surface-2"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuetext={`${pct}% tercapai`}
                aria-label="Progress tabungan terhadap target pelunasan"
              >
                <div
                  className="relative h-full rounded-full bg-gradient-to-r from-primary-deep to-primary-dark transition-all duration-1000"
                  style={{ width: `${pct}%` }}
                >
                  <div aria-hidden className="absolute inset-0 -translate-x-full animate-[shimmer_2.2s_infinite] bg-gradient-to-r from-transparent via-shimmer to-transparent motion-reduce:animate-none" />
                </div>
              </div>

              {/* Stepper 3 tahap */}
              <div className="relative grid grid-cols-3 gap-4 text-center">
                <div aria-hidden className="absolute left-[16%] right-[16%] top-4 -z-10 h-0.5 bg-surface-2" />
                <div aria-hidden className="absolute left-[16%] top-4 -z-10 h-0.5 bg-secondary" style={{ right: pct >= 100 ? "16%" : "50%" }} />
                <div className="flex flex-col items-center">
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary-dark text-on-accent shadow-md shadow-primary/20">
                    <IconCheck className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium text-primary-deep">Daftar Porsi</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full border-2 border-secondary bg-surface-3">
                    <span aria-hidden className="h-2 w-2 rounded-full bg-secondary" />
                  </div>
                  <span className="text-xs font-semibold text-secondary">Menabung</span>
                </div>
                <div className={"flex flex-col items-center " + (pct >= 100 ? "" : "opacity-50")}>
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-muted">
                    <IconMosque className="h-4 w-4" />
                  </div>
                  <span className="text-xs text-muted">Pelunasan</span>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Layanan Cepat */}
      <section className="mt-20">
        <h2 className="mb-6 text-xl font-bold text-primary-deep">Layanan Cepat</h2>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {QUICK_SERVICES.map((svc) => {
            const Icon = svc.icon;
            return (
              <button
                key={svc.label}
                type="button"
                className={
                  "group flex flex-col items-center gap-4 rounded-xl border bg-surface p-6 text-center shadow-[0_8px_32px_0_rgba(0,79,76,0.04)] backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 " +
                  (svc.dashed ? "border-dashed border-edge" : "border-edge")
                }
              >
                <span
                  aria-hidden
                  className={
                    "flex h-12 w-12 items-center justify-center rounded-full transition-colors " +
                    (svc.dashed
                      ? "bg-surface-2 text-muted"
                      : "bg-primary/5 text-primary group-hover:bg-primary-dark group-hover:text-on-accent")
                  }
                >
                  <Icon className="h-6 w-6" />
                </span>
                <span className={"text-sm font-semibold " + (svc.dashed ? "text-muted" : "text-ink")}>
                  {svc.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
}
