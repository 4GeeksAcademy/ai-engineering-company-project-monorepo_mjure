from tinydb import Query
from datetime import datetime, timezone

from database import profiles_table, reset_tokens_table, users_table


def get_user_by_id(user_id: str):
    return users_table.get(Query().id == user_id)


def get_user_by_email(email: str):
    return users_table.get(Query().email == email.lower().strip())


def get_all_users():
    return users_table.all()


def create_user(user: dict):
    users_table.insert(user)
    return user


def update_user(user_id: str, changes: dict):
    users_table.update(changes, Query().id == user_id)
    return get_user_by_id(user_id)


def delete_user(user_id: str):
    users_table.remove(Query().id == user_id)


def get_profile_by_user_id(user_id: str):
    return profiles_table.get(Query().user_id == user_id)


def update_profile(user_id: str, changes: dict):
    profile = get_profile_by_user_id(user_id)
    if profile:
        profiles_table.update(changes, Query().user_id == user_id)
        return get_profile_by_user_id(user_id)
    profile = {"user_id": user_id, **changes}
    profiles_table.insert(profile)
    return profile


def create_reset_token(record: dict):
    reset_tokens_table.insert(record)
    return record


def get_reset_token(token_hash: str):
    return reset_tokens_table.get(Query().token_hash == token_hash)


def consume_reset_token(token_hash: str):
    reset_tokens_table.update({"used_at": datetime.now(timezone.utc).isoformat()}, Query().token_hash == token_hash)