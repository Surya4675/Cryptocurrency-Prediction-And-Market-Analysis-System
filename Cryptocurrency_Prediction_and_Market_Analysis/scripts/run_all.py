import subprocess
import os
import time
import sys

def run_command(command, cwd=None, wait=False):
    print(f"Running: {command}")
    process = subprocess.Popen(
        command,
        shell=True,
        cwd=cwd,
        stdout=sys.stdout,
        stderr=sys.stderr
    )
    if wait:
        process.wait()
    return process

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(base_dir)
    
    print("=== Starting Cryptocurrency Prediction System ===")
    
    # 1. Start Flask Backend
    backend_cmd = "flask run --port=5000"
    if os.name == 'nt':
        # Use Python to run flask if the command is not in path
        backend_cmd = "python -m flask run --port=5000"
        
    print("\n[1] Starting Backend API on port 5000...")
    env = os.environ.copy()
    env["FLASK_APP"] = "backend.app:create_app"
    backend_process = subprocess.Popen(
        backend_cmd,
        shell=True,
        cwd=project_dir,
        env=env
    )
    
    # Give it a second to start
    time.sleep(2)
    
    # 2. Start Vite Frontend
    print("\n[2] Starting Frontend React App...")
    frontend_dir = os.path.join(project_dir, "frontend")
    frontend_process = run_command("npm run dev", cwd=frontend_dir)
    
    print("\n=== System is running ===")
    print("Frontend: http://localhost:5173")
    print("Backend API: http://localhost:5000")
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
