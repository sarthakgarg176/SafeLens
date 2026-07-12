import sqlite3
import os

def migrate():
    db_path = 'safelens.db'
    if not os.path.exists(db_path):
        print(f"No existing database found at '{db_path}'. Table creation will auto-apply the constraint on startup.")
        return

    print(f"Migrating existing SQLite database '{db_path}' to apply UNIQUE constraint on alerts.asset_id...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Begin transaction
        cursor.execute("BEGIN TRANSACTION;")

        # Check if index or constraint already exists on alerts(asset_id)
        cursor.execute("PRAGMA index_list(alerts);")
        indexes = cursor.fetchall()
        already_unique = False
        for idx in indexes:
            idx_name = idx[1]
            cursor.execute(f"PRAGMA index_info({idx_name});")
            columns = cursor.fetchall()
            if len(columns) == 1 and columns[0][2] == 'asset_id' and idx[2] == 1:
                already_unique = True
                break

        if already_unique:
            print("The unique constraint/index on alerts.asset_id already exists. Migration skipped.")
            conn.rollback()
            return

        # Rename old table
        cursor.execute("ALTER TABLE alerts RENAME TO alerts_old;")

        # Create new table with unique constraint
        cursor.execute("""
            CREATE TABLE alerts (
                id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                asset_id INTEGER NOT NULL UNIQUE,
                matched_url VARCHAR NOT NULL,
                match_confidence FLOAT,
                severity VARCHAR,
                status VARCHAR,
                timestamp DATETIME,
                FOREIGN KEY(asset_id) REFERENCES assets(id)
            );
        """)

        # Copy data, dropping duplicates using INSERT OR IGNORE
        cursor.execute("""
            INSERT OR IGNORE INTO alerts (id, asset_id, matched_url, match_confidence, severity, status, timestamp)
            SELECT id, asset_id, matched_url, match_confidence, severity, status, timestamp FROM alerts_old;
        """)

        # Drop old table
        cursor.execute("DROP TABLE alerts_old;")

        # Commit transaction
        conn.commit()
        print("Migration completed successfully. alerts.asset_id now has database-level UNIQUE constraint.")

    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}. Transaction rolled back.")
    finally:
        conn.close()

if __name__ == '__main__':
    migrate()
