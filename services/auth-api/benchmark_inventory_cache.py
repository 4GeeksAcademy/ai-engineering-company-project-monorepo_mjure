import argparse
import os
import statistics
import time
from datetime import datetime, timedelta, timezone

os.environ.setdefault("DATABASE_URL", "sqlite://")

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlalchemy.pool import StaticPool

import models
import routers.inventory as inventory
from models import SKU, StockEntry, StockExit


def seed_database(engine, product_count: int) -> tuple[int, int, int]:
    SQLModel.metadata.create_all(engine)
    now = datetime.now(timezone.utc)
    products = [
        SKU(
            name=f"Product {index:04d}",
            sku=f"SKU-{index:04d}",
            client_name=f"Client {index % 17:02d}",
            category=("electronics", "apparel", "home", "office", "food")[index % 5],
            warehouse=("north", "south", "east", "west")[index % 4],
        )
        for index in range(product_count)
    ]

    with Session(engine) as session:
        session.add_all(products)
        session.flush()
        entries = []
        exits = []
        for index, product in enumerate(products):
            for movement in range(4):
                entries.append(
                    StockEntry(
                        sku_id=product.id,
                        quantity=40 + ((index * 7 + movement * 13) % 160),
                        reference=f"PO-{index:04d}-{movement}",
                        warehouse=product.warehouse,
                        created_at=now - timedelta(days=(index + movement) % 365),
                        user_uuid="benchmark-user",
                    )
                )
            for movement in range(2):
                exits.append(
                    StockExit(
                        sku_id=product.id,
                        quantity=3 + ((index * 5 + movement * 11) % 25),
                        exit_type="dispatch" if movement == 0 else "loss",
                        tracking_number=f"TR-{index:04d}-{movement}",
                        warehouse=product.warehouse,
                        created_at=now - timedelta(days=(index + movement + 2) % 365),
                        user_uuid="benchmark-user",
                    )
                )
        session.add_all(entries + exits)
        session.commit()

    return len(products), len(entries), len(exits)


def measure(client: TestClient, path: str, samples: int) -> tuple[float, float]:
    cold_times = []
    for _ in range(samples):
        inventory._invalidate_inventory_cache()
        started_at = time.perf_counter()
        response = client.get(path)
        response.raise_for_status()
        cold_times.append((time.perf_counter() - started_at) * 1000)

    inventory._invalidate_inventory_cache()
    response = client.get(path)
    response.raise_for_status()
    warm_times = []
    for _ in range(samples):
        started_at = time.perf_counter()
        response = client.get(path)
        response.raise_for_status()
        warm_times.append((time.perf_counter() - started_at) * 1000)

    return statistics.median(cold_times), statistics.median(warm_times)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--products", type=int, default=300)
    parser.add_argument("--samples", type=int, default=5)
    args = parser.parse_args()
    if args.products < 1 or args.samples < 1:
        parser.error("--products and --samples must be positive")

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    row_counts = seed_database(engine, args.products)

    def get_test_db():
        with Session(engine) as session:
            yield session

    app = FastAPI()
    app.include_router(inventory.router)
    app.dependency_overrides[inventory.get_db] = get_test_db
    app.dependency_overrides[inventory.get_current_user] = lambda: {
        "id": "benchmark-user",
        "email": "benchmark@example.test",
    }

    with TestClient(app) as client:
        results = {}
        for resource, path in (
            ("products", "/inventory/products"),
            ("orders", "/inventory/orders"),
        ):
            cold_ms, warm_ms = measure(client, path, args.samples)
            results[resource] = {
                "uncached_median_ms": round(cold_ms, 2),
                "cached_median_ms": round(warm_ms, 2),
                "speedup": round(cold_ms / warm_ms, 2) if warm_ms else None,
            }

    inventory._invalidate_inventory_cache()
    print(f"rows: products={row_counts[0]}, entries={row_counts[1]}, exits={row_counts[2]}")
    print(f"samples per path: {args.samples}")
    for resource, result in results.items():
        print(
            f"{resource}: uncached median={result['uncached_median_ms']}ms, "
            f"cached median={result['cached_median_ms']}ms, "
            f"speedup={result['speedup']}x"
        )


if __name__ == "__main__":
    main()
