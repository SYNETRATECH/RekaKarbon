# Panduan Tata Kelola Agen - RekaKarbon Monorepo

Berkas ini mendefinisikan aturan dan rujukan penting yang harus dipatuhi oleh seluruh AI Agent ketika melakukan modifikasi kode atau merancang fitur baru pada proyek RekaKarbon.

---

## 🏗️ 1. Spesifikasi Arsitektur Frontend

Untuk setiap pengerjaan frontend di dalam `/client`:

- **Teknologi**: Menggunakan **React**, **Tailwind CSS v4**, **Zustand** (untuk state global), dan **React Router**.
- **Struktur Modular**: Komponen UI harus dipisah secara modular di dalam [client/src/components](client/src/components/) dan state dikelola secara terpusat di [useCarbonStore.ts](client/src/store/useCarbonStore.ts).
- **Navigasi Drawer**: Portal utama dilarang menggunakan sidebar kiri permanen. Gunakan navigasi geser kanan ([RightDrawer.jsx](client/src/components/RightDrawer.jsx)) yang diaktifkan melalui tombol kontrol di pojok kanan atas.
- **Rujukan Aturan Lengkap**: Ikuti pedoman spesifikasi desain dan pembatasan visual terperinci di [rekakarbon-frontend-agent-spec.md](client/AGENTS/rekakarbon-frontend-agent-spec.md).

---

## 🚫 2. Aturan Penting Saat Menulis Kode

1. **Presisi Warna & Tema**: Wajib menggunakan token warna yang disepakati. **Primary Green sekarang berupa GRADIENT 12 langkah** — gunakan CSS utility class `.bg-primary-gradient` (background) atau `.text-primary-gradient` (teks judul), BUKAN warna solid `#003E29`. CSS variable `var(--color-primary)` (`#033C2E`) digunakan untuk teks dan border. Token lainnya: Tech Mint: `#00C48C`, Warning Red: `#EF4444`, Warning Orange: `#F59E0B`.
2. **Kalkulasi Geodetik**: Semua kalkulasi area spasial di modul peta wajib menggunakan fungsi terstandarisasi di [geodetics.ts](client/src/utils/geodetics.ts) untuk mencegah deviasi data numerik.
3. **Error Prevention**: Tombol tindakan berisiko tinggi (misalnya mode burning/offset atau modifikasi data audit) harus menyertakan warna peringatan/urgensi (merah/oranye) dan konfirmasi UI untuk mencegah kesalahan eksekusi.

---

## 📝 3. Konvensi Penamaan Kode & Sentralisasi Tipe

Seluruh modifikasi kode wajib mematuhi standar penamaan dan tata kelola tipe berikut:

1. **Variabel & Fungsi**: Wajib menggunakan `camelCase` (contoh: `forestProjects`, `calculateGeodetics()`, `getProjectDetails()`).
2. **Komponen React**: Wajib menggunakan `PascalCase` (contoh: `CarbonDexMarket`, `ForestProjectsManagement`, `RightDrawer`).
3. **Tipe & Interface TypeScript**: Wajib menggunakan `PascalCase` dan **WAJIB disimpan terpusat di dalam [client/src/types/](client/src/types/)** (dire-export via [index.ts](client/src/types/index.ts)). Dilarang keras mendefinisikan interface dummy secara inline di dalam berkas mock data atau repositori.
4. **Konstanta Global & Fixture Mock**: Wajib menggunakan `UPPER_SNAKE_CASE` (contoh: `MOCK_BURSA_ITEMS`, `COMPANIES_DATA`, `VITE_USE_MOCK_DATA`).

---

## ✅ 4. Pemeriksaan Kualitas Kode (PR Check)

Setiap Pull Request ke branch `main` diverifikasi otomatis oleh workflow [.github/workflows/pr-check.yml](.github/workflows/pr-check.yml). Pastikan seluruh pemeriksaan lolos secara lokal sebelum membuka PR:

- **Format**: `pnpm format:check` (saat ini _non-blocking_ di CI; jalankan `pnpm format:write` untuk menormalkan, lalu jadikan blocking dengan menghapus `continue-on-error`).
- **Typecheck**: `pnpm client:typecheck` & `pnpm server:typecheck` (atau `pnpm typecheck`).
- **Lint**: `pnpm client:lint` (oxlint) & `pnpm server:lint` (eslint).
- **Test**: `pnpm client:test` (vitest — unit di `client/src/tests/` + arsitektur `test:arch` via dependency-cruiser) & `pnpm server:test` (jest).
- **Build**: `pnpm client:build` & `pnpm server:build`.

Aturan arsitektur client yang ditegakkan oleh `test:arch`: lapisan View (`components/`, `portal/`) dilarang mengimpor `lib/mock` secara langsung; akses data harus melalui `store` → `repositories` → `lib/mock`/`lib/api`.

---

## 📦 5. Standar Pengelolaan Mock Data & Repository Pattern

1. **Pemisahan Mock Data**: Seluruh data dummy/statis WAJIB disimpan terpisah di dalam folder `client/src/lib/mock/<feature>.ts` dan dilarang keras dituliskan secara hardcode langsung di dalam komponen `.jsx`/`.tsx`. Seluruh mock data wajib di-type secara eksplisit menggunakan tipe dari `src/types`.
2. **Abstraksi Repository**: Setiap fitur data WAJIB dibungkus dengan arsitektur Repository Pattern di `client/src/repositories/<feature>.repository.ts` menggunakan interface spesifik dan dua kelas implementasi (`Mock...Repository` dan `Api...Repository`) yang dikontrol melalui environment variable `VITE_USE_MOCK_DATA`.
3. **Integrasi Zustand Store**: Komponen UI harus mengonsumsi data dari Zustand Store (`useCarbonStore.ts`), yang secara asinkron memanggil kelas repository terdaftar.
4. **Skill Rujukan**: Rincian langkah pembuatan mock repository pattern dapat dibaca di Skill [.agents/skills/mock-repository-pattern/SKILL.md](.agents/skills/mock-repository-pattern/SKILL.md).

---

## 🔢 6. Aturan Format Data & Dynamic UI Rendering (API Payload Readiness)

1. **Penyimpanan Data Mentah (Raw Domain Data)**: Interface domain di [client/src/types/](client/src/types/) dan fixture mock di [client/src/lib/mock/](client/src/lib/mock/) WAJIB menyimpan nilai numerik murni (`number`) untuk nominal uang, tonnage karbon, luas area, dan ukuran berkas. Tanggal WAJIB disimpan sebagai string ISO 8601 (`YYYY-MM-DD` atau ISO timestamp). Dilarang keras menyisipkan string format UI (seperti `"Rp 450 Juta"`, `"5.8 Miliar Ha"`, `"14 Jan 2026"`) di dalam model data backend/mock.
2. **Penformatan UI Dinamis**: Seluruh penformatan tampilan visual WAJIB dilakukan secara dinamis pada komponen UI menggunakan modul terpusat:
   - [client/src/lib/formatters.ts](client/src/lib/formatters.ts): `formatCurrency` (`Rp 200.000.000`), `formatCarbon` (`48.200 tCO2e`), `formatArea` (`2.450 ha`), `formatPercent`, `formatFileSize`, `formatNumber`.
   - [client/src/lib/dates.ts](client/src/lib/dates.ts): `formatDate`, `formatLongDate`, `formatShortDate`, `formatDateTime`, `toDateOnlyISO`, `formatLastSeen`.
3. **Standar Mata Uang & Zona Waktu**: Standar mata uang mengikuti notasi standar Rupiah Indonesia (contoh: `Rp 200.000.000` via `formatCurrency`), BUKAN imbuhan kata seperti `"200 juta"`. Zona waktu terstandarisasi ke `Asia/Jakarta` (`id-ID` locale).
4. **Skill Rujukan**: Panduan lengkap format data dapat dibaca di Skill [.agents/skills/data-formatting-standards/SKILL.md](.agents/skills/data-formatting-standards/SKILL.md).
