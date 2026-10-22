from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.error
import urllib.request
from datetime import date
from pathlib import Path
from typing import Any

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent


def parse_semver(version_str: str) -> tuple[int, ...]:
    """Parses a version string like '24.15.0' or '3.13' into a tuple of ints."""
    clean = re.sub(r"^[v^~>=<]+", "", version_str.strip())
    parts: list[int] = []
    for part in clean.split("."):
        digits = re.match(r"^\d+", part)
        if digits:
            parts.append(int(digits.group(0)))
        else:
            break
    return tuple(parts)


def get_current_node_version(root_dir: Path = ROOT_DIR) -> str:
    """Reads current pinned Node.js version from .nvmrc or package.json."""
    nvmrc = root_dir / ".nvmrc"
    if nvmrc.exists():
        val = nvmrc.read_text(encoding="utf-8").strip()
        if val:
            return val

    pkg_json = root_dir / "package.json"
    if pkg_json.exists():
        try:
            data = json.loads(pkg_json.read_text(encoding="utf-8"))
            engines = data.get("engines", {})
            if "node" in engines:
                return str(engines["node"]).strip()
        except Exception:
            pass

    return "24.15.0"


def get_current_python_version(root_dir: Path = ROOT_DIR) -> str:
    """Reads current target Python version from ml/pyproject.toml or default."""
    pyproject = root_dir / "ml" / "pyproject.toml"
    if pyproject.exists():
        try:
            content = pyproject.read_text(encoding="utf-8")
            match = re.search(r'python_version\s*=\s*"([^"]+)"', content)
            if match:
                return match.group(1).strip()
        except Exception:
            pass

    return "3.13"


def fetch_eol_data(product: str) -> list[dict[str, Any]]:
    """Fetches lifecycle data for a runtime from endoflife.date API."""
    url = f"https://endoflife.date/api/{product}.json"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "RekaKarbon-Runtime-Sentinel/1.0"},
    )

    ctx = None
    try:
        import ssl

        import certifi

        ctx = ssl.create_default_context(cafile=certifi.where())
    except Exception:
        try:
            import ssl

            ctx = ssl._create_unverified_context()
        except Exception:
            ctx = None

    try:
        kwargs: dict[str, Any] = {"timeout": 10}
        if ctx is not None:
            kwargs["context"] = ctx
        with urllib.request.urlopen(req, **kwargs) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if isinstance(data, list):
                return data
    except Exception as e:
        sys.stderr.write(f"Warning: Failed to fetch EOL data for {product}: {e}\n")
    return []


def audit_node_runtime(
    current_version: str, eol_data: list[dict[str, Any]] | None = None
) -> dict[str, Any] | None:
    """Audits current Node.js version against lifecycle and patch availability."""
    if eol_data is None:
        eol_data = fetch_eol_data("nodejs")
    if not eol_data:
        return None

    parsed_cur = parse_semver(current_version)
    if not parsed_cur:
        return None
    cycle = str(parsed_cur[0])

    cycle_info = next((item for item in eol_data if str(item.get("cycle")) == cycle), None)
    if not cycle_info:
        return None

    latest_str = str(cycle_info.get("latest", ""))
    eol_str = str(cycle_info.get("eol", ""))
    today = date.today().isoformat()

    is_eol = bool(eol_str and eol_str <= today)
    parsed_latest = parse_semver(latest_str) if latest_str else ()

    needs_update = bool(parsed_latest and parsed_cur < parsed_latest)

    if not is_eol and not needs_update:
        return None

    severity = "HIGH" if is_eol else "MODERATE"
    description = (
        f"Node.js {current_version} is End-of-Life as of {eol_str}."
        if is_eol
        else f"Node.js {current_version} is behind the latest security patch {latest_str} in cycle {cycle}."
    )

    return {
        "ecosystem": "Runtime (Node.js)",
        "component": "Node.js",
        "installed_version": current_version,
        "latest_version": latest_str,
        "cycle": cycle,
        "eol": eol_str,
        "is_eol": is_eol,
        "severity": severity,
        "title": description,
        "advisory_id": f"RUNTIME-NODE-{cycle}-EOL" if is_eol else f"RUNTIME-NODE-{cycle}-PATCH",
        "recommendation": f"Upgrade Node.js to {latest_str} using 'python scripts/actions/security/check_runtimes.py --sync-node {latest_str}'",
    }


def audit_python_runtime(
    current_version: str, eol_data: list[dict[str, Any]] | None = None
) -> dict[str, Any] | None:
    """Audits current Python version against lifecycle and patch availability."""
    if eol_data is None:
        eol_data = fetch_eol_data("python")
    if not eol_data:
        return None

    parsed_cur = parse_semver(current_version)
    if not parsed_cur:
        return None

    cycle = f"{parsed_cur[0]}.{parsed_cur[1]}" if len(parsed_cur) >= 2 else str(parsed_cur[0])

    cycle_info = next((item for item in eol_data if str(item.get("cycle")) == cycle), None)
    if not cycle_info:
        return None

    latest_str = str(cycle_info.get("latest", ""))
    eol_str = str(cycle_info.get("eol", ""))
    today = date.today().isoformat()

    is_eol = bool(eol_str and eol_str <= today)
    parsed_latest = parse_semver(latest_str) if latest_str else ()

    needs_update = bool(len(parsed_cur) >= 3 and parsed_latest and parsed_cur < parsed_latest)

    if not is_eol and not needs_update:
        return None

    severity = "HIGH" if is_eol else "LOW"
    description = (
        f"Python {current_version} is End-of-Life as of {eol_str}."
        if is_eol
        else f"Python {current_version} has patch update {latest_str} available in cycle {cycle}."
    )

    return {
        "ecosystem": "Runtime (Python)",
        "component": "Python",
        "installed_version": current_version,
        "latest_version": latest_str,
        "cycle": cycle,
        "eol": eol_str,
        "is_eol": is_eol,
        "severity": severity,
        "title": description,
        "advisory_id": f"RUNTIME-PY-{cycle.replace('.', '')}-EOL"
        if is_eol
        else f"RUNTIME-PY-{cycle.replace('.', '')}-PATCH",
        "recommendation": f"Upgrade Python to {latest_str} or cycle {cycle}.",
    }


def sync_node_version(new_version: str, root_dir: Path = ROOT_DIR) -> list[str]:
    """Atomically synchronizes a new Node.js version across all monorepo files."""
    modified_files: list[str] = []

    # 1. .nvmrc
    nvmrc = root_dir / ".nvmrc"
    if nvmrc.exists():
        nvmrc.write_text(f"{new_version}\n", encoding="utf-8")
        modified_files.append(".nvmrc")

    # 2. package.json
    pkg_json = root_dir / "package.json"
    if pkg_json.exists():
        content = pkg_json.read_text(encoding="utf-8")
        updated = re.sub(r'("node":\s*")[^"]+(")', rf"\g<1>{new_version}\g<2>", content)
        if updated != content:
            pkg_json.write_text(updated, encoding="utf-8")
            modified_files.append("package.json")

    # 3. server/Dockerfile
    dockerfile = root_dir / "server" / "Dockerfile"
    if dockerfile.exists():
        content = dockerfile.read_text(encoding="utf-8")
        updated = re.sub(
            r"FROM node:[^\s-]+-alpine AS base",
            f"FROM node:{new_version}-alpine AS base",
            content,
        )
        if updated != content:
            dockerfile.write_text(updated, encoding="utf-8")
            modified_files.append("server/Dockerfile")

    # 4. Workflows (.github/workflows/*.yml)
    workflows_dir = root_dir / ".github" / "workflows"
    if workflows_dir.exists():
        for wf in workflows_dir.glob("*.yml"):
            content = wf.read_text(encoding="utf-8")
            updated = re.sub(r"node-version:\s*[\d.]+", f"node-version: {new_version}", content)
            if updated != content:
                wf.write_text(updated, encoding="utf-8")
                modified_files.append(f".github/workflows/{wf.name}")

    return modified_files


def sync_python_version(new_version: str, root_dir: Path = ROOT_DIR) -> list[str]:
    """Atomically synchronizes a new Python version across all monorepo files."""
    modified_files: list[str] = []
    cycle = ".".join(new_version.split(".")[:2]) if "." in new_version else new_version  # e.g. 3.13
    ruff_target = f"py{cycle.replace('.', '')}"  # e.g. py313

    # 1. ml/pyproject.toml
    pyproject = root_dir / "ml" / "pyproject.toml"
    if pyproject.exists():
        content = pyproject.read_text(encoding="utf-8")
        updated = re.sub(
            r'target-version\s*=\s*"[^"]+"',
            f'target-version = "{ruff_target}"',
            content,
        )
        updated = re.sub(
            r'python_version\s*=\s*"[^"]+"',
            f'python_version = "{cycle}"',
            updated,
        )
        if updated != content:
            pyproject.write_text(updated, encoding="utf-8")
            modified_files.append("ml/pyproject.toml")

    # 2. Workflows (.github/workflows/*.yml)
    workflows_dir = root_dir / ".github" / "workflows"
    if workflows_dir.exists():
        for wf in workflows_dir.glob("*.yml"):
            content = wf.read_text(encoding="utf-8")
            updated = re.sub(
                r"python-version:\s*['\"][^'\"]+['\"]",
                f"python-version: '{cycle}'",
                content,
            )
            if updated != content:
                wf.write_text(updated, encoding="utf-8")
                modified_files.append(f".github/workflows/{wf.name}")

    return modified_files


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Audit and synchronize monorepo runtime and language versions."
    )
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        help="Optional path to output structured JSON findings for CI automation.",
    )
    parser.add_argument(
        "--sync-node",
        type=str,
        help="Synchronize Node.js version across .nvmrc, package.json, Dockerfile, and workflows.",
    )
    parser.add_argument(
        "--sync-python",
        type=str,
        help="Synchronize Python version across pyproject.toml and workflows.",
    )
    args = parser.parse_args()

    if args.sync_node:
        updated = sync_node_version(args.sync_node)
        print(f"Synchronized Node.js to {args.sync_node} in {len(updated)} files:")
        for path in updated:
            print(f"  - {path}")
        return 0

    if args.sync_python:
        updated = sync_python_version(args.sync_python)
        print(f"Synchronized Python to {args.sync_python} in {len(updated)} files:")
        for path in updated:
            print(f"  - {path}")
        return 0

    node_cur = get_current_node_version()
    python_cur = get_current_python_version()

    print(f"Checking runtimes (Node.js: {node_cur}, Python: {python_cur})...")

    findings: list[dict[str, Any]] = []
    node_finding = audit_node_runtime(node_cur)
    if node_finding:
        findings.append(node_finding)
        print(f"⚠️  [Node.js] {node_finding['title']}")
    else:
        print(f"✅  [Node.js] Version {node_cur} is up to date.")

    python_finding = audit_python_runtime(python_cur)
    if python_finding:
        findings.append(python_finding)
        print(f"⚠️  [Python] {python_finding['title']}")
    else:
        print(f"✅  [Python] Version {python_cur} is up to date.")

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump({"findings": findings}, f, indent=2)
        print(f"Audit report saved to {args.output}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
