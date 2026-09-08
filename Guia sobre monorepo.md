# Trabajo práctico: Gestor de incidencias sobre el monorepo

> Este proyecto **no se hace en un repositorio nuevo**. Se continúa trabajando sobre el monorepo que cada alumno viene usando desde los hitos anteriores.

La idea del trabajo es convertir el análisis de incidencias del proyecto anterior en una aplicación completa:

- guardar incidencias en la base de datos;
- cargar el histórico del CSV como `seed`;
- exponer una API para crear, listar, filtrar y cambiar estados;
- construir una interfaz para registrar y gestionar incidencias;
- manejar correctamente errores, cargas y respuestas lentas;
- reutilizar la lógica de validación ya creada en el proyecto anterior.

---

# 1. Abrir el monorepo existente

Entrá en GitHub al repositorio que venís utilizando desde las clases anteriores.

No crees otro repositorio.

Desde GitHub:

1. Abrí tu repositorio.
2. Hacé clic en **Code**.
3. Entrá en la pestaña **Codespaces**.
4. Abrí el Codespace existente o creá uno nuevo sobre tu repositorio.

Cuando VS Code termine de abrir, comprobá dónde estás:

```bash
pwd
ls
```

Deberías estar en la raíz del monorepo y ver carpetas parecidas a estas:

```text
scripts/
packages/
services/
uis/
data/
docs/
...
```

Antes de tocar código, actualizá tu rama principal:

```bash
git checkout main
git pull
```

Creá una rama para este trabajo:

```bash
git checkout -b feat/incidents-manager
```

---

# 2. Leer el contexto de tu empresa

Este paso es obligatorio.

Abrí:

```text
CONTEXT-company.md
```

o, si tu repositorio usa el otro nombre:

```text
CONTEXT.md
```

También podés leerlo desde terminal:

```bash
cat CONTEXT-company.md
```

Buscá especialmente:

- categorías válidas de incidencias;
- sedes o `branches`;
- nombre de la sede central;
- transformaciones del CSV anterior;
- estados utilizados en el proyecto anterior;
- nombres exactos de campos;
- valores esperados después de transformar el CSV.

## Importante

No inventes categorías ni sedes genéricas.

Los valores deben coincidir exactamente con tu `CONTEXT`.

Ejemplo:

```python
VALID_CATEGORIES = [
    # valores reales definidos en tu CONTEXT
]

VALID_BRANCHES = [
    # sedes reales definidas en tu CONTEXT
    "central",
]
```

---

# 3. Identificar el backend, frontend y CSV que ya existen

Como cada alumno puede haber usado nombres diferentes, primero mirá qué tenés.

```bash
ls services
ls uis
ls scripts
```

Para encontrar el CSV anterior:

```bash
find . -maxdepth 3 -type f -iname "*incident*.csv"
```

Para localizar el backend:

```bash
find services -maxdepth 3 \( -name "requirements.txt" -o -name "pyproject.toml" \)
```

Para localizar el frontend:

```bash
find uis -maxdepth 3 -name "package.json"
```

A partir de ahora vamos a llamar:

```text
services/<tu-api>/
uis/<tu-ui>/
```

a las aplicaciones que ya existen.

**No crees un backend o frontend paralelo si el Hito 5 ya dejó uno funcionando.**

---

# 4. Crear la estructura necesaria

La entrega debe respetar esta organización:

```text
scripts/
└── seed_incidents.py

packages/
└── shared/
    └── lógica compartida de validación

services/
└── <tu-api>/
    └── backend existente + endpoints de incidencias

uis/
└── <tu-ui>/
    └── frontend existente + páginas de incidencias
```

Podés crear los archivos que falten con:

```bash
mkdir -p scripts
mkdir -p packages/shared
touch scripts/seed_incidents.py
```

No hace falta borrar ni mover lo que ya funciona.

---

# 5. Extraer la validación compartida

En el proyecto anterior ya existía lógica para validar y transformar las filas del CSV.

Ahora esa lógica no debe quedar copiada tres veces como si el mantenimiento del software fuera una actividad recreativa.

La misma validación debe ser reutilizada por:

1. el script del CSV;
2. la API;
3. cualquier otra parte del backend que necesite validar incidencias.

Guardala dentro de:

```text
packages/shared/
```

Por ejemplo:

```text
packages/shared/
├── __init__.py
└── incidents.py
```

Una estructura posible:

```python
# packages/shared/incidents.py

VALID_STATUS = {
    "open",
    "in_progress",
    "resolved",
    "discarded",
}

VALID_ORIGINS = {
    "customer",
    "branch",
    "internal",
}

VALID_CATEGORIES = {
    # completar con las categorías de CONTEXT
}

VALID_BRANCHES = {
    # completar con las sedes de CONTEXT
    "central",
}


def validate_category(value: str) -> str:
    if value not in VALID_CATEGORIES:
        raise ValueError("Categoría no válida")
    return value


def validate_origin(value: str) -> str:
    if value not in VALID_ORIGINS:
        raise ValueError("Origen no válido")
    return value


def validate_branch(value: str) -> str:
    if value not in VALID_BRANCHES:
        raise ValueError("Sede no válida")
    return value


def validate_status(value: str) -> str:
    if value not in VALID_STATUS:
        raise ValueError("Estado no válido")
    return value
```

Lo importante no es copiar exactamente este código.

Lo importante es que **la lógica esté en un único lugar y sea reutilizada**.

---

# 6. Crear el modelo `Incident`

En la base de datos existente agregá un modelo llamado:

```text
Incident
```

Debe tener como mínimo:

| Campo | Función |
|---|---|
| `id` | identificador único generado automáticamente |
| `title` | título corto obligatorio |
| `description` | descripción detallada obligatoria |
| `category` | categoría definida en `CONTEXT` |
| `status` | estado del ciclo de vida |
| `origin` | origen del reporte |
| `branch` | sede relacionada |
| `created_at` | fecha de creación automática |
| `updated_at` | última modificación automática |

Valores permitidos para `status`:

```text
open
in_progress
resolved
discarded
```

Valores permitidos para `origin`:

```text
customer
branch
internal
```

`branch` debe ser obligatorio.

Cuando una incidencia no corresponda a una sede concreta:

```text
branch = "central"
```

## Restricciones

No alcanza con validar solamente en el frontend.

La API y, cuando la tecnología utilizada lo permita, la propia base de datos deben impedir valores inválidos.

Ejemplo conceptual con SQLAlchemy:

```python
class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=False)
    status = Column(String, nullable=False, default="open")
    origin = Column(String, nullable=False)
    branch = Column(String, nullable=False)

    created_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
```

Adaptá este ejemplo al ORM y estructura que ya use tu backend.

---

# 7. Crear o actualizar las tablas

Usá el mismo sistema que ya utiliza el proyecto.

Si el backend crea las tablas automáticamente:

```python
Base.metadata.create_all(bind=engine)
```

no hace falta inventar otro sistema.

Si el proyecto ya usa migraciones, creá una migración nueva en lugar de borrar la base de datos.

La regla es simple:

> **extender el proyecto existente, no reiniciarlo desde cero.**

---

# 8. Crear `scripts/seed_incidents.py`

El script debe leer el CSV del proyecto anterior e insertar todas las incidencias históricas válidas.

Archivo:

```text
scripts/seed_incidents.py
```

Debe hacer este flujo:

```text
abrir CSV
    ↓
leer fila
    ↓
transformar campos
    ↓
validar
    ↓
¿ya existe?
   ├── sí → saltar
   └── no → insertar
    ↓
mostrar resumen final
```

---

# 9. Transformar el CSV al nuevo modelo

Antes de insertar, aplicá las transformaciones indicadas por tu `CONTEXT`.

La consigna menciona especialmente:

```text
estado       → status
categoría    → category
description  → title
date         → created_at
ubicación    → branch
```

Además:

```text
origin = "customer"
```

para **todos los registros provenientes del CSV histórico**.

Ejemplo conceptual:

```python
incident_data = {
    "title": transform_title(row),
    "description": transform_description(row),
    "category": transform_category(row),
    "status": transform_status(row),
    "origin": "customer",
    "branch": transform_branch(row),
    "created_at": transform_date(row),
}
```

Las funciones `transform_*` deben usar las reglas reales de tu empresa.

### Sobre `title` y `description`

Si el CSV anterior solo tenía una descripción larga y tu `CONTEXT` indica que de allí debe salir el título, podés derivar un título corto y conservar el texto completo como descripción.

Por ejemplo:

```python
description = row["description"].strip()
title = description[:80]
```

Solo hacé esto si es coherente con las reglas de tu `CONTEXT`.

---

# 10. Hacer el seed idempotente

El script debe poder ejecutarse dos veces sin duplicar datos.

O sea:

```bash
python scripts/seed_incidents.py
python scripts/seed_incidents.py
```

La segunda ejecución no debe volver a insertar las mismas filas.

La mejor opción es utilizar el identificador único que ya tenga el CSV histórico.

Si necesitás conservarlo sin reemplazar el `id` interno de la base de datos, podés agregar un campo técnico como:

```text
source_id
```

o:

```text
legacy_id
```

con restricción `unique`.

Ejemplo:

```python
existing = (
    db.query(Incident)
    .filter(Incident.source_id == row["id"])
    .first()
)

if existing:
    skipped += 1
    continue
```

Así:

- `id` sigue siendo el identificador interno autogenerado;
- `source_id` identifica el registro original del CSV;
- el seed puede detectar que ya fue importado.

---

# 11. No insertar filas inválidas

Una fila inválida:

- no debe romper toda la ejecución;
- no debe insertarse;
- debe registrarse para mostrarla al final.

Ejemplo:

```python
invalid_rows = []

for line_number, row in enumerate(reader, start=2):
    try:
        data = transform_and_validate(row)
        insert_incident(data)

    except ValueError as error:
        invalid_rows.append({
            "line": line_number,
            "error": str(error),
        })
```

Al terminar:

```text
Seed terminado

Insertadas: 92
Omitidas por existir: 5
Inválidas: 3

Fila 14: categoría desconocida
Fila 38: fecha inválida
Fila 71: sede inexistente
```

Eso es muchísimo más útil que escupir un traceback de cuarenta líneas y esperar que alguien rece.

---

# 12. Ejecutar el seed

Desde la raíz del monorepo:

```bash
python scripts/seed_incidents.py
```

Si tu proyecto usa un entorno virtual:

```bash
source .venv/bin/activate
python scripts/seed_incidents.py
```

Ejecutalo nuevamente:

```bash
python scripts/seed_incidents.py
```

Comprobá que la cantidad de registros no aumente.

---

# 13. Crear los esquemas de entrada y salida de la API

No devuelvas directamente cualquier cosa que llegue del frontend.

Creá esquemas para:

- crear incidencia;
- devolver incidencia;
- cambiar estado;
- devolver resumen.

Ejemplo conceptual con Pydantic:

```python
class IncidentCreate(BaseModel):
    title: str
    description: str
    category: str
    status: str = "open"
    origin: str
    branch: str


class IncidentStatusUpdate(BaseModel):
    status: str
```

La validación de categorías, sedes, estados y orígenes debe reutilizar la lógica de:

```text
packages/shared/
```

---

# 14. Crear `POST /api/incidents`

Endpoint:

```http
POST /api/incidents
```

Debe:

1. recibir una incidencia;
2. validar campos obligatorios;
3. validar `status`;
4. validar `origin`;
5. validar `category`;
6. validar `branch`;
7. insertar;
8. devolver el registro creado.

Ejemplo de body:

```json
{
  "title": "Error al procesar un pedido",
  "description": "El sistema no permite confirmar el pedido.",
  "category": "VALOR_REAL_DEL_CONTEXT",
  "status": "open",
  "origin": "branch",
  "branch": "SEDE_REAL_DEL_CONTEXT"
}
```

Si falta un campo o contiene un valor inválido:

```http
400 Bad Request
```

Ejemplo de respuesta:

```json
{
  "error": "validation_error",
  "field": "title",
  "message": "El título es obligatorio"
}
```

---

# 15. Crear `GET /api/incidents`

Endpoint:

```http
GET /api/incidents
```

Sin filtros devuelve todas las incidencias.

Debe aceptar filtros opcionales:

```text
status
origin
branch
category
```

Ejemplos:

```http
GET /api/incidents?status=open
```

```http
GET /api/incidents?origin=customer
```

```http
GET /api/incidents?branch=central
```

```http
GET /api/incidents?status=open&origin=branch
```

La API debe combinar los filtros recibidos.

Si no existen incidencias:

```json
[]
```

No debe responder `404`.

---

# 16. Crear `GET /api/incidents/{id}`

Endpoint:

```http
GET /api/incidents/{id}
```

Si existe:

```http
200 OK
```

Si no existe:

```http
404 Not Found
```

Ejemplo:

```json
{
  "error": "not_found",
  "message": "Incidencia no encontrada"
}
```

---

# 17. Implementar el ciclo de vida

Una incidencia no puede cambiar a cualquier estado.

Las transiciones válidas son:

```text
open
├── in_progress
└── discarded

in_progress
├── resolved
└── discarded

resolved
└── estado final

discarded
└── estado final
```

Podés representar las reglas así:

```python
ALLOWED_TRANSITIONS = {
    "open": {"in_progress", "discarded"},
    "in_progress": {"resolved", "discarded"},
    "resolved": set(),
    "discarded": set(),
}
```

---

# 18. Crear `PATCH /api/incidents/{id}/status`

Endpoint:

```http
PATCH /api/incidents/{id}/status
```

Body:

```json
{
  "status": "in_progress"
}
```

Antes de actualizar:

```python
allowed = ALLOWED_TRANSITIONS[current_status]

if new_status not in allowed:
    raise InvalidStatusTransition(...)
```

Una transición inválida debe devolver:

```http
400 Bad Request
```

Ejemplo:

```json
{
  "error": "invalid_status_transition",
  "field": "status",
  "message": "Una incidencia resuelta no puede volver a estado abierto"
}
```

---

# 19. Crear `GET /api/incidents/summary`

Este endpoint devuelve métricas agregadas.

```http
GET /api/incidents/summary
```

Debe incluir totales:

- por estado;
- por categoría;
- por origen;
- por sede.

Ejemplo:

```json
{
  "total": 100,
  "by_status": {
    "open": 20,
    "in_progress": 10,
    "resolved": 65,
    "discarded": 5
  },
  "by_category": {},
  "by_origin": {
    "customer": 100,
    "branch": 0,
    "internal": 0
  },
  "by_branch": {}
}
```

Si la base de datos está vacía:

```json
{
  "total": 0,
  "by_status": {},
  "by_category": {},
  "by_origin": {},
  "by_branch": {}
}
```

El endpoint no debe romperse por no tener datos.

---

# 20. Manejar correctamente los errores del backend

La API debe diferenciar tres situaciones.

## Error de validación

```http
400
```

Respuesta comprensible:

```json
{
  "error": "validation_error",
  "field": "category",
  "message": "La categoría seleccionada no es válida"
}
```

## Recurso inexistente

```http
404
```

```json
{
  "error": "not_found",
  "message": "Incidencia no encontrada"
}
```

## Error inesperado

```http
500
```

```json
{
  "error": "internal_error",
  "message": "No se pudo completar la operación"
}
```

Nunca devuelvas al navegador:

- traceback;
- rutas internas del servidor;
- variables de entorno;
- consultas SQL completas;
- detalles técnicos innecesarios.

---

# 21. Atención con FastAPI: `422` vs `400`

FastAPI devuelve normalmente `422` cuando Pydantic rechaza el body.

Pero esta consigna pide explícitamente:

```text
400
```

para los errores de validación.

Si tu backend usa FastAPI, podés agregar un handler para convertir esos errores a `400`.

Ejemplo:

```python
from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
):
    first_error = exc.errors()[0]

    location = first_error.get("loc", [])
    field = str(location[-1]) if location else "unknown"

    return JSONResponse(
        status_code=400,
        content={
            "error": "validation_error",
            "field": field,
            "message": first_error.get("msg", "Dato inválido"),
        },
    )
```

Esto evita perder puntos porque el framework decidió ser técnicamente correcto de una manera distinta a la rúbrica. Hermoso deporte, la programación.

---

# 22. Crear un handler global para errores `500`

Si usás FastAPI:

```python
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # Registrar el error real solamente en el servidor
    logger.exception(exc)

    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_error",
            "message": "Ocurrió un error inesperado",
        },
    )
```

El error real puede quedar en consola o logs.

El cliente recibe solamente un mensaje seguro.

---

# 23. Probar el backend antes de tocar el frontend

Levantá la API usando el comando que ya tenga tu proyecto.

Si es FastAPI y no hay un script configurado:

```bash
cd services/<tu-api>
```

Instalá dependencias si hace falta:

```bash
pip install -r requirements.txt
```

Luego:

```bash
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

Si tu archivo principal está en otra ruta, ajustá `src.main:app`.

En Codespaces abrí el puerto `8000` cuando VS Code lo detecte.

---

# 24. Probar `POST`

Desde otra terminal:

```bash
curl -X POST http://localhost:8000/api/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Prueba",
    "description": "Incidencia creada desde curl",
    "category": "CATEGORIA_REAL",
    "status": "open",
    "origin": "internal",
    "branch": "central"
  }'
```

Probá también un error:

```bash
curl -X POST http://localhost:8000/api/incidents \
  -H "Content-Type: application/json" \
  -d '{}'
```

Debe devolver:

```text
400
```

y no un traceback.

---

# 25. Probar listado y filtros

```bash
curl http://localhost:8000/api/incidents
```

```bash
curl "http://localhost:8000/api/incidents?status=open"
```

```bash
curl "http://localhost:8000/api/incidents?origin=customer"
```

```bash
curl "http://localhost:8000/api/incidents?branch=central"
```

---

# 26. Probar cambio de estado

Primero una transición válida:

```bash
curl -X PATCH http://localhost:8000/api/incidents/1/status \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress"}'
```

Después:

```bash
curl -X PATCH http://localhost:8000/api/incidents/1/status \
  -H "Content-Type: application/json" \
  -d '{"status":"resolved"}'
```

Ahora intentá volver atrás:

```bash
curl -X PATCH http://localhost:8000/api/incidents/1/status \
  -H "Content-Type: application/json" \
  -d '{"status":"open"}'
```

Debe responder:

```text
400
```

---

# 27. Probar el resumen

```bash
curl http://localhost:8000/api/incidents/summary
```

Si querés verlo formateado:

```bash
curl -s http://localhost:8000/api/incidents/summary | python -m json.tool
```

Después del seed, los totales por:

```text
status
category
```

deben coincidir con los datos transformados del proyecto anterior.

---

# 28. Crear la sección de incidencias en el frontend

Trabajá dentro del frontend existente:

```bash
cd uis/<tu-ui>
```

Instalá dependencias si todavía no lo hiciste:

```bash
npm install
```

Levantalo:

```bash
npm run dev
```

Si Codespaces necesita escuchar externamente y tu framework lo permite:

```bash
npm run dev -- --host 0.0.0.0
```

---

# 29. Crear una pequeña capa para llamar a la API

Evitá llenar los componentes de `fetch()` repetidos.

Por ejemplo:

```text
src/
├── api/
│   └── incidents.ts
├── components/
│   └── incidents/
└── ...
```

Ejemplo:

```ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getIncidents(params = {}) {
  const query = new URLSearchParams(params).toString();

  const response = await fetch(
    `${API_URL}/api/incidents?${query}`
  );

  if (!response.ok) {
    throw await response.json();
  }

  return response.json();
}
```

Usá la estructura que ya tenga tu frontend si existe una capa equivalente.

---

# 30. Crear el formulario de registro

El formulario debe ser accesible desde el menú de la aplicación.

Debe incluir:

```text
title
description
category
status
origin
branch
```

`branch`:

- siempre visible;
- siempre obligatorio;
- debe mostrar todas las sedes del `CONTEXT`;
- debe incluir `central`.

---

# 31. Resaltar `branch` cuando `origin === "branch"`

Cuando el usuario elige:

```text
origin = branch
```

el selector de sede debe destacarse visualmente.

Ejemplo con React:

```tsx
<select
  className={
    origin === "branch"
      ? "border-2 border-orange-500"
      : "border"
  }
>
```

No importa que uses Tailwind, CSS Modules o CSS común.

Lo que se evalúa es que el usuario note claramente que debe indicar desde qué sede está reportando.

---

# 32. Validar el formulario antes de enviarlo

No mandes deliberadamente formularios rotos al servidor.

Ejemplo:

```ts
if (!form.title.trim()) {
  setErrors({
    title: "El título es obligatorio",
  });

  return;
}
```

Hacé lo mismo con los campos obligatorios.

La API igualmente debe volver a validar todo.

Frontend y backend tienen responsabilidades distintas:

```text
Frontend → ayuda al usuario
Backend  → protege los datos
```

---

# 33. Mostrar estado de carga al crear una incidencia

Antes de enviar:

```ts
setLoading(true);
```

Mientras carga:

- deshabilitá el botón;
- mostrá un texto o spinner.

Ejemplo:

```tsx
<button disabled={loading}>
  {loading ? "Guardando..." : "Crear incidencia"}
</button>
```

En `finally`:

```ts
setLoading(false);
```

Así evitás que un usuario impaciente cree seis incidencias porque apretó seis veces el botón. La especie humana ya aporta suficiente caos por sí sola.

---

# 34. Mostrar errores comprensibles

Si la API responde:

```json
{
  "field": "category",
  "message": "La categoría seleccionada no es válida"
}
```

mostralo junto al campo:

```tsx
{errors.category && (
  <p>{errors.category}</p>
)}
```

No muestres:

```text
Request failed with status code 400
```

ni:

```text
ValidationError at body.category
```

Eso sirve para programadores, no para usuarios.

---

# 35. Limpiar el formulario al guardar correctamente

Después de un `POST` exitoso:

```ts
setForm(initialForm);
setSuccess("Incidencia registrada correctamente");
```

El usuario debe ver una confirmación clara.

---

# 36. Crear el panel de incidencias

Necesitás una página que liste todas las incidencias.

Debe mostrar como mínimo información útil como:

- título;
- categoría;
- estado;
- origen;
- sede;
- fecha.

También debe incluir filtros por:

```text
status
origin
branch
```

Aunque la API soporta también `category`, la rúbrica del frontend exige como mínimo esos tres.

---

# 37. Manejar los tres estados del listado

El listado debe contemplar:

## Cargando

```tsx
if (loading) {
  return <p>Cargando incidencias...</p>;
}
```

## Error

```tsx
if (error) {
  return (
    <>
      <p>No pudimos cargar las incidencias.</p>
      <button onClick={loadIncidents}>
        Reintentar
      </button>
    </>
  );
}
```

## Lista vacía

```tsx
if (incidents.length === 0) {
  return (
    <p>
      No hay incidencias para los filtros seleccionados.
    </p>
  );
}
```

Nunca dejes:

- pantalla en blanco;
- tabla vacía sin explicación;
- página rota.

---

# 38. Permitir cambiar el estado desde el listado

Cada incidencia debe permitir avanzar su estado.

Por ejemplo:

```text
open
→ in_progress
→ resolved
```

o descartarla cuando la transición esté permitida.

El frontend puede mostrar solamente los estados válidos según el estado actual.

Ejemplo:

```ts
const allowedTransitions = {
  open: ["in_progress", "discarded"],
  in_progress: ["resolved", "discarded"],
  resolved: [],
  discarded: [],
};
```

La API igualmente debe validar la transición.

---

# 39. Revertir visualmente si falla el cambio de estado

La consigna pide una actualización optimista.

Supongamos:

```text
open → in_progress
```

El usuario cambia el estado y la UI se actualiza inmediatamente.

Guardá primero el valor anterior:

```ts
const previousStatus = incident.status;
```

Actualizá la interfaz:

```ts
updateLocalStatus(id, newStatus);
```

Luego llamá a la API.

Si falla:

```ts
updateLocalStatus(id, previousStatus);
showError("No se pudo actualizar el estado");
```

Así el frontend no queda mostrando un dato que en la base de datos nunca cambió.

---

# 40. Crear el panel de resumen

El frontend debe llamar:

```http
GET /api/incidents/summary
```

y mostrar:

- total por estado;
- total por categoría;
- total por origen;
- total por sede.

Puede ser mediante:

- tarjetas;
- tablas;
- listas;
- gráficos simples.

No hace falta agregar una librería gigantesca solamente para mostrar cuatro números.

---

# 41. El resumen debe manejar su propio estado

El resumen no debe romper el resto de la página si falla.

Ejemplo:

```tsx
if (summaryLoading) {
  return <p>Cargando resumen...</p>;
}

if (summaryError) {
  return <p>No se pudo cargar el resumen.</p>;
}
```

El listado puede seguir funcionando aunque `/summary` falle.

---

# 42. Revisar CORS

Si frontend y backend corren en puertos diferentes, asegurate de que el backend permita el origen del frontend.

Por ejemplo:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

En Codespaces puede existir una URL pública distinta.

Usá la configuración que ya tenga tu proyecto y evitá abrir CORS a cualquier origen si no es necesario.

---

# 43. Configurar la URL de la API

En un frontend Next.js podría existir:

```text
.env.local
```

con:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Después de modificar variables de entorno, reiniciá:

```bash
npm run dev
```

---

# 44. Pruebas mínimas antes de entregar

## Seed

```bash
python scripts/seed_incidents.py
python scripts/seed_incidents.py
```

Comprobar:

- no duplica;
- reporta inválidos;
- `origin` del histórico es `customer`;
- los totales coinciden.

## API

Probar:

```text
POST   /api/incidents
GET    /api/incidents
GET    /api/incidents/{id}
PATCH  /api/incidents/{id}/status
GET    /api/incidents/summary
```

También probar:

- body vacío;
- categoría incorrecta;
- sede incorrecta;
- estado incorrecto;
- incidencia inexistente;
- transición de estado inválida;
- base de datos vacía.

## Frontend

Comprobar:

- formulario válido;
- validación de campos;
- carga visible;
- botón deshabilitado;
- error de API;
- confirmación de éxito;
- filtros;
- listado vacío;
- reintento;
- cambio de estado;
- rollback si PATCH falla;
- panel de resumen;
- error del resumen sin romper la página.

---

# 45. Comparar el resumen contra el CSV anterior

La evaluación controla que después del seed los datos coincidan con el proyecto anterior.

Especialmente:

```text
total por status
total por category
```

Por eso no alcanza con que el script "termine sin errores".

Tenés que verificar que las transformaciones produzcan exactamente los valores esperados.

Una forma simple:

```bash
curl -s http://localhost:8000/api/incidents/summary \
  | python -m json.tool
```

Compará ese resultado con las métricas del analizador del proyecto anterior.

---

# 46. No implementar embeddings en este trabajo

La parte de embeddings es conocimiento complementario.

**No forma parte de la entrega actual.**

No hace falta agregar:

- Pinecone;
- Chroma;
- pgvector;
- embeddings de OpenAI;
- búsqueda semántica;
- clustering;
- clasificación con IA.

El CRUD de incidencias debe quedar bien hecho primero.

Más adelante los embeddings podrían usarse para:

- buscar incidencias similares;
- detectar duplicados;
- agrupar casos;
- sugerir categorías.

Pero no ahora.

---

# 47. Revisar la estructura final

Antes de entregar, debería verse aproximadamente así:

```text
monorepo/
│
├── CONTEXT-company.md
│
├── scripts/
│   └── seed_incidents.py
│
├── packages/
│   └── shared/
│       ├── __init__.py
│       └── incidents.py
│
├── services/
│   └── <tu-api>/
│       ├── modelos
│       ├── esquemas
│       ├── rutas
│       └── lógica existente del Hito 5
│
└── uis/
    └── <tu-ui>/
        ├── formulario de incidencias
        ├── listado de incidencias
        ├── filtros
        └── panel de resumen
```

No hace falta que los nombres internos sean exactamente estos.

Sí deben respetarse las carpetas principales:

```text
scripts/
services/
uis/
packages/shared/
```

---

# 48. Checklist de evaluación

## Modelo y seed

- [ ] Existe el modelo `Incident`.
- [ ] Tiene todos los campos requeridos.
- [ ] Los campos obligatorios realmente son obligatorios.
- [ ] `status` acepta solamente valores válidos.
- [ ] `origin` acepta solamente valores válidos.
- [ ] `category` coincide con `CONTEXT`.
- [ ] `branch` coincide con las sedes de `CONTEXT`.
- [ ] Existe `scripts/seed_incidents.py`.
- [ ] El seed asigna `origin = "customer"`.
- [ ] Aplica todas las transformaciones del CSV.
- [ ] Reutiliza validación desde `packages/shared/`.
- [ ] No inserta registros inválidos.
- [ ] Reporta inválidos en consola.
- [ ] Ejecutarlo dos veces no duplica registros.
- [ ] Las métricas posteriores al seed coinciden con el analizador anterior.

## Backend

- [ ] `POST /api/incidents`.
- [ ] `GET /api/incidents`.
- [ ] Filtros por `status`, `origin`, `branch`, `category`.
- [ ] `GET /api/incidents/{id}`.
- [ ] Devuelve `404` cuando corresponde.
- [ ] `PATCH /api/incidents/{id}/status`.
- [ ] Respeta las transiciones permitidas.
- [ ] Transiciones inválidas devuelven `400`.
- [ ] `GET /api/incidents/summary`.
- [ ] El resumen funciona con base vacía.
- [ ] Errores de validación devuelven `400`.
- [ ] El JSON identifica el campo problemático.
- [ ] Los `500` no exponen stack traces.

## Frontend

- [ ] Formulario accesible desde el menú.
- [ ] Incluye todos los campos.
- [ ] `branch` siempre visible.
- [ ] `branch` siempre obligatorio.
- [ ] Contiene todas las sedes del `CONTEXT`.
- [ ] Incluye `central`.
- [ ] `branch` se resalta cuando `origin === "branch"`.
- [ ] Valida campos antes de enviar.
- [ ] Muestra loading.
- [ ] Deshabilita el botón durante el POST.
- [ ] Muestra errores comprensibles.
- [ ] Los errores por campo aparecen junto al campo.
- [ ] Limpia el formulario al guardar.
- [ ] Muestra confirmación.
- [ ] Existe panel de listado.
- [ ] Tiene filtros por `status`, `origin`, `branch`.
- [ ] Muestra loading del listado.
- [ ] Muestra error y botón de reintento.
- [ ] Muestra mensaje cuando no hay resultados.
- [ ] Permite actualizar estado.
- [ ] Revierte visualmente el cambio si PATCH falla.
- [ ] Existe panel de resumen.
- [ ] El fallo del resumen no rompe la página.

## Transversal

- [ ] No se duplicó la lógica de validación.
- [ ] Se reutiliza `packages/shared/`.
- [ ] Se trabajó dentro del monorepo existente.
- [ ] El código quedó dentro de `scripts/`, `services/`, `uis/` y `packages/shared/`.

---

# 49. Preparar la entrega

Mirá los cambios:

```bash
git status
```

Agregalos:

```bash
git add .
```

Creá el commit:

```bash
git commit -m "feat: add incident management system"
```

Subí la rama:

```bash
git push -u origin feat/incidents-manager
```

Después, en GitHub:

1. Abrí un **Pull Request** hacia la rama principal.
2. Describí brevemente lo implementado.
3. Adjuntá las capturas pedidas.

---

# 50. Capturas obligatorias para el Pull Request

Incluí como mínimo:

### Captura 1

Formulario mostrando un error de validación visible.

Ejemplo:

```text
El título es obligatorio
```

### Captura 2

Panel de incidencias con datos cargados.

Debe verse que existen registros reales.

### Captura 3

Panel de resumen mostrando las métricas.

Idealmente deben verse claramente los totales por:

```text
status
category
origin
branch
```

---

# Orden recomendado de trabajo

Si querés evitar mezclar treinta errores al mismo tiempo, seguí este orden:

```text
1. Leer CONTEXT
2. Encontrar CSV anterior
3. Extraer validación a packages/shared
4. Crear modelo Incident
5. Crear seed
6. Ejecutar seed dos veces
7. Crear POST
8. Crear GET listado + filtros
9. Crear GET detalle
10. Crear PATCH status
11. Crear summary
12. Probar errores backend
13. Crear formulario frontend
14. Crear listado
15. Crear cambio de estado
16. Crear resumen
17. Probar loading/error/empty
18. Comparar métricas con CSV anterior
19. Tomar capturas
20. Commit + push + PR
```

---

# Objetivo final

Al terminar, el proyecto debe permitir este flujo completo:

```text
CSV histórico
     ↓
seed_incidents.py
     ↓
base de datos
     ↓
FastAPI / API existente
     ↓
GET / POST / PATCH / summary
     ↓
frontend del monorepo
     ↓
formulario + listado + filtros + métricas
```

Y, sobre todo, debe seguir funcionando correctamente cuando:

```text
el usuario se equivoca
la API tarda
la API falla
no existen datos
una transición de estado es inválida
el seed se ejecuta más de una vez
```

Ese manejo de errores y estados no es decoración: es una parte central de lo que se evalúa en este trabajo práctico.
