from app.domains.inventory.domain.repository import InventoryRepository


class InventoryService:
    def __init__(self, repository: InventoryRepository):
        self.repository = repository

    def stock(self, sku: str):
        return self.repository.get_stock(sku)