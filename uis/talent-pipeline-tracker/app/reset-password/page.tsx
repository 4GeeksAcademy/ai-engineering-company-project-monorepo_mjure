"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AuthLayout } from "@/app/login/page";
import { resetPassword } from "@/lib/auth-api";

export default function ResetPasswordPage() {
  const [token] = useState(() => typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("token") ?? "" : ""); const [password, setPassword] = useState(""); const [confirmation, setConfirmation] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setError(""); if (!token) { setError("El enlace de restablecimiento no es válido."); return; } if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; } if (password !== confirmation) { setError("Las contraseñas no coinciden."); return; } setLoading(true); try { await resetPassword(token, password); window.location.assign("/login?reset=success"); } catch (reason) { setError(reason instanceof Error ? reason.message : "El enlace no es válido o ha expirado."); } finally { setLoading(false); } }
  return <AuthLayout title="Nueva contraseña" subtitle="Elige una contraseña nueva para tu cuenta."><form onSubmit={submit} className="space-y-4"><PasswordField label="Nueva contraseña" value={password} onChange={setPassword} /><PasswordField label="Confirmar contraseña" value={confirmation} onChange={setConfirmation} />{error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}<button disabled={loading} className="w-full rounded-lg bg-teal-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{loading ? "Guardando..." : "Guardar contraseña"}</button><Link href="/forgot-password" className="block text-center text-sm font-semibold text-teal-700">Solicitar otro enlace</Link></form></AuthLayout>;
}
function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block text-sm font-semibold text-slate-700">{label}<input type="password" required minLength={6} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 font-normal outline-none focus:border-teal-600" /></label>; }