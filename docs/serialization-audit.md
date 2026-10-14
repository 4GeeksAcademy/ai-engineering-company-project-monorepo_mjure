# Auditoría de contratos de serialización

## A. Resumen ejecutivo

### Diagnóstico inicial preservado (antes de las correcciones)

- Backends auditados: `services/auth-api/main.py` (aplicación `auth-api`, que también incluye el router de TrackFlow bajo `/api/v1`) y `services/trackflow-api/app/main.py` (aplicación independiente `trackflow-api`).
- Versiones disponibles en el entorno local: FastAPI `0.141.1`, Pydantic `2.13.4`. Son las versiones instaladas en `.venv`, no versiones fijadas por los manifiestos.
- Inventario inicial estático: 22 exposiciones de método+ruta contando cada aplicación; seis exposiciones corresponden al mismo router de inventario publicado por ambas apps.
- Clasificación inicial: 9 ✅ ya serializados, 2 ⚠️ parcialmente serializados y 11 ❌ sin serializar.
- Cambios de serialización: 13 rutas (las 11 inicialmente sin contrato y las 2 parciales); las 13 quedaron corregidas y verificadas. Se ajustó además la restricción de entrada `threshold >= 0` en las dos exposiciones de la ruta de alertas.
- Estado final: 22 rutas inventariadas y presentes en OpenAPI, 22 con esquema JSON de éxito, 0 pendientes de contrato. Se ejecutaron pruebas HTTP de 18 rutas distintas en la app de prueba que reutiliza los routers reales; el registro/OpenAPI comprobó las 22 exposiciones.
- Versiones verificadas en runtime: FastAPI `0.141.1`, Pydantic `2.13.4`.
- No había tests backend en el repositorio antes de esta auditoría. Se agregó `services/auth-api/tests/test_serialization.py`; resultado final: 11 passed.
- `pytest` y `httpx` quedaron declarados en el extra opcional `test` de `services/auth-api/pyproject.toml`; no se agregan al entorno runtime.
- La validación de respuestas usa SQLite temporal/en memoria y dobles para operaciones externas. No se ejecutó el servicio contra la base configurada del despliegue ni se verificaron credenciales/infraestructura de producción.

### Alcance y exclusiones

Se cuentan los métodos declarados por los decoradores de negocio y sus prefijos efectivos en cada app. Se excluyen las rutas automáticas de FastAPI (`/docs`, `/redoc`, `/openapi.json`). No se encontraron decoradores WebSocket ni respuestas de streaming/archivos/redirects en el conjunto de rutas inspeccionado. La diferencia entre las dos aplicaciones se conserva en las filas: una ruta repetida en procesos distintos es una exposición distinta para esta auditoría.

## B. Inventario completo

`Inicial` describe el estado antes de editar. `Final` se completará después de implementar y validar. Las rutas se infieren del cableado estático mientras no se pueda importar FastAPI.

| Método | Ruta | Archivo / handler | Propósito | Estado inicial | response_model inicial | Problema identificado | Esquema final | Estado final |
|---|---|---|---|---|---|---|---|---|
| GET | `/` (auth-api) | `services/auth-api/main.py` · `home` | Estado básico del backend | ❌ | Ninguno | JSON sin contrato | `HomeResponse` | Validado |
| POST | `/auth/login` (auth-api) | `services/auth-api/auth.py` · `login` | Emitir token de acceso | ❌ | Ninguno | Token legítimo sin esquema | `AccessTokenResponse` | Validado |
| GET | `/auth/me` (auth-api) | `services/auth-api/auth.py` · `get_me` | Obtener usuario autenticado | ❌ | Ninguno | Dict con perfil TinyDB sin proyección de salida | `CurrentUserResponse` | Validado |
| POST | `/auth/forgot-password` (auth-api) | `services/auth-api/auth.py` · `forgot_password` | Solicitar recuperación | ❌ | Ninguno | Respuesta JSON genérica sin esquema | `MessageResponse` | Validado |
| POST | `/auth/reset-password` (auth-api) | `services/auth-api/auth.py` · `reset_password` | Restablecer contraseña | ❌ | Ninguno | Respuesta JSON sin esquema | `MessageResponse` | Validado |
| POST | `/auth/change-password` (auth-api) | `services/auth-api/auth.py` · `change_password` | Cambiar contraseña propia | ❌ | Ninguno | Respuesta JSON sin esquema | `MessageResponse` | Validado |
| GET | `/profiles/me` (auth-api) | `services/auth-api/profiles.py` · `get_my_profile` | Leer perfil propio | ❌ | Ninguno | Documento TinyDB sin contrato; `user_id` interno | `ProfileResponse` | Validado |
| PUT | `/profiles/me` (auth-api) | `services/auth-api/profiles.py` · `edit_my_profile` | Actualizar perfil propio | ❌ | Ninguno | Documento TinyDB sin contrato; entrada ya limitada a campos editables | `ProfileResponse` | Validado |
| POST | `/users` (auth-api) | `services/auth-api/users.py` · `register` | Registrar usuario | ❌ | Ninguno | JSON sin contrato; devuelve email en ruta pública | `UserRegistrationResponse` | Validado |
| GET | `/inventory/products` (auth-api) | `services/auth-api/routers/inventory.py` · `get_products` | Listar productos y stock actual | ✅ | `list[SKUResponse]` | Contrato explícito; campos usados por backoffice | `list[SKUResponse]` | Validado |
| POST | `/inventory/products` (auth-api) | `services/auth-api/routers/inventory.py` · `create_product` | Crear producto | ✅ | `SKUResponse` | Contrato explícito y separado de entrada | `SKUResponse` | Validado |
| GET | `/inventory/products/{product_id}` (auth-api) | `services/auth-api/routers/inventory.py` · `get_product` | Obtener producto y stock | ✅ | `SKUResponse` | Contrato explícito | `SKUResponse` | Validado |
| POST | `/inventory/orders/inbound` (auth-api) | `services/auth-api/routers/inventory.py` · `create_inbound_order` | Registrar entrada | ⚠️ | `StockEntryResponse` | Devuelve `user_uuid`, identificador interno que no necesita la UI de creación | `StockEntryResponse` sin `user_uuid` | Validado |
| POST | `/inventory/orders/outbound` (auth-api) | `services/auth-api/routers/inventory.py` · `create_outbound_order` | Registrar salida | ⚠️ | `StockExitResponse` | Devuelve `user_uuid`, identificador interno que no necesita la UI de creación | `StockExitResponse` sin `user_uuid` | Validado |
| GET | `/inventory/orders` (auth-api) | `services/auth-api/routers/inventory.py` · `get_orders` | Historial de movimientos | ❌ | Ninguno | Lista de dicts; `user_uuid` se mostraba en UI para movimientos de otros usuarios | `list[OrderResponse]` | Validado |
| GET | `/api/v1/inventory/stock/{sku}` (auth-api) | `services/trackflow-api/app/domains/inventory/api/router.py` · `get_stock` | Consultar stock total | ✅ | `StockResponse` | Contrato explícito | `StockResponse` | Validado |
| GET | `/api/v1/inventory/stock/{sku}/by-warehouse` (auth-api) | `services/trackflow-api/app/domains/inventory/api/router.py` · `get_stock_by_warehouse` | Consultar stock por almacén | ✅ | `list[StockByWarehouseResponse]` | Contrato explícito | `list[StockByWarehouseResponse]` | Validado |
| POST | `/api/v1/inventory/stock/alerts` (auth-api) | `services/trackflow-api/app/domains/inventory/api/router.py` · `create_stock_alert` | Crear alerta de stock | ✅ | `InventoryAlertResponse` | Contrato explícito; ahora valida umbral no negativo | `InventoryAlertResponse` | Validado |
| GET | `/health` (trackflow-api) | `services/trackflow-api/app/main.py` · `health` | Estado del servicio | ❌ | Ninguno | JSON con anotación de dict, sin esquema explícito | `HealthResponse` | Validado |
| GET | `/api/v1/inventory/stock/{sku}` (trackflow-api) | `services/trackflow-api/app/domains/inventory/api/router.py` · `get_stock` | Consultar stock total | ✅ | `StockResponse` | Contrato explícito | `StockResponse` | Validado |
| GET | `/api/v1/inventory/stock/{sku}/by-warehouse` (trackflow-api) | `services/trackflow-api/app/domains/inventory/api/router.py` · `get_stock_by_warehouse` | Consultar stock por almacén | ✅ | `list[StockByWarehouseResponse]` | Contrato explícito | `list[StockByWarehouseResponse]` | Validado |
| POST | `/api/v1/inventory/stock/alerts` (trackflow-api) | `services/trackflow-api/app/domains/inventory/api/router.py` · `create_stock_alert` | Crear alerta de stock | ✅ | `InventoryAlertResponse` | Contrato explícito; ahora valida umbral no negativo | `InventoryAlertResponse` | Validado |

## C. Fichas detalladas por endpoint

Las fichas siguientes conservan el diagnóstico inicial previo a las ediciones: los campos se obtuvieron por análisis estático salvo donde había un response model. La resolución de los contratos que allí figuraban pendientes, los cambios y el estado/evidencia final por cada método están en la sección F.

### Auth API

#### GET `/` (auth-api)
- Archivo/handler: `services/auth-api/main.py`, `home`. Propósito: comprobar disponibilidad básica.
- Consumidores identificados: ninguno por referencia directa en el código revisado.
- Entrada: sin cuerpo. Salida inferida: objeto `{status: string}` con `status: "ok"`. Éxito: 200. `response_model` inicial: ninguno.
- Necesarios: `status`. No se identificaron datos sensibles.
- Estado inicial: ❌ JSON estructurado sin esquema.
- Contrato final: pendiente de implementación, esperado `{status: str}`.
- Cambios/evidencia: pendientes.

#### POST `/auth/login` (auth-api)
- Archivo/handler: `services/auth-api/auth.py`, `login`. Propósito: autenticar con formulario OAuth2 y emitir JWT.
- Consumidor: `uis/talent-pipeline-tracker/lib/auth-api.ts`, que lee `access_token` (también admite `token`) y lo almacena. Entrada: `OAuth2PasswordRequestForm` (`username`, `password`, formulario URL encoded). Salida inferida del return: `{access_token: string, token_type: "bearer"}`. Éxito: 200; error de credenciales: 401.
- Necesarios: el token emitido y su tipo. El `access_token` es deliberadamente público para iniciar sesión; no es un secreto de servicio. Las credenciales de entrada no se devuelven.
- Estado inicial: ❌ sin contrato explícito.
- Contrato final: pendiente; preservar los nombres y forma consumidos.
- Cambios/evidencia: pendientes.

#### GET `/auth/me` (auth-api)
- Archivo/handler: `services/auth-api/auth.py`, `get_me` y `_user_response`. Propósito: devolver el usuario autenticado. Consumidores: `uis/talent-pipeline-tracker/lib/auth-api.ts` y `app/account/profile/page.tsx`.
- Entrada: Bearer token. Salida inferida: `id`, `email`, `is_active`, `role` y `profile`; el perfil proviene de TinyDB y puede incluir `user_id`, `name`, `phone` y `address`. Éxito: 200; autenticación inválida: 401.
- Necesarios por UI: `email` y `profile.name/phone/address`; el formulario también tolera esos campos en la raíz. `id`, `is_active` y `role` son datos propios de la cuenta; el consumidor actual no los lee. No se devuelve `hashed_password` porque `_user_response` proyecta manualmente sus campos.
- Estado inicial: ❌ sin `response_model`; el objeto anidado de TinyDB no está filtrado.
- Contrato final: pendiente; conservar compatibilidad y excluir `profile.user_id` redundante/interno.
- Cambios/evidencia: pendientes.

#### POST `/auth/forgot-password` (auth-api)
- Archivo/handler: `services/auth-api/auth.py`, `forgot_password`. Propósito: solicitar un enlace de restablecimiento. Consumidor: `uis/talent-pipeline-tracker/lib/auth-api.ts`.
- Entrada: JSON `{email: str}` (`ForgotPasswordRequest`). Salida inferida: `{message: str}`. Éxito: 200. El texto es genérico independientemente de que el usuario exista; no debe alterarse para evitar enumeración de cuentas.
- Necesarios: el mensaje genérico. No se devuelve email, token de restablecimiento ni estado de existencia.
- Estado inicial: ❌ respuesta JSON sin esquema.
- Contrato final: pendiente, `{message: str}`.
- Cambios/evidencia: pendientes.

#### POST `/auth/reset-password` (auth-api)
- Archivo/handler: `services/auth-api/auth.py`, `reset_password`. Propósito: consumir token temporal y cambiar contraseña. Consumidor: `uis/talent-pipeline-tracker/lib/auth-api.ts`.
- Entrada: JSON `{token: str, new_password: str}`. Salida inferida en éxito: `{message: str}`; errores HTTP 400 para token inválido/expirado. Éxito: 200.
- Necesarios: mensaje de confirmación. Token y contraseña solo son entrada; el hash persistido no sale.
- Estado inicial: ❌ sin esquema de respuesta.
- Contrato final: pendiente, `{message: str}`.
- Cambios/evidencia: pendientes.

#### POST `/auth/change-password` (auth-api)
- Archivo/handler: `services/auth-api/auth.py`, `change_password`. Propósito: cambiar la contraseña del usuario autenticado. Consumidor: cliente de auth del tracker.
- Entrada: JSON `{current_password: str, new_password: str}` y Bearer token. Salida inferida en éxito: `{message: str}`; contraseña actual incorrecta: HTTP 400. Éxito: 200.
- Necesarios: mensaje. Las contraseñas solo son entrada; el hash no sale.
- Estado inicial: ❌ sin esquema de respuesta.
- Contrato final: pendiente, `{message: str}`.
- Cambios/evidencia: pendientes.

#### GET `/profiles/me` (auth-api)
- Archivo/handler: `services/auth-api/profiles.py`, `get_my_profile`. Propósito: leer el perfil propio. Consumidor: `app/account/profile/page.tsx`.
- Entrada: Bearer token. Salida inferida: `user_id`, `name`, `phone`, `address`; para perfil inexistente, `user_id` y los tres campos con `null`. Éxito: 200.
- Necesarios: nombre, teléfono y dirección. La UI de edición no utiliza `user_id`.
- Estado inicial: ❌ devuelve documento TinyDB sin esquema.
- Contrato final: pendiente; proyección explícita de campos de perfil, sin `user_id`.
- Cambios/evidencia: pendientes.

#### PUT `/profiles/me` (auth-api)
- Archivo/handler: `services/auth-api/profiles.py`, `edit_my_profile`. Propósito: actualizar perfil propio. Consumidor: `app/account/profile/page.tsx`.
- Entrada: `ProfileUpdate` limitado a `name`, `phone`, `address`; usa `exclude_unset`, preservando la distinción entre omitido y `null`. Salida inferida: documento TinyDB con `user_id` más esos campos. Éxito: 200.
- Necesarios: `name`, `phone`, `address`; `user_id` no es consumido. El esquema de entrada ya impide mass assignment de campos internos.
- Estado inicial: ❌ sin contrato de salida.
- Contrato final: pendiente; misma proyección que GET, manteniendo semántica parcial actual de la entrada.
- Cambios/evidencia: pendientes.

#### POST `/users` (auth-api)
- Archivo/handler: `services/auth-api/users.py`, `register`. Propósito: registrar usuario. Consumidor: `uis/talent-pipeline-tracker/lib/auth-api.ts`, que ignora el cuerpo y luego hace login.
- Entrada: `UserCreate` (`email`, `password`, `name`, `phone`, `address`). Salida inferida: `id`, `email`, `is_active`, `role`. Éxito: 201; email duplicado: 400.
- Necesarios para el consumidor actual: ninguno del cuerpo de respuesta. `email` vuelve a reflejar un dato personal de una operación pública sin necesidad identificada; la contraseña/hash no aparece en el return.
- Estado inicial: ❌ JSON estructurado sin esquema.
- Contrato final: pendiente; definir proyección explícita y decidir eliminación de email por minimización, con verificación del consumidor antes de cambiarlo.
- Cambios/evidencia: pendientes.

### Auth API: inventario

#### GET `/inventory/products` (auth-api)
- Archivo/handler: `services/auth-api/routers/inventory.py`, `get_products`. Propósito: listar SKU con stock calculado. Consumidores: backoffice, `lib/inventory.ts`, páginas de productos y formularios inbound/outbound.
- Entrada: ninguna. Salida inferida y tipada: lista de `id`, `name`, `sku`, `client_name`, `category`, `warehouse`, `current_stock`. Éxito: 200. `response_model`: `list[SKUResponse]`.
- Los consumidores leen estos campos; no se incluyen relaciones ORM ni campos de movimientos.
- Estado inicial: ✅ contrato explícito y acorde a la proyección construida.
- Contrato final: conservar `list[SKUResponse]`.
- Cambios/evidencia: validar al completar.

#### POST `/inventory/products` (auth-api)
- Archivo/handler: `services/auth-api/routers/inventory.py`, `create_product`. Propósito: crear SKU. Consumidor: backoffice vía `lib/inventory.ts`.
- Entrada: `SKUCreate` (`name`, `sku`, `client_name`, `category`, `warehouse`). Salida: `SKUResponse` con esos campos, `id` y `current_stock: 0`. Éxito: 200. `response_model`: `SKUResponse`.
- Entrada y salida están separadas; no se permite asignar `id` ni stock al crear.
- Estado inicial: ✅ contrato explícito.
- Contrato final: conservar `SKUResponse`.
- Cambios/evidencia: validar al completar.

#### GET `/inventory/products/{product_id}` (auth-api)
- Archivo/handler: `services/auth-api/routers/inventory.py`, `get_product`. Propósito: obtener SKU y stock. Consumidor: helper de backoffice `getProduct`; no se encontró llamada visible en páginas revisadas.
- Entrada: `product_id: int`. Salida: mismos campos de `SKUResponse`. Éxito: 200; inexistente: 404. `response_model`: `SKUResponse`.
- Estado inicial: ✅ contrato explícito.
- Contrato final: conservar `SKUResponse`.
- Cambios/evidencia: validar al completar.

#### POST `/inventory/orders/inbound` (auth-api)
- Archivo/handler: `services/auth-api/routers/inventory.py`, `create_inbound_order`. Propósito: registrar entrada de inventario. Consumidor: backoffice `lib/inventory.ts` y formulario inbound.
- Entrada: `StockEntryCreate` (`sku_id`, `quantity`, `reference`, `warehouse`). Salida tipada: entrada más `id`, `created_at`, `user_uuid`. Éxito: 200; producto inexistente: 404. `response_model`: `StockEntryResponse`.
- La UI espera `user_uuid` en su tipo, aunque el formulario solo espera la operación y no lee el valor devuelto. Es un UUID interno del usuario.
- Estado inicial: ⚠️ esquema tipado pero incluye un identificador interno no consumido en la respuesta de creación.
- Contrato final: pendiente de decisión de minimización y ajuste del tipo de consumidor si se elimina.
- Cambios/evidencia: pendientes.

#### POST `/inventory/orders/outbound` (auth-api)
- Archivo/handler: `services/auth-api/routers/inventory.py`, `create_outbound_order`. Propósito: registrar salida. Consumidor: backoffice `lib/inventory.ts` y formulario outbound.
- Entrada: `StockExitCreate` (`sku_id`, `quantity`, `exit_type`, `tracking_number`, `warehouse`) con validación de tipo de salida. Salida tipada: entrada más `id`, `created_at`, `user_uuid`. Éxito: 200; errores de producto/stock: 404/400. `response_model`: `StockExitResponse`.
- El formulario no usa el `user_uuid` devuelto; se trata de identificador interno.
- Estado inicial: ⚠️ tipado, pero incluye campo interno no consumido en la respuesta de creación.
- Contrato final: pendiente de decisión y ajuste de tipo frontend si se elimina.
- Cambios/evidencia: pendientes.

#### GET `/inventory/orders` (auth-api)
- Archivo/handler: `services/auth-api/routers/inventory.py`, `get_orders`. Propósito: listar movimientos inbound/outbound. Consumidor: `uis/backoffice/src/app/backoffice/inventory/orders/page.tsx`.
- Entrada: ninguna. Salida inferida: lista de `{id, movement_type, quantity, created_at, user_uuid, sku:{id,name,sku,client_name,category,warehouse}}`; se construye desde joins de `StockEntry`/`StockExit` con `SKU` y se ordena por `created_at`. Éxito: 200. El `OrderResponse` existente no se declara en el decorador y usa `product` en lugar de `sku`.
- La UI consume `sku.name`, `movement_type` y `user_uuid`; el UUID se muestra para movimientos de otros usuarios. El objeto SKU es una proyección sin stock actual.
- Estado inicial: ❌ sin `response_model`; hay un modelo existente incompatible y una exposición de identificador interno en un listado multiusuario.
- Contrato final: pendiente; mantener `sku` y campos visuales necesarios, eliminar el UUID interno requiere cambio mínimo del consumidor.
- Cambios/evidencia: pendientes.

### Router TrackFlow publicado por auth-api

Las tres fichas siguientes corresponden a la misma implementación de `services/trackflow-api/app/domains/inventory/api/router.py`, registrada desde `services/auth-api/main.py` en auth-api bajo `/api/v1` y protegida por `get_current_user` en el `include_router`.

#### GET `/api/v1/inventory/stock/{sku}` (auth-api)
- Handler `get_stock`; consulta `InventoryItem` y delega en `InventoryService`. Entrada: SKU en path. Salida `StockResponse {sku: str, quantity: int}`. Éxito: 200; SKU ausente: 404. Consumidor frontend identificado: ninguno por búsqueda de llamadas.
- Estado inicial: ✅ `response_model=StockResponse`, contrato explícito. Final: conservar. Evidencia runtime: pendiente por dependencia `sqlmodel`.

#### GET `/api/v1/inventory/stock/{sku}/by-warehouse` (auth-api)
- Handler `get_stock_by_warehouse`; salida lista de `{warehouse: str, quantity: int}` desde filas `InventoryItem`. Éxito: 200; sin filas: 404. `response_model=list[StockByWarehouseResponse]`. Consumidor frontend identificado: ninguno por búsqueda de llamadas.
- Estado inicial: ✅ contrato explícito. Final: conservar. Evidencia runtime: pendiente.

#### POST `/api/v1/inventory/stock/alerts` (auth-api)
- Handler `create_stock_alert`; entrada `InventoryAlertCreate {sku, warehouse, threshold}` y salida `InventoryAlertResponse` con `id`; éxito: 201, SKU inexistente: 404. Persistencia usa `InventoryAlert`; consumidor frontend identificado: ninguno por búsqueda.
- Estado inicial: ✅ contratos de entrada/salida explícitos y separados. No se exponen campos ORM adicionales. Final: conservar. Evidencia runtime: pendiente.

### TrackFlow API independiente

Las rutas de inventario siguientes también se registran en `services/trackflow-api/app/main.py` mediante `app.include_router(api_router, prefix="/api/v1")`; son la misma implementación y sus respuestas que las expuestas por auth-api.

#### GET `/api/v1/inventory/stock/{sku}` (trackflow-api)
- Handler `get_stock`; entrada SKU en path; salida `StockResponse {sku: str, quantity: int}`; éxito 200, ausencia 404; response model explícito. Consumidor frontend rastreable: ninguno.
- Estado inicial: ✅. Contrato final: conservar. Verificación runtime pendiente.

#### GET `/api/v1/inventory/stock/{sku}/by-warehouse` (trackflow-api)
- Handler `get_stock_by_warehouse`; salida `list[StockByWarehouseResponse]`, cada elemento `{warehouse: str, quantity: int}`; éxito 200, ausencia 404. Consumidor frontend rastreable: ninguno.
- Estado inicial: ✅. Contrato final: conservar. Verificación runtime pendiente.

#### POST `/api/v1/inventory/stock/alerts` (trackflow-api)
- Handler `create_stock_alert`; entrada `InventoryAlertCreate {sku, warehouse, threshold}`; salida `InventoryAlertResponse` con `id`; éxito 201, SKU ausente 404. Consumidor frontend rastreable: ninguno.
- Estado inicial: ✅. Contratos explícitos. Contrato final: conservar. Verificación runtime pendiente.

#### GET `/health` (trackflow-api)
- Archivo/handler: `services/trackflow-api/app/main.py`, `health`. Propósito: salud del proceso. Consumidor identificado: ninguno en los fuentes UI revisados.
- Entrada: ninguna. Salida inferida por return y anotación: `{status: "ok", service: "trackflow-api"}`; éxito 200. Está anotada como `dict[str, str]`, pero no tiene esquema Pydantic ni `response_model`.
- Estado inicial: ❌ salida estructurada sin contrato explícito.
- Contrato final: pendiente, objeto explícito con `status` y `service`.
- Evidencia runtime: pendiente.

## D. Seguridad y decisiones de compatibilidad

- Ninguna respuesta devuelve `password`, `new_password`, `current_password`, `hashed_password`, tokens de restablecimiento ni registros de usuarios/credenciales completos. Los modelos de salida de perfil, usuario actual y registro filtran explícitamente esas propiedades.
- El token de acceso de login es una salida funcional intencional que el consumidor guarda; no debe eliminarse ni ocultarse.
- La respuesta de recuperación conserva el mismo mensaje exista o no la cuenta; se verificó el camino de usuario inexistente, evitando enumeración.
- `GET /auth/me` conserva `id`, `email`, `is_active`, `role` y los campos de perfil; la salida anidada filtra el `user_id` duplicado. Email y datos del perfil siguen disponibles para la UI.
- Se retiró `user_uuid` de las respuestas de creación y del historial. Se actualizó el tipo frontend y se eliminó la columna del historial que mostraba IDs de otros usuarios; el usuario autenticado sigue determinándose por autorización, no por ese campo de salida.
- La respuesta pública de registro ya no repite `email`; el consumidor ignora el cuerpo del registro y hace login inmediatamente después. La clave `id`, estado y rol permanecen en la respuesta.
- `GET /inventory/orders` devuelve la clave `sku`, usada directamente por la UI. No sustituirla por `product`; el modelo `OrderResponse` existente no refleja la respuesta real.
- El historial proyecta `sku` con sus seis campos descriptivos y sin `current_stock`; la entrada `OrderResponse` antigua con clave `product` se reemplazó por el contrato observado en el handler.
- Se agregó `threshold >= 0` al esquema de entrada de alertas, alineado con `InventoryAlert.threshold` del ORM; no se alteraron persistencia ni reglas de autorización.
- La app independiente `trackflow-api` incluye su router sin una dependencia de autenticación; al montarlo dentro de `auth-api`, este agrega `get_current_user`. Es una diferencia de autorización preexistente y no se modificó como parte de una auditoría de serialización; confirmar que el despliegue independiente esté protegido por su perímetro de red/autenticación.
- No se cambiaron métodos, paths ni reglas de negocio. Las dependencias de autenticación existentes se preservaron; la exposición independiente de TrackFlow queda como riesgo de despliegue documentado.

## E. Verificaciones

### Comandos y resultados

- `.venv/bin/python -m compileall -q` sobre los ocho módulos Python editados: correcto.
- `DATABASE_URL=sqlite:////tmp/serialization-audit-tests.sqlite PYTHONPATH=.:../trackflow-api ../../.venv/bin/python -m pytest -q tests/test_serialization.py` desde `services/auth-api`: `11 passed`. La primera ejecución sin `DATABASE_URL` se detuvo durante colección; la repetición con SQLite temporal pasó.
- `uis/backoffice/node_modules/.bin/tsc --noEmit -p uis/backoffice/tsconfig.json`: correcto; no se alteraron tipos no relacionados.
- Import de ambas apps y consulta `app.openapi()`: auth-api expuso 18 operaciones y TrackFlow 4; cada respuesta JSON de éxito tiene schema (`missing success JSON schemas []` en ambas).
- Pruebas HTTP con `TestClient` sobre handlers/routers reales: se ejercitaron login, perfil actual, recuperación, restablecimiento, cambio de contraseña, GET/PUT de perfil, registro, listar/crear/leer producto, movimientos inbound/outbound/historial, stock, stock por almacén, alertas y health. Esto no equivale a ejecutar el contenedor de despliegue contra su base externa.
- `git diff --check`: correcto.
- Diagnósticos de editor para los archivos modificados: sin errores.

### Límites residuales

- No se inició el contenedor de producción ni se conectó a la base declarada por el despliegue; las escrituras HTTP de prueba usaron SQLite efímera, y correo/auth externa se simularon. Queda pendiente solo una verificación de integración en el entorno configurado, no hay un contrato sin modelo ni ruta omitida en el inventario.
- El primer test de recuperación cubre el caso de email inexistente, no la entrega SMTP real. El intento de envío real no es necesario para validar su serialización y no se invocó.
- El acceso de la app standalone de TrackFlow debe revisarse en su contexto de despliegue, porque el código de esa app no agrega auth como sí lo hace auth-api al montar el mismo router.

## F. Cierre endpoint por endpoint

Los estados a continuación son finales. Los campos de listas y anidados indican la proyección JSON pública; `datetime` se serializa como string ISO 8601. Evidencia HTTP significa petición ejecutada por `TestClient` sobre el router/handler real con dependencias locales aisladas; las 22 operaciones, incluidas las duplicadas por aplicación, se contrastaron además en OpenAPI.

| Método + ruta | Contrato final explícito | Cambio y compatibilidad | Estado final / evidencia |
|---|---|---|---|
| GET `/` (auth-api) | `HomeResponse {status: str}` | Añadido `response_model` en `services/auth-api/main.py`; sin consumidor que requiera otros campos. | Validado; registrado en OpenAPI. |
| POST `/auth/login` (auth-api) | `AccessTokenResponse {access_token: str, token_type: Literal["bearer"]}` | Añadido esquema en `services/auth-api/schemas.py` y decorador en `auth.py`; conserva token deliberado usado por cliente. | Validado; HTTP 200 y payload probado. |
| GET `/auth/me` (auth-api) | `CurrentUserResponse {id: str, email: str, is_active: bool, role: str, profile: ProfileResponse \| None}`; perfil `{name: str \| None, phone: str \| None, address: str \| None}` | Filtro explícito en `schemas.py`/`auth.py`; conserva datos del tracker y elimina hash y `profile.user_id`. | Validado; payload autenticado probado y sensible filtrado. |
| POST `/auth/forgot-password` (auth-api) | `MessageResponse {message: str}` | Esquema en `schemas.py`; texto genérico sin cambios. | Validado; HTTP 200 de usuario inexistente probado. |
| POST `/auth/reset-password` (auth-api) | `MessageResponse {message: str}` | Esquema en `schemas.py`/`auth.py`; token y nueva contraseña solo son entrada. | Validado; HTTP 200 probado con persistencia simulada. |
| POST `/auth/change-password` (auth-api) | `MessageResponse {message: str}` | Esquema en `schemas.py`/`auth.py`; hash no se devuelve. | Validado; HTTP 200 probado con usuario autenticado simulado. |
| GET `/profiles/me` (auth-api) | `ProfileResponse {name: str \| None, phone: str \| None, address: str \| None}` | Añadido esquema en `schemas.py` y decorador en `profiles.py`; omite `user_id` interno. | Validado; respuesta filtrada probada. |
| PUT `/profiles/me` (auth-api) | `ProfileResponse` con los mismos tres campos nullable | Entrada `ProfileUpdate` permanece limitada; se conserva `exclude_unset` y la respuesta omite `user_id`. | Validado; actualización parcial y respuesta probadas. |
| POST `/users` (auth-api) | `UserRegistrationResponse {id: str, is_active: bool, role: str}` | Esquema en `schemas.py`/`users.py`; email omitido porque el tracker ignora cuerpo e inicia sesión después. | Validado; HTTP 201 probado sin email/hash. |
| GET `/inventory/products` (auth-api) | `list[SKUResponse]`: `id: int, name: str, sku: str, client_name: str, category: str, warehouse: str, current_stock: int` | Sin cambio de contrato; contrato existente corresponde al listado usado por backoffice. | Validado; listado HTTP probado. |
| POST `/inventory/products` (auth-api) | `SKUResponse` con campos de producto y stock actual | Entrada `SKUCreate` se mantiene separada; salida tipada existente. | Validado; creación HTTP probada. |
| GET `/inventory/products/{product_id}` (auth-api) | `SKUResponse` con campos de producto y stock actual | Contrato existente conservado. | Validado; detalle HTTP probado. |
| POST `/inventory/orders/inbound` (auth-api) | `StockEntryResponse {sku_id: int, quantity: int, reference: str, warehouse: str, id: int, created_at: datetime}` | `user_uuid` retirado de esquema; UI no lee la respuesta de creación. Tipo TS actualizado. | Validado; entrada HTTP probada sin UUID. |
| POST `/inventory/orders/outbound` (auth-api) | `StockExitResponse {sku_id: int, quantity: int, exit_type: str, tracking_number: str \| None, warehouse: str, id: int, created_at: datetime}` | `user_uuid` retirado; reglas de tipo de salida y tracking se preservan. Tipo TS actualizado. | Validado; salida HTTP probada sin UUID. |
| GET `/inventory/orders` (auth-api) | `list[OrderResponse]`: `{id: int, movement_type: Literal["inbound", "outbound"], quantity: int, created_at: datetime, sku: SKUOrderResponse}`; `sku` tiene `id, name, sku, client_name, category, warehouse` | Añadido `response_model`; proyección real conserva clave `sku`, omite `user_uuid` y `current_stock`. Se quitó columna y tipo de UUID en backoffice. | Validado; historial HTTP con ambos tipos probado. |
| GET `/api/v1/inventory/stock/{sku}` (auth-api) | `StockResponse {sku: str, quantity: int}` | Contrato existente compartido; ruta protegida conserva dependencia auth. | Validado; ruta presente en OpenAPI; handler HTTP probado vía router compartido. |
| GET `/api/v1/inventory/stock/{sku}/by-warehouse` (auth-api) | `list[StockByWarehouseResponse]`, elemento `{warehouse: str, quantity: int}` | Contrato existente compartido; sin consumidor encontrado que requiera otros campos. | Validado; ruta presente en OpenAPI y handler probado. |
| POST `/api/v1/inventory/stock/alerts` (auth-api) | `InventoryAlertResponse {sku: str, warehouse: str, threshold: int, id: int}` | Contrato existente; el input ahora declara `threshold >= 0`, igual que ORM. | Validado; HTTP 201 probado con threshold válido. |
| GET `/health` (trackflow-api) | `HealthResponse {status: str, service: str}` | Añadido modelo y `response_model` en `services/trackflow-api/app/main.py`. | Validado; HTTP 200 probado. |
| GET `/api/v1/inventory/stock/{sku}` (trackflow-api) | `StockResponse {sku: str, quantity: int}` | Contrato existente conservado. | Validado; ruta y schema OpenAPI confirmados; handler cubierto por prueba HTTP compartida. |
| GET `/api/v1/inventory/stock/{sku}/by-warehouse` (trackflow-api) | `list[StockByWarehouseResponse]`, elemento `{warehouse: str, quantity: int}` | Contrato existente conservado. | Validado; ruta y schema OpenAPI confirmados; handler cubierto por prueba HTTP compartida. |
| POST `/api/v1/inventory/stock/alerts` (trackflow-api) | `InventoryAlertResponse {sku: str, warehouse: str, threshold: int, id: int}` | Contrato existente; misma validación no negativa del esquema compartido. | Validado; ruta y schema OpenAPI confirmados; handler cubierto por prueba HTTP compartida. |
