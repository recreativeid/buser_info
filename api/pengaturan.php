<?php
/**
 * REST API Endpoint: Manajemen Pengaturan Portal & Konfigurasi Sistem
 * Portal Berita & CMS BUSER INFO (PT. GOLDENMIX MEDIA BUSERINFO)
 * Table: settings
 */

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/config/database.php';

setCorsHeaders();

$db = Database::getConnection();

// Pastikan skema tabel settings siap dan terisi nilai awal
ensureSettingsSchemaAndData($db);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

switch ($method) {
    case 'GET':
        handleGetSettings($db);
        break;
    case 'POST':
        $override = $_POST['_method'] ?? $_GET['_method'] ?? null;
        if ($override === 'PUT') {
            handleUpdateSettings($db);
        } elseif ($override === 'DELETE') {
            handleDeleteItem($db);
        } else {
            handlePostSettings($db);
        }
        break;
    case 'PUT':
        handleUpdateSettings($db);
        break;
    case 'DELETE':
        handleDeleteItem($db);
        break;
    default:
        sendResponse(false, 'Metode HTTP tidak didukung', null, 405);
}

/**
 * Pastikan tabel settings ada dan memiliki kolom dengan ukuran teks yang cukup
 */
function ensureSettingsSchemaAndData(PDO $db): void {
    try {
        $db->exec("
            CREATE TABLE IF NOT EXISTS `settings` (
                `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
                `setting_key` VARCHAR(100) NOT NULL,
                `setting_value` LONGTEXT DEFAULT NULL,
                `group` VARCHAR(50) DEFAULT 'general',
                `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                UNIQUE KEY `idx_setting_key` (`setting_key`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // Upgrade kolom setting_value ke LONGTEXT jika masih VARCHAR/TEXT biasa
        try {
            $db->exec("ALTER TABLE `settings` MODIFY COLUMN `setting_value` LONGTEXT DEFAULT NULL;");
        } catch (PDOException $e) {
            // Abaikan jika sudah LONGTEXT
        }

        // Nilai awal jika belum pernah diinisialisasi
        $defaultSettings = [
            'site_name' => [
                'value' => 'BUSER INFO',
                'group' => 'identity'
            ],
            'site_tagline' => [
                'value' => 'Berita Terkini, Fakta Tanpa Batas',
                'group' => 'identity'
            ],
            'company_name' => [
                'value' => 'PT. GOLDENMIX MEDIA BUSERINFO',
                'group' => 'company'
            ],
            'company_legal' => [
                'value' => 'AHU.008226.AH.01.31.TAHUN.2023 • NIB.0208230150016',
                'group' => 'company'
            ],
            'site_logo' => [
                'value' => 'assets/images/logo/Logo_BuserInfo.png',
                'group' => 'identity'
            ],
            'site_description' => [
                'value' => 'Portal berita digital terdepan di Indonesia yang menyajikan informasi terkini, akurat, tajam, dan tepercaya seputar peristiwa nasional, hukum, kriminal, dan politik.',
                'group' => 'identity'
            ],
            'default_author' => [
                'value' => 'Bambang Sudiro, S.I.Kom. (Pemimpin Redaksi)',
                'group' => 'editorial'
            ],
            'default_category' => [
                'value' => 'Nasional',
                'group' => 'editorial'
            ],
            'require_editor_review' => [
                'value' => '1',
                'group' => 'editorial'
            ],
            'enable_comment_moderation' => [
                'value' => '1',
                'group' => 'editorial'
            ],
            'show_update_timestamp' => [
                'value' => '1',
                'group' => 'editorial'
            ],
            'hotline_phone' => [
                'value' => '+62 831-7298-8502',
                'group' => 'contact'
            ],
            'redaksi_email' => [
                'value' => 'redaksi@buserinfo.com',
                'group' => 'contact'
            ],
            'iklan_email' => [
                'value' => 'iklan@buserinfo.com',
                'group' => 'contact'
            ],
            'office_address' => [
                'value' => 'Gedung Graha Media Utama Lt. 4, Jl. Jenderal Sudirman Kav. 28, Jakarta Pusat 10210, Indonesia.',
                'group' => 'contact'
            ],
            'meta_title' => [
                'value' => 'BUSER INFO — Berita Terkini, Fakta Tanpa Batas',
                'group' => 'seo'
            ],
            'meta_description' => [
                'value' => 'Portal berita digital Indonesia menyajikan informasi terkini, aktual, tajam, dan terpercaya seputar peristiwa nasional, politik, hukum, kriminal, ekonomi, dan internasional.',
                'group' => 'seo'
            ],
            'meta_keywords' => [
                'value' => 'buser info, berita terkini, kriminal, hukum, politik, nasional, indonesia',
                'group' => 'seo'
            ],
            'two_factor_auth' => [
                'value' => '1',
                'group' => 'security'
            ],
            'session_timeout' => [
                'value' => '30 Menit',
                'group' => 'security'
            ],
            'social_media' => [
                'value' => json_encode([
                    [
                        'id' => 1,
                        'platform' => 'Facebook',
                        'name' => 'Buser Info Resmi',
                        'url' => 'https://www.facebook.com/profile.php?id=61573928158742',
                        'status' => 'active',
                        'note' => 'Halaman Facebook Resmi Berita Terkini'
                    ],
                    [
                        'id' => 2,
                        'platform' => 'TikTok',
                        'name' => '@burusergapinfo2023',
                        'url' => 'https://www.tiktok.com/@burusergapinfo2023?_r=1&_t=ZS-99ZqoDzX5st',
                        'status' => 'active',
                        'note' => 'Video Liputan Singkat & Berita Investigasi'
                    ],
                    [
                        'id' => 3,
                        'platform' => 'Instagram',
                        'name' => '@buserinfo.official',
                        'url' => 'https://instagram.com/buserinfo.official',
                        'status' => 'active',
                        'note' => 'Info Grafis & Kabar Viral Terhangat'
                    ],
                    [
                        'id' => 4,
                        'platform' => 'YouTube',
                        'name' => 'BUSER INFO TV Official',
                        'url' => 'https://youtube.com/@buserinfotv',
                        'status' => 'active',
                        'note' => 'Live Streaming & Liputan Khusus Investigasi'
                    ],
                    [
                        'id' => 5,
                        'platform' => 'X',
                        'name' => '@buserinfo_id',
                        'url' => 'https://x.com/buserinfo_id',
                        'status' => 'active',
                        'note' => 'Kicauan Cepat & Breaking News'
                    ],
                    [
                        'id' => 6,
                        'platform' => 'WhatsApp Channel',
                        'name' => 'Saluran Resmi BUSER INFO',
                        'url' => 'https://whatsapp.com/channel/buserinfo',
                        'status' => 'active',
                        'note' => 'Pemberitahuan Berita Utama Langsung ke WA'
                    ]
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'group' => 'social'
            ],
            'office_contacts' => [
                'value' => json_encode([
                    [
                        'id' => 1,
                        'unit' => 'Meja Redaksi & Laporan Investigasi',
                        'type' => 'WhatsApp',
                        'contact' => '+62 831-7298-8502',
                        'hours' => 'Setiap Hari 24 Jam Penuh',
                        'status' => 'active'
                    ],
                    [
                        'id' => 2,
                        'unit' => 'Sekretariat Redaksi & Pemberitaan',
                        'type' => 'Email',
                        'contact' => 'redaksi@buserinfo.com',
                        'hours' => 'Senin - Sabtu 08:00 - 18:00 WIB',
                        'status' => 'active'
                    ],
                    [
                        'id' => 3,
                        'unit' => 'Divisi Iklan & Kerjasama Usaha',
                        'type' => 'Email',
                        'contact' => 'iklan@buserinfo.com',
                        'hours' => 'Senin - Jumat 09:00 - 17:00 WIB',
                        'status' => 'active'
                    ],
                    [
                        'id' => 4,
                        'unit' => 'Layanan Hak Jawab & Klarifikasi Hukum',
                        'type' => 'Telepon',
                        'contact' => '+62 831-7298-8502',
                        'hours' => 'Hari Kerja 09:00 - 16:00 WIB',
                        'status' => 'active'
                    ],
                    [
                        'id' => 5,
                        'unit' => 'Biro Daerah Sumatera Selatan',
                        'type' => 'Alamat',
                        'contact' => 'Komplek Bandara Residence Blok C-08, Sukarami, Palembang',
                        'hours' => 'Hari Kerja 08:30 - 17:00 WIB',
                        'status' => 'active'
                    ]
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'group' => 'contact'
            ],
            'blocked_words' => [
                'value' => json_encode([
                    [
                        'id' => 1,
                        'word' => 'slot gacor',
                        'category' => 'Judi Online & Slot',
                        'action' => 'Tolak Komentar',
                        'status' => 'active'
                    ],
                    [
                        'id' => 2,
                        'word' => 'judi online',
                        'category' => 'Judi Online & Slot',
                        'action' => 'Tolak Komentar',
                        'status' => 'active'
                    ],
                    [
                        'id' => 3,
                        'word' => 'togel online',
                        'category' => 'Judi Online & Slot',
                        'action' => 'Tolak Komentar',
                        'status' => 'active'
                    ],
                    [
                        'id' => 4,
                        'word' => 'penipu',
                        'category' => 'Pencemaran & Ujaran Kasar',
                        'action' => 'Sensor Bintang',
                        'status' => 'active'
                    ],
                    [
                        'id' => 5,
                        'word' => 'pinjol cair',
                        'category' => 'Spam & Penipuan',
                        'action' => 'Tolak Komentar',
                        'status' => 'active'
                    ],
                    [
                        'id' => 6,
                        'word' => 'anjing',
                        'category' => 'Kata Kasar & Makian',
                        'action' => 'Sensor Bintang',
                        'status' => 'active'
                    ]
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'group' => 'editorial'
            ],
            'seo_tags' => [
                'value' => json_encode([
                    [
                        'id' => 1,
                        'service' => 'Google Search Console',
                        'tag_code' => 'google-site-verification=abc123xyz890buserinfo',
                        'note' => 'Verifikasi Kepemilikan Domain Web',
                        'status' => 'active'
                    ],
                    [
                        'id' => 2,
                        'service' => 'Google Analytics 4',
                        'tag_code' => 'G-BUSERINFO26',
                        'note' => 'Pelacakan Pengunjung Portal Berita',
                        'status' => 'active'
                    ],
                    [
                        'id' => 3,
                        'service' => 'Bing Webmaster Tools',
                        'tag_code' => 'msvalidate.01=9F8E7D6C5B4A3',
                        'note' => 'Indeksasi Mesin Pencari Microsoft Bing',
                        'status' => 'active'
                    ]
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'group' => 'seo'
            ],
            'security_ips' => [
                'value' => json_encode([
                    [
                        'id' => 1,
                        'ip' => '127.0.0.1',
                        'rule_type' => 'Izinkan Akses',
                        'note' => 'Server Lokal Pengembang',
                        'status' => 'active'
                    ],
                    [
                        'id' => 2,
                        'ip' => '103.144.12.0/24',
                        'rule_type' => 'Izinkan Akses',
                        'note' => 'Jaringan Kantor Redaksi Pusat Jakarta',
                        'status' => 'active'
                    ],
                    [
                        'id' => 3,
                        'ip' => '185.220.101.5',
                        'rule_type' => 'Blokir Akses',
                        'note' => 'Indikasi Percobaan Masuk Ilegal',
                        'status' => 'active'
                    ]
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'group' => 'security'
            ]
        ];

        $ins = $db->prepare("
            INSERT INTO `settings` (`setting_key`, `setting_value`, `group`)
            VALUES (:key, :val, :grp)
            ON DUPLICATE KEY UPDATE `group` = VALUES(`group`)
        ");

        foreach ($defaultSettings as $k => $item) {
            $chk = $db->prepare("SELECT COUNT(*) FROM `settings` WHERE `setting_key` = :k");
            $chk->execute([':k' => $k]);
            if ((int)$chk->fetchColumn() === 0) {
                $ins->execute([
                    ':key' => $k,
                    ':val' => $item['value'],
                    ':grp' => $item['group']
                ]);
            }
        }
    } catch (PDOException $e) {
        // Lanjutkan
    }
}

/**
 * 1. GET: Ambil Seluruh Data Pengaturan Portal
 */
function handleGetSettings(PDO $db): void {
    $action = $_GET['action'] ?? '';

    // Ambil item array spesifik (misal hanya social_media atau blocked_words)
    if ($action === 'get_items') {
        $key = trim($_GET['key'] ?? '');
        if (empty($key)) {
            sendResponse(false, 'Parameter key tidak boleh kosong', null, 400);
        }

        try {
            $stmt = $db->prepare("SELECT setting_value FROM settings WHERE setting_key = :key LIMIT 1");
            $stmt->execute([':key' => $key]);
            $raw = $stmt->fetchColumn();
            $items = $raw ? json_decode($raw, true) : [];
            sendResponse(true, 'Data berhasil diambil', $items ?: []);
        } catch (PDOException $e) {
            sendResponse(false, 'Gagal mengambil data: ' . $e->getMessage(), null, 500);
        }
    }

    try {
        $stmt = $db->query("SELECT setting_key, setting_value, `group` FROM settings");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $settings = [];
        $arrayKeys = ['social_media', 'office_contacts', 'blocked_words', 'seo_tags', 'security_ips'];

        foreach ($rows as $row) {
            $k = $row['setting_key'];
            $v = $row['setting_value'];

            if (in_array($k, $arrayKeys, true)) {
                $decoded = json_decode($v ?? '[]', true);
                $settings[$k] = is_array($decoded) ? $decoded : [];
            } else {
                $settings[$k] = $v;
            }
        }

        // Ambil data referensi dinamis: Penulis Terdaftar (untuk opsi Default Author)
        $authors = [];
        try {
            $authStmt = $db->query("SELECT id, nama_users, role, email_users FROM users WHERE status = 'active' ORDER BY id ASC");
            $authors = $authStmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {}

        // Ambil data referensi dinamis: Kategori Rubrikasi (untuk opsi Default Category)
        $categories = [];
        try {
            $catStmt = $db->query("SELECT id_kategori, name_kategori, slug FROM kategori ORDER BY id_kategori ASC");
            $categories = $catStmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {}

        sendResponse(true, 'Pengaturan portal berhasil diambil', [
            'settings'   => $settings,
            'authors'    => $authors,
            'categories' => $categories
        ]);
    } catch (PDOException $e) {
        sendResponse(false, 'Gagal mengambil pengaturan: ' . $e->getMessage(), null, 500);
    }
}

/**
 * 2. POST: Simpan Pengaturan / Tambah Item / Upload Logo
 */
function handlePostSettings(PDO $db): void {
    $action = $_GET['action'] ?? '';

    // A. Upload Logo Utama Website
    if ($action === 'upload_logo') {
        if (!isset($_FILES['logo']) || $_FILES['logo']['error'] !== UPLOAD_ERR_OK) {
            sendResponse(false, 'File gambar logo tidak valid atau tidak dipilih', null, 400);
        }

        $file = $_FILES['logo'];
        $allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
        if (!in_array($file['type'], $allowed, true)) {
            sendResponse(false, 'Format logo harus berupa PNG, JPG, WEBP, atau SVG', null, 400);
        }

        if ($file['size'] > 5 * 1024 * 1024) {
            sendResponse(false, 'Ukuran logo maksimal 5MB', null, 400);
        }

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $targetDir = dirname(__DIR__) . '/assets/images/logo';
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        $filename = 'logo_' . time() . '_' . bin2hex(random_bytes(3)) . '.' . $ext;
        $targetPath = $targetDir . '/' . $filename;

        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $publicUrl = 'assets/images/logo/' . $filename;

            // Simpan langsung ke settings
            $stmt = $db->prepare("
                INSERT INTO settings (setting_key, setting_value, `group`)
                VALUES ('site_logo', :val, 'identity')
                ON DUPLICATE KEY UPDATE setting_value = :val
            ");
            $stmt->execute([':val' => $publicUrl]);

            sendResponse(true, 'File logo berhasil diperbarui', [
                'logo_url' => $publicUrl
            ]);
        } else {
            sendResponse(false, 'Gagal menyimpan file logo ke folder tujuan', null, 500);
        }
    }

    // B. Tambah Item ke Array Koleksi (Media Sosial, Kontak Layanan, Kata Sensor, Tag SEO, Aturan IP)
    if ($action === 'add_item') {
        $key = trim($_GET['key'] ?? '');
        $allowedKeys = ['social_media', 'office_contacts', 'blocked_words', 'seo_tags', 'security_ips'];

        if (!in_array($key, $allowedKeys, true)) {
            sendResponse(false, 'Kategori item pengaturan tidak valid', null, 400);
        }

        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        if (empty($input)) {
            sendResponse(false, 'Data item tidak boleh kosong', null, 400);
        }

        try {
            $stmt = $db->prepare("SELECT setting_value FROM settings WHERE setting_key = :key LIMIT 1");
            $stmt->execute([':key' => $key]);
            $raw = $stmt->fetchColumn();
            $items = $raw ? json_decode($raw, true) : [];
            if (!is_array($items)) $items = [];

            // Generate ID numerik baru
            $maxId = 0;
            foreach ($items as $it) {
                if (isset($it['id']) && $it['id'] > $maxId) {
                    $maxId = (int)$it['id'];
                }
            }
            $input['id'] = $maxId + 1;
            if (!isset($input['status'])) {
                $input['status'] = 'active';
            }

            $items[] = $input;
            $newJson = json_encode($items, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

            $upd = $db->prepare("
                INSERT INTO settings (setting_key, setting_value, `group`)
                VALUES (:key, :val, 'general')
                ON DUPLICATE KEY UPDATE setting_value = :val
            ");
            $upd->execute([':key' => $key, ':val' => $newJson]);

            sendResponse(true, 'Data baru berhasil ditambahkan', $input, 201);
        } catch (PDOException $e) {
            sendResponse(false, 'Gagal menambahkan data: ' . $e->getMessage(), null, 500);
        }
    }

    // C. Reset ke Konfigurasi Standar
    if ($action === 'reset_defaults') {
        try {
            $db->exec("TRUNCATE TABLE settings");
            ensureSettingsSchemaAndData($db);
            sendResponse(true, 'Seluruh konfigurasi portal telah dipulihkan ke pengaturan standar');
        } catch (PDOException $e) {
            sendResponse(false, 'Gagal mereset pengaturan: ' . $e->getMessage(), null, 500);
        }
    }

    // D. Bulk Save / Simpan Seluruh Pengaturan
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    if (empty($input) || !is_array($input)) {
        sendResponse(false, 'Tidak ada data pengaturan yang dikirim', null, 400);
    }

    try {
        $stmt = $db->prepare("
            INSERT INTO settings (setting_key, setting_value, `group`)
            VALUES (:key, :val, :grp)
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
        ");

        $groupMapping = [
            'site_name'                 => 'identity',
            'site_tagline'              => 'identity',
            'company_name'              => 'company',
            'company_legal'             => 'company',
            'site_logo'                 => 'identity',
            'site_description'          => 'identity',
            'default_author'            => 'editorial',
            'default_category'          => 'editorial',
            'require_editor_review'     => 'editorial',
            'enable_comment_moderation' => 'editorial',
            'show_update_timestamp'     => 'editorial',
            'hotline_phone'             => 'contact',
            'redaksi_email'             => 'contact',
            'iklan_email'               => 'contact',
            'office_address'            => 'contact',
            'meta_title'                => 'seo',
            'meta_description'          => 'seo',
            'meta_keywords'             => 'seo',
            'two_factor_auth'           => 'security',
            'session_timeout'           => 'security',
            'social_media'              => 'social',
            'office_contacts'           => 'contact',
            'blocked_words'             => 'editorial',
            'seo_tags'                  => 'seo',
            'security_ips'              => 'security'
        ];

        foreach ($input as $k => $v) {
            if ($k === 'csrf_test_name' || $k === '_method') continue;

            $val = is_array($v) ? json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : (string)$v;
            $grp = $groupMapping[$k] ?? 'general';

            $stmt->execute([
                ':key' => $k,
                ':val' => $val,
                ':grp' => $grp
            ]);
        }

        sendResponse(true, 'Pengaturan portal berhasil disimpan');
    } catch (PDOException $e) {
        sendResponse(false, 'Gagal menyimpan pengaturan: ' . $e->getMessage(), null, 500);
    }
}

/**
 * 3. PUT / POST: Perbarui Item Tertentu di dalam Array Koleksi
 */
function handleUpdateSettings(PDO $db): void {
    $action = $_GET['action'] ?? '';

    // Perbarui item spesifik berdasarkan ID
    if ($action === 'update_item') {
        $key = trim($_GET['key'] ?? '');
        $allowedKeys = ['social_media', 'office_contacts', 'blocked_words', 'seo_tags', 'security_ips'];

        if (!in_array($key, $allowedKeys, true)) {
            sendResponse(false, 'Kategori item pengaturan tidak valid', null, 400);
        }

        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $id = (int)($input['id'] ?? $_GET['id'] ?? 0);

        if ($id <= 0) {
            sendResponse(false, 'ID data tidak valid', null, 400);
        }

        try {
            $stmt = $db->prepare("SELECT setting_value FROM settings WHERE setting_key = :key LIMIT 1");
            $stmt->execute([':key' => $key]);
            $raw = $stmt->fetchColumn();
            $items = $raw ? json_decode($raw, true) : [];
            if (!is_array($items)) $items = [];

            $found = false;
            foreach ($items as &$it) {
                if (isset($it['id']) && (int)$it['id'] === $id) {
                    // Gabungkan data baru
                    $it = array_merge($it, $input);
                    $it['id'] = $id; // Pastikan ID tetap utuh
                    $found = true;
                    break;
                }
            }
            unset($it);

            if (!$found) {
                sendResponse(false, 'Data yang ingin diperbarui tidak ditemukan', null, 404);
            }

            $newJson = json_encode($items, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $upd = $db->prepare("UPDATE settings SET setting_value = :val WHERE setting_key = :key");
            $upd->execute([':val' => $newJson, ':key' => $key]);

            sendResponse(true, 'Data berhasil diperbarui', $input);
        } catch (PDOException $e) {
            sendResponse(false, 'Gagal memperbarui data: ' . $e->getMessage(), null, 500);
        }
    }

    // Default PUT: sama seperti Post Settings
    handlePostSettings($db);
}

/**
 * 4. DELETE: Hapus Item Tertentu dari Array Koleksi
 */
function handleDeleteItem(PDO $db): void {
    $action = $_GET['action'] ?? '';
    $key = trim($_GET['key'] ?? '');
    $allowedKeys = ['social_media', 'office_contacts', 'blocked_words', 'seo_tags', 'security_ips'];

    if (!in_array($key, $allowedKeys, true)) {
        sendResponse(false, 'Kategori item pengaturan tidak valid', null, 400);
    }

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $id = (int)($input['id'] ?? $_GET['id'] ?? 0);

    if ($id <= 0) {
        sendResponse(false, 'ID data yang ingin dihapus tidak valid', null, 400);
    }

    try {
        $stmt = $db->prepare("SELECT setting_value FROM settings WHERE setting_key = :key LIMIT 1");
        $stmt->execute([':key' => $key]);
        $raw = $stmt->fetchColumn();
        $items = $raw ? json_decode($raw, true) : [];
        if (!is_array($items)) $items = [];

        $initialCount = count($items);
        $filtered = array_values(array_filter($items, function($it) use ($id) {
            return !isset($it['id']) || (int)$it['id'] !== $id;
        }));

        if (count($filtered) === $initialCount) {
            sendResponse(false, 'Data tidak ditemukan dalam daftar', null, 404);
        }

        $newJson = json_encode($filtered, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $upd = $db->prepare("UPDATE settings SET setting_value = :val WHERE setting_key = :key");
        $upd->execute([':val' => $newJson, ':key' => $key]);

        sendResponse(true, 'Data berhasil dihapus dari daftar');
    } catch (PDOException $e) {
        sendResponse(false, 'Gagal menghapus data: ' . $e->getMessage(), null, 500);
    }
}
