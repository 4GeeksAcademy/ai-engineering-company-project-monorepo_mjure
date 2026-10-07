from sqlmodel import SQLModel


class StockResponse(SQLModel):
    sku: str
    quantity: int


class StockByWarehouseResponse(SQLModel):
    warehouse: str
    quantity: int


class InventoryAlertCreate(SQLModel):
    sku: str
    warehouse: str
    threshold: int


class InventoryAlertResponse(InventoryAlertCreate):
    id: int