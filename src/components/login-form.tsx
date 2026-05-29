"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { saveSession } from "@/lib/auth";

function MailIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return off ? (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  ) : (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg aria-hidden="true" focusable="false" className="h-5 w-5 animate-spin motion-reduce:animate-none" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNotice(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !EMAIL_RE.test(trimmedEmail)) {
      setError("Masukkan alamat email yang valid.");
      return;
    }
    if (!password) {
      setError("Password wajib diisi.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const session = await login(trimmedEmail, password);
      saveSession(session.token, session.user);
      router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  const describedBy = error ? "login-error" : undefined;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate aria-busy={loading} aria-label="Form masuk akun">
      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="ml-1 text-sm font-semibold text-ink">
          Email
        </label>
        <div className="group relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted/70 transition-colors group-focus-within:text-primary-dark">
            <MailIcon />
          </span>
          <input
            id="email"
            type="email"
            required
            disabled={loading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Masukkan alamat email"
            autoComplete="email"
            inputMode="email"
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className="w-full rounded-xl border border-line/70 bg-white/70 py-3.5 pl-12 pr-4 text-base text-ink outline-none transition-all placeholder:text-muted focus:border-primary-dark focus:bg-white focus:ring-4 focus:ring-primary/20 disabled:opacity-60"
          />
        </div>
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="ml-1 text-sm font-semibold text-ink">
            Password
          </label>
          <button
            type="button"
            disabled={loading}
            className="text-xs font-semibold text-primary-deep transition-colors hover:text-primary-dark disabled:opacity-60"
            onClick={() => {
              setError(null);
              setNotice("Untuk reset password, silakan hubungi admin cabang Anda.");
            }}
          >
            Lupa Password?
          </button>
        </div>
        <div className="group relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted/70 transition-colors group-focus-within:text-primary-dark">
            <LockIcon />
          </span>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            disabled={loading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Masukkan password"
            autoComplete="current-password"
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className="w-full rounded-xl border border-line/70 bg-white/70 py-3.5 pl-12 pr-12 text-base text-ink outline-none transition-all placeholder:text-muted focus:border-primary-dark focus:bg-white focus:ring-4 focus:ring-primary/20 disabled:opacity-60"
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted/70 transition-colors hover:bg-primary/5 hover:text-ink disabled:opacity-60"
          >
            <EyeIcon off={!showPassword} />
          </button>
        </div>
      </div>

      {/* Error (diumumkan ke screen reader) */}
      {error && (
        <div id="login-error" role="alert" className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="mt-0.5 h-4 w-4 shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Notice / info (netral) */}
      {notice && !error && (
        <div role="status" className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary-deep">
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="mt-0.5 h-4 w-4 shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="11" x2="12" y2="16" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>{notice}</span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-dark py-3.5 px-6 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-deep hover:shadow-primary/35 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? (
          <>
            <Spinner />
            Memproses...
          </>
        ) : (
          <>
            Masuk
            <ArrowIcon />
          </>
        )}
      </button>

      {/* Register */}
      <p className="mt-1 text-center text-sm text-muted">
        Belum memiliki akun?{" "}
        <Link href="/register" className="font-semibold text-primary-deep transition-colors hover:text-primary-dark">
          Daftar Akun
        </Link>
      </p>
    </form>
  );
}
