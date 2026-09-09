# Panduan Integrasi Backend CodeIgniter 4 (CI4) — BUSER INFO CMS

Dokumen ini menjelaskan struktur arsitektur dan langkah pemasangan backend **CodeIgniter 4** untuk Sistem Manajemen Konten (CMS) **BUSER INFO** (PT. GOLDENMIX MEDIA BUSERINFO).

---

## 1. Struktur Direktori CI4

```
backend_ci4/
├── app/
│   ├── Config/
│   │   └── Routes.php             # Route definitions & grouping admin
│   ├── Controllers/
│   │   └── Admin/
│   │       ├── Auth.php           # Login, Session, Logout
│   │       ├── Dashboard.php      # Ringkasan KPI, Statistik publikasi
│   │       ├── Berita.php         # CRUD Berita, Slug, Bulk Actions
│   │       ├── Kategori.php       # Manajemen 10 Rubrikasi
│   │       ├── Penulis.php        # Manajemen Wartawan & Redaktur
│   │       ├── Media.php          # Upload Foto & Dokumen
│   │       ├── Komentar.php       # Moderasi Komentar Pembaca
│   │       ├── Statistik.php      # Analisis Trafik & Top 5 Berita
│   │       ├── Pengguna.php       # Manajemen Role & Hak Akses
│   │       ├── Pengaturan.php     # Konfigurasi Portal & SEO Global
│   │       └── Profil.php         # Profil Redaksi & Ubah Password
│   ├── Database/
│   │   └── Migrations/
│   │       └── 2026-09-09-000001_CreateBuserInfoCmsTables.php
│   ├── Models/
│   │   ├── BeritaModel.php
│   │   ├── KategoriModel.php
│   │   ├── UserModel.php
│   │   ├── MediaModel.php
│   │   ├── KomentarModel.php
│   │   └── PengaturanModel.php
│   └── Views/
│       └── admin/
│           ├── layout/
│           │   ├── header.php
│           │   ├── sidebar.php
│           │   ├── navbar.php
│           │   └── footer.php
│           ├── dashboard.php
│           ├── berita/
│           ├── kategori/
│           ├── media/
│           ├── komentar/
│           ├── statistik/
│           ├── pengguna/
│           ├── pengaturan/
│           └── profil/
└── README_CI4.md
```

---

## 2. Persyaratan Sistem

* PHP 8.1 / 8.2 / 8.4
* Ekstensi PHP: `intl`, `mbstring`, `mysqli`, `curl`, `gd`
* MySQL / MariaDB 10.4+
* Composer 2.x

---

## 3. Langkah Pemasangan & Migrasi Database

### Langkah 1: Konfigurasi File `.env`
Salin file `env` menjadi `.env` pada root project CodeIgniter 4 Anda:
```ini
CI_ENVIRONMENT = development

app.baseURL = 'http://localhost:8080/'

database.default.hostname = localhost
database.default.database = buserinfo_cms
database.default.username = root
database.default.password = 
database.default.DBDriver = MySQLi
database.default.DBPrefix = 
database.default.port = 3306
```

### Langkah 2: Jalankan Migrasi Tabel
Eksekusi perintah spark untuk membuat seluruh tabel CMS secara otomatis:
```bash
php spark migrate
```
Tabel-tabel berikut akan otomatis terbuat:
1. `users`: Akun redaktur, wartawan, dan administrator.
2. `categories`: 10 kategori resmi portal BUSER INFO.
3. `news`: Berita lengkap dengan excerpt, status, view counter, dan SEO meta.
4. `media`: Arsip file media, thumbnail, caption, dan alt text.
5. `comments`: Komentar pembaca dengan sistem moderasi (pending, approved, rejected, spam).
6. `settings`: Pengaturan nama portal, kontak hotline, media sosial, dan identitas legal.

### Langkah 3: Menjalankan Server Lokal
```bash
php spark serve
```
Akses panel admin di browser melalui:
`http://localhost:8080/admin/login`

---

## 4. Akun Administrator Default (Seeder)

* **Email**: `redaksi@buserinfo.com`
* **Password**: `BuserInfo#2026`
* **Peran**: `Administrator` (Pemimpin Redaksi)

---

## 5. Sinkronisasi dengan Aset Frontend Standalone

File aset desain antarmuka berada di folder:
* CSS Desain Sistem: `admin/css/admin.css`
* JavaScript Utama: `admin/js/admin.js`
* Logo & Identitas: `assets/images/logo/buserinfo-logo.svg`
Semua file dapat langsung diakses melalui `public/admin/` atau tautan relatif portal.
