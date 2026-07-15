import sqlite3

conn = sqlite3.connect('safelens.db')
cursor = conn.cursor()
cursor.execute("DELETE FROM assets WHERE filename = 'Untitled.png'")
conn.commit()
print(cursor.rowcount, "rows deleted")
conn.close()