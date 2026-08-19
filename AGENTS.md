# Agent Governance Guide - RekaKarbon Monorepo

This document defines essential rules and high-level architecture guidelines that all AI Agents MUST follow across the RekaKarbon repository.

---

## 🧭 Sub-Project Governance Guides

For specific sub-project guidelines, agents MUST read and follow the dedicated governance documents:

- 🎨 **Frontend / Client (`client/`)**: See [client/AGENTS.md](client/AGENTS.md) for React, Tailwind CSS v4, Zustand, shadcn/ui, and repository pattern standards.
- ⚙️ **Backend / Server (`server/`)**: See [server/AGENTS.md](server/AGENTS.md) for server architecture, API rules, database migration, and backend standards.
- ⛓️ **Blockchain / Smart Contracts (`blockchain/`)**: See [blockchain/AGENTS.md](blockchain/AGENTS.md) for smart contract development, Besu network configuration, and EVM standards.
- 📐 **API Design & Specification**: See [.agents/skills/api-design-standards/SKILL.md](.agents/skills/api-design-standards/SKILL.md) and [api-design-guideline.md](api-design-guideline.md) for REST API conventions, JSON representations, and client-server contract standards.

---

## 📝 Monorepo Naming & Typing Standards

1. **Variables & Functions**: MUST use `camelCase` (e.g., `calculateGeodetics()`, `getProjectDetails()`).
2. **React Components & Classes**: MUST use `PascalCase` (e.g., `CarbonDexMarket`, `RightDrawer`).
3. **TypeScript Types & Interfaces**: MUST use `PascalCase` and be stored centrally in target package types directory (`client/src/types/` or `server/src/types/`).
4. **Global Constants & Mock Fixtures**: MUST use `UPPER_SNAKE_CASE` (e.g., `MOCK_BURSA_ITEMS`, `VITE_USE_MOCK_DATA`).

---

## ✅ Code Quality & CI/CD Checks (PR Verification)

Every Pull Request to `main` is verified by [.github/workflows/pr-check.yml](.github/workflows/pr-check.yml). Ensure all checks pass locally before opening a PR:

- **Format**: `pnpm format:check` (runs Prettier).
- **Typecheck**: `pnpm client:typecheck` & `pnpm server:typecheck` (or `pnpm typecheck`).
- **Lint**: `pnpm client:lint` (oxlint) & `pnpm server:lint` (eslint).
- **Test**: `pnpm client:test` (vitest unit + dependency-cruiser `test:arch`) & `pnpm server:test` (jest).
- **Build**: `pnpm client:build` & `pnpm server:build`.
