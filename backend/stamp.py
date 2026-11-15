"""Report whether the API on a port runs the current backend sources.

The launcher calls this before starting anything:

    python stamp.py http://127.0.0.1:8787/api/health

Exit codes: 0 = current, 1 = stale (an older process is answering), 2 = down.
The single stdout line is ``<state> <expected> <running>``.
"""

from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.config import source_stamp  # noqa: E402


def main() -> int:
    expected = source_stamp()
    url = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8787/api/health"
    try:
        with urllib.request.urlopen(url, timeout=4) as response:
            payload = json.load(response)
    except Exception:  # noqa: BLE001 - "down" is a normal answer here
        print(f"down {expected} none")
        return 2

    running = str(payload.get("sourceStamp") or "none")
    state = "current" if running == expected else "stale"
    print(f"{state} {expected} {running}")
    return 0 if state == "current" else 1


if __name__ == "__main__":
    raise SystemExit(main())
