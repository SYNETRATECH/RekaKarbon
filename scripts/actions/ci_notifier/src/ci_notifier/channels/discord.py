from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any

from ..models import AuditReport
from .base import NotificationChannel


class DiscordChannel(NotificationChannel):
    def __init__(self, webhook_url: str | None = None):
        self.webhook_url = (webhook_url or "").strip()

    def is_configured(self) -> bool:
        return bool(self.webhook_url)

    def build_payload(self, report: AuditReport) -> dict[str, Any]:
        overall_status = report.overall_status
        fields = []
        for comp in report.components:
            fields.append(
                {
                    "name": comp.name,
                    "value": f"{comp.status.badge_text}\n{comp.summary}",
                    "inline": False,
                }
            )

        description = (
            f"Workflow run: [#{report.run_id}]({report.run_url})\n"
            f"Repository: `{report.repository}`\n"
            f"Branch: `{report.branch}`"
        )
        if overall_status.value == "issues_detected":
            description += f"\n\n🛠️ **[One-Click Auto-Fix on GitHub Mobile]({report.autofix_url})**"
            if any(
                "contract" in c.name.lower() and c.status.value == "issues_detected"
                for c in report.components
            ):
                description += f" • 📋 **[Create Triage Issue]({report.new_issue_url})**"

        return {
            "username": "RekaKarbon Security Bot",
            "embeds": [
                {
                    "title": report.overall_title,
                    "url": report.run_url,
                    "color": overall_status.discord_color,
                    "description": description,
                    "fields": fields,
                    "footer": {"text": "RekaKarbon Security CI/CD • Automated Daily Audit"},
                }
            ],
        }

    def send(self, report: AuditReport, dry_run: bool = False) -> bool:
        if not self.is_configured():
            print("DISCORD_WEBHOOK_URL not configured. Skipping Discord notification.")
            return True

        payload = self.build_payload(report)
        if dry_run:
            print("[DRY-RUN] Discord Payload:")
            print(json.dumps(payload, indent=2))
            return True

        print("Sending notification to Discord...")
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            self.webhook_url,
            data=data,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "RekaKarbon-CI-Notifier",
            },
        )
        try:
            with urllib.request.urlopen(req) as resp:
                print(f"Discord notification delivered successfully (HTTP {resp.status}).")
                return True
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8") if e.fp else ""
            print(f"::error::Discord API HTTPError {e.code}: {err_body}")
            return False
        except (urllib.error.URLError, OSError) as e:
            print(f"::error::Failed to deliver to Discord: {e}")
            return False
