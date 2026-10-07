# 🎨 RekaKarbon Frontend Client (`client/`)

Modern, high-performance web interface for the **RekaKarbon** Digital Measurement, Reporting, and Verification (dMRV) ecosystem and Carbon Exchange platform (Bursa Karbon). Built with React 19, React Router v7, Tailwind CSS v4, and Zustand.

---

## 🌟 Key Highlights & Role Portals

The RekaKarbon client is structured into specialized, role-based workflows designed for the Indonesian carbon market:

| Portal / Role                   | Path Prefix    | Description & Primary Features                                                                                                                                                |
| :------------------------------ | :------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **KTH (Community Forest)**      | `/kth/*`       | Forest polygon boundary mapping, geodetic drone telemetry upload, carbon sequestration tracking, and carbon credit wallet.                                                    |
| **Industrial Emitter**          | `/emitter/*`   | GHG Protocol Scope 1, 2, and 3 emission reporting wizard, DJP e-Faktur fuel invoice validation, Bursa Karbon trading terminal, compliance reports, and certificate downloads. |
| **Auditor / Verificator**       | `/auditor/*`   | Spatial GIS drone inspection, AI anomaly detection review modal (XAI diagnostics, Z-score analysis, DJP fiscal cross-checks), and gate verification.                          |
| **Regulator (Ministry / KLHK)** | `/regulator/*` | National carbon quota allocations (PTBAE-PU), national emission registry, KTH project oversight, and aggregated forestry health analytics.                                    |

---

## 🏛️ Architecture & Core Patterns

The client is engineered with a strict 4-layer architecture ensuring decoupling, testability, and offline capability:

```
View Layer (routes/<role>/**/*.tsx & components/)
    │
    ▼ (invokes store hooks)
State Layer (store/useCarbonStore.ts)
    │
    ▼ (delegates data operations)
Repository Layer (repositories/*.repository.ts)
    │
    ├── Mock Implementation (when VITE_USE_MOCK_DATA=true) ──► lib/mock/*.ts
    └── API Implementation  (when VITE_USE_MOCK_DATA=false)  ──► NestJS REST API
```

### 1. Repository Pattern & Dual Mode

- **Zero Backend Dependency for UI Work**: Setting `VITE_USE_MOCK_DATA=true` instantly switches all repositories to high-fidelity, typed in-memory mock datasets in `src/lib/mock/`.
- **Seamless Production Integration**: Setting `VITE_USE_MOCK_DATA=false` routes requests through `src/lib/api.ts` to the NestJS backend API.

### 2. "Ecological Precision" Design System

- Built with **Tailwind CSS v4** and customized design tokens defined in `src/styles/index.css`.
- High-contrast, accessibility-first color palette balancing forest deep-greens, emerald accents, and carbon-slate backgrounds.
- Refer to [DESIGN.md](./DESIGN.md) for full design guidelines.

### 3. Geodetic Spatial Calculations

- Community forest polygon areas, perimeter distances, and drone flight corridors are computed deterministically using standard geodetics in `src/utils/geodetics.ts`.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [React Router v7](https://reactrouter.com/) (SSR & Client Routing)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + CSS Variables
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **UI Components & Icons**: Radix UI primitives, Lucide React, Base UI
- **Data Visualization & GIS**: Recharts, Chart.js, Leaflet
- **Data Validation**: Zod
- **Build Tooling & Testing**: Vite, Vitest, Oxlint, Dependency Cruiser

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `24.15.0` (matching monorepo `.nvmrc` / `package.json`)
- **Package Manager**: `pnpm 11.22.0`

### 1. Installation

From the monorepo root or from the `client/` directory:

```bash
# From workspace root
pnpm install

# Or specifically for client
pnpm --filter @rekakarbon/client install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` in the `client/` directory:

```bash
cp .env.example .env
```

Key environment variables:

```env
# Toggle Mock vs Live API Repositories (true = use local fixtures, false = live backend)
VITE_USE_MOCK_DATA=false

# NestJS Backend URL
VITE_API_BASE_URL="http://localhost:3000"

# Application Base URL
BASE_URL="/"

# Mapbox / Spatial Map Tile Token (Optional for satellite layers)
VITE_MAP_TILE_TOKEN=""
```

### 3. Running Development Server

```bash
# Run client dev server directly (default: http://localhost:5173)
pnpm --filter @rekakarbon/client dev

# Or start both client and server concurrently from monorepo root
pnpm dev
```

---

## 📜 Available Scripts

| Command               | Description                                                        |
| :-------------------- | :----------------------------------------------------------------- |
| `pnpm dev`            | Start the local Vite development server with hot-reload.           |
| `pnpm build`          | Create an optimized production build using `react-router build`.   |
| `pnpm preview`        | Preview the local production build.                                |
| `pnpm lint`           | Run fast linting via [Oxlint](https://oxc.rs/).                    |
| `pnpm typecheck`      | Run static type checking with `tsc --noEmit`.                      |
| `pnpm test`           | Run unit tests with [Vitest](https://vitest.dev/).                 |
| `pnpm test:watch`     | Run Vitest in interactive watch mode.                              |
| `pnpm test:arch`      | Execute architectural boundary checks via `dependency-cruiser`.    |
| `pnpm test:contracts` | Validate client Zod schemas against NestJS API response contracts. |

---

## 📁 Directory Structure

```
client/
├── src/
│   ├── assets/               # Static images, logos, and vector assets
│   ├── components/           # Reusable UI component library
│   │   ├── layout/           # PortalLayout, PortalSidebar, PortalHeader
│   │   ├── modals/           # Action modals (Audit review, trade, wallet)
│   │   └── ui/               # Atomic design elements (buttons, inputs, cards, badges)
│   ├── hooks/                # Custom reusable React hooks
│   ├── lib/                  # Utilities, API client, date/currency formatters, mock fixtures
│   │   ├── mock/             # Typed mock datasets (source of truth for mock mode)
│   │   ├── api.ts            # Axios / Fetch client wrapper
│   │   ├── dates.ts          # Indonesian date localization utilities
│   │   └── formatters.ts     # IDR currency, tCO2e tonnage, hectare formatters
│   ├── repositories/         # Repository Pattern implementations (Mock vs. API)
│   ├── routes/               # Role-isolated route views and pages
│   │   ├── _index.tsx        # Public landing page
│   │   ├── app.tsx           # Base application shell
│   │   ├── login.tsx         # Authentication and role switcher
│   │   ├── dashboard.tsx     # Overview dashboard
│   │   ├── kth/              # KTH community forestry routes
│   │   ├── emitter/          # Industrial emitter reporting & Bursa trading
│   │   ├── auditor/          # dMRV GIS inspection & AI audit review
│   │   └── regulator/        # National registry & quota allocation
│   ├── schemas/              # Zod validation schemas for forms and API contracts
│   ├── store/
│   │   └── useCarbonStore.ts # Central Zustand state store
│   ├── styles/
│   │   └── index.css         # Tailwind v4 configuration and design system tokens
│   ├── types/                # Central TypeScript interfaces (PascalCase)
│   ├── utils/
│   │   └── geodetics.ts      # Spatial GIS calculations (Haversine, geodesic area)
│   ├── root.tsx              # Root HTML template and provider hierarchy
│   ├── routes.ts             # React Router v7 routes manifest
│   └── entry.client.tsx      # Client-side hydration entrypoint
├── public/                   # Static assets, web manifest, service worker
├── DESIGN.md                 # Design system specifications & tokens
├── AGENTS.md                 # AI agent governance rules and coding standards
├── vite.config.ts            # Vite build configuration
└── tsconfig.json             # TypeScript configuration
```

---

## 🤝 Contributing & AI Agent Rules

If you are developing features or writing code using an AI coding assistant:

- Consult [AGENTS.md](./AGENTS.md) for strict architectural rules, state management guidelines, and PR quality gates.
- Consult [DESIGN.md](./DESIGN.md) for typography, colors, animations, and spacing standards.
