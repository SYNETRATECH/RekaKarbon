---
name: react-component-architecture
description: >
  Component design patterns and frontend architecture conventions for RekaKarbon (client/).
  Covers Zustand state management, Repository Pattern layer isolation, right-drawer navigation,
  Tailwind CSS v4 color tokens & gradients, geodetic spatial calculations, and error-prevention UX patterns.
---

# React Component Architecture (RekaKarbon Client)

Use this skill when creating new components, refactoring existing ones, building custom hooks, or organizing types and repositories in RekaKarbon (`client/`).

---

## 1 — Core Architecture & Layer Isolation

### 1.1 Architecture Flow

```
View layer (client/src/components/, client/src/portal/)
  ↓ consumes state & actions
Zustand Global Store (client/src/store/useCarbonStore.js)
  ↓ calls asynchronously
Repository Layer (client/src/repositories/<feature>.repository.ts)
  ↓ branches via VITE_USE_MOCK_DATA
Mock Data (client/src/lib/mock/<feature>.ts) OR API Client (client/src/lib/api.ts)
```

> **CRITICAL RULE (`test:arch`):** View components (`components/`, `portal/`) MUST NOT import directly from `client/src/lib/mock/`. All data access must pass through Zustand Store → Repository interfaces.

---

## 2 — UI & Layout Conventions

### 2.1 Right Navigation Drawer Rule

- RekaKarbon main portal **MUST NOT** use a permanent left sidebar.
- Navigation must be implemented via the right sliding drawer component ([`RightDrawer.jsx`](../../../client/src/components/RightDrawer.jsx)) triggered by top-right control buttons.

### 2.2 Color Tokens & Primary Gradient

- **Primary Green Gradient**: Primary action buttons, primary titles, and hero backgrounds MUST use the 12-step primary gradient.
  - Background: `.bg-primary-gradient`
  - Text: `.text-primary-gradient`
  - Solid Primary fallback / text / border: `var(--color-primary)` (`#033C2E`). Do **NOT** use `#003E29`.
- **Secondary Tokens**:
  - Tech Mint: `#00C48C`
  - Warning Red: `#EF4444` (for destructive / burning / high-risk actions)
  - Warning Orange: `#F59E0B` (for warnings & pending state)

### 2.3 Risk-Prevention Controls

- Any high-risk user action (e.g. burning tokens, offset execution, audit modification) **MUST**:
  1. Use explicit warning styling (Red `#EF4444` or Orange `#F59E0B`).
  2. Require a visual confirmation step (dialog modal or double-step click) to prevent accidental execution.

---

## 3 — Map & Geodetic Spatial Data

- All map and spatial area calculations in RekaKarbon modules MUST utilize standardized geodetic helper functions in [`geodetics.js`](../../../client/src/utils/geodetics.js).
- Direct, unstandardized Euclidean/flat formulas for geographic spatial area computations are forbidden to prevent numerical data drift.

---

## 4 — 4-Step Repository Pattern Workflow

When creating or updating feature data in RekaKarbon:

1. **Define Type Interface** (`client/src/types/<feature>.ts`):
   ```ts
   export interface CarbonFeatureData {
     id: string;
     title: string;
     metricValue: number;
   }
   ```
2. **Define Mock Data** (`client/src/lib/mock/<feature>.ts`):
   ```ts
   import type { CarbonFeatureData } from '../types';
   export const MOCK_CARBON_FEATURE: CarbonFeatureData[] = [
     { id: '1', title: 'Hutan Konservasi A', metricValue: 450 },
   ];
   ```
3. **Define Repository** (`client/src/repositories/<feature>.repository.ts`):
   ```ts
   import type { CarbonFeatureData } from '../types';
   import { MOCK_CARBON_FEATURE } from '../lib/mock/<feature>';
   import { api } from '../lib/api';

   const useMock = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

   export interface FeatureRepository {
     getFeatureData(): Promise<CarbonFeatureData[]>;
   }

   class MockFeatureRepository implements FeatureRepository {
     async getFeatureData(): Promise<CarbonFeatureData[]> {
       return MOCK_CARBON_FEATURE;
     }
   }

   class ApiFeatureRepository implements FeatureRepository {
     async getFeatureData(): Promise<CarbonFeatureData[]> {
       return api.get<CarbonFeatureData[]>('/feature');
     }
   }

   export const featureRepository: FeatureRepository = useMock
     ? new MockFeatureRepository()
     : new ApiFeatureRepository();
   ```
4. **Connect to Zustand Store** (`client/src/store/useCarbonStore.js`):
   ```js
   import { featureRepository } from '../repositories';

   // Inside store actions:
   fetchFeatureData: async () => {
     const data = await featureRepository.getFeatureData();
     set({ featureData: data });
   };
   ```

---

## 5 — Component Execution Check

Before finishing component development, verify:

- `pnpm client:typecheck` passes without errors.
- `pnpm client:lint` passes.
- `pnpm client:test` (unit + `test:arch`) passes cleanly.
