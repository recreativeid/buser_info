/**
 * BUSER INFO - Article Detail Page Script
 * Handles dynamic content population, font size controls, reading progress bar,
 * bookmark status, social sharing, and reader comments.
 */

document.addEventListener('DOMContentLoaded', () => {
  initArticlePage();
  initReadingProgressBar();
});

let currentFontSize = 'md'; // 'sm', 'md', 'lg'

function initArticlePage() {
  const urlParams = new URLSearchParams(window.location.search);
  const articleId = urlParams.get('id') || 'int-01';

  const article = window.NewsDB.getById(articleId);
  if (!article) return;

  // Update Page Title
  document.title = `${article.title} - BUSER INFO`;

  // 1. Breadcrumbs
  const breadcrumbCat = document.getElementById('article-breadcrumb-cat');
  const breadcrumbTitle = document.getElementById('article-breadcrumb-title');
  if (breadcrumbCat) {
    breadcrumbCat.textContent = article.category;
    breadcrumbCat.href = `internasional.html?cat=${article.categorySlug}`;
  }
  if (breadcrumbTitle) {
    breadcrumbTitle.textContent = article.title;
  }

  // 2. Header & Metadata
  const catBadge = document.getElementById('article-cat-badge');
  const headline = document.getElementById('article-headline');
  const excerpt = document.getElementById('article-excerpt');
  const authorName = document.getElementById('article-author');
  const authorRole = document.getElementById('article-author-role');
  const editorName = document.getElementById('article-editor');
  const dateStr = document.getElementById('article-date');
  const readDuration = document.getElementById('article-read-time');
  const viewsCount = document.getElementById('article-views');

  if (catBadge) catBadge.textContent = article.category.toUpperCase();
  if (headline) headline.textContent = article.title;
  if (excerpt) excerpt.textContent = article.excerpt;
  if (authorName) authorName.textContent = article.author;
  if (authorRole) authorRole.textContent = article.authorRole || 'Jurnalis Investigasi';
  if (editorName) editorName.textContent = article.editor || 'Redaksi Buser Info';
  if (dateStr) dateStr.textContent = `${article.date} - ${article.time}`;
  if (readDuration) readDuration.textContent = article.readTime;
  if (viewsCount) viewsCount.textContent = `${article.views} pembaca`;

  // 3. Hero Media
  const heroImg = document.getElementById('article-hero-img');
  const heroCaption = document.getElementById('article-hero-caption');
  if (heroImg) {
    heroImg.src = article.image;
    heroImg.alt = article.title;
  }
  if (heroCaption) {
    heroCaption.textContent = article.imageCaption || `Ilustrasi liputan pemberitaan ${article.category}. (Foto: Dok. BUSER INFO)`;
  }

  // 4. Content Body
  const contentBody = document.getElementById('article-body-content');
  if (contentBody) {
    contentBody.innerHTML = article.content;
  }

  // 5. Tags
  const tagsContainer = document.getElementById('article-tags-container');
  if (tagsContainer && article.tags) {
    tagsContainer.innerHTML = article.tags.map(tag => `
      <a href="cari.html?q=${encodeURIComponent(tag)}" class="inline-block bg-gray-100 hover:bg-buser-red hover:text-white text-gray-700 text-xs px-3 py-1.5 rounded-sm font-medium transition-colors">
        #${tag}
      </a>
    `).join('');
  }

  // 6. Font Resizer Controls
  initFontSizeControls();

  // 7. Bookmark Button
  initArticleBookmark(article.id);

  // 8. Share Handlers
  initShareButtons(article);

  // 9. Related News
  renderRelatedArticles(article.id, article.categorySlug);

  // 10. Reactions & Comments
  initReactions();
  initCommentForm();
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
   Related Articles
   -------------------------------------------------------------------------- */
function renderRelatedArticles(currentId, categorySlug) {
  const container = document.getElementById('related-articles-grid');
  if (!container || typeof window.NewsDB === 'undefined') return;

  const related = window.NewsDB.getRelated(currentId, categorySlug, 4);
  if (!related.length) return;

  container.innerHTML = related.map(item => `
    <article class="bg-white border border-gray-200 rounded-sm overflow-hidden news-card-hover group flex flex-col">
      <a href="artikel.html?id=${item.id}" class="block overflow-hidden relative aspect-[16/10]">
        <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
        <span class="absolute top-2 left-2 bg-buser-red text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
          ${item.category}
        </span>
      </a>
      <div class="p-3.5 flex flex-col flex-1 justify-between">
        <div>
          <a href="artikel.html?id=${item.id}" class="block font-bold text-sm text-gray-900 group-hover:text-buser-red line-clamp-2 leading-snug mb-1.5 news-headline">
            ${item.title}
          </a>
          <p class="text-xs text-gray-600 line-clamp-2 mb-2 leading-relaxed">
            ${item.excerpt}
          </p>
        </div>
        <div class="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-100 mt-auto">
          <span>${item.date.split(',')[0]}</span>
          <span>${item.readTime}</span>
        </div>
      </div>
    </article>
  `).join('');
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

function initCommentForm() {
  const form = document.getElementById('comment-form');
  const commentList = document.getElementById('comment-list');

  if (!form || !commentList) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('comment-name');
    const textInput = document.getElementById('comment-text');

    const name = nameInput.value.trim();
    const text = textInput.value.trim();

    if (!name || !text) return;

    const newComment = document.createElement('div');
    newComment.className = 'p-3 bg-gray-50 border-l-2 border-buser-red rounded-sm';
    newComment.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <span class="font-bold text-sm text-gray-900">${name}</span>
        <span class="text-[11px] text-gray-500">Baru saja</span>
      </div>
      <p class="text-xs text-gray-700 leading-relaxed">${text}</p>
    `;

    commentList.prepend(newComment);
    nameInput.value = '';
    textInput.value = '';
    window.showToast('Komentar Anda berhasil dikirim!', 'success');
  });
}
