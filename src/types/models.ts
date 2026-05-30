import type { BaseEntity, Id } from "../../packages/shared/types";

export type CountryCode = "US" | "ES";
export type LanguageCode = "es" | "en";

export interface Address {
	street: string;
	city: string;
	state?: string;
	postalCode: string;
	country: CountryCode;
}

export interface Warehouse extends BaseEntity {
	name: string;
	code: string;
	country: CountryCode;
	timezone: string;
	address: Address;
	isActive: boolean;
}

export interface InventoryItem extends BaseEntity {
	sku: string;
	warehouseId: Id;
	availableQty: number;
	reservedQty: number;
	reorderPoint: number;
	updatedBy?: string;
}

export interface BrandCustomer extends BaseEntity {
	legalName: string;
	vatNumber?: string;
	country: CountryCode;
	contractStartDate: string;
	contractEndDate: string;
	isActive: boolean;
}

export interface EndCustomer {
	fullName: string;
	email?: string;
	phone?: string;
	language?: LanguageCode;
}

export type CarrierCode =
	| "UPS"
	| "FEDEX"
	| "DHL"
	| "MRW"
	| "SEUR"
	| "LOCAL";

export interface Carrier extends BaseEntity {
	code: CarrierCode;
	displayName: string;
	countries: CountryCode[];
	supportsPickup: boolean;
	supportsRealtimeTracking: boolean;
}

export type ShipmentStatus =
	| "created"
	| "label_generated"
	| "in_transit"
	| "out_for_delivery"
	| "delivered"
	| "failed_delivery"
	| "exception"
	| "returned";

export interface Shipment extends BaseEntity {
	orderRef: string;
	brandCustomerId: Id;
	warehouseId: Id;
	carrierId: Id;
	trackingNumber: string;
	recipient: EndCustomer;
	destination: Address;
	weightKg: number;
	status: ShipmentStatus;
	etaDate?: string;
}

export interface TrackingEvent extends BaseEntity {
	shipmentId: Id;
	status: ShipmentStatus;
	description: string;
	location?: string;
	eventAt: string;
}

export type ReturnStatus =
	| "requested"
	| "approved"
	| "rejected"
	| "picked_up"
	| "received"
	| "inspected"
	| "closed";

export interface ReturnRequest extends BaseEntity {
	shipmentId: Id;
	brandCustomerId: Id;
	reasonCode: string;
	reasonDetails?: string;
	status: ReturnStatus;
	approvedBy?: "rule-engine" | "human";
}

export type TicketChannel = "email" | "whatsapp" | "phone" | "web";
export type TicketPriority = "low" | "normal" | "high" | "urgent";
export type TicketStatus = "open" | "pending" | "resolved" | "closed";

export interface SupportTicket extends BaseEntity {
	externalRef?: string;
	channel: TicketChannel;
	status: TicketStatus;
	priority: TicketPriority;
	brandCustomerId?: Id;
	shipmentId?: Id;
	requester: EndCustomer;
	subject: string;
	sentimentScore?: number;
}
