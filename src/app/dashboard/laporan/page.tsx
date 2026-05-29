"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import { downloadReport } from "@/lib/api";
import { IconDownload, IconChart } from "@/components/icons";

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
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-primary-deep md:text-4xl">Laporan Bulanan</h1>
        <p className="mt-2 text-base text-muted">Unduh laporan transaksi dalam format CSV per bulan.</p>
      </header>

      <section className="rounded-2xl border border-white/60 bg-white/75 p-8 shadow-[0_8px_32px_0_rgba(0,79,76,0.06)] backdrop-blur-xl">
        <div className="mb-6 flex items-center gap-4">
          <div aria-hidden className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconChart className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary-deep">Ekspor Transaksi</h2>
            <p className="text-sm text-muted">Pilih bulan lalu unduh berkas CSV.</p>
          </div>
        </div>

        <form onSubmit={handleDownload} className="flex flex-col gap-4 sm:flex-row sm:items-end" aria-busy={loading}>
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="month" className="ml-1 text-sm font-semibold text-ink">Bulan</label>
            <input
              id="month"
              type="month"
              value={month}
              disabled={loading}
              onChange={(e) => setMonth(e.target.value)}
              aria-invalid={!!error}
              className={`w-full rounded-xl border bg-white/70 py-3.5 px-4 text-base text-ink outline-none transition-all focus:bg-white focus:ring-4 focus:ring-primary/20 disabled:opacity-60 ${error ? "border-danger/60 focus:border-danger" : "border-line/70 focus:border-primary-dark"}`}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary-dark py-3.5 px-8 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-deep active:scale-95 disabled:opacity-70"
          >
            <IconDownload className="h-5 w-5" />
            {loading ? "Memproses..." : "Unduh CSV"}
          </button>
        </form>

        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-danger/20 bg-danger/5 px-4 py-2 text-sm text-danger">{error}</p>
        )}

        {result && (
          <div role="status" className="mt-6">
            <p className="mb-2 text-sm text-success">
              Berkas <span className="font-semibold">transaksi-{result.month}.csv</span> terunduh · {result.rows} baris data.
            </p>
            <div className="overflow-x-auto rounded-xl border border-line/40 bg-line/5">
              <pre className="p-4 text-xs leading-relaxed text-muted">{result.preview || "(kosong)"}</pre>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
