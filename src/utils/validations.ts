import type {
  BrandCustomer,
  InventoryItem,
  ReturnRequest,
  Shipment,
  SupportTicket,
} from "../types/models";

export interface IncidenciaValidacion {
  campo: string;
  mensaje: string;
}

export interface ResultadoValidacion {
  valido: boolean;
  incidencias: IncidenciaValidacion[];
}

function esFechaValida(fechaComoTexto?: string): boolean {
  if (!fechaComoTexto) {
    return false;
  }

  return !Number.isNaN(Date.parse(fechaComoTexto));
}

function estaVacio(valor?: string): boolean {
  return !valor || valor.trim().length === 0;
}

export function validarItemInventario(item: InventoryItem): ResultadoValidacion {
  const incidencias: IncidenciaValidacion[] = [];

  if (estaVacio(item.id)) {
    incidencias.push({ campo: "id", mensaje: "El id es obligatorio." });
  }

  if (estaVacio(item.sku)) {
    incidencias.push({ campo: "sku", mensaje: "El SKU es obligatorio." });
  }

  if (item.availableQty < 0) {
    incidencias.push({
      campo: "availableQty",
      mensaje: "La cantidad disponible no puede ser negativa.",
    });
  }

  if (item.reservedQty < 0) {
    incidencias.push({
      campo: "reservedQty",
      mensaje: "La cantidad reservada no puede ser negativa.",
    });
  }

  if (item.reorderPoint < 0) {
    incidencias.push({
      campo: "reorderPoint",
      mensaje: "El punto de reorden no puede ser negativo.",
    });
  }

  return { valido: incidencias.length === 0, incidencias };
}

export function validarEnvio(envio: Shipment): ResultadoValidacion {
  const incidencias: IncidenciaValidacion[] = [];

  if (estaVacio(envio.id)) {
    incidencias.push({ campo: "id", mensaje: "El id es obligatorio." });
  }

  if (estaVacio(envio.orderRef)) {
    incidencias.push({
      campo: "orderRef",
      mensaje: "La referencia de pedido es obligatoria.",
    });
  }

  if (estaVacio(envio.trackingNumber)) {
    incidencias.push({
      campo: "trackingNumber",
      mensaje: "El tracking number es obligatorio.",
    });
  }

  if (envio.weightKg <= 0 || envio.weightKg > 70) {
    incidencias.push({
      campo: "weightKg",
      mensaje: "El peso debe estar entre 0.01 kg y 70 kg.",
    });
  }

  if (estaVacio(envio.recipient.fullName)) {
    incidencias.push({
      campo: "recipient.fullName",
      mensaje: "El nombre del destinatario es obligatorio.",
    });
  }

  if (!estaVacio(envio.etaDate) && !esFechaValida(envio.etaDate)) {
    incidencias.push({
      campo: "etaDate",
      mensaje: "La ETA debe ser una fecha válida.",
    });
  }

  if (esFechaValida(envio.createdAt) && esFechaValida(envio.etaDate)) {
    const fechaCreacion = Date.parse(envio.createdAt as string);
    const fechaEta = Date.parse(envio.etaDate as string);

    if (fechaEta < fechaCreacion) {
      incidencias.push({
        campo: "etaDate",
        mensaje: "La ETA no puede ser anterior a la fecha de creación.",
      });
    }
  }

  return { valido: incidencias.length === 0, incidencias };
}

export function validarClienteMarca(cliente: BrandCustomer): ResultadoValidacion {
  const incidencias: IncidenciaValidacion[] = [];

  if (estaVacio(cliente.id)) {
    incidencias.push({ campo: "id", mensaje: "El id es obligatorio." });
  }

  if (estaVacio(cliente.legalName)) {
    incidencias.push({
      campo: "legalName",
      mensaje: "El nombre legal de la marca es obligatorio.",
    });
  }

  if (!esFechaValida(cliente.contractStartDate)) {
    incidencias.push({
      campo: "contractStartDate",
      mensaje: "La fecha de inicio de contrato no es válida.",
    });
  }

  if (!esFechaValida(cliente.contractEndDate)) {
    incidencias.push({
      campo: "contractEndDate",
      mensaje: "La fecha de fin de contrato no es válida.",
    });
  }

  if (
    esFechaValida(cliente.contractStartDate)
    && esFechaValida(cliente.contractEndDate)
    && Date.parse(cliente.contractEndDate) < Date.parse(cliente.contractStartDate)
  ) {
    incidencias.push({
      campo: "contractEndDate",
      mensaje: "La fecha de fin no puede ser anterior a la fecha de inicio.",
    });
  }

  return { valido: incidencias.length === 0, incidencias };
}

export function validarSolicitudDevolucion(
  solicitud: ReturnRequest,
): ResultadoValidacion {
  const incidencias: IncidenciaValidacion[] = [];

  if (estaVacio(solicitud.id)) {
    incidencias.push({ campo: "id", mensaje: "El id es obligatorio." });
  }

  if (estaVacio(solicitud.shipmentId)) {
    incidencias.push({
      campo: "shipmentId",
      mensaje: "shipmentId es obligatorio.",
    });
  }

  if (estaVacio(solicitud.reasonCode)) {
    incidencias.push({
      campo: "reasonCode",
      mensaje: "El código de motivo de devolución es obligatorio.",
    });
  }

  if (solicitud.status === "approved" && !solicitud.approvedBy) {
    incidencias.push({
      campo: "approvedBy",
      mensaje: "Una devolución aprobada debe indicar quién la aprobó.",
    });
  }

  return { valido: incidencias.length === 0, incidencias };
}

export function validarTicketSoporte(ticket: SupportTicket): ResultadoValidacion {
  const incidencias: IncidenciaValidacion[] = [];

  if (estaVacio(ticket.id)) {
    incidencias.push({ campo: "id", mensaje: "El id es obligatorio." });
  }

  if (estaVacio(ticket.subject)) {
    incidencias.push({ campo: "subject", mensaje: "El asunto es obligatorio." });
  }

  if (ticket.subject.trim().length > 120) {
    incidencias.push({
      campo: "subject",
      mensaje: "El asunto no puede superar los 120 caracteres.",
    });
  }

  if (estaVacio(ticket.requester.fullName)) {
    incidencias.push({
      campo: "requester.fullName",
      mensaje: "El nombre del solicitante es obligatorio.",
    });
  }

  if (
    ticket.sentimentScore !== undefined
    && (ticket.sentimentScore < -1 || ticket.sentimentScore > 1)
  ) {
    incidencias.push({
      campo: "sentimentScore",
      mensaje: "El sentimiento debe estar entre -1 y 1.",
    });
  }

  return { valido: incidencias.length === 0, incidencias };
}