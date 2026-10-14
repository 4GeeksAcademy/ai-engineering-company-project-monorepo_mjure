from sqlmodel import Field, SQLModel


class StockResponse(SQLModel):
    sku: str
    quantity: int


class StockByWarehouseResponse(SQLModel):
    warehouse: str
    quantity: int


class InventoryAlertCreate(SQLModel):
    sku: str
    warehouse: str
    threshold: int = Field(ge=0)


class InventoryAlertResponse(InventoryAlertCreate):
    id: int