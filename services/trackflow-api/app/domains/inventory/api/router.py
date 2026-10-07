from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.domains.inventory.application.services import InventoryService
from app.domains.inventory.infrastructure.repository_sql import SqlInventoryRepository
from app.domains.inventory.infrastructure.orm_models import InventoryAlert, InventoryItem
from app.domains.inventory.api.schemas import (
    InventoryAlertCreate,
    InventoryAlertResponse,
    StockByWarehouseResponse,
    StockResponse,
)
from app.shared.db.session import get_session

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("/stock/{sku}", response_model=StockResponse)
def get_stock(sku: str, session: Session = Depends(get_session)):
    item = session.exec(select(InventoryItem).where(InventoryItem.sku == sku)).first()
    if item is None:
        raise HTTPException(status_code=404, detail="SKU not found")
    return InventoryService(SqlInventoryRepository(session)).stock(sku)


@router.get("/stock/{sku}/by-warehouse", response_model=list[StockByWarehouseResponse])
def get_stock_by_warehouse(sku: str, session: Session = Depends(get_session)):
    items = session.exec(select(InventoryItem).where(InventoryItem.sku == sku)).all()
    if not items:
        raise HTTPException(status_code=404, detail="SKU not found")
    return [StockByWarehouseResponse(warehouse=item.warehouse, quantity=item.quantity) for item in items]


@router.post("/stock/alerts", response_model=InventoryAlertResponse, status_code=201)
def create_stock_alert(payload: InventoryAlertCreate, session: Session = Depends(get_session)):
    item = session.exec(select(InventoryItem).where(InventoryItem.sku == payload.sku)).first()
    if item is None:
        raise HTTPException(status_code=404, detail="SKU not found")
    alert = InventoryAlert.model_validate(payload)
    session.add(alert)
    session.commit()
    session.refresh(alert)
    return alert