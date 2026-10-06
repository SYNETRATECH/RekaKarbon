from __future__ import annotations

import json
import sys
from pathlib import Path


def main() -> int:
    detector = sys.argv[1].strip() if len(sys.argv) > 1 else ""
    if not detector:
        print("No detector specified for suppression.")
        return 0

    config_path = Path("blockchain/slither.config.json")
    if not config_path.exists():
        print(f"Error: {config_path} not found.")
        return 1

    try:
        with open(config_path, "r", encoding="utf-8") as f:
            cfg = json.load(f)

        existing = [d.strip() for d in cfg.get("detectors_to_exclude", "").split(",") if d.strip()]
        if detector not in existing:
            existing.append(detector)
            cfg["detectors_to_exclude"] = ",".join(existing)
            with open(config_path, "w", encoding="utf-8") as f:
                json.dump(cfg, f, indent=2)
                f.write("\n")
            print(f"Successfully added '{detector}' to detectors_to_exclude in {config_path}")
        else:
            print(f"'{detector}' is already excluded in {config_path}")
        return 0
    except Exception as e:
        print(f"Error updating {config_path}: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
