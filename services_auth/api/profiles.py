from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from auth import get_current_user
from services import get_profile_by_user_id, update_profile

router = APIRouter()


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


@router.get("/profiles/me")
def get_my_profile(user: dict = Depends(get_current_user)):
    return get_profile_by_user_id(user["id"]) or {"user_id": user["id"], "name": None, "phone": None, "address": None}


@router.put("/profiles/me")
def edit_my_profile(payload: ProfileUpdate, user: dict = Depends(get_current_user)):
    return update_profile(user["id"], payload.model_dump(exclude_unset=True))