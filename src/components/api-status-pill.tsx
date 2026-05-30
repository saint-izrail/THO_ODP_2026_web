"use client";

import { useEffect, useState } from "react";
import { checkHealth } from "@/lib/api";

type State = "checking" | "online" | "offline";

export function ApiStatusPill() {
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    let cancelled = false;
    checkHealth().then((ok) => {
      if (!cancelled) setState(ok ? "online" : "offline");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const cfg = {
    checking: { dot: "bg-gold", label: "Mengecek API..." },
    online: { dot: "bg-success", label: "API Terhubung" },
    offline: { dot: "bg-danger", label: "API Terputus" },
  }[state];

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 rounded-full border border-edge bg-surface-2 px-4 py-1.5 backdrop-blur-sm"
    >
      <span aria-hidden="true" className="relative flex h-2 w-2">
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full motion-reduce:animate-none ${cfg.dot} opacity-60`} />
        <span className={`relative inline-flex h-2 w-2 rounded-full ${cfg.dot}`} />
      </span>
      <span className="text-xs font-medium uppercase tracking-wider text-muted">
        {cfg.label}
      </span>
    </div>
  );
}
