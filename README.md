# 📰 BUSER INFO — Portal Berita Modern & Terpercaya

Portal berita digital modern berbasis web yang menyajikan informasi terkini seputar berita Nasional, Daerah, Politik, Kriminal & Hukum, Ekonomi, Pendidikan, Teknologi, Olahraga, Internasional, dan Lifestyle secara cepat, akurat, dan berimbang.

---

## 🌟 Fitur Utama (Client / Portal Berita)

- **🎨 Modern & Responsive UI**: Antarmuka bersih, cepat, dan mobile-friendly dibangun dengan Tailwind CSS & semantic HTML5.
- **⚡ Breaking News Ticker**: Banner berita kilat berjalan secara dinamis di bagian header.
- **🏆 Hero Headline & Berita Unggulan**: Sorotan berita utama terkini dengan visualisasi thumbnail yang tajam.
- **📑 10 Kategori Rubrikasi Berita**:
  - Nasional, Daerah, Politik, Kriminal, Ekonomi, Pendidikan, Teknologi, Olahraga, Internasional, dan Lifestyle.
- **🔍 Fitur Pencarian & Filter Cepat**: Pencarian judul dan konten berita secara instan (`cari.html`).
- **📖 Halaman Baca Berita Lengkap**: Tampilan ramah pembaca (`artikel.html`) dilengkapi estimasi waktu baca, navigasi artikel terkait, dan form interaksi komentar pembaca.
- **🎥 Liputan Video Terkini**: Integrasi tayangan video berita langsung via player YouTube embed.
- **👥 Profil Redaksi & Tentang Kami**: Halaman struktur redaksi dan transparansi badan usaha penerbit pers (`tentang.html`).

---

## 📁 Struktur Direktori Proyek

```text
├── index.html              # Halaman Utama Portal Berita (Beranda)
├── artikel.html            # Halaman Baca Detail Berita
├── cari.html               # Halaman Pencarian Berita
├── internasional.html      # Halaman Khusus Rubrik Internasional
├── tentang.html            # Halaman Profil Redaksi & Kontak
├── database_dummy.sql      # Skema & Data Dummy MySQL Siap Import
├── assets/                 # Aset Frontend (CSS, JS, Gambar, Logo)
│   ├── css/                # Custom CSS & Tailwind
│   ├── js/                 # Client Logic & API Connector (home-live.js, search.js, dll.)
│   └── images/             # Gambar & Thumbnail Berita
├── api/                    # REST API Backend (PHP Native / Router)
└── admin/                  # CMS Pengelolaan Konten (Internal Meja Redaksi)
```

---

## 🚀 Panduan Menjalankan Secara Lokal (Quick Start)

### 1. Prasyarat
- Web Server lokal: **XAMPP**, **Laragon**, atau **PHP Built-in Server** (PHP 8.0+)
- **MySQL / MariaDB**

### 2. Setup Database (Data Dummy)
1. Buka **phpMyAdmin** (`http://localhost/phpmyadmin`).
2. Buat database baru bernama `berita_buserinfo`.
3. Pilih menu **Import**, lalu pilih file `database_dummy.sql`.
4. Klik **Import / Kirim**. Seluruh tabel dan artikel contoh siap digunakan.

> **Informasi Akun Demo (Untuk Akses Testing):**
> - **Username / Email**: `admin@buserinfo.id`
> - **Password**: `admin123`

### 3. Jalankan Aplikasi
Letakkan folder proyek di dalam direktori root server web Anda (misal `htdocs` pada XAMPP atau `www` pada Laragon), atau jalankan via CLI:
```bash
php -S localhost:8000
```
Buka browser dan akses: `http://localhost:8000`

---

## 🛡️ Lisensi & Hak Cipta
Hak Cipta dilindungi undang-undang. Dikembangkan untuk portal media digital.
