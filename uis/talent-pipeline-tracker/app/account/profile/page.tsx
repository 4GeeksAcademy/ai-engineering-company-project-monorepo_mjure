"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { clearToken, getCurrentUser, logout, updateProfile, type CurrentUser } from "@/lib/auth-api";
import { AuthGuard } from "@/components/auth-guard";

export default function ProfilePage() {
  return <AuthGuard><ProfileContent /></AuthGuard>;
}

function ProfileContent() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { void getCurrentUser().then((current) => { setUser(current); setForm({ name: current.profile?.name ?? current.name ?? "", phone: current.profile?.phone ?? current.phone ?? "", address: current.profile?.address ?? current.address ?? "" }); }).catch(() => { clearToken(); }); }, []);
  async function submit(event: FormEvent) { event.preventDefault(); setFeedback(""); setError(""); try { const profile = await updateProfile(form); setForm({ name: profile.name ?? "", phone: profile.phone ?? "", address: profile.address ?? "" }); setFeedback("Perfil actualizado correctamente."); } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo actualizar el perfil."); } }
  return <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-8"><div className="mx-auto max-w-2xl"><header className="mb-8 flex items-start justify-between gap-4"><div><Link href="/" className="text-sm font-semibold text-teal-700">← Centro de incidencias</Link><h1 className="mt-4 text-3xl font-semibold text-slate-950">Mi perfil</h1></div><button onClick={logout} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Cerrar sesión</button></header><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Cuenta</p><p className="mt-2 text-lg font-semibold text-slate-900">{user?.email ?? "Cargando..."}</p><form onSubmit={submit} className="mt-8 space-y-4"><ProfileField label="Nombre" value={form.name} onChange={(value) => setForm({ ...form, name: value })} /><ProfileField label="Teléfono" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} /><ProfileField label="Dirección" value={form.address} onChange={(value) => setForm({ ...form, address: value })} />{feedback && <p role="status" className="text-sm text-emerald-700">{feedback}</p>}{error && <p role="alert" className="text-sm text-rose-700">{error}</p>}<div className="flex flex-wrap items-center gap-4"><button className="rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white">Guardar cambios</button><Link href="/account/change-password" className="text-sm font-semibold text-teal-700">Cambiar contraseña</Link></div></form></section></div></main>;
}

function ProfileField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block text-sm font-semibold text-slate-700">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 font-normal outline-none focus:border-teal-600" /></label>; }