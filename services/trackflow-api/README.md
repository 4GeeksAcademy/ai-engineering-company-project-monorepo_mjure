# TrackFlow API

Backend modular de TrackFlow basado en FastAPI.

## Ejecutar

```bash
uv sync
uv run uvicorn app.main:app --reload
```

Variables principales:

- `DATABASE_URL`: URL SQLModel/SQLAlchemy. Por defecto usa `sqlite:///./trackflow.db`.
- `ALLOWED_ORIGINS`: lista de origenes CORS separada por comas.
- `APP_ENV`: entorno de ejecucion.

## API implementada

- `GET /health`
- `GET /api/v1/inventory/stock/{sku}`
- `GET /api/v1/inventory/stock/{sku}/by-warehouse`
- `POST /api/v1/inventory/stock/alerts`

El dominio de inventario ya separa API, aplicacion, dominio e infraestructura. Los dominios de shipping, returns, customer experience, commercial y executive se incorporaran como siguientes cortes verticales; no se publican endpoints ficticios mientras no exista su logica de negocio.