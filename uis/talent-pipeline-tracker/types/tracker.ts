export type IncidentStatus = "open" | "assigned" | "in_progress" | "resolved" | "closed" | "reopened";
export type IncidentSeverity = "critical" | "high" | "medium" | "low";
export type Incident = {
  id: string;
  warehouse_location: "los_angeles" | "zaragoza" | null;
  client_name: string | null;
  channel: "carrier_portal_alert" | "client_email" | "wms_alert" | "warehouse_call" | "dashboard";
  type: "lost_parcel" | "inventory_discrepancy" | "carrier_failure" | "system_outage" | "return_dispute" | "sla_breach";
  severity: IncidentSeverity;
  responsible_area: "warehouse_operations" | "last_mile_carrier" | "reverse_logistics" | "customer_experience" | "commercial" | "technology";
  title: string;
  description: string;
  status: IncidentStatus;
  assigned_to: string;
  created_at: string;
  updated_at: string;
  audit: AuditEntry[];
};

export type AuditEntry = {
  id: string;
  incident_id: string;
  field: "status" | "assigned_to" | "responsible_area";
  from: string | null;
  to: string;
  author: string;
  created_at: string;
};

export type StatusOption = { value: IncidentStatus; label: string };
export type SeverityOption = { value: IncidentSeverity; label: string; color: string };
export type RecordSummary = Incident;
export type RecordListItem = Incident;

export type RecordsResponse = {
  total: number;
  page: number;
  limit: number;
  data: RecordListItem[];
};

export type IncidentFormValues = Omit<Incident, "id" | "created_at" | "updated_at" | "audit">;

export type AsyncFeedback = {
  tone: "loading" | "success" | "error";
  message: string;
};

export type TrackerFilters = {
  status: string;
  severity: string;
  location: string;
  search: string;
};