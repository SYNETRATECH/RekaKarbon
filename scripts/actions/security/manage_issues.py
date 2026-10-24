#!/usr/bin/env python3
"""Cross-ecosystem security issue lifecycle manager for RekaKarbon.

Synchronizes vulnerability findings across Node.js (pnpm audit),
Python ML (pip-audit), Solidity (Slither), and language runtimes with GitHub Issues.
- Automatically creates deduplicated tracking issues for unresolved vulnerabilities.
- Links automated PRs (Resolves #123) and cross-references issue comments.
- Prevents premature issue closure before PR merge.
- Automatically closes existing issues when vulnerabilities are verified clean on the base branch.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")


@dataclass
class VulnerabilityAdvisory:
    ecosystem: str  # "Node", "Python", "Solidity", "Runtime (Node.js)", "Runtime (Python)"
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
    remediated_linked_count: int = 0


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
    """Extracts advisories from pnpm audit JSON format (supports pnpm 11 advisories and legacy vulnerabilities)."""
    advisories: list[VulnerabilityAdvisory] = []

    # 1. pnpm 11 schema: data.advisories
    advisories_dict = data.get("advisories", {})
    if isinstance(advisories_dict, dict) and advisories_dict:
        raw_items: list[Any] = []
        for val in advisories_dict.values():
            if isinstance(val, list):
                raw_items.extend(val)
            elif isinstance(val, dict):
                raw_items.append(val)

        for raw_adv in raw_items:
            if not isinstance(raw_adv, dict):
                continue

            pkg_name = raw_adv.get("module_name") or raw_adv.get("name") or "unknown"
            raw_id = (
                raw_adv.get("github_advisory_id")
                or raw_adv.get("cve")
                or str(raw_adv.get("id", "UNKNOWN"))
            )
            advisory_id = normalize_advisory_id(raw_id)
            severity = str(raw_adv.get("severity", "moderate")).upper()
            title = raw_adv.get("title") or f"Security advisory in {pkg_name}"
            vulnerable_versions = raw_adv.get("vulnerable_versions", "Unknown")
            url = raw_adv.get("url") or ""
            cwe = raw_adv.get("cwe")
            cwe_list = [cwe] if isinstance(cwe, str) else (cwe or [])
            overview = raw_adv.get("overview") or raw_adv.get("recommendation") or ""

            findings_list = raw_adv.get("findings", [])
            paths: list[str] = []
            if isinstance(findings_list, list):
                for f in findings_list:
                    if isinstance(f, dict):
                        paths.extend(f.get("paths", []))

            advisories.append(
                VulnerabilityAdvisory(
                    ecosystem="Node",
                    package_name=pkg_name,
                    advisory_id=advisory_id,
                    severity=severity,
                    title=title,
                    vulnerable_versions=vulnerable_versions,
                    url=url,
                    cwe=cwe_list,
                    dependency_chain=list(dict.fromkeys(paths)),
                    description=overview,
                )
            )
        return advisories

    # 2. Standard / legacy npm schema: data.vulnerabilities
    vulnerabilities = data.get("vulnerabilities", {})
    if isinstance(vulnerabilities, dict):
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
                            advisory_id = (
                                cve_match.group(0).upper()
                                if cve_match
                                else f"{pkg_name.upper()}-VULN"
                            )
                    else:
                        advisory_id = f"{pkg_name.upper()}-VULN"

                    norm_id = normalize_advisory_id(advisory_id)
                    cvss = item.get("cvss", {})
                    cvss_score = str(cvss.get("score", "N/A")) if isinstance(cvss, dict) else "N/A"
                    cwes = item.get("cwe", [])
                    cwe_list = (
                        [cwes]
                        if isinstance(cwes, str)
                        else (cwes if isinstance(cwes, list) else [])
                    )

                    advisories.append(
                        VulnerabilityAdvisory(
                            ecosystem="Node",
                            package_name=pkg_name,
                            advisory_id=norm_id,
                            severity=str(item.get("severity") or overall_severity).upper(),
                            title=str(item.get("title") or f"Vulnerability in {pkg_name}"),
                            vulnerable_versions=str(item.get("range") or vuln_range),
                            url=url,
                            cvss_score=cvss_score,
                            cwe=[str(c) for c in cwe_list],
                            dependency_chain=[str(n) for n in dep_nodes[:5]],
                        )
                    )

            if not found_advisory:
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
                    severity="HIGH",
                    title=short_desc,
                    vulnerable_versions=f"Installed: {version} (Fix: {fix_str})",
                    url=url,
                    cwe=cwe_list,
                    description=desc,
                )
            )

    return advisories


def parse_runtime_audit_json(
    data: dict[str, Any],
) -> list[VulnerabilityAdvisory]:
    """Extracts advisories from runtime sentinel audit JSON format."""
    advisories: list[VulnerabilityAdvisory] = []
    findings = data.get("findings", [])
    for f in findings:
        eco = f.get("ecosystem", "Runtime")
        comp = f.get("component", "Runtime")
        adv_id = f.get("advisory_id", "RUNTIME-ALERT")
        installed = f.get("installed_version", "Unknown")
        latest = f.get("latest_version", "Unknown")
        cycle = f.get("cycle", "")
        eol = f.get("eol", "")
        is_eol = f.get("is_eol", False)
        sev = f.get("severity", "MODERATE")
        title = f.get("title", f"{comp} update available")
        rec = f.get("recommendation", "")

        desc = (
            f"**Runtime**: `{comp}`\n\n"
            f"- **Installed Version**: `{installed}`\n"
            f"- **Latest Patch**: `{latest}` (Cycle `{cycle}`)\n"
            f"- **End-of-Life Date**: `{eol}` (Is EOL: `{is_eol}`)\n\n"
            f"### Recommended Action\n{rec}\n"
        )

        advisories.append(
            VulnerabilityAdvisory(
                ecosystem=eco,
                package_name=comp.lower(),
                advisory_id=adv_id,
                severity=sev,
                title=title,
                vulnerable_versions=f"Installed: {installed} (Latest: {latest})",
                url=f"https://endoflife.date/{comp.lower().replace('.', '')}",
                description=desc,
                dependency_chain=[f"Repository runtime configuration ({comp})"],
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
    cleaned = re.sub(
        r"^(summary|details|description)[:\s-]*",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )
    cleaned = cleaned.replace("\r", " ").replace("\n", " ").replace("|", "\\|")
    return cleaned.strip()


def format_issue_title(adv: VulnerabilityAdvisory) -> str:
    norm_adv = normalize_advisory_id(adv.advisory_id)
    return f"[Security Advisory] [{adv.ecosystem}] {adv.package_name} ({norm_adv})"


def format_issue_body(adv: VulnerabilityAdvisory, run_id: str = "", repo: str = "") -> str:
    """Renders the issue body via Jinja2 template engine."""
    return render_issue_advisory(adv, run_id=run_id, repo=repo)


def parse_issue_title(title: str) -> tuple[str | None, str | None, str | None]:
    """Extracts (ecosystem, package_name, advisory_id) from title."""
    m = ISSUE_TITLE_PATTERN.search(title)
    if not m:
        return None, None, None
    eco = m.group("ecosystem")
    pkg = m.group("package")
    raw_adv = m.group("advisory")
    return eco, pkg, normalize_advisory_id(raw_adv) if raw_adv else None


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
                "--label",
                "security",
                "--limit",
                "100",
                "--json",
                "number,title,state,labels",
            ],
            capture_output=True,
            text=True,
            check=True,
        )
        data = json.loads(proc.stdout)
        issues: list[GitHubIssue] = []
        for item in data:
            labels = [
                lbl.get("name", "") for lbl in item.get("labels", []) if isinstance(lbl, dict)
            ]
            issues.append(
                GitHubIssue(
                    number=item.get("number", 0),
                    title=item.get("title", ""),
                    state=item.get("state", "open"),
                    labels=labels,
                )
            )
        return issues
    except Exception as e:
        sys.stderr.write(f"Error fetching issues via gh CLI: {e}\n")
        return None


def create_security_issue(
    adv: VulnerabilityAdvisory,
    repo: str,
    run_id: str = "",
    dry_run: bool = False,
) -> int | None:
    """Creates a new GitHub issue for an advisory."""
    title = format_issue_title(adv)
    body = format_issue_body(adv, run_id=run_id, repo=repo)

    if dry_run:
        print(f"[DRY-RUN] Would create issue: '{title}' with labels 'security'")
        return 9999

    cmd = [
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
    ]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        out = res.stdout.strip()
        num_match = re.search(r"/issues/(\d+)", out)
        if num_match:
            issue_num = int(num_match.group(1))
            print(f"Created issue #{issue_num}: {title}")
            return issue_num
        print(f"Created issue (URL: {out})")
        return 0
    except subprocess.CalledProcessError as e:
        sys.stderr.write(f"Failed to create issue for {adv.advisory_id}: {e.stderr}\n")
        return None


def comment_pr_link_on_issue(
    issue_number: int,
    advisory_id: str,
    package_name: str,
    pr_number: str,
    pr_url: str,
    repo: str,
    dry_run: bool = False,
) -> bool:
    """Posts a link to the remediation PR on the corresponding tracking issue."""
    comment = (
        f"🚀 **Automated Fix Proposed**: Pull Request [#{pr_number}]({pr_url}) "
        f"has been generated to remediate `{advisory_id}` in `{package_name}`.\n\n"
        f"*This issue will automatically close when the pull request is merged into the base branch.*"
    )
    if dry_run:
        print(f"[DRY-RUN] Would comment on issue #{issue_number} linking PR #{pr_number}")
        return True

    try:
        check_cmd = [
            "gh",
            "issue",
            "view",
            str(issue_number),
            "--repo",
            repo,
            "--json",
            "comments",
        ]
        res = subprocess.run(check_cmd, capture_output=True, text=True, check=False)
        if res.returncode == 0:
            data = json.loads(res.stdout) if res.stdout.strip() else {}
            comments = data.get("comments", [])
            for c in comments:
                body_text = c.get("body", "")
                if pr_url in body_text or f"#{pr_number}]" in body_text:
                    print(
                        f"Issue #{issue_number} already linked to PR #{pr_number}. Skipping duplicate comment."
                    )
                    return True

        cmd = [
            "gh",
            "issue",
            "comment",
            str(issue_number),
            "--repo",
            repo,
            "--body",
            comment,
        ]
        subprocess.run(cmd, capture_output=True, text=True, check=True)
        print(f"Posted PR #{pr_number} reference comment to issue #{issue_number}")
        return True
    except subprocess.CalledProcessError as e:
        sys.stderr.write(f"Warning: Failed to comment on issue #{issue_number}: {e.stderr}\n")
        return False


def update_pr_description(
    repo: str,
    pr_number: str,
    linked_issues: list[dict[str, Any]],
    target: str = "all",
    run_id: str = "",
    dry_run: bool = False,
) -> bool:
    """Updates the Pull Request body to include 'Resolves #<num>' closing references."""
    if not repo or not pr_number or not linked_issues:
        return False

    try:
        from templates_engine import render_pull_request
    except ImportError:
        from scripts.actions.security.templates_engine import render_pull_request

    packages = list(dict.fromkeys(item["package"] for item in linked_issues))
    body = render_pull_request(
        repo=repo,
        run_id=run_id,
        target=target,
        updated_packages=packages,
        linked_issues=linked_issues,
    )

    if dry_run:
        print(f"[DRY-RUN] Would update PR #{pr_number} with {len(linked_issues)} linked issue(s):")
        for item in linked_issues:
            print(f"  - Resolves #{item['number']}: {item['package']} ({item['advisory_id']})")
        return True

    cmd = ["gh", "pr", "edit", str(pr_number), "--repo", repo, "--body", body]
    try:
        subprocess.run(cmd, capture_output=True, text=True, check=True)
        print(f"Successfully updated PR #{pr_number} with {len(linked_issues)} linked issue(s):")
        for item in linked_issues:
            print(f"  - Resolves #{item['number']}: {item['package']} ({item['advisory_id']})")
        return True
    except subprocess.CalledProcessError as e:
        sys.stderr.write(f"Warning: Failed to update PR #{pr_number} description: {e.stderr}\n")
        return False


def close_security_issue(
    issue_number: int,
    advisory_id: str,
    repo: str,
    run_id: str = "",
    dry_run: bool = False,
) -> bool:
    """Closes an existing GitHub issue when its vulnerability is resolved on the base branch."""
    comment = (
        f"✅ **Vulnerability Resolved**: Automated security scans confirmed that "
        f"`{advisory_id}` is no longer present in the codebase."
    )
    if run_id and repo:
        comment += f"\n\n*Verified by workflow run: [{run_id}](https://github.com/{repo}/actions/runs/{run_id})*"

    if dry_run:
        print(f"[DRY-RUN] Would close issue #{issue_number} ({advisory_id})")
        return True

    try:
        comment_cmd = [
            "gh",
            "issue",
            "comment",
            str(issue_number),
            "--repo",
            repo,
            "--body",
            comment,
        ]
        subprocess.run(comment_cmd, capture_output=True, text=True, check=True)

        close_cmd = [
            "gh",
            "issue",
            "close",
            str(issue_number),
            "--repo",
            repo,
            "--reason",
            "completed",
        ]
        subprocess.run(close_cmd, capture_output=True, text=True, check=True)
        print(f"Closed resolved issue #{issue_number} ({advisory_id})")
        return True
    except subprocess.CalledProcessError as e:
        sys.stderr.write(f"Failed to close issue #{issue_number}: {e.stderr}\n")
        return False


def sync_security_issues(
    findings: list[VulnerabilityAdvisory],
    existing_issues: list[GitHubIssue],
    repo: str,
    run_id: str = "",
    baseline_findings: list[VulnerabilityAdvisory] | None = None,
    pr_url: str = "",
    pr_number: str = "",
    target: str = "all",
    dry_run: bool = False,
    create_fn: Callable[..., int | None] = create_security_issue,
    close_fn: Callable[..., bool] = close_security_issue,
    comment_pr_fn: Callable[..., bool] = comment_pr_link_on_issue,
    update_pr_fn: Callable[..., bool] = update_pr_description,
) -> SyncResult:
    """Reconciles findings with existing open issues, links fix PRs, and avoids premature closure."""
    active_by_advisory: dict[str, VulnerabilityAdvisory] = {}
    for f in findings:
        norm_id = normalize_advisory_id(f.advisory_id)
        active_by_advisory[norm_id] = f

    baseline_by_advisory: dict[str, VulnerabilityAdvisory] = {}
    if baseline_findings:
        for f in baseline_findings:
            norm_id = normalize_advisory_id(f.advisory_id)
            baseline_by_advisory[norm_id] = f

    open_advisories_map: dict[str, GitHubIssue] = {}
    other_open_security_issues: list[GitHubIssue] = []

    for issue in existing_issues:
        if issue.state.lower() != "open":
            continue
        _eco, _pkg, adv_id = parse_issue_title(issue.title)
        if adv_id:
            open_advisories_map[adv_id] = issue
        elif "security" in [lbl.lower() for lbl in issue.labels]:
            other_open_security_issues.append(issue)

    initial_open_count = len(open_advisories_map)
    new_created = 0
    linked_issues: list[dict[str, Any]] = []

    # 1. Identify remediated advisories (present in baseline, but absent in post-audit findings)
    remediated_by_advisory: dict[str, VulnerabilityAdvisory] = {}
    if baseline_by_advisory:
        for adv_id, adv in baseline_by_advisory.items():
            if adv_id not in active_by_advisory:
                remediated_by_advisory[adv_id] = adv

    # 2. Process remediated advisories (link to PR if PR exists, do NOT close prematurely)
    if remediated_by_advisory and pr_number and pr_url:
        for adv_id, adv in remediated_by_advisory.items():
            issue = open_advisories_map.get(adv_id)
            issue_num: int | None = None
            if issue is not None:
                issue_num = issue.number
            else:
                issue_num = create_fn(adv, repo=repo, run_id=run_id, dry_run=dry_run)
                if issue_num is not None:
                    new_created += 1
                    open_advisories_map[adv_id] = GitHubIssue(
                        number=issue_num,
                        title=format_issue_title(adv),
                        state="open",
                        labels=["security"],
                    )

            if issue_num is not None:
                linked_issues.append(
                    {
                        "number": issue_num,
                        "package": adv.package_name,
                        "advisory_id": adv_id,
                    }
                )
                comment_pr_fn(
                    issue_number=issue_num,
                    advisory_id=adv_id,
                    package_name=adv.package_name,
                    pr_number=pr_number,
                    pr_url=pr_url,
                    repo=repo,
                    dry_run=dry_run,
                )

        if linked_issues:
            update_pr_fn(
                repo=repo,
                pr_number=pr_number,
                linked_issues=linked_issues,
                target=target,
                run_id=run_id,
                dry_run=dry_run,
            )

    # 3. Create issues for unresolved / remaining active findings
    for adv_id, adv in active_by_advisory.items():
        if adv_id not in open_advisories_map:
            res = create_fn(adv, repo=repo, run_id=run_id, dry_run=dry_run)
            if res is not None:
                new_created += 1
                open_advisories_map[adv_id] = GitHubIssue(
                    number=res,
                    title=format_issue_title(adv),
                    state="open",
                    labels=["security"],
                )

    # 4. Close issues ONLY when verified clean at baseline (already resolved on base branch)
    closed_count = 0
    for adv_id, issue in open_advisories_map.items():
        if adv_id in active_by_advisory:
            continue
        if adv_id in remediated_by_advisory and pr_number:
            continue
        if baseline_by_advisory and adv_id in baseline_by_advisory:
            continue

        success = close_fn(
            issue.number,
            advisory_id=adv_id,
            repo=repo,
            run_id=run_id,
            dry_run=dry_run,
        )
        if success:
            closed_count += 1

    return SyncResult(
        active_advisories_count=len(active_by_advisory),
        existing_open_issues_count=initial_open_count,
        new_issues_created_count=new_created,
        issues_closed_count=closed_count,
        remediated_linked_count=len(linked_issues),
    )


def set_github_output(name: str, value: Any) -> None:
    output_file = os.environ.get("GITHUB_OUTPUT")
    if output_file:
        with Path(output_file).open("a", encoding="utf-8") as f:
            f.write(f"{name}={value}\n")


def append_step_summary(text: str) -> None:
    summary_file = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary_file:
        with Path(summary_file).open("a", encoding="utf-8") as f:
            f.write(f"{text}\n")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Security Issue Lifecycle Manager")
    parser.add_argument("--baseline-node-audit", help="Path to baseline pnpm audit JSON file")
    parser.add_argument("--baseline-python-audit", help="Path to baseline pip-audit JSON file")
    parser.add_argument("--node-audit", help="Path to post-audit pnpm audit JSON file")
    parser.add_argument("--python-audit", help="Path to post-audit pip-audit JSON file")
    parser.add_argument("--slither-report", help="Path to Slither analysis output file")
    parser.add_argument("--runtime-audit", help="Path to runtime sentinel audit JSON file")
    parser.add_argument("--pr-url", default="", help="URL of created remediation Pull Request")
    parser.add_argument(
        "--pr-number",
        default="",
        help="Number of created remediation Pull Request",
    )
    parser.add_argument("--target", default="all", help="Target component scope")
    parser.add_argument("--repo", default=os.environ.get("GITHUB_REPOSITORY", ""))
    parser.add_argument("--run-id", default=os.environ.get("GITHUB_RUN_ID", ""))
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview sync actions without mutating GitHub",
    )

    args = parser.parse_args(argv)

    # 1. Parse Baseline findings (before remediation)
    baseline_findings: list[VulnerabilityAdvisory] = []
    if args.baseline_node_audit and Path(args.baseline_node_audit).exists():
        try:
            with Path(args.baseline_node_audit).open(encoding="utf-8") as f:
                b_node_data = json.load(f)
            b_node_vulns = parse_pnpm_audit_json(b_node_data)
            baseline_findings.extend(b_node_vulns)
        except Exception as e:
            print(f"Warning: Failed to parse {args.baseline_node_audit}: {e}")

    if args.baseline_python_audit and Path(args.baseline_python_audit).exists():
        try:
            with Path(args.baseline_python_audit).open(encoding="utf-8") as f:
                b_py_data = json.load(f)
            b_py_vulns = parse_pip_audit_json(b_py_data)
            baseline_findings.extend(b_py_vulns)
        except Exception as e:
            print(f"Warning: Failed to parse {args.baseline_python_audit}: {e}")

    # 2. Parse Active findings (post-remediation + Solidity + runtime)
    active_findings: list[VulnerabilityAdvisory] = []

    if args.node_audit and Path(args.node_audit).exists():
        try:
            with Path(args.node_audit).open(encoding="utf-8") as f:
                node_data = json.load(f)
            node_vulns = parse_pnpm_audit_json(node_data)
            active_findings.extend(node_vulns)
            print(f"Loaded {len(node_vulns)} advisory finding(s) from {args.node_audit}")
        except Exception as e:
            print(f"Warning: Failed to parse {args.node_audit}: {e}")

    if args.python_audit and Path(args.python_audit).exists():
        try:
            with Path(args.python_audit).open(encoding="utf-8") as f:
                py_data = json.load(f)
            py_vulns = parse_pip_audit_json(py_data)
            active_findings.extend(py_vulns)
            print(f"Loaded {len(py_vulns)} advisory finding(s) from {args.python_audit}")
        except Exception as e:
            print(f"Warning: Failed to parse {args.python_audit}: {e}")

    if args.slither_report and Path(args.slither_report).exists():
        try:
            with Path(args.slither_report).open(encoding="utf-8") as f:
                slither_text = f.read()
            slither_vulns = parse_slither_text(slither_text)
            active_findings.extend(slither_vulns)
            print(
                f"Loaded {len(slither_vulns)} smart contract finding(s) from {args.slither_report}"
            )
        except Exception as e:
            print(f"Warning: Failed to parse {args.slither_report}: {e}")

    if args.runtime_audit and Path(args.runtime_audit).exists():
        try:
            with Path(args.runtime_audit).open(encoding="utf-8") as f:
                runtime_data = json.load(f)
            runtime_vulns = parse_runtime_audit_json(runtime_data)
            active_findings.extend(runtime_vulns)
            print(f"Loaded {len(runtime_vulns)} advisory finding(s) from {args.runtime_audit}")
        except Exception as e:
            print(f"Warning: Failed to parse {args.runtime_audit}: {e}")

    existing_issues = fetch_open_security_issues(args.repo) if args.repo else []
    if existing_issues is None:
        print("Error: Could not retrieve existing open issues. Aborting sync.")
        return 1

    result = sync_security_issues(
        findings=active_findings,
        existing_issues=existing_issues,
        repo=args.repo,
        run_id=args.run_id,
        baseline_findings=baseline_findings,
        pr_url=args.pr_url,
        pr_number=args.pr_number,
        target=args.target,
        dry_run=args.dry_run or not bool(args.repo),
    )

    print("\n--- Security Issue Lifecycle Sync Results ---")
    print(f"Active Advisories: {result.active_advisories_count}")
    print(f"Existing Open Issues: {result.existing_open_issues_count}")
    print(f"New Issues Created: {result.new_issues_created_count}")
    print(f"Remediated Issues Linked to PR: {result.remediated_linked_count}")
    print(f"Resolved Issues Closed: {result.issues_closed_count}")

    set_github_output("active_issues_count", result.active_advisories_count)
    set_github_output("new_issues_count", result.new_issues_created_count)
    set_github_output("closed_issues_count", result.issues_closed_count)
    set_github_output("remediated_linked_count", result.remediated_linked_count)

    summary_md = (
        "\n### 🛡️ Dependency & Security Issue Lifecycle\n"
        f"- **Active Unresolved Advisories**: `{result.active_advisories_count}`\n"
        f"- **New Issues Created**: `{result.new_issues_created_count}`\n"
        f"- **Remediated Issues Linked to PR**: `{result.remediated_linked_count}`\n"
        f"- **Resolved Issues Auto-Closed**: `{result.issues_closed_count}`\n"
    )
    append_step_summary(summary_md)

    return 0


if __name__ == "__main__":
    sys.exit(main())
