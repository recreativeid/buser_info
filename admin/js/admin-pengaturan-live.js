/**
 * BUSER INFO - Live Portal Settings & System Configuration Management Script
 * Mengelola seluruh pengaturan portal berita, identitas media, kontak layanan,
 * akun media sosial resmi, filter sensor komentar, integrasi SEO, dan keamanan sistem.
 */

let liveSettings = {};
let authorsList = [];
let categoriesList = [];

// Data memori untuk array koleksi (media sosial, kontak, kata sensor, tag seo, aturan ip)
let socialMediaItems = [];
let officeContactsItems = [];
let blockedWordsItems = [];
let seoTagsItems = [];
let securityIpsItems = [];

document.addEventListener('DOMContentLoaded', () => {
  initPengaturanLive();
});

function initPengaturanLive() {
  initSettingsTabs();
  initSettingsFormListeners();
  initSocialMediaModule();
  initOfficeContactsModule();
  initBlockedWordsModule();
  initSeoTagsModule();
  initSecurityIpsModule();
  initLogoUploader();

  // Muat seluruh konfigurasi dari backend REST API
  loadLiveSettings();
}

/**
 * 1. TAB NAVIGATION
 */
function initSettingsTabs() {
  const settingTabs = document.querySelectorAll('.settings-tab-btn');
  const settingPanes = document.querySelectorAll('.settings-pane');

  settingTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // 1. Reset seluruh tab ke kondisi idle
      settingTabs.forEach(t => {
        t.classList.remove('active', 'bg-[#0B0B0B]', 'bg-buser-black', 'text-white', 'font-bold');
        t.classList.add('text-gray-600', 'font-medium', 'hover:bg-gray-100');
      });

      // 2. Aktifkan tab yang dipilih
      tab.classList.add('active', 'bg-[#0B0B0B]', 'text-white', 'font-bold');
      tab.classList.remove('text-gray-600', 'font-medium', 'hover:bg-gray-100');

      // 3. Tampilkan panel konten tab
      const targetId = tab.getAttribute('data-target');
      settingPanes.forEach(pane => {
        if (pane.id === targetId) {
          pane.classList.remove('hidden');
        } else {
          pane.classList.add('hidden');
        }
      });
    });
  });
}

/**
 * 2. MEMUAT PENGATURAN DARI REST API
 */
async function loadLiveSettings() {
  try {
    if (!window.BuserInfoAPI || !window.BuserInfoAPI.getSettings) {
      console.warn('[Pengaturan] BuserInfoAPI belum siap');
      return;
    }

    const res = await window.BuserInfoAPI.getSettings();
    if (res && res.status === 'success' && res.data) {
      const data = res.data;
      liveSettings = data.settings || {};
      authorsList = data.authors || [];
      categoriesList = data.categories || [];

      // Isi daftar array
      socialMediaItems = Array.isArray(liveSettings.social_media) ? liveSettings.social_media : [];
      officeContactsItems = Array.isArray(liveSettings.office_contacts) ? liveSettings.office_contacts : [];
      blockedWordsItems = Array.isArray(liveSettings.blocked_words) ? liveSettings.blocked_words : [];
      seoTagsItems = Array.isArray(liveSettings.seo_tags) ? liveSettings.seo_tags : [];
      securityIpsItems = Array.isArray(liveSettings.security_ips) ? liveSettings.security_ips : [];

      // Isi input-input formulir
      populateFormInputs(liveSettings);
      populateAuthorOptions(authorsList, liveSettings.default_author);
      populateCategoryOptions(categoriesList, liveSettings.default_category);

      // Render daftar item interaktif
      renderSocialMediaList();
      renderOfficeContactsList();
      renderBlockedWordsList();
      renderSeoTagsList();
      renderSecurityIpsList();
    }
  } catch (err) {
    console.error('[Pengaturan] Gagal memuat pengaturan:', err);
    if (typeof showToast === 'function') {
      showToast('error', 'Gagal Memuat Pengaturan', 'Terjadi kesalahan saat menghubungi server konfigurasi.');
    }
  }
}

/**
 * Mengisi nilai input formulir dari data yang diterima
 */
function populateFormInputs(s) {
  // Tab 1: Identitas & Branding
  setInputValue('setting-site-name', s.site_name || 'BUSER INFO');
  setInputValue('setting-site-tagline', s.site_tagline || 'Berita Terkini, Fakta Tanpa Batas');
  setInputValue('setting-company-name', s.company_name || 'PT. GOLDENMIX MEDIA BUSERINFO');
  setInputValue('setting-company-legal', s.company_legal || 'AHU.008226.AH.01.31.TAHUN.2023 • NIB.0208230150016');
  setInputValue('setting-site-description', s.site_description || '');

  // Logo Preview
  const logoEl = document.getElementById('preview-site-logo');
  if (logoEl && s.site_logo) {
    logoEl.src = s.site_logo.startsWith('http') || s.site_logo.startsWith('../') ? s.site_logo : `../${s.site_logo}`;
  }

  // Tab 2: Editorial
  setCheckboxValue('setting-require-editor-review', s.require_editor_review === '1' || s.require_editor_review === true || s.require_editor_review === 1);
  setCheckboxValue('setting-enable-comment-moderation', s.enable_comment_moderation === '1' || s.enable_comment_moderation === true || s.enable_comment_moderation === 1);
  setCheckboxValue('setting-show-update-timestamp', s.show_update_timestamp === '1' || s.show_update_timestamp === true || s.show_update_timestamp === 1);

  // Tab 3: Kontak & Kantor
  setInputValue('setting-hotline-phone', s.hotline_phone || '+62 831-7298-8502');
  setInputValue('setting-redaksi-email', s.redaksi_email || 'redaksi@buserinfo.com');
  setInputValue('setting-iklan-email', s.iklan_email || 'iklan@buserinfo.com');
  setInputValue('setting-office-address', s.office_address || '');

  // Tab 5: SEO Global
  setInputValue('setting-meta-title', s.meta_title || 'BUSER INFO — Berita Terkini, Fakta Tanpa Batas');
  setInputValue('setting-meta-description', s.meta_description || '');
  setInputValue('setting-meta-keywords', s.meta_keywords || 'buser info, berita terkini, kriminal, hukum, politik, nasional, indonesia');

  // Tab 6: Keamanan
  setCheckboxValue('setting-two-factor-auth', s.two_factor_auth === '1' || s.two_factor_auth === true || s.two_factor_auth === 1);
  setInputValue('setting-session-timeout', s.session_timeout || '30 Menit');
}

function setInputValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function setCheckboxValue(id, checked) {
  const el = document.getElementById(id);
  if (el) el.checked = !!checked;
}

/**
 * Dropdown Penulis Bawaan Dinamis
 */
function populateAuthorOptions(authors, selectedVal) {
  const select = document.getElementById('setting-default-author');
  if (!select) return;

  select.innerHTML = '';
  if (!authors || authors.length === 0) {
    select.innerHTML = `<option value="Bambang Sudiro, S.I.Kom. (Pemimpin Redaksi)">Bambang Sudiro, S.I.Kom. (Pemimpin Redaksi)</option><option value="Redaksi BUSER INFO">Redaksi BUSER INFO</option>`;
    return;
  }

  authors.forEach(a => {
    const opt = document.createElement('option');
    const label = `${a.nama_users} (${a.role || 'Redaksi'})`;
    opt.value = label;
    opt.textContent = label;
    if (selectedVal && (selectedVal === label || selectedVal.includes(a.nama_users))) {
      opt.selected = true;
    }
    select.appendChild(opt);
  });

  const optRedaksi = document.createElement('option');
  optRedaksi.value = 'Redaksi BUSER INFO';
  optRedaksi.textContent = 'Redaksi BUSER INFO (Umum)';
  if (selectedVal === 'Redaksi BUSER INFO') optRedaksi.selected = true;
  select.appendChild(optRedaksi);
}

/**
 * Dropdown Kategori Bawaan Dinamis
 */
function populateCategoryOptions(categories, selectedVal) {
  const select = document.getElementById('setting-default-category');
  if (!select) return;

  select.innerHTML = '';
  if (!categories || categories.length === 0) {
    select.innerHTML = `<option value="Nasional">Nasional</option><option value="Kriminal">Kriminal</option><option value="Politik">Politik</option>`;
    return;
  }

  categories.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.name_kategori;
    opt.textContent = c.name_kategori;
    if (selectedVal && selectedVal.toLowerCase() === c.name_kategori.toLowerCase()) {
      opt.selected = true;
    }
    select.appendChild(opt);
  });
}

/**
 * 3. GLOBAL & PER-TAB SAVE ACTION
 */
function initSettingsFormListeners() {
  const btnSaveAll = document.getElementById('btn-save-all-settings');
  if (btnSaveAll) {
    btnSaveAll.addEventListener('click', () => saveAllSettings(true));
  }

  // Tombol simpan pada masing-masing kartu tab
  document.querySelectorAll('.btn-save-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      saveAllSettings(false);
    });
  });

  // Tombol reset ke bawaan
  const btnReset = document.getElementById('btn-reset-defaults');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      confirmAction({
        title: 'Pulihkan Pengaturan Bawaan?',
        message: 'Seluruh pengaturan portal, susunan saluran kontak, dan media sosial akan dikembalikan ke konfigurasi standar redaksi BUSER INFO.',
        confirmText: 'Pulihkan Pengaturan',
        type: 'danger',
        onConfirm: async () => {
          try {
            const res = await window.BuserInfoAPI.resetSettingsDefaults();
            if (res && res.status === 'success') {
              showToast('success', 'Pengaturan Dipulihkan', 'Seluruh konfigurasi portal telah dipulihkan ke profil standar.');
              loadLiveSettings();
            } else {
              showToast('error', 'Gagal Memulihkan', (res && res.message) ? res.message : 'Terjadi kesalahan sistem.');
            }
          } catch (err) {
            showToast('error', 'Kesalahan Server', err.message);
          }
        }
      });
    });
  }
}

/**
 * Menyimpan seluruh formulir konfigurasi ke server
 */
async function saveAllSettings(showFullToast = true) {
  const payload = {
    site_name: getVal('setting-site-name', 'BUSER INFO'),
    site_tagline: getVal('setting-site-tagline', 'Berita Terkini, Fakta Tanpa Batas'),
    company_name: getVal('setting-company-name', 'PT. GOLDENMIX MEDIA BUSERINFO'),
    company_legal: getVal('setting-company-legal', 'AHU.008226.AH.01.31.TAHUN.2023 • NIB.0208230150016'),
    site_description: getVal('setting-site-description', ''),
    default_author: getVal('setting-default-author', 'Bambang Sudiro, S.I.Kom. (Pemimpin Redaksi)'),
    default_category: getVal('setting-default-category', 'Nasional'),
    require_editor_review: isChecked('setting-require-editor-review') ? '1' : '0',
    enable_comment_moderation: isChecked('setting-enable-comment-moderation') ? '1' : '0',
    show_update_timestamp: isChecked('setting-show-update-timestamp') ? '1' : '0',
    hotline_phone: getVal('setting-hotline-phone', '+62 831-7298-8502'),
    redaksi_email: getVal('setting-redaksi-email', 'redaksi@buserinfo.com'),
    iklan_email: getVal('setting-iklan-email', 'iklan@buserinfo.com'),
    office_address: getVal('setting-office-address', ''),
    meta_title: getVal('setting-meta-title', 'BUSER INFO — Berita Terkini, Fakta Tanpa Batas'),
    meta_description: getVal('setting-meta-description', ''),
    meta_keywords: getVal('setting-meta-keywords', ''),
    two_factor_auth: isChecked('setting-two-factor-auth') ? '1' : '0',
    session_timeout: getVal('setting-session-timeout', '30 Menit'),
    social_media: socialMediaItems,
    office_contacts: officeContactsItems,
    blocked_words: blockedWordsItems,
    seo_tags: seoTagsItems,
    security_ips: securityIpsItems
  };

  try {
    const res = await window.BuserInfoAPI.saveSettings(payload);
    if (res && res.status === 'success') {
      if (typeof showToast === 'function') {
        showToast('success', 'Pengaturan Disimpan', 'Semua perubahan konfigurasi portal BUSER INFO telah berhasil diterapkan.');
      }
    } else {
      if (typeof showToast === 'function') {
        showToast('error', 'Gagal Menyimpan', (res && res.message) ? res.message : 'Gagal memperbarui konfigurasi.');
      }
    }
  } catch (err) {
    if (typeof showToast === 'function') {
      showToast('error', 'Kesalahan Jaringan', err.message || 'Gagal menyimpan pengaturan.');
    }
  }
}

function getVal(id, fallback = '') {
  const el = document.getElementById(id);
  return el ? el.value.trim() : fallback;
}

function isChecked(id) {
  const el = document.getElementById(id);
  return el ? el.checked : false;
}

/**
 * 4. LOGO UPLOADER INTERAKTIF
 */
function initLogoUploader() {
  const btnTrigger = document.getElementById('btn-trigger-upload-logo');
  const fileInput = document.getElementById('input-site-logo-file');
  const logoPreview = document.getElementById('preview-site-logo');

  if (btnTrigger && fileInput) {
    btnTrigger.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Preview seketika di peramban
      const reader = new FileReader();
      reader.onload = (re) => {
        if (logoPreview) logoPreview.src = re.target.result;
      };
      reader.readAsDataURL(file);

      // Unggah ke server
      try {
        if (typeof showToast === 'function') {
          showToast('info', 'Mengunggah Logo', 'Sedang memproses file logo baru...');
        }
        const res = await window.BuserInfoAPI.uploadSiteLogo(file);
        if (res && res.status === 'success' && res.data) {
          if (typeof showToast === 'function') {
            showToast('success', 'Logo Diperbarui', 'File logo resmi website berhasil diganti.');
          }
          if (res.data.logo_url && logoPreview) {
            logoPreview.src = res.data.logo_url.startsWith('http') || res.data.logo_url.startsWith('../') ? res.data.logo_url : `../${res.data.logo_url}`;
          }
        } else {
          if (typeof showToast === 'function') {
            showToast('error', 'Gagal Unggah Logo', (res && res.message) ? res.message : 'Format atau ukuran file tidak sesuai.');
          }
        }
      } catch (err) {
        if (typeof showToast === 'function') {
          showToast('error', 'Kesalahan Server', err.message);
        }
      }
    });
  }
}

/**
 * =========================================================================
 * BAGIAN 5: MANAJEMEN AKUN MEDIA SOSIAL RESMI (TAMBAH, UBAH, HAPUS)
 * =========================================================================
 */
function initSocialMediaModule() {
  const btnAdd = document.getElementById('btn-add-social');
  const form = document.getElementById('form-social-modal');

  if (btnAdd) {
    btnAdd.addEventListener('click', () => openSocialModal(null));
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('social-item-id').value;
      const platform = document.getElementById('social-item-platform').value.trim();
      const name = document.getElementById('social-item-name').value.trim();
      const url = document.getElementById('social-item-url').value.trim();
      const note = document.getElementById('social-item-note').value.trim();
      const status = document.getElementById('social-item-status').value;

      if (!platform || !name || !url) {
        showToast('error', 'Validasi Gagal', 'Platform, nama akun, dan tautan URL wajib diisi!');
        return;
      }

      closeModal('modal-social-media');

      const payload = { platform, name, url, note, status };

      try {
        if (id) {
          // Update item
          const res = await window.BuserInfoAPI.updateSettingItem('social_media', parseInt(id, 10), payload);
          if (res && res.status === 'success') {
            showToast('success', 'Data Diperbarui', `Akun media sosial "${name}" berhasil diperbarui.`);
            // Update array lokal
            const idx = socialMediaItems.findIndex(x => x.id === parseInt(id, 10));
            if (idx !== -1) socialMediaItems[idx] = { ...socialMediaItems[idx], ...payload };
            renderSocialMediaList();
          } else {
            showToast('error', 'Gagal Memperbarui', res.message || 'Terjadi kesalahan sistem.');
          }
        } else {
          // Tambah baru
          const res = await window.BuserInfoAPI.addSettingItem('social_media', payload);
          if (res && res.status === 'success') {
            showToast('success', 'Saluran Ditambahkan', `Akun "${name}" berhasil didaftarkan.`);
            socialMediaItems.push(res.data);
            renderSocialMediaList();
          } else {
            showToast('error', 'Gagal Menambahkan', res.message || 'Terjadi kesalahan sistem.');
          }
        }
      } catch (err) {
        showToast('error', 'Kesalahan Jaringan', err.message);
      }
    });
  }
}

function openSocialModal(item = null) {
  const modalTitle = document.getElementById('modal-social-title');
  const idInput = document.getElementById('social-item-id');
  const platformSelect = document.getElementById('social-item-platform');
  const nameInput = document.getElementById('social-item-name');
  const urlInput = document.getElementById('social-item-url');
  const noteInput = document.getElementById('social-item-note');
  const statusSelect = document.getElementById('social-item-status');

  if (item) {
    if (modalTitle) modalTitle.textContent = 'Ubah Saluran Media Sosial';
    if (idInput) idInput.value = item.id;
    if (platformSelect) platformSelect.value = item.platform || 'Facebook';
    if (nameInput) nameInput.value = item.name || '';
    if (urlInput) urlInput.value = item.url || '';
    if (noteInput) noteInput.value = item.note || '';
    if (statusSelect) statusSelect.value = item.status || 'active';
  } else {
    if (modalTitle) modalTitle.textContent = 'Tambah Saluran Media Sosial';
    if (idInput) idInput.value = '';
    if (platformSelect) platformSelect.value = 'Facebook';
    if (nameInput) nameInput.value = '';
    if (urlInput) urlInput.value = '';
    if (noteInput) noteInput.value = '';
    if (statusSelect) statusSelect.value = 'active';
  }

  openModal('modal-social-media');
}

function renderSocialMediaList() {
  const container = document.getElementById('social-media-items-container');
  const countHeader = document.getElementById('social-count-header');
  if (!container) return;

  if (countHeader) {
    countHeader.textContent = `Daftar Saluran Media Sosial Resmi (${socialMediaItems.length} Akun Terdaftar)`;
  }

  if (socialMediaItems.length === 0) {
    container.innerHTML = `
      <div class="py-8 text-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
        <p class="text-xs font-semibold">Belum ada akun media sosial yang terdaftar</p>
        <p class="text-[11px] text-gray-400 mt-0.5">Klik tombol "Tambah Saluran" untuk mendaftarkan akun media sosial resmi portal.</p>
      </div>
    `;
    return;
  }

  const platformIcons = {
    'Facebook': { bg: 'bg-blue-600', text: 'text-white', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
    'TikTok': { bg: 'bg-black', text: 'text-white', badge: 'bg-gray-100 text-gray-900 border-gray-300' },
    'Instagram': { bg: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600', text: 'text-white', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
    'YouTube': { bg: 'bg-red-600', text: 'text-white', badge: 'bg-red-50 text-red-700 border-red-200' },
    'X': { bg: 'bg-black', text: 'text-white', badge: 'bg-gray-100 text-gray-900 border-gray-300' },
    'WhatsApp Channel': { bg: 'bg-emerald-600', text: 'text-white', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    'Telegram': { bg: 'bg-sky-500', text: 'text-white', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
    'LinkedIn': { bg: 'bg-blue-700', text: 'text-white', badge: 'bg-blue-50 text-blue-800 border-blue-200' },
    'Threads': { bg: 'bg-black', text: 'text-white', badge: 'bg-gray-100 text-gray-900 border-gray-300' }
  };

  let html = `<div class="space-y-2.5">`;

  socialMediaItems.forEach(item => {
    const style = platformIcons[item.platform] || { bg: 'bg-gray-700', text: 'text-white', badge: 'bg-gray-100 text-gray-700 border-gray-200' };
    const isActive = (item.status || 'active') === 'active';
    const statusBadge = isActive
      ? `<span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">Tampil</span>`
      : `<span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 text-gray-500">Disembunyikan</span>`;

    html += `
      <div class="p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div class="flex items-center space-x-3 min-w-0">
          <div class="w-9 h-9 rounded-lg ${style.bg} ${style.text} flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            ${escapeHtml(item.platform.substring(0, 2).toUpperCase())}
          </div>
          <div class="min-w-0">
            <div class="flex items-center space-x-2">
              <span class="font-bold text-xs text-gray-900 truncate">${escapeHtml(item.name)}</span>
              <span class="px-1.5 py-0.5 text-[10px] font-semibold rounded border ${style.badge}">${escapeHtml(item.platform)}</span>
              ${statusBadge}
            </div>
            <div class="text-[11px] text-gray-500 truncate flex items-center space-x-1.5 mt-0.5">
              <span class="truncate">${escapeHtml(item.url)}</span>
              ${item.note ? `<span class="text-gray-400">• ${escapeHtml(item.note)}</span>` : ''}
            </div>
          </div>
        </div>

        <div class="flex items-center space-x-1.5 shrink-0 self-end sm:self-center">
          <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="p-1.5 text-gray-500 hover:text-gray-900 rounded hover:bg-gray-100 text-xs font-medium" title="Kunjungi Akun">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          </a>
          <button type="button" onclick="editSocialItem(${item.id})" class="px-2.5 py-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50 text-xs font-medium">
            Ubah
          </button>
          <button type="button" onclick="deleteSocialItem(${item.id}, '${escapeJsString(item.name)}')" class="px-2.5 py-1 text-red-600 hover:text-red-800 rounded hover:bg-red-50 text-xs font-medium">
            Hapus
          </button>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

window.editSocialItem = function(id) {
  const item = socialMediaItems.find(x => x.id === id);
  if (item) openSocialModal(item);
};

window.deleteSocialItem = function(id, name) {
  confirmAction({
    title: 'Hapus Saluran Media Sosial?',
    message: `Akun "${name}" akan dihapus dari daftar saluran media sosial resmi portal.`,
    confirmText: 'Hapus Akun',
    type: 'danger',
    onConfirm: async () => {
      try {
        const res = await window.BuserInfoAPI.deleteSettingItem('social_media', id);
        if (res && res.status === 'success') {
          showToast('success', 'Berhasil Dihapus', `Akun ${name} telah dihapus.`);
          socialMediaItems = socialMediaItems.filter(x => x.id !== id);
          renderSocialMediaList();
        } else {
          showToast('error', 'Gagal Menghapus', res.message || 'Terjadi kesalahan sistem.');
        }
      } catch (err) {
        showToast('error', 'Kesalahan Server', err.message);
      }
    }
  });
};

/**
 * =========================================================================
 * BAGIAN 6: MANAJEMEN SALURAN KONTAK LAYANAN & KANTOR (TAMBAH, UBAH, HAPUS)
 * =========================================================================
 */
function initOfficeContactsModule() {
  const btnAdd = document.getElementById('btn-add-contact');
  const form = document.getElementById('form-contact-modal');

  if (btnAdd) {
    btnAdd.addEventListener('click', () => openContactModal(null));
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('contact-item-id').value;
      const unit = document.getElementById('contact-item-unit').value.trim();
      const type = document.getElementById('contact-item-type').value;
      const contact = document.getElementById('contact-item-val').value.trim();
      const hours = document.getElementById('contact-item-hours').value.trim();
      const status = document.getElementById('contact-item-status').value;

      if (!unit || !contact) {
        showToast('error', 'Validasi Gagal', 'Nama unit layanan dan detail kontak wajib diisi!');
        return;
      }

      closeModal('modal-contact-channel');

      const payload = { unit, type, contact, hours, status };

      try {
        if (id) {
          const res = await window.BuserInfoAPI.updateSettingItem('office_contacts', parseInt(id, 10), payload);
          if (res && res.status === 'success') {
            showToast('success', 'Data Diperbarui', `Saluran kontak "${unit}" berhasil diperbarui.`);
            const idx = officeContactsItems.findIndex(x => x.id === parseInt(id, 10));
            if (idx !== -1) officeContactsItems[idx] = { ...officeContactsItems[idx], ...payload };
            renderOfficeContactsList();
          } else {
            showToast('error', 'Gagal Memperbarui', res.message || 'Terjadi kesalahan sistem.');
          }
        } else {
          const res = await window.BuserInfoAPI.addSettingItem('office_contacts', payload);
          if (res && res.status === 'success') {
            showToast('success', 'Kontak Ditambahkan', `Saluran kontak "${unit}" berhasil didaftarkan.`);
            officeContactsItems.push(res.data);
            renderOfficeContactsList();
          } else {
            showToast('error', 'Gagal Menambahkan', res.message || 'Terjadi kesalahan sistem.');
          }
        }
      } catch (err) {
        showToast('error', 'Kesalahan Jaringan', err.message);
      }
    });
  }
}

function openContactModal(item = null) {
  const modalTitle = document.getElementById('modal-contact-title');
  const idInput = document.getElementById('contact-item-id');
  const unitInput = document.getElementById('contact-item-unit');
  const typeSelect = document.getElementById('contact-item-type');
  const valInput = document.getElementById('contact-item-val');
  const hoursInput = document.getElementById('contact-item-hours');
  const statusSelect = document.getElementById('contact-item-status');

  if (item) {
    if (modalTitle) modalTitle.textContent = 'Ubah Saluran Kontak Layanan';
    if (idInput) idInput.value = item.id;
    if (unitInput) unitInput.value = item.unit || '';
    if (typeSelect) typeSelect.value = item.type || 'WhatsApp';
    if (valInput) valInput.value = item.contact || '';
    if (hoursInput) hoursInput.value = item.hours || '';
    if (statusSelect) statusSelect.value = item.status || 'active';
  } else {
    if (modalTitle) modalTitle.textContent = 'Tambah Saluran Kontak Baru';
    if (idInput) idInput.value = '';
    if (unitInput) unitInput.value = '';
    if (typeSelect) typeSelect.value = 'WhatsApp';
    if (valInput) valInput.value = '';
    if (hoursInput) hoursInput.value = 'Senin - Sabtu 08:00 - 18:00 WIB';
    if (statusSelect) statusSelect.value = 'active';
  }

  openModal('modal-contact-channel');
}

function renderOfficeContactsList() {
  const container = document.getElementById('office-contacts-items-container');
  const countHeader = document.getElementById('contacts-count-header');
  if (!container) return;

  if (countHeader) {
    countHeader.textContent = `Saluran Komunikasi & Layanan Redaksi (${officeContactsItems.length} Saluran)`;
  }

  if (officeContactsItems.length === 0) {
    container.innerHTML = `
      <div class="py-8 text-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
        <p class="text-xs font-semibold">Belum ada saluran kontak layanan yang didaftarkan</p>
        <p class="text-[11px] text-gray-400 mt-0.5">Klik tombol "Tambah Kontak Layanan" untuk menambahkan saluran baru.</p>
      </div>
    `;
    return;
  }

  const typeStyles = {
    'WhatsApp': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Telepon': 'bg-blue-50 text-blue-700 border-blue-200',
    'Email': 'bg-purple-50 text-purple-700 border-purple-200',
    'Alamat': 'bg-amber-50 text-amber-800 border-amber-200'
  };

  let html = `<div class="space-y-2.5">`;

  officeContactsItems.forEach(item => {
    const badgeStyle = typeStyles[item.type] || 'bg-gray-50 text-gray-700 border-gray-200';
    const isActive = (item.status || 'active') === 'active';
    const statusBadge = isActive
      ? `<span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">Aktif</span>`
      : `<span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 text-gray-500">Nonaktif</span>`;

    let directLink = '#';
    let linkTitle = 'Hubungi';
    if (item.type === 'WhatsApp') {
      const cleanNum = (item.contact || '').replace(/[^0-9]/g, '');
      directLink = `https://wa.me/${cleanNum}`;
      linkTitle = 'Buka WhatsApp';
    } else if (item.type === 'Email') {
      directLink = `mailto:${item.contact}`;
      linkTitle = 'Kirim Email';
    } else if (item.type === 'Telepon') {
      directLink = `tel:${item.contact}`;
      linkTitle = 'Hubungi Telepon';
    }

    html += `
      <div class="p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div class="min-w-0">
          <div class="flex items-center space-x-2">
            <span class="font-bold text-xs text-gray-900">${escapeHtml(item.unit)}</span>
            <span class="px-2 py-0.5 text-[10px] font-semibold rounded border ${badgeStyle}">${escapeHtml(item.type)}</span>
            ${statusBadge}
          </div>
          <div class="text-[11px] text-gray-600 mt-1 flex flex-wrap items-center gap-x-2">
            <span class="font-semibold text-gray-800">${escapeHtml(item.contact)}</span>
            ${item.hours ? `<span class="text-gray-400">• ${escapeHtml(item.hours)}</span>` : ''}
          </div>
        </div>

        <div class="flex items-center space-x-1.5 shrink-0 self-end sm:self-center">
          ${directLink !== '#' ? `
            <a href="${escapeHtml(directLink)}" target="_blank" rel="noopener noreferrer" class="p-1.5 text-gray-500 hover:text-emerald-700 rounded hover:bg-emerald-50 text-xs font-medium" title="${linkTitle}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            </a>
          ` : ''}
          <button type="button" onclick="editContactItem(${item.id})" class="px-2.5 py-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50 text-xs font-medium">
            Ubah
          </button>
          <button type="button" onclick="deleteContactItem(${item.id}, '${escapeJsString(item.unit)}')" class="px-2.5 py-1 text-red-600 hover:text-red-800 rounded hover:bg-red-50 text-xs font-medium">
            Hapus
          </button>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

window.editContactItem = function(id) {
  const item = officeContactsItems.find(x => x.id === id);
  if (item) openContactModal(item);
};

window.deleteContactItem = function(id, unit) {
  confirmAction({
    title: 'Hapus Saluran Kontak?',
    message: `Layanan "${unit}" akan dihapus dari daftar saluran komunikasi resmi redaksi.`,
    confirmText: 'Hapus Saluran',
    type: 'danger',
    onConfirm: async () => {
      try {
        const res = await window.BuserInfoAPI.deleteSettingItem('office_contacts', id);
        if (res && res.status === 'success') {
          showToast('success', 'Berhasil Dihapus', `Saluran ${unit} telah dihapus.`);
          officeContactsItems = officeContactsItems.filter(x => x.id !== id);
          renderOfficeContactsList();
        } else {
          showToast('error', 'Gagal Menghapus', res.message || 'Terjadi kesalahan sistem.');
        }
      } catch (err) {
        showToast('error', 'Kesalahan Server', err.message);
      }
    }
  });
};

/**
 * =========================================================================
 * BAGIAN 7: MANAJEMEN SARINGAN KATA SENSOR KOMENTAR (TAMBAH, UBAH, HAPUS)
 * =========================================================================
 */
function initBlockedWordsModule() {
  const btnAdd = document.getElementById('btn-add-blocked-word');
  const form = document.getElementById('form-blocked-word-modal');
  const searchInput = document.getElementById('search-blocked-words');

  if (btnAdd) {
    btnAdd.addEventListener('click', () => openBlockedWordModal(null));
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderBlockedWordsList(e.target.value.toLowerCase().trim());
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('blocked-word-id').value;
      const word = document.getElementById('blocked-word-val').value.trim();
      const category = document.getElementById('blocked-word-category').value;
      const action = document.getElementById('blocked-word-action').value;
      const status = document.getElementById('blocked-word-status').value;

      if (!word) {
        showToast('error', 'Validasi Gagal', 'Kata atau frasa yang disaring wajib diisi!');
        return;
      }

      closeModal('modal-blocked-word');

      const payload = { word, category, action, status };

      try {
        if (id) {
          const res = await window.BuserInfoAPI.updateSettingItem('blocked_words', parseInt(id, 10), payload);
          if (res && res.status === 'success') {
            showToast('success', 'Kata Diperbarui', `Aturan sensor kata "${word}" berhasil diperbarui.`);
            const idx = blockedWordsItems.findIndex(x => x.id === parseInt(id, 10));
            if (idx !== -1) blockedWordsItems[idx] = { ...blockedWordsItems[idx], ...payload };
            renderBlockedWordsList();
          } else {
            showToast('error', 'Gagal Memperbarui', res.message || 'Terjadi kesalahan sistem.');
          }
        } else {
          const res = await window.BuserInfoAPI.addSettingItem('blocked_words', payload);
          if (res && res.status === 'success') {
            showToast('success', 'Kata Ditambahkan', `Kata "${word}" berhasil ditambahkan ke saringan.`);
            blockedWordsItems.push(res.data);
            renderBlockedWordsList();
          } else {
            showToast('error', 'Gagal Menambahkan', res.message || 'Terjadi kesalahan sistem.');
          }
        }
      } catch (err) {
        showToast('error', 'Kesalahan Jaringan', err.message);
      }
    });
  }
}

function openBlockedWordModal(item = null) {
  const modalTitle = document.getElementById('modal-blocked-word-title');
  const idInput = document.getElementById('blocked-word-id');
  const valInput = document.getElementById('blocked-word-val');
  const categorySelect = document.getElementById('blocked-word-category');
  const actionSelect = document.getElementById('blocked-word-action');
  const statusSelect = document.getElementById('blocked-word-status');

  if (item) {
    if (modalTitle) modalTitle.textContent = 'Ubah Kata Saringan Sensor';
    if (idInput) idInput.value = item.id;
    if (valInput) valInput.value = item.word || '';
    if (categorySelect) categorySelect.value = item.category || 'Judi Online & Slot';
    if (actionSelect) actionSelect.value = item.action || 'Tolak Komentar';
    if (statusSelect) statusSelect.value = item.status || 'active';
  } else {
    if (modalTitle) modalTitle.textContent = 'Tambah Kata Sensor Baru';
    if (idInput) idInput.value = '';
    if (valInput) valInput.value = '';
    if (categorySelect) categorySelect.value = 'Judi Online & Slot';
    if (actionSelect) actionSelect.value = 'Tolak Komentar';
    if (statusSelect) statusSelect.value = 'active';
  }

  openModal('modal-blocked-word');
}

function renderBlockedWordsList(query = '') {
  const container = document.getElementById('blocked-words-items-container');
  const countHeader = document.getElementById('blocked-words-count-header');
  if (!container) return;

  const filtered = query
    ? blockedWordsItems.filter(x => (x.word || '').toLowerCase().includes(query) || (x.category || '').toLowerCase().includes(query))
    : blockedWordsItems;

  if (countHeader) {
    countHeader.textContent = `Daftar Kata Terlarang (${blockedWordsItems.length} Kata Tersaring)`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="py-6 text-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
        <p class="text-xs font-semibold">${query ? 'Tidak ada kata yang cocok dengan pencarian' : 'Belum ada kata terlarang yang disaring'}</p>
        <p class="text-[11px] text-gray-400 mt-0.5">Klik "Tambah Kata Sensor" untuk mendaftarkan saringan baru.</p>
      </div>
    `;
    return;
  }

  let html = `<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">`;

  filtered.forEach(item => {
    const isReject = item.action === 'Tolak Komentar';
    const actionBadge = isReject
      ? `<span class="px-2 py-0.5 text-[10px] font-bold rounded bg-red-100 text-red-800">Tolak Komentar</span>`
      : `<span class="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800">Sensor Bintang (***)</span>`;

    html += `
      <div class="p-2.5 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-all flex items-center justify-between shadow-xs">
        <div class="min-w-0 pr-2">
          <div class="flex items-center space-x-1.5">
            <span class="font-bold text-xs text-gray-900 font-mono">"${escapeHtml(item.word)}"</span>
            ${actionBadge}
          </div>
          <div class="text-[10px] text-gray-500 mt-0.5 truncate">${escapeHtml(item.category || 'Umum')}</div>
        </div>
        <div class="flex items-center space-x-1 shrink-0">
          <button type="button" onclick="editBlockedWordItem(${item.id})" class="p-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50 text-xs font-medium">
            Ubah
          </button>
          <button type="button" onclick="deleteBlockedWordItem(${item.id}, '${escapeJsString(item.word)}')" class="p-1 text-red-600 hover:text-red-800 rounded hover:bg-red-50 text-xs font-medium">
            Hapus
          </button>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

window.editBlockedWordItem = function(id) {
  const item = blockedWordsItems.find(x => x.id === id);
  if (item) openBlockedWordModal(item);
};

window.deleteBlockedWordItem = function(id, word) {
  confirmAction({
    title: 'Hapus Kata Sensor?',
    message: `Kata "${word}" akan dihapus dari daftar saringan moderasi komentar otomatis.`,
    confirmText: 'Hapus dari Saringan',
    type: 'danger',
    onConfirm: async () => {
      try {
        const res = await window.BuserInfoAPI.deleteSettingItem('blocked_words', id);
        if (res && res.status === 'success') {
          showToast('success', 'Berhasil Dihapus', `Kata "${word}" telah dihapus.`);
          blockedWordsItems = blockedWordsItems.filter(x => x.id !== id);
          renderBlockedWordsList();
        } else {
          showToast('error', 'Gagal Menghapus', res.message || 'Terjadi kesalahan sistem.');
        }
      } catch (err) {
        showToast('error', 'Kesalahan Server', err.message);
      }
    }
  });
};

/**
 * =========================================================================
 * BAGIAN 8: MANAJEMEN TAG VERIFIKASI & INTEGRASI SEO (TAMBAH, UBAH, HAPUS)
 * =========================================================================
 */
function initSeoTagsModule() {
  const btnAdd = document.getElementById('btn-add-seo-tag');
  const form = document.getElementById('form-seo-tag-modal');

  if (btnAdd) {
    btnAdd.addEventListener('click', () => openSeoTagModal(null));
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('seo-tag-id').value;
      const service = document.getElementById('seo-tag-service').value.trim();
      const tagCode = document.getElementById('seo-tag-code').value.trim();
      const note = document.getElementById('seo-tag-note').value.trim();
      const status = document.getElementById('seo-tag-status').value;

      if (!service || !tagCode) {
        showToast('error', 'Validasi Gagal', 'Nama layanan dan kode verifikasi wajib diisi!');
        return;
      }

      closeModal('modal-seo-tag');

      const payload = { service, tag_code: tagCode, note, status };

      try {
        if (id) {
          const res = await window.BuserInfoAPI.updateSettingItem('seo_tags', parseInt(id, 10), payload);
          if (res && res.status === 'success') {
            showToast('success', 'Tag Diperbarui', `Tag verifikasi "${service}" berhasil diperbarui.`);
            const idx = seoTagsItems.findIndex(x => x.id === parseInt(id, 10));
            if (idx !== -1) seoTagsItems[idx] = { ...seoTagsItems[idx], ...payload };
            renderSeoTagsList();
          } else {
            showToast('error', 'Gagal Memperbarui', res.message || 'Terjadi kesalahan sistem.');
          }
        } else {
          const res = await window.BuserInfoAPI.addSettingItem('seo_tags', payload);
          if (res && res.status === 'success') {
            showToast('success', 'Tag Ditambahkan', `Tag "${service}" berhasil didaftarkan.`);
            seoTagsItems.push(res.data);
            renderSeoTagsList();
          } else {
            showToast('error', 'Gagal Menambahkan', res.message || 'Terjadi kesalahan sistem.');
          }
        }
      } catch (err) {
        showToast('error', 'Kesalahan Jaringan', err.message);
      }
    });
  }
}

function openSeoTagModal(item = null) {
  const modalTitle = document.getElementById('modal-seo-tag-title');
  const idInput = document.getElementById('seo-tag-id');
  const serviceInput = document.getElementById('seo-tag-service');
  const codeInput = document.getElementById('seo-tag-code');
  const noteInput = document.getElementById('seo-tag-note');
  const statusSelect = document.getElementById('seo-tag-status');

  if (item) {
    if (modalTitle) modalTitle.textContent = 'Ubah Tag Verifikasi & Pelacak';
    if (idInput) idInput.value = item.id;
    if (serviceInput) serviceInput.value = item.service || '';
    if (codeInput) codeInput.value = item.tag_code || '';
    if (noteInput) noteInput.value = item.note || '';
    if (statusSelect) statusSelect.value = item.status || 'active';
  } else {
    if (modalTitle) modalTitle.textContent = 'Tambah Tag Verifikasi Baru';
    if (idInput) idInput.value = '';
    if (serviceInput) serviceInput.value = 'Google Search Console';
    if (codeInput) codeInput.value = '';
    if (noteInput) noteInput.value = 'Verifikasi Kepemilikan Web';
    if (statusSelect) statusSelect.value = 'active';
  }

  openModal('modal-seo-tag');
}

function renderSeoTagsList() {
  const container = document.getElementById('seo-tags-items-container');
  const countHeader = document.getElementById('seo-tags-count-header');
  if (!container) return;

  if (countHeader) {
    countHeader.textContent = `Daftar Tag Verifikasi & Pelacak (${seoTagsItems.length} Tag Aktif)`;
  }

  if (seoTagsItems.length === 0) {
    container.innerHTML = `
      <div class="py-6 text-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
        <p class="text-xs font-semibold">Belum ada tag verifikasi yang didaftarkan</p>
        <p class="text-[11px] text-gray-400 mt-0.5">Klik "Tambah Tag Verifikasi" untuk mendaftarkan tag baru.</p>
      </div>
    `;
    return;
  }

  let html = `<div class="space-y-2">`;

  seoTagsItems.forEach(item => {
    const isActive = (item.status || 'active') === 'active';
    const statusBadge = isActive
      ? `<span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">Aktif</span>`
      : `<span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 text-gray-500">Nonaktif</span>`;

    html += `
      <div class="p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
        <div class="min-w-0">
          <div class="flex items-center space-x-2">
            <span class="font-bold text-xs text-gray-900">${escapeHtml(item.service)}</span>
            ${statusBadge}
          </div>
          <div class="text-[11px] font-mono text-gray-600 truncate mt-0.5 bg-gray-50 px-2 py-0.5 rounded border border-gray-200 inline-block max-w-full">
            ${escapeHtml(item.tag_code)}
          </div>
          ${item.note ? `<p class="text-[10px] text-gray-400 mt-0.5">${escapeHtml(item.note)}</p>` : ''}
        </div>

        <div class="flex items-center space-x-1.5 shrink-0 self-end sm:self-center">
          <button type="button" onclick="editSeoTagItem(${item.id})" class="px-2.5 py-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50 text-xs font-medium">
            Ubah
          </button>
          <button type="button" onclick="deleteSeoTagItem(${item.id}, '${escapeJsString(item.service)}')" class="px-2.5 py-1 text-red-600 hover:text-red-800 rounded hover:bg-red-50 text-xs font-medium">
            Hapus
          </button>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

window.editSeoTagItem = function(id) {
  const item = seoTagsItems.find(x => x.id === id);
  if (item) openSeoTagModal(item);
};

window.deleteSeoTagItem = function(id, service) {
  confirmAction({
    title: 'Hapus Tag Verifikasi?',
    message: `Tag "${service}" akan dihapus dari integrasi SEO portal.`,
    confirmText: 'Hapus Tag',
    type: 'danger',
    onConfirm: async () => {
      try {
        const res = await window.BuserInfoAPI.deleteSettingItem('seo_tags', id);
        if (res && res.status === 'success') {
          showToast('success', 'Berhasil Dihapus', `Tag ${service} telah dihapus.`);
          seoTagsItems = seoTagsItems.filter(x => x.id !== id);
          renderSeoTagsList();
        } else {
          showToast('error', 'Gagal Menghapus', res.message || 'Terjadi kesalahan sistem.');
        }
      } catch (err) {
        showToast('error', 'Kesalahan Server', err.message);
      }
    }
  });
};

/**
 * =========================================================================
 * BAGIAN 9: MANAJEMEN ATURAN PEMBATASAN IP KEAMANAN (TAMBAH, UBAH, HAPUS)
 * =========================================================================
 */
function initSecurityIpsModule() {
  const btnAdd = document.getElementById('btn-add-security-ip');
  const form = document.getElementById('form-security-ip-modal');

  if (btnAdd) {
    btnAdd.addEventListener('click', () => openSecurityIpModal(null));
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('security-ip-id').value;
      const ip = document.getElementById('security-ip-val').value.trim();
      const ruleType = document.getElementById('security-ip-type').value;
      const note = document.getElementById('security-ip-note').value.trim();
      const status = document.getElementById('security-ip-status').value;

      if (!ip) {
        showToast('error', 'Validasi Gagal', 'Alamat IP atau subnet wajib diisi!');
        return;
      }

      closeModal('modal-security-ip');

      const payload = { ip, rule_type: ruleType, note, status };

      try {
        if (id) {
          const res = await window.BuserInfoAPI.updateSettingItem('security_ips', parseInt(id, 10), payload);
          if (res && res.status === 'success') {
            showToast('success', 'Aturan Diperbarui', `Aturan IP "${ip}" berhasil diperbarui.`);
            const idx = securityIpsItems.findIndex(x => x.id === parseInt(id, 10));
            if (idx !== -1) securityIpsItems[idx] = { ...securityIpsItems[idx], ...payload };
            renderSecurityIpsList();
          } else {
            showToast('error', 'Gagal Memperbarui', res.message || 'Terjadi kesalahan sistem.');
          }
        } else {
          const res = await window.BuserInfoAPI.addSettingItem('security_ips', payload);
          if (res && res.status === 'success') {
            showToast('success', 'Aturan Ditambahkan', `Aturan IP "${ip}" berhasil didaftarkan.`);
            securityIpsItems.push(res.data);
            renderSecurityIpsList();
          } else {
            showToast('error', 'Gagal Menambahkan', res.message || 'Terjadi kesalahan sistem.');
          }
        }
      } catch (err) {
        showToast('error', 'Kesalahan Jaringan', err.message);
      }
    });
  }
}

function openSecurityIpModal(item = null) {
  const modalTitle = document.getElementById('modal-security-ip-title');
  const idInput = document.getElementById('security-ip-id');
  const ipInput = document.getElementById('security-ip-val');
  const typeSelect = document.getElementById('security-ip-type');
  const noteInput = document.getElementById('security-ip-note');
  const statusSelect = document.getElementById('security-ip-status');

  if (item) {
    if (modalTitle) modalTitle.textContent = 'Ubah Aturan Akses IP';
    if (idInput) idInput.value = item.id;
    if (ipInput) ipInput.value = item.ip || '';
    if (typeSelect) typeSelect.value = item.rule_type || 'Izinkan Akses';
    if (noteInput) noteInput.value = item.note || '';
    if (statusSelect) statusSelect.value = item.status || 'active';
  } else {
    if (modalTitle) modalTitle.textContent = 'Tambah Aturan Akses IP Baru';
    if (idInput) idInput.value = '';
    if (ipInput) ipInput.value = '';
    if (typeSelect) typeSelect.value = 'Izinkan Akses';
    if (noteInput) noteInput.value = '';
    if (statusSelect) statusSelect.value = 'active';
  }

  openModal('modal-security-ip');
}

function renderSecurityIpsList() {
  const container = document.getElementById('security-ips-items-container');
  const countHeader = document.getElementById('security-ips-count-header');
  if (!container) return;

  if (countHeader) {
    countHeader.textContent = `Daftar Aturan Pembatasan IP (${securityIpsItems.length} Aturan)`;
  }

  if (securityIpsItems.length === 0) {
    container.innerHTML = `
      <div class="py-6 text-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
        <p class="text-xs font-semibold">Belum ada aturan alamat IP yang didaftarkan</p>
        <p class="text-[11px] text-gray-400 mt-0.5">Klik "Tambah Aturan IP" untuk membatasi atau mengizinkan akses jaringan.</p>
      </div>
    `;
    return;
  }

  let html = `<div class="space-y-2">`;

  securityIpsItems.forEach(item => {
    const isAllow = item.rule_type === 'Izinkan Akses';
    const ruleBadge = isAllow
      ? `<span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">Izinkan Akses</span>`
      : `<span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-800">Blokir Akses</span>`;

    html += `
      <div class="p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
        <div class="min-w-0">
          <div class="flex items-center space-x-2">
            <span class="font-bold text-xs text-gray-900 font-mono">${escapeHtml(item.ip)}</span>
            ${ruleBadge}
          </div>
          ${item.note ? `<p class="text-[11px] text-gray-500 mt-0.5">${escapeHtml(item.note)}</p>` : ''}
        </div>

        <div class="flex items-center space-x-1.5 shrink-0 self-end sm:self-center">
          <button type="button" onclick="editSecurityIpItem(${item.id})" class="px-2.5 py-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50 text-xs font-medium">
            Ubah
          </button>
          <button type="button" onclick="deleteSecurityIpItem(${item.id}, '${escapeJsString(item.ip)}')" class="px-2.5 py-1 text-red-600 hover:text-red-800 rounded hover:bg-red-50 text-xs font-medium">
            Hapus
          </button>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

window.editSecurityIpItem = function(id) {
  const item = securityIpsItems.find(x => x.id === id);
  if (item) openSecurityIpModal(item);
};

window.deleteSecurityIpItem = function(id, ip) {
  confirmAction({
    title: 'Hapus Aturan Akses IP?',
    message: `Alamat IP "${ip}" akan dihapus dari daftar aturan keamanan CMS.`,
    confirmText: 'Hapus Aturan',
    type: 'danger',
    onConfirm: async () => {
      try {
        const res = await window.BuserInfoAPI.deleteSettingItem('security_ips', id);
        if (res && res.status === 'success') {
          showToast('success', 'Berhasil Dihapus', `Aturan IP ${ip} telah dihapus.`);
          securityIpsItems = securityIpsItems.filter(x => x.id !== id);
          renderSecurityIpsList();
        } else {
          showToast('error', 'Gagal Menghapus', res.message || 'Terjadi kesalahan sistem.');
        }
      } catch (err) {
        showToast('error', 'Kesalahan Server', err.message);
      }
    }
  });
};

/**
 * =========================================================================
 * HELPER FUNCTIONS
 * =========================================================================
 */
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeJsString(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "\\'");
}

window.loadLiveSettings = loadLiveSettings;
