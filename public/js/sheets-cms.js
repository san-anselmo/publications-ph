'use strict';

/* ── Google Sheets CSV CMS Module (Network-First & Fallback-to-IndexedDB) ── */
const SheetsCMS = {
  CACHE_TTL: 3600000, // 1 hour

  /* Configure these with your published Google Sheets CSV URLs */
  URLS: {
    books: '',
    authors: '',
    team: '',
    events: '',
  },

  /** Parse CSV text into array of objects. Sanitizes all inputs systematically. */
  parseCSV(csv) {
    const lines = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < csv.length; i++) {
      const ch = csv[i];
      if (inQuote) {
        if (ch === '"' && csv[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') {
          inQuote = false;
        } else {
          cur += ch;
        }
      } else {
        if (ch === '"') {
          inQuote = true;
        } else if (ch === '\n' || (ch === '\r' && csv[i + 1] === '\n')) {
          lines.push(cur);
          cur = '';
          if (ch === '\r') i++;
        } else {
          cur += ch;
        }
      }
    }
    if (cur.trim()) lines.push(cur);
    if (!lines.length) return [];

    const splitRow = (row) => {
      const cols = [];
      let field = '';
      let q = false;
      for (let i = 0; i < row.length; i++) {
        const c = row[i];
        if (q) {
          if (c === '"' && row[i + 1] === '"') {
            field += '"';
            i++;
          } else if (c === '"') {
            q = false;
          } else {
            field += c;
          }
        } else {
          if (c === '"') {
            q = true;
          } else if (c === ',') {
            cols.push(field);
            field = '';
          } else {
            field += c;
          }
        }
      }
      cols.push(field);
      return cols;
    };

    const normalizeHeader = (h) => {
      const clean = h.trim().toLowerCase();
      if (clean === 'isbn/issn') return 'isbn';
      if (clean === 'language') return 'lang';
      if (clean === 'image' || clean === 'cover') return 'img';
      if (clean === 'description') return 'blurb';
      if (clean === 'issuenum' || clean === 'issue number') return 'issueNum';
      return clean;
    };

    const headers = splitRow(lines[0]).map(normalizeHeader);
    const numericFields = new Set(['year', 'price', 'stock', 'issueNum']);
    const standardCategories = [
      'Journal',
      'Poetry',
      'Fiction',
      'Non-Fiction',
      'Biography',
      'Inspirational',
      'Anthology',
      "Children's Literature",
      'General Reference',
    ];

    return lines
      .slice(1)
      .map((line) => {
        const vals = splitRow(line);
        const obj = {};
        headers.forEach((h, i) => {
          // systematically strip leading/trailing spaces and strip HTML tags
          let v = (vals[i] || '').trim();
          if (typeof v === 'string') {
            v = v.replace(/<[a-zA-Z\/][^>]*>/g, '');
          }

          if (h === 'price') {
            let clean = v.replace(/[₱$,\s]/g, '');
            let num = Number(clean);
            // inject a fallback value (250) for missing or invalid prices
            v = isNaN(num) || num <= 0 ? 250 : num;
          } else if (h === 'category') {
            // Enforce lowercase category matching and map to standard capitalization
            const matched = standardCategories.find(
              (c) => c.toLowerCase() === v.toLowerCase()
            );
            v =
              matched ||
              (v
                ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()
                : 'Uncategorized');
          } else if (h === 'year') {
            let num = parseInt(v, 10);
            v = isNaN(num) ? 2026 : num;
          } else if (h === 'stock') {
            if (v === '') {
              v = -1;
            } else {
              let num = parseInt(v, 10);
              v = isNaN(num) ? -1 : num;
            }
          } else if (numericFields.has(h) && v !== '') {
            v = Number(v);
            if (isNaN(v)) v = vals[i].trim();
          }
          obj[h] = v;
        });
        return obj;
      })
      .filter((obj) => Object.values(obj).some((v) => v !== ''));
  },

  DB_NAME: 'sap-cms-db',
  DB_VERSION: 1,

  getDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache');
        }
      };
    });
  },

  async getFromCache(key) {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('cache', 'readonly');
        const store = tx.objectStore('cache');
        const req = store.get(key);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const val = req.result;
          if (!val) {
            resolve(null);
            return;
          }
          if (Date.now() - val.ts > this.CACHE_TTL) {
            resolve(null);
          } else {
            resolve(val.data);
          }
        };
      });
    } catch {
      return null;
    }
  },

  async setCache(key, data) {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('cache', 'readwrite');
        const store = tx.objectStore('cache');
        const req = store.put({ data, ts: Date.now() }, key);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve();
      });
    } catch {
      /* IndexedDB blocked */
    }
  },

  async fetchWithRetry(url, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url);
        if (res.ok) return res;
      } catch (e) {
        // Log retry warnings internally
      }
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
    return null;
  },

  async fetchSheet(key) {
    let url = this.URLS[key];
    if (!url) return null;
    if (window.SAP_CMS_PROXY) {
      url = window.SAP_CMS_PROXY + '?url=' + encodeURIComponent(url);
    }
    try {
      const res = await this.fetchWithRetry(url);
      if (!res || !res.ok) return null;
      const csv = await res.text();
      const data = this.parseCSV(csv);
      if (data.length) {
        await this.setCache(key, data);
        return data;
      }
      return null;
    } catch {
      return null;
    }
  },

  // Dynamic Network-First Strategy with Fallback to IndexedDB
  async getBooks() {
    if (navigator.onLine) {
      const fetched = await this.fetchSheet('books');
      if (fetched && fetched.length) return fetched;
    }
    const cached = await this.getFromCache('books');
    if (cached && cached.length) return cached;

    // Offline / Fetch fail fallback to hardcoded global if present
    return typeof BOOKS !== 'undefined' ? BOOKS : [];
  },

  async getAuthors() {
    if (navigator.onLine) {
      const fetched = await this.fetchSheet('authors');
      if (fetched && fetched.length) return fetched;
    }
    const cached = await this.getFromCache('authors');
    if (cached && cached.length) return cached;
    return typeof AUTHORS !== 'undefined' ? AUTHORS : [];
  },

  async getTeam() {
    if (navigator.onLine) {
      const fetched = await this.fetchSheet('team');
      if (fetched && fetched.length) return fetched;
    }
    const cached = await this.getFromCache('team');
    if (cached && cached.length) return cached;
    return typeof TEAM !== 'undefined' ? TEAM : [];
  },

  async getEvents() {
    if (navigator.onLine) {
      const fetched = await this.fetchSheet('events');
      if (fetched && fetched.length) return fetched;
    }
    const cached = await this.getFromCache('events');
    if (cached && cached.length) return cached;
    return typeof EVENTS !== 'undefined' ? EVENTS : [];
  },
};
