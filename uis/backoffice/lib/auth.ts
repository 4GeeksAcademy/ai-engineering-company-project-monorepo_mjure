// lib/auth.ts
// IMPORTANTE: no estamos creando otro sistema de auth.
// Este helper solamente lee el token que YA guarda tu login actual.
// Si tu proyecto usa otro nombre de key, cambiá solamente TOKEN_STORAGE_KEY.

export const TOKEN_STORAGE_KEY = "access_token";
export const LOGIN_PATH = "/login";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}