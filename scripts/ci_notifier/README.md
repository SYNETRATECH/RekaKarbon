# RekaKarbon CI Notifier

A lightweight, zero-external-dependency Python package designed for GitHub Actions and CI/CD pipelines to aggregate and dispatch status reports to **Discord** and **Telegram** (including Telegram forum supergroup topics).

## Features

- **Zero External Dependencies**: Uses Python 3 standard library (`urllib.request`, `json`, `dataclasses`).
- **Discord Rich Embeds**: Automatic color coding (🟢 Clean `#2ECC71`, 🚨 Vulnerabilities Found `#E74C3C`, ⚠️ Warning `#F1C40F`).
- **Telegram Topic Support**: Native `message_thread_id` support for Telegram supergroup forum topics.
- **Fail-Safe**: Skips absent secrets without failing CI, with optional `--dry-run` for local testing.

## CLI Usage

```bash
# Dry run printing payloads
python -m ci_notifier.cli --dry-run

# Run against configured environment variables
python -m ci_notifier.cli
```
