---
name: data-formatting-standards
description: Standar penformatan data (tanggal, mata uang IDR, tonase karbon tCO2e, hektar area, ukuran berkas) dan pemisahan data mentah vs UI di RekaKarbon. Wajib digunakan setiap kali memproses data numerik atau tanggal.
---

# Standar Format Data & API Readiness — RekaKarbon

Petunjuk ini mendefinisikan aturan dan standar wajib bagi seluruh pengembang dan AI Agent dalam mengelola format data numerik, finansial, dan tanggal di RekaKarbon.

---

## 📌 1. Prinsip Utama (Data Mentah vs Tampilan UI)

1. **Model Data Domain & Fixture Mock**:
   - WAJIB menyimpan **angka numerik murni (`number`)** untuk nominal uang (IDR), volume karbon (`tCO2e`), luas area (`ha`), dan ukuran berkas (`bytes`).
   - WAJIB menyimpan **string ISO 8601** (`YYYY-MM-DD` atau ISO timestamp) untuk bidang tanggal.
   - **DILARANG KERAS** menyisipkan string format tampilan UI (seperti `"Rp 450 Juta"`, `"5.8 Miliar Ha"`, `"48,200 tCO2e"`, `"14 Jan 2026"`) di dalam interface TypeScript (`src/types/`) maupun fixture mock (`src/lib/mock/`).

2. **Dynamic UI Formatting**:
   - Seluruh tampilan visual WAJIB diformat secara dinamis pada lapisan komponen React (`src/portal/`, `src/components/`) menggunakan fungsi utilitas terpusat.

---

## 🛠️ 2. Modul Utilitas Penformatan

### 2.1 Format Angka, Mata Uang & Metrik (`src/lib/formatters.ts`)

```typescript
import {
  formatCurrency,
  formatCarbon,
  formatArea,
  formatPercent,
  formatFileSize,
  formatNumber,
} from '@/lib/formatters';

// 1. Mata Uang IDR (Standard Rupiah Notation)
formatCurrency(200000000); // "Rp 200.000.000"
formatCurrency(45000); // "Rp 45.000"

// 2. Tonase Serapan Karbon (tCO₂e)
formatCarbon(48200); // "48.200 tCO₂e"

// 3. Luas Area Spasial (Hektar)
formatArea(2450); // "2.450 ha"

// 4. Persentase Metric
formatPercent(96.4); // "96,4%"

// 5. Ukuran Berkas File
formatFileSize(4718592); // "4,5 MB"
```

### 2.2 Format Tanggal & Zona Waktu (`src/lib/dates.ts`)

Semua fungsi tanggal di-bind secara otomatis ke **locale `id-ID`** dan **timezone `Asia/Jakarta` (WIB)**.

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
formatLastSeen('2026-08-17T11:00'); // "15 menit yang lalu" / "Baru saja"
```

---

## 📋 3. Contoh Pola Penggunaan Komponen React

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
          Anggaran:{' '}
          <span className="font-black text-emerald-600">
            {formatCurrency(project.fundingBudgetIDR)}
          </span>
        </p>
        <p>
          Target Serapan:{' '}
          <span className="font-bold">{formatCarbon(project.targetSequestrationTCO2e)}</span>
        </p>
      </div>
    </div>
  );
}
```

---

## 🔍 4. Verifikasi Kualitas

Setiap perubahan kode yang melibatkan data numerik atau tanggal harus mematuhi:

1. `pnpm client:typecheck` lolos tanpa kesalahan tipe.
2. `pnpm client:test` (unit + `test:arch`) lolos.
