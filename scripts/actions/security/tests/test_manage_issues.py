#!/usr/bin/env python3
"""Unit tests for RekaKarbon security issue lifecycle manager."""

import sys
import unittest
from pathlib import Path

# Add scripts directory to sys.path
SCRIPTS_DIR = Path(__file__).resolve().parent.parent
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from manage_issues import (  # noqa: E402
    GitHubIssue,
    VulnerabilityAdvisory,
    format_issue_body,
    format_issue_title,
    normalize_advisory_id,
    parse_pip_audit_json,
    parse_pnpm_audit_json,
    parse_slither_text,
    sync_security_issues,
)


class TestManageIssues(unittest.TestCase):
    def test_normalize_advisory_id(self):
        self.assertEqual(normalize_advisory_id("ghsa-cph5-m8f7-6c5x"), "GHSA-CPH5-M8F7-6C5X")
        self.assertEqual(normalize_advisory_id("cve-2024-37891"), "CVE-2024-37891")
        self.assertEqual(normalize_advisory_id("pysec-2023-1234"), "PYSEC-2023-1234")
        self.assertEqual(normalize_advisory_id("arbitrary-id"), "ARBITRARY-ID")

    def test_parse_pnpm_audit_json(self):
        mock_pnpm = {
            "vulnerabilities": {
                "axios": {
                    "name": "axios",
                    "severity": "high",
                    "range": "<1.7.4",
                    "nodes": ["node_modules/axios"],
                    "via": [
                        {
                            "source": 1098234,
                            "name": "axios",
                            "title": "Axios Cross-Site Request Forgery",
                            "url": "https://github.com/advisories/GHSA-8hc4-vh64-cxmj",
                            "severity": "high",
                            "cwe": ["CWE-352"],
                            "cvss": {
                                "score": 7.5,
                                "vectorString": "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:N/A:N",
                            },
                            "range": "<1.7.4",
                        }
                    ],
                }
            }
        }
        advisories = parse_pnpm_audit_json(mock_pnpm)
        self.assertEqual(len(advisories), 1)
        adv = advisories[0]
        self.assertEqual(adv.ecosystem, "Node")
        self.assertEqual(adv.package_name, "axios")
        self.assertEqual(adv.advisory_id, "GHSA-8HC4-VH64-CXMJ")
        self.assertEqual(adv.severity, "HIGH")
        self.assertIn("Cross-Site Request Forgery", adv.title)
        self.assertIn("CWE-352", adv.cwe)

    def test_parse_pip_audit_json(self):
        mock_pip = {
            "dependencies": [
                {
                    "name": "urllib3",
                    "version": "1.26.17",
                    "vulns": [
                        {
                            "id": "GHSA-34jh-p97f-mpxf",
                            "fix_versions": ["1.26.18", "2.0.7"],
                            "description": "Cookie leak in urllib3 via redirect",
                            "aliases": ["CVE-2023-43804"],
                        }
                    ],
                },
                {"name": "numpy", "version": "1.26.4", "vulns": []},
            ]
        }
        advisories = parse_pip_audit_json(mock_pip)
        self.assertEqual(len(advisories), 1)
        adv = advisories[0]
        self.assertEqual(adv.ecosystem, "Python")
        self.assertEqual(adv.package_name, "urllib3")
        self.assertEqual(adv.advisory_id, "GHSA-34JH-P97F-MPXF")
        self.assertIn("Fix: 1.26.18, 2.0.7", adv.vulnerable_versions)

    def test_parse_slither_text(self):
        sample_slither = (
            "RekaKarbonToken.transfer(address,uint256) (contracts/RekaKarbonToken.sol#45-50) "
            "uses timestamp for comparisons (arbitrary-send-eth)\n"
            "0 result(s) found in other contracts\n"
        )
        advisories = parse_slither_text(sample_slither)
        self.assertEqual(len(advisories), 1)
        self.assertEqual(advisories[0].ecosystem, "Solidity")
        self.assertEqual(advisories[0].advisory_id, "SLITHER-ARBITRARY-SEND-ETH")

    def test_format_issue_title_and_body(self):
        adv = VulnerabilityAdvisory(
            ecosystem="Node",
            package_name="lodash",
            advisory_id="GHSA-35JH-P97F-MPXF",
            severity="CRITICAL",
            title="Prototype pollution in lodash",
            vulnerable_versions="<4.17.21",
            url="https://github.com/advisories/GHSA-35JH-P97F-MPXF",
            cvss_score="9.8",
            cwe=["CWE-1321"],
            dependency_chain=["client > lodash"],
        )
        title = format_issue_title(adv)
        self.assertEqual(title, "[Security Advisory] [Node] lodash (GHSA-35JH-P97F-MPXF)")

        body = format_issue_body(adv, run_id="999", repo="FarrelAD/RekaKarbon")
        self.assertIn("## 🛡️ Security Vulnerability in `lodash` (Node)", body)
        self.assertIn("`CRITICAL`", body)
        self.assertIn("GHSA-35JH-P97F-MPXF", body)
        self.assertIn("client > lodash", body)
        self.assertIn("actions/runs/999", body)

    def test_sync_security_issues_lifecycle(self):
        active_findings = [
            VulnerabilityAdvisory(
                ecosystem="Node",
                package_name="axios",
                advisory_id="GHSA-8HC4-VH64-CXMJ",
                severity="HIGH",
                title="Axios CSRF",
            ),
            VulnerabilityAdvisory(
                ecosystem="Python",
                package_name="urllib3",
                advisory_id="GHSA-34JH-P97F-MPXF",
                severity="HIGH",
                title="Cookie leak",
            ),
        ]

        # Scenario:
        # - axios is already open (#10) -> Should NOT create duplicate
        # - old-pkg was open (#5) but is no longer in active_findings -> Should AUTO-CLOSE
        # - urllib3 is new -> Should CREATE issue
        existing_issues = [
            GitHubIssue(
                number=10,
                title="[Security Advisory] [Node] axios (GHSA-8HC4-VH64-CXMJ)",
                state="open",
            ),
            GitHubIssue(
                number=5,
                title="[Security Advisory] [Node] old-pkg (GHSA-XXXX-YYYY-ZZZZ)",
                state="open",
            ),
        ]

        created_titles: list[str] = []
        closed_numbers: list[int] = []

        def mock_create(title: str, body: str) -> int:
            created_titles.append(title)
            return 99

        def mock_close(num: int, comment: str) -> bool:
            closed_numbers.append(num)
            return True

        result = sync_security_issues(
            findings=active_findings,
            existing_issues=existing_issues,
            repo="FarrelAD/RekaKarbon",
            run_id="123",
            dry_run=False,
            create_fn=mock_create,
            close_fn=mock_close,
        )

        self.assertEqual(result.active_advisories_count, 2)
        self.assertEqual(result.existing_open_issues_count, 2)
        self.assertEqual(result.new_issues_created_count, 1)
        self.assertEqual(result.issues_closed_count, 1)

        self.assertEqual(closed_numbers, [5])
        self.assertEqual(len(created_titles), 1)
        self.assertIn("urllib3", created_titles[0])


if __name__ == "__main__":
    unittest.main()
