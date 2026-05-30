"use client";

import { useEffect, useState } from "react";

type Status = "loading" | "ok" | "error";

interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
}

export function HealthStatusIndicator() {
  const [status, setStatus] = useState<Status>("loading");
  const [detail, setDetail] = useState<HealthResponse | null>(null);

  async function checkHealth() {
    setStatus("loading");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/health`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: HealthResponse = await res.json();
      setDetail(json);
      setStatus(json.status === "ok" ? "ok" : "error");
    } catch {
      setDetail(null);
      setStatus("error");
    }
  }

  useEffect(() => {
    // Initial state sudah "loading", jadi effect tidak perlu setState sinkron
    // (menghindari react-hooks/set-state-in-effect). setState dilakukan setelah await.
    let cancelled = false;
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/health`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<HealthResponse>;
      })
      .then((json) => {
        if (cancelled) return;
        setDetail(json);
        setStatus(json.status === "ok" ? "ok" : "error");
      })
      .catch(() => {
        if (cancelled) return;
        setDetail(null);
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const config: Record<Status, { color: string; label: string }> = {
    loading: { color: "bg-yellow-400", label: "Mengecek koneksi API..." },
    ok: { color: "bg-green-500", label: "API terhubung" },
    error: { color: "bg-red-500", label: "API tidak terjangkau" },
  };
  const { color, label } = config[status];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={status === "loading"}
      className="flex items-center gap-3.5 rounded-2xl border border-edge bg-surface-2 px-4 py-3 shadow-sm backdrop-blur-md"
    >
      <span aria-hidden="true" className="relative flex h-3 w-3 shrink-0 items-center justify-center">
        <span
          className={`absolute inline-flex h-full w-full rounded-full opacity-60 ${color} ${
            status === "loading" ? "animate-ping motion-reduce:hidden" : "hidden"
          }`}
        />
        <span
          className={`relative inline-flex h-3 w-3 rounded-full ${color} ${
            status === "ok" ? "animate-glow" : ""
          }`}
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold tracking-tight text-ink">{label}</p>
        {detail && (
          <p className="mt-0.5 truncate text-xs tracking-wide text-muted">
            {detail.service} ·{" "}
            {new Date(detail.timestamp).toLocaleTimeString("id-ID")}
          </p>
        )}
      </div>
      <button
        onClick={checkHealth}
        disabled={status === "loading"}
        className="shrink-0 rounded-full border border-edge bg-surface-3 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted transition hover-lift hover:border-edge-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Cek ulang
      </button>
    </div>
  );
}
