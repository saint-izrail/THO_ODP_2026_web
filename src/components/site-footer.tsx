// Footer global — tampil di setiap halaman lewat root layout.
// Copyright jelas terbaca namun tetap kalem (tidak mengganggu konten).
export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-edge bg-surface/40 px-6 py-5 text-center backdrop-blur">
      <p className="text-xs text-muted">
        &copy; 2026{" "}
        <span className="font-semibold text-ink">Farhan Surya Kusuma</span>. All
        Rights Reserved.
      </p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted/60">
        BSI Tabungan Haji · Digital Sanctuary
      </p>
    </footer>
  );
}
