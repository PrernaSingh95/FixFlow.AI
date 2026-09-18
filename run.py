import os
import sys
import subprocess

# Ensure UTF-8 output encoding on Windows console
if sys.platform == "win32":
    import io
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")
    except Exception:
        pass

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

def main():
    print("=" * 70)
    print(" [*] Launching FixFlow AI Full-Stack Platform")
    print("=" * 70)

    # Check if frontend dist exists
    frontend_dist = os.path.join(PROJECT_ROOT, "frontend", "dist")
    if not os.path.isdir(frontend_dist):
        print(" [INFO] Built frontend assets not found. Building frontend...")
        try:
            subprocess.run(["npm", "run", "build"], cwd=os.path.join(PROJECT_ROOT, "frontend"), check=True, shell=True)
            print(" [OK] Frontend built successfully!")
        except Exception as e:
            print(f" [WARN] Could not automatically build frontend: {e}")
            print("        FastAPI will still serve the backend API on /api and /health.")

    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "127.0.0.1")

    print(f" [INFO] Starting FastAPI server on http://{host}:{port}")
    print(f" [INFO] Health Endpoint: http://{host}:{port}/health")
    print(f" [INFO] Interactive Swagger Docs: http://{host}:{port}/docs")
    print("=" * 70)

    import uvicorn
    uvicorn.run(
        "backend.app.main:app",
        host=host,
        port=port,
        reload=False
    )

if __name__ == "__main__":
    main()
