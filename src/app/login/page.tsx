import { LoginForm } from "@/components/login-form";
import { ApiStatusPill } from "@/components/api-status-pill";
import { BackgroundFX } from "@/components/background-fx";
import { BrandMark } from "@/components/brand-mark";
import { Reveal } from "@/components/reveal";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden p-4 md:p-8">
      {/* Ambiance latar penuh */}
      <BackgroundFX variant="auth" />

      <div className="relative z-10 flex w-full max-w-[460px] flex-col items-center">
        {/* Kartu login */}
        <Reveal className="w-full">
          <div className="ring-glow w-full rounded-[2rem] border border-edge bg-surface/90 p-8 shadow-ambient-xl backdrop-blur-2xl md:p-11">
            {/* Branding */}
            <div className="mb-8 flex flex-col items-center text-center">
              <BrandMark size="lg" withText={false} />
              <h1 className="gold-text mt-5 text-2xl font-bold tracking-tight">
                BSI Tabungan Haji
              </h1>
              <p className="mt-2 max-w-xs text-sm text-muted">
                Pintu digital menuju perjalanan spiritual Anda
              </p>
              <div className="divider-gold mt-6 w-full" />
            </div>

            <LoginForm />
          </div>
        </Reveal>

        {/* Footer status */}
        <div className="mt-7">
          <ApiStatusPill />
        </div>
      </div>
    </main>
  );
}
