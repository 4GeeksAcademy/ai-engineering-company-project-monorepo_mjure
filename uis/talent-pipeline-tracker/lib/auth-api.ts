export const AUTH_TOKEN_KEY = "trackflow-auth-token";
const AUTH_API_BASE = process.env.NEXT_PUBLIC_AUTH_API_BASE ?? "http://localhost:8000";

export type UserProfile = { name?: string | null; phone?: string | null; address?: string | null };
export type CurrentUser = { id?: number | string; email: string; profile?: UserProfile | null; name?: string | null; phone?: string | null; address?: string | null };
type ApiError = Error & { status?: number };

function getToken() { return typeof window === "undefined" ? null : window.localStorage.getItem(AUTH_TOKEN_KEY); }
export function storeToken(token: string) { window.localStorage.setItem(AUTH_TOKEN_KEY, token); }
export function clearToken() { window.localStorage.removeItem(AUTH_TOKEN_KEY); }
export function hasToken() { return Boolean(getToken()); }
function redirectToLogin() { if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) window.location.assign("/login"); }

async function request<T>(path: string, init: RequestInit = {}, protectedRequest = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const token = getToken();
  if (protectedRequest && token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${AUTH_API_BASE}${path}`, { ...init, headers });
  if (response.status === 401 && protectedRequest) { clearToken(); redirectToLogin(); }
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string; message?: string } | null;
    const error: ApiError = new Error(body?.detail ?? body?.message ?? "La petición no se pudo completar.");
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function tokenFromResponse(response: { token?: string; access_token?: string }) {
  const token = response.token ?? response.access_token;
  if (!token) throw new Error("La API no devolvió un token de sesión.");
  return token;
}

export async function login(email: string, password: string) {
  const response = await request<{ token?: string; access_token?: string }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }, false);
  const token = tokenFromResponse(response); storeToken(token); return token;
}
export async function register(payload: { email: string; password: string; name?: string; phone?: string; address?: string }) {
  await request("/users", { method: "POST", body: JSON.stringify(payload) }, false);
  return login(payload.email, payload.password);
}
export function getCurrentUser() { return request<CurrentUser>("/auth/me"); }
export function updateProfile(profile: UserProfile) { return request<UserProfile>("/profiles/me", { method: "PUT", body: JSON.stringify(profile) }); }
export function logout() { clearToken(); redirectToLogin(); }