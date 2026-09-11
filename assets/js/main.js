/**
 * BUSER INFO - Main Application Logic
 * Modern, Professional, Mobile-First Indonesian Online News Portal
 */

document.addEventListener('DOMContentLoaded', () => {
  initLiveDate();
  initMobileDrawer();
  initBreakingNewsTicker();
  initBookmarkSystem();
  initQuickSearch();
  initCategoryScroller();
  highlightActiveNav();
});

/* --------------------------------------------------------------------------
   1. Live Date & Time (Indonesian Format)
   -------------------------------------------------------------------------- */
function initLiveDate() {
  const dateContainers = document.querySelectorAll('.live-date-text');
  if (!dateContainers.length) return;

  function update() {
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const dayName = days[now.getDay()];
    const date = now.getDate();
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const formatted = `${dayName}, ${date} ${monthName} ${year} | ${hours}:${minutes}:${seconds} WIB`;
    dateContainers.forEach(el => el.textContent = formatted);
  }

  update();
  setInterval(update, 1000);
}

/* --------------------------------------------------------------------------
   2. Mobile Hamburger Menu Drawer
   -------------------------------------------------------------------------- */
function initMobileDrawer() {
  const openBtns = document.querySelectorAll('.mobile-menu-btn');
  const closeBtns = document.querySelectorAll('.close-drawer-btn');
  const drawer = document.getElementById('mobile-drawer');
  const backdrop = document.getElementById('drawer-backdrop');
  const panel = document.getElementById('drawer-panel');

  if (!drawer || !backdrop || !panel) return;

  function openDrawer() {
    drawer.classList.remove('hidden');
    // slight delay to trigger transition
    setTimeout(() => {
      backdrop.classList.add('active');
      panel.classList.add('active');
      document.body.style.overflow = 'hidden';
    }, 10);
  }

  function closeDrawer() {
    backdrop.classList.remove('active');
    panel.classList.remove('active');
    setTimeout(() => {
      drawer.classList.add('hidden');
      document.body.style.overflow = '';
    }, 300);
  }

  openBtns.forEach(btn => btn.addEventListener('click', openDrawer));
  closeBtns.forEach(btn => btn.addEventListener('click', closeDrawer));
  backdrop.addEventListener('click', closeDrawer);

  // Close when pressing ESC
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !drawer.classList.contains('hidden')) {
      closeDrawer();
    }
  });
}

/* --------------------------------------------------------------------------
   3. Breaking News Ticker
   -------------------------------------------------------------------------- */
async function initBreakingNewsTicker() {
  const track = document.getElementById('breaking-ticker-track');
  if (!track) return;

  let items = [];

  if (window.BuserInfoAPI) {
    try {
      const res = await window.BuserInfoAPI.getArticles({ limit: 8, status: 'published' });
      const articles = res.articles || [];
      if (articles.length > 0) {
        items = articles.map(art => ({
          title: art.title,
          link: `artikel.html?slug=${encodeURIComponent(art.slug)}`
        }));
      }
    } catch (e) {}
  }

  if (items.length === 0) {
    items = [
      {
        title: 'Selamat Datang di BUSER INFO — Portal Berita Terkini, Fakta Tanpa Batas',
        link: 'tentang.html'
      },
      {
        title: 'BUSER INFO berkomitmen menyajikan karya jurnalistik independen, tajam, dan terverifikasi',
        link: 'tentang.html'
      },
      {
        title: 'Layanan Pengaduan & Informasi Warga: Hubungi WhatsApp 0831-7298-8502',
        link: 'https://wa.me/6283172988502'
      }
    ];
  }

  let html = '';
  // Repeat items for continuous marquee loop
  const repeatCount = 2;
  for (let r = 0; r < repeatCount; r++) {
    items.forEach((item) => {
      html += `
        <a href="${item.link}" class="inline-flex items-center text-sm font-medium hover:underline text-white mr-10 transition-colors">
          <span class="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-2 flex-shrink-0"></span>
          <span>${item.title}</span>
        </a>
      `;
    });
  }

  track.innerHTML = html;
}

/* --------------------------------------------------------------------------
   4. LocalStorage Bookmark System
   -------------------------------------------------------------------------- */
const BOOKMARK_KEY = 'buser_saved_articles';

function getSavedBookmarks() {
  try {
    const raw = localStorage.getItem(BOOKMARK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading bookmarks', e);
    return [];
  }
}

function saveBookmark(id) {
  const list = getSavedBookmarks();
  if (!list.includes(id)) {
    list.push(id);
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(list));
    updateBookmarkUI();
    showToast('Berita berhasil disimpan ke daftar baca!', 'success');
  }
}

function removeBookmark(id) {
  let list = getSavedBookmarks();
  list = list.filter(item => item !== id);
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify(list));
  updateBookmarkUI();
  showToast('Berita dihapus dari daftar baca', 'info');
}

function toggleBookmark(id) {
  const list = getSavedBookmarks();
  if (list.includes(id)) {
    removeBookmark(id);
    return false;
  } else {
    saveBookmark(id);
    return true;
  }
}

function isBookmarked(id) {
  const list = getSavedBookmarks();
  return list.includes(id);
}

function updateBookmarkUI() {
  const list = getSavedBookmarks();
  const badges = document.querySelectorAll('.bookmark-count-badge');
  badges.forEach(badge => {
    badge.textContent = list.length;
    if (list.length > 0) {
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  });

  // Render modal content if open
  renderBookmarkModalList();
}

function renderBookmarkModalList() {
  const container = document.getElementById('bookmark-modal-list');
  if (!container || typeof window.NewsDB === 'undefined') return;

  const list = getSavedBookmarks();
  if (list.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 px-4">
        <svg class="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        <p class="font-bold text-gray-700 text-base mb-1">Belum Ada Berita Tersimpan</p>
        <p class="text-xs text-gray-500">Klik ikon bookmark pada artikel untuk menyimpannya ke daftar baca offline Anda.</p>
      </div>
    `;
    return;
  }

  let html = '';
  list.forEach(id => {
    const article = window.NewsDB.getById(id);
    if (!article) return;
    html += `
      <div class="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-sm hover:border-buser-red transition-all group">
        <img src="${article.image}" alt="${article.title}" class="w-20 h-16 object-cover rounded-sm flex-shrink-0" />
        <div class="flex-1 min-w-0">
          <span class="text-[10px] font-bold text-buser-red uppercase tracking-wider">${article.category}</span>
          <a href="artikel.html?id=${article.id}" class="block text-sm font-bold text-gray-900 group-hover:text-buser-red line-clamp-2 leading-snug">
            ${article.title}
          </a>
          <div class="flex items-center justify-between mt-2">
            <span class="text-[11px] text-gray-500">${article.date}</span>
            <button onclick="removeBookmark('${article.id}')" class="text-xs text-red-600 hover:text-red-800 font-semibold inline-flex items-center">
              <svg class="w-3.5 h-3.5 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Hapus
            </button>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function initBookmarkSystem() {
  updateBookmarkUI();

  const openBtns = document.querySelectorAll('.open-bookmark-btn');
  const closeBtns = document.querySelectorAll('.close-bookmark-btn');
  const modal = document.getElementById('bookmark-modal');
  const backdrop = document.getElementById('bookmark-backdrop');
  const panel = document.getElementById('bookmark-panel');

  if (!modal || !backdrop || !panel) return;

  function openModal() {
    renderBookmarkModalList();
    modal.classList.remove('hidden');
    setTimeout(() => {
      backdrop.classList.add('active');
      panel.classList.add('active');
      document.body.style.overflow = 'hidden';
    }, 10);
  }

  function closeModal() {
    backdrop.classList.remove('active');
    panel.classList.remove('active');
    setTimeout(() => {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }, 300);
  }

  openBtns.forEach(b => b.addEventListener('click', openModal));
  closeBtns.forEach(b => b.addEventListener('click', closeModal));
  backdrop.addEventListener('click', closeModal);
}

/* --------------------------------------------------------------------------
   5. Quick Search Modal & Redirection
   -------------------------------------------------------------------------- */
function initQuickSearch() {
  const triggerBtns = document.querySelectorAll('.open-search-modal-btn');
  const searchModal = document.getElementById('quick-search-modal');
  const searchBackdrop = document.getElementById('search-modal-backdrop');
  const searchInput = document.getElementById('quick-search-input');
  const searchForm = document.getElementById('quick-search-form');
  const closeBtn = document.getElementById('close-search-modal-btn');

  if (!searchModal) return;

  function openSearch() {
    searchModal.classList.remove('hidden');
    setTimeout(() => {
      if (searchInput) searchInput.focus();
    }, 50);
  }

  function closeSearch() {
    searchModal.classList.add('hidden');
  }

  triggerBtns.forEach(btn => btn.addEventListener('click', openSearch));
  if (closeBtn) closeBtn.addEventListener('click', closeSearch);
  if (searchBackdrop) searchBackdrop.addEventListener('click', closeSearch);

  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = searchInput ? searchInput.value.trim() : '';
      if (val) {
        window.location.href = `cari.html?q=${encodeURIComponent(val)}`;
      }
    });
  }

  // Keyboard shortcut Ctrl+K or /
  window.addEventListener('keydown', (e) => {
    if ((e.key === '/' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) || (e.ctrlKey && e.key === 'k')) {
      e.preventDefault();
      openSearch();
    }
  });
}

/* --------------------------------------------------------------------------
   6. Horizontal Category Navigation Scroll Controls
   -------------------------------------------------------------------------- */
function initCategoryScroller() {
  const navContainer = document.getElementById('category-scroll-nav');
  const leftBtn = document.getElementById('scroll-nav-left');
  const rightBtn = document.getElementById('scroll-nav-right');

  if (!navContainer) return;

  if (leftBtn) {
    leftBtn.addEventListener('click', () => {
      navContainer.scrollBy({ left: -160, behavior: 'smooth' });
    });
  }
  if (rightBtn) {
    rightBtn.addEventListener('click', () => {
      navContainer.scrollBy({ left: 160, behavior: 'smooth' });
    });
  }
}

/* --------------------------------------------------------------------------
   7. Active Navigation State
   -------------------------------------------------------------------------- */
function highlightActiveNav() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const searchParams = new URLSearchParams(window.location.search);
  const currentCat = searchParams.get('cat');

  const navLinks = document.querySelectorAll('.cat-nav-link');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;

    if (currentPath === 'index.html' && (href === 'index.html' || href === './')) {
      link.classList.add('bg-buser-red', 'text-white', 'font-bold');
    } else if (currentPath === 'internasional.html' && !currentCat && href.startsWith('internasional.html') && !href.includes('?cat=')) {
      link.classList.add('bg-buser-red', 'text-white', 'font-bold');
    } else if (currentCat && href.includes(`cat=${currentCat}`)) {
      link.classList.add('bg-buser-red', 'text-white', 'font-bold');
    }
  });
}

/* --------------------------------------------------------------------------
   8. Global Toast Notification Helper
   -------------------------------------------------------------------------- */
function showToast(message, type = 'info') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-xs';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const bgColor = type === 'success' ? 'bg-[#0B0B0B] border-l-4 border-[#D71920]' : 'bg-[#222222] border-l-4 border-gray-400';
  toast.className = `${bgColor} text-white px-4 py-3 rounded shadow-xl text-sm flex items-center justify-between transition-all duration-300 transform translate-y-2 opacity-0`;
  toast.innerHTML = `
    <span>${message}</span>
    <button class="ml-3 text-gray-400 hover:text-white">&times;</button>
  `;

  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  const closeToast = () => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  };

  toast.querySelector('button').addEventListener('click', closeToast);
  setTimeout(closeToast, 3500);
}

// Expose globals
window.saveBookmark = saveBookmark;
window.removeBookmark = removeBookmark;
window.toggleBookmark = toggleBookmark;
window.isBookmarked = isBookmarked;
window.showToast = showToast;

/* --------------------------------------------------------------------------
   9. Unified Brand Palette Helpers (Hitam, Merah, Biru, Kuning)
   -------------------------------------------------------------------------- */
function getCategoryBadgeClasses(catName) {
  const c = String(catName || '').toLowerCase();
  if (c.includes('kriminal') || c.includes('hukum') || c.includes('politik') || c.includes('investigasi') || c.includes('peristiwa') || c.includes('buser') || c.includes('hot')) {
    return 'bg-buser-red text-white';
  }
  if (c.includes('ekonomi') || c.includes('bisnis') || c.includes('teknologi') || c.includes('lifestyle') || c.includes('gaya') || c.includes('hiburan') || c.includes('seleb')) {
    return 'bg-buser-yellow text-gray-950 font-bold';
  }
  return 'bg-buser-blue text-white';
}

function getTrendingNumberClass(index) {
  if (index === 0) return 'text-buser-red';
  if (index === 1) return 'text-buser-blue';
  if (index === 2) return 'text-buser-yellow';
  return 'text-gray-400';
}

function getCategoryAccentClass(catName) {
  const c = String(catName || '').toLowerCase();
  if (c.includes('kriminal') || c.includes('hukum') || c.includes('politik') || c.includes('investigasi')) {
    return 'accent-red';
  }
  if (c.includes('ekonomi') || c.includes('bisnis') || c.includes('teknologi') || c.includes('lifestyle')) {
    return 'accent-yellow';
  }
  return 'accent-blue';
}

window.getCategoryBadgeClasses = getCategoryBadgeClasses;
window.getTrendingNumberClass = getTrendingNumberClass;
window.getCategoryAccentClass = getCategoryAccentClass;
