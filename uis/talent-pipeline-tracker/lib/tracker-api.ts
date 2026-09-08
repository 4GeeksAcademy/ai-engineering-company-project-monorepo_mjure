import type { Incident, IncidentFormValues, TrackerFilters } from "@/types/tracker";

const STORAGE_KEY = "trackflow-incidents-v1";

const seed: Incident[] = [
  ["WMS detenido en recepción", "WMS no disponible durante la ventana de mayor volumen.", "system_outage", "critical", "los_angeles", "wms_alert", "technology", "Andrés Kim", "open"],
  ["Volumen de recogida no atendido", "El transportista no recogió 420 paquetes de la ruta diaria.", "carrier_failure", "high", "zaragoza", "carrier_portal_alert", "last_mile_carrier", "Carlos Vega", "in_progress"],
  ["Discrepancia SKU-4481", "El recuento físico supera en 18 unidades el inventario registrado.", "inventory_discrepancy", "medium", "los_angeles", "warehouse_call", "warehouse_operations", "Ana Whitfield", "assigned"],
  ["Paquete sin trazabilidad", "El envío lleva 48 horas sin nuevos eventos.", "lost_parcel", "high", "zaragoza", "client_email", "last_mile_carrier", "Carlos Vega", "open"],
  ["Devolución disputada por cliente", "La marca solicita revisar la valoración de una devolución.", "return_dispute", "medium", "zaragoza", "client_email", "reverse_logistics", "Sofía Ramos", "resolved"],
  ["Incumplimiento SLA ACME", "La entrega superó el compromiso contratado.", "sla_breach", "critical", "los_angeles", "dashboard", "commercial", "Miguel Torres", "resolved"],
  ["Portal de seguimiento lento", "La visualización del estado tarda más de lo esperado.", "system_outage", "low", null, "dashboard", "technology", "Andrés Kim", "closed"],
  ["Paquete dañado en tránsito", "El cliente recibió el embalaje abierto y el producto dañado.", "carrier_failure", "high", "los_angeles", "client_email", "customer_experience", "Valentina Cruz", "in_progress"],
  ["Conteo cíclico pendiente", "El SKU-902 requiere una segunda verificación física.", "inventory_discrepancy", "low", "zaragoza", "wms_alert", "warehouse_operations", "Ana Whitfield", "assigned"],
  ["Ruta SEUR retrasada", "La ruta de última milla acumula retraso por incidencia local.", "carrier_failure", "medium", "zaragoza", "carrier_portal_alert", "last_mile_carrier", "Carlos Vega", "reopened"],
  ["Regla de devolución incorrecta", "La aprobación automática aplicó una política antigua.", "return_dispute", "medium", "los_angeles", "dashboard", "reverse_logistics", "Sofía Ramos", "open"],
  ["Dirección de entrega inválida", "La marca solicita corregir la dirección antes de expedir.", "sla_breach", "low", "los_angeles", "client_email", "customer_experience", "Valentina Cruz", "open"],
].map((item, index) => {
  const now = new Date(Date.now() - (12 - index) * 3600000).toISOString();
  const id = `INC-${String(index + 1).padStart(4, "0")}`;
  const [title, description, type, severity, warehouse_location, channel, responsible_area, assigned_to, status] = item;
  return {
    id, title, description, type, severity, warehouse_location, channel, responsible_area, assigned_to, status,
    client_name: index === 6 ? null : "ACME Commerce", created_at: now, updated_at: now,
    audit: status === "reopened" ? [{ id: `${id}-AUD-1`, incident_id: id, field: "status" as const, from: "resolved", to: "reopened", author: assigned_to, created_at: now }] : [],
  } as Incident;
});

function read(): Incident[] {
  if (typeof window === "undefined") return seed;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return seed;
    return parsed.map((record) => ({
      ...record,
      assigned_to: record?.assigned_to ?? "",
      audit: Array.isArray(record?.audit) ? record.audit : [],
    })) as Incident[];
  } catch {
    return seed;
  }
}

function write(records: Incident[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    throw new Error("No se pudieron guardar los cambios.");
  }
}

export async function fetchRecords(filters: TrackerFilters) {
  const data = read().filter((record) => {
    const matchesSearch = !filters.search || `${record.title} ${record.description} ${record.client_name ?? ""}`.toLowerCase().includes(filters.search.toLowerCase());
    return matchesSearch && (!filters.status || record.status === filters.status) && (!filters.severity || record.severity === filters.severity) && (!filters.location || record.warehouse_location === filters.location);
  }).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  return { total: data.length, page: 1, limit: 200, data };
}

export async function fetchRecordDetail(id: string) {
  const record = read().find((item) => item.id === id);
  if (!record) throw new Error("Incidencia no encontrada.");
  return { record };
}

export async function createRecord(body: IncidentFormValues) {
  const now = new Date().toISOString();
  const record = { ...body, id: `INC-${Date.now()}`, client_name: body.client_name || null, created_at: now, updated_at: now, audit: [] } as Incident;
  write([record, ...read()]);
  return record;
}

export async function updateIncident(id: string, changes: Partial<IncidentFormValues>, author = "Operaciones") {
  const records = read();
  const current = records.find((item) => item.id === id);
  if (!current) throw new Error("Incidencia no encontrada.");
  if (changes.status === "closed" && current.severity === "critical" && current.status !== "resolved") throw new Error("Una incidencia crítica debe pasar por resuelta antes de cerrarse.");
  const now = new Date().toISOString();
  const audit = [...current.audit];
  for (const field of ["status", "assigned_to", "responsible_area"] as const) {
    if (changes[field] !== undefined && changes[field] !== current[field]) audit.push({ id: `${id}-${field}-${Date.now()}`, incident_id: id, field, from: current[field], to: changes[field] as string, author, created_at: now });
  }
  const updated = { ...current, ...changes, updated_at: now, audit } as Incident;
  write(records.map((item) => item.id === id ? updated : item));
  return updated;
}

export async function deleteRecord(id: string) {
  write(read().filter((item) => item.id !== id));
}