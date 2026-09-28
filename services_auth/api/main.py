import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth import router as auth_router
from profiles import router as profiles_router
from users import router as users_router

app = FastAPI(title="TrackFlow Auth API")
app.add_middleware(CORSMiddleware, allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(auth_router)
app.include_router(profiles_router)
app.include_router(users_router)


@app.get("/")
def home():
    return {"status": "ok"}