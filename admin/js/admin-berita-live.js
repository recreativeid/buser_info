/**
 * BUSER INFO - Integrasi Berita Dinamis ke Tabel Admin (admin/berita.html)
 * Mengelola pemuatan artikel dari REST API/PostgreSQL, tab switching (Semua, Published, Draft, Review, Scheduled),
 * live search & filtering (Kategori, Penulis, Tanggal), bulk actions, dan hapus artikel secara real-time.
 */

document.addEventListener('DOMContentLoaded', () => {
  initBeritaTabs();
  initBeritaFilters();
  initCheckboxAndBulkActions();
  populateCategoryFilter();
  loadLiveArticlesFromDB();
  updateBeritaTabCounts();
  initNewsModalAndEditor();
  checkUrlNewsActions();
});

/**
 * 1. Inisialisasi Tab Status Berita (Semua, Published, Draft, Review, Scheduled)
 */
function initBeritaTabs() {
  const tabs = document.querySelectorAll('.news-tab-btn');
  if (!tabs || tabs.length === 0) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('active', 'bg-white', 'text-buser-red', 'font-bold', 'shadow-xs', 'border', 'border-gray-200/80');
        t.classList.add('text-gray-600', 'font-medium');
      });
      tab.classList.add('active', 'bg-white', 'text-buser-red', 'font-bold', 'shadow-xs', 'border', 'border-gray-200/80');
      tab.classList.remove('text-gray-600', 'font-medium');

      currentPage = 1;
      applyFilters();
    });
  });
}

/**
 * 2. Inisialisasi Filter Pencarian, Kategori, Penulis, Tanggal, Limit (Jumlah Tampil) & Reset
 */
function initBeritaFilters() {
  const searchInput = document.getElementById('filter-search');
  const searchClear = document.getElementById('filter-search-clear');
  const catSelect = document.getElementById('filter-category');
  const authorSelect = document.getElementById('filter-author');
  const dateInput = document.getElementById('filter-date');
  const limitFilter = document.getElementById('filter-limit');
  const limitPag = document.getElementById('pagination-limit');
  const resetBtn = document.getElementById('btn-reset-filters');

  const onFilterChange = () => {
    currentPage = 1;
    applyFilters();
  };

  [searchInput, catSelect, authorSelect, dateInput].forEach(el => {
    if (!el) return;
    el.addEventListener('input', onFilterChange);
    el.addEventListener('change', onFilterChange);
  });

  // Sinkronisasi dropdown limit per halaman (atas & bawah)
  if (limitFilter) {
    limitFilter.addEventListener('change', () => {
      if (limitPag) limitPag.value = limitFilter.value;
      currentPage = 1;
      applyFilters();
    });
  }

  if (limitPag) {
    limitPag.addEventListener('change', () => {
      if (limitFilter) limitFilter.value = limitPag.value;
      currentPage = 1;
      applyFilters();
    });
  }

  if (searchInput && searchClear) {
    searchInput.addEventListener('input', () => {
      if (searchInput.value.trim().length > 0) {
        searchClear.classList.remove('hidden');
      } else {
        searchClear.classList.add('hidden');
      }
    });

    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchClear.classList.add('hidden');
      currentPage = 1;
      applyFilters();
      searchInput.focus();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (searchClear) searchClear.classList.add('hidden');
      if (catSelect) catSelect.value = '';
      if (authorSelect) authorSelect.value = '';
      if (dateInput) dateInput.value = '';
      if (limitFilter) limitFilter.value = '10';
      if (limitPag) limitPag.value = '10';

      currentPage = 1;
      applyFilters();
      if (typeof showToast === 'function') {
        showToast('info', 'Filter Direset', 'Semua kriteria pencarian telah dikembalikan.');
      }
    });
  }
}

/**
 * 3. Inisialisasi Checkbox "Pilih Semua" dan Event Delegation untuk Checkbox Baris / Card
 */
function initCheckboxAndBulkActions() {
  const checkAll = document.getElementById('check-all');
  const checkAllMobile = document.getElementById('check-all-mobile');
  const tableBody = document.getElementById('news-table-body');
  const mobileCards = document.getElementById('news-mobile-cards');

  const setAllChecked = (isChecked) => {
    const visibleTableCbs = tableBody ? tableBody.querySelectorAll('tr:not(.hidden) .row-checkbox') : [];
    const visibleMobileCbs = mobileCards ? mobileCards.querySelectorAll('.news-card:not(.hidden) .row-checkbox') : [];
    visibleTableCbs.forEach(cb => { cb.checked = isChecked; });
    visibleMobileCbs.forEach(cb => { cb.checked = isChecked; });

    if (checkAll) checkAll.checked = isChecked;
    if (checkAllMobile) checkAllMobile.checked = isChecked;
    updateBulkBar();
  };

  if (checkAll) {
    checkAll.addEventListener('change', () => setAllChecked(checkAll.checked));
  }

  if (checkAllMobile) {
    checkAllMobile.addEventListener('change', () => setAllChecked(checkAllMobile.checked));
  }

  // Event delegation untuk checkbox individual (sync desktop & mobile jika ID sama)
  document.addEventListener('change', (e) => {
    if (e.target && e.target.classList.contains('row-checkbox')) {
      const targetVal = e.target.value;
      const isChecked = e.target.checked;

      // Sinkronkan checkbox dengan ID yang sama di card atau tabel
      document.querySelectorAll(`.row-checkbox[value="${targetVal}"]`).forEach(cb => {
        cb.checked = isChecked;
      });

      updateBulkBar();
      updateCheckAllStatus();
    }
  });
}

/**
 * Perbarui status checkbox "check-all" sesuai checkbox baris & kartu yang terlihat
 */
function updateCheckAllStatus() {
  const checkAll = document.getElementById('check-all');
  const checkAllMobile = document.getElementById('check-all-mobile');
  const tableBody = document.getElementById('news-table-body');
  const mobileCards = document.getElementById('news-mobile-cards');

  const visibleTableCbs = tableBody ? tableBody.querySelectorAll('tr:not(.hidden) .row-checkbox') : [];
  const visibleMobileCbs = mobileCards ? mobileCards.querySelectorAll('.news-card:not(.hidden) .row-checkbox') : [];

  if (checkAll) {
    checkAll.checked = visibleTableCbs.length > 0 && Array.from(visibleTableCbs).every(cb => cb.checked);
  }
  if (checkAllMobile) {
    checkAllMobile.checked = visibleMobileCbs.length > 0 && Array.from(visibleMobileCbs).every(cb => cb.checked);
  }
}

/**
 * Perbarui Floating Bulk Action Bar
 */
function updateBulkBar() {
  const bulkBar = document.getElementById('bulk-action-bar');
  const selectedCount = document.getElementById('selected-count');
  if (!bulkBar || !selectedCount) return;

  const checkedBoxes = Array.from(document.querySelectorAll('.row-checkbox:checked'));
  const uniqueIds = Array.from(new Set(checkedBoxes.map(cb => cb.value)));

  if (uniqueIds.length > 0) {
    bulkBar.classList.remove('hidden');
    selectedCount.textContent = uniqueIds.length;
  } else {
    bulkBar.classList.add('hidden');
  }
}

/**
 * 4. Muat Kategori Real ke Dropdown Filter
 */
async function populateCategoryFilter() {
  const catSelect = document.getElementById('filter-category');
  if (!catSelect || !window.BuserInfoAPI || !window.BuserInfoAPI.getCategories) return;

  try {
    const cats = await window.BuserInfoAPI.getCategories();
    if (!Array.isArray(cats) || cats.length === 0) return;

    const currentVal = catSelect.value.toLowerCase().trim();
    catSelect.innerHTML = '<option value="">Semua Kategori</option>';

    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.name_kategori;
      opt.textContent = c.name_kategori;
      if (currentVal && currentVal === c.name_kategori.toLowerCase().trim()) {
        opt.selected = true;
      }
      catSelect.appendChild(opt);
    });
  } catch (e) {
    console.warn('[BeritaLive] Gagal memuat daftar kategori:', e);
  }
}

/**
 * Muat Penulis Real ke Dropdown Filter berdasarkan data artikel
 */
function populateAuthorFilter(articles) {
  const authorSelect = document.getElementById('filter-author');
  if (!authorSelect || !Array.isArray(articles) || articles.length === 0) return;

  const currentVal = authorSelect.value.toLowerCase().trim();
  const authors = Array.from(new Set(articles.map(a => (a.author_name || '').trim()).filter(Boolean)));
  if (authors.length === 0) return;

  authorSelect.innerHTML = '<option value="">Semua Penulis</option>';
  authors.forEach(auth => {
    const opt = document.createElement('option');
    opt.value = auth;
    opt.textContent = auth;
    if (currentVal && currentVal === auth.toLowerCase().trim()) {
      opt.selected = true;
    }
    authorSelect.appendChild(opt);
  });
}

let currentLoadRequestId = 0;

/**
 * 5. Muat Berita dari Database PostgreSQL via REST API (Dual Render: Desktop Table & Mobile Cards)
 */
async function loadLiveArticlesFromDB() {
  const requestId = ++currentLoadRequestId;
  const tableBody = document.getElementById('news-table-body');
  const mobileCardsContainer = document.getElementById('news-mobile-cards');
  const listWrapper = document.getElementById('news-list-wrapper');
  const emptyState = document.getElementById('empty-state');
  if (!tableBody || !window.BuserInfoAPI) return;

  try {
    const data = await window.BuserInfoAPI.getArticles({ limit: 500 });

    // Cegah race condition jika ada permintaan fetch yang lebih baru
    if (requestId !== currentLoadRequestId) {
      return;
    }

    const rawArticles = data.articles || [];

    // Deduplikasi artikel berdasarkan id_artikel (pastikan setiap ID hanya muncul tepat satu kali)
    const seenIds = new Set();
    const articles = [];
    rawArticles.forEach(item => {
      if (item && item.id_artikel && !seenIds.has(String(item.id_artikel))) {
        seenIds.add(String(item.id_artikel));
        articles.push(item);
      }
    });

    if (articles.length === 0) {
      tableBody.innerHTML = '';
      if (mobileCardsContainer) mobileCardsContainer.innerHTML = '';
      if (listWrapper) listWrapper.classList.add('hidden');
      if (emptyState) emptyState.classList.remove('hidden');
      updateTabCountsFromDOM();
      return;
    }

    // Bersihkan kontainer DOM sebelum merender artikel unik
    tableBody.innerHTML = '';
    if (mobileCardsContainer) mobileCardsContainer.innerHTML = '';

    articles.forEach(item => {
      const dateFormatted = item.published_at 
        ? new Date(item.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
        : '-';

      const dateIso = item.published_at ? item.published_at.substring(0, 10) : '';

      const thumbUrl = item.thumbnail && item.thumbnail.startsWith('assets/') 
        ? `../${item.thumbnail}` 
        : (item.thumbnail || '../assets/images/berita/hero/sorotan-utama-dunia.jpg');

      const st = (item.status || 'draft').toLowerCase().trim();
      let statusBadge = '';
      if (st === 'published') {
        statusBadge = `<span class="badge-status badge-published"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Published</span>`;
      } else if (st === 'review') {
        statusBadge = `<span class="badge-status badge-review"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Review</span>`;
      } else if (st === 'scheduled') {
        statusBadge = `<span class="badge-status badge-scheduled"><span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Scheduled</span>`;
      } else {
        statusBadge = `<span class="badge-status badge-draft"><span class="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Draft</span>`;
      }

      // 1. Desktop Table Row (Hanya aktif di desktop via hidden md:block)
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-gray-50/80 transition-colors news-row';
      tr.setAttribute('data-status', st);
      tr.setAttribute('data-category', (item.name_kategori || 'Umum').toLowerCase().trim());
      tr.setAttribute('data-author', (item.author_name || 'Redaksi').toLowerCase().trim());
      tr.setAttribute('data-date', dateIso);

      tr.innerHTML = `
        <td class="py-3 px-4">
          <input type="checkbox" value="${item.id_artikel}" class="row-checkbox w-4 h-4 rounded border-gray-300 text-buser-red focus:ring-buser-red cursor-pointer">
        </td>
        <td class="py-3 px-4">
          <img src="${thumbUrl}" alt="Thumb" class="w-14 h-10 object-cover rounded border border-gray-200" onerror="this.src='../assets/images/berita/hero/sorotan-utama-dunia.jpg'">
        </td>
        <td class="py-3 px-4 font-semibold text-gray-900 max-w-sm">
          <a href="../artikel.html?slug=${item.slug}" target="_blank" class="hover:text-buser-red transition-colors line-clamp-2">
            ${item.title}
          </a>
        </td>
        <td class="py-3 px-4">
          <span class="inline-block px-2 py-0.5 font-medium bg-red-50 text-buser-red rounded">${item.name_kategori || 'Umum'}</span>
        </td>
        <td class="py-3 px-4 font-medium text-gray-700">${item.author_name || 'Redaksi'}</td>
        <td class="py-3 px-4">
          ${statusBadge}
        </td>
        <td class="py-3 px-4 text-gray-500">${dateFormatted}</td>
        <td class="py-3 px-4 text-right whitespace-nowrap">
          <div class="flex items-center justify-end gap-1.5 w-full sm:w-auto">
            <a href="../artikel.html?slug=${item.slug}" target="_blank" class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 transition-colors shrink-0 shadow-xs" title="Pratinjau Berita">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            </a>
            <button type="button" onclick="openEditNewsModal(${item.id_artikel})" class="w-8 h-8 rounded-lg flex items-center justify-center text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 transition-colors shrink-0 shadow-xs" title="Edit Berita">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button type="button" onclick="handleDeleteRealArticle(${item.id_artikel})" class="w-8 h-8 rounded-lg flex items-center justify-center text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 transition-colors shrink-0 shadow-xs" title="Hapus Berita">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);

      // 2. Mobile Card View (Hanya aktif di mobile via md:hidden)
      if (mobileCardsContainer) {
        const card = document.createElement('div');
        card.className = 'p-4 bg-white space-y-3 news-card transition-colors hover:bg-gray-50/60';
        card.setAttribute('data-status', st);
        card.setAttribute('data-category', (item.name_kategori || 'Umum').toLowerCase().trim());
        card.setAttribute('data-author', (item.author_name || 'Redaksi').toLowerCase().trim());
        card.setAttribute('data-date', dateIso);

        card.innerHTML = `
          <!-- Header Bar: Checkbox, Category, Status -->
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center space-x-2.5">
              <input type="checkbox" value="${item.id_artikel}" class="row-checkbox w-4 h-4 rounded border-gray-300 text-buser-red focus:ring-buser-red cursor-pointer">
              <span class="inline-block px-2 py-0.5 text-[11px] font-bold bg-red-50 text-buser-red rounded">
                ${item.name_kategori || 'Umum'}
              </span>
            </div>
            <div>
              ${statusBadge}
            </div>
          </div>

          <!-- Body: Thumbnail & Info -->
          <div class="flex items-start space-x-3">
            <img src="${thumbUrl}" alt="Thumb" class="w-20 h-16 object-cover rounded-lg border border-gray-200 shrink-0" onerror="this.src='../assets/images/berita/hero/sorotan-utama-dunia.jpg'">
            <div class="min-w-0 flex-1">
              <a href="../artikel.html?slug=${item.slug}" target="_blank" class="text-sm font-bold text-gray-900 hover:text-buser-red transition-colors line-clamp-2 leading-snug">
                ${item.title}
              </a>
              <div class="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-gray-500 mt-1">
                <span class="font-medium text-gray-700">${item.author_name || 'Redaksi'}</span>
                <span>•</span>
                <span>${dateFormatted}</span>
              </div>
            </div>
          </div>

          <!-- Bottom: 3 Sejajar Action Buttons (Equal flex width, 38px touch target) -->
          <div class="flex items-center gap-2 pt-1 border-t border-gray-100">
            <a href="../artikel.html?slug=${item.slug}" target="_blank" class="flex-1 min-h-[38px] flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 active:scale-98 rounded-lg transition-all" title="Pratinjau Publik">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              <span>Lihat</span>
            </a>
            <button type="button" onclick="openEditNewsModal(${item.id_artikel})" class="flex-1 min-h-[38px] flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 active:scale-98 rounded-lg transition-all" title="Edit Berita">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              <span>Edit</span>
            </button>
            <button type="button" onclick="handleDeleteRealArticle(${item.id_artikel})" class="flex-1 min-h-[38px] flex items-center justify-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 active:scale-98 rounded-lg transition-all" title="Hapus Berita">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              <span>Hapus</span>
            </button>
          </div>
        `;
        mobileCardsContainer.appendChild(card);
      }
    });

    populateAuthorFilter(articles);
    applyFilters();
    updateTabCountsFromDOM();

  } catch (e) {
    console.error('[BeritaLive] Error saat memuat berita real:', e);
  }
}

let currentPage = 1;
let currentLimit = 10;

/**
 * 6. Terapkan Filter, Tab Switching & Paginasi Berdasarkan Limit (5, 10, 20, 50, 100, Semua)
 */
function applyFilters() {
  const activeTabBtn = document.querySelector('.news-tab-btn.active');
  const activeTab = (activeTabBtn ? activeTabBtn.getAttribute('data-tab') : 'all').toLowerCase().trim();

  const searchInput = document.getElementById('filter-search');
  const catSelect = document.getElementById('filter-category');
  const authorSelect = document.getElementById('filter-author');
  const dateInput = document.getElementById('filter-date');
  const limitSelect = document.getElementById('filter-limit') || document.getElementById('pagination-limit');

  const emptyState = document.getElementById('empty-state');
  const listWrapper = document.getElementById('news-list-wrapper');
  const tableBody = document.getElementById('news-table-body');
  const mobileCards = document.getElementById('news-mobile-cards');

  const summaryRange = document.getElementById('summary-range-display');
  const summaryVisible = document.getElementById('summary-visible-count');
  const summaryTotal = document.getElementById('summary-total-count');

  if (!tableBody) return;

  const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const catVal = catSelect ? catSelect.value.toLowerCase().trim() : '';
  const authorVal = authorSelect ? authorSelect.value.toLowerCase().trim() : '';
  const dateVal = dateInput ? dateInput.value.trim() : '';

  const limitVal = limitSelect ? limitSelect.value : '10';
  currentLimit = (limitVal === 'all') ? 'all' : (parseInt(limitVal, 10) || 10);

  const rows = Array.from(tableBody.querySelectorAll('.news-row'));
  const cards = mobileCards ? Array.from(mobileCards.querySelectorAll('.news-card')) : [];
  const totalCount = rows.length;

  const matchFilter = (el) => {
    const status = (el.getAttribute('data-status') || '').toLowerCase().trim();
    const cat = (el.getAttribute('data-category') || '').toLowerCase().trim();
    const author = (el.getAttribute('data-author') || '').toLowerCase().trim();
    const date = (el.getAttribute('data-date') || '').trim();
    const text = el.innerText.toLowerCase();

    const matchTab = (activeTab === 'all') || (status === activeTab);
    const matchSearch = searchVal === '' || text.includes(searchVal);
    const matchCat = catVal === '' || (cat === catVal);
    const matchAuthor = authorVal === '' || (author === authorVal);
    const matchDate = dateVal === '' || (date === dateVal);

    return matchTab && matchSearch && matchCat && matchAuthor && matchDate;
  };

  // 1. Kumpulkan pasangan baris dan kartu yang lolos filter
  const matchedPairs = [];
  rows.forEach((row, idx) => {
    const card = cards[idx];
    if (matchFilter(row)) {
      matchedPairs.push({ row, card });
    } else {
      row.classList.add('hidden');
      const cbR = row.querySelector('.row-checkbox');
      if (cbR) cbR.checked = false;
      if (card) {
        card.classList.add('hidden');
        const cbC = card.querySelector('.row-checkbox');
        if (cbC) cbC.checked = false;
      }
    }
  });

  const totalMatched = matchedPairs.length;

  // 2. Hitung jumlah total halaman berdasarkan limit yang dipilih
  let totalPages = 1;
  if (currentLimit !== 'all' && totalMatched > 0) {
    totalPages = Math.ceil(totalMatched / currentLimit);
  }

  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  // 3. Batasi tampilan elemen hanya untuk halaman aktif (Pagination Slicing)
  let startIndex = 0;
  let endIndex = totalMatched;

  if (currentLimit !== 'all' && totalMatched > 0) {
    startIndex = (currentPage - 1) * currentLimit;
    endIndex = Math.min(startIndex + currentLimit, totalMatched);
  }

  matchedPairs.forEach((pair, idx) => {
    if (idx >= startIndex && idx < endIndex) {
      pair.row.classList.remove('hidden');
      if (pair.card) pair.card.classList.remove('hidden');
    } else {
      pair.row.classList.add('hidden');
      const cbR = pair.row.querySelector('.row-checkbox');
      if (cbR) cbR.checked = false;
      if (pair.card) {
        pair.card.classList.add('hidden');
        const cbC = pair.card.querySelector('.row-checkbox');
        if (cbC) cbC.checked = false;
      }
    }
  });

  // 4. Toggle empty state jika tidak ada yang cocok
  if (emptyState) {
    if (totalMatched === 0) {
      emptyState.classList.remove('hidden');
      if (listWrapper) listWrapper.classList.add('hidden');
    } else {
      emptyState.classList.add('hidden');
      if (listWrapper) listWrapper.classList.remove('hidden');
    }
  }

  // 5. Update informasi ringkasan (Menampilkan X - Y dari Z berita)
  if (summaryVisible) summaryVisible.textContent = totalMatched;
  if (summaryTotal) summaryTotal.textContent = totalCount;
  if (summaryRange) {
    if (totalMatched === 0) {
      summaryRange.textContent = '0';
    } else if (currentLimit === 'all') {
      summaryRange.textContent = `1 - ${totalMatched}`;
    } else {
      summaryRange.textContent = `${startIndex + 1} - ${endIndex}`;
    }
  }

  // 6. Render kontrol paginasi dinamis
  renderPaginationControls(totalPages, currentPage, totalMatched);

  updateBulkBar();
  updateCheckAllStatus();
}

/**
 * Render tombol kontrol paginasi dinamis (Sebelumnya, 1, 2, 3, Selanjutnya)
 */
function renderPaginationControls(totalPages, currentPage, totalMatched) {
  const container = document.getElementById('pagination-controls');
  if (!container) return;

  if (totalMatched === 0 || totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';

  // Tombol Sebelumnya
  const prevDisabled = currentPage === 1;
  html += `
    <button type="button" 
      class="px-2.5 py-1 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:scale-95 transition-all text-xs font-medium disabled:opacity-40 disabled:pointer-events-none"
      onclick="goToPage(${currentPage - 1})" 
      ${prevDisabled ? 'disabled' : ''}>
      &laquo; Sebelumnya
    </button>
  `;

  // Nomor Halaman (Sliding Window jika halaman banyak)
  const pageNumbers = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
  } else {
    pageNumbers.push(1);
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    if (start > 2) pageNumbers.push('...');
    for (let i = start; i <= end; i++) pageNumbers.push(i);
    if (end < totalPages - 1) pageNumbers.push('...');
    pageNumbers.push(totalPages);
  }

  pageNumbers.forEach(p => {
    if (p === '...') {
      html += `<span class="px-1.5 py-1 text-gray-400 text-xs">...</span>`;
    } else {
      const isActive = p === currentPage;
      if (isActive) {
        html += `
          <button type="button" class="px-2.5 py-1 rounded border border-buser-red bg-buser-red text-white text-xs font-bold shadow-xs">
            ${p}
          </button>
        `;
      } else {
        html += `
          <button type="button" onclick="goToPage(${p})" class="px-2.5 py-1 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:scale-95 transition-all text-xs font-medium">
            ${p}
          </button>
        `;
      }
    }
  });

  // Tombol Selanjutnya
  const nextDisabled = currentPage === totalPages;
  html += `
    <button type="button" 
      class="px-2.5 py-1 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:scale-95 transition-all text-xs font-medium disabled:opacity-40 disabled:pointer-events-none"
      onclick="goToPage(${currentPage + 1})" 
      ${nextDisabled ? 'disabled' : ''}>
      Selanjutnya &raquo;
    </button>
  `;

  container.innerHTML = html;
}

/**
 * Pindah halaman paginasi
 */
function goToPage(page) {
  currentPage = page;
  applyFilters();
  const listWrapper = document.getElementById('news-list-wrapper');
  if (listWrapper && window.innerWidth < 768) {
    listWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
window.goToPage = goToPage;

/**
 * 7. Hitung Jumlah Berita Per Tab Berdasarkan Elemen yang Ada di DOM
 */
function updateTabCountsFromDOM() {
  const rows = document.querySelectorAll('#news-table-body .news-row');
  let total = rows.length;
  let published = 0;
  let draft = 0;
  let review = 0;
  let scheduled = 0;

  rows.forEach(r => {
    const st = (r.getAttribute('data-status') || '').toLowerCase().trim();
    if (st === 'published') published++;
    else if (st === 'draft') draft++;
    else if (st === 'review') review++;
    else if (st === 'scheduled') scheduled++;
  });

  const tabAll = document.getElementById('tab-count-all');
  const tabPub = document.getElementById('tab-count-published');
  const tabDraft = document.getElementById('tab-count-draft');
  const tabRev = document.getElementById('tab-count-review');
  const tabSch = document.getElementById('tab-count-scheduled');

  if (tabAll) tabAll.textContent = total;
  if (tabPub) tabPub.textContent = published;
  if (tabDraft) tabDraft.textContent = draft;
  if (tabRev) tabRev.textContent = review;
  if (tabSch) tabSch.textContent = scheduled;
}

/**
 * 8. Perbarui Angka Tab dari Endpoint Dashboard Stats (Sinkronisasi Server)
 */
async function updateBeritaTabCounts() {
  if (!window.BuserInfoAPI || !window.BuserInfoAPI.getDashboardStats) return;
  try {
    const stats = await window.BuserInfoAPI.getDashboardStats();
    if (!stats || !stats.counts) return;

    const c = stats.counts;
    const tabAll = document.getElementById('tab-count-all');
    const tabPub = document.getElementById('tab-count-published');
    const tabDraft = document.getElementById('tab-count-draft');
    const tabRev = document.getElementById('tab-count-review');
    const tabSch = document.getElementById('tab-count-scheduled');
    const notifCount = document.getElementById('notif-berita-count');

    if (tabAll && c.total !== undefined) tabAll.textContent = c.total;
    if (tabPub && c.published !== undefined) tabPub.textContent = c.published;
    if (tabDraft && c.draft !== undefined) tabDraft.textContent = c.draft;
    if (tabRev && c.review !== undefined) tabRev.textContent = c.review;
    if (tabSch && c.scheduled !== undefined) tabSch.textContent = c.scheduled;
    if (notifCount && c.review !== undefined) notifCount.textContent = `${c.review} Berita menunggu review`;
  } catch (e) {
    console.warn('[BeritaLive] Gagal memperbarui hitungan tab dari server:', e);
  }
}

/**
 * Helper UX: Bersihkan seleksi centang dan sembunyikan floating bulk action bar seketika
 */
function clearSelectionAndHideBulkBar() {
  const checkAll = document.getElementById('check-all');
  const checkAllMobile = document.getElementById('check-all-mobile');
  if (checkAll) checkAll.checked = false;
  if (checkAllMobile) checkAllMobile.checked = false;

  document.querySelectorAll('.row-checkbox').forEach(cb => {
    cb.checked = false;
  });

  const bulkBar = document.getElementById('bulk-action-bar');
  if (bulkBar) bulkBar.classList.add('hidden');

  const selectedCount = document.getElementById('selected-count');
  if (selectedCount) selectedCount.textContent = '0';
}

/**
 * Helper UX: Hapus baris tabel dan kartu mobile seketika dengan animasi fade-out (Optimistic UI)
 */
function removeArticleFromUI(id) {
  const idStr = String(id);
  const rows = document.querySelectorAll(`#news-table-body .news-row input[value="${idStr}"]`);
  const cards = document.querySelectorAll(`#news-mobile-cards .news-card input[value="${idStr}"]`);

  const elementsToRemove = [];
  rows.forEach(input => {
    const tr = input.closest('.news-row');
    if (tr) elementsToRemove.push(tr);
  });
  cards.forEach(input => {
    const card = input.closest('.news-card');
    if (card) elementsToRemove.push(card);
  });

  elementsToRemove.forEach(el => {
    el.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    el.style.opacity = '0';
    el.style.transform = 'scale(0.95)';
    setTimeout(() => {
      el.remove();
      applyFilters();
      updateTabCountsFromDOM();
    }, 250);
  });
}

/**
 * Helper UX: Perbarui status artikel di DOM seketika dan filter tab ulang (Optimistic UI)
 */
function updateArticleStatusInUI(id, newStatus) {
  const idStr = String(id);
  const st = (newStatus || 'draft').toLowerCase().trim();

  let statusBadge = '';
  if (st === 'published') {
    statusBadge = `<span class="badge-status badge-published"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Published</span>`;
  } else if (st === 'review') {
    statusBadge = `<span class="badge-status badge-review"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Review</span>`;
  } else if (st === 'scheduled') {
    statusBadge = `<span class="badge-status badge-scheduled"><span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Scheduled</span>`;
  } else {
    statusBadge = `<span class="badge-status badge-draft"><span class="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Draft</span>`;
  }

  const rows = document.querySelectorAll(`#news-table-body .news-row input[value="${idStr}"]`);
  const cards = document.querySelectorAll(`#news-mobile-cards .news-card input[value="${idStr}"]`);

  rows.forEach(input => {
    const tr = input.closest('.news-row');
    if (tr) {
      tr.setAttribute('data-status', st);
      const badgeContainer = tr.querySelector('.badge-status');
      if (badgeContainer) badgeContainer.outerHTML = statusBadge;
    }
  });

  cards.forEach(input => {
    const card = input.closest('.news-card');
    if (card) {
      card.setAttribute('data-status', st);
      const badgeContainer = card.querySelector('.badge-status');
      if (badgeContainer) badgeContainer.outerHTML = statusBadge;
    }
  });

  applyFilters();
  updateTabCountsFromDOM();
}

/**
 * 9. Tindakan Masal (Bulk Actions: Terbitkan, Simpan ke Draft, Hapus)
 */
async function executeBulk(action) {
  const checkedBoxes = Array.from(document.querySelectorAll('.row-checkbox:checked'));
  const ids = Array.from(new Set(checkedBoxes.map(cb => cb.value)));
  const count = ids.length;
  if (count === 0) return;

  const actionName = action === 'publish' ? 'menerbitkan' : (action === 'draft' ? 'memindahkan ke draft' : 'menghapus');

  const doBulk = async () => {
    // 1. Sembunyikan floating bulk bar dan bersihkan centang segera (responsif instan)
    clearSelectionAndHideBulkBar();

    // 2. Terapkan pembaruan UI optimistik seketika (agar UI kartu/baris langsung terupdate/hilang sesuai tab)
    if (action === 'delete') {
      ids.forEach(id => removeArticleFromUI(id));
    } else {
      const newStatus = action === 'publish' ? 'published' : 'draft';
      ids.forEach(id => updateArticleStatusInUI(id, newStatus));
    }

    if (typeof showToast === 'function') {
      showToast('success', 'Tindakan Berhasil', `${count} berita berhasil di-${actionName}.`);
    } else {
      alert(`${count} berita berhasil di-${actionName}.`);
    }

    // 3. Simpan perubahan ke database di background
    try {
      if (action === 'delete') {
        for (const id of ids) {
          await window.BuserInfoAPI.deleteArticle(id);
        }
      } else {
        const newStatus = action === 'publish' ? 'published' : 'draft';
        for (const id of ids) {
          await window.BuserInfoAPI.updateArticle(id, { status: newStatus });
        }
      }

      await updateBeritaTabCounts();
    } catch (err) {
      console.warn('[BeritaLive] Gagal sinkronisasi data bulk ke server, memuat ulang:', err);
      await loadLiveArticlesFromDB();
    }
  };

  if (typeof confirmAction === 'function') {
    confirmAction({
      title: 'Tindakan Masal',
      message: `Apakah Anda yakin ingin ${actionName} ${count} berita yang dipilih?`,
      confirmText: 'Jalankan',
      type: action === 'delete' ? 'danger' : 'primary',
      onConfirm: doBulk
    });
  } else {
    if (confirm(`Apakah Anda yakin ingin ${actionName} ${count} berita yang dipilih?`)) {
      await doBulk();
    }
  }
}

/**
 * 10. Hapus Berita Tunggal dari Database
 */
async function handleDeleteRealArticle(id) {
  const doDelete = async () => {
    // 1. Langsung hapus elemen baris & kartu dari UI secara mulus (optimistic instant removal)
    removeArticleFromUI(id);
    clearSelectionAndHideBulkBar();

    if (typeof showToast === 'function') {
      showToast('success', 'Berhasil', 'Berhasil menghapus artikel.');
    } else {
      alert('Berhasil menghapus artikel.');
    }

    // 2. Jalankan penghapusan di database
    try {
      const res = await window.BuserInfoAPI.deleteArticle(id);
      if (!res || res.status !== 'success') {
        console.warn('[BeritaLive] Server tidak mengembalikan status success:', res);
      }
      await updateBeritaTabCounts();
    } catch (err) {
      console.error('[BeritaLive] Gagal menghapus di server, memuat ulang:', err);
      await loadLiveArticlesFromDB();
    }
  };

  if (typeof confirmAction === 'function') {
    confirmAction({
      title: 'Hapus Artikel?',
      message: 'Apakah Anda yakin ingin menghapus artikel ini? Tindakan ini tidak dapat dibatalkan.',
      confirmText: 'Hapus',
      type: 'danger',
      onConfirm: doDelete
    });
  } else {
    if (confirm('Apakah Anda yakin ingin menghapus artikel ini?')) {
      await doDelete();
    }
  }
}

// =========================================================================
// 11. MANAJEMEN BERITA LANGSUNG (MODAL TAMBAH & EDIT BERITA)
// =========================================================================

let uploadedThumbnailUrl = null;
let isSlugManual = false;

/**
 * Inisialisasi event listener modal tambah & edit berita
 */
function initNewsModalAndEditor() {
  const btnAdd = document.getElementById('btn-add-news');
  const btnEmptyAdd = document.getElementById('btn-empty-add-news');
  const fabAdd = document.getElementById('fab-add-news');
  const titleInput = document.getElementById('article-title');
  const slugInput = document.getElementById('article-slug');
  const btnEditSlug = document.getElementById('btn-edit-slug');
  const excerptInput = document.getElementById('article-excerpt');
  const excerptCounter = document.getElementById('excerpt-counter');
  const editorBody = document.getElementById('editor-body');
  const fileInput = document.getElementById('thumb-file-input');
  const previewImg = document.getElementById('thumb-preview-img');
  const removeThumbBtn = document.getElementById('btn-remove-thumb');
  const btnToggleSeo = document.getElementById('btn-toggle-seo');
  const seoContent = document.getElementById('seo-content');
  const seoChevron = document.getElementById('seo-chevron');
  const radioSchedule = document.getElementById('radio-schedule');
  const scheduleBox = document.getElementById('schedule-picker-box');
  const radios = document.querySelectorAll('input[name="pub_status"]');
  const btnPreviewModal = document.getElementById('btn-preview-modal');
  const btnSaveDraft = document.getElementById('btn-save-draft');
  const newsForm = document.getElementById('news-modal-form');
  const newTagInput = document.getElementById('new-tag-input');
  const btnAddTag = document.getElementById('btn-add-tag');

  // Muat opsi kategori di modal
  populateModalCategorySelect();

  // Tombol buka modal tambah
  if (btnAdd) btnAdd.addEventListener('click', openAddNewsModal);
  if (btnEmptyAdd) btnEmptyAdd.addEventListener('click', openAddNewsModal);
  if (fabAdd) fabAdd.addEventListener('click', openAddNewsModal);

  // Auto generate Slug dari Judul
  if (titleInput && slugInput) {
    titleInput.addEventListener('input', () => {
      if (!isSlugManual) {
        const slug = titleInput.value
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-');
        slugInput.value = slug;
      }
    });
  }

  // Tombol Buka Kunci Slug Manual
  if (btnEditSlug && slugInput) {
    btnEditSlug.addEventListener('click', () => {
      isSlugManual = true;
      slugInput.focus();
      if (typeof showToast === 'function') {
        showToast('info', 'Slug Manual', 'Anda dapat mengubah permalink slug secara manual.');
      }
    });
  }

  // Hitung Karakter Ringkasan / Excerpt
  if (excerptInput && excerptCounter) {
    excerptInput.addEventListener('input', () => {
      excerptCounter.textContent = `${excerptInput.value.length} / 220 karakter`;
    });
  }

  // Hitung Kata Naskah Berita
  if (editorBody) {
    editorBody.addEventListener('input', updateWordCount);
  }

  // Toolbar Formatting WYSIWYG
  document.querySelectorAll('.editor-tool-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const cmd = btn.getAttribute('data-command');
      const val = btn.getAttribute('data-val') || null;
      document.execCommand(cmd, false, val);
      updateWordCount();
    });
  });

  // Sisipkan Link
  const btnLink = document.getElementById('btn-insert-link');
  if (btnLink) {
    btnLink.addEventListener('click', (e) => {
      e.preventDefault();
      const url = prompt('Masukkan tautan URL:', 'https://');
      if (url) document.execCommand('createLink', false, url);
    });
  }

  // Sisipkan Gambar Konten
  const btnImg = document.getElementById('btn-insert-image');
  if (btnImg) {
    btnImg.addEventListener('click', (e) => {
      e.preventDefault();
      const imgUrl = prompt('Masukkan URL gambar artikel:');
      if (imgUrl) document.execCommand('insertImage', false, imgUrl);
    });
  }

  // Embed YouTube Video
  const btnVideo = document.getElementById('btn-insert-video');
  if (btnVideo) {
    btnVideo.addEventListener('click', (e) => {
      e.preventDefault();
      const videoId = prompt('Masukkan YouTube Video ID (misal: dQw4w9WgXcQ):');
      if (videoId) {
        const embedHtml = `<div class="aspect-video my-4"><iframe class="w-full h-full rounded-lg" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div><p></p>`;
        document.execCommand('insertHTML', false, embedHtml);
      }
    });
  }

  // Toggle Accordion SEO
  if (btnToggleSeo && seoContent) {
    btnToggleSeo.addEventListener('click', () => {
      seoContent.classList.toggle('hidden');
      if (seoChevron) seoChevron.classList.toggle('rotate-180');
    });
  }

  // Toggle Opsi Jadwal Tayang
  if (radios && scheduleBox) {
    radios.forEach(r => {
      r.addEventListener('change', () => {
        if (radioSchedule && radioSchedule.checked) {
          scheduleBox.classList.remove('hidden');
        } else {
          scheduleBox.classList.add('hidden');
        }
      });
    });
  }

  // Upload Thumbnail Berita
  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        if (previewImg) previewImg.src = event.target.result;
      };
      reader.readAsDataURL(file);

      if (window.BuserInfoAPI && window.BuserInfoAPI.uploadThumbnail) {
        if (typeof showToast === 'function') {
          showToast('info', 'Mengunggah Thumbnail...', 'Sedang menyimpan file ke server.');
        }
        const res = await window.BuserInfoAPI.uploadThumbnail(file);
        if (res && res.status === 'success' && res.data && res.data.url) {
          uploadedThumbnailUrl = res.data.url;
          if (previewImg) previewImg.src = '../' + uploadedThumbnailUrl;
          if (typeof showToast === 'function') {
            showToast('success', 'Gambar Berhasil Diunggah', 'Thumbnail tersimpan.');
          }
        } else {
          if (typeof showToast === 'function') {
            showToast('warning', 'Peringatan Upload', (res && res.message) || 'Gagal menyimpan file.');
          }
        }
      }
    });
  }

  // Reset Thumbnail
  if (removeThumbBtn) {
    removeThumbBtn.addEventListener('click', () => {
      uploadedThumbnailUrl = 'assets/images/berita/hero/sorotan-utama-dunia.jpg';
      if (previewImg) previewImg.src = '../' + uploadedThumbnailUrl;
      if (typeof showToast === 'function') {
        showToast('info', 'Thumbnail Direset', 'Thumbnail kembali ke gambar default.');
      }
    });
  }

  // Tags Management
  if (btnAddTag && newTagInput) {
    btnAddTag.addEventListener('click', (e) => {
      e.preventDefault();
      addTagFromInput();
    });
    newTagInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addTagFromInput();
      }
    });
  }

  // Preview Button
  if (btnPreviewModal) {
    btnPreviewModal.addEventListener('click', (e) => {
      e.preventDefault();
      openArticlePreview();
    });
  }

  // Tombol Simpan Draft
  if (btnSaveDraft) {
    btnSaveDraft.addEventListener('click', (e) => {
      e.preventDefault();
      executeSaveNews('draft');
    });
  }

  // Form Submission
  if (newsForm) {
    newsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const statusVal = document.querySelector('input[name="pub_status"]:checked')?.value || 'publish';
      let finalStatus = 'published';
      if (statusVal === 'draft') finalStatus = 'draft';
      else if (statusVal === 'review') finalStatus = 'review';
      else if (statusVal === 'schedule') finalStatus = 'scheduled';

      executeSaveNews(finalStatus);
    });
  }
}

/**
 * Muat daftar kategori ke dropdown dalam modal berita
 */
async function populateModalCategorySelect() {
  const catSelect = document.getElementById('article-category');
  if (!catSelect || !window.BuserInfoAPI || !window.BuserInfoAPI.getCategories) return;
  try {
    const cats = await window.BuserInfoAPI.getCategories();
    if (!Array.isArray(cats) || cats.length === 0) return;
    catSelect.innerHTML = '<option value="" disabled selected>Pilih Kategori</option>';
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id_kategori;
      opt.textContent = c.name_kategori;
      catSelect.appendChild(opt);
    });
  } catch (e) {
    console.warn('[BeritaLive] Gagal memuat kategori ke modal:', e);
  }
}

/**
 * Tambah pill tag dari input
 */
function addTagFromInput() {
  const newTagInput = document.getElementById('new-tag-input');
  const tagContainer = document.getElementById('tag-container');
  if (!newTagInput || !tagContainer) return;
  const tagText = newTagInput.value.trim().toLowerCase();
  if (!tagText) return;
  const pill = document.createElement('span');
  pill.className = 'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-buser-red border border-red-200';
  pill.innerHTML = `${tagText} <button type="button" class="ml-1 text-red-400 hover:text-red-700" onclick="this.parentElement.remove()">&times;</button>`;
  tagContainer.appendChild(pill);
  newTagInput.value = '';
}

/**
 * Hitung jumlah kata dan karakter di editor
 */
function updateWordCount() {
  const editorBody = document.getElementById('editor-body');
  const wordCountDisplay = document.getElementById('word-count-display');
  if (!editorBody || !wordCountDisplay) return;
  const text = editorBody.innerText.trim();
  const words = text ? text.split(/\s+/).length : 0;
  const chars = text.length;
  wordCountDisplay.textContent = `${words} kata • ${chars} karakter`;
}

/**
 * Buka modal dalam mode "Tambah Berita Baru"
 */
function openAddNewsModal() {
  isSlugManual = false;
  uploadedThumbnailUrl = null;

  const idInput = document.getElementById('article-id');
  const modalTitle = document.getElementById('news-modal-title');
  const modalSubtitle = document.getElementById('news-modal-subtitle');
  const titleInput = document.getElementById('article-title');
  const slugInput = document.getElementById('article-slug');
  const excerptInput = document.getElementById('article-excerpt');
  const excerptCounter = document.getElementById('excerpt-counter');
  const editorBody = document.getElementById('editor-body');
  const previewImg = document.getElementById('thumb-preview-img');
  const catSelect = document.getElementById('article-category');
  const statusPublishRadio = document.querySelector('input[name="pub_status"][value="publish"]');
  const scheduleBox = document.getElementById('schedule-picker-box');
  const saveStatusText = document.getElementById('save-status-text');
  const submitBtn = document.getElementById('btn-submit-publish');

  if (idInput) idInput.value = '';
  if (modalTitle) modalTitle.textContent = 'Tambah Berita Baru';
  if (modalSubtitle) modalSubtitle.textContent = 'Lengkapi konten berita, rubrikasi, dan media untuk tayang di portal';
  if (titleInput) titleInput.value = '';
  if (slugInput) slugInput.value = '';
  if (excerptInput) excerptInput.value = '';
  if (excerptCounter) excerptCounter.textContent = '0 / 220 karakter';
  if (editorBody) editorBody.innerHTML = '<p>Tulis konten naskah berita di sini...</p>';
  if (previewImg) previewImg.src = '../assets/images/berita/hero/sorotan-utama-dunia.jpg';
  if (statusPublishRadio) statusPublishRadio.checked = true;
  if (scheduleBox) scheduleBox.classList.add('hidden');
  if (catSelect && catSelect.options.length > 1) catSelect.selectedIndex = 1;
  if (saveStatusText) saveStatusText.textContent = 'Siap menambahkan artikel baru';
  if (submitBtn) submitBtn.innerHTML = 'Terbitkan Berita';

  updateWordCount();
  if (typeof openModal === 'function') {
    openModal('news-modal');
  }
}

/**
 * Buka modal dalam mode "Edit Berita" dan muat data artikel dari server
 */
async function openEditNewsModal(id) {
  isSlugManual = true;
  uploadedThumbnailUrl = null;

  const idInput = document.getElementById('article-id');
  const modalTitle = document.getElementById('news-modal-title');
  const modalSubtitle = document.getElementById('news-modal-subtitle');
  const titleInput = document.getElementById('article-title');
  const slugInput = document.getElementById('article-slug');
  const excerptInput = document.getElementById('article-excerpt');
  const excerptCounter = document.getElementById('excerpt-counter');
  const editorBody = document.getElementById('editor-body');
  const previewImg = document.getElementById('thumb-preview-img');
  const catSelect = document.getElementById('article-category');
  const authorSelect = document.getElementById('article-author');
  const scheduleBox = document.getElementById('schedule-picker-box');
  const saveStatusText = document.getElementById('save-status-text');
  const submitBtn = document.getElementById('btn-submit-publish');

  if (idInput) idInput.value = id;
  if (modalTitle) modalTitle.textContent = `Edit Berita #${id}`;
  if (modalSubtitle) modalSubtitle.textContent = 'Perbarui naskah berita, rubrikasi, atau status publikasi';
  if (saveStatusText) saveStatusText.textContent = 'Memuat data artikel dari database...';
  if (submitBtn) submitBtn.innerHTML = 'Simpan Perubahan';

  if (typeof openModal === 'function') {
    openModal('news-modal');
  }

  if (!window.BuserInfoAPI || !window.BuserInfoAPI.getArticleById) return;

  try {
    const article = await window.BuserInfoAPI.getArticleById(id);
    if (!article) {
      if (typeof showToast === 'function') {
        showToast('error', 'Gagal', 'Data artikel tidak ditemukan.');
      }
      return;
    }

    if (titleInput) titleInput.value = article.title || '';
    if (slugInput) slugInput.value = article.slug || '';
    if (excerptInput) {
      excerptInput.value = article.excerpt || '';
      if (excerptCounter) excerptCounter.textContent = `${excerptInput.value.length} / 220 karakter`;
    }
    if (editorBody) editorBody.innerHTML = article.content || '<p></p>';

    const catId = article.kategori_id || article.id_kategori;
    if (catSelect && catId) {
      catSelect.value = catId;
    }

    if (authorSelect && article.author_name) {
      for (let opt of authorSelect.options) {
        if (opt.text.includes(article.author_name) || opt.value.includes(article.author_name)) {
          opt.selected = true;
          break;
        }
      }
    }

    if (article.thumbnail) {
      uploadedThumbnailUrl = article.thumbnail;
      if (previewImg) {
        previewImg.src = article.thumbnail.startsWith('assets/') ? '../' + article.thumbnail : article.thumbnail;
      }
    }

    const rawStatus = (article.status || 'draft').toLowerCase().trim();
    let radioVal = 'publish';
    if (rawStatus === 'draft') radioVal = 'draft';
    else if (rawStatus === 'review') radioVal = 'review';
    else if (rawStatus === 'scheduled') radioVal = 'schedule';

    const stRadio = document.querySelector(`input[name="pub_status"][value="${radioVal}"]`);
    if (stRadio) stRadio.checked = true;
    if (scheduleBox) {
      if (radioVal === 'schedule') scheduleBox.classList.remove('hidden');
      else scheduleBox.classList.add('hidden');
    }

    updateWordCount();
    if (saveStatusText) {
      saveStatusText.textContent = 'Terakhir disimpan ' + (article.updated_at ? new Date(article.updated_at).toLocaleTimeString('id-ID') : '-');
    }
  } catch (err) {
    console.error('Gagal memuat detail artikel:', err);
    if (typeof showToast === 'function') {
      showToast('error', 'Kesalahan', 'Gagal memuat detail artikel: ' + err.message);
    }
  }
}

let isExecutingSave = false;

/**
 * Simpan data berita baru atau update berita yang ada
 */
async function executeSaveNews(targetStatus = 'published') {
  if (isExecutingSave) return false;
  const idInput = document.getElementById('article-id');
  const editId = idInput ? idInput.value.trim() : '';
  const titleInput = document.getElementById('article-title');
  const slugInput = document.getElementById('article-slug');
  const excerptInput = document.getElementById('article-excerpt');
  const editorBody = document.getElementById('editor-body');
  const catSelect = document.getElementById('article-category');
  const previewImg = document.getElementById('thumb-preview-img');
  const submitBtn = document.getElementById('btn-submit-publish');
  const saveDraftBtn = document.getElementById('btn-save-draft');

  const title = titleInput ? titleInput.value.trim() : '';
  if (!title) {
    if (typeof showToast === 'function') {
      showToast('error', 'Gagal Menyimpan', 'Judul berita wajib diisi terlebih dahulu.');
    }
    if (titleInput) titleInput.focus();
    return false;
  }

  const content = editorBody ? editorBody.innerHTML.trim() : '';
  if (!content || content === '<p><br></p>' || content === '<p>Tulis konten naskah berita di sini...</p>') {
    if (typeof showToast === 'function') {
      showToast('error', 'Gagal Menyimpan', 'Konten naskah berita masih kosong.');
    }
    if (editorBody) editorBody.focus();
    return false;
  }

  let thumbPath = uploadedThumbnailUrl;
  if (!thumbPath && previewImg) {
    const currentSrc = previewImg.getAttribute('src') || '';
    if (currentSrc.includes('assets/')) {
      thumbPath = currentSrc.substring(currentSrc.indexOf('assets/'));
    } else {
      thumbPath = 'assets/images/berita/hero/sorotan-utama-dunia.jpg';
    }
  }

  const payload = {
    title: title,
    slug: slugInput ? slugInput.value.trim() : '',
    excerpt: excerptInput ? excerptInput.value.trim() : '',
    content: content,
    kategori_id: catSelect ? (parseInt(catSelect.value) || 1) : 1,
    author_id: 1,
    status: targetStatus,
    thumbnail: thumbPath || 'assets/images/berita/hero/sorotan-utama-dunia.jpg'
  };

  const origBtnText = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<svg class="animate-spin -ml-1 mr-1.5 h-4 w-4 text-white inline-block" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> Menyimpan...`;
  }
  if (saveDraftBtn) saveDraftBtn.disabled = true;

  try {
    isExecutingSave = true;
    let res;
    if (editId) {
      res = await window.BuserInfoAPI.updateArticle(editId, payload);
    } else {
      res = await window.BuserInfoAPI.createArticle(payload);
    }

    if (res && res.status === 'success') {
      const msg = editId ? 'Berita berhasil diperbarui.' : 'Berita berhasil ditambahkan.';
      if (typeof showToast === 'function') {
        showToast('success', 'Berhasil', msg);
      } else {
        alert(msg);
      }

      // 1. Tutup modal kelola berita seketika
      if (typeof closeModal === 'function') {
        closeModal('news-modal');
      }

      // 2. Jika edit berita yang ada, perbarui status dan filter di DOM seketika (Optimistic UI)
      if (editId) {
        updateArticleStatusInUI(editId, targetStatus);
      }

      // 3. Bersihkan ID artikel di form
      if (idInput) idInput.value = '';

      // 4. Sinkronisasi dengan server
      await loadLiveArticlesFromDB();
      await updateBeritaTabCounts();
      return true;
    } else {
      const errMsg = (res && res.message) ? res.message : 'Gagal menyimpan artikel.';
      if (typeof showToast === 'function') {
        showToast('error', 'Gagal Menyimpan', errMsg);
      } else {
        alert(errMsg);
      }
      return false;
    }
  } catch (err) {
    if (typeof showToast === 'function') {
      showToast('error', 'Kesalahan Sistem', err.message);
    } else {
      alert('Kesalahan sistem: ' + err.message);
    }
    return false;
  } finally {
    isExecutingSave = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = origBtnText;
    }
    if (saveDraftBtn) saveDraftBtn.disabled = false;
  }
}

/**
 * Buka simulasi pratinjau berita
 */
function openArticlePreview() {
  const titleInput = document.getElementById('article-title');
  const catSelect = document.getElementById('article-category');
  const authorSelect = document.getElementById('article-author');
  const previewImg = document.getElementById('thumb-preview-img');
  const editorBody = document.getElementById('editor-body');

  const prevTitle = document.getElementById('modal-prev-title');
  const prevCat = document.getElementById('modal-prev-cat');
  const prevAuthor = document.getElementById('modal-prev-author');
  const prevImg = document.getElementById('modal-prev-img');
  const prevBody = document.getElementById('modal-prev-body');

  if (prevTitle) prevTitle.textContent = (titleInput && titleInput.value) || 'Judul Berita Belum Diisi';
  if (prevCat && catSelect) prevCat.textContent = catSelect.options[catSelect.selectedIndex]?.text || 'Berita';
  if (prevAuthor && authorSelect) prevAuthor.textContent = authorSelect.options[authorSelect.selectedIndex]?.text || 'Redaksi BUSER INFO';
  if (prevImg && previewImg) prevImg.src = previewImg.src;
  if (prevBody && editorBody) prevBody.innerHTML = editorBody.innerHTML;

  if (typeof openModal === 'function') {
    openModal('preview-modal');
  }
}

/**
 * Cek aksi URL query params (?action=tambah atau ?edit=ID / ?id=ID)
 */
function checkUrlNewsActions() {
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action');
  const editId = urlParams.get('edit') || urlParams.get('id');

  if (action === 'tambah') {
    setTimeout(openAddNewsModal, 250);
  } else if (editId) {
    setTimeout(() => openEditNewsModal(editId), 250);
  }
}

// Global window exposure for inline onclick handlers
window.applyFilters = applyFilters;
window.executeBulk = executeBulk;
window.handleDeleteRealArticle = handleDeleteRealArticle;
window.deleteArticle = handleDeleteRealArticle;
window.loadLiveArticlesFromDB = loadLiveArticlesFromDB;
window.updateBeritaTabCounts = updateBeritaTabCounts;
window.openAddNewsModal = openAddNewsModal;
window.openEditNewsModal = openEditNewsModal;
window.executeSaveNews = executeSaveNews;
window.openArticlePreview = openArticlePreview;
window.checkUrlNewsActions = checkUrlNewsActions;

