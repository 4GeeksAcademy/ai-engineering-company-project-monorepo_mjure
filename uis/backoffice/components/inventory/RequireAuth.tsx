"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { getAuthToken, LOGIN_PATH } from "@/lib/auth";

function subscribeToAuthToken(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getServerAuthToken() {
  return null;
}

export default function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const token = useSyncExternalStore(
    subscribeToAuthToken,
    getAuthToken,
    getServerAuthToken
  );

  useEffect(() => {
    if (!token) {
      router.replace(LOGIN_PATH);
    }
  }, [router, token]);

  if (!token) {
    return <p>Verificando sesión...</p>;
  }

  return <>{children}</>;
}