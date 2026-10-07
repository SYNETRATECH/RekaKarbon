---
name: mock-repository-pattern
description: Rules and standards for creating mock/dummy data using the Repository Pattern architecture in RekaKarbon. Mandatory whenever creating or updating new feature data.
---

# Mock Data Management & Repository Pattern Standards — RekaKarbon

This guide defines the mandatory rules and standards for all AI Agents when designing mock data and integrating data services in RekaKarbon.

## 📌 Core Rules

1. **Strictly forbidden to hardcode dummy data directly inside UI components (`.jsx` / `.tsx`)**.
2. **Mock Data Must Be Raw Domain Data**: Mock fixtures in `src/lib/mock/` MUST store pure numeric values (`number`) and ISO dates (`YYYY-MM-DD`). It is strictly forbidden to embed pre-formatted UI strings (e.g., `"Rp 450 Juta"`, `"14 Jan 2026"`) into mock fixtures.
3. **Every new feature MUST provide 3 core components**:
   - **Type Interface** in `src/types/<feature>.ts`
   - **Static Mock Data** in `src/lib/mock/<feature>.ts`
   - **Repository Implementation** in `src/repositories/<feature>.repository.ts`

---

## 🛠️ Implementation Steps (4-Step Workflow)

### Step 1: Define Type Interface (`src/types/<feature>.ts`)

Define specific data structures using TypeScript interfaces (use numeric types and ISO strings for dates).

```typescript
// src/types/feature.ts
export interface FeatureData {
  id: string;
  name: string;
  amountIDR: number; // 200000000 (NOT string "Rp 200 Juta")
  createdDate: string; // "2026-02-14" (ISO 8601)
}
```

### Step 2: Create Static Mock Data (`src/lib/mock/<feature>.ts`)

Store static mock data in the `src/lib/mock/` directory.

```typescript
// src/lib/mock/feature.ts
import type { FeatureData } from '../../types';

export const FEATURE_MOCK_DATA: FeatureData[] = [
  { id: '1', name: 'Item Alpha', amountIDR: 200000000, createdDate: '2026-02-14' },
];
```

### Step 3: Implement Repository Pattern (`src/repositories/<feature>.repository.ts`)

Create the repository interface and two implementation classes (`Mock...Repository` and `Api...Repository`) that switch automatically via the `VITE_USE_MOCK_DATA` environment flag.

```typescript
// src/repositories/feature.repository.ts
import type { FeatureData } from '../types';
import { FEATURE_MOCK_DATA } from '../lib/mock/feature';
import { api } from '../lib/api';

const useMock = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

export interface FeatureRepository {
  getFeatureData(): Promise<FeatureData[]>;
}

class MockFeatureRepository implements FeatureRepository {
  async getFeatureData(): Promise<FeatureData[]> {
    return FEATURE_MOCK_DATA;
  }
}

class ApiFeatureRepository implements FeatureRepository {
  async getFeatureData(): Promise<FeatureData[]> {
    return api.get<FeatureData[]>('/feature');
  }
}

export const featureRepository: FeatureRepository = useMock
  ? new MockFeatureRepository()
  : new ApiFeatureRepository();
```

### Step 4: Register & Consume in Zustand Store

Register the repository in `src/repositories/index.ts` and invoke it in `src/store/useCarbonStore.js`.

```javascript
// src/store/useCarbonStore.js
import { featureRepository } from '../repositories';

// Inside initializeData():
const featureData = await featureRepository.getFeatureData();
set({ featureData });
```

---

## 🎯 Benefits

- **Seamless Backend Integration**: Once the backend API is ready, developers only need to switch `VITE_USE_MOCK_DATA=false` without modifying UI components.
- **Centralized Data**: All mock data is neatly managed under `src/lib/mock/`.
