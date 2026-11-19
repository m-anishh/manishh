import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent


subprocess.run(["python", str(ROOT / "deploy" / "build_static.py")], cwd=ROOT, check=True)
subprocess.run(
    ["python", "-m", "http.server", "3000", "--bind", "127.0.0.1", "--directory", str(ROOT / "dist")],
    cwd=ROOT,
    check=True,
)
