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
    json_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("ml-audit.json")

    if not json_path.exists() or json_path.stat().st_size == 0:
        set_github_output("status", "clean")
        set_github_output("summary", "No known vulnerabilities found in Python ML dependencies.")
        return 0

    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"Warning: could not parse {json_path}: {e}")
        data = {}

    vulnerable_deps = []
    for dep in data.get("dependencies", []):
        vulns = dep.get("vulns", [])
        if vulns:
            cve_ids = [v.get("id", "") for v in vulns[:2] if v.get("id")]
            cve_str = f": {', '.join(cve_ids)}" if cve_ids else ""
            vulnerable_deps.append(f"{dep.get('name', 'pkg')} ({dep.get('version', '')}{cve_str})")

    if not vulnerable_deps:
        set_github_output("status", "clean")
        set_github_output("summary", "No known vulnerabilities found in Python ML dependencies.")
        return 0

    summary_text = f"Vulnerabilities detected: {'; '.join(vulnerable_deps[:4])}"
    if len(vulnerable_deps) > 4:
        summary_text += f" and {len(vulnerable_deps) - 4} more."

    set_github_output("status", "issues_detected")
    set_github_output("summary", summary_text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
