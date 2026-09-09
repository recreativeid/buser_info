/**
 * BUSER INFO - Search Page Script
 * Real-time news search, category filters, sorting, and empty state handling
 */

document.addEventListener('DOMContentLoaded', () => {
  initSearchPage();
});

let currentCategory = 'all';
let currentSort = 'newest';

function initSearchPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q') || '';
  const initialCat = urlParams.get('cat') || 'all';

  const searchInput = document.getElementById('search-page-input');
  const searchForm = document.getElementById('search-page-form');
  const clearBtn = document.getElementById('clear-search-btn');
  const catPills = document.querySelectorAll('.search-cat-pill');
  const sortSelect = document.getElementById('search-sort-select');

  if (searchInput) {
    searchInput.value = initialQuery;
  }
  if (initialCat) {
    currentCategory = initialCat;
  }

  // Update active pill
  updateActivePill(currentCategory);

  // Initial Run
  performSearch(initialQuery, currentCategory, currentSort);

  // Form submit
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = searchInput ? searchInput.value.trim() : '';
      updateUrl(query, currentCategory);
      performSearch(query, currentCategory, currentSort);
    });
  }

  // Real-time input with debounce
  let debounceTimeout;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        const query = searchInput.value.trim();
        performSearch(query, currentCategory, currentSort);
      }, 250);
    });
  }

  // Clear button
  if (clearBtn && searchInput) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchInput.focus();
      performSearch('', currentCategory, currentSort);
    });
  }

  // Category pill filters
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

  // Sort select
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      const query = searchInput ? searchInput.value.trim() : '';
      performSearch(query, currentCategory, currentSort);
    });
  }
}

function updateActivePill(activeCat) {
  const catPills = document.querySelectorAll('.search-cat-pill');
  catPills.forEach(pill => {
    const cat = pill.getAttribute('data-cat') || 'all';
    if (cat === activeCat) {
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

function performSearch(query, category, sort) {
  const container = document.getElementById('search-results-container');
  const countLabel = document.getElementById('search-results-count');
  const emptyState = document.getElementById('search-empty-state');
  const queryDisplay = document.getElementById('search-query-display');

  if (!container || typeof window.NewsDB === 'undefined') return;

  let results = window.NewsDB.search(query, category);

  // Sorting
  if (sort === 'popular') {
    results.sort((a, b) => {
      const vA = parseInt(a.views.replace('.', ''), 10) || 0;
      const vB = parseInt(b.views.replace('.', ''), 10) || 0;
      return vB - vA;
    });
  } else {
    // newest first
    results.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Update counts
  if (countLabel) {
    countLabel.textContent = results.length;
  }
  if (queryDisplay) {
    if (query) {
      queryDisplay.innerHTML = `untuk kata kunci <span class="text-buser-red font-bold">"${escapeHtml(query)}"</span>`;
    } else if (category !== 'all') {
      queryDisplay.innerHTML = `dalam kategori <span class="text-buser-red font-bold">"${category.toUpperCase()}"</span>`;
    } else {
      queryDisplay.innerHTML = `terbaru`;
    }
  }

  // Check Empty State
  if (results.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  // Render cards
  container.innerHTML = results.map(item => `
    <article class="bg-white border border-gray-200 rounded-sm p-3.5 sm:p-4 news-card-hover group flex flex-col sm:flex-row gap-4">
      <a href="artikel.html?id=${item.id}" class="sm:w-56 h-36 flex-shrink-0 relative overflow-hidden rounded-sm block aspect-[16/10] sm:aspect-auto">
        <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
        <span class="absolute top-2 left-2 bg-buser-red text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
          ${item.category}
        </span>
      </a>
      <div class="flex-1 flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
            <span class="font-semibold text-gray-700">${item.author}</span>
            <span>&bull;</span>
            <span>${item.date}</span>
            <span>&bull;</span>
            <span>${item.readTime}</span>
          </div>
          <a href="artikel.html?id=${item.id}" class="block font-bold text-base sm:text-lg text-gray-900 group-hover:text-buser-red line-clamp-2 leading-snug mb-2 news-headline">
            ${item.title}
          </a>
          <p class="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed mb-3">
            ${item.excerpt}
          </p>
        </div>
        <div class="flex items-center justify-between pt-2 border-t border-gray-100 mt-auto">
          <div class="flex flex-wrap gap-1.5">
            ${(item.tags || []).slice(0, 3).map(t => `<span class="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-sm">#${t}</span>`).join('')}
          </div>
          <a href="artikel.html?id=${item.id}" class="inline-flex items-center text-xs font-bold text-buser-red hover:text-buser-red-hover">
            Baca Selengkapnya
            <svg class="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  `).join('');
}

function escapeHtml(string) {
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
