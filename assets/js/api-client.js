/**
 * BUSER INFO - API CLIENT CONNECTOR
 * Menghubungkan Frontend Website dan Admin ke REST API PHP / PostgreSQL
 */

const API_BASE_URL = (function() {
  // Otomatis deteksi base URL apakah dibuka dari localhost:8000, xampp (localhost/...), atau live server
  const origin = window.location.origin;
  const path = window.location.pathname;
  
  if (path.includes('/admin/')) {
    return '../api';
  }
  return 'api';
})();

const BuserInfoAPI = {
  // --- Konfigurasi Batas Waktu Sesi (Session Timeout) ---
  SESSION_CONFIG: {
    MAX_LIFETIME_MS: 2 * 60 * 60 * 1000, // 2 jam batas maksimal sesi aktif
    IDLE_TIMEOUT_MS: 30 * 60 * 1000,    // 30 menit batas inaktivitas
  },

  // Periksa apakah sesi saat ini masih valid dan belum kedaluwarsa
  isSessionValid() {
    try {
      const token = localStorage.getItem('buser_token');
      const user = localStorage.getItem('buser_user');
      if (!token || !user) return false;

      const now = Date.now();
      const expiresAt = parseInt(localStorage.getItem('buser_session_expires') || '0', 10);
      const lastActivity = parseInt(localStorage.getItem('buser_last_activity') || '0', 10);

      // Jika data sesi belum memiliki timestamp kedaluwarsa, anggap kedaluwarsa
      if (!expiresAt || !lastActivity) {
        return false;
      }

      // Periksa batas maksimal masa aktif sesi (2 jam)
      if (now > expiresAt) {
        return false;
      }

      // Periksa batas inaktivitas (30 menit)
      if (now - lastActivity > this.SESSION_CONFIG.IDLE_TIMEOUT_MS) {
        return false;
      }

      // Periksa payload token JWT jika ada exp
      try {
        const parts = token.split('.');
        if (parts.length === 2) {
          const b64 = parts[0].replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(decodeURIComponent(escape(atob(b64))));
          if (payload && payload.exp && (now / 1000) > payload.exp) {
            return false;
          }
        }
      } catch (pe) {}

      return true;
    } catch (e) {
      return false;
    }
  },

  // Perbarui waktu aktivitas terakhir pengguna
  recordActivity() {
    try {
      const token = localStorage.getItem('buser_token');
      const expiresAt = parseInt(localStorage.getItem('buser_session_expires') || '0', 10);
      const now = Date.now();
      if (token && expiresAt && now < expiresAt) {
        localStorage.setItem('buser_last_activity', now.toString());
      }
    } catch (e) {}
  },

  // --- Autentikasi Helpers ---
  getToken() {
    try {
      if (!this.isSessionValid()) {
        if (localStorage.getItem('buser_token')) {
          this.clearAuth();
        }
        return null;
      }
      const localToken = localStorage.getItem('buser_token');
      if (localToken) return localToken;
      // Fallback ke cookie jika ada
      const match = document.cookie.match(/(?:^|;\s*)buser_token=([^;]*)/);
      return match ? decodeURIComponent(match[1]) : null;
    } catch (e) {
      return null;
    }
  },

  getUser() {
    try {
      if (!this.isSessionValid()) {
        if (localStorage.getItem('buser_user')) {
          this.clearAuth();
        }
        return null;
      }
      const raw = localStorage.getItem('buser_user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  setAuth(token, user, expiresInSeconds) {
    try {
      const now = Date.now();
      const lifetimeMs = (typeof expiresInSeconds === 'number' && expiresInSeconds > 0)
        ? expiresInSeconds * 1000
        : this.SESSION_CONFIG.MAX_LIFETIME_MS;
      const expiresAt = now + lifetimeMs;

      if (token) {
        localStorage.setItem('buser_token', token);
        localStorage.setItem('buser_session_created', now.toString());
        localStorage.setItem('buser_session_expires', expiresAt.toString());
        localStorage.setItem('buser_last_activity', now.toString());

        // Cookie sesi dengan batas waktu (bukan persisten 30 hari)
        const cookieMaxAge = Math.floor(lifetimeMs / 1000);
        document.cookie = `buser_token=${encodeURIComponent(token)}; path=/; max-age=${cookieMaxAge}; SameSite=Lax`;
      }
      if (user) localStorage.setItem('buser_user', JSON.stringify(user));
    } catch (e) {}
  },

  clearAuth() {
    try {
      localStorage.removeItem('buser_token');
      localStorage.removeItem('buser_user');
      localStorage.removeItem('buser_session_created');
      localStorage.removeItem('buser_session_expires');
      localStorage.removeItem('buser_last_activity');
      document.cookie = 'buser_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    } catch (e) {}
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  getAuthHeaders(extra = {}) {
    const headers = { ...extra };
    const token = this.getToken();
    if (token) {
      this.recordActivity(); // Rekam aktivitas aktif
      headers['Authorization'] = `Bearer ${token}`;
      headers['X-Authorization'] = `Bearer ${token}`;
      headers['X-Token'] = token;
    }
    return headers;
  },

  // Helper untuk intercept response 401 pada admin panel
  handleUnauthorized(status) {
    if (status === 401) {
      const path = window.location.pathname;
      if (path.includes('/admin/') && !path.includes('login.html')) {
        this.clearAuth();
        window.location.replace('login.html?expired=1');
      }
    }
  },

  // --- Autentikasi Endpoints ---
  async login(email, password) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth.php?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        this.setAuth(json.data.token, json.data.user, json.data.expires_in);
      }
      return json;
    } catch (err) {
      console.warn('[BuserInfoAPI] Gagal login:', err);
      return { status: 'error', message: err.message || 'Gagal terhubung ke server autentikasi' };
    }
  },

  async logout() {
    try {
      await fetch(`${API_BASE_URL}/auth.php?action=logout`, {
        method: 'GET',
        credentials: 'include',
        headers: this.getAuthHeaders()
      });
    } catch (e) {
      // Abaikan jika network error saat logout
    } finally {
      this.clearAuth();
      if (window.location.pathname.includes('/admin/')) {
        window.location.replace('login.html');
      }
    }
  },

  async me() {
    try {
      const token = this.getToken();
      if (!token) return null;

      const res = await fetch(`${API_BASE_URL}/auth.php?action=me`, {
        method: 'GET',
        credentials: 'include',
        headers: this.getAuthHeaders()
      });

      if (res.status === 401) {
        this.clearAuth();
        this.handleUnauthorized(401);
        return null;
      }

      let json = null;
      try {
        json = await res.json();
      } catch (parseErr) {
        console.warn('[BuserInfoAPI] Response me() bukan JSON valid:', parseErr);
        // Tetap gunakan profil lokal jika server mengembalikan output tidak standar
        return this.getUser();
      }

      if (json && json.status === 'success' && json.data) {
        const currentUser = this.getUser() || {};
        const updated = { ...currentUser, ...json.data };
        this.setAuth(token, updated);
        return updated;
      } else if (json && json.status === 'error' && (json.message || '').toLowerCase().includes('terautentikasi')) {
        this.clearAuth();
        this.handleUnauthorized(401);
        return null;
      }

      return this.getUser();
    } catch (err) {
      console.warn('[BuserInfoAPI] Gagal verifikasi sesi:', err);
      // Jangan langsung menghapus sesi jika hanya gangguan jaringan sementara
      return this.getUser();
    }
  },

  // --- Kategori Endpoints ---
  // Ambil daftar kategori
  async getCategories() {
    try {
      const res = await fetch(`${API_BASE_URL}/kategori.php`, {
        credentials: 'include'
      });
      const json = await res.json();
      return json.status === 'success' ? json.data : [];
    } catch (err) {
      console.warn('[BuserInfoAPI] Gagal memuat kategori:', err);
      return [];
    }
  },

  // Tambah kategori baru
  async createCategory(data) {
    try {
      const res = await fetch(`${API_BASE_URL}/kategori.php`, {
        method: 'POST',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify(data)
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  // Update kategori
  async updateCategory(id, data) {
    try {
      const res = await fetch(`${API_BASE_URL}/kategori.php?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({ id_kategori: id, ...data })
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  // Hapus kategori
  async deleteCategory(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/kategori.php?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        credentials: 'include'
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  // --- Berita Endpoints ---
  // Ambil daftar berita dengan parameter (kategori, status, limit, search, page)
  async getArticles(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE_URL}/artikel.php?${query}`, {
        credentials: 'include',
        headers: this.getAuthHeaders()
      });
      const json = await res.json();
      return json.status === 'success' ? json.data : { articles: [], pagination: {} };
    } catch (err) {
      console.warn('[BuserInfoAPI] Gagal memuat artikel:', err);
      return { articles: [], pagination: {} };
    }
  },

  // Ambil detail berita berdasarkan slug
  async getArticleBySlug(slug) {
    try {
      const res = await fetch(`${API_BASE_URL}/artikel.php?slug=${encodeURIComponent(slug)}`, {
        credentials: 'include'
      });
      const json = await res.json();
      return json.status === 'success' ? json.data : null;
    } catch (err) {
      console.warn('[BuserInfoAPI] Gagal memuat detail artikel:', err);
      return null;
    }
  },

  // Ambil detail berita berdasarkan ID (Admin Edit)
  async getArticleById(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/artikel.php?id=${encodeURIComponent(id)}`, {
        credentials: 'include',
        headers: this.getAuthHeaders()
      });
      const json = await res.json();
      return json.status === 'success' ? json.data : null;
    } catch (err) {
      console.warn('[BuserInfoAPI] Gagal memuat detail artikel by ID:', err);
      return null;
    }
  },

  // Upload Gambar Thumbnail Berita (Admin)
  async uploadThumbnail(file) {
    try {
      const formData = new FormData();
      formData.append('thumbnail', file);
      const res = await fetch(`${API_BASE_URL}/upload.php`, {
        method: 'POST',
        credentials: 'include',
        headers: this.getAuthHeaders(),
        body: formData
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  // Simpan artikel baru (Admin)
  async createArticle(data) {
    try {
      const res = await fetch(`${API_BASE_URL}/artikel.php`, {
        method: 'POST',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify(data)
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  // Update artikel (Admin)
  async updateArticle(id, data) {
    try {
      const res = await fetch(`${API_BASE_URL}/artikel.php?id=${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify(data)
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  // Hapus artikel (Admin)
  async deleteArticle(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/artikel.php?id=${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        credentials: 'include'
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  // Ambil data statistik dashboard (counts, chart, kategori, artikel terbaru)
  async getDashboardStats() {
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard.php`, {
        credentials: 'include',
        headers: this.getAuthHeaders()
      });
      this.handleUnauthorized(res.status);
      const json = await res.json();
      return json.status === 'success' ? json.data : null;
    } catch (err) {
      console.warn('[BuserInfoAPI] Gagal memuat data dashboard:', err);
      return null;
    }
  },

  // Helper Ekstraksi YouTube ID
  extractYouTubeId(url) {
    if (!url) return null;
    const cleanUrl = url.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) return cleanUrl;
    const match = cleanUrl.match(/(?:youtube(?:-nocookie)?\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i);
    return match ? match[1] : null;
  },

  // Ambil daftar video YouTube
  async getVideos(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE_URL}/video.php${query ? '?' + query : ''}`, {
        credentials: 'include'
      });
      const json = await res.json();
      return json.status === 'success' ? json.data : { videos: [], total: 0 };
    } catch (err) {
      console.warn('[BuserInfoAPI] Gagal memuat video:', err);
      return { videos: [], total: 0 };
    }
  },

  // Ambil detail satu video berdasarkan ID
  async getVideoById(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/video.php?id=${encodeURIComponent(id)}`, {
        credentials: 'include'
      });
      const json = await res.json();
      return json.status === 'success' ? json.data : null;
    } catch (err) {
      console.warn('[BuserInfoAPI] Gagal memuat detail video:', err);
      return null;
    }
  },

  // Simpan video YouTube baru (Admin)
  async createVideo(data) {
    try {
      const res = await fetch(`${API_BASE_URL}/video.php`, {
        method: 'POST',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify(data)
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  // Update video YouTube (Admin)
  async updateVideo(id, data) {
    try {
      const res = await fetch(`${API_BASE_URL}/video.php?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({ id_video: id, ...data })
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  // Hapus video YouTube (Admin)
  async deleteVideo(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/video.php?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        credentials: 'include'
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  // --- Komentar Endpoints ---
  // Ambil komentar pembaca (publik per artikel atau komprehensif admin)
  async getComments(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE_URL}/komentar.php?${query}`, {
        credentials: 'include',
        headers: this.getAuthHeaders()
      });
      const json = await res.json();
      return json.status === 'success' ? json.data : { comments: [], counts: {} };
    } catch (err) {
      console.warn('[BuserInfoAPI] Gagal memuat komentar:', err);
      return { comments: [], counts: {} };
    }
  },

  // Ambil counter / statistik komentar (ringkas & cepat untuk badge sidebar)
  async getCommentStats() {
    try {
      const res = await fetch(`${API_BASE_URL}/komentar.php?action=stats`, {
        credentials: 'include',
        headers: this.getAuthHeaders()
      });
      const json = await res.json();
      return json.status === 'success' ? json.data : { all: 0, pending: 0, approved: 0, rejected: 0, spam: 0 };
    } catch (err) {
      return { all: 0, pending: 0, approved: 0, rejected: 0, spam: 0 };
    }
  },

  // Kirim komentar pembaca baru (Publik / Guest)
  async submitComment(data) {
    try {
      const res = await fetch(`${API_BASE_URL}/komentar.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  // Update status moderasi komentar (Admin: approved, rejected, spam, pending)
  async updateCommentStatus(id, status) {
    try {
      const res = await fetch(`${API_BASE_URL}/komentar.php?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({ status })
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  // Hapus komentar permanen (Admin)
  async deleteComment(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/komentar.php?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        credentials: 'include'
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  // --- Penulis (Wartawan & Redaktur) Endpoints ---
  // Ambil daftar seluruh penulis beserta jumlah artikel
  async getAuthors(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE_URL}/penulis.php${query ? '?' + query : ''}`, {
        credentials: 'include',
        headers: this.getAuthHeaders()
      });
      this.handleUnauthorized(res.status);
      const json = await res.json();
      return json.status === 'success' ? json.data : [];
    } catch (err) {
      console.warn('[BuserInfoAPI] Gagal memuat penulis:', err);
      return [];
    }
  },

  // Ambil detail satu penulis berdasarkan ID
  async getAuthorById(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/penulis.php?id=${encodeURIComponent(id)}`, {
        credentials: 'include',
        headers: this.getAuthHeaders()
      });
      this.handleUnauthorized(res.status);
      const json = await res.json();
      return json.status === 'success' ? json.data : null;
    } catch (err) {
      console.warn('[BuserInfoAPI] Gagal memuat detail penulis:', err);
      return null;
    }
  },

  // Tambah penulis baru
  async createAuthor(data) {
    try {
      const res = await fetch(`${API_BASE_URL}/penulis.php`, {
        method: 'POST',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify(data)
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  // Perbarui data penulis
  async updateAuthor(id, data) {
    try {
      const res = await fetch(`${API_BASE_URL}/penulis.php?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify(data)
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  // Toggle status aktif/nonaktif penulis
  async toggleAuthorStatus(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/penulis.php?id=${encodeURIComponent(id)}&action=toggle_status`, {
        method: 'PUT',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include'
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  // Hapus penulis permanen
  async deleteAuthor(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/penulis.php?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        credentials: 'include'
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  // --- Pengguna CMS (Users) Endpoints ---
  // Ambil daftar seluruh akun pengguna
  async getUsers(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE_URL}/pengguna.php${query ? '?' + query : ''}`, {
        credentials: 'include',
        headers: this.getAuthHeaders()
      });
      this.handleUnauthorized(res.status);
      const json = await res.json();
      return json.status === 'success' ? json.data : [];
    } catch (err) {
      console.warn('[BuserInfoAPI] Gagal memuat pengguna:', err);
      return [];
    }
  },

  // Ambil detail satu pengguna
  async getUserById(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/pengguna.php?id=${encodeURIComponent(id)}`, {
        credentials: 'include',
        headers: this.getAuthHeaders()
      });
      this.handleUnauthorized(res.status);
      const json = await res.json();
      return json.status === 'success' ? json.data : null;
    } catch (err) {
      console.warn('[BuserInfoAPI] Gagal memuat detail pengguna:', err);
      return null;
    }
  },

  // Tambah pengguna CMS baru
  async createUser(data) {
    try {
      const res = await fetch(`${API_BASE_URL}/pengguna.php`, {
        method: 'POST',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify(data)
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  // Update profil/role pengguna
  async updateUser(id, data) {
    try {
      const res = await fetch(`${API_BASE_URL}/pengguna.php?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify(data)
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  // Ubah hak akses / peran (role) pengguna
  async changeUserRole(id, role) {
    try {
      const res = await fetch(`${API_BASE_URL}/pengguna.php?id=${encodeURIComponent(id)}&action=change_role`, {
        method: 'PUT',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({ role })
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  // Toggle status aktif/nonaktif akun pengguna
  async toggleUserStatus(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/pengguna.php?id=${encodeURIComponent(id)}&action=toggle_status`, {
        method: 'PUT',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include'
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  // Hapus akun pengguna CMS
  async deleteUser(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/pengguna.php?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        credentials: 'include'
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  // --- Profil & Susunan Redaksi Endpoints ---
  // Ambil daftar profil redaksi (dengan opsional search, kategori, status)
  async getRedaksi(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE_URL}/redaksi.php${query ? '?' + query : ''}`, {
        credentials: 'include',
        headers: this.getAuthHeaders()
      });
      this.handleUnauthorized(res.status);
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        // Cache data redaksi aktif untuk tampilan cepat & fallback offline di client
        if (!params.status || params.status === 'active') {
          try {
            const listToCache = (json.data.profiles || []).filter(p => (p.status || 'active').toLowerCase() === 'active');
            localStorage.setItem('buser_redaksi_cache', JSON.stringify(listToCache));
          } catch (e) {}
        }
        return json.data;
      }
      return { profiles: [], total: 0, stats: {} };
    } catch (err) {
      console.warn('[BuserInfoAPI] Gagal memuat profil redaksi:', err);
      // Fallback ke cache lokal jika server/jaringan offline
      try {
        const cached = localStorage.getItem('buser_redaksi_cache');
        if (cached) {
          const profiles = JSON.parse(cached);
          return { profiles, total: profiles.length, stats: {} };
        }
      } catch (e) {}
      return { profiles: [], total: 0, stats: {} };
    }
  },

  // Ambil detail satu anggota profil redaksi
  async getRedaksiById(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/redaksi.php?id=${encodeURIComponent(id)}`, {
        credentials: 'include',
        headers: this.getAuthHeaders()
      });
      this.handleUnauthorized(res.status);
      const json = await res.json();
      return json.status === 'success' ? json.data : null;
    } catch (err) {
      console.warn('[BuserInfoAPI] Gagal memuat detail profil redaksi:', err);
      return null;
    }
  },

  // Tambah anggota profil redaksi baru
  async createRedaksi(data) {
    try {
      const res = await fetch(`${API_BASE_URL}/redaksi.php`, {
        method: 'POST',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify(data)
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  // Perbarui data anggota profil redaksi
  async updateRedaksi(id, data) {
    try {
      const res = await fetch(`${API_BASE_URL}/redaksi.php?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify(data)
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  // Toggle status aktif/nonaktif anggota profil redaksi
  async toggleRedaksiStatus(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/redaksi.php?id=${encodeURIComponent(id)}&action=toggle_status`, {
        method: 'PUT',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include'
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  // Hapus anggota profil redaksi
  async deleteRedaksi(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/redaksi.php?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        credentials: 'include'
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  // Upload foto anggota redaksi
  async uploadRedaksiFoto(file) {
    try {
      const formData = new FormData();
      formData.append('foto', file);
      const res = await fetch(`${API_BASE_URL}/redaksi.php?action=upload_foto`, {
        method: 'POST',
        credentials: 'include',
        headers: this.getAuthHeaders(),
        body: formData
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  // Ambil kategori profil redaksi yang tersedia
  async getRedaksiCategories() {
    try {
      const res = await fetch(`${API_BASE_URL}/redaksi.php?action=categories`, {
        credentials: 'include'
      });
      const json = await res.json();
      return json.status === 'success' ? json.data : [];
    } catch (err) {
      return [];
    }
  },

  // Reset susunan profil redaksi ke 9 profil standar bawaan
  async resetRedaksiDefaults() {
    try {
      const res = await fetch(`${API_BASE_URL}/redaksi.php?action=reset_defaults`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        credentials: 'include'
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  // Update profil pribadi redaksi yang sedang login
  async updateMyProfile(data) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth.php?action=update_profile`, {
        method: 'POST',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify(data)
      });
      this.handleUnauthorized(res.status);
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        const currentUser = this.getUser() || {};
        this.setAuth(this.getToken(), { ...currentUser, ...json.data });
      }
      return json;
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  // Ubah kata sandi akun redaksi yang sedang login
  async updateMyPassword(data) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth.php?action=update_password`, {
        method: 'POST',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify(data)
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  // Unggah foto profil avatar untuk akun yang sedang login
  async uploadMyAvatar(file) {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch(`${API_BASE_URL}/auth.php?action=upload_avatar`, {
        method: 'POST',
        credentials: 'include',
        headers: this.getAuthHeaders(),
        body: formData
      });
      this.handleUnauthorized(res.status);
      const json = await res.json();
      if (json && json.status === 'success' && json.data && json.data.user) {
        const currentUser = this.getUser() || {};
        this.setAuth(this.getToken(), { ...currentUser, ...json.data.user });
      }
      return json;
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  // Hapus/reset foto profil avatar akun yang sedang login
  async deleteMyAvatar() {
    try {
      const res = await fetch(`${API_BASE_URL}/auth.php?action=delete_avatar`, {
        method: 'POST',
        credentials: 'include',
        headers: this.getAuthHeaders()
      });
      this.handleUnauthorized(res.status);
      const json = await res.json();
      if (json && json.status === 'success' && json.data && json.data.user) {
        const currentUser = this.getUser() || {};
        this.setAuth(this.getToken(), { ...currentUser, ...json.data.user });
      }
      return json;
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  // ==========================================
  // PENGATURAN PORTAL & KONFIGURASI SISTEM
  // ==========================================

  // Ambil seluruh konfigurasi portal, penulis, dan kategori
  async getSettings() {
    try {
      const res = await fetch(`${API_BASE_URL}/pengaturan.php`, {
        method: 'GET',
        credentials: 'include',
        headers: this.getAuthHeaders()
      });
      const json = await res.json();
      return json;
    } catch (err) {
      console.warn('[BuserInfoAPI] Gagal mengambil pengaturan:', err);
      return { status: 'error', message: err.message || 'Gagal terhubung ke server pengaturan' };
    }
  },

  // Simpan/perbarui seluruh konfigurasi portal (bulk save)
  async saveSettings(settingsData) {
    try {
      const res = await fetch(`${API_BASE_URL}/pengaturan.php`, {
        method: 'POST',
        credentials: 'include',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(settingsData)
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message || 'Gagal menyimpan pengaturan' };
    }
  },

  // Unggah file logo utama portal
  async uploadSiteLogo(file) {
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const res = await fetch(`${API_BASE_URL}/pengaturan.php?action=upload_logo`, {
        method: 'POST',
        credentials: 'include',
        headers: this.getAuthHeaders(),
        body: formData
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message || 'Gagal mengunggah file logo' };
    }
  },

  // Tambah item baru ke daftar pengaturan (Media Sosial, Kontak Layanan, Kata Sensor, SEO Tag, Aturan IP)
  async addSettingItem(key, itemData) {
    try {
      const res = await fetch(`${API_BASE_URL}/pengaturan.php?action=add_item&key=${encodeURIComponent(key)}`, {
        method: 'POST',
        credentials: 'include',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(itemData)
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message || 'Gagal menambahkan data baru' };
    }
  },

  // Perbarui item dalam daftar pengaturan
  async updateSettingItem(key, id, itemData) {
    try {
      const payload = { ...itemData, id };
      const res = await fetch(`${API_BASE_URL}/pengaturan.php?action=update_item&key=${encodeURIComponent(key)}`, {
        method: 'PUT',
        credentials: 'include',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload)
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message || 'Gagal memperbarui data' };
    }
  },

  // Hapus item dari daftar pengaturan
  async deleteSettingItem(key, id) {
    try {
      const res = await fetch(`${API_BASE_URL}/pengaturan.php?action=delete_item&key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ id })
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message || 'Gagal menghapus data' };
    }
  },

  // Pulihkan konfigurasi ke nilai standar bawaan
  async resetSettingsDefaults() {
    try {
      const res = await fetch(`${API_BASE_URL}/pengaturan.php?action=reset_defaults`, {
        method: 'POST',
        credentials: 'include',
        headers: this.getAuthHeaders()
      });
      this.handleUnauthorized(res.status);
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message || 'Gagal mereset pengaturan' };
    }
  }
};

window.BuserInfoAPI = BuserInfoAPI;



