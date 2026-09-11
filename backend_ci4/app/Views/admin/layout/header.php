<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <title><?= esc($title ?? 'Dashboard') ?> — BUSER INFO CMS</title>
  <meta name="description" content="Sistem Manajemen Konten Editorial BUSER INFO — PT. GOLDENMIX MEDIA BUSERINFO">
  <link rel="icon" type="image/svg+xml" href="<?= base_url('assets/images/logo/favicon.svg') ?>">

  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="<?= base_url('assets/js/tailwind-config.js') ?>"></script>
  
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <link rel="stylesheet" href="<?= base_url('admin/css/admin.css') ?>">
</head>
<body class="bg-[#F5F5F5] text-gray-900 antialiased flex h-screen overflow-hidden">
  <div id="sidebar-overlay" class="fixed inset-0 bg-black/60 z-40 hidden opacity-0 transition-opacity duration-200 lg:hidden"></div>
