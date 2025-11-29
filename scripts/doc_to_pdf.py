import subprocess
from pathlib import Path

for f in Path(".").glob("*.doc*"):
    subprocess.run(["soffice", "--headless", "--convert-to", "pdf", str(f)])
