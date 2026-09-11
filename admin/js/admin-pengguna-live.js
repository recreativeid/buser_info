/**
 * BUSER INFO - Live Users Management Script (admin/pengguna.html)
 * Mengelola seluruh akun pengguna CMS, hak akses (role), password, dan status via REST API & PostgreSQL.
 * Dioptimalkan untuk Mobile-First: Mobile cards interaktif, touch action buttons sejajar, bottom-sheet modal.
 */

let allUsers = [];

document.addEventListener('DOMContentLoaded', () => {
  initUsersLive();
});

function initUsersLive() {
  const btnAdd = document.getElementById('btn-add-user');
  const fabAdd = document.getElementById('fab-add-user');
  const form = document.getElementById('user-form');
  const btnGenPass = document.getElementById('btn-generate-pass');

  // Tombol Tambah Pengguna (Header & Mobile FAB)
  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      openUserModal(null);
    });
  }
  if (fabAdd) {
    fabAdd.addEventListener('click', () => {
      openUserModal(null);
    });
  }

  if (form) {
    form.addEventListener('submit', handleUserFormSubmit);
  }

  if (btnGenPass) {
    btnGenPass.addEventListener('click', generateRandomPassword);
  }

  // Setup Toolbar Pencarian & Filter Cepat
  setupSearchAndFilters();

  // Muat data live awal
  loadLiveUsers();
}

/**
 * Inisialisasi Event Listener Toolbar Pencarian & Filter
 */
function setupSearchAndFilters() {
  const searchInput = document.getElementById('search-user-input');
  const searchClear = document.getElementById('search-user-clear');
  const filterRole = document.getElementById('filter-user-role');
  const filterStatus = document.getElementById('filter-user-status');
  const btnResetFilter = document.getElementById('btn-reset-user-filter');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      if (searchClear) {
        if (searchInput.value.trim().length > 0) {
          searchClear.classList.remove('hidden');
        } else {
          searchClear.classList.add('hidden');
        }
      }
      filterAndRenderUsers();
    });
  }

  if (searchClear) {
    searchClear.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchClear.classList.add('hidden');
        filterAndRenderUsers();
        searchInput.focus();
      }
    });
  }

  if (filterRole) {
    filterRole.addEventListener('change', filterAndRenderUsers);
  }

  if (filterStatus) {
    filterStatus.addEventListener('change', filterAndRenderUsers);
  }

  if (btnResetFilter) {
    btnResetFilter.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (searchClear) searchClear.classList.add('hidden');
      if (filterRole) filterRole.value = '';
      if (filterStatus) filterStatus.value = '';
      filterAndRenderUsers();
    });
  }
}

/**
 * Perbarui angka kartu statistik pengguna
 */
function updateUsersStats(users) {
  const statTotal = document.getElementById('stat-user-total');
  const statAdmin = document.getElementById('stat-user-admin');
  const statEditor = document.getElementById('stat-user-editor');
  const statReporter = document.getElementById('stat-user-reporter');

  const total = users.length;
  const adminCount = users.filter(u => (u.role || '').toLowerCase() === 'administrator').length;
  const editorCount = users.filter(u => (u.role || '').toLowerCase() === 'editor').length;
  const reporterCount = users.filter(u => (u.role || '').toLowerCase() === 'reporter').length;

  if (statTotal) statTotal.textContent = total;
  if (statAdmin) statAdmin.textContent = adminCount;
  if (statEditor) statEditor.textContent = editorCount;
  if (statReporter) statReporter.textContent = reporterCount;
}

/**
 * Memuat daftar seluruh pengguna sistem dari API
 */
async function loadLiveUsers() {
  const tbody = document.getElementById('user-table-body');
  const mobileCards = document.getElementById('user-mobile-cards');
  const countHeader = document.getElementById('user-count-header');
  const emptyState = document.getElementById('user-empty-state');

  if (emptyState) emptyState.classList.add('hidden');

  // Loading skeleton di desktop table
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-8 text-center text-gray-500">
          <div class="inline-block animate-spin w-5 h-5 border-2 border-buser-red border-t-transparent rounded-full mb-2"></div>
          <p class="text-xs font-semibold">Memuat daftar akun pengguna dari database...</p>
        </td>
      </tr>
    `;
  }

  // Loading skeleton di mobile cards
  if (mobileCards) {
    mobileCards.innerHTML = `
      <div class="p-4 space-y-3 animate-pulse bg-white">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-full bg-gray-200"></div>
          <div class="flex-1 space-y-1.5">
            <div class="h-3.5 bg-gray-200 rounded w-1/3"></div>
            <div class="h-2.5 bg-gray-100 rounded w-1/2"></div>
          </div>
        </div>
        <div class="h-8 bg-gray-100 rounded"></div>
      </div>
      <div class="p-4 space-y-3 animate-pulse bg-white border-t border-gray-100">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-full bg-gray-200"></div>
          <div class="flex-1 space-y-1.5">
            <div class="h-3.5 bg-gray-200 rounded w-1/3"></div>
            <div class="h-2.5 bg-gray-100 rounded w-1/2"></div>
          </div>
        </div>
        <div class="h-8 bg-gray-100 rounded"></div>
      </div>
    `;
  }

  try {
    if (!window.BuserInfoAPI || !window.BuserInfoAPI.getUsers) {
      throw new Error('API Client belum terpasang dengan benar');
    }

    const users = await window.BuserInfoAPI.getUsers();
    allUsers = users || [];

    updateUsersStats(allUsers);
    filterAndRenderUsers();
  } catch (err) {
    console.error('[Pengguna] Gagal memuat data:', err);
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="py-8 text-center text-red-500">
            <p class="text-xs font-semibold">Gagal memuat daftar pengguna</p>
            <p class="text-[11px] text-gray-500 mt-1">${err.message || 'Terjadi kesalahan pada koneksi server.'}</p>
            <button type="button" onclick="loadLiveUsers()" class="mt-3 btn btn-outline btn-sm">Coba Lagi</button>
          </td>
        </tr>
      `;
    }
    if (mobileCards) {
      mobileCards.innerHTML = `
        <div class="p-6 text-center text-red-500 bg-white">
          <p class="text-xs font-semibold">Gagal memuat daftar pengguna</p>
          <p class="text-[11px] text-gray-500 mt-1">${err.message || 'Terjadi kesalahan pada koneksi server.'}</p>
          <button type="button" onclick="loadLiveUsers()" class="mt-3 btn btn-outline btn-sm">Coba Lagi</button>
        </div>
      `;
    }
  }
}

/**
 * Filter data pengguna dan render serentak ke mobile cards & desktop table
 */
function filterAndRenderUsers() {
  const searchInput = document.getElementById('search-user-input');
  const filterRole = document.getElementById('filter-user-role');
  const filterStatus = document.getElementById('filter-user-status');
  const countHeader = document.getElementById('user-count-header');
  const emptyState = document.getElementById('user-empty-state');
  const tbody = document.getElementById('user-table-body');
  const mobileCards = document.getElementById('user-mobile-cards');

  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const roleVal = filterRole ? filterRole.value.trim().toLowerCase() : '';
  const statusVal = filterStatus ? filterStatus.value.trim().toLowerCase() : '';

  const filtered = allUsers.filter(u => {
    // 1. Query pencarian nama, email, id
    if (query) {
      const matchName = (u.nama_users || '').toLowerCase().includes(query);
      const matchEmail = (u.email_users || '').toLowerCase().includes(query);
      const matchId = `u-${String(u.id).padStart(3, '0')}`.toLowerCase().includes(query) || String(u.id).includes(query);
      if (!matchName && !matchEmail && !matchId) return false;
    }

    // 2. Filter Role
    if (roleVal) {
      const uRole = (u.role || '').toLowerCase();
      if (uRole !== roleVal) return false;
    }

    // 3. Filter Status
    if (statusVal) {
      const uStatus = (u.status || 'active').toLowerCase();
      if (uStatus !== statusVal) return false;
    }

    return true;
  });

  if (countHeader) {
    countHeader.textContent = `${filtered.length} Akun Terdaftar`;
  }

  // Tampilkan empty state jika tidak ada hasil
  if (filtered.length === 0) {
    if (tbody) tbody.innerHTML = '';
    if (mobileCards) mobileCards.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  renderUserRows(filtered);
}

/**
 * Render baris pengguna secara dinamis ke Mobile Cards dan Desktop Table
 */
function renderUserRows(users) {
  const tbody = document.getElementById('user-table-body');
  const mobileCards = document.getElementById('user-mobile-cards');

  if (tbody) tbody.innerHTML = '';
  if (mobileCards) mobileCards.innerHTML = '';

  const currentUser = (window.BuserInfoAPI && window.BuserInfoAPI.getUser) ? window.BuserInfoAPI.getUser() : null;

  const roleBadges = {
    'Administrator': 'bg-red-100 text-buser-red border border-red-200/60',
    'Editor': 'bg-blue-100 text-blue-800 border border-blue-200/60',
    'Reporter': 'bg-emerald-100 text-emerald-800 border border-emerald-200/60'
  };

  const avatarColors = [
    'bg-neutral-900 text-white ring-2 ring-red-600/30',
    'bg-blue-600 text-white',
    'bg-emerald-600 text-white',
    'bg-purple-600 text-white',
    'bg-amber-600 text-white',
    'bg-rose-600 text-white'
  ];

  users.forEach((user, idx) => {
    const isSelf = currentUser && (String(currentUser.id) === String(user.id) || currentUser.email_users === user.email_users);
    const initials = getInitials(user.nama_users || 'User');
    const avatarColor = avatarColors[idx % avatarColors.length];
    const roleBadge = roleBadges[user.role] || 'bg-gray-100 text-gray-700 border border-gray-200';
    const isActive = (user.status || 'active').toLowerCase() === 'active';

    const statusBadge = isActive
      ? '<span class="badge-status badge-published shrink-0">Aktif</span>'
      : '<span class="badge-status badge-draft shrink-0">Nonaktif</span>';

    const formattedLogin = formatDateTime(user.last_login);
    const toggleText = isActive ? 'Nonaktifkan' : 'Aktifkan';
    const toggleColor = isActive ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50' : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50';

    // ----------------------------------------------------
    // 1. RENDER KARTU KHUSUS MOBILE (< 768px)
    // ----------------------------------------------------
    if (mobileCards) {
      const card = document.createElement('div');
      card.className = 'p-3.5 sm:p-4 bg-white border-b border-gray-100 space-y-3 hover:bg-gray-50/50 transition-colors';
      card.innerHTML = `
        <!-- Top Row: Avatar, Nama, ID & Status -->
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center space-x-3 min-w-0">
            <div class="w-10 h-10 rounded-full ${avatarColor} text-xs font-bold flex items-center justify-center shrink-0 shadow-2xs">
              ${escapeHtml(initials)}
            </div>
            <div class="min-w-0">
              <div class="font-bold text-gray-900 text-sm flex items-center space-x-1.5 truncate">
                <span class="truncate">${escapeHtml(user.nama_users)}</span>
                ${isSelf ? '<span class="px-1.5 py-0.5 text-[9px] font-bold bg-neutral-900 text-white rounded shrink-0 leading-tight">Anda</span>' : ''}
              </div>
              <div class="flex items-center space-x-2 text-[10px] text-gray-400 mt-0.5">
                <span class="font-mono font-medium">ID: U-${String(user.id).padStart(3, '0')}</span>
                <span>•</span>
                <span class="inline-block px-1.5 py-0.5 rounded font-semibold ${roleBadge}">${escapeHtml(user.role || 'Reporter')}</span>
              </div>
            </div>
          </div>
          <div class="shrink-0">
            ${statusBadge}
          </div>
        </div>

        <!-- Middle Info: Email & Terakhir Masuk -->
        <div class="grid grid-cols-1 gap-1.5 bg-gray-50/80 p-2.5 rounded-lg border border-gray-100 text-xs">
          <div class="flex items-center space-x-2 text-gray-600 min-w-0">
            <svg class="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            <span class="font-mono text-[11px] truncate">${escapeHtml(user.email_users)}</span>
          </div>
          <div class="flex items-center space-x-2 text-gray-500 text-[11px]">
            <svg class="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span>Masuk: <strong class="text-gray-700">${formattedLogin}</strong></span>
          </div>
        </div>

        <!-- Touch Action Buttons (Sejajar 50:50, Min Height 38px) -->
        <div class="pt-1 flex flex-col gap-2">
          <!-- Row 1: Edit & Ubah Role -->
          <div class="flex items-center gap-2">
            <button type="button" class="btn-card-edit flex-1 min-h-[38px] py-2 px-3 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60 active:scale-98 flex items-center justify-center gap-1.5 transition-all">
              <svg class="w-3.5 h-3.5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              <span>${isSelf ? 'Edit Data Saya' : 'Edit Pengguna'}</span>
            </button>
            <button type="button" class="btn-card-role flex-1 min-h-[38px] py-2 px-3 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 active:scale-98 flex items-center justify-center gap-1.5 transition-all">
              <svg class="w-3.5 h-3.5 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              <span>Ubah Peran</span>
            </button>
          </div>

          ${!isSelf ? `
          <!-- Row 2: Status Toggle & Hapus -->
          <div class="flex items-center gap-2">
            <button type="button" class="btn-card-toggle flex-1 min-h-[38px] py-2 px-2.5 rounded-lg text-xs font-semibold ${isActive ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'} active:scale-98 flex items-center justify-center gap-1.5 transition-all">
              ${isActive ? `
                <svg class="w-3.5 h-3.5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
                <span>Nonaktifkan</span>
              ` : `
                <svg class="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                <span>Aktifkan</span>
              `}
            </button>
            <button type="button" class="btn-card-delete flex-1 min-h-[38px] py-2 px-3 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200/60 active:scale-98 flex items-center justify-center gap-1.5 transition-all">
              <svg class="w-3.5 h-3.5 text-red-600 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              <span>Hapus Akun</span>
            </button>
          </div>
          ` : ''}
        </div>
      `;

      card.querySelector('.btn-card-edit').addEventListener('click', () => openUserModal(user));
      card.querySelector('.btn-card-role').addEventListener('click', () => openChangeRoleModal(user));

      const btnCardToggle = card.querySelector('.btn-card-toggle');
      if (btnCardToggle) {
        btnCardToggle.addEventListener('click', () => toggleUserStatus(user.id, user.nama_users, user.status));
      }

      const btnCardDelete = card.querySelector('.btn-card-delete');
      if (btnCardDelete) {
        btnCardDelete.addEventListener('click', () => deleteUser(user.id, user.nama_users));
      }

      mobileCards.appendChild(card);
    }

    // ----------------------------------------------------
    // 2. RENDER BARIS TABEL DESKTOP (>= 768px)
    // ----------------------------------------------------
    if (tbody) {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-gray-50/80 transition-colors group';

      tr.innerHTML = `
        <td class="py-3.5 px-4">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-full ${avatarColor} text-xs font-bold flex items-center justify-center shrink-0">
              ${escapeHtml(initials)}
            </div>
            <div>
              <div class="font-bold text-gray-900 flex items-center space-x-1.5 group-hover:text-buser-red transition-colors">
                <span>${escapeHtml(user.nama_users)}</span>
                ${isSelf ? '<span class="px-1.5 py-0.2 text-[9px] font-bold bg-neutral-900 text-white rounded">Anda</span>' : ''}
              </div>
              <div class="text-[10px] text-gray-400">ID: U-${String(user.id).padStart(3, '0')}</div>
            </div>
          </div>
        </td>
        <td class="py-3.5 px-4 text-gray-600 font-mono text-xs">${escapeHtml(user.email_users)}</td>
        <td class="py-3.5 px-4">
          <span class="inline-block px-2 py-0.5 font-semibold ${roleBadge} rounded text-[11px]">${escapeHtml(user.role || 'Reporter')}</span>
        </td>
        <td class="py-3.5 px-4">${statusBadge}</td>
        <td class="py-3.5 px-4 text-gray-500 text-xs">${formattedLogin}</td>
        <td class="py-3.5 px-4 text-right whitespace-nowrap">
          <div class="flex items-center justify-end gap-1.5">
            <button type="button" class="btn-table-edit px-2.5 py-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 text-xs font-semibold inline-flex items-center gap-1 transition-colors" title="Edit Data Pengguna">
              <svg class="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              <span>Edit</span>
            </button>
            <button type="button" class="btn-table-role px-2.5 py-1.5 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 text-xs font-semibold inline-flex items-center gap-1 transition-colors" title="Ubah Hak Akses Peran">
              <svg class="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              <span>Role</span>
            </button>
            ${!isSelf ? `
              <button type="button" class="btn-table-toggle px-2.5 py-1.5 rounded-lg ${toggleColor} text-xs font-semibold inline-flex items-center gap-1 transition-colors" title="${toggleText}">
                <span>${toggleText}</span>
              </button>
              <button type="button" class="btn-table-delete px-2.5 py-1.5 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-50 text-xs font-semibold inline-flex items-center gap-1 transition-colors" title="Hapus Akun Pengguna">
                <svg class="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                <span>Hapus</span>
              </button>
            ` : ''}
          </div>
        </td>
      `;

      tr.querySelector('.btn-table-edit').addEventListener('click', () => openUserModal(user));
      tr.querySelector('.btn-table-role').addEventListener('click', () => openChangeRoleModal(user));

      const btnTableToggle = tr.querySelector('.btn-table-toggle');
      if (btnTableToggle) {
        btnTableToggle.addEventListener('click', () => toggleUserStatus(user.id, user.nama_users, user.status));
      }

      const btnTableDelete = tr.querySelector('.btn-table-delete');
      if (btnTableDelete) {
        btnTableDelete.addEventListener('click', () => deleteUser(user.id, user.nama_users));
      }

      tbody.appendChild(tr);
    }
  });
}

/**
 * Buka modal tambah atau edit pengguna (Gaya Bottom Sheet di Mobile)
 */
function openUserModal(user = null) {
  const modalTitle = document.getElementById('user-modal-title');
  const idInput = document.getElementById('user-id-input');
  const nameInput = document.getElementById('user-name-input');
  const emailInput = document.getElementById('user-email-input');
  const roleSelect = document.getElementById('user-role-select');
  const passInput = document.getElementById('user-pass-input');
  const passLabel = document.getElementById('user-pass-label');

  if (!modalTitle || !nameInput || !emailInput || !passInput) return;

  if (user) {
    modalTitle.textContent = 'Edit Pengguna: ' + user.nama_users;
    if (idInput) idInput.value = user.id;
    nameInput.value = user.nama_users || '';
    emailInput.value = user.email_users || '';
    if (roleSelect) roleSelect.value = user.role || 'Reporter';
    passInput.value = '';
    passInput.placeholder = 'Biarkan kosong jika tidak ingin mengubah password';
    passInput.required = false;
    if (passLabel) passLabel.textContent = 'Ganti Password (Opsional)';
  } else {
    modalTitle.textContent = 'Tambah Pengguna Baru';
    if (idInput) idInput.value = '';
    nameInput.value = '';
    emailInput.value = '';
    if (roleSelect) roleSelect.value = 'Reporter';
    generateRandomPassword();
    passInput.required = true;
    if (passLabel) passLabel.textContent = 'Password Sementara';
  }

  if (typeof openModal === 'function') {
    openModal('user-modal');
  } else {
    const m = document.getElementById('user-modal');
    if (m) m.classList.remove('hidden');
  }

  setTimeout(() => {
    nameInput.focus();
  }, 100);
}

/**
 * Acak password sementara baru
 */
function generateRandomPassword() {
  const passInput = document.getElementById('user-pass-input');
  if (!passInput) return;
  const num = Math.floor(1000 + Math.random() * 9000);
  passInput.value = 'Buser#' + num;
}

/**
 * Submit form tambah / edit pengguna
 */
async function handleUserFormSubmit(e) {
  e.preventDefault();

  const idInput = document.getElementById('user-id-input');
  const nameInput = document.getElementById('user-name-input');
  const emailInput = document.getElementById('user-email-input');
  const roleSelect = document.getElementById('user-role-select');
  const passInput = document.getElementById('user-pass-input');

  const id = idInput ? idInput.value : '';
  const name = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';
  const role = roleSelect ? roleSelect.value : 'Reporter';
  const password = passInput ? passInput.value.trim() : '';

  if (!name || !email) {
    if (typeof showToast === 'function') showToast('error', 'Validasi Gagal', 'Nama dan email wajib diisi!');
    return;
  }

  if (!id && !password) {
    if (typeof showToast === 'function') showToast('error', 'Validasi Gagal', 'Password wajib diisi untuk pengguna baru!');
    return;
  }

  if (typeof closeModal === 'function') {
    closeModal('user-modal');
  } else {
    const m = document.getElementById('user-modal');
    if (m) m.classList.add('hidden');
  }

  try {
    let res;
    if (id) {
      const payload = { name, email, role };
      if (password) payload.password = password;
      res = await window.BuserInfoAPI.updateUser(id, payload);
    } else {
      res = await window.BuserInfoAPI.createUser({ name, email, role, password });
    }

    if (res && res.status === 'success') {
      if (typeof showToast === 'function') {
        showToast('success', 'Berhasil', id ? 'Data pengguna berhasil diperbarui.' : `Pengguna "${name}" berhasil ditambahkan.`);
      }
      loadLiveUsers();
    } else {
      if (typeof showToast === 'function') {
        showToast('error', 'Gagal', (res && res.message) ? res.message : 'Gagal menyimpan pengguna.');
      }
    }
  } catch (err) {
    console.error('[Pengguna] Error submit:', err);
    if (typeof showToast === 'function') showToast('error', 'Kesalahan Server', err.message);
  }
}

/**
 * Modal cepat ubah hak akses (role) - Dioptimalkan untuk Bottom Sheet Mobile
 */
function openChangeRoleModal(user) {
  const roles = ['Administrator', 'Editor', 'Reporter'];
  const roleDescriptions = {
    'Administrator': 'Akses penuh ke semua modul, pengaturan sistem, dan manajemen akun.',
    'Editor': 'Dapat memeriksa, menyunting, dan menerbitkan naskah berita.',
    'Reporter': 'Dapat menulis berita baru dan menyimpan draf artikel.'
  };

  const roleOptions = roles.map(r => `
    <label class="flex items-start space-x-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors">
      <input type="radio" name="quick_role_choice" value="${r}" ${r === user.role ? 'checked' : ''} class="text-buser-red focus:ring-buser-red mt-0.5">
      <div class="min-w-0 flex-1">
        <span class="text-xs font-bold text-gray-900 block">${r}</span>
        <span class="text-[11px] text-gray-500 block leading-tight mt-0.5">${roleDescriptions[r]}</span>
      </div>
    </label>
  `).join('');

  let modal = document.getElementById('role-change-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'role-change-modal';
    modal.className = 'modal-container fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-backdrop hidden';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="bg-white rounded-t-2xl sm:rounded-xl max-w-sm w-full p-4 sm:p-6 shadow-2xl border border-gray-200 max-h-[90vh] flex flex-col">
      <!-- Drag handle indicator on mobile -->
      <div class="w-10 h-1 bg-gray-300 rounded-full mx-auto sm:hidden -mt-1 mb-2.5 shrink-0"></div>

      <div class="flex items-center justify-between pb-3 border-b border-gray-200 shrink-0">
        <div class="flex items-center space-x-2">
          <span class="w-2.5 h-2.5 bg-buser-red rounded-full"></span>
          <h3 class="text-sm font-bold text-gray-900">Ubah Hak Akses Pengguna</h3>
        </div>
        <button type="button" class="text-gray-400 hover:text-gray-600 p-1" data-modal-close>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div class="mt-3 overflow-y-auto pr-0.5 flex-1">
        <p class="text-xs text-gray-600 mb-3">Pilih peran sistem baru untuk akun <strong class="text-gray-900">${escapeHtml(user.nama_users)}</strong>:</p>
        <div class="space-y-2 mb-3">
          ${roleOptions}
        </div>
      </div>

      <div class="mt-3 pt-3 border-t border-gray-100 flex flex-col-reverse sm:flex-row justify-end gap-2 shrink-0">
        <button type="button" class="btn btn-outline btn-sm w-full sm:w-auto py-2" data-modal-close>Batal</button>
        <button type="button" id="btn-submit-change-role" class="btn btn-primary btn-sm w-full sm:w-auto py-2">Simpan Peran</button>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');

  // Close handlers
  modal.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.onclick = () => {
      modal.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    };
  });

  const submitBtn = modal.querySelector('#btn-submit-change-role');
  submitBtn.onclick = async () => {
    const selected = modal.querySelector('input[name="quick_role_choice"]:checked');
    if (!selected) return;
    const newRole = selected.value;

    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');

    try {
      const res = await window.BuserInfoAPI.changeUserRole(user.id, newRole);
      if (res && res.status === 'success') {
        if (typeof showToast === 'function') showToast('success', 'Peran Diperbarui', `Role ${user.nama_users} berhasil diubah ke ${newRole}.`);
        loadLiveUsers();
      } else {
        if (typeof showToast === 'function') showToast('error', 'Gagal', (res && res.message) ? res.message : 'Gagal mengubah peran.');
      }
    } catch (err) {
      if (typeof showToast === 'function') showToast('error', 'Kesalahan Server', err.message);
    }
  };
}

/**
 * Toggle status aktif / nonaktif pengguna
 */
function toggleUserStatus(id, name, currentStatus) {
  const isCurrentlyActive = (currentStatus || 'active').toLowerCase() === 'active';
  const targetAction = isCurrentlyActive ? 'Nonaktifkan' : 'Aktifkan Kembali';
  const confirmType = isCurrentlyActive ? 'warning' : 'primary';

  if (typeof confirmAction === 'function') {
    confirmAction({
      title: `${targetAction} Akun Pengguna?`,
      message: isCurrentlyActive
        ? `Pengguna "${name}" tidak akan dapat login lagi ke sistem CMS sampai diaktifkan kembali.`
        : `Pengguna "${name}" akan diizinkan kembali masuk ke panel admin CMS.`,
      confirmText: targetAction,
      type: confirmType,
      onConfirm: async () => {
        try {
          const res = await window.BuserInfoAPI.toggleUserStatus(id);
          if (res && res.status === 'success') {
            if (typeof showToast === 'function') showToast('warning', 'Status Pengguna Diperbarui', `Akses untuk ${name} kini ${res.data && res.data.status === 'active' ? 'Aktif' : 'Nonaktif'}.`);
            loadLiveUsers();
          } else {
            if (typeof showToast === 'function') showToast('error', 'Gagal', (res && res.message) ? res.message : 'Gagal mengubah status.');
          }
        } catch (err) {
          if (typeof showToast === 'function') showToast('error', 'Kesalahan Server', err.message);
        }
      }
    });
  }
}

/**
 * Hapus akun pengguna CMS
 */
function deleteUser(id, name) {
  if (typeof confirmAction === 'function') {
    confirmAction({
      title: `Hapus Akun Pengguna?`,
      message: `Akun "${name}" akan dihapus secara permanen dari basis data sistem. Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Hapus Permanen',
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await window.BuserInfoAPI.deleteUser(id);
          if (res && res.status === 'success') {
            if (typeof showToast === 'function') showToast('success', 'Pengguna Dihapus', `Akun ${name} telah berhasil dihapus permanen.`);
            loadLiveUsers();
          } else {
            if (typeof showToast === 'function') showToast('error', 'Gagal Menghapus', (res && res.message) ? res.message : 'Akun pengguna tidak dapat dihapus.');
          }
        } catch (err) {
          if (typeof showToast === 'function') showToast('error', 'Kesalahan Server', err.message);
        }
      }
    });
  }
}

/**
 * Helper: Format Tanggal dan Jam
 */
function formatDateTime(dtStr) {
  if (!dtStr) return '-';
  try {
    const d = new Date(dtStr);
    if (isNaN(d.getTime())) return dtStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const day = d.getDate();
    const mon = months[d.getMonth()];
    const yr = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${mon} ${yr}, ${hh}:${mm} WIB`;
  } catch (e) {
    return dtStr;
  }
}

/**
 * Helper: Ambil inisial nama
 */
function getInitials(name) {
  if (!name) return 'US';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Helper: Escape HTML
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

window.loadLiveUsers = loadLiveUsers;
