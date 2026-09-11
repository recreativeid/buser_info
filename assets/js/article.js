/**
 * BUSER INFO - Article Detail Page Script
 * Dynamic content population from PostgreSQL Database via REST API.
 * Handles empty/not-found states, font sizing, reading progress, bookmarks, and comments.
 */

document.addEventListener('DOMContentLoaded', () => {
  initArticlePage();
  initReadingProgressBar();
});

let currentFontSize = 'md'; // 'sm', 'md', 'lg'

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
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }) + ' - ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
}

function getThumb(url) {
  return url && url.length > 5 ? url : 'assets/images/berita/nasional/pembangunan-ikn-nusantara.jpg';
}

async function initArticlePage() {
  const urlParams = new URLSearchParams(window.location.search);
  const slugParam = urlParams.get('slug');
  const idParam = urlParams.get('id');

  // Load trending sidebar dinamis dari database
  renderArticleTrending();

  if (!window.BuserInfoAPI) {
    showArticleNotFound('Koneksi Gagal', 'Tidak dapat terhubung ke server berita. Silakan muat ulang halaman atau periksa koneksi internet Anda.');
    return;
  }

  // 1. Jika ada parameter slug dari database
  if (slugParam) {
    try {
      const liveArticle = await window.BuserInfoAPI.getArticleBySlug(slugParam);
      if (liveArticle && liveArticle.title) {
        renderLiveArticleDetail(liveArticle);
        return;
      }
    } catch (e) {
      console.warn('[article.js] Slug query failed:', e);
    }
    showArticleNotFound('Berita Tidak Ditemukan', 'Artikel dengan tautan tersebut tidak ditemukan atau belum dipublikasikan oleh redaksi.');
    return;
  }

  // 2. Jika ada parameter ID berupa angka
  if (idParam && /^\d+$/.test(idParam)) {
    try {
      const liveArticle = await window.BuserInfoAPI.getArticleById(idParam);
      if (liveArticle && liveArticle.title) {
        renderLiveArticleDetail(liveArticle);
        return;
      }
    } catch (e) {
      console.warn('[article.js] ID query failed:', e);
    }
    showArticleNotFound('Berita Tidak Ditemukan', 'Artikel yang Anda cari tidak ditemukan atau telah dihapus.');
    return;
  }

  // 3. Jika tanpa parameter slug/ID atau ID dummy (seperti int-01), coba tampilkan artikel terbaru dari DB
  try {
    const res = await window.BuserInfoAPI.getArticles({ limit: 1, status: 'published' });
    const articles = res.articles || [];
    if (articles.length > 0) {
      renderLiveArticleDetail(articles[0]);
      return;
    }
  } catch (e) {
    console.warn('[article.js] Fetch latest article failed:', e);
  }

  // 4. Jika di database belum ada artikel sama sekali
  showArticleNotFound('Belum Ada Berita Tersedia', 'Saat ini belum ada berita atau artikel yang dipublikasikan oleh redaksi. Silakan kembali ke Beranda untuk melihat pembaruan mendatang.');
}

function showArticleNotFound(title = 'Berita Tidak Ditemukan', message = 'Maaf, artikel yang Anda cari tidak ditemukan atau belum dipublikasikan oleh redaksi.') {
  document.title = `${title} — BUSER INFO`;

  const mainArticle = document.querySelector('article.lg\\:col-span-8');
  if (mainArticle) {
    mainArticle.innerHTML = `
      <div class="py-12 sm:py-16 px-4 text-center">
        <div class="w-16 h-16 bg-red-50 text-buser-red rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        </div>
        <h1 class="text-xl sm:text-2xl font-black text-gray-900 mb-2">${escapeHtml(title)}</h1>
        <p class="text-xs sm:text-sm text-gray-600 max-w-md mx-auto mb-6 leading-relaxed">
          ${escapeHtml(message)}
        </p>
        <div class="flex flex-wrap items-center justify-center gap-3">
          <a href="index.html" class="inline-flex items-center px-4 py-2 bg-buser-red hover:bg-buser-redHover text-white text-xs font-bold rounded-sm transition-colors shadow-sm">
            &larr; Kembali ke Beranda
          </a>
          <a href="internasional.html" class="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-sm transition-colors">
            Lihat Rubrik Berita
          </a>
        </div>
      </div>
    `;
  }

  // Sembunyikan section terkait & komentar jika artikel tidak ditemukan
  const relatedSection = document.getElementById('related-articles-grid')?.closest('section');
  if (relatedSection) relatedSection.style.display = 'none';

  const commentSection = document.getElementById('article-comment-section');
  if (commentSection) commentSection.style.display = 'none';
}

function renderLiveArticleDetail(article) {
  document.title = `${article.title} — BUSER INFO`;

  const breadcrumbCat = document.getElementById('article-breadcrumb-cat');
  const breadcrumbTitle = document.getElementById('article-breadcrumb-title');
  if (breadcrumbCat) {
    breadcrumbCat.textContent = article.name_kategori || 'Nasional';
    breadcrumbCat.href = `internasional.html?cat=${encodeURIComponent(article.kategori_slug || 'nasional')}`;
  }
  if (breadcrumbTitle) {
    breadcrumbTitle.textContent = article.title;
  }

  const catBadge = document.getElementById('article-cat-badge');
  const headline = document.getElementById('article-headline');
  const excerpt = document.getElementById('article-excerpt');
  const authorName = document.getElementById('article-author');
  const authorRole = document.getElementById('article-author-role');
  const editorName = document.getElementById('article-editor');
  const dateStr = document.getElementById('article-date');
  const heroImg = document.getElementById('article-hero-img');
  const heroCaption = document.getElementById('article-hero-caption');
  const bodyContent = document.getElementById('article-body-content');
  const viewsCount = document.getElementById('article-views');

  if (catBadge) {
    catBadge.textContent = (article.name_kategori || 'NASIONAL').toUpperCase();
    const badgeClass = window.getCategoryBadgeClasses ? window.getCategoryBadgeClasses(article.name_kategori) : 'bg-buser-red text-white';
    catBadge.className = `${badgeClass} text-xs font-black px-2.5 py-1 uppercase tracking-wider rounded-sm inline-block shadow-sm`;
  }
  if (headline) headline.textContent = article.title;
  if (excerpt) excerpt.textContent = article.excerpt || article.title;
  if (authorName) authorName.textContent = article.author_name || 'Redaksi BUSER INFO';
  if (authorRole) authorRole.textContent = 'Jurnalis / Redaksi BUSER INFO';
  if (editorName) editorName.textContent = 'Pemimpin Redaksi BUSER INFO';
  if (dateStr) {
    dateStr.textContent = formatDateIndo(article.published_at);
  }
  if (viewsCount) {
    const v = article.views || 1;
    viewsCount.innerHTML = `
      <svg class="w-3.5 h-3.5 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>
      ${Number(v).toLocaleString('id-ID')} pembaca
    `;
  }
  if (heroImg) {
    heroImg.src = getThumb(article.thumbnail);
    heroImg.alt = article.title;
  }
  if (heroCaption) {
    heroCaption.textContent = `Dokumentasi Liputan: ${article.title} (Foto: Redaksi BUSER INFO)`;
  }
  if (bodyContent) {
    bodyContent.innerHTML = article.content || '<p>Tidak ada isi artikel yang tersedia.</p>';
  }

  // Tags
  const tagsContainer = document.getElementById('article-tags-container');
  if (tagsContainer) {
    const tags = [article.name_kategori, 'BuserinfoUpdate', 'BeritaTerkini'].filter(Boolean);
    tagsContainer.innerHTML = tags.map(tag => `
      <a href="cari.html?q=${encodeURIComponent(tag)}" class="inline-block bg-gray-100 hover:bg-buser-red hover:text-white text-gray-700 text-xs px-3 py-1.5 rounded-sm font-medium transition-colors">
        #${escapeHtml(tag)}
      </a>
    `).join('');
  }

  // Reader Controls & Comments
  initFontSizeControls();
  initArticleBookmark(article.slug || article.id_artikel);
  initShareButtons({ title: article.title });
  initReactions();
  renderRelatedArticles(article.slug, article.kategori_slug);
  loadArticleComments(article.id_artikel, article.slug);
  initCommentForm(article.id_artikel, article.slug);
}

async function renderArticleTrending() {
  const container = document.getElementById('article-trending-feed');
  if (!container || !window.BuserInfoAPI) return;

  try {
    const res = await window.BuserInfoAPI.getArticles({ limit: 5, status: 'published' });
    const articles = res.articles || [];

    if (articles.length === 0) {
      container.innerHTML = `
        <div class="py-6 text-center text-xs text-gray-400">
          Belum ada berita trending saat ini.
        </div>
      `;
      return;
    }

    container.innerHTML = articles.map((item, idx) => {
      const numColor = window.getTrendingNumberClass ? window.getTrendingNumberClass(idx) : 'text-buser-red';
      return `
      <article class="py-3 flex items-start space-x-3.5 group">
        <span class="text-3xl font-black ${numColor} leading-none flex-shrink-0 w-8 text-center pt-0.5">${idx + 1}</span>
        <div class="flex-1">
          <span class="text-[10px] font-bold uppercase text-gray-500">${escapeHtml(item.name_kategori || 'Berita').toUpperCase()} &bull; Terpopuler</span>
          <a href="artikel.html?slug=${encodeURIComponent(item.slug)}" class="block font-bold text-sm text-gray-900 group-hover:text-buser-red leading-snug mt-0.5 news-headline">
            ${escapeHtml(item.title)}
          </a>
        </div>
      </article>
    `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div class="py-4 text-center text-xs text-gray-400">Belum ada data trending saat ini.</div>`;
  }
}

/* --------------------------------------------------------------------------
   Font Size Resizing (A- / Normal / A+)
   -------------------------------------------------------------------------- */
function initFontSizeControls() {
  const btnSm = document.getElementById('font-decrease-btn');
  const btnMd = document.getElementById('font-reset-btn');
  const btnLg = document.getElementById('font-increase-btn');
  const contentBody = document.getElementById('article-body-content');

  if (!contentBody) return;

  function setSize(size) {
    currentFontSize = size;
    contentBody.classList.remove('article-text-sm', 'article-text-md', 'article-text-lg');
    contentBody.classList.add(`article-text-${size}`);

    [btnSm, btnMd, btnLg].forEach(b => {
      if (b) b.classList.remove('bg-buser-red', 'text-white', 'font-bold');
    });

    if (size === 'sm' && btnSm) btnSm.classList.add('bg-buser-red', 'text-white', 'font-bold');
    if (size === 'md' && btnMd) btnMd.classList.add('bg-buser-red', 'text-white', 'font-bold');
    if (size === 'lg' && btnLg) btnLg.classList.add('bg-buser-red', 'text-white', 'font-bold');
  }

  if (btnSm) btnSm.addEventListener('click', () => setSize('sm'));
  if (btnMd) btnMd.addEventListener('click', () => setSize('md'));
  if (btnLg) btnLg.addEventListener('click', () => setSize('lg'));

  setSize('md');
}

/* --------------------------------------------------------------------------
   Bookmark State Toggle
   -------------------------------------------------------------------------- */
function initArticleBookmark(articleId) {
  const bookmarkBtn = document.getElementById('article-bookmark-btn');
  const bookmarkText = document.getElementById('article-bookmark-text');
  const bookmarkIcon = document.getElementById('article-bookmark-icon');

  if (!bookmarkBtn) return;

  function syncState() {
    const active = window.isBookmarked(articleId);
    if (active) {
      bookmarkBtn.classList.add('bg-red-50', 'border-buser-red', 'text-buser-red');
      if (bookmarkText) bookmarkText.textContent = 'Tersimpan';
      if (bookmarkIcon) {
        bookmarkIcon.innerHTML = `<path fill="currentColor" stroke="none" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />`;
      }
    } else {
      bookmarkBtn.classList.remove('bg-red-50', 'border-buser-red', 'text-buser-red');
      if (bookmarkText) bookmarkText.textContent = 'Simpan Berita';
      if (bookmarkIcon) {
        bookmarkIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />`;
      }
    }
  }

  syncState();

  bookmarkBtn.addEventListener('click', () => {
    window.toggleBookmark(articleId);
    syncState();
  });
}

/* --------------------------------------------------------------------------
   Share Buttons
   -------------------------------------------------------------------------- */
function initShareButtons(article) {
  const currentUrl = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(article.title);

  const waBtn = document.getElementById('share-wa');
  const fbBtn = document.getElementById('share-fb');
  const twBtn = document.getElementById('share-tw');
  const tgBtn = document.getElementById('share-tg');
  const copyBtn = document.getElementById('share-copy');

  if (waBtn) waBtn.href = `https://api.whatsapp.com/send?text=${title}%20${currentUrl}`;
  if (fbBtn) fbBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`;
  if (twBtn) twBtn.href = `https://twitter.com/intent/tweet?text=${title}&url=${currentUrl}`;
  if (tgBtn) tgBtn.href = `https://t.me/share/url?url=${currentUrl}&text=${title}`;

  if (copyBtn) {
    copyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          window.showToast('Tautan berita berhasil disalin!', 'success');
        })
        .catch(() => {
          window.showToast('Gagal menyalin tautan.', 'info');
        });
    });
  }
}

/* --------------------------------------------------------------------------
   Reading Progress Bar
   -------------------------------------------------------------------------- */
function initReadingProgressBar() {
  const bar = document.getElementById('reading-progress-bar');
  if (!bar) return;

  window.addEventListener('scroll', () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (totalHeight <= 0) return;
    const progress = (window.scrollY / totalHeight) * 100;
    bar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  });
}

/* --------------------------------------------------------------------------
   Related Articles (Dinamis dari Database PostgreSQL)
   -------------------------------------------------------------------------- */
async function renderRelatedArticles(currentSlug, categorySlug) {
  const container = document.getElementById('related-articles-grid');
  const section = container ? container.closest('section') : null;
  if (!container || !window.BuserInfoAPI) return;

  try {
    const res = await window.BuserInfoAPI.getArticles({
      kategori: categorySlug || '',
      limit: 5,
      status: 'published'
    });
    const all = res.articles || [];
    const related = all.filter(item => item.slug !== currentSlug).slice(0, 4);

    if (related.length === 0) {
      if (section) section.style.display = 'none';
      return;
    }

    if (section) section.style.display = '';
    container.innerHTML = related.map(item => {
      const badgeClass = window.getCategoryBadgeClasses ? window.getCategoryBadgeClasses(item.name_kategori) : 'bg-buser-red text-white';
      return `
      <article class="bg-white border border-gray-200 rounded-sm overflow-hidden news-card-hover group flex flex-col justify-between shadow-sm">
        <a href="artikel.html?slug=${encodeURIComponent(item.slug)}" class="block overflow-hidden relative aspect-[16/10] bg-gray-900">
          <img src="${getThumb(item.thumbnail)}" alt="${escapeHtml(item.title)}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" onerror="this.src='assets/images/berita/nasional/pembangunan-ikn-nusantara.jpg'" />
          <span class="absolute top-2 left-2 ${badgeClass} text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider shadow rounded-sm">
            ${escapeHtml(item.name_kategori || 'Berita')}
          </span>
        </a>
        <div class="p-3.5 flex flex-col flex-1 justify-between">
          <div>
            <a href="artikel.html?slug=${encodeURIComponent(item.slug)}" class="block font-bold text-sm text-gray-900 group-hover:text-buser-red line-clamp-2 leading-snug mb-1.5 news-headline">
              ${escapeHtml(item.title)}
            </a>
            <p class="text-xs text-gray-600 line-clamp-2 mb-2 leading-relaxed">
              ${escapeHtml(item.excerpt || item.title)}
            </p>
          </div>
          <div class="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-100 mt-auto">
            <span>${formatDateIndo(item.published_at)}</span>
            <span class="text-buser-red font-semibold">3 menit baca</span>
          </div>
        </div>
      </article>
    `;
    }).join('');
  } catch (err) {
    if (section) section.style.display = 'none';
  }
}

/* --------------------------------------------------------------------------
   Reactions & Reader Comments
   -------------------------------------------------------------------------- */
function initReactions() {
  const reactionBtns = document.querySelectorAll('.reaction-btn');
  reactionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const countEl = btn.querySelector('.reaction-count');
      if (countEl) {
        let current = parseInt(countEl.textContent, 10) || 0;
        countEl.textContent = current + 1;
        btn.classList.add('border-buser-red', 'bg-red-50', 'text-buser-red');
        window.showToast('Terima kasih atas reaksi Anda!', 'success');
      }
    });
  });
}

async function loadArticleComments(articleId, slug) {
  const commentList = document.getElementById('comment-list');
  if (!commentList) return;

  if (!window.BuserInfoAPI) return;

  try {
    const res = await window.BuserInfoAPI.getComments({
      artikel_id: articleId || '',
      slug: slug || ''
    });

    const comments = Array.isArray(res) ? res : (res.comments || []);

    if (comments.length === 0) {
      commentList.innerHTML = `
        <div class="p-4 bg-gray-50 border border-gray-200 rounded-sm text-center text-xs text-gray-500">
          Belum ada komentar yang dipublikasikan. Jadilah yang pertama memberikan tanggapan!
        </div>
      `;
      return;
    }

    commentList.innerHTML = comments.map(c => {
      const dateStr = c.created_at ? new Date(c.created_at).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }) + ' WIB' : 'Baru saja';

      const initial = (c.name || 'P').charAt(0).toUpperCase();

      return `
        <div class="p-3.5 bg-white border border-gray-200 rounded-sm shadow-xs transition-colors hover:border-gray-300">
          <div class="flex items-center justify-between mb-1.5">
            <div class="flex items-center space-x-2">
              <span class="w-6 h-6 rounded-full bg-red-100 text-buser-red font-black text-[11px] flex items-center justify-center">
                ${initial}
              </span>
              <span class="font-bold text-xs text-gray-900">${escapeHtmlComment(c.name)}</span>
            </div>
            <span class="text-[11px] text-gray-400 font-mono">${dateStr}</span>
          </div>
          <p class="text-xs text-gray-700 leading-relaxed pl-8">${escapeHtmlComment(c.comment)}</p>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.warn('[Article] Gagal memuat komentar:', err);
  }
}

function initCommentForm(articleId, slug) {
  const form = document.getElementById('comment-form');
  if (!form) return;

  form.onsubmit = async (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('comment-name');
    const emailInput = document.getElementById('comment-email');
    const textInput = document.getElementById('comment-text');
    const submitBtn = form.querySelector('button[type="submit"]');

    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const text = textInput ? textInput.value.trim() : '';

    if (!name || !text) {
      if (window.showToast) window.showToast('Nama dan isi komentar wajib diisi.', 'info');
      return;
    }

    const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Kirim Komentar';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `Mengirim...`;
    }

    try {
      if (window.BuserInfoAPI) {
        const res = await window.BuserInfoAPI.submitComment({
          artikel_id: articleId,
          slug: slug,
          name: name,
          email: email,
          comment: text
        });

        if (res.status === 'success' || res.success) {
          if (nameInput) nameInput.value = '';
          if (emailInput) emailInput.value = '';
          if (textInput) textInput.value = '';

          if (window.showToast) {
            window.showToast('Komentar berhasil dikirim dan menunggu moderasi redaksi!', 'success');
          }

          let feedback = document.getElementById('comment-feedback');
          if (!feedback) {
            feedback = document.createElement('div');
            feedback.id = 'comment-feedback';
            form.appendChild(feedback);
          }
          feedback.className = 'mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-sm';
          feedback.innerHTML = `<strong>Terima kasih!</strong> Komentar Anda telah diterima dan akan tayang setelah diverifikasi oleh tim moderasi redaksi BUSER INFO.`;
          setTimeout(() => { if (feedback) feedback.remove(); }, 10000);
        } else {
          if (window.showToast) window.showToast(res.message || 'Gagal mengirim komentar.', 'danger');
        }
      }
    } catch (err) {
      if (window.showToast) window.showToast('Terjadi kesalahan saat mengirim komentar.', 'danger');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    }
  };
}

function escapeHtmlComment(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
