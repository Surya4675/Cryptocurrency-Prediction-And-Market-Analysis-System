import sqlite3
import pandas as pd
conn = sqlite3.connect('backend/database/app.db')
df = pd.read_sql_query("SELECT coin_id, price, market_cap, volume FROM market_prices WHERE market_cap IS NULL OR market_cap = 0.0 ORDER BY timestamp DESC LIMIT 20", conn)
print(df)
conn.close()
