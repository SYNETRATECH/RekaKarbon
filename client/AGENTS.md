# AGENTS.md - RekaKarbon Client (React App)

Frontend-specific agent guide for the `client/` directory. See root [AGENTS.md](../AGENTS.md) for monorepo-wide rules.

---

## 🛠️ Tech Stack & Commands

| Category      | Details                                            |
| ------------- | -------------------------------------------------- |
| **Framework** | React 19 + React Router v7 (SSR)                   |
| **Styling**   | Tailwind CSS v4 + CSS Variables (design tokens)    |
| **State**     | Zustand (`useCarbonStore.ts`)                      |
| **Language**  | TypeScript (strict)                                |
| **Testing**   | Vitest (unit + `test:arch` via dependency-cruiser) |
| **Linting**   | Oxlint (`.oxlintrc.json`)                          |
| **Build**     | Vite + React Router build                          |

### Package Scripts

```bash
pnpm dev          # Start dev server (Vite)
pnpm build        # Production build (react-router build)
pnpm lint         # Oxlint
pnpm typecheck    # tsc --noEmit
pnpm test         # Vitest run
pnpm test:watch   # Vitest watch mode
pnpm test:arch    # Architecture tests (dependency-cruiser)
pnpm preview      # Preview production build
```

---

## 📁 Project Structure (Key Paths)

```
client/
├── src/
│   ├── components/           # Shared UI components (ui/, RightDrawer, Modals, MapCanvas, etc.)
│   ├── portal/               # Role-based portal views
│   │   ├── layouts/          # PortalSidebar, PortalLayout
│   │   └── views/
│   │       ├── emitter/      # CarbonDexMarket, ComplianceDashboard, etc.
│   │       ├── auditor/      # SpatialMRVEvaluation, EmissionsAuditAI, etc.
│   │       ├── regulator/    # ForestProjectsManagement, EmitterKYBValidation, etc.
│   │       └── kth/          # LandPolygonMapping, DigitalWalletHybridLogs
│   ├── routes/               # React Router v7 routes (file-based)
│   │   ├── _index.tsx        # Landing page
│   │   ├── portal._index.tsx # Portal entry
│   │   ├── portal.$role.tsx  # Role layout
│   │   └── portal.$role.$tab.tsx # Tab views
│   ├── store/
│   │   └── useCarbonStore.ts # Central Zustand store (all state + actions)
│   ├── repositories/         # Repository Pattern (Mock + API implementations)
│   │   ├── *.repository.ts   # Interfaces + implementations per feature
│   │   └── index.ts          # Barrel export
│   ├── lib/
│   │   ├── mock/             # Mock data fixtures (typed with src/types)
│   │   ├── formatters.ts     # Currency, carbon, area, percent, file size
│   │   ├── dates.ts          # Date formatting (id-ID, Asia/Jakarta)
│   │   └── api.ts            # API client (when VITE_USE_MOCK_DATA=false)
│   ├── types/                # Centralized TypeScript types (PascalCase)
│   │   ├── *.ts              # Domain types per feature
│   │   ├── index.ts          # Barrel export
│   │   └── store.ts          # CarbonStoreState type
│   ├── utils/
│   │   └── geodetics.ts      # Spatial calculations (mandatory for map areas)
│   ├── styles/
│   │   └── index.css         # Tailwind v4 + CSS variables (design tokens)
│   ├── root.tsx              # App root (providers, global styles)
│   ├── routes.ts             # Route config
│   └── entry.client.tsx      # Client hydration entry
├── AGENTS/
│   └── rekakarbon-frontend-agent-spec.md  # Detailed design spec (colors, restrictions, wireframes)
├── package.json
├── vite.config.ts
├── tsconfig.json
├── react-router.config.ts
├── vitest.config.ts
└── .oxlintrc.json
```

---

## 🔑 Critical Patterns (Must Follow)

### 1. Data Flow: View → Store → Repository → Mock/API

```
components/portal/views/**/*.tsx
    │
    ▼ uses hooks
store/useCarbonStore.ts  ◄───── select state + actions
    │
    ▼ calls
repositories/*.repository.ts  ◄───── implements Repository Interface
    │
    ├── Mock...Repository  (VITE_USE_MOCK_DATA=true)
    └── Api...Repository   (VITE_USE_MOCK_DATA=false)
    │
    ▼ reads
lib/mock/*.ts              # Typed fixtures (source of truth for mock)
```

**NEVER** import `lib/mock` directly in components.

### 2. Naming Conventions

| Type                    | Convention         | Example                                  |
| ----------------------- | ------------------ | ---------------------------------------- |
| Variables/Functions     | `camelCase`        | `forestProjects`, `calculateGeodetics()` |
| React Components        | `PascalCase`       | `CarbonDexMarket`, `RightDrawer`         |
| Types/Interfaces        | `PascalCase`       | `ForestProjectItem`, `CarbonStoreState`  |
| Constants/Mock Fixtures | `UPPER_SNAKE_CASE` | `MOCK_BURSA_ITEMS`, `COMPANIES_DATA`     |

### 3. TypeScript Types

- **All types** in `src/types/` (barrel export via `src/types/index.ts`)
- **Never** define interfaces inline in mock files or components
- Mock data **must** be explicitly typed using types from `src/types`

### 4. Color & Theme (Tailwind v4 + CSS Variables)

| Token                       | Variable                                          | Usage                                       |
| --------------------------- | ------------------------------------------------- | ------------------------------------------- |
| Primary Gradient (12-step)  | `.bg-primary-gradient` / `.text-primary-gradient` | Backgrounds, title text                     |
| Primary Solid (text/border) | `var(--color-primary)` = `#033C2E`                | Text, borders                               |
| Tech Mint                   | `#00C48C`                                         | Verified indicators, accents                |
| Warning Red                 | `#EF4444`                                         | Over-quota, non-compliant, critical actions |
| Warning Orange              | `#F59E0B`                                         | Pending, low supply, irreversible warnings  |
| Background                  | `#F8FAFC` (`bg-slate-50`)                         | Page canvas                                 |
| Card/White                  | `#FFFFFF` (`bg-white`)                            | Cards, containers                           |

**Do NOT use** hardcoded `#003E29` — use gradient utilities or CSS variable.

### 5. Data Formatting (Raw → UI)

| Raw Type            | Formatter                           | Output Example   |
| ------------------- | ----------------------------------- | ---------------- |
| `number` (IDR)      | `formatCurrency()`                  | `Rp 200.000.000` |
| `number` (tCO2e)    | `formatCarbon()`                    | `48.200 tCO2e`   |
| `number` (hectares) | `formatArea()`                      | `2.450 ha`       |
| `number` (percent)  | `formatPercent()`                   | `96,4%`          |
| `number` (bytes)    | `formatFileSize()`                  | `2,45 MB`        |
| ISO 8601 date       | `formatDate()` / `formatLongDate()` | `14 Jan 2026`    |

**Rule**: Store raw numbers + ISO dates in types/mock. Format **only** in UI components via `lib/formatters.ts` and `lib/dates.ts`.

### 6. Geodetic Calculations

All spatial area calculations **must** use `src/utils/geodetics.ts` functions. No custom math.

### 7. Error Prevention (High-Risk Actions)

Buttons for burning/offset, audit modifications, deletions:

- Use warning colors (red/orange)
- Require confirmation modal/dialog
- Disable until explicit confirmation

---

## 🧪 Testing & Quality Gates

### Run Locally Before PR

```bash
pnpm format:check        # Root: prettier check (non-blocking in CI)
pnpm client:typecheck    # TypeScript strict
pnpm client:lint         # Oxlint
pnpm client:test         # Vitest (unit + arch)
pnpm client:build        # Production build
```

### Architecture Test (`test:arch`)

Enforces: **View layer cannot import `lib/mock` directly**. Data must flow through `store` → `repository`.

---

## 🌐 Environment Variables

| Variable             | Description                                            |
| -------------------- | ------------------------------------------------------ |
| `VITE_USE_MOCK_DATA` | `true` = Mock repositories, `false` = API repositories |

---

## 🔗 Key References

- Root monorepo rules: [../AGENTS.md](../AGENTS.md)
- Frontend design spec: [AGENTS/rekakarbon-frontend-agent-spec.md](AGENTS/rekakarbon-frontend-agent-spec.md)
- Mock/Repository Pattern Skill: [.agents/skills/mock-repository-pattern/SKILL.md](../.agents/skills/mock-repository-pattern/SKILL.md)
- Data Formatting Skill: [.agents/skills/data-formatting-standards/SKILL.md](../.agents/skills/data-formatting-standards/SKILL.md)
- React Component Architecture Skill: [.agents/skills/react-component-architecture/SKILL.md](../.agents/skills/react-component-architecture/SKILL.md)
- React Performance Skill: [.agents/skills/react-performance/SKILL.md](../.agents/skills/react-performance/SKILL.md)
