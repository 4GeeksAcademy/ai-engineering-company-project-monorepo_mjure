Actuá como un desarrollador backend senior especializado en FastAPI, Pydantic y seguridad de APIs. Tenés acceso al código de este monorepo y tu tarea es auditar y corregir los contratos de entrada y salida de todas las rutas HTTP reales de FastAPI, sin rehacer la aplicación ni romper sus consumidores.

Objetivo
No quiero simplemente agregar response_model de forma mecánica. Quiero que, antes de definir cada esquema, revises qué devuelve el endpoint actualmente, qué campos contiene ese dato, quién lo consume, qué campos necesita el consumidor y cuáles no deben exponerse.

Después tenés que aplicar esquemas Pydantic explícitos y seguros, reducir payloads innecesarios donde sea apropiado, comprobar la compatibilidad y registrar cada endpoint individualmente en:

docs/serialization-audit.md

Este archivo es un entregable obligatorio. Si no existe, crealo. Si ya existe, actualizalo sin borrar información útil ni el historial inicial de la auditoría.

Reglas de trabajo
Trabajá sobre el código real de este repositorio. No presupongas nombres de módulos, rutas, modelos, estructura de carpetas, versión de Pydantic ni motor de base de datos.
Investigá primero; recién después modificá. No inventes rutas, respuestas, consumidores, campos, tests ni resultados.
Preferí cambios mínimos, claros, mantenibles y compatibles con la arquitectura existente. Reutilizá esquemas cuando tengan exactamente el mismo contrato; separalos cuando los consumidores requieran distintas proyecciones.
No cambies innecesariamente rutas, métodos HTTP, códigos de estado, formato de paginación, nombres de campos públicos, autorización, reglas de negocio, manejo de errores ni contratos usados por el frontend. No refactorices funcionalidades ajenas a esta auditoría.
No uses dict, Any, object, response_model=Any ni un esquema comodín para aparentar que un endpoint está serializado. Usá modelos con campos explícitos cuando el endpoint devuelve JSON estructurado.
No agregues campos arbitrarios para satisfacer un test. No elimines un campo necesario sin verificar sus consumidores.
No hagas commits, pushes ni modificaciones en servicios externos. Si algo no puede comprobarse por falta de entorno, credenciales, infraestructura o datos de prueba, dejalo pendiente de verificación y documentalo; no lo marques como exitoso.
Si encontrás una ambigüedad importante sobre un campo o un consumidor, analizá el contexto y elegí la alternativa más segura sin romper compatibilidad comprobada. Documentá esa decisión. No te detengas por dudas menores.
Fase 1. Descubrir la superficie real de la API
Identificá la aplicación o aplicaciones FastAPI dentro del monorepo (por ejemplo, bajo services/ si es donde se implementó el backend), los archivos de entrada y todos los APIRouter registrados, include_router, prefijos y subaplicaciones montadas.
Inventariá todas las rutas HTTP de negocio expuestas, incluso las registradas por routers secundarios. Registrá cada combinación de método + ruta por separado cuando corresponda.
Contrastá los decoradores del código con el registro real de FastAPI (app.routes / APIRoute) y con app.openapi() cuando sea posible. No confundas rutas definidas pero no registradas con rutas efectivamente expuestas.
Excluí del inventario de negocio solo las rutas automáticas del framework (por ejemplo, /docs, /redoc, /openapi.json) e indicá esa exclusión en el informe. Documentá aparte WebSockets, archivos, streaming, redirecciones o rutas montadas que requieran un contrato no JSON.
Identificá las versiones reales de FastAPI y Pydantic, los modelos ORM/SQLModel, los esquemas actuales, los tests disponibles y los consumidores (uis/, clientes, integraciones u otros servicios) que se puedan rastrear en el código.
Para cada ruta averiguá: método, path final, archivo, función handler, propósito, código HTTP de éxito, formato efectivo de salida, response_model actual (si existe), esquema de entrada, campos efectivamente retornados o previstos, fuentes de datos y consumidores identificados.

Si no podés ejecutar un endpoint, diferenciá claramente «comprobado mediante ejecución» de «inferido por análisis estático». Nunca afirmes haber observado un payload que no pudiste ejecutar.

Fase 2. Auditar cada endpoint ANTES de cambiarlo
Clasificá cada ruta en uno de estos estados iniciales:

✅ Ya serializado: tiene response_model explícito, tipado y apropiado, con campos suficientes y seguros.
⚠️ Parcialmente serializado: existe un response_model, pero tiene campos sobrantes, sensibles, estructuras incorrectas o incompletas respecto de sus consumidores.
❌ Sin serializar: no tiene un response_model explícito para una respuesta JSON estructurada, o devuelve estructuras sin un contrato de salida controlado.
Para cada ruta determiná y documentá:

Qué campos salen actualmente y de dónde provienen. Marcá los campos solo inferidos.
Qué campos lee realmente el frontend u otro consumidor, con referencia al archivo o función consumidora cuando se encuentre.
Qué campos son necesarios, cuáles redundantes y cuáles sensibles o internos.
Cómo debería lucir la respuesta final: nombre propuesto del esquema, lista explícita de campos y sus tipos, relaciones anidadas o IDs requeridos y justificación de las decisiones.
Qué problema concreto se corrige, o por qué la ruta ya está bien.
Buscá especialmente: password, hashed_password, password_hash, contraseñas en texto plano, claves API, secrets, refresh tokens internos, credenciales, datos de configuración privada, identificadores internos innecesarios, marcas de borrado lógico, datos privados de otros usuarios y relaciones completas que el consumidor no utiliza. Revisá nombres equivalentes propios del dominio del proyecto, no solo estas palabras.

Importante: no prohíbas los datos por el nombre solamente. Un access_token emitido deliberadamente por un endpoint de login sí es parte legítima de su respuesta; un secreto de servicio o token almacenado internamente no lo es. El email de la persona autenticada puede ser necesario en GET /auth/me; en rutas públicas de registro, login, recuperación o reseteo evitá reenviarlo salvo que exista una necesidad contractual comprobada y justificada. En recuperación de contraseña, preservá respuestas genéricas que eviten revelar si un usuario existe.

No asumas que todos los identificadores relacionados son indebidos: un ID puede ser parte legítima del contrato. Elegí conscientemente entre ID, objeto anidado y proyección plana.

Creá primero el informe con el inventario y sus estados originales. Ese diagnóstico inicial debe permanecer identificable incluso después de corregir el código.

Fase 3. Implementar las correcciones
Para cada ruta JSON estructurada:

Definí o corregí un esquema Pydantic de salida con campos explícitos, tipos adecuados, nulabilidad y estructura coherente con los datos y consumidores reales.
Declaralo de forma explícita en el decorador: response_model=EsquemaCorrespondiente (o una colección tipada, por ejemplo list[Esquema], si esa es realmente la estructura actual).
Usá ConfigDict(from_attributes=True) si corresponde a Pydantic v2, o la configuración equivalente si el proyecto usa Pydantic v1. No mezcles sintaxis incompatibles.
Para listados, evaluá un esquema ligero separado del detalle, pero conservá los wrappers de paginación, metadata, filtros y campos que los consumidores existentes necesiten.
Para relaciones, devolvé el ID, una proyección plana o un objeto anidado solo cuando esté justificado. Evitá recursión, anidados excesivos y datos sensibles.
Para POST, PUT y PATCH, revisá también los esquemas de entrada. Separá entrada y salida cuando tengan permisos de escritura distintos; evitá mass assignment de campos internos. Respetá la semántica real de PATCH y los campos opcionales.
Si un handler devuelve un objeto ORM, asegurá que nunca salga en crudo: debe pasar por el contrato explícito y filtrado de salida. No cambies los modelos de base de datos simplemente para ocultar atributos en la API.
Prestá atención a los caminos alternativos de respuesta: condicionales, valores None, excepciones, respuestas manuales con JSONResponse, validación, modelos anidados, respuestas con varios códigos de éxito y las que omiten campos. Un response_model declarado no filtra automáticamente el contenido si el handler devuelve directamente un objeto Response/JSONResponse.
En rutas con respuesta 204 No Content, streaming, descargas, archivos, redirects u otros contratos no JSON, no fabriques modelos Pydantic ficticios. Mantené el comportamiento correcto, explicitá el contrato con los mecanismos apropiados de FastAPI (response_class, responses, anotaciones, etc.) y documentá la excepción técnica en el informe. No las marques como fallas solo por no tener un response_model JSON.
Si detectás consultas que cargan relaciones o columnas innecesarias, evaluá optimizaciones simples y seguras; filtrar con Pydantic no equivale a optimizar la consulta SQL. No introduzcas cambios de consultas de alto riesgo por cumplir un objetivo cosmético.
Prioridad: proteger datos sensibles sin romper contratos existentes. Si corregir una exposición de datos obliga a modificar un consumidor, actualizalo con el cambio mínimo y registrá explícitamente esa modificación y su motivo.

Fase 4. Verificar el resultado
Ejecutá los tests existentes pertinentes y corregí regresiones causadas por esta tarea. No modifiques tests solo para ocultar fallas.
Agregá o adaptá tests de respuesta cuando falte cobertura, usando las herramientas ya presentes en el proyecto (por ejemplo, pytest y TestClient si corresponde).
Verificá la forma del JSON, tipos, campos permitidos, exclusión de campos sensibles, códigos HTTP, autorización y compatibilidad para casos de éxito representativos.
Probá endpoints de lista y detalle, rutas de escritura y autenticación. Incluí casos donde hay relaciones o datos privados. Si hay tests existentes para rutas modificadas, usalos.
Revisá nuevamente el registro de rutas y el OpenAPI generado. Compará el inventario inicial con el final para detectar rutas omitidas; asegurá que no desaparecieron endpoints por accidente.
Cuando el backend pueda ejecutarse, verificá manualmente al menos tres endpoints distintos usando /docs u otra forma equivalente de ejecutar peticiones y compará sus payloads reales con los esquemas. Si /docs solo muestra el contrato pero no ejecutaste la petición, no afirmes que hiciste una prueba manual real.
Si falta infraestructura o fallan tests por causas anteriores a tus cambios, distinguí esos problemas de regresiones introducidas por la auditoría.
Fase 5. Entregable obligatorio: docs/serialization-audit.md
El Markdown tiene que contener estas secciones:

A. Resumen ejecutivo

Nombre y ubicación del backend auditado, versiones detectadas.
Cantidad total de rutas HTTP auditadas (método + path), cantidad de cada estado inicial, cantidad corregida, cantidad final validada y pendientes.
Criterios usados para incluir/excluir rutas y excepciones no JSON.
B. Inventario completo (una fila por método y ruta)

Método	Ruta	Archivo / handler	Propósito	Estado inicial	response_model inicial	Problema identificado	Esquema final	Estado final
Llená la tabla con rutas reales encontradas en el código, sin ejemplos inventados.

C. Ficha detallada POR CADA endpoint

Método + ruta.
Archivo y función handler.
Propósito y consumidor(es) identificado(s), incluyendo referencia a código cuando exista.
Tipo de entrada y salida original; response_model original; código de éxito.
Campos de salida originales (o inferidos, marcándolo claramente).
Campos necesarios por los consumidores y campos innecesarios o sensibles.
Estado inicial: ✅ / ⚠️ / ❌ y explicación técnica.
Contrato final: nombre del esquema, campos y tipos, estructura del JSON y política de relaciones.
Archivos y cambios realizados; explicación de los cambios o de por qué no se requerían.
Estado final: validado / corregido pendiente de verificar / pendiente por bloqueo / excepción técnica justificada.
Prueba o evidencia relevante de verificación, o motivo por el cual no se pudo probar.
D. Seguridad y decisiones de compatibilidad

Exposiciones halladas y cómo se corrigieron, sin copiar secretos reales al documento.
Decisiones justificadas sobre emails, tokens, IDs, relaciones y otros campos discutibles.
Cambios necesarios en consumidores, si los hubo.
E. Verificaciones

Comandos realmente ejecutados y su resultado.
Tests existentes y tests agregados o modificados.
Resultados de las pruebas manuales y del chequeo OpenAPI.
Pendientes reales, limitaciones y riesgos residuales.
Criterios de aceptación
La tarea está completa únicamente si:

Cada ruta HTTP de negocio queda inventariada individualmente.
Cada respuesta JSON estructurada tiene un response_model explícito, con campos intencionales y seguros; las excepciones técnicas no JSON quedan correctamente documentadas.
Ninguna respuesta expone contraseñas, hashes, credenciales internas u otros secretos por accidente.
Los listados y detalles evitan campos y relaciones innecesarias sin romper consumidores identificados.
Entrada y salida están separadas donde sus contratos deben diferir.
Se preservan rutas, semántica de respuestas y funcionalidades existentes salvo cambios necesarios y justificados de seguridad.
docs/serialization-audit.md incluye todas las rutas, su clasificación original y los cambios aplicados.
Los tests y comprobaciones que realmente se pudieron ejecutar aparecen con resultados verificables; lo no comprobado permanece explícitamente pendiente.
Cómo quiero que trabajes y termines
Realizá la auditoría e implementación sobre los archivos del proyecto, no te limites a recomendar cambios ni a responder con una guía teórica. Trabajá por etapas: inventario inicial, implementación, tests y actualización final del Markdown. No entregues una auditoría genérica.

Al finalizar, respondé con un resumen breve: cantidad de endpoints auditados, cuántos necesitaban cambios, cuántos fueron corregidos, cuántos quedan pendientes, archivos modificados, tests ejecutados y resultado, excepciones o bloqueos, y ubicación del informe docs/serialization-audit.md.