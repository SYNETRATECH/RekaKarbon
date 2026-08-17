# Contributing Guidelines - RekaKarbon Monorepo

Welcome to **RekaKarbon**! This guide outlines the development standards, code conventions, and workflows required when contributing to this repository.

---

## 🛠️ 1. Code Naming & Style Conventions

All code contributed to `@client` and `@server` must adhere to these standard conventions:

| Category                        | Standard Convention            | Example                                                         |
| ------------------------------- | ------------------------------ | --------------------------------------------------------------- |
| **Variables & Functions**       | `camelCase`                    | `forestProjects`, `calculateGeodetics()`, `getProjectDetails()` |
| **React Components**            | `PascalCase`                   | `CarbonDexMarket`, `ForestProjectsManagement`, `RightDrawer`    |
| **Types & Interfaces**          | `PascalCase` (in `src/types/`) | `Project`, `ForestProjectItem`, `AuthCredentials`               |
| **Global Constants & Fixtures** | `UPPER_SNAKE_CASE`             | `MOCK_BURSA_ITEMS`, `COMPANIES_DATA`, `VITE_USE_MOCK_DATA`      |
| **React Hooks**                 | `camelCase` (`use` prefix)     | `useCarbonStore`                                                |

### Type Centralization Standard

- **Location**: All domain interfaces and types MUST be declared inside [`client/src/types/`](client/src/types/) and re-exported via [`client/src/types/index.ts`](client/src/types/index.ts).
- **Prohibition**: Do NOT declare inline interface types inside mock data files (`src/lib/mock/*`) or view components (`src/portal/*`).

---

## 🏗️ 2. Repository Pattern Workflow

When creating or modifying data features, follow the mandatory 4-step architecture:

1. **Type Interface**: Define the data structure in `client/src/types/<feature>.ts`.
2. **Static Mock Data**: Create strongly-typed static fixtures in `client/src/lib/mock/<feature>.ts`.
3. **Repository Abstraction**: Implement `Mock...Repository` and `Api...Repository` in `client/src/repositories/<feature>.repository.ts`, toggled by `VITE_USE_MOCK_DATA`.
4. **Zustand Store Integration**: Consume repository calls asynchronously inside `client/src/store/useCarbonStore.ts`.

---

## ✅ 3. Local PR Verification & Quality Checks

Before submitting a Pull Request, verify that all local checks pass cleanly:

```bash
# Code Formatting (Prettier)
pnpm format:write

# TypeScript Typecheck
pnpm client:typecheck
pnpm server:typecheck

# Linter Verification
pnpm client:lint

# Automated Unit & Architecture Tests
pnpm client:test
pnpm server:test
```

### Architecture Restrictions

- Views (`src/components/`, `src/portal/`) are strictly forbidden from importing `src/lib/mock/*` directly. Access MUST go through `store` -> `repositories` -> `lib/mock`.

---

## 🔢 4. Data Formatting & Backend API Compatibility

To ensure seamless integration with strict backend APIs (PostgreSQL, REST, GraphQL), all data models and presentation layers must adhere to these standards:

### Data Model Rules (`client/src/types/` & `client/src/lib/mock/`)

- **Raw Numbers**: Monetary amounts, carbon tonnage, land areas, and file sizes MUST be stored as raw numeric values (e.g. `200000000`, `48200`, `2450`, `4718592`).
- **ISO 8601 Dates**: Dates MUST be stored as standard ISO strings (`YYYY-MM-DD` or ISO timestamp e.g. `"2026-02-14"`).
- **No Hardcoded UI Strings**: Do NOT store formatted strings like `"Rp 450 Juta"`, `"5.8 Miliar Ha"`, `"14 Jan 2026"` in domain interfaces or mock data fixtures.

### Centralized Presentation Formatters

Formatting MUST occur dynamically at component rendering time using leaf utilities:

| Format Category    | Utility Function        | Import Path                    | Output Example      |
| :----------------- | :---------------------- | :----------------------------- | :------------------ |
| **IDR Currency**   | `formatCurrency(val)`   | `client/src/lib/formatters.ts` | `Rp 200.000.000`    |
| **Carbon Tonnage** | `formatCarbon(val)`     | `client/src/lib/formatters.ts` | `48.200 tCO2e`      |
| **Land Area**      | `formatArea(val)`       | `client/src/lib/formatters.ts` | `2.450 ha`          |
| **Percentage**     | `formatPercent(val)`    | `client/src/lib/formatters.ts` | `96,4%`             |
| **File Size**      | `formatFileSize(bytes)` | `client/src/lib/formatters.ts` | `4,5 MB`            |
| **Date Display**   | `formatDate(date)`      | `client/src/lib/dates.ts`      | `14 Feb 2026`       |
| **Date & Time**    | `formatDateTime(date)`  | `client/src/lib/dates.ts`      | `14/02/2026 14:32`  |
| **Relative Time**  | `formatLastSeen(date)`  | `client/src/lib/dates.ts`      | `5 menit yang lalu` |
