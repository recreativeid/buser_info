/**
 * BUSER INFO - Categories & Data Store Interface
 * PT. GOLDENMIX MEDIA BUSERINFO
 */

const BUSER_CATEGORIES = [
  { id: 'home', name: 'Home', slug: 'home', path: 'index.html' },
  { id: 'nasional', name: 'Nasional', slug: 'nasional', path: 'internasional.html?cat=nasional' },
  { id: 'daerah', name: 'Daerah', slug: 'daerah', path: 'internasional.html?cat=daerah' },
  { id: 'politik', name: 'Politik', slug: 'politik', path: 'internasional.html?cat=politik' },
  { id: 'kriminal', name: 'Kriminal', slug: 'kriminal', path: 'internasional.html?cat=kriminal' },
  { id: 'ekonomi', name: 'Ekonomi', slug: 'ekonomi', path: 'internasional.html?cat=ekonomi' },
  { id: 'pendidikan', name: 'Pendidikan', slug: 'pendidikan', path: 'internasional.html?cat=pendidikan' },
  { id: 'teknologi', name: 'Teknologi', slug: 'teknologi', path: 'internasional.html?cat=teknologi' },
  { id: 'olahraga', name: 'Olahraga', slug: 'olahraga', path: 'internasional.html?cat=olahraga' },
  { id: 'internasional', name: 'Internasional', slug: 'internasional', path: 'internasional.html' },
  { id: 'lifestyle', name: 'Lifestyle', slug: 'lifestyle', path: 'internasional.html?cat=lifestyle' }
];

const BREAKING_NEWS_LIST = [];

const BUSER_ARTICLES = [];

// Helper Functions Interface
const NewsDB = {
  getAll: () => [],
  getById: () => null,
  getBySlug: () => null,
  getByCategory: () => [],
  getHero: () => null,
  getHeroSupporting: () => [],
  getTrending: () => [],
  getBreakingNews: () => [],
  getLatest: () => [],
  getRelated: () => [],
  search: () => []
};

// Export to window
if (typeof window !== 'undefined') {
  window.BUSER_CATEGORIES = BUSER_CATEGORIES;
  window.BUSER_ARTICLES = BUSER_ARTICLES;
  window.BREAKING_NEWS_LIST = BREAKING_NEWS_LIST;
  window.NewsDB = NewsDB;
}
