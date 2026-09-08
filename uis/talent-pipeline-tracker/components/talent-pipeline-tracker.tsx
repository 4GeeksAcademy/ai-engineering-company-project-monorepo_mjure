"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createRecord, deleteRecord, fetchRecords, updateIncident } from "@/lib/tracker-api";
import { CATALOGS, EMPTY_FORM, SEVERITY_OPTIONS, STATUS_OPTIONS } from "@/lib/tracker-config";
import { FeedbackBanner } from "@/components/tracker-ui";
import type { AsyncFeedback, Incident, IncidentFormValues, TrackerFilters } from "@/types/tracker";

const labels: Record<string, string> = {
  los_angeles: "Los Ángeles", zaragoza: "Zaragoza", open: "Abierta", assigned: "Asignada", in_progress: "En curso", resolved: "Resuelta", closed: "Cerrada", reopened: "Reabierta", critical: "Crítica", high: "Alta", medium: "Media", low: "Baja",
  lost_parcel: "Paquete perdido", inventory_discrepancy: "Discrepancia de inventario", carrier_failure: "Fallo de transportista", system_outage: "Caída de sistema", return_dispute: "Disputa de devolución", sla_breach: "Incumplimiento SLA", carrier_portal_alert: "Alerta del portal", client_email: "Email del cliente", wms_alert: "Alerta WMS", warehouse_call: "Llamada de almacén", dashboard: "Backoffice", warehouse_operations: "Operaciones de almacén", last_mile_carrier: "Última milla", reverse_logistics: "Logística inversa", customer_experience: "Experiencia cliente", commercial: "Comercial", technology: "Tecnología", status: "Estado", assigned_to: "Responsable", responsible_area: "Área",
};
const initialFilters: TrackerFilters = { status: "", severity: "", location: "", search: "" };

export function TalentPipelineTracker({ initialRecordId }: { initialRecordId?: string | null }) {
  const [records, setRecords] = useState<Incident[]>([]);
  const [selected, setSelected] = useState<Incident | null>(null);
  const [filters, setFilters] = useState(initialFilters);
  const [form, setForm] = useState<IncidentFormValues>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [listFeedback, setListFeedback] = useState<AsyncFeedback>({ tone: "loading", message: "Cargando incidencias..." });
  const [actionFeedback, setActionFeedback] = useState<AsyncFeedback>({ tone: "success", message: "Listo." });
  const [retryAction, setRetryAction] = useState<"save" | "change" | "remove" | null>(null);
  const [retryChange, setRetryChange] = useState<{ field: "status" | "assigned_to" | "responsible_area"; value: string } | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const loading = listLoading;

  const refresh = useCallback(async (preferredId?: string) => {
    setListLoading(true);
    setListFeedback({ tone: "loading", message: "Cargando incidencias..." });
    let response;
    try {
      response = await fetchRecords(filters);
    } catch {
      setListFeedback({ tone: "error", message: "No se pudieron cargar las incidencias." });
      return;
    } finally {
      setListLoading(false);
    }
    setRecords(response.data);
    setSelected(response.data.find((item) => item.id === preferredId) ?? response.data[0] ?? null);
    setListFeedback({ tone: "success", message: "Incidencias actualizadas." });
  }, [filters]);
  useEffect(() => {
    async function loadRecords() {
      await refresh(initialRecordId ?? undefined);
    }
    void loadRecords();
  }, [initialRecordId, refresh]);
  function updateFilter(key: keyof TrackerFilters, value: string) { setFilters((current) => ({ ...current, [key]: value })); }
  function openCreate() { setSelected(null); setForm(EMPTY_FORM); setShowForm(true); setActionFeedback({ tone: "success", message: "Listo para registrar una incidencia." }); }
  function openEdit() { if (selected) { setForm({ ...selected, client_name: selected.client_name ?? "", assigned_to: selected.assigned_to ?? "" }); setShowForm(true); } }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (actionLoading) return;
    setRetryAction(null);
    setActionLoading(true);
    setActionFeedback({ tone: "loading", message: "Guardando incidencia..." });
    let saved: Incident;
    try {
      saved = selected ? await updateIncident(selected.id, form) : await createRecord(form);
    } catch {
      setActionFeedback({ tone: "error", message: "No se pudo guardar la incidencia." });
      setRetryAction("save");
      return;
    } finally {
      setActionLoading(false);
    }
    setShowForm(false);
    setActionFeedback({ tone: "success", message: "Incidencia guardada correctamente." });
    await refresh(saved.id);
  }
  async function change(field: "status" | "assigned_to" | "responsible_area", value: string) {
    if (!selected || actionLoading) return;
    setRetryAction(null);
    setRetryChange({ field, value });
    setActionLoading(true);
    setActionFeedback({ tone: "loading", message: "Registrando cambio..." });
    let updated: Incident;
    try {
      updated = await updateIncident(selected.id, { [field]: value });
    } catch {
      setActionFeedback({ tone: "error", message: "No se pudo actualizar la incidencia." });
      setRetryAction("change");
      return;
    } finally {
      setActionLoading(false);
    }
    setSelected(updated);
    setRecords((items) => items.map((item) => item.id === updated.id ? updated : item));
    setActionFeedback({ tone: "success", message: "Cambio registrado en auditoría." });
  }
  async function remove() {
    if (!selected || actionLoading || !window.confirm("¿Eliminar esta incidencia?")) return;
    setRetryAction(null);
    setActionLoading(true);
    setActionFeedback({ tone: "loading", message: "Eliminando incidencia..." });
    try {
      await deleteRecord(selected.id);
    } catch {
      setActionFeedback({ tone: "error", message: "No se pudo eliminar la incidencia." });
      setRetryAction("remove");
      return;
    } finally {
      setActionLoading(false);
    }
    setSelected(null);
    setActionFeedback({ tone: "success", message: "Incidencia eliminada correctamente." });
    await refresh();
  }
  const counts = SEVERITY_OPTIONS.map((option) => ({ ...option, count: records.filter((record) => record.severity === option.value && !["closed", "resolved"].includes(record.status)).length }));

  return <main className="min-h-screen px-4 py-6 sm:px-8 lg:px-12"><div className="mx-auto max-w-[1440px] space-y-6">
    <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-700">TrackFlow Tech / Operaciones</p><h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">Centro de incidencias</h1><p className="mt-2 max-w-2xl text-sm text-slate-500">Una vista compartida para detectar riesgo, asignar responsables y justificar cada decisión operativa.</p></div><button onClick={openCreate} className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-900/15 hover:bg-teal-800">+ Registrar incidencia</button></header>
      <div className="flex flex-wrap items-center gap-3">
        <FeedbackBanner feedback={listFeedback} className="flex-1" />
        {listFeedback.tone === "error" && <button onClick={() => void refresh(selected?.id ?? initialRecordId ?? undefined)} className="rounded-lg border border-rose-300 px-4 py-3 text-sm font-semibold text-rose-800">Reintentar</button>}
      </div>
      <FeedbackBanner
        feedback={actionFeedback}
        actionLabel={retryAction === "save" ? "Volver al formulario" : retryAction ? "Reintentar" : undefined}
        onAction={retryAction === "save" ? () => setShowForm(true) : retryAction === "change" && retryChange ? () => void change(retryChange.field, retryChange.value) : retryAction === "remove" ? () => void remove() : undefined}
      />
    <section className="grid gap-3 md:grid-cols-4">{counts.map((item) => <div key={item.value} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><span className={`h-2.5 w-2.5 rounded-full ${item.color}`} /><span className="text-2xl font-semibold text-slate-950">{item.count}</span></div><p className="mt-3 text-sm font-medium text-slate-600">{item.label}</p><p className="text-xs text-slate-400">Abiertas o en curso</p></div>)}</section>
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]"><div className="min-w-0 rounded-2xl border border-slate-200 bg-white"><div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[1fr_170px_170px_170px]"><input value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} placeholder="Buscar incidencia..." className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-600" />{([["severity", "Severidad"], ["status", "Estado"], ["location", "Almacén"]] as const).map(([key, label]) => <select key={key} value={filters[key]} onChange={(event) => updateFilter(key, event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"><option value="">{label}: Todas</option>{(key === "severity" ? SEVERITY_OPTIONS : key === "status" ? STATUS_OPTIONS : CATALOGS.locations).map((option) => { const value = typeof option === "string" ? option : option.value; return <option key={value} value={value}>{labels[value] ?? (typeof option === "string" ? option : option.label)}</option>; })}</select>)}</div><div className="divide-y divide-slate-100">{loading ? <p className="p-8 text-sm text-slate-500">Cargando incidencias...</p> : records.length === 0 ? <p className="p-8 text-sm text-slate-500">No hay incidencias con estos filtros.</p> : records.map((record) => <button key={record.id} onClick={() => setSelected(record)} className={`block w-full p-5 text-left hover:bg-slate-50 ${selected?.id === record.id ? "border-l-4 border-teal-600 bg-teal-50/40" : "border-l-4 border-transparent"}`}><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs text-slate-400">{record.id}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">{labels[record.status]}</span><span className="text-xs text-slate-400">{labels[record.warehouse_location ?? ""] ?? "Global"}</span></div><h2 className="mt-2 font-semibold text-slate-900">{record.title}</h2><p className="mt-1 line-clamp-1 text-sm text-slate-500">{record.description}</p></button>)}</div></div>
    <aside className="rounded-2xl border border-slate-200 bg-slate-950 text-white">{selected ? <div className="flex h-full flex-col"><div className="border-b border-white/10 p-6"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs text-teal-300">{selected.id}</p><h2 className="mt-2 text-xl font-semibold">{selected.title}</h2></div><button onClick={remove} className="text-xs text-slate-400 hover:text-rose-300">Eliminar</button></div><p className="mt-4 text-sm leading-6 text-slate-300">{selected.description}</p></div><div className="grid gap-3 p-6 sm:grid-cols-2 xl:grid-cols-1"><Detail label="Severidad" value={labels[selected.severity]} /><Detail label="Tipo / canal" value={`${labels[selected.type]} · ${labels[selected.channel]}`} /><Detail label="Almacén / cliente" value={`${labels[selected.warehouse_location ?? ""] ?? "Global"} · ${selected.client_name ?? "Interno"}`} /><Detail label="Área responsable" value={labels[selected.responsible_area]} /></div><div className="space-y-3 border-t border-white/10 p-6"><label className="block text-xs font-semibold uppercase tracking-widest text-slate-400">Estado<select value={selected.status} onChange={(event) => void change("status", event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"><option className="text-slate-900" value="open">Abierta</option>{STATUS_OPTIONS.slice(1).map((option) => <option className="text-slate-900" key={option.value} value={option.value}>{option.label}</option>)}</select></label><label className="block text-xs font-semibold uppercase tracking-widest text-slate-400">Responsable<input value={selected.assigned_to} onChange={(event) => void change("assigned_to", event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white" /></label><button onClick={openEdit} className="w-full rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/10">Editar incidencia</button></div><div className="flex-1 border-t border-white/10 p-6"><h3 className="text-sm font-semibold">Historial de auditoría</h3>{selected.audit.length === 0 ? <p className="mt-3 text-xs text-slate-400">Sin cambios registrados todavía.</p> : <div className="mt-3 space-y-3">{selected.audit.slice().reverse().map((entry) => <div key={entry.id} className="border-l border-teal-400 pl-3 text-xs"><p className="font-medium text-slate-200">{labels[entry.field] ?? entry.field}: {labels[entry.from ?? ""] ?? entry.from ?? "vacío"} → {labels[entry.to] ?? entry.to}</p><p className="mt-1 text-slate-500">{entry.author} · {new Date(entry.created_at).toLocaleString("es-ES")}</p></div>)}</div>}</div></div> : <div className="flex min-h-[420px] items-center justify-center p-8 text-center text-sm text-slate-400">Selecciona una incidencia para ver su detalle y trazabilidad.</div>}</aside></section>
    {showForm && <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-950/40 p-4"><form id="incident-form" onSubmit={submit} className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">{selected ? "Editar incidencia" : "Registrar incidencia"}</h2><button type="button" onClick={() => setShowForm(false)} className="text-2xl text-slate-400">×</button></div><div className="grid gap-4 md:grid-cols-2"><Field label="Título" value={form.title} required onChange={(value) => setForm({ ...form, title: value })} /><Field label="Cliente (opcional)" value={form.client_name ?? ""} onChange={(value) => setForm({ ...form, client_name: value })} /><Field label="Descripción" value={form.description} required onChange={(value) => setForm({ ...form, description: value })} /><Field label="Responsable" value={form.assigned_to} required onChange={(value) => setForm({ ...form, assigned_to: value })} />{(["type", "channel", "severity", "responsible_area", "warehouse_location"] as const).map((key) => <label key={key} className="text-xs font-semibold uppercase tracking-widest text-slate-500">{key.replaceAll("_", " ")}<select value={form[key] ?? ""} required={key !== "warehouse_location"} onChange={(event) => setForm({ ...form, [key]: event.target.value } as IncidentFormValues)} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal normal-case text-slate-800"><option value="">{key === "warehouse_location" ? "Global / sin almacén" : "Selecciona..."}</option>{(key === "type" ? CATALOGS.types : key === "channel" ? CATALOGS.channels : key === "responsible_area" ? CATALOGS.areas : key === "severity" ? SEVERITY_OPTIONS : CATALOGS.locations).map((option) => { const value = typeof option === "string" ? option : option.value; return <option key={value} value={value}>{labels[value] ?? (typeof option === "string" ? option : option.label)}</option>; })}</select></label>)}</div><div className="flex justify-end gap-3"><button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2 text-sm text-slate-600">Cancelar</button><button className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-semibold text-white">Guardar</button></div></form></div>}
  </div></main>;
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) { return <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}<input required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal normal-case text-slate-800" /></label>; }
function Detail({ label, value }: { label: string; value?: string | null }) { return <div><p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</p><p className="mt-1 text-sm text-slate-200">{value || "Sin especificar"}</p></div>; }