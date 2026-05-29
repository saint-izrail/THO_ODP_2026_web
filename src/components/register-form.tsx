"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { register, login } from "@/lib/api";
import { saveSession } from "@/lib/auth";

/* Ikon dekoratif */
function Icon({ d, children }: { d?: string; children?: React.ReactNode }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      {d ? <path d={d} /> : children}
    </svg>
  );
}
const UserIcon = () => <Icon><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Icon>;
const IdIcon = () => <Icon><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M7 16a2.5 2.5 0 0 1 5 0M14 10h4M14 14h3" /></Icon>;
const MailIcon = () => <Icon><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Icon>;
const PhoneIcon = () => <Icon d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 12l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />;
const LockIcon = () => <Icon><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Icon>;

function EyeIcon({ off }: { off: boolean }) {
  return off ? (
    <Icon><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></Icon>
  ) : (
    <Icon><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></Icon>
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

type Fields = "nama" | "nik" | "email" | "nomorHp" | "password" | "confirm";
type Errors = Partial<Record<Fields, string>>;

const ORDER: Fields[] = ["nama", "nik", "email", "nomorHp", "password", "confirm"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HP_RE = /^08\d{8,11}$/;

const inputCls =
  "w-full rounded-xl border bg-white/70 py-3.5 pl-12 pr-4 text-base text-ink outline-none transition-all placeholder:text-muted focus:bg-white focus:ring-4 focus:ring-primary/20";

export function RegisterForm() {
  const router = useRouter();
  const [v, setV] = useState({ nama: "", nik: "", email: "", nomorHp: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [topError, setTopError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  function set(field: Fields, value: string) {
    setV((s) => ({ ...s, [field]: value }));
    // Bersihkan error field begitu pengguna mengoreksi (aria-invalid/border ikut hilang)
    setErrors((e) => {
      if (!e[field]) return e;
      const n = { ...e };
      delete n[field];
      return n;
    });
  }

  function validate(): Errors {
    const e: Errors = {};
    const nama = v.nama.trim();
    const email = v.email.trim();
    if (nama.length < 3) e.nama = "Nama minimal 3 karakter.";
    else if (nama.length > 100) e.nama = "Nama maksimal 100 karakter.";
    if (!/^\d{16}$/.test(v.nik.trim())) e.nik = "NIK harus tepat 16 digit angka.";
    if (!EMAIL_RE.test(email)) e.email = "Format email tidak valid.";
    else if (email.length > 150) e.email = "Email maksimal 150 karakter.";
    if (!HP_RE.test(v.nomorHp.trim())) e.nomorHp = "Nomor HP harus format 08xxxxxxxxxx (10–13 digit).";
    if (v.password.length < 8) e.password = "Password minimal 8 karakter.";
    else if (v.password.length > 72) e.password = "Password maksimal 72 karakter.";
    if (v.confirm !== v.password) e.confirm = "Konfirmasi password tidak cocok.";
    return e;
  }

  // Pindahkan fokus ke field bermasalah pertama (setelah re-render & input tidak disabled)
  function focusFirstError(errs: Errors) {
    const first = ORDER.find((k) => errs[k]);
    if (first) {
      requestAnimationFrame(() => document.getElementById(first)?.focus());
    }
  }

  async function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setTopError(null);

    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      setTopError("Periksa kembali isian yang ditandai."); // diumumkan via role=alert
      focusFirstError(clientErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    const result = await register({
      nik: v.nik.trim(),
      nama: v.nama.trim(),
      email: v.email.trim(),
      nomorHp: v.nomorHp.trim(),
      password: v.password,
    });

    if (!result.ok) {
      const mapped: Errors = {};
      if (result.fieldErrors) {
        for (const k of ["nama", "nik", "email", "nomorHp", "password"] as const) {
          if (result.fieldErrors[k]?.length) mapped[k] = result.fieldErrors[k][0];
        }
      }
      setErrors(mapped);
      setTopError(result.message);
      setLoading(false);
      focusFirstError(mapped);
      return;
    }

    // Auto-login agar langsung masuk dashboard
    try {
      const session = await login(v.email.trim(), v.password);
      saveSession(session.token, session.user);
      router.push("/dashboard");
    } catch {
      router.push("/login");
    }
  }

  const field = (
    id: Fields,
    label: string,
    icon: React.ReactNode,
    props: React.InputHTMLAttributes<HTMLInputElement>,
    opts?: { hint?: string; rightSlot?: React.ReactNode },
  ) => {
    const err = errors[id];
    const hint = opts?.hint;
    const describedBy = err ? `${id}-err` : hint ? `${id}-hint` : undefined;
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="ml-1 text-sm font-semibold text-ink">{label}</label>
        <div className="group relative">
          <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted/70 transition-colors group-focus-within:text-primary-dark">
            {icon}
          </span>
          <input
            id={id}
            required
            disabled={loading}
            aria-invalid={!!err}
            aria-describedby={describedBy}
            className={`${inputCls} ${opts?.rightSlot ? "pr-12" : ""} ${err ? "border-danger/60 focus:border-danger" : "border-line/70 focus:border-primary-dark"} disabled:opacity-60`}
            {...props}
          />
          {opts?.rightSlot}
        </div>
        {err ? (
          <p id={`${id}-err`} className="ml-1 text-xs text-danger">{err}</p>
        ) : hint ? (
          <p id={`${id}-hint`} className="ml-1 text-xs text-muted">{hint}</p>
        ) : null}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate aria-busy={loading} aria-label="Form pendaftaran akun">
      {field("nama", "Nama Lengkap", <UserIcon />, {
        type: "text", value: v.nama, onChange: (e) => set("nama", e.target.value),
        placeholder: "Nama sesuai KTP", autoComplete: "name", maxLength: 100,
      })}
      {field("nik", "NIK", <IdIcon />, {
        type: "text", inputMode: "numeric", value: v.nik, onChange: (e) => set("nik", e.target.value.replace(/\D/g, "").slice(0, 16)),
        placeholder: "16 digit NIK", autoComplete: "off",
      }, { hint: "16 digit angka sesuai KTP" })}
      {field("email", "Email", <MailIcon />, {
        type: "email", value: v.email, onChange: (e) => set("email", e.target.value),
        placeholder: "nama@email.com", autoComplete: "email", inputMode: "email", maxLength: 150,
      })}
      {field("nomorHp", "Nomor HP", <PhoneIcon />, {
        type: "tel", inputMode: "numeric", value: v.nomorHp, onChange: (e) => set("nomorHp", e.target.value.replace(/\D/g, "").slice(0, 13)),
        placeholder: "08xxxxxxxxxx", autoComplete: "tel",
      }, { hint: "Format 08xxxxxxxxxx (10–13 digit)" })}
      {field("password", "Password", <LockIcon />, {
        type: showPass ? "text" : "password", value: v.password, onChange: (e) => set("password", e.target.value),
        placeholder: "Minimal 8 karakter", autoComplete: "new-password", maxLength: 72,
      }, {
        hint: "Minimal 8 karakter",
        rightSlot: (
          <button type="button" disabled={loading} onClick={() => setShowPass((s) => !s)} aria-label={showPass ? "Sembunyikan password" : "Tampilkan password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted/70 transition-colors hover:bg-primary/5 hover:text-ink disabled:opacity-60">
            <EyeIcon off={!showPass} />
          </button>
        ),
      })}
      {field("confirm", "Konfirmasi Password", <LockIcon />, {
        type: showPass ? "text" : "password", value: v.confirm, onChange: (e) => set("confirm", e.target.value),
        placeholder: "Ulangi password", autoComplete: "new-password", maxLength: 72,
      })}

      {topError && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="mt-0.5 h-4 w-4 shrink-0">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{topError}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-dark py-3.5 px-6 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-deep hover:shadow-primary/35 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? (<><Spinner /> Memproses...</>) : "Daftar Akun"}
      </button>
    </form>
  );
}
