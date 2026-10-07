# `services` folder

This folder contains **all the backend services** (APIs and background workers) related to the company for the cross-functional AI Engineering project.

Each subfolder inside `services/` must correspond to **one specific service** (for example: `admin-api`, `data-processor-worker`) and include its own technical and functional documentation.

- **Main purpose**: to centralize all the backend logic, APIs, and queue consumers that support the company's use cases.
- **Recommendation**: document in this file (or in sub-READMEs) the services you add, their objective, the technology used, and how to run them.

## Services

- `auth-api`: the single FastAPI entry point for authentication, profiles, users,
  inventory, and the versioned TrackFlow API.
- `trackflow-api`: a modular API integrated into `auth-api` under `/api/v1`.
  Its endpoints require a valid auth token; the login endpoint remains public.

Start the full stack from the repository root with `docker compose up --build -d`.
The unified backend is available on port `8000`.

> _Spanish version: [README.es.md](./README.es.md)._
