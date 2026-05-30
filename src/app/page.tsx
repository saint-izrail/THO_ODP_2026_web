"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { Reveal } from "@/components/reveal";
import { AnimatedCounter } from "@/components/animated-counter";
import { BackgroundFX } from "@/components/background-fx";
import { BrandMark } from "@/components/brand-mark";
import {
  IconShield,
  IconClock,
  IconCoins,
  IconGlobe,
  IconArrowRight,
  IconSparkle,
} from "@/components/icons";

// Root "/" adalah gerbang sekaligus etalase: nasabah yang sudah login langsung
// diarahkan ke dashboard; pengunjung lain disambut hero marketing penuh.
const FEATURES = [
  {
    icon: IconShield,
    title: "Aman & Syariah",
    desc: "Dikelola sesuai prinsip syariah dengan keamanan berlapis dan transparansi penuh.",
  },
  {
    icon: IconClock,
    title: "Estimasi Keberangkatan",
    desc: "Pantau perkiraan tahun keberangkatan Anda seiring saldo terus bertumbuh.",
  },
  {
    icon: IconCoins,
    title: "Setoran Fleksibel",
    desc: "Menabung kapan saja dengan nominal sesuai kemampuan, tanpa beban.",
  },
  {
    icon: IconGlobe,
    title: "Akses Di Mana Saja",
    desc: "Kelola tabungan haji Anda dari genggaman, 24 jam tanpa henti.",
  },
] as const;

const STATS = [
  { value: 250000, format: (n: number) => `${n.toLocaleString("id-ID")}+`, label: "Jamaah Terpercaya" },
  { value: 99, format: (n: number) => `${Math.round(n)}%`, label: "Kepuasan Nasabah" },
  { value: 24, format: (n: number) => `${Math.round(n)}/7`, label: "Layanan Digital" },
] as const;

export default function Home() {
  const router = useRouter();
  // "checked" mencegah hero berkedip sekilas bagi pengguna yang sudah login.
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/dashboard");
      return;
    }
    setChecked(true);
  }, [router]);

  // Selama pengecekan sesi (atau saat mengalihkan ke dashboard): loader minimal.
  if (!checked) {
    return (
      <main className="flex min-h-screen flex-1 items-center justify-center bg-gradient-to-br from-primary/5 via-background to-gold/5 text-muted">
        <span
          role="status"
          aria-live="polite"
          className="inline-flex items-center gap-3 text-sm tracking-wide"
        >
          <span
            aria-hidden
            className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
          />
          Memuat...
        </span>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-1 flex-col overflow-hidden bg-gradient-to-br from-primary/5 via-background to-gold/5">
      <BackgroundFX variant="hero" />

      {/* HERO */}
      <section className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-6 pt-16 pb-12 text-center md:pt-24">
        <Reveal>
          <div className="flex justify-center">
            <BrandMark size="lg" />
          </div>
        </Reveal>

        <Reveal delay={90}>
          <span className="mt-9 inline-flex items-center gap-2 rounded-full border border-edge bg-surface-2 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted backdrop-blur">
            <IconSparkle className="h-3.5 w-3.5 text-primary" />
            Tabungan Haji Digital
          </span>
        </Reveal>

        <Reveal delay={160}>
          <h1 className="mt-7 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-5xl md:text-6xl">
            Wujudkan Langkah ke <span className="gold-text">Baitullah</span>
          </h1>
        </Reveal>

        <Reveal delay={230}>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted md:text-lg">
            Mulai perjalanan spiritual Anda dengan tenang. Menabung untuk haji
            kini lebih mudah, aman, dan penuh berkah, dalam satu sanctuary digital.
          </p>
        </Reveal>

        <Reveal delay={300}>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="btn-shine ring-glow group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-dark px-7 py-3.5 text-base font-semibold text-on-accent shadow-lg shadow-primary/25 transition-all hover:bg-primary-deep hover:shadow-primary/35 active:scale-[0.98] sm:w-auto"
            >
              Buka Rekening
              <IconArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-edge-strong bg-surface px-7 py-3.5 text-base font-semibold text-ink backdrop-blur transition-all hover:bg-surface-2 hover:border-primary/30 active:scale-[0.98] sm:w-auto"
            >
              Masuk
            </Link>
          </div>
        </Reveal>

        {/* FITUR */}
        <div className="mt-20 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={120 + i * 90}>
                <article className="hover-lift group h-full rounded-2xl border border-edge bg-surface p-6 text-left shadow-ambient-lg backdrop-blur-xl">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-base font-bold text-ink">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{f.desc}</p>
                </article>
              </Reveal>
            );
          })}
        </div>

        {/* STATS / TRUST STRIP */}
        <Reveal delay={140}>
          <div className="mt-16 w-full max-w-3xl">
            <div className="divider-gold mx-auto mb-8 h-px w-40" />
            <dl className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {STATS.map((s) => (
                <div key={s.label} className="flex flex-col items-center">
                  <dt className="sr-only">{s.label}</dt>
                  <dd>
                    <AnimatedCounter
                      value={s.value}
                      format={s.format}
                      className="gold-text text-3xl font-extrabold md:text-4xl"
                    />
                  </dd>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted">
                    {s.label}
                  </p>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
