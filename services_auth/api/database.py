from pathlib import Path

from tinydb import TinyDB

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
db = TinyDB(DATA_DIR / "db.json")
users_table = db.table("users")
profiles_table = db.table("profiles")
reset_tokens_table = db.table("reset_tokens")

import os

from dotenv import load_dotenv
from sqlmodel import Session, create_engine

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL no está configurada")

engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
)

def get_db():
    with Session(engine) as session:
        yield session