from sqlmodel import Field, SQLModel


class InventoryItem(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    sku: str = Field(index=True)
    warehouse: str = Field(index=True)
    quantity: int = Field(default=0, ge=0)


class InventoryAlert(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    sku: str = Field(index=True)
    warehouse: str
    threshold: int = Field(ge=0)