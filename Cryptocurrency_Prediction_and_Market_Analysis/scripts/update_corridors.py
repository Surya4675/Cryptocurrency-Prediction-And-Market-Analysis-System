import sqlite3

def run():
    conn = sqlite3.connect('backend/database/app.db')
    cur = conn.cursor()
    cur.execute('SELECT id, predicted_price, predicted_return, confidence FROM predictions')
    rows = cur.fetchall()
    for pid, pp, pr, conf in rows:
        if pp:
            pr_val = abs(pr or 0.017)
            c_val = conf or 0.91
            spread = max(0.012, min(0.038, pr_val * 0.75 + (1.0 - c_val) * 0.25))
            r_low = round(pp * (1.0 - spread), 2 if pp > 10 else 4)
            r_high = round(pp * (1.0 + spread), 2 if pp > 10 else 4)
            cur.execute('UPDATE predictions SET range_low = ?, range_high = ? WHERE id = ?', (r_low, r_high, pid))
    conn.commit()
    print(f'Successfully updated {len(rows)} predictions with exact fixed range corridors.')
    cur.execute("SELECT id, coin_id, current_price, predicted_price, range_low, range_high FROM predictions WHERE coin_id='bitcoin' ORDER BY id DESC LIMIT 1")
    print('Bitcoin latest row:', cur.fetchone())
    conn.close()

if __name__ == '__main__':
    run()
