from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class AuditStatus(str, Enum):
    CLEAN = "clean"
    ISSUES_DETECTED = "issues_detected"
    WARNING = "warning"
    UNKNOWN = "unknown"

    @property
    def badge_text(self) -> str:
        if self == AuditStatus.CLEAN:
            return "✅ Clean"
        if self == AuditStatus.ISSUES_DETECTED:
            return "🚨 Vulnerabilities Found"
        return "⚠️ Incomplete / Failed"

    @property
    def badge_html(self) -> str:
        if self == AuditStatus.CLEAN:
            return "✅ <b>Clean</b>"
        if self == AuditStatus.ISSUES_DETECTED:
            return "🚨 <b>Vulnerabilities Found</b>"
        return "⚠️ <b>Incomplete / Failed</b>"

    @property
    def discord_color(self) -> int:
        if self == AuditStatus.CLEAN:
            return 3066993  # Green #2ECC71
        if self == AuditStatus.ISSUES_DETECTED:
            return 15158332  # Red #E74C3C
        return 16776960  # Yellow #F1C40F


@dataclass
class ComponentReport:
    name: str
    status: AuditStatus
    summary: str


@dataclass
class AuditReport:
    title: str
    repository: str
    branch: str
    run_url: str
    run_id: str
    components: list[ComponentReport] = field(default_factory=list)

    @property
    def overall_status(self) -> AuditStatus:
        if any(c.status == AuditStatus.ISSUES_DETECTED for c in self.components):
            return AuditStatus.ISSUES_DETECTED
        if any(c.status in (AuditStatus.WARNING, AuditStatus.UNKNOWN) for c in self.components):
            return AuditStatus.WARNING
        return AuditStatus.CLEAN

    @property
    def overall_title(self) -> str:
        status = self.overall_status
        if status == AuditStatus.CLEAN:
            return "🛡️ Security Audit Passed - All Clean"
        if status == AuditStatus.ISSUES_DETECTED:
            return "🚨 Security Audit Warning - Issues Detected"
        return "⚠️ Security Audit Incomplete / Job Error"
