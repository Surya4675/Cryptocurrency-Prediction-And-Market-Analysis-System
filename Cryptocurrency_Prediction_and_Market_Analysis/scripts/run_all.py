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

def background_worker(project_dir, env=None):
    """
    Background worker thread that periodically checks historical features
    and maintains the established daily ML prediction session.
    """
    print("\n[Worker] ML engine active. Session forecasts are locked and refreshed every 1 hour.")
    time.sleep(30)
    
    while True:
        try:
            print("\n[Worker] Validating ML Pipeline for active coins...")
            run_command(f'"{sys.executable}" backend/data/update_pipeline.py', cwd=project_dir, wait=True, env=env)
        except Exception as e:
            print(f"\n[Worker] Error during ML update cycle: {e}")
            
        time.sleep(3600) # Stable 1-hour interval for 24h forecasting

def live_price_worker(project_dir, env=None):
    """
    Background worker that fetches live tick data every 60 seconds
    for the "active always" UI experience.
    """
    print("\n[Live Worker] Live price engine started. Polling every 60s.")
    time.sleep(5)
    
    while True:
        try:
            run_command(f'"{sys.executable}" scripts/fetch_live.py', cwd=project_dir, wait=True, env=env)
        except Exception as e:
            print(f"\n[Live Worker] Error: {e}")
            
        time.sleep(60)

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(base_dir)
    
    print("=== Starting Cryptocurrency Prediction System ===")
    
    backend_cmd = f'"{sys.executable}" -m flask --app backend.app:create_app run --port=5000'
        
    print("\n[1] Starting Backend API on port 5000...")
    env = os.environ.copy()
    env["FLASK_APP"] = "backend.app:create_app"
    env["PYTHONPATH"] = project_dir
    backend_process = run_command(backend_cmd, cwd=project_dir, env=env)
    
    time.sleep(2)
    
    print("\n[2] Starting Frontend React App...")
    frontend_dir = os.path.join(project_dir, "frontend")
    frontend_cmd = "npm.cmd run dev" if os.name == 'nt' else "npm run dev"
    frontend_process = run_command(frontend_cmd, cwd=frontend_dir)
    
    print("\n[3] Starting Background Engines...")
    live_thread = threading.Thread(target=live_price_worker, args=(project_dir, env), daemon=True)
    live_thread.start()
    
    ml_thread = threading.Thread(target=background_worker, args=(project_dir, env), daemon=True)
    ml_thread.start()
    
    print("\n=== System is fully running ===")
    print("Frontend: http://localhost:5173")
    print("Live Engine: Active (60s intervals)")
    print("ML Engine: Active (1m intervals)")
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
