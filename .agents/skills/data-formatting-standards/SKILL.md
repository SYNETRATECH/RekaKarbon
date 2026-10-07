---
name: data-formatting-standards
description: Data formatting standards (dates, IDR currency, tCO2e carbon tonnage, hectares area, file size) and raw vs UI representation separation in RekaKarbon. Mandatory whenever processing numerical or date values.
---

# Data Formatting & API Readiness Standards — RekaKarbon

This guide defines the mandatory rules and standards for all developers and AI Agents when handling numeric, financial, and date formatting in RekaKarbon.

---

## 📌 1. Core Principles (Raw Data vs UI Presentation)

1. **Domain Data Models & Mock Fixtures**:
   - MUST store **pure numeric values (`number`)** for monetary amounts (IDR), carbon volume (`tCO2e`), land area (`ha`), and file sizes (`bytes`).
   - MUST store **ISO 8601 strings** (`YYYY-MM-DD` or ISO timestamp) for date fields.
   - **STRICTLY FORBIDDEN** to embed UI-formatted strings (such as `"Rp 450 Juta"`, `"5.8 Miliar Ha"`, `"48,200 tCO2e"`, `"14 Jan 2026"`) inside TypeScript interfaces (`src/types/`) or mock fixtures (`src/lib/mock/`).

2. **Dynamic UI Formatting**:
   - All visual presentation MUST be formatted dynamically at the React component layer (`src/portal/`, `src/components/`) using centralized utility functions.

---

## 🛠️ 2. Formatting Utility Modules

### 2.1 Numbers, Currency & Metrics (`src/lib/formatters.ts`)

```typescript
import {
  formatCurrency,
  formatCarbon,
  formatArea,
  formatPercent,
  formatFileSize,
  formatNumber,
} from '@/lib/formatters';

// 1. IDR Currency (Standard Rupiah Notation)
formatCurrency(200000000); // "Rp 200.000.000"
formatCurrency(45000); // "Rp 45.000"

// 2. Carbon Sequestration Tonnage (tCO₂e)
formatCarbon(48200); // "48.200 tCO₂e"

// 3. Spatial Land Area (Hectares)
formatArea(2450); // "2.450 ha"

// 4. Percentage Metric
formatPercent(96.4); // "96,4%"

// 5. File Size
formatFileSize(4718592); // "4,5 MB"
```

### 2.2 Dates & Timezones (`src/lib/dates.ts`)

All date functions are bound to the **`id-ID` locale** and **`Asia/Jakarta` timezone (WIB)**.

```typescript
import {
  formatDate,
  formatLongDate,
  formatShortDate,
  formatDateTime,
  toDateOnlyISO,
  formatLastSeen,
} from '@/lib/dates';

formatDate('2026-02-14'); // "14 Feb 2026"
formatLongDate('2026-02-14'); // "14 Februari 2026"
formatShortDate('2026-02-14'); // "14/02/2026"
formatDateTime('2026-02-14T14:32'); // "14/02/2026 14:32"
toDateOnlyISO(new Date()); // "2026-08-17"
formatLastSeen('2026-08-17T11:00'); // "15 minutes ago" / "Just now"
```

---

## 📋 3. React Component Usage Example

```tsx
import type { ForestProjectItem } from '@/types';
import { formatCurrency, formatCarbon, formatArea } from '@/lib/formatters';
import { formatDate } from '@/lib/dates';

interface ProjectCardProps {
  project: ForestProjectItem;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="p-4 bg-white rounded-2xl border border-slate-200">
      <h3 className="font-bold text-slate-900">{project.projectName}</h3>
      <div className="mt-2 space-y-1 text-xs">
        <p>
          Budget:{' '}
          <span className="font-black text-emerald-600">
            {formatCurrency(project.fundingBudgetIDR)}
          </span>
        </p>
        <p>
          Target Sequestration:{' '}
          <span className="font-bold">{formatCarbon(project.targetSequestrationTCO2e)}</span>
        </p>
      </div>
    </div>
  );
}
```

---

## 🔍 4. Quality Verification

Any code changes involving numeric data or dates must satisfy:

1. `pnpm client:typecheck` passes without type errors.
2. `pnpm client:test` (unit + `test:arch`) passes.
