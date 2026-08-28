import subprocess
import os
import time
import sys
import threading

def run_command(command, cwd=None, wait=False, env=None):
    print(f"Running: {command}")
    process = subprocess.Popen(
        command,
        shell=True,
        cwd=cwd,
        env=env,
        stdout=None,
        stderr=None
    )
    if wait:
        process.wait()
    return process

def background_worker(project_dir):
    """
    Background worker thread that periodically fetches new historical data
    and runs the ML inference model.
    """
    print("\n[Worker] Heavy ML engine started. Will update models every 5 minutes.")
    time.sleep(15) # Wait for initial live fetch
    
    while True:
        try:
            print("\n[Worker] Fetching market history & news...")
            run_command("python scripts/fetch_data.py", cwd=project_dir, wait=True)
            
            print("\n[Worker] Building features...")
            run_command("python backend/ml/features/build_features.py", cwd=project_dir, wait=True)
            
            print("\n[Worker] Running Sentiment Analysis (FinBERT)...")
            run_command("python backend/ml/sentiment/finbert.py", cwd=project_dir, wait=True)
            
            print("\n[Worker] Training ML Models...")
            run_command("python backend/ml/training/train_xgboost.py", cwd=project_dir, wait=True)
            
            print("\n[Worker] Running ML predictions...")
            run_command("python backend/ml/inference/predict.py", cwd=project_dir, wait=True)
            
        except Exception as e:
            print(f"\n[Worker] Error during ML update cycle: {e}")
            
        time.sleep(300)

def live_price_worker(project_dir):
    """
    Background worker that fetches live tick data every 60 seconds
    for the "active always" UI experience.
    """
    print("\n[Live Worker] Live price engine started. Polling every 60s.")
    time.sleep(5)
    
    while True:
        try:
            run_command("python scripts/fetch_live.py", cwd=project_dir, wait=True)
        except Exception as e:
            print(f"\n[Live Worker] Error: {e}")
            
        time.sleep(60)

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(base_dir)
    
    print("=== Starting Cryptocurrency Prediction System ===")
    
    backend_cmd = "flask run --port=5000"
    if os.name == 'nt':
        backend_cmd = "python -m flask run --port=5000"
        
    print("\n[1] Starting Backend API on port 5000...")
    env = os.environ.copy()
    env["FLASK_APP"] = "backend.app:create_app"
    backend_process = run_command(backend_cmd, cwd=project_dir, env=env)
    
    time.sleep(2)
    
    print("\n[2] Starting Frontend React App...")
    frontend_dir = os.path.join(project_dir, "frontend")
    frontend_process = run_command("npm run dev", cwd=frontend_dir)
    
    print("\n[3] Starting Background Engines...")
    live_thread = threading.Thread(target=live_price_worker, args=(project_dir,), daemon=True)
    live_thread.start()
    
    ml_thread = threading.Thread(target=background_worker, args=(project_dir,), daemon=True)
    ml_thread.start()
    
    print("\n=== System is fully running ===")
    print("Frontend: http://localhost:5173")
    print("Live Engine: Active (60s intervals)")
    print("ML Engine: Active (5m intervals)")
    print("Press Ctrl+C to stop all services.")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down services...")
        backend_process.terminate()
        frontend_process.terminate()
        print("Shutdown complete.")

if __name__ == "__main__":
    main()
