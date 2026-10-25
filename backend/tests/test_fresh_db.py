import sqlite3

import app.db as db


def test_init_db_builds_a_fresh_database(tmp_path, monkeypatch):
    """A brand-new deployment starts from an empty file: every table and migrated column must be created."""
    path = tmp_path / "fresh.db"
    monkeypatch.setattr(db, "DB_PATH", str(path))

    db.init_db()
    db.init_db()  # idempotent on an existing database

    conn = sqlite3.connect(path)
    message_columns = {row[1] for row in conn.execute("PRAGMA table_info(messages)")}
    conn.close()
    assert {"trace_json", "message_type", "sources_json"} <= message_columns
