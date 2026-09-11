-- =============================================================================
-- DATABASE SCHEMA & DUMMY DATA: MySQL / MariaDB
-- Portal Berita & CMS Media (Contoh Data Dummy untuk Portfolio / Showcase)
-- Kompatibel: MySQL 5.7 / 8.0+ / MariaDB 10.4+
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `berita_buserinfo` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `berita_buserinfo`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `komentar`;
DROP TABLE IF EXISTS `artikel`;
DROP TABLE IF EXISTS `video`;
DROP TABLE IF EXISTS `profil_redaksi`;
DROP TABLE IF EXISTS `kategori`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `settings`;
SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- 1. Tabel: users (Pengguna, Redaksi, Wartawan)
-- Akun Dummy: Password semua akun adalah "admin123"
-- -----------------------------------------------------------------------------
CREATE TABLE `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nama_users` VARCHAR(150) NOT NULL,
  `email_users` VARCHAR(150) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('Administrator', 'Editor', 'Reporter') NOT NULL DEFAULT 'Reporter',
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `avatar` VARCHAR(255) DEFAULT '',
  `bio` TEXT DEFAULT NULL,
  `last_login` DATETIME DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_email` (`email_users`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password dummy hash: "admin123"
INSERT INTO `users` (`id`, `nama_users`, `email_users`, `password`, `role`, `status`, `avatar`, `bio`, `created_at`, `updated_at`) VALUES
(1, 'Admin Demo Portal', 'admin@buserinfo.id', '$2y$12$b1Vvhak/So4NrO8EKvIVKuHshXxFbg52LPgDQejrWOrRkNMXW6u/m', 'Administrator', 'active', 'assets/images/berita/nasional/pembangunan-ikn-nusantara.jpg', 'Akun Administrator Pengelola Portal Berita.', NOW(), NOW()),
(2, 'Editor Berita', 'editor@buserinfo.id', '$2y$12$b1Vvhak/So4NrO8EKvIVKuHshXxFbg52LPgDQejrWOrRkNMXW6u/m', 'Editor', 'active', '', 'Editor & Kurator Konten Berita.', NOW(), NOW()),
(3, 'Reporter Investigasi', 'reporter@buserinfo.id', '$2y$12$b1Vvhak/So4NrO8EKvIVKuHshXxFbg52LPgDQejrWOrRkNMXW6u/m', 'Reporter', 'active', '', 'Wartawan Liputan Khusus & Peristiwa.', NOW(), NOW());

-- -----------------------------------------------------------------------------
-- 2. Tabel: kategori (10 Rubrikasi Portal Berita)
-- -----------------------------------------------------------------------------
CREATE TABLE `kategori` (
  `id_kategori` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name_kategori` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(120) NOT NULL,
  `deskripsi` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_kategori`),
  UNIQUE KEY `idx_kategori_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `kategori` (`id_kategori`, `name_kategori`, `slug`, `deskripsi`) VALUES
(1, 'Nasional', 'nasional', 'Berita peristiwa, regulasi, dan dinamika sosial politik nasional Indonesia'),
(2, 'Daerah', 'daerah', 'Kabar kedaerahan, otonomi, dan laporan biro wilayah nusantara'),
(3, 'Politik', 'politik', 'Analisis dinamika keparlemenan, pemilu, dan kebijakan publik'),
(4, 'Kriminal', 'kriminal', 'Liputan investigasi tindak pidana, hukum, dan keamanan masyarakat'),
(5, 'Ekonomi', 'ekonomi', 'Pergerakan pasar modal, makroekonomi, komoditas, dan perbankan'),
(6, 'Pendidikan', 'pendidikan', 'Inovasi kurikulum, beasiswa, dan pendidikan tinggi nasional'),
(7, 'Teknologi', 'teknologi', 'Transformasi digital, kecerdasan buatan, gawai, dan keamanan siber'),
(8, 'Olahraga', 'olahraga', 'Kompetisi sepak bola, bulu tangkis, dan ajang olahraga internasional'),
(9, 'Internasional', 'internasional', 'Diplomasi global, geopolitik luar negeri, dan peristiwa mancanegara'),
(10, 'Lifestyle', 'lifestyle', 'Gaya hidup, kesehatan, seni budaya, dan tren generasi muda');

-- -----------------------------------------------------------------------------
-- 3. Tabel: artikel (Berita Lengkap)
-- -----------------------------------------------------------------------------
CREATE TABLE `artikel` (
  `id_artikel` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `kategori_id` INT UNSIGNED NOT NULL,
  `author_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `thumbnail` VARCHAR(255) DEFAULT '',
  `status` ENUM('published', 'draft', 'review', 'scheduled') NOT NULL DEFAULT 'published',
  `views` INT UNSIGNED NOT NULL DEFAULT 0,
  `published_at` DATETIME DEFAULT NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_artikel`),
  UNIQUE KEY `idx_artikel_slug` (`slug`),
  KEY `idx_artikel_kategori` (`kategori_id`),
  KEY `idx_artikel_author` (`author_id`),
  KEY `idx_artikel_status_date` (`status`, `published_at`),
  CONSTRAINT `fk_artikel_kategori` FOREIGN KEY (`kategori_id`) REFERENCES `kategori` (`id_kategori`) ON DELETE CASCADE,
  CONSTRAINT `fk_artikel_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `artikel` (`kategori_id`, `author_id`, `title`, `slug`, `content`, `thumbnail`, `status`, `views`, `published_at`, `updated_at`) VALUES
(9, 1, 'Perkembangan Dunia Internasional Menjadi Sorotan Utama Hari Ini', 'perkembangan-dunia-internasional-menjadi-sorotan-utama-hari-ini', '
      <p class="lead font-medium text-lg text-gray-800 leading-relaxed mb-4">
        <strong>JENEWA</strong> — Pertemuan tingkat tinggi perwakilan negara-negara dunia yang digelar di Jenewa memasuki fase penentuan terkait stabilitas ekonomi global serta mitigasi eskalasi sengketa lintas kawasan. Kesepakatan strategis yang dinegosiasikan selama empat hari penuh tersebut dinilai para pengamat sebagai titik balik penting dalam menjaga keseimbangan tatanan internasional.
      </p>
      
      <p class="mb-4 text-gray-700 leading-relaxed">
        Dalam agenda persidangan yang dihadiri perwakilan lebih dari 40 negara tersebut, isu ketahanan pangan serta keamanan jalur pelayaran komersial internasional menjadi fokus perdebatan yang paling menyita perhatian. Krisis rantai pasok dunia dalam beberapa bulan terakhir mendorong dibentuknya mekanisme respons cepat antarnegara guna menjamin transparansi distribusi kebutuhan vital.
      </p>

      <blockquote class="my-6 p-4 border-l-4 border-buser-red bg-red-50 italic text-gray-800 font-serif text-lg">
        \"Kami memandang bahwa de-eskalasi dan dialog terbuka tanpa syarat praduga adalah satu-satunya jalan keluar yang bermartabat bagi semua pihak demi menjamin kesejahteraan rakyat di berbagai belahan bumi,\" tegas salah seorang perwakilan delegasi utama dalam pidato resminya.
      </blockquote>

      <h3 class="text-xl font-bold text-black mt-6 mb-3">Peta Jalan Diplomasi dan Relevansinya bagi Asia Tenggara</h3>
      <p class="mb-4 text-gray-700 leading-relaxed">
        Bagi kawasan Asia Tenggara, rumusan komitmen bersama ini membawa kepastian iklim investasi dan keberlanjutan perdagangan logistik maritim. Indonesia melalui delegasi resminya menggarisbawahi posisi netral dan aktif, mendorong agar forum internasional tidak sekadar menghasilkan deklarasi normatif melainkan implementasi konkret di lapangan.
      </p>

      <p class="mb-4 text-gray-700 leading-relaxed">
        Sejumlah pakar hubungan internasional yang memantau jalannya KTT menyatakan optimisme terukur. Kendati perbedaan pandangan pada klausul sanksi perdagangan masih memerlukan harmonisasi lebih mendalam, pencapaian naskah konsensus awal telah meredakan kekhawatiran spekulasi pasar global.
      </p>

      <h3 class="text-xl font-bold text-black mt-6 mb-3">Tindak Lanjut Sidang Pekan Depan</h3>
      <p class="mb-4 text-gray-700 leading-relaxed">
        Tahapan teknis implementasi keputusan dijadwalkan mulai diratifikasi oleh komite kerja pada awal pekan mendatang. Media internasional dan lembaga riset independen terus memantau pemenuhan komitmen ini untuk memastikan kesepakatan tidak terhenti sebatas tanda tangan seremonial belaka.
      </p>
    ', 'assets/images/berita/internasional/diplomasi-ktt-global.jpg', 'published', 48210, '2026-09-11 04:09:35', NOW()),
(9, 1, 'Negosiasi Perjanjian Iklim Global Hasilkan Komitmen Dana Hijau bagi Negara Berkembang', 'negosiasi-perjanjian-iklim-global-hasilkan-komitmen-dana-hijau', '<p class="mb-4">Komitmen pembiayaan hijau disepakati dengan nilai awal puluhan miliar dollar untuk mendukung transisi energi ramah lingkungan di negara-negara kepulauan dan kawasan tropis dunia.</p>', 'assets/images/berita/internasional/krisis-energi-eropa.jpg', 'published', 23410, '2026-09-11 03:09:35', NOW()),
(9, 1, 'Dinamika Pemilu Parlemen Negara Maju: Polarisasi Isu Ekonomi dan Keamanan Perbatasan', 'dinamika-pemilu-parlemen-negara-maju-polarisasi-isu-ekonomi', '<p class="mb-4">Perhelatan pemilu parlemen di beberapa negara utama menarik perhatian dunia karena diprediksi akan mengubah arah kebijakan kerja sama luar negeri serta perdagangan bilateral.</p>', 'assets/images/berita/internasional/pemilu-amerika-serikat.jpg', 'published', 19850, '2026-09-11 02:09:35', NOW()),
(9, 1, 'Upaya De-eskalasi Konflik Regional: Koridor Kemanusiaan Internasional Resmi Dibuka', 'upaya-de-eskalasi-konflik-regional-koridor-kemanusiaan-resmi-dibuka', '<p class="mb-4">Setelah pembicaraan maraton di bawah naungan dewan keamanan, koridor perlindungan warga sipil akhirnya beroperasi penuh guna menyalurkan pasokan obat-obatan esensial.</p>', 'assets/images/berita/internasional/konflik-timur-tengah.jpg', 'published', 31200, '2026-09-11 01:09:35', NOW()),
(1, 1, 'Pemerintah Terbitkan Kebijakan Strategis Percepatan Akselerasi Digital Layanan Publik', 'pemerintah-terbitkan-kebijakan-strategis-percepatan-akselerasi-digital', '<p class="mb-4">Kebijakan percepatan integrasi data ini menjadi tonggak reformasi birokrasi Indonesia untuk memastikan bantuan sosial dan izin berusaha berjalan tepat sasaran dan transparan.</p>', 'assets/images/berita/nasional/konferensi-pers-istana.jpg', 'published', 35800, '2026-09-11 00:09:35', NOW()),
(1, 1, 'Pembangunan IKN Nusantara Masuki Tahap Fasilitas Sosial, Rumah Sakit dan Kampus Beroperasi', 'pembangunan-ikn-nusantara-masuki-tahap-fasilitas-sosial', '<p class="mb-4">Pembangunan tahap lanjutan ibu kota baru menunjukkan progres signifikan dengan hadirnya fasilitas kesehatan modern dan kampus riset teknologi terapan.</p>', 'assets/images/berita/nasional/pembangunan-ikn-nusantara.jpg', 'published', 28900, '2026-09-10 23:09:35', NOW()),
(1, 1, 'Optimalisasi Subsidi Energi Tepat Sasaran Gunakan Registrasi Digital Berbasis NIK', 'optimalisasi-subsidi-energi-tepat-sasaran-gunakan-registrasi-digital', '<p class="mb-4">Skema distribusi subsidi berbasis data terpadu dinilai mampu menghemat puluhan triliun rupiah anggaran belanja negara dari potensi penyalahgunaan komersial.</p>', 'assets/images/berita/nasional/kebijakan-subsidi-bbm.jpg', 'published', 22140, '2026-09-10 22:09:35', NOW()),
(1, 1, 'Pemberantasan Mafia Tanah, Satgas Gabungan Kembalikan Ratusan Hektar Hak Warga Adat', 'pemberantasan-mafia-tanah-satgas-gabungan-kembalikan-ratusan-hektar', '<p class="mb-4">Langkah tegas Kementerian ATR/BPN dalam menindak oknum sindikat pertanahan mendapat sambutan positif dari berbagai elemen lembaga swadaya masyarakat.</p>', 'assets/images/berita/nasional/reformasi-birokrasi-kementerian.jpg', 'published', 18400, '2026-09-10 21:09:35', NOW()),
(4, 1, 'Rilis Mabes Polri Ungkap Jaringan Sindikat Penipuan Digital Antarprovinsi Senilai Puluhan Miliar', 'rilis-mabes-polri-ungkap-jaringan-sindikat-penipuan-digital', '<p class="mb-4">Direktorat Tindak Pidana Siber Bareskrim Polri mengungkap modus operandi baru sniffing aplikasi phising yang menyasar nasabah perbankan secara masif lintas pulau.</p>', 'assets/images/berita/kriminal/rilis-mabes-polri.jpg', 'published', 44300, '2026-09-10 20:09:35', NOW()),
(4, 1, 'Sidang Tipikor di Pengadilan Negeri: Jaksa Tuntut Mantan Pejabat 12 Tahun Penjara', 'sidang-tipikor-pn-jaksa-tuntut-mantan-pejabat-12-tahun', '<p class="mb-4">Majelis hakim menyatakan persidangan akan dilanjutkan pekan depan dengan agenda pembacaan nota pembelaan (pledoi) dari tim penasihat hukum terdakwa.</p>', 'assets/images/berita/kriminal/sidang-tipikor-pn.jpg', 'published', 26800, '2026-09-10 19:09:35', NOW()),
(4, 1, 'BNN dan Bea Cukai Gagalkan Penyelundupan Ratusan Kilogram Narkotika Jalur Selat Malaka', 'bnn-bea-cukai-gagalkan-penyelundupan-narkotika-selat-malaka', '<p class="mb-4">Pencegahan ini berhasil menyelamatkan jutaan generasi muda dari bahaya ketergantungan zat terlarang yang dipasok sindikat antarnegara.</p>', 'assets/images/berita/kriminal/penangkapan-sindikat-narkoba.jpg', 'published', 29700, '2026-09-10 18:09:35', NOW()),
(4, 1, 'Polda Metro Jaya Bekuk Pelaku Curanmor Modus Kunci Duplikat dan Magnet Canggih', 'polda-metro-jaya-bekuk-pelaku-curanmor-modus-kunci-duplikat', '<p class="mb-4">Polisi menghimbau masyarakat untuk melengkapi kendaraan roda dua dengan pengaman ganda dan mengaktifkan sistem GPS pelacak.</p>', 'assets/images/berita/kriminal/razia-cyber-crime.jpg', 'published', 16500, '2026-09-10 17:09:35', NOW()),
(3, 1, 'Sidang Paripurna DPR Bahas Penyesuaian Anggaran Belanja Negara dan Pengawasan APBN', 'sidang-paripurna-dpr-bahas-penyesuaian-anggaran-belanja-negara', '<p class="mb-4">Sidang paripurna yang dipimpin pimpinan dewan menekankan efektivitas penyerapan dana transfer ke daerah guna mempercepat pemerataan pembangunan pelosok negeri.</p>', 'assets/images/berita/politik/sidang-paripurna-dpr.jpg', 'published', 39600, '2026-09-10 16:09:35', NOW()),
(3, 1, 'Konsolidasi Koalisi Partai Jelang Pilkada Serentak Perkuat Strategi Pemenangan Daerah', 'konsolidasi-koalisi-partai-jelang-pilkada-serentak', '<p class="mb-4">Komunikasi politik yang dinamis diharapkan melahirkan kontestasi yang sehat, demokratis, dan menyejukkan iklim persatuan bangsa.</p>', 'assets/images/berita/politik/koalisi-partai-politik.jpg', 'published', 21500, '2026-09-10 15:09:35', NOW()),
(3, 1, 'KPU Pastikan Sistem Sirekap Versi Terbaru Lebih Transparan dan Tahan Serangan Siber', 'kpu-pastikan-sistem-sirekap-versi-terbaru-lebih-transparan', '<p class="mb-4">KPU menjamin masyarakat dan saksi dari seluruh peserta dapat mengunduh formulir C hasil secara langsung dan real-time tanpa penundaan.</p>', 'assets/images/berita/politik/revisi-uu-pilkada.jpg', 'published', 17800, '2026-09-10 14:09:35', NOW()),
(3, 1, 'Bawaslu Siagakan Sentra Gakkumdu untuk Tindak Cepat Pelanggaran Netralitas ASN', 'bawaslu-siagakan-sentra-gakkumdu-tindak-netralitas-asn', '<p class="mb-4">Sentra penegakan hukum terpadu berkomitmen memproses seluruh laporan tanpa diskriminasi sesuai aturan perundang-undangan.</p>', 'assets/images/berita/politik/pertemuan-petinggi-partai.jpg', 'published', 14200, '2026-09-10 13:09:35', NOW()),
(5, 1, 'BI Catat Surplus Neraca Dagang dan Penguatan Kurs Rupiah Ditopang Kinerja Ekspor', 'bi-catat-surplus-neraca-dagang-dan-penguatan-kurs-rupiah', '<p class="mb-4">Gubernur Bank Indonesia menyampaikan bahwa fundamental moneter Indonesia terjaga dengan baik didukung stabilitas suku bunga acuan dan devisa hasil ekspor.</p>', 'assets/images/berita/ekonomi/bursa-efek-perdagangan.jpg', 'published', 32400, '2026-09-10 12:09:35', NOW()),
(5, 1, 'Digitalisasi UMKM Catat Lonjakan Omzet: Pemanfaatan QRIS Antarnegara Terus Diperluas', 'digitalisasi-umkm-catat-lonjakan-omzet-qris-antarnegara', '<p class="mb-4">Kemudahan adopsi teknologi pembayaran digital menjadi motor penggerak perputaran modal usaha mikro di daerah destinasi wisata utama.</p>', 'assets/images/berita/ekonomi/pertumbuhan-umkm-digital.jpg', 'published', 24100, '2026-09-10 11:09:35', NOW()),
(5, 1, 'Hilirisasi Industri Pertambangan Dongkrak Nilai Tambah Ekspor dan Lapangan Kerja', 'hilirisasi-industri-pertambangan-dongkrak-nilai-tambah', '<p class="mb-4">Kebijakan hilirisasi terbukti meningkatkan daya saing produk manufaktur olahan Indonesia di kancah pasar ekspor Eropa dan Asia Timur.</p>', 'assets/images/berita/ekonomi/ekspor-komoditas-sawit.jpg', 'published', 19300, '2026-09-10 10:09:35', NOW()),
(5, 1, 'OJK Luncurkan Regulasi Perlindungan Konsumen Terhadap Praktik Pinjaman Ilegal', 'ojk-luncurkan-regulasi-perlindungan-konsumen-pinjol-ilegal', '<p class="mb-4">Satgas Pemberantasan Aktivitas Keuangan Ilegal telah memblokir ratusan entitas tanpa izin demi menjaga rasa aman masyarakat peminjam.</p>', 'assets/images/berita/ekonomi/inflasi-bank-indonesia.jpg', 'published', 27600, '2026-09-10 09:09:35', NOW()),
(2, 1, 'Proyek Konektivitas LRT dan Jalan Tol Lintas Sumatera Dikebut untuk Dongkrak Logistik', 'proyek-konektivitas-lrt-dan-jalan-tol-lintas-sumatera-dikebut', '<p class="mb-4">Konektivitas terpadu ini memangkas biaya transportasi logistik hasil bumi dari perkebunan Banyuasin dan Musi Banyuasin menuju pelabuhan laut utama secara drastis.</p>', 'assets/images/berita/daerah/infrastruktur-lrt-sumsel.jpg', 'published', 38100, '2026-09-10 08:09:35', NOW()),
(2, 1, 'Pemkab Banyuasin Revitalisasi Dermaga Sungai dan Pasilitasi Nelayan Sentra Ikan Asin', 'pemkab-banyuasin-revitalisasi-dermaga-sungai-sentra-ikan', '<p class="mb-4">Inisiatif ini dirancang guna meningkatkan taraf hidup ribuan kepala keluarga nelayan dan pembudidaya tambak di pesisir Tanah Mas dan Sungsang.</p>', 'assets/images/berita/daerah/revitalisasi-pelabuhan-banyuasin.jpg', 'published', 15900, '2026-09-10 07:09:35', NOW()),
(2, 1, 'Festival Budaya Sriwijaya Hadirkan Ribuan Wisatawan, Angkat Seni Songket dan Dulmuluk', 'festival-budaya-sriwijaya-hadirkan-ribuan-wisatawan', '<p class="mb-4">Festival ini kembali meneguhkan kekayaan khazanah budaya Melayu dan tradisi pesisir sebagai warisan luhur yang menarik minat turis mancanegara.</p>', 'assets/images/berita/daerah/festival-budaya-palembang.jpg', 'published', 20400, '2026-09-10 06:09:35', NOW()),
(2, 1, 'Kesiapsiagaan Tanggap Bencana: BPBD Pasang Sensor Dini Peringatan Banjir di Das Sungai', 'kesiapsiagaan-tanggap-bencana-bpbd-pasang-sensor-banjir', '<p class="mb-4">Data sensor terintegrasi langsung dengan ponsel pintar kepala desa sehingga evakuasi dapat dilaksanakan secara dini dan terkoordinasi rapi.</p>', 'assets/images/berita/daerah/penanganan-banjir-sumatera.jpg', 'published', 12800, '2026-09-10 05:09:35', NOW()),
(7, 1, 'Pusat Keamanan Siber Nasional Gandeng Kampus Bentuk Pasukan Pertahanan Cyber Cerdas', 'pusat-keamanan-siber-nasional-gandeng-kampus', '<p class="mb-4">Penguatan infrastruktur pusat data nasional menuntut ketersediaan analis keamanan informasi yang andal dan berdaya saing global.</p>', 'assets/images/berita/teknologi/pusat-keamanan-siber.jpg', 'published', 27300, '2026-09-10 04:09:35', NOW()),
(7, 1, 'Pemerintah Rancang Pedoman Etika dan Regulasi Pemanfaatan AI Generatif di Indonesia', 'pemerintah-rancang-pedoman-etika-regulasi-ai-generatif', '<p class="mb-4">Pedoman ini bertujuan menyeimbangkan inovasi teknologi dengan perlindungan hak cipta pencipta konten asli di Indonesia.</p>', 'assets/images/berita/teknologi/regulasi-ai-indonesia.jpg', 'published', 19900, '2026-09-10 03:09:35', NOW()),
(8, 1, 'Pebulutangkis Merah Putih Tembus Final Turnamen Dunia Usai Duel Sengit Tiga Gim', 'pebulutangkis-merah-putih-tembus-final-turnamen-dunia', '<p class="mb-4">Kemenangan dramatis ini membuktikan kesiapan mental bertanding para atlet pelatnas menjelang ajang multi-event prestisius mendatang.</p>', 'assets/images/berita/olahraga/final-bulutangkis-dunia.jpg', 'published', 41200, '2026-09-10 02:09:35', NOW()),
(8, 1, 'Timnas Sepak Bola Matangkan Taktik Serangan Balik Cepat Hadapi Lanjutan Kualifikasi', 'timnas-sepak-bola-matangkan-taktik-kualifikasi', '<p class="mb-4">Dukungan penuh suporter menjadi modal moral besar bagi skuad garuda untuk memetik tiga poin krusial di kandang sendiri.</p>', 'assets/images/berita/olahraga/kualifikasi-piala-dunia-timnas.jpg', 'published', 37800, '2026-09-10 01:09:35', NOW()),
(6, 1, 'Perguruan Tinggi Perluas Program Magang Terintegrasi Industri dengan Rekognisi 20 SKS', 'perguruan-tinggi-perluas-program-magang-terintegrasi-industri', '<p class="mb-4">Skema kurikulum terapan ini terbukti memperpendek masa tunggu lulusan untuk memperoleh pekerjaan pertama yang relevan dengan bidang ilmu.</p>', 'assets/images/berita/pendidikan/wisuda-universitas-negeri.jpg', 'published', 16700, '2026-09-10 00:09:35', NOW()),
(10, 1, 'Tren Pola Makan Sehat Berbasis Pangan Lokal: Manfaat Sorgum dan Umbi-umbian Nusantara', 'tren-pola-makan-sehat-pangan-lokal-sorgum-umbi', '<p class="mb-4">Pemanfaatan kekayaan hayati nusantara tidak hanya menyehatkan tubuh tetapi juga mendukung keberlanjutan ekonomi petani lokal.</p>', 'assets/images/berita/ekonomi/pertumbuhan-umkm-digital.jpg', 'published', 14500, '2026-09-09 23:09:35', NOW());

-- -----------------------------------------------------------------------------
-- 4. Tabel: video (YouTube Embeds)
-- -----------------------------------------------------------------------------
CREATE TABLE `video` (
  `id_video` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `youtube_url` VARCHAR(255) NOT NULL,
  `youtube_id` VARCHAR(50) NOT NULL,
  `caption` TEXT DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_video`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `video` (`id_video`, `title`, `youtube_url`, `youtube_id`, `caption`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Liputan Khusus: Mengawal Ketahanan Pangan dan Geopolitik Regional', 'https://www.youtube.com/watch?v=ScMzIvxBSi4', 'ScMzIvxBSi4', 'Liputan investigasi mendalam tim berita menyoroti perkembangan stabilitas logistik maritim dan kebijakan pangan nasional.', 1, NOW(), NOW()),
(2, 'Presisi Pengamanan: Detik-detik Pengungkapan Kasus Kejahatan Siber', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ', 'Dokumentasi eksklusif operasi penindakan membongkar jaringan penipuan daring lintas daerah dengan total aset bernilai miliaran rupiah.', 1, NOW(), NOW());

-- -----------------------------------------------------------------------------
-- 5. Tabel: komentar (Moderasi & Komentar Pembaca)
-- -----------------------------------------------------------------------------
CREATE TABLE `komentar` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `artikel_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `comment` TEXT NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected', 'spam') NOT NULL DEFAULT 'pending',
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_komentar_artikel` (`artikel_id`),
  KEY `idx_komentar_status` (`status`),
  CONSTRAINT `fk_komentar_artikel` FOREIGN KEY (`artikel_id`) REFERENCES `artikel` (`id_artikel`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `komentar` (`id`, `artikel_id`, `name`, `email`, `comment`, `status`, `ip_address`, `created_at`, `updated_at`) VALUES
(1, 1, 'Budi Pratama', 'budi.pratama@example.com', 'Artikel yang sangat informatif dan membuka wawasan terkait diplomasi global saat ini.', 'approved', '127.0.0.1', NOW(), NOW()),
(2, 1, 'Siti Nurhaliza', 'siti.nurhaliza@example.com', 'Semoga ada solusi nyata dari KTT tersebut untuk stabilitas pangan dunia.', 'approved', '127.0.0.1', NOW(), NOW());

-- -----------------------------------------------------------------------------
-- 6. Tabel: profil_redaksi (Susunan Redaksi Demo)
-- -----------------------------------------------------------------------------
CREATE TABLE `profil_redaksi` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nama` VARCHAR(150) NOT NULL,
  `jabatan` VARCHAR(150) NOT NULL,
  `kategori` VARCHAR(100) DEFAULT 'Redaksi',
  `keterangan` VARCHAR(255) DEFAULT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `telepon` VARCHAR(50) DEFAULT NULL,
  `foto` VARCHAR(255) DEFAULT NULL,
  `urutan` INT DEFAULT 0,
  `status` VARCHAR(20) DEFAULT 'active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_profil_urutan` (`urutan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `profil_redaksi` (`id`, `nama`, `jabatan`, `kategori`, `keterangan`, `email`, `telepon`, `foto`, `urutan`, `status`, `created_at`, `updated_at`) VALUES
(1, 'H. M. Farhan, S.H., M.H.', 'Penasihat Hukum', 'Penasihat & Pembina', 'Konsultan Hukum & Regulasi Media', 'hukum@example.com', '0812-3456-7890', '', 1, 'active', NOW(), NOW()),
(2, 'Ir. Hendra Gunawan', 'Pemimpin Umum', 'Pimpinan Perusahaan', 'Manajemen & Tata Kelola Perusahaan', 'pimpinan@example.com', '0812-3456-7890', '', 2, 'active', NOW(), NOW()),
(3, 'Bambang Sudiro, M.I.Kom.', 'Pemimpin Redaksi', 'Pimpinan Redaksi', 'Penanggung Jawab Keredaksian', 'pemred@example.com', '0812-3456-7890', '', 3, 'active', NOW(), NOW()),
(4, 'Fauzi Ramadhan', 'Redaktur Pelaksana', 'Redaktur', 'Koordinator Meja Redaksi', 'redaktur@example.com', '0812-3456-7890', '', 4, 'active', NOW(), NOW()),
(5, 'Chandra Wijaya', 'Redaktur Kriminal & Investigasi', 'Redaktur', 'Liputan Investigasi Khusus', 'investigasi@example.com', '0812-3456-7890', '', 5, 'active', NOW(), NOW()),
(6, 'Fajar Nugroho, S.Sos.', 'Redaktur Politik & Pemerintahan', 'Redaktur', 'Koresponden Kebijakan Publik', 'politik@example.com', '0812-3456-7890', '', 6, 'active', NOW(), NOW()),
(7, 'Hendra Saputra', 'Koordinator Liputan Daerah', 'Biro & Perwakilan Daerah', 'Biro Wilayah & Daerah', 'daerah@example.com', '0812-3456-7890', '', 7, 'active', NOW(), NOW()),
(8, 'M. Rizky Pratama, S.E.', 'Redaktur Ekonomi & Bisnis', 'Redaktur', 'Analis Pasar Modal & Finansial', 'ekonomi@example.com', '0812-3456-7890', '', 8, 'active', NOW(), NOW()),
(9, 'Kevin Adityawarman', 'Teknologi & Multimedia', 'Teknologi & Multimedia', 'Infrastruktur Web & Keamanan Digital', 'tech@example.com', '0812-3456-7890', '', 9, 'active', NOW(), NOW());

-- -----------------------------------------------------------------------------
-- 7. Tabel: settings (Pengaturan Global Portal)
-- -----------------------------------------------------------------------------
CREATE TABLE `settings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` TEXT DEFAULT NULL,
  `group` VARCHAR(50) DEFAULT 'general',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `settings` (`setting_key`, `setting_value`, `group`) VALUES
('site_title', 'BUSER INFO — Portal Berita & Informasi Terkini', 'general'),
('site_description', 'Portal Berita Terpercaya Menyajikan Informasi Terkini, Nasional, Daerah, Hukum, Ekonomi, dan Internasional.', 'general'),
('company_name', 'PT. MEDIA NUSANTARA BUSERINFO', 'company'),
('hotline_phone', '0812-3456-7890', 'contact'),
('redaksi_email', 'redaksi@buserinfo.id', 'contact'),
('office_address', 'Gedung Pers Graha Media Lt. 5, Jl. Jenderal Sudirman Kav. 21, Jakarta Pusat, DKI Jakarta', 'contact');
