import type { IncidentFormValues, SeverityOption, StatusOption } from "@/types/tracker";

export const API_BASE =
  process.env.NEXT_PUBLIC_TRACKER_API_BASE ?? "local-storage";

export const STATUS_OPTIONS: readonly StatusOption[] = [
  { value: "open", label: "Abierta" },
  { value: "assigned", label: "Asignada" },
  { value: "in_progress", label: "En curso" },
  { value: "resolved", label: "Resuelta" },
  { value: "closed", label: "Cerrada" },
  { value: "reopened", label: "Reabierta" },
] as const;

export const SEVERITY_OPTIONS: readonly SeverityOption[] = [
  { value: "critical", label: "Crítica", color: "bg-rose-500" },
  { value: "high", label: "Alta", color: "bg-orange-500" },
  { value: "medium", label: "Media", color: "bg-amber-400" },
  { value: "low", label: "Baja", color: "bg-sky-400" },
] as const;

export const EMPTY_FORM: IncidentFormValues = {
  warehouse_location: "los_angeles",
  client_name: "",
  channel: "dashboard",
  type: "carrier_failure",
  severity: "medium",
  responsible_area: "last_mile_carrier",
  title: "",
  description: "",
  status: "open",
  assigned_to: "",
};

export const CATALOGS = {
  locations: ["los_angeles", "zaragoza"],
  channels: ["carrier_portal_alert", "client_email", "wms_alert", "warehouse_call", "dashboard"],
  types: ["lost_parcel", "inventory_discrepancy", "carrier_failure", "system_outage", "return_dispute", "sla_breach"],
  areas: ["warehouse_operations", "last_mile_carrier", "reverse_logistics", "customer_experience", "commercial", "technology"],
} as const;