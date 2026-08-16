# Panduan Tata Kelola Agen - RekaKarbon Monorepo

Berkas ini mendefinisikan aturan dan rujukan penting yang harus dipatuhi oleh seluruh AI Agent ketika melakukan modifikasi kode atau merancang fitur baru pada proyek RekaKarbon.

---

## 🏗️ 1. Spesifikasi Arsitektur Frontend

Untuk setiap pengerjaan frontend di dalam `/client`:

- **Teknologi**: Menggunakan **React**, **Tailwind CSS v4**, **Zustand** (untuk state global), dan **React Router**.
- **Struktur Modular**: Komponen UI harus dipisah secara modular di dalam [client/src/components](client/src/components/) dan state dikelola secara terpusat di [useCarbonStore.js](client/src/store/useCarbonStore.js).
- **Navigasi Drawer**: Portal utama dilarang menggunakan sidebar kiri permanen. Gunakan navigasi geser kanan ([RightDrawer.jsx](client/src/components/RightDrawer.jsx)) yang diaktifkan melalui tombol kontrol di pojok kanan atas.
- **Rujukan Aturan Lengkap**: Ikuti pedoman spesifikasi desain dan pembatasan visual terperinci di [rekakarbon-frontend-agent-spec.md](client/AGENTS/rekakarbon-frontend-agent-spec.md).

---

## 🚫 2. Aturan Penting Saat Menulis Kode

1. **Presisi Warna & Tema**: Wajib menggunakan token warna yang disepakati. **Primary Green sekarang berupa GRADIENT 12 langkah** — gunakan CSS utility class `.bg-primary-gradient` (background) atau `.text-primary-gradient` (teks judul), BUKAN warna solid `#003E29`. CSS variable `var(--color-primary)` (`#033C2E`) digunakan untuk teks dan border. Token lainnya: Tech Mint: `#00C48C`, Warning Red: `#EF4444`, Warning Orange: `#F59E0B`.
2. **Kalkulasi Geodetik**: Semua kalkulasi area spasial di modul peta wajib menggunakan fungsi terstandarisasi di [geodetics.js](client/src/utils/geodetics.js) untuk mencegah deviasi data numerik.
3. **Error Prevention**: Tombol tindakan berisiko tinggi (misalnya mode burning/offset atau modifikasi data audit) harus menyertakan warna peringatan/urgensi (merah/oranye) dan konfirmasi UI untuk mencegah kesalahan eksekusi.

---

## ✅ 3. Pemeriksaan Kualitas Kode (PR Check)

Setiap Pull Request ke branch `main` diverifikasi otomatis oleh workflow [.github/workflows/pr-check.yml](.github/workflows/pr-check.yml). Pastikan seluruh pemeriksaan lolos secara lokal sebelum membuka PR:

- **Format**: `pnpm format:check` (saat ini _non-blocking_ di CI; jalankan `pnpm format:write` untuk menormalkan, lalu jadikan blocking dengan menghapus `continue-on-error`).
- **Typecheck**: `pnpm client:typecheck` & `pnpm server:typecheck` (atau `pnpm typecheck`).
- **Lint**: `pnpm client:lint` (oxlint) & `pnpm server:lint` (eslint).
- **Test**: `pnpm client:test` (vitest — unit di `client/src/tests/` + arsitektur `test:arch` via dependency-cruiser) & `pnpm server:test` (jest).
- **Build**: `pnpm client:build` & `pnpm server:build`.

Aturan arsitektur client yang ditegakkan oleh `test:arch`: lapisan View (`components/`, `portal/`) dilarang mengimpor `lib/mock` secara langsung; akses data harus melalui `store` → `repositories` → `lib/mock`/`lib/api`.
