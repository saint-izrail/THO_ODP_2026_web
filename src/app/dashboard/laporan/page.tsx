"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import { downloadReport } from "@/lib/api";
import { IconDownload, IconChart, IconReceipt, IconCheck } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { AnimatedCounter } from "@/components/animated-counter";

export default function LaporanPage() {
  const [month, setMonth] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ rows: number; preview: string; month: string } | null>(null);

  // Set bulan default ke bulan berjalan di sisi klien (hindari mismatch hydration
  // karena halaman ini di-prerender statis saat build).
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) setMonth(new Date().toISOString().slice(0, 7));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDownload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      setError("Pilih bulan yang valid (format YYYY-MM).");
      return;
    }
    const token = getToken();
    if (!token) return;
    setLoading(true);
    const res = await downloadReport(month, token);
    if (res.ok) {
      // Trigger unduhan file di browser
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transaksi-${month}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      const preview = res.csv.split("\n").slice(0, 6).join("\n");
      setResult({ rows: res.rows, preview, month });
    } else {
      setError(res.message);
    }
    setLoading(false);
  }

  return (
    <>
      <Reveal>
        <header className="mb-10">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
            <span aria-hidden className="h-px w-6 bg-gold/50" />
            Pusat Laporan
          </p>
          <h1 className="text-3xl font-bold md:text-4xl">
            <span className="gold-text">Laporan Bulanan</span>
          </h1>
          <p className="mt-2 text-base text-muted">Unduh laporan transaksi dalam format CSV per bulan.</p>
        </header>
      </Reveal>

      <Reveal delay={90}>
        <section className="hover-lift relative overflow-hidden rounded-2xl border border-edge bg-surface p-8 shadow-ambient backdrop-blur-xl">
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-4">
              <div aria-hidden className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/20 bg-gold/10 text-secondary ring-glow">
                <IconChart className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-primary-deep">Ekspor Transaksi</h2>
                <p className="text-sm text-muted">Pilih bulan lalu unduh berkas CSV.</p>
              </div>
            </div>

            <div className="divider-gold my-6" />

            <form onSubmit={handleDownload} className="flex flex-col gap-4 sm:flex-row sm:items-end" aria-busy={loading}>
              <div className="flex flex-1 flex-col gap-1.5">
                <label htmlFor="month" className="ml-1 text-xs font-semibold uppercase tracking-wider text-muted">Bulan</label>
                <input
                  id="month"
                  type="month"
                  value={month}
                  disabled={loading}
                  onChange={(e) => setMonth(e.target.value)}
                  aria-invalid={!!error}
                  className={`w-full rounded-xl border bg-surface-2 py-3.5 px-4 text-base text-ink outline-none transition-all focus:bg-surface-3 focus:ring-4 focus:ring-primary/20 disabled:opacity-60 ${error ? "border-danger/60 focus:border-danger" : "border-edge-strong focus:border-primary-dark"}`}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-shine flex items-center justify-center gap-2 rounded-xl bg-primary-dark py-3.5 px-8 text-sm font-semibold text-on-accent shadow-lg shadow-primary/25 transition-all hover:bg-primary-deep active:scale-95 disabled:opacity-70"
              >
                <IconDownload className="h-5 w-5" />
                {loading ? "Memproses..." : "Unduh CSV"}
              </button>
            </form>

            {error && (
              <p role="alert" className="mt-4 rounded-lg border border-danger/20 bg-danger/5 px-4 py-2 text-sm text-danger">{error}</p>
            )}

            {result && (
              <div role="status" className="mt-7">
                <div className="mb-4 flex flex-wrap items-center gap-4">
                  <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-success/20 bg-success/10 text-success">
                    <IconCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-success">
                      Berkas <span className="font-bold">transaksi-{result.month}.csv</span> terunduh.
                    </p>
                    <p className="text-sm text-muted">
                      <AnimatedCounter value={result.rows} className="font-bold text-primary-deep" /> baris data diekspor.
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-edge bg-surface-2 shadow-ambient">
                  <div className="flex items-center gap-2.5 border-b border-edge bg-surface-3/60 px-4 py-2.5">
                    <span aria-hidden className="flex h-6 w-6 items-center justify-center rounded-md bg-gold/10 text-secondary">
                      <IconReceipt className="h-3.5 w-3.5" />
                    </span>
                    <span className="font-mono text-xs font-semibold text-muted">transaksi-{result.month}.csv</span>
                    <span className="ml-auto text-[11px] font-semibold uppercase tracking-wider text-muted">Pratinjau</span>
                  </div>
                  <div className="overflow-x-auto">
                    <pre className="p-4 font-mono text-xs leading-relaxed text-ink">{result.preview || "(kosong)"}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </Reveal>
    </>
  );
}
