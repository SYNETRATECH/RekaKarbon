from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from ..models import AuditReport


class NotificationChannel(ABC):
    @abstractmethod
    def is_configured(self) -> bool:
        """Check if required credentials/secrets are present."""

    @abstractmethod
    def build_payload(self, report: AuditReport) -> dict[str, Any]:
        """Format the report into channel-specific payload."""

    @abstractmethod
    def send(self, report: AuditReport, dry_run: bool = False) -> bool:
        """Deliver the payload to the channel."""
