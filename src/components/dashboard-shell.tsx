"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { getUser, clearSession } from "@/lib/auth";
import type { ApiUser } from "@/lib/api";
import { BrandMark } from "@/components/brand-mark";
import {
  IconDashboard,
  IconWallet,
  IconReceipt,
  IconPerson,
  IconChart,
  IconSupport,
  IconLogout,
  IconSearch,
  IconBell,
  IconSettings,
  IconUsers,
} from "@/components/icons";

const NAV = [
  { label: "Dashboard", icon: IconDashboard, href: "/dashboard" },
  { label: "Tabungan", icon: IconWallet, href: "/dashboard/tabungan" },
  { label: "Mutasi", icon: IconReceipt, href: "/dashboard/mutasi" },
  { label: "Laporan", icon: IconChart, href: "/dashboard/laporan" },
  { label: "Data Nasabah", icon: IconUsers, href: "/dashboard/nasabah" },
  { label: "Profil", icon: IconPerson, href: "/dashboard/profil" },
];

function initials(nama: string): string {
  const parts = nama.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<ApiUser | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      const u = getUser();
      if (!u) {
        router.replace("/login");
        return;
      }
      setUser(u);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  if (!user) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen flex-1 items-center justify-center text-muted"
      >
        Memuat...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background md:flex-row">
      {/* Header mobile */}
      <header className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-edge bg-surface px-5 py-4 shadow-sm backdrop-blur-md md:hidden">
        <span className="text-lg font-bold text-primary-deep">BSI Tabungan Haji</span>
        <button onClick={handleLogout} aria-label="Keluar" className="text-primary-deep">
          <IconLogout className="h-5 w-5" />
        </button>
      </header>

      {/* Sidebar desktop */}
      <nav aria-label="Navigasi utama" className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col gap-8 border-r border-edge bg-surface p-6 shadow-xl shadow-primary/5 backdrop-blur-2xl md:flex">
        <div>
          <BrandMark size="md" />
          <div className="divider-gold mt-5" />
          <Link href="/dashboard/tabungan" className="btn-shine ring-glow hover-lift mt-5 flex w-full items-center justify-center rounded-xl bg-primary-dark py-2.5 text-sm font-semibold text-on-accent shadow-md shadow-primary/20 transition-all hover:bg-primary-deep">
            Buka Rekening Baru
          </Link>
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "group relative flex items-center gap-3 rounded-xl bg-primary-dark px-4 py-3 text-sm font-semibold text-on-accent shadow-md shadow-primary/20 transition-all duration-300"
                    : "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted transition-all duration-300 hover:translate-x-0.5 hover:bg-primary/5 hover:text-primary-deep"
                }
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gold/80 shadow-[0_0_8px] shadow-gold/40"
                  />
                )}
                <Icon className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                <span>{item.label}</span>
                {active && (
                  <span
                    aria-hidden
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-gold animate-glow"
                  />
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex flex-col gap-1.5 border-t border-edge pt-4">
          <button type="button" title="Segera hadir" className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-muted transition-all hover:bg-primary/5 hover:text-primary-deep">
            <IconSupport className="h-5 w-5" />
            Support
          </button>
          <button type="button" onClick={handleLogout} className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-muted transition-all hover:bg-danger/5 hover:text-danger">
            <IconLogout className="h-5 w-5" />
            Keluar
          </button>
        </div>
      </nav>

      {/* Konten utama */}
      <main className="mx-auto w-full max-w-[1280px] flex-1 p-5 md:ml-64 md:p-12">
        {/* Topbar desktop */}
        <div className="mb-10 hidden items-center justify-between md:flex">
          <span className="text-xl font-bold text-primary-deep">BSI Tabungan Haji</span>
          <div className="flex items-center gap-5">
            <div className="relative">
              <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                <IconSearch className="h-5 w-5" />
              </span>
              <input
                type="text"
                placeholder="Cari..."
                aria-label="Cari"
                className="w-56 rounded-full border border-edge-strong bg-surface py-2 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted focus:border-primary-dark focus:ring-4 focus:ring-primary/15"
              />
            </div>
            <button type="button" aria-label="Notifikasi" className="text-primary-deep transition-colors hover:text-primary-dark">
              <IconBell className="h-5 w-5" />
            </button>
            <button type="button" aria-label="Pengaturan" className="text-primary-deep transition-colors hover:text-primary-dark">
              <IconSettings className="h-5 w-5" />
            </button>
            <div
              aria-label={`Akun: ${user.nama}`}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-dark text-sm font-semibold text-on-accent"
            >
              <span aria-hidden>{initials(user.nama)}</span>
            </div>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
