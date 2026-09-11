/**
 * BUSER INFO - Search Page Script
 * Real-time news search, category filters, sorting, and empty state handling.
 * Terhubung langsung ke Database PostgreSQL melalui REST API (BuserInfoAPI)
 * dengan graceful fallback ke local mock data.
 */

document.addEventListener('DOMContentLoaded', () => {
  initSearchPage();
});

let currentCategory = 'all';
let currentSort = 'newest';
let searchAbortController = null;

async function initSearchPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q') || '';
  const initialCat = urlParams.get('cat') || 'all';

  const searchInput = document.getElementById('search-page-input');
  const searchForm = document.getElementById('search-page-form');
  const clearBtn = document.getElementById('clear-search-btn');
  const sortSelect = document.getElementById('search-sort-select');

  if (searchInput) {
    searchInput.value = initialQuery;
  }
  if (initialCat) {
    currentCategory = initialCat;
  }

  // Muat kategori secara dinamis dari database jika API tersedia
  await initCategoryPills();

  // Highlight kategori aktif
  updateActivePill(currentCategory);

  // Jalankan pencarian awal
  performSearch(initialQuery, currentCategory, currentSort);

  // Form submit event
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = searchInput ? searchInput.value.trim() : '';
      updateUrl(query, currentCategory);
      performSearch(query, currentCategory, currentSort);
    });
  }

  // Real-time input dengan debounce
  let debounceTimeout;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        const query = searchInput.value.trim();
        updateUrl(query, currentCategory);
        performSearch(query, currentCategory, currentSort);
      }, 300);
    });
  }

  // Tombol bersihkan input (Clear Button)
  if (clearBtn && searchInput) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchInput.focus();
      updateUrl('', currentCategory);
      performSearch('', currentCategory, currentSort);
    });
  }

  // Sort select event
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      const query = searchInput ? searchInput.value.trim() : '';
      performSearch(query, currentCategory, currentSort);
    });
  }
}

/**
 * Inisialisasi pill kategori dari database atau DOM
 */
async function initCategoryPills() {
  const container = document.getElementById('search-cat-pills-container');
  if (!container) return;

  if (window.BuserInfoAPI) {
    try {
      const categories = await window.BuserInfoAPI.getCategories();
      if (Array.isArray(categories) && categories.length > 0) {
        container.innerHTML = `
          <span class="text-gray-400 text-[11px] mr-1 hidden sm:inline">Kategori:</span>
          <button type="button" data-cat="all" class="search-cat-pill px-3 py-1 rounded-sm font-semibold transition-colors bg-buser-red text-white">Semua</button>
          ${categories.map(cat => `
            <button type="button" data-cat="${escapeHtml(cat.slug)}" class="search-cat-pill px-3 py-1 rounded-sm font-semibold transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200">
              ${escapeHtml(cat.name_kategori)}
            </button>
          `).join('')}
        `;
      }
    } catch (err) {
      console.warn('[search.js] Gagal memuat kategori dari API, menggunakan pill default:', err);
    }
  }

  // Pasang event listener untuk semua pill
  attachPillListeners();
}

function attachPillListeners() {
  const searchInput = document.getElementById('search-page-input');
  const catPills = document.querySelectorAll('.search-cat-pill');

  catPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const cat = pill.getAttribute('data-cat') || 'all';
      currentCategory = cat;
      updateActivePill(cat);
      const query = searchInput ? searchInput.value.trim() : '';
      updateUrl(query, cat);
      performSearch(query, cat, currentSort);
    });
  });
}

function updateActivePill(activeCat) {
  const catPills = document.querySelectorAll('.search-cat-pill');
  catPills.forEach(pill => {
    const cat = pill.getAttribute('data-cat') || 'all';
    if (cat.toLowerCase() === activeCat.toLowerCase()) {
      pill.classList.remove('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
      pill.classList.add('bg-buser-red', 'text-white', 'font-bold');
    } else {
      pill.classList.remove('bg-buser-red', 'text-white', 'font-bold');
      pill.classList.add('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
    }
  });
}

function updateUrl(query, cat) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (cat && cat !== 'all') params.set('cat', cat);
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, '', newUrl);
}

/**
 * Eksekusi Pencarian Berita (PostgreSQL API dengan Fallback Local DB)
 */
async function performSearch(query, category, sort) {
  const container = document.getElementById('search-results-container');
  const countLabel = document.getElementById('search-results-count');
  const emptyState = document.getElementById('search-empty-state');
  const queryDisplay = document.getElementById('search-query-display');

  if (!container) return;

  // Tampilkan state memuat (Loading State)
  container.innerHTML = `
    <div class="py-12 text-center text-gray-500">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-buser-red border-t-transparent mb-3"></div>
      <p class="text-xs sm:text-sm font-medium">Mencari arsip berita di database...</p>
    </div>
  `;
  if (emptyState) emptyState.classList.add('hidden');

  let results = [];
  let isFromDatabase = false;

  // 1. Coba ambil dari Database PostgreSQL via REST API
  if (window.BuserInfoAPI) {
    try {
      const params = {
        status: 'published',
        limit: 40
      };
      if (query) params.search = query;
      if (category && category !== 'all') params.kategori = category;

      const data = await window.BuserInfoAPI.getArticles(params);
      if (data && Array.isArray(data.articles)) {
        results = data.articles;
        isFromDatabase = true;
      }
    } catch (err) {
      console.warn('[search.js] Gagal memuat dari API, fallback ke NewsDB:', err);
    }
  }

  // Sorting
  if (sort === 'popular') {
    results.sort((a, b) => {
      const vA = parseInt(String(a.views || 0).replace('.', ''), 10) || 0;
      const vB = parseInt(String(b.views || 0).replace('.', ''), 10) || 0;
      return vB - vA;
    });
  } else if (!isFromDatabase) {
    results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }

  // Update Label Jumlah Hasil
  if (countLabel) {
    countLabel.textContent = results.length;
  }

  // Update Teks Deskripsi Pencarian
  if (queryDisplay) {
    if (query) {
      queryDisplay.innerHTML = `untuk kata kunci <span class="text-buser-red font-bold">"${escapeHtml(query)}"</span>`;
    } else if (category !== 'all') {
      queryDisplay.innerHTML = `dalam kategori <span class="text-buser-red font-bold">"${escapeHtml(category.toUpperCase())}"</span>`;
    } else {
      queryDisplay.innerHTML = `terbaru`;
    }
  }

  // Cek jika hasil kosong (Empty State)
  if (results.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  // Render Kartu Hasil Berita
  if (isFromDatabase) {
    container.innerHTML = results.map(item => renderDatabaseArticleCard(item)).join('');
  } else {
    container.innerHTML = results.map(item => renderMockArticleCard(item)).join('');
  }
}

/**
 * Render kartu berita yang bersumber dari database PostgreSQL
 */
function renderDatabaseArticleCard(item) {
  const catName = item.name_kategori || 'Nasional';
  const author = item.author_name || 'Redaksi BUSER INFO';
  const dateStr = formatDateIndo(item.published_at);
  const thumb = getThumb(item.thumbnail);
  const excerpt = item.excerpt || item.title;
  const articleUrl = `artikel.html?slug=${encodeURIComponent(item.slug || '')}`;

  return `
    <article class="bg-white border border-gray-200 rounded-sm p-3.5 sm:p-4 news-card-hover group flex flex-col sm:flex-row gap-4 transition-shadow hover:shadow-md">
      <a href="${articleUrl}" class="sm:w-56 h-36 flex-shrink-0 relative overflow-hidden rounded-sm block aspect-[16/10] sm:aspect-auto bg-gray-900">
        <img 
          src="${thumb}" 
          alt="${escapeHtml(item.title)}" 
          class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
          loading="lazy" 
          onerror="this.src='assets/images/berita/nasional/pembangunan-ikn-nusantara.jpg'"
        />
        <span class="absolute top-2 left-2 ${window.getCategoryBadgeClasses ? window.getCategoryBadgeClasses(catName) : 'bg-buser-red text-white'} text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider shadow-sm rounded-sm">
          ${escapeHtml(catName)}
        </span>
      </a>
      <div class="flex-1 flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-2 text-xs text-gray-500 mb-1.5 flex-wrap">
            <span class="font-semibold text-gray-800">${escapeHtml(author)}</span>
            <span>&bull;</span>
            <span>${dateStr}</span>
            <span>&bull;</span>
            <span class="text-buser-red font-semibold">3 menit baca</span>
          </div>
          <a href="${articleUrl}" class="block font-bold text-base sm:text-lg text-gray-900 group-hover:text-buser-red line-clamp-2 leading-snug mb-2 news-headline transition-colors">
            ${escapeHtml(item.title)}
          </a>
          <p class="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed mb-3">
            ${escapeHtml(excerpt)}
          </p>
        </div>
        <div class="flex items-center justify-between pt-2 border-t border-gray-100 mt-auto">
          <div class="flex flex-wrap gap-1.5">
            <span class="text-[11px] bg-blue-50 text-buser-blue font-semibold px-2 py-0.5 rounded-sm">#${escapeHtml(catName)}</span>
            <span class="text-[11px] bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-sm">#BuserinfoUpdate</span>
          </div>
          <a href="${articleUrl}" class="inline-flex items-center text-xs font-bold text-buser-red hover:text-buser-redHover transition-colors">
            Baca Selengkapnya
            <svg class="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  `;
}

/**
 * Render kartu berita fallback (Mock data dari news-data.js)
 */
function renderMockArticleCard(item) {
  const articleUrl = `artikel.html?id=${item.id}`;
  return `
    <article class="bg-white border border-gray-200 rounded-sm p-3.5 sm:p-4 news-card-hover group flex flex-col sm:flex-row gap-4">
      <a href="${articleUrl}" class="sm:w-56 h-36 flex-shrink-0 relative overflow-hidden rounded-sm block aspect-[16/10] sm:aspect-auto">
        <img src="${item.image}" alt="${escapeHtml(item.title)}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
        <span class="absolute top-2 left-2 ${window.getCategoryBadgeClasses ? window.getCategoryBadgeClasses(item.category) : 'bg-buser-red text-white'} text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-sm">
          ${escapeHtml(item.category)}
        </span>
      </a>
      <div class="flex-1 flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
            <span class="font-semibold text-gray-700">${escapeHtml(item.author)}</span>
            <span>&bull;</span>
            <span>${escapeHtml(item.date)}</span>
            <span>&bull;</span>
            <span>${escapeHtml(item.readTime || '3 menit')}</span>
          </div>
          <a href="${articleUrl}" class="block font-bold text-base sm:text-lg text-gray-900 group-hover:text-buser-red line-clamp-2 leading-snug mb-2 news-headline">
            ${escapeHtml(item.title)}
          </a>
          <p class="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed mb-3">
            ${escapeHtml(item.excerpt)}
          </p>
        </div>
        <div class="flex items-center justify-between pt-2 border-t border-gray-100 mt-auto">
          <div class="flex flex-wrap gap-1.5">
            ${(item.tags || []).slice(0, 3).map(t => `<span class="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-sm">#${escapeHtml(t)}</span>`).join('')}
          </div>
          <a href="${articleUrl}" class="inline-flex items-center text-xs font-bold text-buser-red hover:text-buser-redHover">
            Baca Selengkapnya
            <svg class="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  `;
}

function formatDateIndo(dateStr) {
  if (!dateStr) return 'Baru saja';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) + ' • ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
}

function getThumb(url) {
  return url && url.length > 5 ? url : 'assets/images/berita/nasional/pembangunan-ikn-nusantara.jpg';
}

function escapeHtml(string) {
  if (!string) return '';
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
