"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { getAuthToken, LOGIN_PATH } from "@/lib/auth";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getAuthToken();

    if (!token) {
      router.replace(LOGIN_PATH);
      return;
    }

    setReady(true);
  }, [router]);

  if (!ready) {
    return <p>Verificando sesión...</p>;
  }

  return <>{children}</>;
}