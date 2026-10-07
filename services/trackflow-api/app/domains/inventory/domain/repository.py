from typing import Protocol

from app.domains.inventory.domain.entities import StockSummary


class InventoryRepository(Protocol):
    def get_stock(self, sku: str) -> StockSummary: ...