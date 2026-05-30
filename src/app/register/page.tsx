import Link from "next/link";
import { RegisterForm } from "@/components/register-form";
import { ApiStatusPill } from "@/components/api-status-pill";
import { BackgroundFX } from "@/components/background-fx";
import { BrandMark } from "@/components/brand-mark";
import { Reveal } from "@/components/reveal";

export default function RegisterPage() {
  return (
    <main className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden p-4 md:p-8">
      {/* Ambiance latar penuh */}
      <BackgroundFX variant="auth" />

      <div className="relative z-10 flex w-full max-w-[460px] flex-col items-center py-8">
        <Reveal className="w-full">
          <div className="ring-glow w-full rounded-[2rem] border border-edge bg-surface/90 p-8 shadow-ambient-xl backdrop-blur-2xl md:p-11">
            <div className="mb-8 flex flex-col items-center text-center">
              <BrandMark size="lg" withText={false} />
              <h1 className="gold-text mt-5 text-2xl font-bold tracking-tight">Buat Akun Baru</h1>
              <p className="mt-2 max-w-xs text-sm text-muted">
                Mulai perjalanan menabung untuk ibadah haji Anda
              </p>
              <div className="divider-gold mt-6 w-full" />
            </div>

            <RegisterForm />

            <p className="mt-6 text-center text-sm text-muted">
              Sudah memiliki akun?{" "}
              <Link href="/login" className="font-semibold text-primary-deep transition-colors hover:text-primary-dark">
                Masuk
              </Link>
            </p>
          </div>
        </Reveal>

        <div className="mt-7">
          <ApiStatusPill />
        </div>
      </div>
    </main>
  );
}
