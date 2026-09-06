---
emoji: 📊
description: Daily repository activity report as a GitHub issue
intent: Publish a daily issue summarizing newly created issues, recently merged pull requests, and currently open blockers.
on:
  schedule:
    - cron: "5 0 * * *"
  workflow_dispatch:
permissions:
  contents: read
  issues: read
  pull-requests: read
strict: true
tools:
  github:
    mode: gh-proxy
    toolsets: [default]
safe-outputs:
  create-issue:
    title-prefix: "Daily Repository Activity:"
    labels: [report]
    close-older-issues: true
  mentions: false
  allowed-github-references: []
---

# Daily Repository Activity Report

## Task

Create a daily repository activity report issue for the last 24 full hours ending at workflow start (UTC).

Gather and summarize:

1. New issues created in the window.
2. Pull requests merged in the window.
3. Current open blockers (open issues or pull requests with blocker-style labels such as `blocker`, `blocked`, or `priority: critical`).

The report must:

- use concise `###` section headings
- include counts and key items for each section
- include "None" when a section has no items
- include a short `### Context` section with the evaluated UTC window and trigger type
- avoid raw logs and long dumps

Use `create-issue` to publish the report.
