# Agent Governance Guide - RekaKarbon Monorepo

This document defines essential rules and high-level architecture guidelines that all AI Agents MUST follow across the RekaKarbon repository.

---

## 🧭 Sub-Project Governance Guides

For specific sub-project guidelines, agents MUST read and follow the dedicated governance documents:

- 🎨 **Frontend / Client (`client/`)**: See [client/AGENTS.md](client/AGENTS.md) for React, Tailwind CSS v4, Zustand, shadcn/ui, and repository pattern standards. Refer to [client/DESIGN.md](client/DESIGN.md) for the "Ecological Precision" design system tokens, typography, and layout rules. For human overview, see [client/README.md](client/README.md).
- ⚙️ **Backend / Server (`server/`)**: See [server/AGENTS.md](server/AGENTS.md) for server architecture, API envelope rules, database migrations, and backend standards. For human overview, see [server/README.md](server/README.md).
- ⛓️ **Blockchain / Smart Contracts (`blockchain/`)**: See [blockchain/AGENTS.md](blockchain/AGENTS.md) for smart contract development, Besu QBFT network configuration, and EVM standards. For human overview, see [blockchain/README.md](blockchain/README.md).
- 🌿 **Machine Learning / AI (`ml/`)**: See [ml/AGENTS.md](ml/AGENTS.md) for MLOps lifecycle, Pydantic schemas, ONNX parity, and model quality gates. For scientific & technical methodology, see [ml/README.md](ml/README.md).
- 📐 **API Design & Specification**: See [.agents/skills/api-design-standards/SKILL.md](.agents/skills/api-design-standards/SKILL.md) and [api-design-guideline.md](api-design-guideline.md) for REST API conventions, JSON representations, and client-server contract standards.

---

## 📝 Monorepo Naming & Typing Standards

1. **Variables & Functions**: MUST use `camelCase` (e.g., `calculateGeodetics()`, `getProjectDetails()`).
2. **React Components & Classes**: MUST use `PascalCase` (e.g., `CarbonDexMarket`, `RightDrawer`).
3. **TypeScript Types & Interfaces**: MUST use `PascalCase` and be stored centrally in target package types directory (`client/src/types/` or `server/src/types/`).
4. **Global Constants & Mock Fixtures**: MUST use `UPPER_SNAKE_CASE` (e.g., `MOCK_BURSA_ITEMS`, `VITE_USE_MOCK_DATA`).

---

## ✅ Code Quality & CI/CD Checks (PR Verification)

Every Pull Request to `main` is verified by [.github/workflows/pr-check.yml](.github/workflows/pr-check.yml) with path-filtered checks (Markdown/docs skip heavy jobs, subprojects run in parallel when modified). Ensure relevant checks pass locally before opening a PR:

- **Format**: `pnpm format:check` (Prettier) & `pnpm ml:format:check` / `pnpm notifier:format:check` (Ruff).
- **Typecheck**: `pnpm client:typecheck`, `pnpm server:typecheck`, `pnpm blockchain:typecheck`, `pnpm ml:typecheck` (or monorepo `pnpm typecheck`).
- **Lint**: `pnpm client:lint` (oxlint), `pnpm server:lint` (eslint), `pnpm ml:lint` / `pnpm notifier:lint` (ruff), or `pnpm py:lint`.
- **Test**: `pnpm client:test` (vitest unit + dependency-cruiser `test:arch`), `pnpm server:test` (jest), `pnpm blockchain:test` (hardhat), `pnpm ml:test` (pytest + ONNX parity), & `pnpm notifier:test` (unittest).
- **API Contracts**: `pnpm test:contracts` (validates client Zod schemas against NestJS controllers and client-side envelope parsing).
- **Build**: `pnpm client:build`, `pnpm server:build`, `pnpm blockchain:compile`.
