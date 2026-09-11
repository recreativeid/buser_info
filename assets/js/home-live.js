/**
 * BUSER INFO - Render Beranda Dinamis Murni dari PostgreSQL Database
 */

document.addEventListener('DOMContentLoaded', () => {
  // Render video secara independen agar tidak terhalang oleh jumlah artikel
  renderVideoSection();
  renderAllLiveContentFromDB();
});

async function renderAllLiveContentFromDB() {
  if (!window.BuserInfoAPI) return;

  try {
    const data = await window.BuserInfoAPI.getArticles({ limit: 30, status: 'published' });
    const articles = data.articles || [];

    // 2. BREAKING NEWS TICKER (Render artikel live atau fallback)
    renderTicker(articles);

    // Jika belum ada artikel sama sekali di DB
    if (articles.length === 0) {
      showEmptyState();
      return;
    }

    // 1. HERO HEADLINE UTAMA (Artikel teratas)
    renderHeroSection(articles);

    // 3. SECTION BERITA TERKINI (List Berita Terkini)
    renderBeritaTerkini(articles);

    // 4. SECTION TRENDING HARI INI (Top 5 views/teratas)
    renderTrending(articles);

    // 5. SECTION PER KATEGORI (Hanya tampilkan jika kategori ada beritanya)
    renderCategorySections(articles);

  } catch (err) {
    console.error('[renderAllLiveContentFromDB] Error:', err);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDateIndo(dateStr) {
  if (!dateStr) return 'Baru saja';
  const safeStr = typeof dateStr === 'string' ? dateStr.replace(' ', 'T') : dateStr;
  const d = new Date(safeStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  }) + ' • ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
}

function getThumb(url) {
  return url && url.length > 5 ? url : 'assets/images/berita/nasional/pembangunan-ikn-nusantara.jpg';
}

function getCategoryBadgeClasses(catName) {
  const norm = String(catName || '').toLowerCase().trim();
  if (norm.includes('politik') || norm.includes('kriminal') || norm.includes('hukum') || norm.includes('investigasi') || norm.includes('hot')) {
    return 'bg-buser-red text-white';
  }
  if (norm.includes('ekonomi') || norm.includes('bisnis') || norm.includes('teknologi') || norm.includes('tekno') || norm.includes('lifestyle')) {
    return 'bg-buser-yellow text-gray-950 font-bold';
  }
  return 'bg-buser-blue text-white';
}

function getCategoryAccentClass(catName) {
  const norm = String(catName || '').toLowerCase().trim();
  if (norm.includes('politik') || norm.includes('kriminal') || norm.includes('hukum') || norm.includes('investigasi') || norm.includes('hot')) {
    return { bar: '', dot: 'bg-buser-red', link: 'text-buser-red hover:text-buser-redHover' };
  }
  if (norm.includes('ekonomi') || norm.includes('bisnis') || norm.includes('teknologi') || norm.includes('tekno') || norm.includes('lifestyle')) {
    return { bar: 'accent-yellow', dot: 'bg-buser-yellow', link: 'text-amber-600 hover:text-amber-700' };
  }
  return { bar: 'accent-blue', dot: 'bg-buser-blue', link: 'text-buser-blue hover:text-buser-blueHover' };
}

function getTrendingNumberClass(index) {
  if (index === 0) return 'text-buser-red';
  if (index === 1) return 'text-buser-blue';
  if (index === 2) return 'text-buser-yellow';
  return 'text-gray-400';
}

function renderHeroArticleInnerHtml(heroArticle) {
  const catName = (heroArticle.name_kategori || 'NASIONAL').toUpperCase();
  const author = heroArticle.author_name || 'Redaksi BUSER INFO';
  const pubDate = formatDateIndo(heroArticle.published_at);
  const excerpt = heroArticle.excerpt || 'Baca laporan selengkapnya seputar peristiwa terpercaya hanya di portal berita BUSER INFO.';
  const link = `artikel.html?slug=${encodeURIComponent(heroArticle.slug)}`;

  return `
    <div class="relative overflow-hidden aspect-[16/9] w-full bg-gray-900">
      <img src="${getThumb(heroArticle.thumbnail)}" alt="${escapeHtml(heroArticle.title)}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onerror="this.src='assets/images/berita/nasional/pembangunan-ikn-nusantara.jpg'" />
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
      <span class="absolute top-3 left-3 ${getCategoryBadgeClasses(catName)} text-xs font-black px-2.5 py-1 uppercase tracking-wider rounded-sm shadow">
        ${escapeHtml(catName)}
      </span>
      <div class="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-[11px] px-2.5 py-1 rounded flex items-center space-x-1.5">
        <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
        <span class="font-bold">Live</span>
      </div>
    </div>

    <div class="p-4 sm:p-6">
      <div class="flex items-center space-x-2 text-xs text-gray-500 mb-2">
        <span class="font-bold text-gray-800">${escapeHtml(author)}</span>
        <span>&bull;</span>
        <span>${pubDate}</span>
        <span>&bull;</span>
        <span class="text-buser-red font-semibold">3 menit baca</span>
      </div>

      <h1 class="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 leading-tight group-hover:text-buser-red transition-colors mb-3">
        <a href="${link}">
          ${escapeHtml(heroArticle.title)}
        </a>
      </h1>

      <p class="text-sm sm:text-base text-gray-700 leading-relaxed mb-4 line-clamp-3">
        ${escapeHtml(excerpt)}
      </p>

      <div class="flex items-center justify-between pt-3 border-t border-gray-100">
        <div class="flex items-center space-x-2">
          <span class="text-xs bg-red-50 text-buser-red px-2 py-0.5 rounded font-bold">#${escapeHtml(heroArticle.name_kategori || 'Nasional')}</span>
          <span class="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">#BuserinfoUpdate</span>
        </div>
        <a href="${link}" class="inline-flex items-center text-xs sm:text-sm font-bold text-buser-red hover:text-buser-redHover">
          Baca Selengkapnya
          <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
          </svg>
        </a>
      </div>
    </div>
  `;
}

// 1. Hero Headline Utama
function renderHeroSection(articles) {
  const heroArticle = articles[0];
  const heroSection = document.getElementById('home-hero-section') || document.querySelector('main > section.grid');
  if (!heroSection || !heroArticle) return;

  const nextArticles = articles.slice(1, 4);

  if (nextArticles.length === 0) {
    heroSection.className = 'grid grid-cols-1 gap-5 lg:gap-6';
    heroSection.innerHTML = `
      <article class="w-full bg-white border border-gray-200 rounded-sm overflow-hidden news-card-hover group flex flex-col justify-between shadow-sm">
        ${renderHeroArticleInnerHtml(heroArticle)}
      </article>
    `;
  } else {
    heroSection.className = 'grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6';

    let supportingHtml = '';
    nextArticles.forEach(item => {
      supportingHtml += `
        <article class="bg-white border border-gray-200 rounded-sm p-3 sm:p-3.5 news-card-hover group flex flex-col justify-between shadow-sm">
          <div class="flex gap-3">
            <a href="artikel.html?slug=${encodeURIComponent(item.slug)}" class="w-28 sm:w-32 h-20 sm:h-24 flex-shrink-0 relative overflow-hidden rounded-sm block">
              <img src="${getThumb(item.thumbnail)}" alt="${escapeHtml(item.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="this.src='assets/images/berita/nasional/pembangunan-ikn-nusantara.jpg'" />
              <span class="absolute top-1 left-1 ${getCategoryBadgeClasses(item.name_kategori)} text-[9px] font-bold px-1.5 py-0.5 uppercase">${escapeHtml(item.name_kategori || 'Berita')}</span>
            </a>
            <div class="flex-1 min-w-0">
              <div class="text-[11px] text-gray-500 mb-1">${formatDateIndo(item.published_at)}</div>
              <a href="artikel.html?slug=${encodeURIComponent(item.slug)}" class="block font-bold text-xs sm:text-sm text-gray-900 group-hover:text-buser-red line-clamp-3 leading-snug news-headline">
                ${escapeHtml(item.title)}
              </a>
            </div>
          </div>
          <div class="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span>#${escapeHtml(item.name_kategori || 'Terkini')}</span>
            <span class="text-buser-red font-semibold">3 menit baca</span>
          </div>
        </article>
      `;
    });

    heroSection.innerHTML = `
      <article class="lg:col-span-8 bg-white border border-gray-200 rounded-sm overflow-hidden news-card-hover group flex flex-col justify-between shadow-sm">
        ${renderHeroArticleInnerHtml(heroArticle)}
      </article>
      <aside class="lg:col-span-4 flex flex-col space-y-3.5 sm:space-y-4">
        ${supportingHtml}
      </aside>
    `;
  }
}

// 2. Breaking News Ticker (Marquee Teks Berjalan Dinamis dari Database)
function renderTicker(articles) {
  const track = document.getElementById('breaking-ticker-track') || document.getElementById('breaking-news-ticker');
  if (!track) return;

  let items = [];
  if (Array.isArray(articles) && articles.length > 0) {
    items = articles.slice(0, 10).map(art => ({
      title: art.title,
      category: (art.name_kategori || 'Terkini').toUpperCase(),
      link: `artikel.html?slug=${encodeURIComponent(art.slug)}`
    }));
  } else {
    items = [
      {
        title: 'Selamat Datang di BUSER INFO — Portal Berita Terkini, Fakta Tanpa Batas',
        category: 'INFO',
        link: 'tentang.html'
      },
      {
        title: 'Layanan Pengaduan & Informasi Warga: Hubungi WhatsApp 0831-7298-8502',
        category: 'HOTLINE',
        link: 'https://wa.me/6283172988502'
      },
      {
        title: 'BUSER INFO berkomitmen menyajikan karya jurnalistik independen, tajam, dan terverifikasi',
        category: 'REDAKSI',
        link: 'tentang.html'
      }
    ];
  }

  // Repeat items 2x agar animasi CSS tickerSlide looping mulus tanpa terputus
  let html = '';
  const repeatCount = 2;
  for (let r = 0; r < repeatCount; r++) {
    items.forEach((item) => {
      html += `
        <a href="${item.link}" class="inline-flex items-center text-xs sm:text-sm font-medium hover:underline text-white mr-10 transition-colors">
          <span class="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-2 flex-shrink-0"></span>
          <span class="bg-black/35 text-[10px] px-1.5 py-0.5 rounded font-bold mr-2 text-yellow-300 uppercase tracking-wider">${escapeHtml(item.category)}</span>
          <span>${escapeHtml(item.title)}</span>
        </a>
      `;
    });
  }

  track.innerHTML = html;
}

// 3. Section Berita Terkini
function renderBeritaTerkini(articles) {
  const feedContainer = document.getElementById('live-berita-terkini-feed');
  if (!feedContainer) return;

  feedContainer.innerHTML = '';

  articles.forEach(item => {
    const card = document.createElement('article');
    card.className = 'bg-white border border-gray-200 rounded-sm p-3.5 sm:p-4 news-card-hover group flex flex-col sm:flex-row gap-4';
    card.innerHTML = `
      <a href="artikel.html?slug=${item.slug}" class="sm:w-52 h-36 flex-shrink-0 relative overflow-hidden rounded-sm block aspect-[16/10] sm:aspect-auto">
        <img src="${getThumb(item.thumbnail)}" alt="${item.title}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" onerror="this.src='assets/images/berita/nasional/pembangunan-ikn-nusantara.jpg'" />
        <span class="absolute top-2 left-2 ${getCategoryBadgeClasses(item.name_kategori)} text-[10px] font-bold px-2 py-0.5 uppercase shadow-sm">${item.name_kategori || 'Nasional'}</span>
      </a>
      <div class="flex-1 flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
            <span class="font-bold text-gray-800">${item.author_name || 'Redaksi'}</span>
            <span>&bull;</span>
            <span>${formatDateIndo(item.published_at)}</span>
          </div>
          <h3 class="font-black text-base sm:text-lg text-gray-900 group-hover:text-buser-red line-clamp-2 leading-snug mb-2 news-headline">
            <a href="artikel.html?slug=${item.slug}">
              ${item.title}
            </a>
          </h3>
          <p class="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed mb-2">
            ${item.excerpt || 'Baca laporan selengkapnya seputar peristiwa terpercaya hanya di portal berita BUSER INFO.'}
          </p>
        </div>
        <div class="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-100">
          <span>Waktu baca: 3 menit</span>
          <a href="artikel.html?slug=${item.slug}" class="text-buser-blue font-bold hover:underline">Baca Selengkapnya &rarr;</a>
        </div>
      </div>
    `;
    feedContainer.appendChild(card);
  });
}

// 4. Section Trending Hari Ini
function renderTrending(articles) {
  const trendingContainer = document.getElementById('live-trending-feed');
  if (!trendingContainer) return;

  trendingContainer.innerHTML = '';

  // Ambil maksimal 5 artikel
  const trendingList = articles.slice(0, 5);

  trendingList.forEach((item, index) => {
    const art = document.createElement('article');
    art.className = 'py-3 flex items-start space-x-3.5 group';
    art.innerHTML = `
      <span class="text-3xl font-black ${getTrendingNumberClass(index)} leading-none flex-shrink-0 w-8 text-center pt-0.5">${index + 1}</span>
      <div class="flex-1">
        <span class="text-[10px] font-bold uppercase text-gray-500">${(item.name_kategori || 'Berita').toUpperCase()} &bull; Terpopuler</span>
        <a href="artikel.html?slug=${item.slug}" class="block font-bold text-sm text-gray-900 group-hover:text-buser-red leading-snug mt-0.5 news-headline">
          ${item.title}
        </a>
      </div>
    `;
    trendingContainer.appendChild(art);
  });
}

// 5. Render Blok Kategori secara dinamis (Hanya kategori yang punya artikel)
function renderCategorySections(articles) {
  const container = document.getElementById('live-category-sections');
  if (!container) return;

  container.innerHTML = '';

  // Kelompokkan artikel berdasarkan kategori
  const grouped = {};
  articles.forEach(art => {
    const catName = art.name_kategori || 'Umum';
    if (!grouped[catName]) {
      grouped[catName] = [];
    }
    grouped[catName].push(art);
  });

  // Render per kategori yang memiliki artikel
  Object.keys(grouped).forEach(catName => {
    const catArticles = grouped[catName];
    if (catArticles.length === 0) return;

    const catSlug = catArticles[0].kategori_slug || catName.toLowerCase();
    const accent = getCategoryAccentClass(catName);

    const sec = document.createElement('section');
    sec.className = 'space-y-4';

    let cardsHtml = '';
    catArticles.forEach(item => {
      cardsHtml += `
        <article class="bg-white border border-gray-200 rounded-sm overflow-hidden news-card-hover group flex flex-col justify-between">
          <a href="artikel.html?slug=${item.slug}" class="aspect-[16/10] relative overflow-hidden block">
            <img src="${getThumb(item.thumbnail)}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="this.src='assets/images/berita/nasional/pembangunan-ikn-nusantara.jpg'" />
            <span class="absolute top-2 left-2 ${getCategoryBadgeClasses(catName)} text-[10px] font-bold px-2 py-0.5 uppercase shadow-sm">${catName}</span>
          </a>
          <div class="p-3.5 flex flex-col flex-1 justify-between">
            <div>
              <span class="text-[11px] text-gray-500 block mb-1">${formatDateIndo(item.published_at)}</span>
              <a href="artikel.html?slug=${item.slug}" class="block font-bold text-sm text-gray-900 group-hover:text-buser-red line-clamp-2 leading-snug mb-2 news-headline">
                ${item.title}
              </a>
              <p class="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                ${item.excerpt || 'Baca laporan selengkapnya seputar peristiwa terpercaya hanya di portal berita BUSER INFO.'}
              </p>
            </div>
            <div class="pt-2 mt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
              <span>${item.author_name || 'Redaksi'}</span>
              <span class="text-buser-red font-semibold">3 mnt</span>
            </div>
          </div>
        </article>
      `;
    });

    sec.innerHTML = `
      <div class="section-heading-bar ${accent.bar} justify-between">
        <div class="flex items-center space-x-2">
          <span class="w-3 h-3 ${accent.dot} inline-block"></span>
          <h2 class="text-lg sm:text-xl font-black uppercase tracking-tight text-gray-900">
            ${catName}
          </h2>
        </div>
        <a href="internasional.html?cat=${catSlug}" class="text-xs font-bold ${accent.link} flex items-center">
          Lihat Semua ${catName}
          <svg class="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </a>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        ${cardsHtml}
      </div>
    `;

    container.appendChild(sec);
  });
}

function showEmptyState() {
  const heroSection = document.getElementById('home-hero-section') || document.querySelector('main > section.grid');
  if (heroSection) {
    heroSection.className = 'w-full';
    heroSection.innerHTML = `
      <div class="bg-white border border-gray-200 rounded-sm p-8 sm:p-14 text-center shadow-sm">
        <div class="w-16 h-16 bg-red-50 text-buser-red rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
          </svg>
        </div>
        <h2 class="text-xl sm:text-2xl font-black text-gray-900 mb-2">Belum Ada Berita Tersedia</h2>
        <p class="text-xs sm:text-sm text-gray-600 max-w-lg mx-auto mb-6 leading-relaxed">
          Saat ini belum ada artikel yang dipublikasikan. Redaksi BUSER INFO terus memantau dan memverifikasi laporan peristiwa terkini untuk Anda. Silakan berkunjung kembali beberapa saat lagi.
        </p>
        <div class="flex flex-wrap items-center justify-center gap-3">
          <a href="tentang.html" class="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-sm transition-colors">
            Profil Redaksi & Legalitas
          </a>
          <a href="https://wa.me/6283172988502" target="_blank" class="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-sm transition-colors">
            Hotline Pengaduan Warga
          </a>
        </div>
      </div>
    `;
  }

  const feedContainer = document.getElementById('live-berita-terkini-feed');
  if (feedContainer) {
    feedContainer.innerHTML = `
      <div class="p-8 text-center bg-white border border-gray-200 rounded-sm">
        <p class="text-sm font-bold text-gray-700">Belum ada berita terkini yang dipublikasikan.</p>
        <p class="text-xs text-gray-500 mt-1">Nantikan pembaruan laporan berita dari wartawan kami di lapangan.</p>
      </div>
    `;
  }

  const trendingContainer = document.getElementById('live-trending-feed');
  if (trendingContainer) {
    trendingContainer.innerHTML = `
      <div class="py-6 text-center text-xs text-gray-400">
        Belum ada berita trending saat ini.
      </div>
    `;
  }

  const catContainer = document.getElementById('live-category-sections');
  if (catContainer) {
    catContainer.innerHTML = '';
  }
}

// 4b. Render Video YouTube Ber-caption Dinamis dari PostgreSQL
async function renderVideoSection() {
  const container = document.getElementById('section-video-terkini');
  if (!container || !window.BuserInfoAPI) return;

  try {
    const res = await window.BuserInfoAPI.getVideos({ status: 'active', limit: 8 });
    const videos = res.videos || [];

    if (videos.length === 0) {
      container.classList.add('hidden');
      return;
    }

    container.classList.remove('hidden');

    let currentVideo = videos[0];

    function updateActiveVideo(v, autoPlay = false) {
      currentVideo = v;
      const iframe = document.getElementById('client-video-iframe');
      const titleEl = document.getElementById('client-video-title');
      const captionEl = document.getElementById('client-video-caption');
      const metaEl = document.getElementById('client-video-meta');
      const watchBtn = document.getElementById('client-video-watch-btn');

      if (iframe) {
        iframe.src = `https://www.youtube-nocookie.com/embed/${v.youtube_id}?rel=0${autoPlay ? '&autoplay=1' : ''}`;
      }
      if (titleEl) {
        titleEl.textContent = v.title;
      }
      if (captionEl) {
        captionEl.textContent = v.caption || 'Tidak ada keterangan caption untuk video ini.';
      }
      if (metaEl) {
        metaEl.innerHTML = `
          <span>${formatDateIndo(v.created_at)}</span>
          <span>&bull;</span>
          <span class="text-red-400 font-semibold">BUSER TV</span>
        `;
      }
      if (watchBtn) {
        watchBtn.href = v.watch_url || `https://www.youtube.com/watch?v=${v.youtube_id}`;
      }

      // Update active styling in playlist
      document.querySelectorAll('.video-playlist-item').forEach(item => {
        if (item.dataset.videoId == v.id_video) {
          item.classList.add('border-buser-red', 'bg-[#202020]');
          item.classList.remove('border-transparent');
        } else {
          item.classList.remove('border-buser-red', 'bg-[#202020]');
          item.classList.add('border-transparent');
        }
      });
    }

    // Render playlist if more than 1 video
    const playlistContainer = document.getElementById('client-video-playlist');
    if (playlistContainer) {
      if (videos.length > 1) {
        playlistContainer.innerHTML = `
          <div class="pt-3 border-t border-gray-800">
            <div class="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center justify-between">
              <span>Pilihan Video Lainnya</span>
              <span class="text-[10px] bg-[#1E1E1E] text-gray-400 px-2 py-0.5 rounded font-mono">${videos.length} Video</span>
            </div>
            <div class="space-y-2 max-h-52 overflow-y-auto pr-1">
              ${videos.map((vid, idx) => `
                <div class="video-playlist-item flex items-center gap-2.5 p-2 rounded cursor-pointer border hover:bg-[#1A1A1A] transition-all group ${idx === 0 ? 'border-buser-red bg-[#202020]' : 'border-transparent'}" data-video-id="${vid.id_video}">
                  <div class="relative w-20 aspect-video rounded overflow-hidden shrink-0 bg-black border border-gray-800">
                    <img src="${vid.thumbnail_url}" alt="${vid.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform" onerror="this.src='https://img.youtube.com/vi/${vid.youtube_id}/0.jpg'" />
                    <div class="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                      <svg class="w-4 h-4 text-red-500 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h5 class="text-xs font-semibold text-gray-200 truncate group-hover:text-red-400 transition-colors">${vid.title}</h5>
                    <p class="text-[10px] text-gray-400 truncate mt-0.5">${vid.caption || 'Tanpa keterangan'}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;

        playlistContainer.querySelectorAll('.video-playlist-item').forEach(item => {
          item.addEventListener('click', () => {
            const vidId = item.dataset.videoId;
            const targetVid = videos.find(v => v.id_video == vidId);
            if (targetVid) updateActiveVideo(targetVid, true);
          });
        });
      } else {
        playlistContainer.innerHTML = '';
      }
    }

    // Initialize first video without autoplay
    updateActiveVideo(currentVideo, false);

  } catch (err) {
    console.error('[renderVideoSection] Error:', err);
  }
}

