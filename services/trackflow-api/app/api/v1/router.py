from fastapi import APIRouter

from app.domains.inventory.api.router import router as inventory_router

api_router = APIRouter()
api_router.include_router(inventory_router)