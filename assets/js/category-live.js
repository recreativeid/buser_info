/**
 * BUSER INFO - Handler Halaman Rubrikasi Kategori (internasional.html)
 * Murni membaca data langsung dari PostgreSQL via API
 */

document.addEventListener('DOMContentLoaded', () => {
  renderCategoryPageFromDB();
});

async function renderCategoryPageFromDB() {
  if (!window.BuserInfoAPI) return;

  const urlParams = new URLSearchParams(window.location.search);
  let currentCatSlug = urlParams.get('cat') || 'internasional'; // Default ke internasional jika dibuka tanpa parameter
  currentCatSlug = currentCatSlug.toLowerCase();

  try {
    // 1. Ambil daftar seluruh kategori dari PostgreSQL untuk pencocokan nama
    const categories = await window.BuserInfoAPI.getCategories();
    const currentCategoryObj = categories.find(c => c.slug === currentCatSlug) || {
      name_kategori: capitalizeWord(currentCatSlug),
      slug: currentCatSlug,
      deskripsi: `Kumpulan berita terverifikasi seputar isu ${currentCatSlug} dari redaksi BUSER INFO.`
    };

    const catName = currentCategoryObj.name_kategori;

    // Update Header, Breadcrumb, Meta Title
    document.title = `Berita ${catName} — BUSER INFO`;
    const bCat = document.getElementById('breadcrumb-category-name');
    const pTitle = document.getElementById('category-page-title');
    const pDesc = document.getElementById('category-page-desc');
    const fTitle = document.getElementById('category-feed-title');
    const sidebarTrendingTitle = document.querySelector('aside h2');

    if (bCat) bCat.textContent = catName;
    const accentBarClass = window.getCategoryAccentClass ? window.getCategoryAccentClass(catName) : 'accent-blue';
    const accentDotColor = accentBarClass === 'accent-yellow' ? 'bg-buser-yellow' : (accentBarClass === 'accent-red' ? 'bg-buser-red' : 'bg-buser-blue');
    if (pTitle) pTitle.innerHTML = `<span class="w-3.5 h-3.5 ${accentDotColor} mr-2.5 inline-block"></span>Berita ${catName}`;
    if (pDesc) pDesc.textContent = currentCategoryObj.deskripsi || `Kumpulan berita terverifikasi seputar isu ${catName.toLowerCase()} langsung dari reporter BUSER INFO di lapangan.`;
    if (fTitle) fTitle.textContent = `Daftar Berita ${catName} Terkini`;
    if (sidebarTrendingTitle) sidebarTrendingTitle.textContent = `Trending ${catName}`;

    // Sorot menu navigasi aktif di top bar kategori
    highlightActiveCategoryBar(currentCatSlug);

    // 2. Ambil artikel dari database yang SESUAI KATEGORI INI
    const res = await window.BuserInfoAPI.getArticles({ kategori: currentCatSlug, status: 'published', limit: 20 });
    const articles = res.articles || [];

    const featuredContainer = document.getElementById('category-featured-card');
    const listContainer = document.getElementById('category-articles-list');
    const paginationNav = document.querySelector('nav[aria-label="Navigasi Halaman"]');
    const trendingSidebarContainer = document.querySelector('aside .divide-y');

    // Jika Kategori ini BELUM MEMILIKI ARTIKEL di PostgreSQL
    if (articles.length === 0) {
      if (featuredContainer) {
        featuredContainer.innerHTML = `
          <div class="p-8 sm:p-12 text-center bg-white border border-gray-200 rounded-sm">
            <div class="w-16 h-16 bg-red-50 text-buser-red rounded-full flex items-center justify-center mx-auto mb-3">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
            </div>
            <h3 class="font-black text-gray-900 text-base mb-1">Belum Ada Berita di Rubrik ${catName}</h3>
            <p class="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mb-4 leading-relaxed">
              Saat ini belum ada artikel yang diterbitkan untuk rubrik ini. Tim redaksi kami sedang menyusun dan memverifikasi laporan peristiwa terkini untuk Anda.
            </p>
            <a href="index.html" class="inline-block px-4 py-2 bg-buser-red text-white font-bold text-xs rounded hover:bg-buser-redHover transition-colors shadow-sm">
              Kembali ke Beranda
            </a>
          </div>
        `;
      }
      if (listContainer) listContainer.innerHTML = '';
      if (paginationNav) paginationNav.style.display = 'none';
      if (trendingSidebarContainer) {
        trendingSidebarContainer.innerHTML = `
          <div class="p-4 text-xs text-gray-400 text-center">
            Belum ada data trending untuk kategori ini.
          </div>
        `;
      }
      return;
    }

    // Jika ADA ARTIKEL di database:
    // A. Artikel Teratas dijadikan Featured / Hero
    const first = articles[0];
    if (featuredContainer) {
      featuredContainer.innerHTML = `
        <div class="relative overflow-hidden aspect-[16/9] w-full bg-gray-900">
          <img src="${getCategoryThumb(first.thumbnail)}" alt="${first.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onerror="this.src='assets/images/berita/nasional/pembangunan-ikn-nusantara.jpg'" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          <span class="absolute top-3 left-3 bg-buser-red text-white text-xs font-black px-2.5 py-1 uppercase tracking-wider rounded-sm shadow">
            SOROTAN UTAMA
          </span>
          <div class="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-[11px] px-2.5 py-1 rounded flex items-center space-x-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span class="font-bold">Live</span>
          </div>
        </div>

        <div class="p-4 sm:p-6">
          <div class="flex items-center space-x-2 text-xs text-gray-500 mb-2">
            <span class="font-bold text-gray-800">${first.author_name || 'Redaksi BUSER INFO'}</span>
            <span>&bull;</span>
            <span>${formatCategoryDate(first.published_at)}</span>
            <span>&bull;</span>
            <span class="text-buser-red font-semibold">3 menit baca</span>
          </div>

          <h2 class="text-xl sm:text-2xl font-black text-gray-900 leading-tight group-hover:text-buser-red transition-colors mb-3">
            <a href="artikel.html?slug=${first.slug}">
              ${first.title}
            </a>
          </h2>

          <p class="text-xs sm:text-sm text-gray-700 leading-relaxed mb-4">
            ${first.excerpt || 'Baca laporan selengkapnya seputar peristiwa terpercaya hanya di portal berita BUSER INFO.'}
          </p>

          <div class="flex items-center justify-between pt-3 border-t border-gray-100">
            <span class="text-xs text-gray-500">Kategori: ${first.name_kategori || catName}</span>
            <a href="artikel.html?slug=${first.slug}" class="inline-flex items-center text-xs sm:text-sm font-bold text-buser-red hover:text-buser-redHover">
              Baca Selengkapnya
              <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
              </svg>
            </a>
          </div>
        </div>
      `;
    }

    // B. Artikel lainnya dimasukkan ke list feed
    const otherArticles = articles.slice(1);
    if (listContainer) {
      listContainer.innerHTML = '';
      if (otherArticles.length === 0) {
        listContainer.innerHTML = `
          <div class="p-4 bg-white border border-gray-200 rounded-sm text-center text-xs text-gray-500">
            Menampilkan 1 berita utama dari database. Berita lainnya akan muncul di sini seiring penambahan artikel baru.
          </div>
        `;
        if (paginationNav) paginationNav.style.display = 'none';
      } else {
        otherArticles.forEach(item => {
          const card = document.createElement('article');
          card.className = 'bg-white border border-gray-200 rounded-sm p-3.5 sm:p-4 news-card-hover group flex flex-col sm:flex-row gap-4';
          card.innerHTML = `
            <a href="artikel.html?slug=${item.slug}" class="sm:w-56 h-36 flex-shrink-0 relative overflow-hidden rounded-sm block aspect-[16/10] sm:aspect-auto">
              <img src="${getCategoryThumb(item.thumbnail)}" alt="${item.title}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" onerror="this.src='assets/images/berita/nasional/pembangunan-ikn-nusantara.jpg'" />
              <span class="absolute top-2 left-2 ${window.getCategoryBadgeClasses ? window.getCategoryBadgeClasses(item.name_kategori || catName) : 'bg-buser-red text-white'} text-[10px] font-bold px-2 py-0.5 uppercase rounded-sm">${item.name_kategori || catName}</span>
            </a>
            <div class="flex-1 flex flex-col justify-between">
              <div>
                <div class="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
                  <span class="font-bold text-gray-800">${item.author_name || 'Redaksi'}</span>
                  <span>&bull;</span>
                  <span>${formatCategoryDate(item.published_at)}</span>
                </div>
                <h3 class="font-black text-base sm:text-lg text-gray-900 group-hover:text-buser-red line-clamp-2 leading-snug mb-2 news-headline">
                  <a href="artikel.html?slug=${item.slug}">${item.title}</a>
                </h3>
                <p class="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed mb-2">${item.excerpt || ''}</p>
              </div>
              <div class="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-100">
                <span>Waktu baca: 3 menit</span>
                <a href="artikel.html?slug=${item.slug}" class="text-buser-red font-bold hover:underline">Baca Selengkapnya &rarr;</a>
              </div>
            </div>
          `;
          listContainer.appendChild(card);
        });
      }
    }

    // C. Sidebar Trending per Kategori
    if (trendingSidebarContainer) {
      trendingSidebarContainer.innerHTML = '';
      articles.slice(0, 5).forEach((item, idx) => {
        const art = document.createElement('article');
        art.className = 'py-3 flex items-start space-x-3.5 group';
        const numColor = window.getTrendingNumberClass ? window.getTrendingNumberClass(idx) : 'text-buser-red';
        art.innerHTML = `
          <span class="text-3xl font-black ${numColor} leading-none flex-shrink-0 w-8 text-center pt-0.5">${idx + 1}</span>
          <div class="flex-1">
            <span class="text-[10px] font-bold uppercase text-gray-500">${(item.name_kategori || catName).toUpperCase()} &bull; Terpopuler</span>
            <a href="artikel.html?slug=${item.slug}" class="block font-bold text-sm text-gray-900 group-hover:text-buser-red leading-snug mt-0.5 news-headline">
              ${item.title}
            </a>
          </div>
        `;
        trendingSidebarContainer.appendChild(art);
      });
    }

  } catch (err) {
    console.error('[renderCategoryPageFromDB] Error:', err);
  }
}

function formatCategoryDate(dateStr) {
  if (!dateStr) return 'Baru saja';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) + ' WIB';
}

function getCategoryThumb(url) {
  return url && url.length > 5 ? url : 'assets/images/berita/nasional/pembangunan-ikn-nusantara.jpg';
}

function capitalizeWord(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

function highlightActiveCategoryBar(activeSlug) {
  const categoryLinks = document.querySelectorAll('nav a[href*="internasional.html"]');
  categoryLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.includes(`cat=${activeSlug}`)) {
      link.classList.add('bg-buser-red', 'text-white', 'font-black');
      link.classList.remove('text-gray-300');
    } else {
      link.classList.remove('bg-buser-red', 'font-black');
    }
  });
}
