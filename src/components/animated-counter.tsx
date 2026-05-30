"use client";

// Angka yang menghitung naik (count-up) saat masuk viewport.
// Menghormati prefers-reduced-motion (langsung tampil nilai akhir).
import { useEffect, useRef, useState } from "react";

export function AnimatedCounter({
  value,
  duration = 1200,
  format,
  className = "",
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || value === 0) {
      setDisplay(value);
      return;
    }

    const run = () => {
      if (started.current) return;
      started.current = true;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(value * eased);
        if (t < 1) requestAnimationFrame(tick);
        else setDisplay(value);
      };
      requestAnimationFrame(tick);
    };

    const el = ref.current;
    if (el && typeof IntersectionObserver !== "undefined") {
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              run();
              io.disconnect();
              break;
            }
          }
        },
        { threshold: 0.4 },
      );
      io.observe(el);
      return () => io.disconnect();
    }
    run();
  }, [value, duration]);

  const fmt = format ?? ((n: number) => Math.round(n).toLocaleString("id-ID"));
  return (
    <span ref={ref} className={className}>
      {fmt(display)}
    </span>
  );
}
