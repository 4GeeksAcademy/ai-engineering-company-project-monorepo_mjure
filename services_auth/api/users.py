from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from passlib.hash import bcrypt
from pydantic import BaseModel, Field

from services import create_user, get_user_by_email, update_profile

router = APIRouter()


class UserCreate(BaseModel):
    email: str
    password: str = Field(min_length=6)
    name: str | None = None
    phone: str | None = None
    address: str | None = None


@router.post("/users", status_code=201)
def register(payload: UserCreate):
    if get_user_by_email(payload.email):
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    user = create_user({"id": str(uuid4()), "email": payload.email.lower(), "hashed_password": bcrypt.hash(payload.password), "is_active": True, "role": "user", "created_at": datetime.now(timezone.utc).isoformat()})
    update_profile(user["id"], {"name": payload.name, "phone": payload.phone, "address": payload.address})
    return {"id": user["id"], "email": user["email"], "is_active": True, "role": "user"}