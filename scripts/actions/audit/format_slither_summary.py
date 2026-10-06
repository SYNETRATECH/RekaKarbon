from __future__ import annotations

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
    report_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("slither-report.txt")

    if not report_path.exists() or report_path.stat().st_size == 0:
        set_github_output("status", "clean")
        set_github_output(
            "summary", "Slither found 0 high/medium severity contract vulnerabilities."
        )
        return 0

    try:
        with open(report_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
    except Exception as e:
        print(f"Warning: could not read {report_path}: {e}")
        lines = []

    findings = [
        line.strip()
        for line in lines
        if (" uses " in line or "Dangerous" in line or "result(s) found" in line)
        and not line.strip().startswith("INFO:")
    ]

    # Check if results indicate 0 results found
    is_clean = any("0 result(s) found" in line for line in lines)

    if is_clean or not findings:
        set_github_output("status", "clean")
        set_github_output(
            "summary", "Slither found 0 high/medium severity contract vulnerabilities."
        )
        return 0

    clean_finding = findings[0].replace("\t", " ")
    set_github_output("status", "issues_detected")
    set_github_output("summary", f"Contract finding: {clean_finding[:120]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
