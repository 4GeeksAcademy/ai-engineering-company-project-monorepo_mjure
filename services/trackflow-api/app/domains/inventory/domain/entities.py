from dataclasses import dataclass


@dataclass(frozen=True)
class StockSummary:
    sku: str
    quantity: int