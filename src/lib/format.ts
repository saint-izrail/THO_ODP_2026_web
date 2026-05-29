// Format angka (string dari BigInt backend atau number) ke Rupiah.
export function formatRupiah(value: string | number): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

// Perkiraan tahun Hijriah dari tahun Masehi (approksimasi: rasio 33/32).
export function toHijri(gregorianYear: number): number {
  return Math.round((gregorianYear - 622) * 1.0307);
}

// Format tanggal ISO ke format Indonesia (mis. "29 Mei 2026, 08:15").
export function formatTanggal(iso: string, withTime = true): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const opts: Intl.DateTimeFormatOptions = withTime
    ? { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "numeric", month: "long", year: "numeric" };
  return new Intl.DateTimeFormat("id-ID", opts).format(d);
}
