export type IncidentStatus = "open" | "assigned" | "in_progress" | "resolved" | "closed" | "reopened";
export type IncidentSeverity = "critical" | "high" | "medium" | "low";
export type IncidentLocation = "los_angeles" | "zaragoza";
export type IncidentChannel = "carrier_portal_alert" | "client_email" | "wms_alert" | "warehouse_call" | "dashboard";
export type IncidentType = "lost_parcel" | "inventory_discrepancy" | "carrier_failure" | "system_outage" | "return_dispute" | "sla_breach";
export type ResponsibleArea = "warehouse_operations" | "last_mile_carrier" | "reverse_logistics" | "customer_experience" | "commercial" | "technology";

export interface IncidentAuditEntry {
  id: string;
  incident_id: string;
  field: "status" | "assigned_to" | "responsible_area";
  from: string | null;
  to: string;
  author: string;
  created_at: string;
}

export interface Incident {
  id: string;
  warehouse_location: IncidentLocation | null;
  client_name: string | null;
  channel: IncidentChannel;
  type: IncidentType;
  severity: IncidentSeverity;
  responsible_area: ResponsibleArea;
  title: string;
  description: string;
  status: IncidentStatus;
  assigned_to: string;
  created_at: string;
  updated_at: string;
  audit: IncidentAuditEntry[];
}

export type Id = string;