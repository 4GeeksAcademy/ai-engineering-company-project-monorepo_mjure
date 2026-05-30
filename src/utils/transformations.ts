import type {
  InventoryItem,
  ReturnRequest,
  Shipment,
  SupportTicket,
} from "../types/models";

export function contarPor<T, K extends PropertyKey>(
  elementos: T[],
  selectorClave: (elemento: T) => K,
): Map<K, number> {
  const conteos = new Map<K, number>();

  for (const elemento of elementos) {
    const clave = selectorClave(elemento);
    const conteoActual = conteos.get(clave) ?? 0;
    conteos.set(clave, conteoActual + 1);
  }

  return conteos;
}

export function sumarPor<T>(
  elementos: T[],
  selectorValor: (elemento: T) => number,
): number {
  return elementos.reduce((total, elemento) => total + selectorValor(elemento), 0);
}

export function promedioPor<T>(
  elementos: T[],
  selectorValor: (elemento: T) => number,
): number {
  if (elementos.length === 0) {
    return 0;
  }

  return sumarPor(elementos, selectorValor) / elementos.length;
}

export function minimoPor<T>(
  elementos: T[],
  selectorValor: (elemento: T) => number,
): T | undefined {
  if (elementos.length === 0) {
    return undefined;
  }

  return elementos.reduce((minimoElemento, elementoActual) => {
    return selectorValor(elementoActual) < selectorValor(minimoElemento)
      ? elementoActual
      : minimoElemento;
  });
}

export function maximoPor<T>(
  elementos: T[],
  selectorValor: (elemento: T) => number,
): T | undefined {
  if (elementos.length === 0) {
    return undefined;
  }

  return elementos.reduce((maximoElemento, elementoActual) => {
    return selectorValor(elementoActual) > selectorValor(maximoElemento)
      ? elementoActual
      : maximoElemento;
  });
}

export function crearReporteEnvios(envios: Shipment[]): {
  totalEnvios: number;
  totalPesoKg: number;
  promedioPesoKg: number;
  conteoPorEstado: Map<Shipment["status"], number>;
  envioMasPesado?: Shipment;
  envioMasLiviano?: Shipment;
} {
  return {
    totalEnvios: envios.length,
    totalPesoKg: sumarPor(envios, (envio) => envio.weightKg),
    promedioPesoKg: promedioPor(envios, (envio) => envio.weightKg),
    conteoPorEstado: contarPor(envios, (envio) => envio.status),
    envioMasPesado: maximoPor(envios, (envio) => envio.weightKg),
    envioMasLiviano: minimoPor(envios, (envio) => envio.weightKg),
  };
}

export function crearReporteDevoluciones(devoluciones: ReturnRequest[]): {
  totalDevoluciones: number;
  conteoPorEstado: Map<ReturnRequest["status"], number>;
  aprobadasAutomaticamente: number;
  aprobadasManualmente: number;
} {
  return {
    totalDevoluciones: devoluciones.length,
    conteoPorEstado: contarPor(devoluciones, (solicitud) => solicitud.status),
    aprobadasAutomaticamente: devoluciones.filter(
      (solicitud) => solicitud.approvedBy === "rule-engine",
    ).length,
    aprobadasManualmente: devoluciones.filter(
      (solicitud) => solicitud.approvedBy === "human",
    ).length,
  };
}

export function crearReporteInventario(items: InventoryItem[]): {
  totalItems: number;
  totalDisponible: number;
  totalReservado: number;
  itemsConStockBajo: InventoryItem[];
} {
  return {
    totalItems: items.length,
    totalDisponible: sumarPor(items, (item) => item.availableQty),
    totalReservado: sumarPor(items, (item) => item.reservedQty),
    itemsConStockBajo: items.filter((item) => item.availableQty <= item.reorderPoint),
  };
}

export function crearReporteTicketsSoporte(tickets: SupportTicket[]): {
  totalTickets: number;
  ticketsAbiertos: number;
  ticketsResueltos: number;
  conteoPorCanal: Map<SupportTicket["channel"], number>;
  promedioSentimiento: number;
} {
  const ticketsConSentimiento = tickets.filter(
    (ticket) => ticket.sentimentScore !== undefined,
  );

  return {
    totalTickets: tickets.length,
    ticketsAbiertos: tickets.filter((ticket) => ticket.status === "open").length,
    ticketsResueltos: tickets.filter((ticket) => ticket.status === "resolved").length,
    conteoPorCanal: contarPor(tickets, (ticket) => ticket.channel),
    promedioSentimiento: promedioPor(
      ticketsConSentimiento,
      (ticket) => ticket.sentimentScore ?? 0,
    ),
  };
}