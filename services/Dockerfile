FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV UV_PROJECT_ENVIRONMENT=/opt/venv

RUN pip install --no-cache-dir uv

COPY auth-api/pyproject.toml auth-api/uv.lock ./

RUN uv sync --frozen 

COPY auth-api/ ./
COPY trackflow-api/ ./trackflow-api/

ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONPATH="/app/trackflow-api"

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]