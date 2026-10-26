import os
import sys
import sqlite3
import time
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)
DB_PATH = os.path.join(BASE_DIR, "backend", "database", "app.db")

from backend.ml.inference.predict import predict_next_day

def batch_predict_all():
    logging.info("Starting comprehensive prediction & TreeSHAP run for entire cryptocurrency universe...")
    conn = sqlite3.connect(DB_PATH, timeout=60)
    cursor = conn.cursor()
    cursor.execute("SELECT coin_id FROM cryptocurrencies WHERE is_active = 1")
    coins = [row[0] for row in cursor.fetchall()]
    conn.close()

    logging.info(f"Loaded {len(coins)} active cryptocurrencies to process.")
    start_time = time.time()
    successful = 0
    skipped = 0

    for idx, coin_id in enumerate(coins, 1):
        try:
            res = predict_next_day(coin_id, force=False)
            if res and res.get('predicted_price'):
                successful += 1
            else:
                skipped += 1
        except Exception as e:
            skipped += 1

        if idx % 50 == 0 or idx == len(coins):
            elapsed = time.time() - start_time
            rate = idx / elapsed if elapsed > 0 else 0
            logging.info(f"Progress: [{idx}/{len(coins)}] ({idx/len(coins)*100:.1f}%) | "
                         f"Successful: {successful} | Skipped: {skipped} | Speed: {rate:.1f} coins/sec")

    elapsed_total = time.time() - start_time
    logging.info(f"Completed! {successful} cryptocurrencies fully predicted with real TreeSHAP attribution in {elapsed_total:.2f}s.")

if __name__ == "__main__":
    batch_predict_all()
