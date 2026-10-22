#!/usr/bin/env python3
"""Cross-ecosystem security issue lifecycle manager for RekaKarbon.

Synchronizes vulnerability findings across Node.js (pnpm audit),
Python ML (pip-audit), and Solidity (Slither) with GitHub Issues.
- Automatically creates deduplicated tracking issues for unresolved vulnerabilities.
- Automatically closes existing issues when vulnerabilities are successfully remediated.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable


@dataclass
class VulnerabilityAdvisory:
    ecosystem: str  # "Node", "Python", or "Solidity"
    package_name: str
    advisory_id: str
    severity: str
    title: str
    vulnerable_versions: str = "Unknown"
    url: str = ""
    cvss_score: str = "N/A"
    cwe: list[str] = field(default_factory=list)
    dependency_chain: list[str] = field(default_factory=list)
    description: str = ""


@dataclass
class GitHubIssue:
    number: int
    title: str
    state: str = "open"
    labels: list[str] = field(default_factory=list)


@dataclass
class SyncResult:
    active_advisories_count: int
    existing_open_issues_count: int
    new_issues_created_count: int
    issues_closed_count: int


ISSUE_TITLE_PATTERN = re.compile(
    r"\[Security Advisory\]\s*(?:\[(?P<ecosystem>[^\]]+)\]\s*)?(?P<package>[^\s]+)\s*\((?P<advisory>[^)]+)\)",
    re.IGNORECASE,
)


def normalize_advisory_id(raw_id: str) -> str:
    cleaned = raw_id.strip().upper()
    ghsa_match = re.search(r"GHSA-[A-Z0-9-]+", cleaned)
    if ghsa_match:
        return ghsa_match.group(0)
    cve_match = re.search(r"CVE-\d{4}-\d+", cleaned)
    if cve_match:
        return cve_match.group(0)
    pysec_match = re.search(r"PYSEC-\d{4}-\d+", cleaned)
    if pysec_match:
        return pysec_match.group(0)
    return cleaned


def parse_pnpm_audit_json(data: dict[str, Any]) -> list[VulnerabilityAdvisory]:
    """Extracts advisories from pnpm audit JSON format."""
    advisories: list[VulnerabilityAdvisory] = []
    vulnerabilities = data.get("vulnerabilities", {})
    if not isinstance(vulnerabilities, dict):
        return advisories

    for pkg_name, vuln_info in vulnerabilities.items():
        if not isinstance(vuln_info, dict):
            continue

        via_list = vuln_info.get("via", [])
        overall_severity = str(vuln_info.get("severity", "unknown")).upper()
        vuln_range = str(vuln_info.get("range", "Unknown"))
        dep_nodes = vuln_info.get("nodes", [])

        found_advisory = False
        for item in via_list:
            if isinstance(item, dict):
                found_advisory = True
                url = item.get("url", "")
                advisory_id = ""
                if url:
                    ghsa_match = re.search(r"GHSA-[a-zA-Z0-9-]+", url, re.IGNORECASE)
                    if ghsa_match:
                        advisory_id = ghsa_match.group(0).upper()
                    else:
                        cve_match = re.search(r"CVE-\d{4}-\d+", url, re.IGNORECASE)
                        if cve_match:
                            advisory_id = cve_match.group(0).upper()

                if not advisory_id:
                    raw_id = (
                        item.get("source")
                        or (url.split("/")[-1] if url else None)
                        or f"{pkg_name}-advisory"
                    )
                    advisory_id = normalize_advisory_id(str(raw_id))

                cvss = item.get("cvss", {})
                cvss_score = str(cvss.get("score", "N/A")) if isinstance(cvss, dict) else "N/A"
                if isinstance(cvss, dict) and cvss.get("vectorString"):
                    cvss_score += f" ({cvss['vectorString']})"

                cwes = item.get("cwe", [])
                if isinstance(cwes, str):
                    cwes = [cwes]
                elif not isinstance(cwes, list):
                    cwes = []

                chains = [str(n) for n in dep_nodes[:5]]

                advisories.append(
                    VulnerabilityAdvisory(
                        ecosystem="Node",
                        package_name=pkg_name,
                        advisory_id=advisory_id,
                        severity=str(item.get("severity") or overall_severity).upper(),
                        title=str(item.get("title") or f"Vulnerability in {pkg_name}"),
                        vulnerable_versions=str(item.get("range") or vuln_range),
                        url=url,
                        cvss_score=cvss_score,
                        cwe=[str(c) for c in cwes],
                        dependency_chain=chains,
                    )
                )

        if not found_advisory:
            # Transitive package without embedded advisory dict
            advisories.append(
                VulnerabilityAdvisory(
                    ecosystem="Node",
                    package_name=pkg_name,
                    advisory_id=f"{pkg_name.upper()}-VULN",
                    severity=overall_severity,
                    title=f"Transitive vulnerability in {pkg_name}",
                    vulnerable_versions=vuln_range,
                    dependency_chain=[str(n) for n in dep_nodes[:5]],
                )
            )

    return advisories


def parse_pip_audit_json(data: dict[str, Any]) -> list[VulnerabilityAdvisory]:
    """Extracts advisories from pip-audit JSON format."""
    advisories: list[VulnerabilityAdvisory] = []
    deps = data.get("dependencies", [])
    if not isinstance(deps, list):
        return advisories

    for dep in deps:
        if not isinstance(dep, dict):
            continue
        pkg_name = dep.get("name", "")
        version = dep.get("version", "unknown")
        vulns = dep.get("vulns", [])

        for v in vulns:
            if not isinstance(v, dict):
                continue
            adv_id = str(v.get("id", "")).strip()
            if not adv_id:
                adv_id = f"{pkg_name.upper()}-ADVISORY"
            norm_id = normalize_advisory_id(adv_id)

            fix_versions = v.get("fix_versions", [])
            fix_str = ", ".join(fix_versions) if fix_versions else "No fix available yet"

            desc = str(v.get("description", ""))
            short_desc = desc.split("\n")[0][:120] if desc else "Vulnerability detected"

            aliases = v.get("aliases", [])
            cwe_list = [a for a in aliases if a.startswith("CWE-")]

            url = (
                f"https://github.com/advisories/{norm_id}"
                if norm_id.startswith("GHSA-")
                else f"https://osv.dev/vulnerability/{norm_id}"
            )

            advisories.append(
                VulnerabilityAdvisory(
                    ecosystem="Python",
                    package_name=pkg_name,
                    advisory_id=norm_id,
                    severity="HIGH",  # pip-audit does not always emit CVSS severity level
                    title=short_desc,
                    vulnerable_versions=f"Installed: {version} (Fix: {fix_str})",
                    url=url,
                    cwe=cwe_list,
                    description=desc,
                )
            )

    return advisories


def parse_slither_text(text: str) -> list[VulnerabilityAdvisory]:
    """Extracts severe findings from Slither analysis report."""
    advisories: list[VulnerabilityAdvisory] = []
    lines = text.splitlines()

    for line in lines:
        cleaned = line.strip()
        if not cleaned or cleaned.startswith("INFO:"):
            continue
        if "0 result(s) found" in cleaned:
            continue

        if (" uses " in cleaned or "Dangerous" in cleaned) and not cleaned.startswith("#"):
            detector_match = re.search(r"\(([\w-]+)\)", cleaned)
            detector = detector_match.group(1) if detector_match else "slither-warning"

            advisories.append(
                VulnerabilityAdvisory(
                    ecosystem="Solidity",
                    package_name="SmartContracts",
                    advisory_id=f"SLITHER-{detector.upper()}",
                    severity="HIGH",
                    title=cleaned[:140],
                    vulnerable_versions="Contract Source",
                    description=cleaned,
                )
            )

    return advisories


try:
    from templates_engine import render_issue_advisory
except ImportError:
    from scripts.actions.security.templates_engine import render_issue_advisory


def clean_markdown_inline(text: str) -> str:
    """Strips markdown headers, newlines, and pipe characters to preserve table cells."""
    cleaned = re.sub(r"^[#\s]+", "", text)
    cleaned = re.sub(r"^(summary|details|description)[:\s-]*", "", cleaned, flags=re.IGNORECASE)
    cleaned = cleaned.replace("\r", " ").replace("\n", " ").replace("|", "\\|")
    return cleaned.strip()


def format_issue_title(adv: VulnerabilityAdvisory) -> str:
    return f"[Security Advisory] [{adv.ecosystem}] {adv.package_name} ({adv.advisory_id})"


def format_issue_body(adv: VulnerabilityAdvisory, run_id: str = "", repo: str = "") -> str:
    """Renders the issue body via Jinja2 template engine."""
    return render_issue_advisory(adv, run_id=run_id, repo=repo)


def fetch_open_security_issues(repo: str) -> list[GitHubIssue] | None:
    """Fetches open security issues via GitHub CLI."""
    if not repo:
        return []
    try:
        proc = subprocess.run(
            [
                "gh",
                "issue",
                "list",
                "--repo",
                repo,
                "--state",
                "open",
                "--limit",
                "150",
                "--json",
                "number,title,state,labels",
            ],
            capture_output=True,
            text=True,
            check=False,
        )
        if proc.returncode != 0:
            print(f"Warning: Failed to fetch issues via 'gh': {proc.stderr.strip()}")
            return None

        raw = json.loads(proc.stdout)
        issues: list[GitHubIssue] = []
        for item in raw:
            labels_raw = item.get("labels", [])
            labels = [lbl.get("name") if isinstance(lbl, dict) else str(lbl) for lbl in labels_raw]
            issues.append(
                GitHubIssue(
                    number=item["number"],
                    title=item["title"],
                    state=item.get("state", "open"),
                    labels=labels,
                )
            )
        return issues
    except Exception as e:
        print(f"Error executing 'gh issue list': {e}")
        return None


def close_github_issue(repo: str, issue_number: int, comment: str) -> bool:
    try:
        subprocess.run(
            ["gh", "issue", "close", str(issue_number), "--repo", repo, "--comment", comment],
            check=True,
            capture_output=True,
        )
        print(f"Closed issue #{issue_number}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Failed to close issue #{issue_number}: {e.stderr.decode('utf-8', errors='ignore')}")
        return False


def ensure_security_label_exists(repo: str) -> bool:
    """Ensures the 'security' label exists on GitHub."""
    if not repo:
        return False
    try:
        proc = subprocess.run(
            [
                "gh",
                "label",
                "create",
                "security",
                "--repo",
                repo,
                "--description",
                "Security advisories and vulnerability tracking",
                "--color",
                "d73a4a",
                "--force",
            ],
            capture_output=True,
            text=True,
            check=False,
        )
        return proc.returncode == 0
    except Exception as e:
        print(f"Warning: Could not create security label: {e}")
        return False


def create_github_issue(repo: str, title: str, body: str) -> int | None:
    try:
        proc = subprocess.run(
            [
                "gh",
                "issue",
                "create",
                "--repo",
                repo,
                "--title",
                title,
                "--body",
                body,
                "--label",
                "security",
            ],
            capture_output=True,
            text=True,
            check=False,
        )
        if proc.returncode != 0 and "label" in proc.stderr.lower():
            # Fallback without label if 'security' label does not exist in target repo
            proc = subprocess.run(
                ["gh", "issue", "create", "--repo", repo, "--title", title, "--body", body],
                capture_output=True,
                text=True,
                check=False,
            )

        if proc.returncode == 0:
            out = proc.stdout.strip()
            print(f"Created issue: {out}")
            match = re.search(r"/issues/(\d+)", out)
            return int(match.group(1)) if match else None
        else:
            print(f"Failed to create issue '{title}': {proc.stderr.strip()}")
            return None
    except Exception as e:
        print(f"Error creating issue: {e}")
        return None


def sync_security_issues(
    findings: list[VulnerabilityAdvisory],
    existing_issues: list[GitHubIssue],
    repo: str,
    run_id: str = "",
    dry_run: bool = False,
    create_fn: Callable[[str, str], int | None] | None = None,
    close_fn: Callable[[int, str], bool] | None = None,
) -> SyncResult:
    """Synchronizes active vulnerability findings with open GitHub Issues."""
    # Build active map: key = (ecosystem, package_name, advisory_id)
    active_map: dict[tuple[str, str, str], VulnerabilityAdvisory] = {}
    for adv in findings:
        key = (
            adv.ecosystem.strip().lower(),
            adv.package_name.strip().lower(),
            normalize_advisory_id(adv.advisory_id),
        )
        active_map[key] = adv

    # Build tracked map from open GitHub issues
    tracked_map: dict[tuple[str, str, str], GitHubIssue] = {}
    for issue in existing_issues:
        match = ISSUE_TITLE_PATTERN.search(issue.title)
        if not match:
            continue
        ecosystem = (match.group("ecosystem") or "node").strip().lower()
        package = match.group("package").strip().lower()
        advisory = normalize_advisory_id(match.group("advisory"))
        tracked_map[(ecosystem, package, advisory)] = issue

    if repo and not dry_run:
        ensure_security_label_exists(repo)
        for issue in tracked_map.values():
            if not any(lbl.lower() == "security" for lbl in issue.labels):
                try:
                    subprocess.run(
                        [
                            "gh",
                            "issue",
                            "edit",
                            str(issue.number),
                            "--repo",
                            repo,
                            "--add-label",
                            "security",
                        ],
                        capture_output=True,
                        check=False,
                    )
                    issue.labels.append("security")
                except Exception:
                    pass

    created_count = 0
    closed_count = 0

    # 1. Close resolved issues
    for key, issue in tracked_map.items():
        if key not in active_map:
            comment = (
                f"✅ **Resolved**: This vulnerability is no longer reported as of "
                f"security audit run {f'#{run_id}' if run_id else ''}. "
                f"Automatically closing issue."
            )
            if not dry_run:
                if close_fn:
                    close_fn(issue.number, comment)
                elif repo:
                    close_github_issue(repo, issue.number, comment)
            else:
                print(f"[DRY-RUN] Would close issue #{issue.number} ({issue.title})")
            closed_count += 1

    # 2. Create new issues for untracked advisories
    for key, adv in active_map.items():
        if key not in tracked_map:
            title = format_issue_title(adv)
            body = format_issue_body(adv, run_id=run_id, repo=repo)
            if not dry_run:
                if create_fn:
                    create_fn(title, body)
                elif repo:
                    create_github_issue(repo, title, body)
            else:
                print(f"[DRY-RUN] Would create issue: {title}")
            created_count += 1

    return SyncResult(
        active_advisories_count=len(active_map),
        existing_open_issues_count=len(tracked_map),
        new_issues_created_count=created_count,
        issues_closed_count=closed_count,
    )


def set_github_output(key: str, value: Any) -> None:
    output_file = os.environ.get("GITHUB_OUTPUT")
    if output_file:
        with open(output_file, "a", encoding="utf-8") as f:
            f.write(f"{key}={value}\n")


def append_step_summary(text: str) -> None:
    summary_file = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary_file:
        with open(summary_file, "a", encoding="utf-8") as f:
            f.write(f"{text}\n")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="RekaKarbon Security Issue Lifecycle Manager")
    parser.add_argument("--node-audit", help="Path to pnpm audit JSON file")
    parser.add_argument("--python-audit", help="Path to pip-audit JSON file")
    parser.add_argument("--slither-report", help="Path to Slither report txt file")
    parser.add_argument("--repo", default=os.environ.get("GITHUB_REPOSITORY", ""))
    parser.add_argument("--run-id", default=os.environ.get("GITHUB_RUN_ID", ""))
    parser.add_argument(
        "--dry-run", action="store_true", help="Preview sync actions without mutating GitHub"
    )

    args = parser.parse_args(argv)

    findings: list[VulnerabilityAdvisory] = []

    # Parse Node.js findings
    if args.node_audit and Path(args.node_audit).exists():
        try:
            with open(args.node_audit, "r", encoding="utf-8") as f:
                node_data = json.load(f)
            node_vulns = parse_pnpm_audit_json(node_data)
            findings.extend(node_vulns)
            print(f"Loaded {len(node_vulns)} advisory finding(s) from {args.node_audit}")
        except Exception as e:
            print(f"Warning: Failed to parse {args.node_audit}: {e}")

    # Parse Python ML findings
    if args.python_audit and Path(args.python_audit).exists():
        try:
            with open(args.python_audit, "r", encoding="utf-8") as f:
                py_data = json.load(f)
            py_vulns = parse_pip_audit_json(py_data)
            findings.extend(py_vulns)
            print(f"Loaded {len(py_vulns)} advisory finding(s) from {args.python_audit}")
        except Exception as e:
            print(f"Warning: Failed to parse {args.python_audit}: {e}")

    # Parse Solidity findings
    if args.slither_report and Path(args.slither_report).exists():
        try:
            with open(args.slither_report, "r", encoding="utf-8") as f:
                slither_text = f.read()
            slither_vulns = parse_slither_text(slither_text)
            findings.extend(slither_vulns)
            print(f"Loaded {len(slither_vulns)} advisory finding(s) from {args.slither_report}")
        except Exception as e:
            print(f"Warning: Failed to parse {args.slither_report}: {e}")

    existing_issues = (
        fetch_open_security_issues(args.repo) if args.repo and not args.dry_run else []
    )
    if existing_issues is None:
        print("Error: Could not retrieve existing open issues. Aborting sync.")
        return 1

    result = sync_security_issues(
        findings=findings,
        existing_issues=existing_issues,
        repo=args.repo,
        run_id=args.run_id,
        dry_run=args.dry_run or not bool(args.repo),
    )

    print("\n--- Security Issue Lifecycle Sync Results ---")
    print(f"Active Advisories: {result.active_advisories_count}")
    print(f"Existing Open Issues: {result.existing_open_issues_count}")
    print(f"New Issues Created: {result.new_issues_created_count}")
    print(f"Resolved Issues Closed: {result.issues_closed_count}")

    set_github_output("active_issues_count", result.active_advisories_count)
    set_github_output("new_issues_count", result.new_issues_created_count)
    set_github_output("closed_issues_count", result.issues_closed_count)

    summary_md = (
        "\n### 🛡️ Dependency & Security Issue Lifecycle\n"
        f"- **Active Unresolved Advisories**: `{result.active_advisories_count}`\n"
        f"- **New Issues Created**: `{result.new_issues_created_count}`\n"
        f"- **Resolved Issues Auto-Closed**: `{result.issues_closed_count}`\n"
    )
    append_step_summary(summary_md)

    return 0


if __name__ == "__main__":
    sys.exit(main())
