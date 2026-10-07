from sqlmodel import Session, func, select

from app.domains.inventory.domain.entities import StockSummary
from app.domains.inventory.infrastructure.orm_models import InventoryItem


class SqlInventoryRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_stock(self, sku: str) -> StockSummary:
        quantity = self.session.exec(
            select(func.sum(InventoryItem.quantity)).where(InventoryItem.sku == sku)
        ).one()
        return StockSummary(sku=sku, quantity=quantity or 0)