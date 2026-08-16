# Panduan Tata Kelola Agen - RekaKarbon Monorepo

Berkas ini mendefinisikan aturan dan rujukan penting yang harus dipatuhi oleh seluruh AI Agent ketika melakukan modifikasi kode atau merancang fitur baru pada proyek RekaKarbon.

---

## 🏗️ 1. Spesifikasi Arsitektur Frontend

Untuk setiap pengerjaan frontend di dalam `/client`:

- **Teknologi**: Menggunakan **React**, **Tailwind CSS v4**, **Zustand** (untuk state global), dan **React Router**.
- **Struktur Modular**: Komponen UI harus dipisah secara modular di dalam [client/src/components](file:///home/mashupsoat/Project/rekakarbon/RekaKarbon/client/src/components/) dan state dikelola secara terpusat di [useCarbonStore.js](file:///home/mashupsoat/Project/rekakarbon/RekaKarbon/client/src/store/useCarbonStore.js).
- **Navigasi Drawer**: Portal utama dilarang menggunakan sidebar kiri permanen. Gunakan navigasi geser kanan ([RightDrawer.jsx](file:///home/mashupsoat/Project/rekakarbon/RekaKarbon/client/src/components/RightDrawer.jsx)) yang diaktifkan melalui tombol kontrol di pojok kanan atas.
- **Rujukan Aturan Lengkap**: Ikuti pedoman spesifikasi desain dan pembatasan visual terperinci di [rekakarbon-frontend-agent-spec.md](file:///home/mashupsoat/Project/rekakarbon/RekaKarbon/client/AGENTS/rekakarbon-frontend-agent-spec.md).

---

## 🚫 2. Aturan Penting Saat Menulis Kode

1. **Presisi Warna & Tema**: Wajib menggunakan token warna yang disepakati. **Primary Green sekarang berupa GRADIENT 12 langkah** — gunakan CSS utility class `.bg-primary-gradient` (background) atau `.text-primary-gradient` (teks judul), BUKAN warna solid `#003E29`. CSS variable `var(--color-primary)` (`#033C2E`) digunakan untuk teks dan border. Token lainnya: Tech Mint: `#00C48C`, Warning Red: `#EF4444`, Warning Orange: `#F59E0B`.
2. **Kalkulasi Geodetik**: Semua kalkulasi area spasial di modul peta wajib menggunakan fungsi terstandarisasi di [geodetics.js](file:///home/mashupsoat/Project/rekakarbon/RekaKarbon/client/src/utils/geodetics.js) untuk mencegah deviasi data numerik.
3. **Error Prevention**: Tombol tindakan berisiko tinggi (misalnya mode burning/offset atau modifikasi data audit) harus menyertakan warna peringatan/urgensi (merah/oranye) dan konfirmasi UI untuk mencegah kesalahan eksekusi.

---

## 📦 4. Standar Pengelolaan Mock Data & Repository Pattern

1. **Pemisahan Mock Data**: Seluruh data dummy/statis WAJIB disimpan terpisah di dalam folder `client/src/lib/mock/<feature>.ts` dan dilarang keras dituliskan secara hardcode langsung di dalam komponen `.jsx`/`.tsx`.
2. **Abstraksi Repository**: Setiap fitur data WAJIB dibungkus dengan arsitektur Repository Pattern di `client/src/repositories/<feature>.repository.ts` menggunakan interface spesifik dan dua kelas implementasi (`Mock...Repository` dan `Api...Repository`) yang dikontrol melalui environment variable `VITE_USE_MOCK_DATA`.
3. **Integrasi Zustand Store**: Komponen UI harus mengonsumsi data dari Zustand Store (`useCarbonStore.js`), yang secara asinkron memanggil kelas repository terdaftar.
4. **Skill Rujukan**: Rincian langkah pembuatan mock repository pattern dapat dibaca di Skill [.agents/skills/mock-repository-pattern/SKILL.md](file:///home/mashupsoat/Project/rekakarbon/RekaKarbon/.agents/skills/mock-repository-pattern/SKILL.md).
