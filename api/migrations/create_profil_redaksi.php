<?php
/**
 * Migration & Seeder: Tabel profil_redaksi
 * BUSER INFO News Portal
 */

require_once __DIR__ . '/../config/database.php';

try {
    $db = Database::getConnection();

    echo "Creating table profil_redaksi if not exists...\n";

    $sql = "
    CREATE TABLE IF NOT EXISTS profil_redaksi (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(150) NOT NULL,
        jabatan VARCHAR(150) NOT NULL,
        kategori VARCHAR(100) DEFAULT 'Redaksi',
        keterangan VARCHAR(255),
        email VARCHAR(150),
        telepon VARCHAR(50),
        foto VARCHAR(255),
        urutan INT DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";

    $db->exec($sql);
    echo "✔ Tabel profil_redaksi berhasil dibuat atau sudah ada.\n";

    // Cek apakah tabel kosong
    $count = (int)$db->query("SELECT COUNT(*) FROM profil_redaksi")->fetchColumn();
    if ($count === 0) {
        echo "Seeding data awal susunan profil redaksi...\n";

        $seedData = [
            [
                'nama'       => 'Drs. M. Taufik Hidayat, S.H., M.H.',
                'jabatan'    => 'Penasihat Hukum',
                'kategori'   => 'Penasihat & Pembina',
                'keterangan' => 'Advokat & Konsultan Hukum Media',
                'email'      => 'hukum@buserinfo.com',
                'telepon'    => '0831-7298-8502',
                'foto'       => '',
                'urutan'     => 1,
                'status'     => 'active'
            ],
            [
                'nama'       => 'Hendy Yustana',
                'jabatan'    => 'Pemimpin Umum / Perusahaan',
                'kategori'   => 'Pimpinan Perusahaan',
                'keterangan' => 'PT. Goldenmix Media Buserinfo',
                'email'      => 'hendyyustana@gmail.com',
                'telepon'    => '0831-7298-8502',
                'foto'       => '',
                'urutan'     => 2,
                'status'     => 'active'
            ],
            [
                'nama'       => 'Bambang Sudiro, S.I.Kom.',
                'jabatan'    => 'Pemimpin Redaksi / Penanggung Jawab',
                'kategori'   => 'Pimpinan Redaksi',
                'keterangan' => 'Uji Kompetensi Wartawan Utama',
                'email'      => 'redaksi@buserinfo.com',
                'telepon'    => '0831-7298-8502',
                'foto'       => '',
                'urutan'     => 3,
                'status'     => 'active'
            ],
            [
                'nama'       => 'Ahmad Fauzi Ramadhan',
                'jabatan'    => 'Redaktur Pelaksana',
                'kategori'   => 'Redaktur',
                'keterangan' => 'Koordinator Meja Redaksi',
                'email'      => 'fauzi.ramadhan@buserinfo.com',
                'telepon'    => '0831-7298-8502',
                'foto'       => '',
                'urutan'     => 4,
                'status'     => 'active'
            ],
            [
                'nama'       => 'Bripka Chandra Wijaya (Purn.)',
                'jabatan'    => 'Redaktur Kriminal & Investigasi',
                'kategori'   => 'Redaktur',
                'keterangan' => 'Biro Investigasi Mabes',
                'email'      => 'chandra.wijaya@buserinfo.com',
                'telepon'    => '0831-7298-8502',
                'foto'       => '',
                'urutan'     => 5,
                'status'     => 'active'
            ],
            [
                'nama'       => 'Fajar Nugroho, S.Sos.',
                'jabatan'    => 'Redaktur Politik & Parlemen',
                'kategori'   => 'Redaktur',
                'keterangan' => 'Koresponden Senayan',
                'email'      => 'fajar.nugroho@buserinfo.com',
                'telepon'    => '0831-7298-8502',
                'foto'       => '',
                'urutan'     => 6,
                'status'     => 'active'
            ],
            [
                'nama'       => 'Hendra Saputra',
                'jabatan'    => 'Biro Sumatera Selatan & Banyuasin',
                'kategori'   => 'Biro & Perwakilan Daerah',
                'keterangan' => 'Kepala Perwakilan Daerah',
                'email'      => 'hendra.sumsel@buserinfo.com',
                'telepon'    => '0831-7298-8502',
                'foto'       => '',
                'urutan'     => 7,
                'status'     => 'active'
            ],
            [
                'nama'       => 'M. Rizky Saputra, S.E.',
                'jabatan'    => 'Redaktur Ekonomi & Bisnis',
                'kategori'   => 'Redaktur',
                'keterangan' => 'Analis Pasar & Perbankan',
                'email'      => 'rizky.saputra@buserinfo.com',
                'telepon'    => '0831-7298-8502',
                'foto'       => '',
                'urutan'     => 8,
                'status'     => 'active'
            ],
            [
                'nama'       => 'Kevin Adityawarman',
                'jabatan'    => 'Teknologi & Multimedia',
                'kategori'   => 'Teknologi & Multimedia',
                'keterangan' => 'Infrastruktur Web & Keamanan',
                'email'      => 'kevin.tech@buserinfo.com',
                'telepon'    => '0831-7298-8502',
                'foto'       => '',
                'urutan'     => 9,
                'status'     => 'active'
            ]
        ];

        $stmt = $db->prepare("
            INSERT INTO profil_redaksi (nama, jabatan, kategori, keterangan, email, telepon, foto, urutan, status, created_at, updated_at)
            VALUES (:nama, :jabatan, :kategori, :keterangan, :email, :telepon, :foto, :urutan, :status, NOW(), NOW())
        ");

        foreach ($seedData as $item) {
            $stmt->execute([
                ':nama'       => $item['nama'],
                ':jabatan'    => $item['jabatan'],
                ':kategori'   => $item['kategori'],
                ':keterangan' => $item['keterangan'],
                ':email'      => $item['email'],
                ':telepon'    => $item['telepon'],
                ':foto'       => $item['foto'],
                ':urutan'     => $item['urutan'],
                ':status'     => $item['status']
            ]);
        }
        echo "✔ Berhasil memasukkan " . count($seedData) . " profil anggota redaksi awal.\n";
    } else {
        echo "Tabel sudah berisi $count data.\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
