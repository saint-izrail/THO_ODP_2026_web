"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

// Root "/" hanya gerbang masuk: arahkan ke dashboard bila sudah login,
// selain itu ke halaman login.
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(isAuthenticated() ? "/dashboard" : "/login");
  }, [router]);

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-gradient-to-br from-primary/5 via-background to-gold/5 text-muted">
      <span role="status">Memuat...</span>
    </main>
  );
}
