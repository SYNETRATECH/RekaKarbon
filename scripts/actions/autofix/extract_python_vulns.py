from __future__ import annotations

import json
import sys
from pathlib import Path


def main() -> int:
    json_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("pip-audit-findings.json")
    if not json_path.exists():
        print("")
        return 0

    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        vulnerable = [
            dep["name"]
            for dep in data.get("dependencies", [])
            if dep.get("vulns") and dep.get("name")
        ]
        # Remove duplicates preserving order
        unique_names = list(dict.fromkeys(vulnerable))
        print(" ".join(unique_names))
    except Exception:
        print("")

    return 0


if __name__ == "__main__":
    sys.exit(main())
