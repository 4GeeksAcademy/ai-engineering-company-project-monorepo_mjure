import type {
  BrandCustomer,
  InventoryItem,
  ReturnRequest,
  Shipment,
  SupportTicket,
} from "./models";

export function obtenerCantidadTotalInventario(item: InventoryItem): number {
  return item.availableQty + item.reservedQty;
}

export function tieneStockBajo(item: InventoryItem): boolean {
  return item.availableQty <= item.reorderPoint;
}

export function contratoActivo(
  cliente: BrandCustomer,
  fechaReferencia: string = new Date().toISOString(),
): boolean {
  const inicio = Date.parse(cliente.contractStartDate);
  const fin = Date.parse(cliente.contractEndDate);
  const fecha = Date.parse(fechaReferencia);

  return cliente.isActive && fecha >= inicio && fecha <= fin;
}

export function envioEntregado(envio: Shipment): boolean {
  return envio.status === "delivered";
}

export function devolucionFinalizada(solicitudDevolucion: ReturnRequest): boolean {
  return solicitudDevolucion.status === "closed";
}

export function requiereAtencionUrgente(ticket: SupportTicket): boolean {
  return (
    ticket.priority === "urgent"
    || (ticket.sentimentScore !== undefined && ticket.sentimentScore <= -0.6)
  );
}