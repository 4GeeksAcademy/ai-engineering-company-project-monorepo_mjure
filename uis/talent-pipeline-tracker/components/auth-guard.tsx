"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, hasToken } from "@/lib/auth-api";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    if (!hasToken()) { window.location.assign("/login"); return () => { active = false; }; }
    void getCurrentUser().then(() => { if (active) setReady(true); }).catch(() => { if (active) window.location.assign("/login"); });
    return () => { active = false; };
  }, []);
  if (!ready) return <main className="flex min-h-screen items-center justify-center text-sm text-slate-500">Comprobando sesión...</main>;
  return children;
}