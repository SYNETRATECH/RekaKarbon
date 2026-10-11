# Contributing to RekaKarbon Monorepo

Welcome to the **RekaKarbon** repository! We are excited to collaborate with open-source contributors, institutional partners, and autonomous AI agents to build Indonesia's high-integrity digital carbon MRV and compliance trading platform.

This guide defines the end-to-end development standards, git workflows, architectural boundaries, and quality gates expected from every contributor.

---

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [Questions & Support](#-questions--support)
- [Reporting Issues](#-reporting-issues)
  - [Submitting a Bug Report](#submitting-a-bug-report)
  - [Proposing a Feature](#proposing-a-feature)
  - [Security Vulnerabilities](#security-vulnerabilities)
- [Pull Request (PR) Workflow](#-pull-request-pr-workflow)
- [Monorepo Development Setup](#-monorepo-development-setup)
  - [Prerequisites](#prerequisites)
  - [Dependency Installation](#dependency-installation)
  - [Running the Applications Locally](#running-the-applications-locally)
  - [Environment Variables & Zero Secrets](#environment-variables--zero-secrets)
  - [Database Management (Prisma ORM)](#database-management-prisma-orm)
  - [Smart Contracts & Blockchain (Hardhat)](#smart-contracts--blockchain-hardhat)
  - [Machine Learning Runtime (Poetry & ONNX)](#machine-learning-runtime-poetry--onnx)
- [Sub-Project Architecture & Coding Standards](#-sub-project-architecture--coding-standards)
  - [1. Frontend / Client (`client/`)](#1-frontend--client-client)
  - [2. Backend / Server (`server/`)](#2-backend--server-server)
  - [3. Blockchain / Smart Contracts (`blockchain/`)](#3-blockchain--smart-contracts-blockchain)
  - [4. Machine Learning & AI (`ml/`)](#4-machine-learning--ai-ml)
- [🤖 AI Agent Contribution Protocol](#-ai-agent-contribution-protocol)
- [Branch Naming Conventions](#-branch-naming-conventions)
- [Commit Message Guidelines](#-commit-message-guidelines)
- [Quality Gates & PR Verification Matrix](#-quality-gates--pr-verification-matrix)
- [Additional Resources](#-additional-resources)

---

## 🤝 Code of Conduct

Help us foster a respectful, inclusive, and professional environment. All participants are required to follow our [Code of Conduct](./CODE_OF_CONDUCT.md).

---

## 💬 Questions & Support

Please **do not open GitHub issues for general support or architectural questions**.

- First consult the documentation: [AGENTS.md](./AGENTS.md), [README.md](./README.md), and [docs/](./docs/).
- For design system and token questions, see [client/DESIGN.md](client/DESIGN.md).
- For community support and discussion, use [GitHub Discussions](https://github.com/SYNETRATECH/RekaKarbon/discussions).

---

## 🐛 Reporting Issues

### Submitting a Bug Report

Before opening an issue, check the [issue tracker](https://github.com/SYNETRATECH/RekaKarbon/issues) to avoid duplicate reports.

When filing a bug, use the [Bug Report Form](.github/ISSUE_TEMPLATE/bug_report.yml) and specify:

1. **Affected Subproject**: `client`, `server`, `server/prisma`, `blockchain`, `ml`, `gis`, or `ci-cd`.
2. **Clear Description**: Summary of the defect and context.
3. **Step-by-step Reproduction**: Minimal steps to trigger the bug.
4. **Expected vs Actual Behavior**.
5. **Environment Details**: OS, Node version, Docker version, browser, and feature flags (`VITE_USE_MOCK_DATA`).
6. **Logs & Stack Traces**.

### Proposing a Feature

If you would like to request or build a new feature, use the [Feature Request Form](.github/ISSUE_TEMPLATE/feature_request.yml):

- For **major features** (e.g. new blockchain contracts, ML audit architectures, or regulatory portal flows), open an issue proposal first to coordinate design decisions before writing code.
- For **small improvements**, you may directly submit a Pull Request.

### Security Vulnerabilities

**NEVER report security vulnerabilities via public GitHub issues.** Follow our [Security Policy](./SECURITY.md) and report concerns directly to maintainers via [security@rekakarbon.id](mailto:security@rekakarbon.id).

---

## 🚀 Pull Request (PR) Workflow

1. **Fork & Branch**: Fork the repository (or create a branch on origin if you are a team member).
2. **Create a Topic Branch**: Use our standard [Branch Naming](#-branch-naming-conventions):
   ```bash
   git checkout -b feat/client/carbon-wallet-redesign main
   ```
3. **Develop & Verify**: Implement your changes and write automated tests. Run local verification for modified subprojects (see [Quality Gates](#-quality-gates--pr-verification-matrix)).
4. **Git Hygiene**: Keep commits atomic and informative. Follow [Commit Message Guidelines](#-commit-message-guidelines).
5. **Push & Open PR**: Push to GitHub and open a PR against `main`. Fill out the [Pull Request Template](.github/pull_request_template.md).
6. **Code Review & Rebase**: If changes are requested, apply them, re-run verification, and rebase on `main`:
   ```bash
   git fetch origin main
   git rebase origin/main
   git push --force-with-lease
   ```

---

## 🛠️ Monorepo Development Setup

RekaKarbon is an orchestrated polyglot monorepo:

- **TypeScript Workspaces** (`client/`, `server/`, `blockchain/`) managed by **pnpm workspaces**.
- **Python ML Engine & Notifiers** (`ml/`, `scripts/actions/ci_notifier/`) managed by **Poetry**.
- **Hyperledger Besu QBFT** private blockchain network and local Docker infrastructure.

### Prerequisites

| Tool                 | Recommended Version                            | Purpose                                 |
| :------------------- | :--------------------------------------------- | :-------------------------------------- |
| **Node.js**          | `>= 24.15.0` (see [`.nvmrc`](.nvmrc))          | JavaScript runtime                      |
| **pnpm**             | `11.22.0` (`packageManager` in `package.json`) | Monorepo package manager                |
| **Python**           | `>= 3.12`                                      | Machine learning engine & scripts       |
| **Poetry**           | `>= 1.8.0`                                     | Python dependency & virtualenv manager  |
| **Docker & Compose** | Recent version                                 | Local PostgreSQL, MinIO, and Besu nodes |

### Dependency Installation

```bash
# 1. Install Node.js dependencies across all workspaces
pnpm install

# 2. Install Python ML dependencies in ml/
poetry --directory ./ml install
```

### Running the Applications Locally

```bash
# Start both Backend (NestJS) and Frontend (Vite) concurrently
pnpm dev

# Or run individual subprojects:
pnpm server:dev      # NestJS backend on http://localhost:3000
pnpm client:dev      # React Router frontend on http://localhost:5173
```

### Environment Variables & Zero Secrets

- Every subproject provides a `.env.example` template:
  - `client/.env.example` (`VITE_USE_MOCK_DATA=true`)
  - `server/.env.example` (`DATABASE_URL`, `JWT_SECRET`, `RPC_URL`, `MINIO_*`)
  - `blockchain/.env.example` (`BESU_RPC_URL`, `PRIVATE_KEY`)
  - `ml/.env.example`
- Copy `.env.example` to `.env` in the target directory and populate local values.
- **ZERO SECRET LEAKS**: Never commit private keys, mnemonics, passwords, or `.env` files. Monorepo CI automatically blocks commits containing cryptographic secrets.

### Database Management (Prisma ORM)

Database schemas are strictly managed through Prisma ORM migrations:

```bash
pnpm db:generate       # Generate Prisma Client
pnpm db:migrate        # Apply pending database migrations in development
pnpm db:seed           # Seed database with initial roles & test datasets
pnpm db:studio         # Open Prisma Studio visual web editor
```

### Smart Contracts & Blockchain (Hardhat)

```bash
pnpm blockchain:compile    # Compile Solidity contracts via Hardhat
pnpm blockchain:test       # Run Hardhat smart contract test suite
pnpm blockchain:typecheck  # Validate TypeChain bindings
```

### Machine Learning Runtime (Poetry & ONNX)

```bash
pnpm ml:lint           # Lint Python code with Ruff
pnpm ml:typecheck      # Type check Python models with MyPy
pnpm ml:test           # Run Pytest suite & ONNX mathematical parity checks
```

---

## 🏛️ Sub-Project Architecture & Coding Standards

### 1. Frontend / Client (`client/`)

- **Stack**: React 19, React Router v7 (SSR), Zustand, Tailwind CSS v4.
- **Governance**: Follow [client/AGENTS.md](client/AGENTS.md) and [client/DESIGN.md](client/DESIGN.md).
- **Design Tokens**: Adhere to the **Ecological Precision** design system (12-step gradient `.bg-primary-gradient`, solid primary `#033C2E`, Tech Mint `#00C48C`). Do NOT use deprecated hardcoded `#003E29`.
- **UI First (`shadcn/ui`)**: Prioritize `@/components/ui/` primitives and `@/components/layout/` containers. When adding components, use `pnpm dlx shadcn@latest add <component>`.
- **Repository Pattern**: View components (`routes/`, `components/`) must NEVER import `lib/mock` directly. Data must flow: `View` → `Zustand Store` → `Repository` → `Mock / API Client`. Enforced by `pnpm client:test` architecture tests.
- **Data Formatting**: Domain interfaces and mocks store raw numeric values and ISO dates. Formatting (`formatCurrency`, `formatCarbon`, `formatDate`) occurs dynamically at render time.
- **Geodetic Math**: Spatial area calculations must use `src/utils/geodetics.ts`.

### 2. Backend / Server (`server/`)

- **Stack**: NestJS 11+, TypeScript, Prisma ORM 7, PostgreSQL, MinIO S3 SDK.
- **Governance**: Follow [server/AGENTS.md](server/AGENTS.md).
- **API Envelope**: All REST endpoints must return standardized JSON envelopes:
  ```json
  {
    "success": true,
    "data": { ... },
    "meta": { "timestamp": "2026-02-14T08:00:00.000Z" }
  }
  ```
- **Security & RBAC**: Every endpoint must be protected with `JwtAuthGuard` and role-restricted using `RolesGuard` matching one of the 4 defined portals (`KTH`, `EMITTER`, `AUDITOR`, `REGULATOR`).
- **DTO Validation**: Incoming payloads must use `class-validator` and `class-transformer` with `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`.

### 3. Blockchain / Smart Contracts (`blockchain/`)

- **Stack**: Solidity `^0.8.24`, Hardhat, Hyperledger Besu QBFT, OpenZeppelin Contracts.
- **Governance**: Follow [blockchain/AGENTS.md](blockchain/AGENTS.md).
- **Smart Contract Invariants**:
  - Checks-Effects-Interactions (CEI) pattern is mandatory.
  - Reentrancy protection: Use `ReentrancyGuard` on state-modifying payable/transfer functions.
  - Role-based permissions: Use `AccessControl` (`onlyRole(DEFAULT_ADMIN_ROLE)`).
  - No floating pragmas: Lock Solidity compiler version strictly.

### 4. Machine Learning & AI (`ml/`)

- **Stack**: Python 3.12+, PyTorch / Scikit-learn, ONNX Runtime, Pydantic, Ruff.
- **Governance**: Follow [ml/AGENTS.md](ml/AGENTS.md).
- **ONNX Parity**: All exported ONNX audit models must achieve exact mathematical parity (`tolerance < 1e-5`) with PyTorch baselines.
- **Data Validation**: Model inference inputs and outputs must adhere strictly to Pydantic schemas.

---

## 🤖 AI Agent Contribution Protocol

Autonomous AI coding agents (Antigravity, Claude, Copilot, Cursor) collaborating on this codebase MUST follow these governance principles:

1. **Read Governance First**: Before proposing or modifying code, agents MUST read root [AGENTS.md](./AGENTS.md) and the affected subproject's agent guide (`client/AGENTS.md`, `server/AGENTS.md`, `blockchain/AGENTS.md`, `ml/AGENTS.md`).
2. **Consult Monorepo Skills**: Agents must leverage the specialized skills located in `.agents/skills/`:
   - [mock-repository-pattern](.agents/skills/mock-repository-pattern/SKILL.md)
   - [data-formatting-standards](.agents/skills/data-formatting-standards/SKILL.md)
   - [react-component-architecture](.agents/skills/react-component-architecture/SKILL.md)
   - [shadcn](.agents/skills/shadcn/SKILL.md)
   - [ui-ux-pro-max](.agents/skills/ui-ux-pro-max/SKILL.md)
   - [design-md](.agents/skills/design-md/SKILL.md)
   - [api-design-standards](.agents/skills/api-design-standards/SKILL.md)
3. **Mandatory Quality Gates**: Agents must execute local verification checks (`lint`, `typecheck`, `test`) on touched subprojects prior to claiming completion.
4. **Preserve Documentation Integrity**: Preserve comments, docstrings, and architectural invariants unless explicitly asked to modify them.
5. **Zero Secret Policy**: Agents must NEVER generate, hardcode, or log private keys, Besu keystores, passwords, or API tokens.

---

## 🌿 Branch Naming Conventions

All topic branches must use the following pattern:

```text
<type>/<scope>/<short-kebab-slug>
```

| Type        | Description                                | Example                               |
| :---------- | :----------------------------------------- | :------------------------------------ |
| `feat/`     | New features or functional additions       | `feat/client/carbon-wallet-modal`     |
| `fix/`      | Bug fixes and defect corrections           | `fix/server/order-book-deadlock`      |
| `refactor/` | Code refactoring without behavioral change | `refactor/blockchain/escrow-vault`    |
| `perf/`     | Performance optimizations                  | `perf/ml/onnx-feature-extractor`      |
| `docs/`     | Documentation, specs, and agent guides     | `docs/contributing-guidelines-update` |
| `test/`     | Adding or fixing test suites               | `test/server/contract-envelope-specs` |
| `ci/`       | GitHub Actions and developer tooling       | `ci/pr-check-path-filter-tune`        |

**Allowed Scopes**: `client`, `server`, `blockchain`, `ml`, `contracts`, `db`, `infra`, `docs`.

---

## 📝 Commit Message Guidelines

We enforce the **Conventional Commits** standard. Keeping git history clean enables automated changelog generation and PR traceability.

### Format

```text
<type>(<scope>): <subject>

[optional body explaining motivation and changes]

[optional footer(s), e.g. Closes #123 or BREAKING CHANGE: description]
```

### Types

- **`feat`**: New feature
- **`fix`**: Bug fix
- **`refactor`**: Code restructuring without functional change
- **`perf`**: Performance improvement
- **`docs`**: Documentation only
- **`test`**: Tests added or corrected
- **`chore`**: Maintenance, dependencies, or tooling
- **`build`**: Build system or package changes
- **`ci`**: CI/CD pipeline or action scripts
- **`revert`**: Reverting a previous commit

### Examples

```text
feat(client): implement two-step confirmation modal for carbon retirement

Closes #142
```

```text
fix(server): prevent double debit race condition during order settlement
```

```text
test(blockchain): add reentrancy attack test cases for carbon DEX contract
```

---

## ✅ Quality Gates & PR Verification Matrix

Every pull request to `main` is validated by automated CI checks ([.github/workflows/pr-check.yml](.github/workflows/pr-check.yml)). Verify the relevant checks locally before submitting:

| Verification Category | Target Subproject         | Local Command                                                           |
| :-------------------- | :------------------------ | :---------------------------------------------------------------------- |
| **Code Formatting**   | Monorepo (Prettier)       | `pnpm format:check` (or `pnpm format:write`)                            |
| **Python Formatting** | ML & Notifier (Ruff)      | `pnpm ml:format:check` / `pnpm notifier:format:check`                   |
| **Static Typecheck**  | Frontend Client           | `pnpm client:typecheck`                                                 |
|                       | Backend Server            | `pnpm server:typecheck`                                                 |
|                       | Smart Contracts           | `pnpm blockchain:typecheck`                                             |
|                       | Machine Learning          | `pnpm ml:typecheck`                                                     |
|                       | Entire Monorepo           | `pnpm typecheck`                                                        |
| **Linter Checks**     | Frontend (Oxlint)         | `pnpm client:lint`                                                      |
|                       | Backend (ESLint)          | `pnpm server:lint`                                                      |
|                       | Python (Ruff)             | `pnpm ml:lint` (or `pnpm py:lint`)                                      |
| **Automated Tests**   | Frontend (Vitest + Arch)  | `pnpm client:test`                                                      |
|                       | Backend (Jest)            | `pnpm server:test`                                                      |
|                       | Smart Contracts (Hardhat) | `pnpm blockchain:test`                                                  |
|                       | Machine Learning (Pytest) | `pnpm ml:test`                                                          |
| **API Contracts**     | Client & Server Schemas   | `pnpm test:contracts`                                                   |
| **Build Compilation** | Production Builds         | `pnpm client:build` && `pnpm server:build` && `pnpm blockchain:compile` |

---

## 🔗 Additional Resources

- **Root Agent Governance**: [AGENTS.md](./AGENTS.md)
- **Frontend Agent Guide**: [client/AGENTS.md](client/AGENTS.md) & [client/DESIGN.md](client/DESIGN.md)
- **Backend Agent Guide**: [server/AGENTS.md](server/AGENTS.md)
- **Blockchain Agent Guide**: [blockchain/AGENTS.md](blockchain/AGENTS.md)
- **Machine Learning Agent Guide**: [ml/AGENTS.md](ml/AGENTS.md)
- **Security Policy**: [SECURITY.md](./SECURITY.md)
- **Pull Request Template**: [.github/pull_request_template.md](.github/pull_request_template.md)
