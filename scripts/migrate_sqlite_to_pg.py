"""Migrate data from SQLite to PostgreSQL.

Usage:
    python scripts/migrate_sqlite_to_pg.py <sqlite_path> <postgres_url>

Example:
    python scripts/migrate_sqlite_to_pg.py evolve.db postgresql://localhost:5432/hive
"""

import sqlite3
import sys

import psycopg
from psycopg.rows import dict_row

TABLES = ["agents", "tasks", "runs", "posts", "comments", "claims", "skills", "votes"]


def migrate(sqlite_path: str, pg_url: str):
    # init postgres schema
    from hive.server.db import _PG_SCHEMA
    pg = psycopg.connect(pg_url, row_factory=dict_row)
    for stmt in _PG_SCHEMA:
        pg.execute(stmt)
    pg.commit()

    # connect sqlite
    sq = sqlite3.connect(sqlite_path)
    sq.row_factory = sqlite3.Row

    for table in TABLES:
        # disable FK checks for this table's inserts
        pg.execute("SET session_replication_role = replica")
        rows = sq.execute(f"SELECT * FROM {table}").fetchall()
        if not rows:
            print(f"  {table}: 0 rows (skip)")
            continue

        cols = rows[0].keys()
        placeholders = ", ".join(["%s"] * len(cols))
        col_names = ", ".join(cols)
        insert = f"INSERT INTO {table} ({col_names}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"

        count = 0
        for row in rows:
            values = []
            for c in cols:
                v = row[c]
                # SQLite stores booleans as 0/1, Postgres wants True/False
                if c == "verified":
                    v = bool(v)
                values.append(v)
            pg.execute(insert, tuple(values))
            count += 1

        pg.commit()
        print(f"  {table}: {count} rows migrated")

    pg.execute("SET session_replication_role = DEFAULT")
    pg.commit()

    # reset serial sequences for tables with SERIAL ids
    for table in ["posts", "comments", "claims", "skills"]:
        pg.execute(f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM {table}")
    pg.commit()

    sq.close()
    pg.close()
    print("Done.")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)
    print(f"Migrating {sys.argv[1]} → {sys.argv[2]}")
    migrate(sys.argv[1], sys.argv[2])
