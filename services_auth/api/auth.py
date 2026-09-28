import hashlib
import json
import os
import secrets
from datetime import datetime, timedelta, timezone
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.hash import bcrypt
from pydantic import BaseModel, Field

from services import (consume_reset_token, create_reset_token, get_profile_by_user_id,
                      get_reset_token, get_user_by_email, get_user_by_id, update_user)

load_dotenv()
router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
JWT_SECRET = os.getenv("JWT_SECRET", "development-only-change-me")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
RESET_TOKEN_EXPIRE_MINUTES = int(os.getenv("RESET_TOKEN_EXPIRE_MINUTES", "30"))


class LoginRequest(BaseModel):
    email: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=6)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


def create_access_token(user_id: str):
    expires = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": user_id, "exp": expires}, JWT_SECRET, algorithm=ALGORITHM)


def _user_response(user: dict):
    profile = get_profile_by_user_id(user["id"])
    return {"id": user["id"], "email": user["email"], "is_active": user.get("is_active", True), "role": user.get("role", "user"), "profile": profile}


def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_error = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido", headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise credentials_error
    except JWTError as error:
        raise credentials_error from error
    user = get_user_by_id(user_id)
    if not user or not user.get("is_active", True):
        raise credentials_error
    return user


def _send_reset_email(email: str, reset_url: str):
    api_key = os.getenv("RESEND_API_KEY")
    sender = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")
    if not api_key:
        raise RuntimeError("RESEND_API_KEY no está configurada")
    payload = json.dumps({"from": sender, "to": [email], "subject": "Restablece tu contraseña", "html": f'<p>Recibimos una solicitud para restablecer tu contraseña.</p><p><a href="{reset_url}">Restablecer contraseña</a></p><p>El enlace caduca en {RESET_TOKEN_EXPIRE_MINUTES} minutos.</p>'}).encode()
    request = Request("https://api.resend.com/emails", data=payload, headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}, method="POST")
    try:
        with urlopen(request, timeout=10):
            return
    except (HTTPError, URLError) as error:
        raise RuntimeError("No se pudo enviar el email de restablecimiento") from error


@router.post("/auth/login")
def login(form: OAuth2PasswordRequestForm = Depends()):
    user = get_user_by_email(form.username)
    if not user or not bcrypt.verify(form.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    return {"access_token": create_access_token(user["id"]), "token_type": "bearer"}


@router.get("/auth/me")
def get_me(user: dict = Depends(get_current_user)):
    return _user_response(user)


@router.post("/auth/forgot-password")
def forgot_password(payload: ForgotPasswordRequest):
    user = get_user_by_email(payload.email)
    if user:
        raw_token = secrets.token_urlsafe(32)
        create_reset_token({"token_hash": hashlib.sha256(raw_token.encode()).hexdigest(), "user_id": user["id"], "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)).isoformat(), "used_at": None})
        reset_url = f'{os.getenv("FRONTEND_URL", "http://localhost:3000")}/reset-password?token={raw_token}'
        try:
            _send_reset_email(user["email"], reset_url)
        except RuntimeError:
            pass
    return {"message": "Si esa dirección está registrada, recibirás un enlace en breve."}


@router.post("/auth/reset-password")
def reset_password(payload: ResetPasswordRequest):
    token_hash = hashlib.sha256(payload.token.encode()).hexdigest()
    record = get_reset_token(token_hash)
    now = datetime.now(timezone.utc)
    if not record or record.get("used_at") or datetime.fromisoformat(record["expires_at"]) <= now:
        raise HTTPException(status_code=400, detail="El token no es válido o ha expirado")
    update_user(record["user_id"], {"hashed_password": bcrypt.hash(payload.new_password)})
    consume_reset_token(token_hash)
    return {"message": "Contraseña actualizada correctamente"}


@router.post("/auth/change-password")
def change_password(payload: ChangePasswordRequest, user: dict = Depends(get_current_user)):
    if not bcrypt.verify(payload.current_password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")
    update_user(user["id"], {"hashed_password": bcrypt.hash(payload.new_password)})
    return {"message": "Contraseña actualizada correctamente"}