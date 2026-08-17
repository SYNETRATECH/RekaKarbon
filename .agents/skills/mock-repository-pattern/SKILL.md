---
name: mock-repository-pattern
description: Aturan dan standar pembuatan mock/dummy data menggunakan arsitektur Repository Pattern di RekaKarbon. Wajib digunakan setiap kali membuat atau memperbarui data fitur baru.
---

# Standar Pengelolaan Mock Data & Repository Pattern - RekaKarbon

Petunjuk ini mendefinisikan aturan dan standar wajib bagi seluruh AI Agent ketika menyusun data dummy (mock data) dan integrasi data service di RekaKarbon.

## 📌 Aturan Utama

1. **Dilarang keras hardcode data dummy langsung di dalam komponen UI (`.jsx` / `.tsx`)**.
2. **Mock Data Harus Berupa Data Mentah (Raw Domain Data)**: Fixture mock di `src/lib/mock/` WAJIB menyimpan angka numerik murni (`number`) dan ISO dates (`YYYY-MM-DD`). Dilarang keras memasukkan pre-formatted UI strings (misal: `"Rp 450 Juta"`, `"14 Jan 2026"`) ke dalam mock fixture.
3. **Setiap fitur baru WAJIB memiliki 3 komponen utama**:
   - **Type Interface** di `src/types/<feature>.ts`
   - **Static Mock Data** di `src/lib/mock/<feature>.ts`
   - **Repository Implementation** di `src/repositories/<feature>.repository.ts`

---

## 🛠️ Langkah Implementasi (4-Step Workflow)

### Langkah 1: Definisi Type Interface (`src/types/<feature>.ts`)

Definisikan struktur data spesifik menggunakan TypeScript interface (gunakan tipe numerik & ISO string untuk tanggal).

```typescript
// src/types/feature.ts
export interface FeatureData {
  id: string;
  name: string;
  amountIDR: number; // 200000000 (BUKAN string "Rp 200 Juta")
  createdDate: string; // "2026-02-14" (ISO 8601)
}
```

### Langkah 2: Buat Mock Data Statis (`src/lib/mock/<feature>.ts`)

Simpan data statis di dalam folder `src/lib/mock/`.

```typescript
// src/lib/mock/feature.ts
import type { FeatureData } from '../../types';

export const FEATURE_MOCK_DATA: FeatureData[] = [
  { id: '1', name: 'Item Alpha', amountIDR: 200000000, createdDate: '2026-02-14' },
];
```

### Langkah 3: Implementasi Repository Pattern (`src/repositories/<feature>.repository.ts`)

Buat interface repository serta dua kelas implementasi (`Mock...Repository` dan `Api...Repository`) yang dialihkan otomatis melalui environment flag `VITE_USE_MOCK_DATA`.

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

### Langkah 4: Registrasi & Konsumsi di Zustand Store

Daftarkan repository di `src/repositories/index.ts` dan panggil di `src/store/useCarbonStore.js`.

```javascript
// src/store/useCarbonStore.js
import { featureRepository } from '../repositories';

// Di dalam initializeData():
const featureData = await featureRepository.getFeatureData();
set({ featureData });
```

---

## 🎯 Manfaat

- **Integrasi Backend Mulus**: Ketika API backend siap, pengembang hanya perlu mengubah `VITE_USE_MOCK_DATA=false` tanpa perlu merombak komponen UI.
- **Data Terpusat**: Seluruh data mock tersimpan secara rapi di `src/lib/mock/`.
