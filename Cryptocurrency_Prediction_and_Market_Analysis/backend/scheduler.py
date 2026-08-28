import time
import schedule
from datetime import datetime
import os
import sys

# Add root project dir to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.data.update_pipeline import run_update_pipeline

def job():
    print(f"\n[{datetime.now()}] Triggering scheduled 5-minute pipeline job...")
    try:
        run_update_pipeline()
    except Exception as e:
        print(f"[{datetime.now()}] Error in pipeline job: {e}")

def start_scheduler():
    print(f"[{datetime.now()}] Starting background scheduler. Jobs will run every 5 minutes.")
    
    # Schedule the job every 5 minutes
    schedule.every(5).minutes.do(job)
    
    # Run once immediately on startup
    job()
    
    # Keep the script running
    while True:
        schedule.run_pending()
        time.sleep(1)

if __name__ == '__main__':
    start_scheduler()
