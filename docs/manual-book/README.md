# Buku Panduan Penggunaan Sistem (Manual Book) RekaKarbon

Dokumen ini berisi sumber LaTeX untuk **Buku Panduan Penggunaan Sistem (User Manual Book)** platform **RekaKarbon** dalam rangka kompetisi **KMIPN VIII 2026** (Kategori _e-Government_).

---

## 📂 Struktur Direktori

```text
docs/manual-book/
├── main.tex                 # File utama LaTeX (metadata & susunan dokumen)
├── main.pdf                 # Hasil kompilasi PDF buku panduan
├── .latexmkrc               # Konfigurasi build otomatis latexmk
├── .gitignore               # Daftar berkas temporer kompilasi yang diabaikan Git
├── assets/                  # Gambar, logo, diagram, dan tangkapan layar UI
│   ├── logo-reka-karbon.png
│   ├── logo-polinema.png
│   ├── workflow-dmrv.png
│   ├── ui-dashboard.png
│   ├── ui-bursa.png
│   └── ui-tata-kelola.png
└── contents/                # Modularisasi konten bab LaTeX
    ├── preamble.tex         # Konfigurasi package, margin A4, warna tema, callout box
    ├── cover.tex            # Halaman sampul (Cover) formal
    └── guideline.tex        # Isi utama panduan penggunaan modul RekaKarbon
```

---

## 🛠️ Prasyarat Kompilasi

Pastikan sistem Anda telah memiliki:

1. **Distribusi LaTeX**: [MiKTeX](https://miktex.org/) (Windows) atau [TeX Live](https://www.tug.org/texlive/) (Linux/macOS).
2. **Perl** (diperlukan oleh `latexmk`): Strawberry Perl di Windows.
3. Paket ekstensi LaTeX utama: `babel-indonesian`, `geometry`, `graphicx`, `xcolor`, `fancyhdr`, `titlesec`, `tocloft`, `tcolorbox`, `hyperref`, `mathptmx`. (MiKTeX akan mengunduh paket yang kurang secara otomatis).

---

## 🚀 Cara Kompilasi ke PDF

### Pilihan A: Menggunakan VS Code (Direkomendasikan)

1. Pasang ekstensi **[LaTeX Workshop](https://marketplace.visualstudio.com/items?itemName=James-Yu.latex-workshop)** di VS Code.
2. Buka berkas [main.tex](main.tex).
3. Tekan pintasan `Ctrl + Alt + B` (Windows/Linux) atau `Cmd + Option + B` (macOS) untuk kompilasi, atau gunakan tombol ikon _View LaTeX PDF_ pada bilah samping.

### Pilihan B: Menggunakan Terminal (CLI)

Buka terminal pada folder `docs/manual-book/` dan jalankan:

```bash
latexmk -pdf main.tex
```

Untuk membersihkan berkas temporer hasil kompilasi:

```bash
latexmk -c
```

atau kompilasi manual via `pdflatex`:

```bash
pdflatex main.tex
pdflatex main.tex
```

_(Dijalankan dua kali agar indeks Daftar Isi dan Daftar Gambar ter-referensi sempurna)._
