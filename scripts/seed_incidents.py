"""Genera el seed portable de incidencias de TrackFlow.

El adaptador de persistencia puede importar el JSON generado sin duplicar IDs.
"""

from datetime import datetime, timezone
import json
from pathlib import Path
import sys

OUTPUT = Path(__file__).resolve().parents[1] / "data" / "incidents.seed.json"

ROWS = [
    ("WMS detenido en recepción", "WMS no disponible durante la ventana de mayor volumen.", "system_outage", "critical", "los_angeles", "wms_alert", "technology", "Andrés Kim", "open"),
    ("Volumen de recogida no atendido", "El transportista no recogió 420 paquetes de la ruta diaria.", "carrier_failure", "high", "zaragoza", "carrier_portal_alert", "last_mile_carrier", "Carlos Vega", "in_progress"),
    ("Discrepancia SKU-4481", "El recuento físico supera en 18 unidades el inventario registrado.", "inventory_discrepancy", "medium", "los_angeles", "warehouse_call", "warehouse_operations", "Ana Whitfield", "assigned"),
    ("Paquete sin trazabilidad", "El envío lleva 48 horas sin nuevos eventos.", "lost_parcel", "high", "zaragoza", "client_email", "last_mile_carrier", "Carlos Vega", "open"),
    ("Devolución disputada por cliente", "La marca solicita revisar la valoración de una devolución.", "return_dispute", "medium", "zaragoza", "client_email", "reverse_logistics", "Sofía Ramos", "resolved"),
    ("Incumplimiento SLA ACME", "La entrega superó el compromiso contratado.", "sla_breach", "critical", "los_angeles", "dashboard", "commercial", "Miguel Torres", "resolved"),
    ("Portal de seguimiento lento", "La visualización del estado tarda más de lo esperado.", "system_outage", "low", None, "dashboard", "technology", "Andrés Kim", "closed"),
    ("Paquete dañado en tránsito", "El cliente recibió el embalaje abierto y el producto dañado.", "carrier_failure", "high", "los_angeles", "client_email", "customer_experience", "Valentina Cruz", "in_progress"),
    ("Conteo cíclico pendiente", "El SKU-902 requiere una segunda verificación física.", "inventory_discrepancy", "low", "zaragoza", "wms_alert", "warehouse_operations", "Ana Whitfield", "assigned"),
    ("Ruta SEUR retrasada", "La ruta de última milla acumula retraso por incidencia local.", "carrier_failure", "medium", "zaragoza", "carrier_portal_alert", "last_mile_carrier", "Carlos Vega", "reopened"),
    ("Regla de devolución incorrecta", "La aprobación automática aplicó una política antigua.", "return_dispute", "medium", "los_angeles", "dashboard", "reverse_logistics", "Sofía Ramos", "open"),
    ("Dirección de entrega inválida", "La marca solicita corregir la dirección antes de expedir.", "sla_breach", "low", "los_angeles", "client_email", "customer_experience", "Valentina Cruz", "open"),
]


def main() -> None:
    now = datetime.now(timezone.utc).isoformat()
    records = []
    for number, row in enumerate(ROWS, start=1):
        title, description, incident_type, severity, location, channel, area, assignee, status = row
        incident_id = f"INC-{number:04d}"
        audit = []
        if status == "reopened":
            audit.append({"id": f"{incident_id}-AUD-1", "incident_id": incident_id, "field": "status", "from": "resolved", "to": "reopened", "author": assignee, "created_at": now})
        records.append({"id": incident_id, "warehouse_location": location, "client_name": None if number == 7 else "ACME Commerce", "channel": channel, "type": incident_type, "severity": severity, "responsible_area": area, "title": title, "description": description, "status": status, "assigned_to": assignee, "created_at": now, "updated_at": now, "audit": audit})
    try:
        OUTPUT.parent.mkdir(exist_ok=True)
        OUTPUT.write_text(json.dumps(records, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    except OSError:
        print("No se pudo escribir el seed de incidencias.", file=sys.stderr)
        raise SystemExit(1)
    print(f"Seed terminado: {len(records)} incidencias listas en data/{OUTPUT.name}")


if __name__ == "__main__":
    main()