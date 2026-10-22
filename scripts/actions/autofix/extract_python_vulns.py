from __future__ import annotations

import json
import sys
from pathlib import Path

try:
    import tomllib
except ImportError:
    try:
        import tomli as tomllib  # type: ignore[no-redef]
    except ImportError:
        tomllib = None  # type: ignore[assignment]


def extract_parents_from_lock(target_pkgs: list[str], lock_path: Path) -> list[str]:
    """Inspects poetry.lock and returns direct parent packages declaring any target_pkgs."""
    if not lock_path.exists() or tomllib is None:
        return []

    targets = {p.strip().lower() for p in target_pkgs if p.strip()}
    if not targets:
        return []

    try:
        with open(lock_path, "rb") as f:
            data = tomllib.load(f)

        parents: list[str] = []
        for pkg in data.get("package", []):
            pkg_name = pkg.get("name", "")
            if not pkg_name or pkg_name.lower() in targets:
                continue

            deps = pkg.get("dependencies", {})
            dep_names = {k.lower() for k in deps.keys()}
            if any(t in dep_names for t in targets):
                parents.append(pkg_name)

        return list(dict.fromkeys(parents))
    except Exception:
        return []


def main() -> int:
    args = sys.argv[1:]

    if "--parents-of" in args:
        idx = args.index("--parents-of")
        targets_raw = args[idx + 1 :] if idx + 1 < len(args) else []
        flat_targets: list[str] = []
        for item in targets_raw:
            flat_targets.extend(item.replace(",", " ").split())

        lock_path = Path("poetry.lock")
        if not lock_path.exists() and Path("ml/poetry.lock").exists():
            lock_path = Path("ml/poetry.lock")

        parents = extract_parents_from_lock(flat_targets, lock_path)
        print(" ".join(parents))
        return 0

    json_path = Path(args[0]) if args else Path("pip-audit-findings.json")
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
