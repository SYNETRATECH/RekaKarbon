from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from scripts.actions.security.check_runtimes import (
    audit_node_runtime,
    audit_python_runtime,
    parse_semver,
    sync_node_version,
    sync_python_version,
)


class TestCheckRuntimes(unittest.TestCase):
    def test_parse_semver(self) -> None:
        self.assertEqual(parse_semver("24.15.0"), (24, 15, 0))
        self.assertEqual(parse_semver("v3.13.2"), (3, 13, 2))
        self.assertEqual(parse_semver(">=3.12"), (3, 12))
        self.assertEqual(parse_semver("3.13"), (3, 13))

    def test_audit_node_runtime_outdated(self) -> None:
        mock_eol = [
            {
                "cycle": "24",
                "latest": "24.22.1",
                "eol": "2028-04-30",
            }
        ]
        result = audit_node_runtime("24.15.0", mock_eol)
        self.assertIsNotNone(result)
        assert result is not None
        self.assertEqual(result["installed_version"], "24.15.0")
        self.assertEqual(result["latest_version"], "24.22.1")
        self.assertEqual(result["severity"], "MODERATE")
        self.assertIn("behind the latest security patch", result["title"])

    def test_audit_node_runtime_up_to_date(self) -> None:
        mock_eol = [
            {
                "cycle": "24",
                "latest": "24.22.1",
                "eol": "2028-04-30",
            }
        ]
        result = audit_node_runtime("24.22.1", mock_eol)
        self.assertIsNone(result)

    def test_audit_node_runtime_eol(self) -> None:
        mock_eol = [
            {
                "cycle": "18",
                "latest": "18.20.7",
                "eol": "2024-04-30",
            }
        ]
        result = audit_node_runtime("18.20.7", mock_eol)
        self.assertIsNotNone(result)
        assert result is not None
        self.assertEqual(result["severity"], "HIGH")
        self.assertTrue(result["is_eol"])

    def test_audit_python_runtime_up_to_date(self) -> None:
        mock_eol = [
            {
                "cycle": "3.13",
                "latest": "3.13.17",
                "eol": "2029-10-31",
            }
        ]
        result = audit_python_runtime("3.13", mock_eol)
        self.assertIsNone(result)

    def test_audit_python_runtime_outdated(self) -> None:
        mock_eol = [
            {
                "cycle": "3.13",
                "latest": "3.13.17",
                "eol": "2029-10-31",
            }
        ]
        result = audit_python_runtime("3.13.0", mock_eol)
        self.assertIsNotNone(result)
        assert result is not None
        self.assertEqual(result["severity"], "LOW")

    def test_sync_node_version(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)

            (tmp_path / ".nvmrc").write_text("24.15.0\n", encoding="utf-8")
            (tmp_path / "package.json").write_text(
                '{\n  "engines": {\n    "node": "24.15.0"\n  }\n}\n', encoding="utf-8"
            )

            server_dir = tmp_path / "server"
            server_dir.mkdir(parents=True)
            (server_dir / "Dockerfile").write_text(
                "FROM node:24.15.0-alpine AS base\nWORKDIR /app\n", encoding="utf-8"
            )

            wf_dir = tmp_path / ".github" / "workflows"
            wf_dir.mkdir(parents=True)
            (wf_dir / "test.yml").write_text(
                "steps:\n  - uses: actions/setup-node@v7\n    with:\n      node-version: 24.15.0\n",
                encoding="utf-8",
            )

            modified = sync_node_version("24.22.1", root_dir=tmp_path)
            self.assertEqual(len(modified), 4)

            self.assertEqual((tmp_path / ".nvmrc").read_text(encoding="utf-8").strip(), "24.22.1")
            self.assertIn(
                '"node": "24.22.1"', (tmp_path / "package.json").read_text(encoding="utf-8")
            )
            self.assertIn(
                "FROM node:24.22.1-alpine AS base",
                (server_dir / "Dockerfile").read_text(encoding="utf-8"),
            )
            self.assertIn(
                "node-version: 24.22.1", (wf_dir / "test.yml").read_text(encoding="utf-8")
            )

    def test_sync_python_version(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)

            ml_dir = tmp_path / "ml"
            ml_dir.mkdir(parents=True)
            (ml_dir / "pyproject.toml").write_text(
                '[tool.ruff]\ntarget-version = "py313"\n\n[tool.mypy]\npython_version = "3.13"\n',
                encoding="utf-8",
            )

            wf_dir = tmp_path / ".github" / "workflows"
            wf_dir.mkdir(parents=True)
            (wf_dir / "ci.yml").write_text(
                "steps:\n  - uses: actions/setup-python@v7\n    with:\n      python-version: '3.13'\n",
                encoding="utf-8",
            )

            modified = sync_python_version("3.14", root_dir=tmp_path)
            self.assertEqual(len(modified), 2)

            pyproject_content = (ml_dir / "pyproject.toml").read_text(encoding="utf-8")
            self.assertIn('target-version = "py314"', pyproject_content)
            self.assertIn('python_version = "3.14"', pyproject_content)
            self.assertIn("python-version: '3.14'", (wf_dir / "ci.yml").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
