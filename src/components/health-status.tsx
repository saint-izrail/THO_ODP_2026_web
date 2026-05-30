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
    <div className="flex items-center gap-3 rounded-lg border border-edge bg-surface-2 px-4 py-3">
      <span className={`inline-block h-3 w-3 shrink-0 rounded-full ${color}`} />
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        {detail && (
          <p className="text-xs text-muted">
            {detail.service} ·{" "}
            {new Date(detail.timestamp).toLocaleTimeString("id-ID")}
          </p>
        )}
      </div>
      <button
        onClick={checkHealth}
        disabled={status === "loading"}
        className="rounded-md border border-edge px-3 py-1 text-xs font-medium hover:bg-surface-3 disabled:opacity-50"
      >
        Cek ulang
      </button>
    </div>
  );
}
