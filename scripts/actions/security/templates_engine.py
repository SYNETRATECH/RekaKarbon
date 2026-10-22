#!/usr/bin/env python3
"""Jinja2 template rendering engine for RekaKarbon security automation.

Renders GitHub Security Issue and Pull Request markdown templates.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from typing import Any

TEMPLATES_DIR = Path(__file__).resolve().parent / "templates"


def clean_table_cell(text: str) -> str:
    """Strips markdown headers, newlines, and pipe characters to preserve table cells."""
    if not text:
        return "N/A"
    cleaned = re.sub(r"^[#\s]+", "", str(text))
    cleaned = re.sub(r"^(summary|details|description)[:\s-]*", "", cleaned, flags=re.IGNORECASE)
    cleaned = cleaned.replace("\r", " ").replace("\n", " ").replace("|", "\\|")
    return cleaned.strip() or "N/A"


def get_jinja_env() -> Any:
    """Initializes and configures the Jinja2 template environment."""
    try:
        import jinja2
    except ImportError as e:
        raise RuntimeError(
            "Jinja2 is required to render security automation templates. "
            "Please ensure it is installed via 'pip install jinja2'."
        ) from e

    env = jinja2.Environment(
        loader=jinja2.FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=False,
        trim_blocks=True,
        lstrip_blocks=True,
        keep_trailing_newline=True,
    )
    env.filters["clean_table_cell"] = clean_table_cell
    return env


def render_issue_advisory(adv: Any, run_id: str = "", repo: str = "") -> str:
    """Renders the issue advisory body using issue_advisory.md.j2."""
    env = get_jinja_env()
    template = env.get_template("issue_advisory.md.j2")
    return template.render(adv=adv, run_id=run_id, repo=repo).strip()


def render_pull_request(
    repo: str = "",
    run_id: str = "",
    target: str = "all",
    updated_packages: list[str] | None = None,
) -> str:
    """Renders the pull request body using pull_request.md.j2."""
    env = get_jinja_env()
    template = env.get_template("pull_request.md.j2")
    return template.render(
        repo=repo,
        run_id=run_id,
        target=target,
        updated_packages=updated_packages or [],
    ).strip()


def main(argv: list[str] | None = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description="Render security automation markdown templates")
    parser.add_argument("--pr", action="store_true", help="Render PR description template")
    parser.add_argument("--repo", default="", help="GitHub repository (e.g. FarrelAD/RekaKarbon)")
    parser.add_argument("--run-id", default="", help="GitHub Actions run ID")
    parser.add_argument("--target", default="all", help="Remediation target scope")
    parser.add_argument("--packages", default="", help="Comma-separated updated package list")

    args = parser.parse_args(argv)

    if args.pr:
        pkgs = [p.strip() for p in args.packages.split(",") if p.strip()] if args.packages else None
        output = render_pull_request(
            repo=args.repo,
            run_id=args.run_id,
            target=args.target,
            updated_packages=pkgs,
        )
        print(output)
        return 0

    parser.print_help()
    return 0


if __name__ == "__main__":
    sys.exit(main())
