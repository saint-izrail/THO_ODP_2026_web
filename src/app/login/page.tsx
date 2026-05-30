import { LoginForm } from "@/components/login-form";
import { ApiStatusPill } from "@/components/api-status-pill";

function MosqueLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
      <path d="M3 21h18" />
      <path d="M5 21v-8" />
      <path d="M19 21v-8" />
      <path d="M5 13a7 7 0 0 1 14 0" />
      <path d="M12 6V4" />
      <path d="M10.5 21v-3.5a1.5 1.5 0 0 1 3 0V21" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-primary/5 via-background to-gold/5 p-4 md:p-8">
      {/* Orb dekoratif */}
      <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-[100px]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-gold/10 blur-[120px]" />

      <div className="relative z-10 flex w-full max-w-[460px] flex-col items-center">
        {/* Kartu login */}
        <div className="w-full rounded-[2rem] border border-edge bg-surface p-8 shadow-[0_12px_48px_-12px_rgba(0,79,76,0.18)] backdrop-blur-2xl md:p-11">
          {/* Branding */}
          <div className="mb-9 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
              <MosqueLogo />
            </div>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-primary-deep">
              BSI Tabungan Haji
            </h1>
            <p className="mt-2 max-w-xs text-sm text-muted">
              Pintu digital menuju perjalanan spiritual Anda
            </p>
          </div>

          <LoginForm />
        </div>

        {/* Footer status */}
        <div className="mt-7">
          <ApiStatusPill />
        </div>
      </div>
    </main>
  );
}
