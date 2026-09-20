from __future__ import annotations

import argparse
import os
import sys

from .channels.discord import DiscordChannel
from .channels.telegram import TelegramChannel
from .models import AuditReport, AuditStatus, ComponentReport


def parse_status(raw: str) -> AuditStatus:
    val = (raw or "").strip().lower()
    if val == "clean":
        return AuditStatus.CLEAN
    if val == "issues_detected":
        return AuditStatus.ISSUES_DETECTED
    if val == "warning":
        return AuditStatus.WARNING
    return AuditStatus.UNKNOWN


def build_report_from_env() -> AuditReport:
    repo = os.environ.get("GITHUB_REPOSITORY", "FarrelAD/RekaKarbon")
    ref = os.environ.get("GITHUB_REF_NAME", "main")
    run_id = os.environ.get("GITHUB_RUN_ID", "local")
    server_url = os.environ.get("GITHUB_SERVER_URL", "https://github.com")
    run_url = os.environ.get(
        "RUN_URL",
        f"{server_url}/{repo}/actions/runs/{run_id}" if run_id != "local" else f"{server_url}/{repo}",
    )

    node_status = parse_status(os.environ.get("NODE_STATUS", "unknown"))
    node_summary = os.environ.get("NODE_SUMMARY", "Node.js dependency audit status not provided.")

    py_status = parse_status(os.environ.get("PY_STATUS", "unknown"))
    py_summary = os.environ.get("PY_SUMMARY", "Python ML dependency audit status not provided.")

    bc_status = parse_status(os.environ.get("BC_STATUS", "unknown"))
    bc_summary = os.environ.get("BC_SUMMARY", "Blockchain smart contract audit status not provided.")

    components: list[ComponentReport] = [
        ComponentReport(
            name="📦 Node.js Dependencies (pnpm audit)",
            status=node_status,
            summary=node_summary,
        ),
        ComponentReport(
            name="🐍 Python ML Dependencies (pip-audit)",
            status=py_status,
            summary=py_summary,
        ),
        ComponentReport(
            name="⛓️ Smart Contracts (Slither)",
            status=bc_status,
            summary=bc_summary,
        ),
    ]

    report = AuditReport(
        title="Security Audit Report",
        repository=repo,
        branch=ref,
        run_url=run_url,
        run_id=run_id,
        components=components,
    )
    return report


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="RekaKarbon CI/CD Security Audit Notification Dispatcher"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print formatted payloads without sending network requests",
    )
    parser.add_argument(
        "--channel",
        choices=["all", "discord", "telegram"],
        default="all",
        help="Channel to dispatch to (default: all configured)",
    )

    args = parser.parse_args(argv)
    report = build_report_from_env()

    discord_webhook = os.environ.get("DISCORD_WEBHOOK_URL", "")
    telegram_token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    telegram_chat = os.environ.get("TELEGRAM_CHAT_ID", "")
    telegram_thread = os.environ.get("TELEGRAM_THREAD_ID", "")

    discord = DiscordChannel(webhook_url=discord_webhook)
    telegram = TelegramChannel(
        bot_token=telegram_token,
        chat_id=telegram_chat,
        thread_id=telegram_thread,
    )

    success = True

    if args.channel in ("all", "discord"):
        ok = discord.send(report, dry_run=args.dry_run)
        success = success and ok

    if args.channel in ("all", "telegram"):
        ok = telegram.send(report, dry_run=args.dry_run)
        success = success and ok

    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
