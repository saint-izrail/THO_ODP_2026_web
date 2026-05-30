// Copyright global yang selalu terlihat (fixed bawah-tengah).
// pointer-events-none -> tidak pernah menghalangi klik konten di bawahnya.
// Diletakkan di bawah-tengah agar tidak bentrok dgn tombol tema (bawah-kanan).
export function SiteFooter() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-3">
      <p className="rounded-full border border-edge bg-surface/70 px-3.5 py-1 text-[10px] tracking-wide text-muted shadow-sm backdrop-blur-md">
        &copy; 2026{" "}
        <span className="font-semibold text-ink">Farhan Surya Kusuma</span>
        <span className="hidden sm:inline"> · All Rights Reserved</span>
      </p>
    </div>
  );
}
