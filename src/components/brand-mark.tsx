// Lockup brand: ikon masjid dalam tile + wordmark gradien emas.
import { IconMosque } from "@/components/icons";

export function BrandMark({
  size = "md",
  withText = true,
}: {
  size?: "sm" | "md" | "lg";
  withText?: boolean;
}) {
  const box = size === "lg" ? "h-16 w-16" : size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const icon = size === "lg" ? "h-8 w-8" : size === "sm" ? "h-5 w-5" : "h-6 w-6";
  const title = size === "lg" ? "text-xl" : "text-base";

  return (
    <div className="flex items-center gap-3">
      <div
        className={`relative flex ${box} shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary`}
      >
        <span aria-hidden className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
        <IconMosque className={icon} />
      </div>
      {withText && (
        <div className="leading-tight">
          <p className={`font-extrabold gold-text ${title}`}>BSI Tabungan Haji</p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Digital Sanctuary</p>
        </div>
      )}
    </div>
  );
}
