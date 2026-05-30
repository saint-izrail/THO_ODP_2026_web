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
      className="inline-flex items-center gap-2.5 rounded-full border border-edge bg-surface-2 px-4 py-1.5 shadow-sm backdrop-blur-md"
    >
      <span aria-hidden="true" className="relative flex h-2 w-2 items-center justify-center">
        <span
          className={`absolute inline-flex h-full w-full rounded-full opacity-60 motion-reduce:hidden ${cfg.dot} ${state === "checking" ? "animate-ping" : "hidden"}`}
        />
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${cfg.dot} ${
            state === "online" ? "animate-glow" : ""
          }`}
        />
      </span>
      <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">
        {cfg.label}
      </span>
    </div>
  );
}
