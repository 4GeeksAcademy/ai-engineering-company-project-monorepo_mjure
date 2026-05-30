export type EstadoPaquete =
	| 'pendiente'
	| 'en_recepcion'
	| 'en_transito'
	| 'entregado'
	| 'cancelado';

export type PrioridadPaquete = 'baja' | 'media' | 'alta' | 'urgente';

export interface Paquete {
	id: string;
	origen: string;
	destino: string;
	estado: EstadoPaquete;
	peso: number;
	prioridad: PrioridadPaquete;
	id_transportista: string;
	id_almacen: number;
	fecha_recepcion: Date;
	fecha_entrega: Date;
    
}

export interface Almacen {
	id: number;
	espacio_disponible_pallets: number;
	espacio_ocupado_pallets: number;
}

export interface Transportista {
    id: string;
    nombre: string;
    telefono: string;
    email: string;
	rating: number;
	location: string;
	api: string;
}

export interface Cliente {
	id: string;
	ratio_felicidad: number;
	idioma: string;
	contacto: string;
	nombre: string;
	ubicacion: string;
	cantidad_operaciones: number;
	id_paquete: string;
}


