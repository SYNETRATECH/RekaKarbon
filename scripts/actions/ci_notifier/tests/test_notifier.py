import sys
import unittest
from pathlib import Path

SRC_PATH = Path(__file__).resolve().parent.parent / "src"
if str(SRC_PATH) not in sys.path:
    sys.path.insert(0, str(SRC_PATH))

from ci_notifier.channels.discord import DiscordChannel  # noqa: E402
from ci_notifier.channels.telegram import TelegramChannel  # noqa: E402
from ci_notifier.models import AuditReport, AuditStatus, ComponentReport  # noqa: E402


class TestCINotifier(unittest.TestCase):
    def setUp(self):
        self.clean_report = AuditReport(
            title="Security Audit Report",
            repository="FarrelAD/RekaKarbon",
            branch="main",
            run_url="https://github.com/FarrelAD/RekaKarbon/actions/runs/123",
            run_id="123",
            components=[
                ComponentReport("Node", AuditStatus.CLEAN, "Zero vulnerabilities"),
                ComponentReport("Python", AuditStatus.CLEAN, "Zero vulnerabilities"),
                ComponentReport("Blockchain", AuditStatus.CLEAN, "Zero vulnerabilities"),
            ],
        )

        self.issues_report = AuditReport(
            title="Security Audit Report",
            repository="FarrelAD/RekaKarbon",
            branch="dev/backend",
            run_url="https://github.com/FarrelAD/RekaKarbon/actions/runs/456",
            run_id="456",
            components=[
                ComponentReport("Node", AuditStatus.ISSUES_DETECTED, "1 high vulnerability"),
                ComponentReport("Python", AuditStatus.CLEAN, "Zero vulnerabilities"),
                ComponentReport("Blockchain", AuditStatus.CLEAN, "Zero vulnerabilities"),
            ],
        )

    def test_overall_status(self):
        self.assertEqual(self.clean_report.overall_status, AuditStatus.CLEAN)
        self.assertEqual(self.clean_report.overall_status.discord_color, 3066993)

        self.assertEqual(self.issues_report.overall_status, AuditStatus.ISSUES_DETECTED)
        self.assertEqual(self.issues_report.overall_status.discord_color, 15158332)

    def test_discord_payload(self):
        channel = DiscordChannel(webhook_url="https://discord.com/api/webhooks/test/test")
        self.assertTrue(channel.is_configured())

        payload = channel.build_payload(self.issues_report)
        self.assertIn("embeds", payload)
        embed = payload["embeds"][0]
        self.assertEqual(embed["color"], 15158332)
        self.assertEqual(len(embed["fields"]), 3)
        self.assertIn("🚨 Vulnerabilities Found", embed["fields"][0]["value"])
        self.assertIn("One-Click Auto-Fix", embed["description"])

    def test_telegram_payload_with_thread(self):
        channel = TelegramChannel(
            bot_token="test_token",
            chat_id="-1004303358038",
            thread_id="3",
        )
        self.assertTrue(channel.is_configured())

        payload = channel.build_payload(self.clean_report)
        self.assertEqual(payload["chat_id"], "-1004303358038")
        self.assertEqual(payload["message_thread_id"], 3)
        self.assertIn("🛡️ Security Audit Passed - All Clean", payload["text"])
        self.assertIn("✅ <b>Clean</b>", payload["text"])
        self.assertIn("reply_markup", payload)
        self.assertEqual(len(payload["reply_markup"]["inline_keyboard"]), 1)

    def test_telegram_payload_with_issues(self):
        channel = TelegramChannel(
            bot_token="test_token",
            chat_id="-1004303358038",
        )
        payload = channel.build_payload(self.issues_report)
        self.assertIn("reply_markup", payload)
        keyboard = payload["reply_markup"]["inline_keyboard"]
        self.assertEqual(keyboard[1][0]["text"], "🛠️ Run Auto-Fix")
        self.assertIn("security-autofix.yml", keyboard[1][0]["url"])

    def test_telegram_payload_with_contract_issues(self):
        contract_issues_report = AuditReport(
            title="Security Audit Report",
            repository="FarrelAD/RekaKarbon",
            branch="main",
            run_url="https://github.com/FarrelAD/RekaKarbon/actions/runs/789",
            run_id="789",
            components=[
                ComponentReport(
                    "⛓️ Smart Contracts (Slither)",
                    AuditStatus.ISSUES_DETECTED,
                    "Reentrancy vulnerability",
                ),
            ],
        )
        channel = TelegramChannel(bot_token="test_token", chat_id="-1004303358038")
        payload = channel.build_payload(contract_issues_report)
        keyboard = payload["reply_markup"]["inline_keyboard"]
        self.assertEqual(len(keyboard), 2)
        self.assertEqual(len(keyboard[1]), 2)
        self.assertEqual(keyboard[1][0]["text"], "🛠️ Run Auto-Fix")
        self.assertEqual(keyboard[1][1]["text"], "📋 Triage Issue")
        self.assertIn("issues/new", keyboard[1][1]["url"])

    def test_unconfigured_channels(self):
        d = DiscordChannel(webhook_url="")
        self.assertFalse(d.is_configured())
        self.assertTrue(d.send(self.clean_report))  # gracefully returns True

        t = TelegramChannel(bot_token="", chat_id="")
        self.assertFalse(t.is_configured())
        self.assertTrue(t.send(self.clean_report))  # gracefully returns True


if __name__ == "__main__":
    unittest.main()
