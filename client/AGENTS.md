# AGENTS.md - RekaKarbon Client (React App)

Frontend-specific agent guide for the `client/` directory. For human-facing setup and feature overviews, see [README.md](./README.md). See root [AGENTS.md](../AGENTS.md) for monorepo-wide rules.

---

## 🛠️ Tech Stack & Commands

| Category      | Details                                            |
| ------------- | -------------------------------------------------- |
| **Framework** | React 19 + React Router v7 (SSR)                   |
| **Styling**   | Tailwind CSS v4 + CSS Variables (design tokens)    |
| **State**     | Zustand (`useCarbonStore.ts`, `useAuthStore.ts`)   |
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
│   │   ├── _index.tsx        # Landing page & public GIS map view
│   │   ├── app.tsx           # Authenticated App shell (PortalLayout)
│   │   ├── login.tsx         # Login view
│   │   ├── dashboard.tsx     # Overview dashboard
│   │   ├── settings.tsx      # App settings
│   │   ├── kth/              # KTH role routes (polygon.tsx, wallet.tsx)
│   │   ├── emitter/          # Emitter role routes (bursa.tsx, compliance.tsx, laporan.tsx, sertifikat.tsx)
│   │   ├── regulator/        # Regulator role routes (projects.tsx, kth.tsx, forest.tsx, upload.tsx, etc.)
│   │   └── auditor/          # Auditor role routes (spatial.tsx, drone.tsx, audit.tsx, gate.tsx)
│   ├── store/
│   │   ├── useCarbonStore.ts # Central Zustand store (global domain state + actions)
│   │   └── useAuthStore.ts   # Client user authentication and role state
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
├── DESIGN.md                 # Ecological Precision design system & UI implementation guide
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

### 3. Navigation Architecture

- **Authenticated Portals**: Managed by [`PortalLayout`](src/components/layout/PortalLayout.tsx) with a collapsible [`PortalSidebar`](src/components/layout/PortalSidebar.tsx). Role-isolated navigation matches `KTH`, `EMITTER`, `REGULATOR`, or `AUDITOR`.
- **Public Map View (`/_index`)**: Uses full-screen Leaflet with the sliding [`RightDrawer`](src/components/RightDrawer.tsx) component.

### 4. UI Component Policy (`shadcn/ui` First)

- **Prioritize shadcn/ui**: Always look in `@/components/ui/` (`Button`, `Input`, `Card`, `Badge`, `Table`, `Dialog`, `Sheet`, `Select`, `Progress`, `Alert`, `Popover`, etc.) before creating new elements.
- **Reuse Layout Components**: Use `@/components/layout/` (`PageHeader`, `KpiStatCard`, `FilterToolbar`) for consistent page structure.
- **Consult DESIGN.md**: For typography scales, surface tokens, and component styling, follow [DESIGN.md](DESIGN.md).

### 5. Naming Conventions

| Type                    | Convention         | Example                                  |
| ----------------------- | ------------------ | ---------------------------------------- |
| Variables/Functions     | `camelCase`        | `forestProjects`, `calculateGeodetics()` |
| React Components        | `PascalCase`       | `CarbonDexMarket`, `RightDrawer`         |
| Types/Interfaces        | `PascalCase`       | `ForestProjectItem`, `CarbonStoreState`  |
| Constants/Mock Fixtures | `UPPER_SNAKE_CASE` | `MOCK_BURSA_ITEMS`, `COMPANIES_DATA`     |

### 6. TypeScript Types

- **All types** reside in `src/types/` (barrel export via `src/types/index.ts`).
- **Never** define interfaces inline in mock files or components.
- Mock data **must** be explicitly typed using types from `src/types`.

### 7. Color & Theme (Tailwind v4 + CSS Variables + Design Tokens)

> [!IMPORTANT]
> All UI styling, layout spacing, color tokens, elevation, and typography scales MUST adhere to the **Ecological Precision** design system defined in [DESIGN.md](DESIGN.md).

| Token                       | Variable                                          | Usage                                       |
| --------------------------- | ------------------------------------------------- | ------------------------------------------- |
| Primary Gradient (12-step)  | `.bg-primary-gradient` / `.text-primary-gradient` | Backgrounds, primary CTA, title text        |
| Primary Solid (text/border) | `var(--color-primary)` = `#033C2E`                | Text, borders, solid accents                |
| Tech Mint                   | `#00C48C` (`var(--color-tech-mint)`)              | Verified indicators, accents, pulse markers |
| Warning Red                 | `#EF4444`                                         | Over-quota, non-compliant, critical actions |
| Warning Orange              | `#F59E0B`                                         | Pending, low supply, irreversible warnings  |
| Background                  | `#F8FAFC` (`bg-slate-50`)                         | Page canvas                                 |
| Card/White                  | `#FFFFFF` (`bg-white`)                            | Cards, containers                           |

**Do NOT use** hardcoded `#003E29` — use gradient utilities or CSS variable `var(--color-primary)`.

### 8. Data Formatting (Raw → UI)

| Raw Type            | Formatter                           | Output Example   |
| ------------------- | ----------------------------------- | ---------------- |
| `number` (IDR)      | `formatCurrency()`                  | `Rp 200.000.000` |
| `number` (tCO2e)    | `formatCarbon()`                    | `48.200 tCO₂e`   |
| `number` (hectares) | `formatArea()`                      | `2.450 ha`       |
| `number` (percent)  | `formatPercent()`                   | `96,4%`          |
| `number` (bytes)    | `formatFileSize()`                  | `2,45 MB`        |
| ISO 8601 date       | `formatDate()` / `formatLongDate()` | `14 Jan 2026`    |

**Rule**: Store raw numbers + ISO dates in types/mock. Format **only** in UI components via `lib/formatters.ts` and `lib/dates.ts`.

### 9. Geodetic Calculations

All spatial area calculations **must** use `src/utils/geodetics.ts` functions. No custom flat/Euclidean math.

### 10. Asset Management Standards (`src/assets` vs `public/`)

- **`src/assets/` (Bundled Module Pipeline)**:
  - Directly imported in TypeScript, TSX, or CSS (e.g. `import logo from '@/assets/brand/icon.png'`).
  - Processed by Vite with content hashing, compile-time link verification, and inline queries (`?inline` for PDF generation).
- **`public/` (Static Root Directory)**:
  - Root browser conventions (`favicon.ico`, `manifest.webmanifest`, `sw.js`).
  - PWA icons (`public/icons/`) and mock attachments (`public/proofs/`) referenced by root-relative paths.
  - Never import files in `public/` using ESM `import` statements.

---

## ⚖️ Domain UX & Regulatory Invariants

Agents implementing business features MUST enforce the following core domain invariants:

1. **Carbon Balance Deficit (Emisi vs Kuota)**:
   - When actual emissions exceed the legal quota (PTBAE-PU), UI must display high-urgency deficit alert with red progress segments.
   - Fiscal penalty risk estimation must adhere to UU No. 7/2021 HPP penalty formula (e.g., deficit tonnage × statutory rate).
2. **Burning Chamber Protocol (Brankas & Offset)**:
   - Live fractional conversion math: **`10 fractions = 1.0 tCO2e`**.
   - Because burning/retiring carbon tokens is irreversible, the action button MUST use warning colors (`#EF4444` / `#F59E0B`) and require an explicit two-step confirmation dialog before execution.
3. **Cap Control Market Purchasing (Bursa Karbon)**:
   - Restrict or warn emitter purchase orders if requested volume exceeds their active deficit, preventing speculative market hoarding.
4. **dMRV Transparency Link**:
   - Every metric backed by digital MRV (dMRV) must provide a direct verification link (`Verifikasi Sumber Data dMRV`) leading to the underlying drone orthophoto and satellite evidence.

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
- Design system & UI guide: [DESIGN.md](DESIGN.md)
- Mock/Repository Pattern Skill: [.agents/skills/mock-repository-pattern/SKILL.md](../.agents/skills/mock-repository-pattern/SKILL.md)
- Data Formatting Skill: [.agents/skills/data-formatting-standards/SKILL.md](../.agents/skills/data-formatting-standards/SKILL.md)
- API Design Standards Skill: [.agents/skills/api-design-standards/SKILL.md](../.agents/skills/api-design-standards/SKILL.md)
- React Component Architecture Skill: [.agents/skills/react-component-architecture/SKILL.md](../.agents/skills/react-component-architecture/SKILL.md)
- React Performance Skill: [.agents/skills/react-performance/SKILL.md](../.agents/skills/react-performance/SKILL.md)
- UI/UX Design Intelligence Skill: [.agents/skills/ui-ux-pro-max/SKILL.md](../.agents/skills/ui-ux-pro-max/SKILL.md)
- Stitch Design System Synthesis Skill: [.agents/skills/design-md/SKILL.md](../.agents/skills/design-md/SKILL.md)
- shadcn/ui Component Skill: [.agents/skills/shadcn/SKILL.md](../.agents/skills/shadcn/SKILL.md)
