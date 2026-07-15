import sqlite3

def check():
    conn = sqlite3.connect('safelens.db')
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    print("Tables:", tables)
    for table_tuple in tables:
        name = table_tuple[0]
        cursor.execute(f"SELECT count(*) FROM {name}")
        count = cursor.fetchone()[0]
        print(f"Table '{name}' has {count} rows")
        if count > 0:
            cursor.execute(f"SELECT * FROM {name} LIMIT 3")
            rows = cursor.fetchall()
            print("  Sample rows:", rows)

if __name__ == '__main__':
    check()
