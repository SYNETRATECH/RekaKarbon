from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any

from ..models import AuditReport, AuditStatus
from .base import NotificationChannel


class TelegramChannel(NotificationChannel):
    def __init__(
        self,
        bot_token: str | None = None,
        chat_id: str | None = None,
        thread_id: str | None = None,
    ):
        self.bot_token = (bot_token or "").strip()
        self.chat_id = (chat_id or "").strip()
        self.thread_id = (thread_id or "").strip()

    def is_configured(self) -> bool:
        return bool(self.bot_token and self.chat_id)

    def build_payload(self, report: AuditReport) -> dict[str, Any]:
        component_blocks = []
        for comp in report.components:
            component_blocks.append(
                f"{comp.name}:\n{comp.status.badge_html}\n<i>{comp.summary}</i>"
            )

        components_text = "\n\n".join(component_blocks)

        message = (
            f"<b>{report.overall_title}</b>\n\n"
            f"📂 <b>Repository:</b> <code>{report.repository}</code>\n"
            f"🌿 <b>Branch:</b> <code>{report.branch}</code>\n"
            f"🔗 <a href='{report.run_url}'>View Workflow Run</a>\n\n"
            f"{components_text}"
        )

        inline_keyboard = [[{"text": "🔍 View Workflow Run", "url": report.run_url}]]
        if report.overall_status.value == "issues_detected":
            action_row = [{"text": "🛠️ Run Auto-Fix", "url": report.autofix_url}]
            if any(
                "contract" in c.name.lower() and c.status == AuditStatus.ISSUES_DETECTED
                for c in report.components
            ):
                action_row.append({"text": "📋 Triage Issue", "url": report.new_issue_url})
            inline_keyboard.append(action_row)

        payload: dict[str, Any] = {
            "chat_id": self.chat_id,
            "text": message,
            "parse_mode": "HTML",
            "disable_web_page_preview": True,
            "reply_markup": {"inline_keyboard": inline_keyboard},
        }

        if self.thread_id:
            try:
                payload["message_thread_id"] = int(self.thread_id)
            except ValueError:
                print(
                    f"::warning::Invalid TELEGRAM_THREAD_ID '{self.thread_id}', proceeding without thread routing."
                )

        return payload

    def send(self, report: AuditReport, dry_run: bool = False) -> bool:
        if not self.is_configured():
            print(
                "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured. Skipping Telegram notification."
            )
            return True

        payload = self.build_payload(report)
        if dry_run:
            print("[DRY-RUN] Telegram Payload:")
            print(json.dumps(payload, indent=2))
            return True

        url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
        print("Sending notification to Telegram...")
        if "message_thread_id" in payload:
            print(f"Routing to Telegram topic/thread ID: {payload['message_thread_id']}")

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(req) as resp:
                print(f"Telegram notification delivered successfully (HTTP {resp.status}).")
                return True
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8") if e.fp else ""
            print(f"::error::Telegram API HTTPError {e.code}: {err_body}")
            return False
        except (urllib.error.URLError, OSError) as e:
            print(f"::error::Failed to deliver to Telegram: {e}")
            return False
