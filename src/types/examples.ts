import type {
  BrandCustomer,
  InventoryItem,
  ReturnRequest,
  Shipment,
  SupportTicket,
  Warehouse,
} from "./models";

export const almacenLosAngeles: Warehouse = {
  id: "wh-la-01",
  name: "Almacen Principal Los Angeles",
  code: "LA01",
  country: "US",
  timezone: "America/Los_Angeles",
  address: {
    street: "1200 Logistics Blvd",
    city: "Los Angeles",
    state: "CA",
    postalCode: "90001",
    country: "US",
  },
  isActive: true,
  createdAt: "2026-01-10T09:00:00.000Z",
};

export const clienteMarcaAcme: BrandCustomer = {
  id: "brand-acme-01",
  legalName: "ACME Commerce LLC",
  country: "US",
  vatNumber: "US-ACME-2026",
  contractStartDate: "2026-01-01",
  contractEndDate: "2026-12-31",
  isActive: true,
};

export const itemInventarioEjemplo: InventoryItem = {
  id: "inv-001",
  sku: "SKU-CHAIR-001",
  warehouseId: "wh-la-01",
  availableQty: 120,
  reservedQty: 15,
  reorderPoint: 40,
  updatedBy: "ops-user-01",
  updatedAt: "2026-05-30T11:20:00.000Z",
};

export const envioEjemplo: Shipment = {
  id: "shp-1001",
  orderRef: "ORD-2026-4550",
  brandCustomerId: "brand-acme-01",
  warehouseId: "wh-la-01",
  carrierId: "carrier-ups-01",
  trackingNumber: "1Z999AA1234567890",
  recipient: {
    fullName: "Laura Mendez",
    email: "laura@example.com",
    phone: "+1 323 000 1122",
    language: "es",
  },
  destination: {
    street: "742 Evergreen Terrace",
    city: "Los Angeles",
    state: "CA",
    postalCode: "90013",
    country: "US",
  },
  weightKg: 2.8,
  status: "in_transit",
  createdAt: "2026-05-29T15:00:00.000Z",
  etaDate: "2026-06-01T20:00:00.000Z",
};

export const solicitudDevolucionEjemplo: ReturnRequest = {
  id: "ret-090",
  shipmentId: "shp-1001",
  brandCustomerId: "brand-acme-01",
  reasonCode: "DAMAGED_ITEM",
  reasonDetails: "Caja golpeada y producto rayado",
  status: "approved",
  approvedBy: "rule-engine",
  createdAt: "2026-05-30T08:30:00.000Z",
};

export const ticketSoporteEjemplo: SupportTicket = {
  id: "tkt-880",
  channel: "whatsapp",
  status: "open",
  priority: "high",
  brandCustomerId: "brand-acme-01",
  shipmentId: "shp-1001",
  requester: {
    fullName: "Laura Mendez",
    email: "laura@example.com",
    language: "es",
  },
  subject: "No veo movimientos nuevos de mi envio",
  sentimentScore: -0.4,
  createdAt: "2026-05-30T10:00:00.000Z",
};