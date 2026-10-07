import os

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router as trackflow_api_router
from app.shared.db.session import create_db_and_tables as create_trackflow_tables
from auth import get_current_user, router as auth_router
from profiles import router as profiles_router
from users import router as users_router

from sqlmodel import SQLModel

from database import engine
import models
from routers.inventory import router as inventory_router

app = FastAPI(title="TrackFlow Auth API")
app.add_middleware(CORSMiddleware, allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(auth_router)
app.include_router(profiles_router)
app.include_router(users_router)
SQLModel.metadata.create_all(engine)
app.include_router(inventory_router)
create_trackflow_tables()
app.include_router(
    trackflow_api_router,
    prefix="/api/v1",
    dependencies=[Depends(get_current_user)],
)


@app.get("/")
def home():
    return {"status": "ok"}