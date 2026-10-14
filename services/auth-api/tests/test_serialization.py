from datetime import datetime, timezone

import pytest
from sqlalchemy.pool import StaticPool
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlmodel import Session, SQLModel, create_engine

import auth
import profiles
import users
from routers import inventory
from schemas import OrderResponse, StockEntryResponse, StockExitResponse
from app.api.v1.router import api_router as trackflow_api_router
from app.domains.inventory.infrastructure.orm_models import InventoryItem
from app.main import HealthResponse, health
from app.shared.db.session import get_session


@pytest.fixture
def client(monkeypatch):
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(test_engine)

    def get_test_db():
        with Session(test_engine) as session:
            yield session

    app = FastAPI()
    app.include_router(auth.router)
    app.include_router(profiles.router)
    app.include_router(users.router)
    app.include_router(inventory.router)
    app.include_router(trackflow_api_router, prefix="/api/v1")
    app.add_api_route("/health", health, response_model=HealthResponse)
    app.state.test_engine = test_engine
    app.dependency_overrides[inventory.get_db] = get_test_db
    app.dependency_overrides[get_session] = get_test_db
    app.dependency_overrides[auth.get_current_user] = lambda: {
        "id": "user-1",
        "email": "person@example.test",
        "is_active": True,
        "role": "user",
        "hashed_password": "never-return-this",
    }
    monkeypatch.setattr(
        auth,
        "get_profile_by_user_id",
        lambda _: {"user_id": "user-1", "name": "Ada", "phone": None, "address": "Main St"},
    )
    monkeypatch.setattr(
        profiles,
        "get_profile_by_user_id",
        lambda _: {"user_id": "user-1", "name": "Ada", "phone": None, "address": "Main St"},
    )
    return TestClient(app)


def test_auth_me_excludes_password_hash_and_nested_user_id(client):
    response = client.get("/auth/me")

    assert response.status_code == 200
    assert response.json() == {
        "id": "user-1",
        "email": "person@example.test",
        "is_active": True,
        "role": "user",
        "profile": {"name": "Ada", "phone": None, "address": "Main St"},
    }


def test_login_returns_the_deliberate_access_token(client, monkeypatch):
    monkeypatch.setattr(
        auth,
        "get_user_by_email",
        lambda _: {"id": "user-1", "hashed_password": "stored-hash"},
    )
    monkeypatch.setattr(auth.bcrypt, "verify", lambda *_: True)
    monkeypatch.setattr(auth, "create_access_token", lambda _: "issued-token")

    response = client.post(
        "/auth/login",
        data={"username": "person@example.test", "password": "submitted-password"},
    )

    assert response.status_code == 200
    assert response.json() == {"access_token": "issued-token", "token_type": "bearer"}


def test_forgot_password_keeps_generic_response(client, monkeypatch):
    monkeypatch.setattr(auth, "get_user_by_email", lambda _: None)

    response = client.post("/auth/forgot-password", json={"email": "unknown@example.test"})

    assert response.status_code == 200
    assert response.json() == {
        "message": "Si esa dirección está registrada, recibirás un enlace en breve."
    }


def test_reset_password_returns_only_confirmation(client, monkeypatch):
    monkeypatch.setattr(
        auth,
        "get_reset_token",
        lambda _: {"used_at": None, "expires_at": "2099-01-01T00:00:00+00:00", "user_id": "user-1"},
    )
    monkeypatch.setattr(auth.bcrypt, "hash", lambda _: "new-stored-hash")
    monkeypatch.setattr(auth, "update_user", lambda *_: None)
    monkeypatch.setattr(auth, "consume_reset_token", lambda *_: None)

    response = client.post(
        "/auth/reset-password",
        json={"token": "one-time-token", "new_password": "new-password"},
    )

    assert response.status_code == 200
    assert response.json() == {"message": "Contraseña actualizada correctamente"}


def test_change_password_returns_only_confirmation(client, monkeypatch):
    monkeypatch.setattr(auth.bcrypt, "verify", lambda *_: True)
    monkeypatch.setattr(auth.bcrypt, "hash", lambda _: "new-stored-hash")
    monkeypatch.setattr(auth, "update_user", lambda *_: None)

    response = client.post(
        "/auth/change-password",
        json={"current_password": "old-password", "new_password": "new-password"},
    )

    assert response.status_code == 200
    assert response.json() == {"message": "Contraseña actualizada correctamente"}


def test_profile_routes_filter_internal_user_id(client, monkeypatch):
    response = client.get("/profiles/me")
    assert response.status_code == 200
    assert response.json() == {"name": "Ada", "phone": None, "address": "Main St"}

    monkeypatch.setattr(
        profiles,
        "update_profile",
        lambda user_id, changes: {"user_id": user_id, **changes},
    )
    response = client.put("/profiles/me", json={"name": None})

    assert response.status_code == 200
    assert response.json() == {"name": None, "phone": None, "address": None}


def test_registration_response_does_not_echo_email_or_password(client, monkeypatch):
    monkeypatch.setattr(users, "get_user_by_email", lambda _: None)
    monkeypatch.setattr(users.bcrypt, "hash", lambda _: "stored-hash")
    monkeypatch.setattr(users, "create_user", lambda record: record)
    monkeypatch.setattr(users, "update_profile", lambda *_: None)

    response = client.post(
        "/users",
        json={"email": "person@example.test", "password": "long-enough", "name": "Ada"},
    )

    assert response.status_code == 201
    assert set(response.json()) == {"id", "is_active", "role"}
    assert response.json()["is_active"] is True
    assert response.json()["role"] == "user"


def test_inventory_movement_models_drop_internal_user_uuid():
    timestamp = datetime.now(timezone.utc)
    entry = StockEntryResponse.model_validate(
        {
            "sku_id": 7,
            "quantity": 2,
            "reference": "PO-1",
            "warehouse": "LA",
            "id": 11,
            "created_at": timestamp,
            "user_uuid": "internal-user-id",
        }
    )
    exit_order = StockExitResponse.model_validate(
        {
            "sku_id": 7,
            "quantity": 1,
            "exit_type": "loss",
            "tracking_number": None,
            "warehouse": "LA",
            "id": 12,
            "created_at": timestamp,
            "user_uuid": "internal-user-id",
        }
    )
    movement = OrderResponse.model_validate(
        {
            "id": 11,
            "movement_type": "inbound",
            "quantity": 2,
            "created_at": timestamp,
            "user_uuid": "internal-user-id",
            "sku": {
                "id": 7,
                "name": "Product",
                "sku": "SKU-7",
                "client_name": "Client",
                "category": "fashion",
                "warehouse": "LA",
                "current_stock": 99,
            },
        }
    )

    assert "user_uuid" not in entry.model_dump()
    assert "user_uuid" not in exit_order.model_dump()
    assert "user_uuid" not in movement.model_dump()
    assert "current_stock" not in movement.model_dump()["sku"]


def test_inventory_alert_threshold_must_be_non_negative():
    from app.domains.inventory.api.schemas import InventoryAlertCreate

    with pytest.raises(ValidationError):
        InventoryAlertCreate(sku="SKU-7", warehouse="LA", threshold=-1)


def test_inventory_product_and_movement_routes_return_filtered_contracts(client):
    product_response = client.post(
        "/inventory/products",
        json={
            "name": "Product",
            "sku": "SKU-7",
            "client_name": "Client",
            "category": "fashion",
            "warehouse": "LA",
        },
    )
    assert product_response.status_code == 200
    product = product_response.json()
    assert product["current_stock"] == 0
    product_id = product["id"]

    assert client.get("/inventory/products").json() == [product]
    assert client.get(f"/inventory/products/{product_id}").json() == product

    entry_response = client.post(
        "/inventory/orders/inbound",
        json={"sku_id": product_id, "quantity": 3, "reference": "PO-1", "warehouse": "LA"},
    )
    assert entry_response.status_code == 200
    assert "user_uuid" not in entry_response.json()

    exit_response = client.post(
        "/inventory/orders/outbound",
        json={
            "sku_id": product_id,
            "quantity": 1,
            "exit_type": "loss",
            "tracking_number": None,
            "warehouse": "LA",
        },
    )
    assert exit_response.status_code == 200
    assert "user_uuid" not in exit_response.json()

    movements = client.get("/inventory/orders")
    assert movements.status_code == 200
    assert len(movements.json()) == 2
    for movement in movements.json():
        assert "user_uuid" not in movement
        assert movement["sku"]["id"] == product_id
        assert "current_stock" not in movement["sku"]


def test_trackflow_stock_alert_and_health_routes_return_declared_contracts(client):
    with Session(client.app.state.test_engine) as session:
        session.add(InventoryItem(sku="SKU-T", warehouse="LA", quantity=5))
        session.commit()

    stock_response = client.get("/api/v1/inventory/stock/SKU-T")
    assert stock_response.status_code == 200
    assert stock_response.json() == {"sku": "SKU-T", "quantity": 5}

    warehouse_response = client.get("/api/v1/inventory/stock/SKU-T/by-warehouse")
    assert warehouse_response.status_code == 200
    assert warehouse_response.json() == [{"warehouse": "LA", "quantity": 5}]

    alert_response = client.post(
        "/api/v1/inventory/stock/alerts",
        json={"sku": "SKU-T", "warehouse": "LA", "threshold": 2},
    )
    assert alert_response.status_code == 201
    assert alert_response.json()["sku"] == "SKU-T"
    assert alert_response.json()["threshold"] == 2
    assert isinstance(alert_response.json()["id"], int)

    health_response = client.get("/health")
    assert health_response.status_code == 200
    assert health_response.json() == {"status": "ok", "service": "trackflow-api"}