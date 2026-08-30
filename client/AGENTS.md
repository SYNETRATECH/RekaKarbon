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
│   ├── components/           # Shared UI components (ui/, layout/ [PortalLayout, PortalSidebar, ...], modals/, etc.)
│   ├── routes/               # React Router v7 routes (role-isolated route views & pages)
│   │   ├── _index.tsx        # Landing page
│   │   ├── app.tsx           # Main App route
│   │   ├── login.tsx         # Login view
│   │   ├── dashboard.tsx     # Overview dashboard
│   │   ├── settings.tsx      # App settings
│   │   ├── kth/              # KTH role routes (polygon.tsx, wallet.tsx)
│   │   ├── emitter/          # Emitter role routes (bursa.tsx, compliance.tsx, laporan.tsx, sertifikat.tsx)
│   │   ├── regulator/        # Regulator role routes (projects.tsx, kth.tsx, forest.tsx, upload.tsx, etc.)
│   │   └── auditor/          # Auditor role routes (spatial.tsx, drone.tsx, audit.tsx, gate.tsx)
│   ├── store/
│   │   └── useCarbonStore.ts # Central Zustand store (all global state + actions)
│   ├── repositories/         # Repository Pattern (Mock + API implementations)
│   │   ├── *.repository.ts   # Interfaces + implementations per feature
│   │   └── index.ts          # Barrel export
│   ├── lib/
│   │   ├── mock/             # Mock data fixtures (typed with src/types, UUID-like IDs)
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

### 1. Data & View Separation: View → Store → Repository → Mock/API

```
routes/<role>/**/*.tsx (or components/**/*.tsx)
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
lib/mock/*.ts              # Typed fixtures (source of truth for mock, UUID-like IDs)
```

- **NEVER** import `lib/mock` directly in View components (`.tsx`/`.jsx`).
- **Mock data fixtures** MUST follow standard backend API payload rules (e.g. UUID-like strings for entity IDs).

### 2. State Management Guidelines (Local vs. Zustand Store)

- **Local/Ephemeral State**: Form input fields, tab selection, modal/dialog toggle states specific to a single component or page SHOULD be managed via React local state (`useState`).
- **Global/Shared State**: Data consumed across multiple components, views, or pages (e.g. project lists, transaction logs, user roles) MUST be stored in the central **Zustand store** (`useCarbonStore.ts`) to avoid _props drilling_.

### 3. UI Component Policy (`shadcn/ui` First)

- **Prioritize shadcn/ui**: Always look in `@/components/ui/` (`Button`, `Input`, `Card`, `Badge`, `Table`, `Dialog`, `Sheet`, `Select`, `Progress`, `Alert`, `Popover`, etc.) before creating new elements.
- **Reuse & Modify**: If a component already provides what is needed, use it directly or customize it. Building custom HTML components (`<button>`, `<input>`, `<table>`, `<dialog>`) when `shadcn/ui` primitives exist is prohibited.

### 4. Naming Conventions

| Type                    | Convention         | Example                                  |
| ----------------------- | ------------------ | ---------------------------------------- |
| Variables/Functions     | `camelCase`        | `forestProjects`, `calculateGeodetics()` |
| React Components        | `PascalCase`       | `CarbonDexMarket`, `RightDrawer`         |
| Types/Interfaces        | `PascalCase`       | `ForestProjectItem`, `CarbonStoreState`  |
| Constants/Mock Fixtures | `UPPER_SNAKE_CASE` | `MOCK_BURSA_ITEMS`, `COMPANIES_DATA`     |

### 5. TypeScript Types

- **All types** reside in `src/types/` (barrel export via `src/types/index.ts`).
- **Never** define interfaces inline in mock files or components.
- Mock data **must** be explicitly typed using types from `src/types`.

### 6. Color & Theme (Tailwind v4 + CSS Variables + Design Tokens)

> [!IMPORTANT]
> All UI styling, layout spacing, color tokens, elevation, and typography scales MUST adhere to the **Ecological Precision** design system defined in [DESIGN.md](DESIGN.md).

| Token                       | Variable                                          | Usage                                       |
| --------------------------- | ------------------------------------------------- | ------------------------------------------- |
| Primary Gradient (12-step)  | `.bg-primary-gradient` / `.text-primary-gradient` | Backgrounds, title text                     |
| Primary Solid (text/border) | `var(--color-primary)` = `#033C2E`                | Text, borders                               |
| Tech Mint                   | `#00C48C`                                         | Verified indicators, accents                |
| Warning Red                 | `#EF4444`                                         | Over-quota, non-compliant, critical actions |
| Warning Orange              | `#F59E0B`                                         | Pending, low supply, irreversible warnings  |
| Background                  | `#F8FAFC` (`bg-slate-50`)                         | Page canvas                                 |
| Card/White                  | `#FFFFFF` (`bg-white`)                            | Cards, containers                           |

**Do NOT use** hardcoded `#003E29` — use gradient utilities or CSS variable. Refer to [DESIGN.md](DESIGN.md) for full color token definitions (`surface`, `primary-container`, `on-surface`, etc.).

---

### 7. Data Formatting (Raw → UI)

| Raw Type            | Formatter                           | Output Example   |
| ------------------- | ----------------------------------- | ---------------- |
| `number` (IDR)      | `formatCurrency()`                  | `Rp 200.000.000` |
| `number` (tCO2e)    | `formatCarbon()`                    | `48.200 tCO₂e`   |
| `number` (hectares) | `formatArea()`                      | `2.450 ha`       |
| `number` (percent)  | `formatPercent()`                   | `96,4%`          |
| `number` (bytes)    | `formatFileSize()`                  | `2,45 MB`        |
| ISO 8601 date       | `formatDate()` / `formatLongDate()` | `14 Jan 2026`    |

**Rule**: Store raw numbers + ISO dates in types/mock. Format **only** in UI components via `lib/formatters.ts` and `lib/dates.ts`.

### 8. Geodetic Calculations

All spatial area calculations **must** use `src/utils/geodetics.ts` functions. No custom math.

### 9. Error Prevention (High-Risk Actions)

Buttons for burning/offsetting, audit modifications, or deletions:

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
- API Design Standards Skill: [.agents/skills/api-design-standards/SKILL.md](../.agents/skills/api-design-standards/SKILL.md)
- React Component Architecture Skill: [.agents/skills/react-component-architecture/SKILL.md](../.agents/skills/react-component-architecture/SKILL.md)
- React Performance Skill: [.agents/skills/react-performance/SKILL.md](../.agents/skills/react-performance/SKILL.md)
