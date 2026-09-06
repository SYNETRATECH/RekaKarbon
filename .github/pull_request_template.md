## 📝 Description

<!-- Provide a summary of the changes, context, and motivation. -->

Fixes #(issue) <!-- or Closes # -->

---

## 🏷️ Type of Change

<!-- Please select the relevant options. -->

- [ ] 🚀 New feature (non-breaking change which adds functionality)
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] 💥 Breaking change (fix or feature that causes existing functionality/contracts to break)
- [ ] ♻️ Refactor / Performance (code restructuring or optimization without functional change)
- [ ] 🧪 Testing (adding or updating unit, integration, contract, or architecture tests)
- [ ] 📝 Documentation & Governance (README, AGENTS.md, guides, or API specifications)
- [ ] 🔧 CI/CD & Tooling (workflows, dependencies, husky hooks, or build configurations)

---

## 📦 Components Affected

- [ ] 🎨 Client / Frontend (`client/`)
- [ ] ⚙️ Server / Backend (`server/`)
- [ ] 🗄️ Database & Prisma Schema (`server/prisma/`)
- [ ] 📐 API Contracts (`client/src/schemas/`, `server/test/contracts/`)
- [ ] ⛓️ Blockchain & Smart Contracts (`blockchain/`)
- [ ] 🧠 Machine Learning Engine (`ml/`)
- [ ] 🤖 Agent Governance & Skills (`AGENTS.md`, `.agents/skills/`, `.github/skills/`)
- [ ] 🚀 CI/CD & Monorepo Tooling (`.github/workflows/`, root configs)

---

## 🧪 Verification & Testing

<!-- Check the relevant automated tests and verification steps you ran locally. -->

### Code Formatting

- [ ] `pnpm format:check` passes (Prettier)
- [ ] `pnpm ml:format:check` passes (Ruff, if `ml/` modified)

### Client (`client/`)

- [ ] `pnpm client:lint` passes (oxlint)
- [ ] `pnpm client:typecheck` passes
- [ ] `pnpm client:test` passes (vitest unit + `test:arch` dependency cruiser)
- [ ] `pnpm client:build` passes

### Server & Database (`server/`)

- [ ] `pnpm server:lint` passes (eslint)
- [ ] `pnpm server:typecheck` passes
- [ ] `pnpm server:test` passes (jest)
- [ ] `pnpm server:build` passes

### API Contracts

- [ ] `pnpm test:contracts` passes (validates client Zod schemas against NestJS controllers)

### Blockchain (`blockchain/`)

- [ ] `pnpm blockchain:typecheck` passes
- [ ] `pnpm blockchain:compile` passes
- [ ] `pnpm blockchain:test` passes

### Machine Learning (`ml/`)

- [ ] `pnpm ml:lint` passes (ruff)
- [ ] `pnpm ml:typecheck` passes (mypy)
- [ ] `pnpm ml:test` passes (pytest + ONNX parity)

### Monorepo Typecheck

- [ ] `pnpm typecheck` passes

### Manual Verification

- [ ] Tested locally with dev servers (`pnpm dev`)
- [ ] Tested with mock data (`VITE_USE_MOCK_DATA=true`) and live backend (`VITE_USE_MOCK_DATA=false`) if applicable
- [ ] Attached UI screenshots / screen recording below (if UI changes made)

---

## ✅ Quality & Governance Checklist

- [ ] My code follows the monorepo naming & typing standards ([CONTRIBUTING.md](../CONTRIBUTING.md) & [AGENTS.md](../AGENTS.md)).
- [ ] **Type Centralization**: All client types/interfaces are declared in `client/src/types/` (no inline types in mocks or views).
- [ ] **Repository Pattern**: Client views access data strictly via store -> repository (no direct imports of `lib/mock` in components).
- [ ] **Data Formatting**: Domain models use raw numeric values and ISO dates; UI formatters (`formatCurrency`, `formatCarbon`, etc.) are used exclusively at render time.
- [ ] **Database Migrations**: Backward-compatible, safe, and foreign keys are indexed (if `server/prisma/` modified).
- [ ] **Smart Contracts**: Clean compilation without high-severity compiler warnings (if `blockchain/` modified).
- [ ] **ML Parity**: ONNX runtime output verified against PyTorch baseline (if `ml/` modified).
- [ ] I have performed a self-review of my own code.
- [ ] No secrets, credentials, API keys, or `.env` files are included.
- [ ] My commit history is clean and rebased on the latest `main` branch.

---

## 🏷️ PR Title Convention

The PR title MUST follow conventional commits: `<type>(<scope>): <short description>`, e.g.:

- `feat(client): add carbon credit retirement confirmation modal`
- `fix(server): handle concurrent order book settlement deadlock`
- `feat(blockchain): implement ERC-3643 compliant permissioned token`
- `refactor(ml): optimize ONNX feature extraction pipeline`
- `test(contracts): add schema verification for forestry project registry`
- `docs: update agent governance for spatial data processing`
