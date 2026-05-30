"use client";

// Tombol ganti tema (light <-> dark), mengambang di setiap halaman.
// Tema disimpan di localStorage["theme"] dan diterapkan ke <html data-theme>.
// Penerapan awal dilakukan oleh skrip inline di layout (sebelum paint) agar
// tidak ada kedipan; komponen ini hanya menyinkronkan state tombol + toggle.
import { useEffect, useState } from "react";
import { IconSun, IconMoon } from "@/components/icons";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const current = (document.documentElement.dataset.theme as Theme) || "dark";
    setTheme(current);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* localStorage tak tersedia — abaikan */
    }
    setTheme(next);
  }

  const toDark = theme === "light";
  const label = toDark ? "Beralih ke tema gelap" : "Beralih ke tema terang";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="fixed bottom-5 right-5 z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-edge-strong bg-surface-3 text-primary shadow-lg shadow-primary/20 backdrop-blur-xl transition-all hover:scale-105 hover:bg-surface active:scale-95"
    >
      {toDark ? <IconMoon className="h-5 w-5" /> : <IconSun className="h-5 w-5" />}
    </button>
  );
}
