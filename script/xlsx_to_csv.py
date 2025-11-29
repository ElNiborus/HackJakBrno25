import pandas as pd
from pathlib import Path
import sys

sep = "~"
files = list(Path(".").glob("*.xlsx"))

# check all first
for x in files:
    df = pd.read_excel(x).astype(str)
    if df.apply(lambda col: col.str.contains(sep).any()).any():
        sys.exit(f"Error: '{sep}' found in {x.name}")

# export
for x in files:
    df = pd.read_excel(x)
    df.to_csv(x.with_suffix(".csv"), index=False, sep=sep)
