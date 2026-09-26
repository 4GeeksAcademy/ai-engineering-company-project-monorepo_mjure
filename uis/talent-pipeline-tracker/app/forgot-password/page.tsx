"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AuthLayout } from "@/app/login/page";
import { forgotPassword } from "@/lib/auth-api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState(""); const [sent, setSent] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent) { event.preventDefault(); setLoading(true); setError(""); try { await forgotPassword(email); setSent(true); } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo procesar la solicitud."); } finally { setLoading(false); } }
  return <AuthLayout title="Restablece tu contraseña" subtitle="Te enviaremos un enlace si el email está registrado.">{sent ? <div className="space-y-4"><p role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Si esa dirección está registrada, recibirás un enlace en breve.</p><Link href="/login" className="block text-center text-sm font-semibold text-teal-700">Volver a iniciar sesión</Link></div> : <form onSubmit={submit} className="space-y-4"><label className="block text-sm font-semibold text-slate-700">Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 font-normal outline-none focus:border-teal-600" /></label>{error && <p role="alert" className="text-sm text-rose-700">{error}</p>}<button disabled={loading} className="w-full rounded-lg bg-teal-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{loading ? "Enviando..." : "Enviar enlace"}</button><Link href="/login" className="block text-center text-sm font-semibold text-teal-700">Volver a iniciar sesión</Link></form>}</AuthLayout>;
}