#!/usr/bin/env python3
"""Unified launcher script for the Market Basket Analysis Web Application."""

import os
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / "backend"
FRONTEND_DIR = ROOT / "frontend"

VENV_PYTHON = ROOT / ".venv" / "Scripts" / "python.exe" if os.name == "nt" else ROOT / ".venv" / "bin" / "python"
PYTHON_EXE = str(VENV_PYTHON) if VENV_PYTHON.exists() else sys.executable


def main():
    print("=" * 65)
    print(" Market Basket Analysis - Hadoop MapReduce & Apriori Web App")
    print("=" * 65)

    env = os.environ.copy()
    env["PYTHONPATH"] = str(BACKEND_DIR)

    # 1. Start FastAPI Backend
    print("\n[1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...")
    backend_proc = subprocess.Popen(
        [PYTHON_EXE, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=str(BACKEND_DIR),
        env=env
    )

    # Allow backend a moment to bind
    time.sleep(1.5)

    # 2. Start Vite Frontend
    print("[2/2] Starting React + Vite Frontend on http://localhost:5173 ...")
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=str(FRONTEND_DIR)
    )

    print("\n" + "-" * 65)
    print(" Web App is Live! Open your browser at:")
    print(" -> http://localhost:5173")
    print(" Backend API docs available at:")
    print(" -> http://127.0.0.1:8000/docs")
    print("-" * 65)
    print("Press Ctrl+C to stop both servers...\n")

    try:
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\nShutting down servers...")
    finally:
        frontend_proc.terminate()
        backend_proc.terminate()
        print("Servers stopped cleanly.")


if __name__ == "__main__":
    main()

