// Latar dekoratif: grid titik halus + orb ambient melayang. Murni presentational.
// Tempatkan di dalam container ber-`position: relative; overflow-hidden`.
export function BackgroundFX({
  variant = "default",
}: {
  variant?: "default" | "auth" | "hero";
}) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-60" />
      <div className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-[120px] animate-float-slow" />
      <div className="absolute -bottom-40 -right-24 h-[30rem] w-[30rem] rounded-full bg-gold/10 blur-[130px] animate-float" />
      {variant !== "default" && (
        <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-secondary/10 blur-[120px] animate-float-slow" />
      )}
      {variant === "hero" && (
        <div className="absolute right-1/4 top-10 h-56 w-56 rounded-full bg-primary/10 blur-[110px] animate-glow" />
      )}
    </div>
  );
}
