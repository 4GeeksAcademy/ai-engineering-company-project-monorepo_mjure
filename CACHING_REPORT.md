# Informe de caching

## Alcance y evidencia

El alcance incluye los 18 endpoints montados por `services/auth-api/main.py` y sus tres rutas `/api/v1` de TrackFlow. `GET /health` está definido en `services/trackflow-api/app/main.py`, pero esa app ASGI independiente no está montada en `auth-api` ni es la que inicia `docker-compose.yml`; se documenta aparte para no confundir los contratos. Las etiquetas de coste, frecuencia y volatilidad son una evaluación del código y del flujo de UI, no métricas de producción. El middleware `api.timing` de `auth-api` registra método, ruta, status y duración en milisegundos.

Se ejecutó un benchmark reproducible en SQLite en memoria con datos sintéticos variados: 300 SKUs, 1.200 entradas y 600 salidas (2.100 filas en total; antes del seed había 0). Se midieron cinco peticiones frías con invalidación explícita y cinco lecturas calientes por endpoint; los tiempos incluyen TestClient, validación y serialización de respuestas. No es una medición de producción ni una comparación histórica anterior al cambio: compara el camino de consulta sin caché y el hit de caché en el mismo código y entorno.

| Endpoint | Mediana sin caché | Mediana con caché | Mejora observada |
| --- | ---: | ---: | ---: |
| `GET /inventory/products` | 183,66 ms | 1,89 ms | 97,14x |
| `GET /inventory/orders` | 40,04 ms | 9,55 ms | 4,19x |

Reproducción desde `services/auth-api`:

```sh
DATABASE_URL=sqlite:// PYTHONPATH=.:../trackflow-api uv run --frozen --with pytest --with httpx python benchmark_inventory_cache.py --products 300 --samples 5
DATABASE_URL=sqlite:// PYTHONPATH=.:../trackflow-api uv run --frozen --with pytest --with httpx python -m pytest -q tests/test_serialization.py
```

## Decisiones en el frontend

- `uis/backoffice/components/inventory/ProductsTable.tsx` se carga con `next/dynamic` desde la ruta de productos. Contiene el render de siete columnas y acciones por SKU; solo se monta después de que termina `listProducts`, así que su chunk no se necesita durante la carga ni mientras espera la API.
- `uis/backoffice/components/inventory/OrdersTable.tsx` se carga con `next/dynamic` desde el historial. El listado potencialmente largo no se necesita hasta que termina `listOrders`; la carga diferida evita incluir ese renderer en el primer chunk de la ruta.
- En `uis/backoffice/src/app/backoffice/inventory/orders/page.tsx`, `useMemo` calcula conteos y unidades de entradas/salidas en una pasada O(n). Depende de `[orders]`, que solo cambia al cargar los movimientos, y evita repetir ese recorrido cuando cambia estado ajeno al conjunto. No hay perfil de React DevTools disponible, así que el beneficio es estructural/estimado, no medido.
- Se retiró el `useMemo` del formulario de salidas: comparar una cantidad contra el stock es trivial y la memoización añadía complejidad sin un ahorro relevante.

## Decisiones en el backend

Evaluación de rutas. Coste y frecuencia son cualitativos; frecuencia estima el uso normal de la interfaz, no telemetría observada. “Estabilidad” indica cuánto suelen cambiar los datos subyacentes.

| Método y ruta | Coste | Frecuencia estimada | Estabilidad | Decisión |
| --- | --- | --- | --- | --- |
| GET `/` | Bajo, respuesta fija | Baja | Alta | No cachear; sin consulta costosa. |
| POST `/auth/login` | Alto por bcrypt | Media | Cambia con credenciales | No cachear; respuesta de autenticación sensible. |
| GET `/auth/me` | Bajo, usuario autenticado | Alta al cargar sesión | Cambia con cuenta/perfil | No cachear; personalizado. |
| POST `/auth/forgot-password` | Alto/variable por email externo | Baja | Token y usuario cambian | No cachear; efectos secundarios y dato sensible. |
| POST `/auth/reset-password` | Medio/alto por bcrypt y escritura | Baja | Cambia al consumir token | No cachear; operación de escritura. |
| POST `/auth/change-password` | Medio/alto por bcrypt y escritura | Baja | Cambia con contraseña | No cachear; operación de escritura. |
| GET `/profiles/me` | Bajo, lectura puntual | Media | Cambia al editar perfil | No cachear; personalizado por usuario. |
| PUT `/profiles/me` | Bajo, escritura puntual | Baja | Cambia en cada edición | No cachear; operación de escritura. |
| POST `/users` | Medio/alto por bcrypt y escrituras | Baja | Cambia al registrar cuenta | No cachear; operación de escritura. |
| GET `/inventory/products` | Alto con catálogo grande: 1 consulta de SKUs más 2 agregaciones por SKU | Alta; listado y formularios de movimientos lo consultan | Moderada; altas y movimientos de stock | **Cachear 15 s**, clave `(user_id, products)`. Un hit omite las consultas de catálogo y stock. |
| POST `/inventory/products` | Bajo/medio, inserción | Baja | Cambia catálogo | No cachear; invalida todas las entradas de inventario tras commit. |
| GET `/inventory/products/{product_id}` | Medio, lectura y 2 agregaciones | Media al seleccionar SKU | Alta variación por movimientos | No cachear; el formulario necesita stock actual antes de validar una salida. |
| POST `/inventory/orders/inbound` | Medio, validación y escritura | Media | Alta variación de stock | No cachear; invalida caché tras commit. |
| POST `/inventory/orders/outbound` | Alto, 2 agregaciones para validar stock y escritura | Media | Alta variación de stock | No cachear; la validación debe leer el stock actual; invalida tras commit. |
| GET `/inventory/orders` | Alto con historial grande: 2 joins, combinación en memoria y ordenamiento O(n log n) | Media/alta al abrir historial | Moderada; cambia con cada movimiento | **Cachear 15 s**, clave `(user_id, orders)`. Un hit evita joins y ordenamiento. |
| GET `/api/v1/inventory/stock/{sku}` | Medio, consulta y servicio de dominio | Media | Alta/externa a las escrituras de auth-api | No cachear; este servicio no comparte la invalidación de inventario. |
| GET `/api/v1/inventory/stock/{sku}/by-warehouse` | Bajo/medio, lectura de almacenes | Media | Alta/externa a las escrituras de auth-api | No cachear; frescura por almacén y sin invalidación común. |
| POST `/api/v1/inventory/stock/alerts` | Bajo, inserción | Baja | Cambia al crear alerta | No cachear; escritura. |
| GET `/health` (app separada `services/trackflow-api`; no montada en `auth-api`) | Bajo, respuesta de estado | Alta por sondas | Alta | No cachear; debe reflejar disponibilidad actual. |

La caché vive en proceso, usa `time.monotonic()` para expirar entradas a los 15 segundos y separa claves por identidad autenticada aunque el inventario visible sea compartido. Así no se reutiliza una respuesta entre cuentas. `POST /inventory/products`, `POST /inventory/orders/inbound` y `POST /inventory/orders/outbound` vacían la caché después de confirmar la escritura. En despliegues con varios workers, la invalidación no se propaga entre procesos; el TTL limita esa posible obsolescencia a 15 segundos. Si se escala horizontalmente, se debe migrar a Redis con invalidación compartida.

## Intercambios reconocidos

Quince segundos es un compromiso corto: los listados se repiten al navegar entre pantallas y sus consultas crecen con el catálogo/historial, mientras que escrituras realizadas por esta API invalidan de inmediato el proceso actual. Una modificación desde otro proceso puede verse retrasada hasta 15 segundos. El stock usado por una salida no se cachea: un valor obsoleto podría rechazar una operación válida o mostrar disponibilidad incorrecta; la validación transaccional del endpoint conserva prioridad sobre velocidad.

En frontend, la tabla no se solicita hasta que la ruta ya obtuvo datos; se conserva un fallback breve durante la descarga del chunk. No hay medición de bytes ni de tiempo de interacción para cuantificar el ahorro.

## Qué no se cacheó y por qué

No se cacheó `GET /inventory/products/{product_id}` aunque contiene agregaciones: se usa para consultar stock justo antes de crear una salida y la frescura es más importante que ahorrar dos consultas. Tampoco se cachean autenticación, perfiles o rutas de escritura, porque son personalizadas, sensibles o tienen efectos secundarios. No se añadió caché a las lecturas del router TrackFlow: este proceso no controla las escrituras de inventario que podrían invalidarlas.