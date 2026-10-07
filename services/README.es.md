# Carpeta `services`

Esta carpeta contiene **todos los servicios backend** (APIs y workers en segundo plano) relacionados con la compañía para el proyecto transversal de AI Engineering.

Cada subcarpeta dentro de `services/` debe corresponder a **un servicio concreto** (por ejemplo `admin-api`, `data-processor-worker`) e incluir su propia documentación técnica y funcional.

- **Propósito principal**: centralizar toda la lógica backend, APIs y consumidores de colas que dan soporte a los casos de uso de la compañía.
- **Recomendación**: documenta en este archivo (o en sub-READMEs) los servicios que vayas añadiendo, su objetivo, tecnología usada y cómo ejecutarlos.

## Servicios

- `auth-api`: punto de entrada FastAPI único para autenticación, perfiles, usuarios,
	inventario y la API versionada de TrackFlow.
- `trackflow-api`: API modular integrada en `auth-api` bajo `/api/v1`. Sus rutas
	requieren un token válido; el inicio de sesión permanece público.

Inicia el stack desde la raíz del repositorio con `docker compose up --build -d`.
El backend unificado queda disponible en el puerto `8000`.
