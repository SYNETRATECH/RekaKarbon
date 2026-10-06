from __future__ import annotations

import json
import os
import sys
from pathlib import Path


def set_github_output(key: str, value: str) -> None:
    output_file = os.environ.get("GITHUB_OUTPUT")
    if output_file:
        with open(output_file, "a", encoding="utf-8") as f:
            f.write(f"{key}={value}\n")
    print(f"[OUTPUT] {key}={value}")


def main() -> int:
    audit_level = sys.argv[1] if len(sys.argv) > 1 else "high"
    json_path = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("pnpm-audit.json")

    if not json_path.exists() or json_path.stat().st_size == 0:
        set_github_output("status", "clean")
        set_github_output(
            "summary", f"No vulnerabilities found at or above severity '{audit_level}'."
        )
        return 0

    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"Warning: could not parse {json_path}: {e}")
        data = {}

    vulns = data.get("vulnerabilities", {})
    names = list(vulns.keys())

    if not names:
        set_github_output("status", "clean")
        set_github_output(
            "summary", f"No vulnerabilities found at or above severity '{audit_level}'."
        )
        return 0

    formatted_items = [f"{name} ({vulns[name].get('severity', 'unknown')})" for name in names[:5]]
    summary_text = f"Detected {len(names)} vulnerable package(s): {', '.join(formatted_items)}"
    if len(names) > 5:
        summary_text += f" and {len(names) - 5} more."

    set_github_output("status", "issues_detected")
    set_github_output("summary", summary_text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
