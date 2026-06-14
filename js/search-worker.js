'use strict';

let books = [];

function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let r0 = Array(b.length + 1)
    .fill(0)
    .map((_, i) => i);
  let r1 = Array(b.length + 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    r1[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      r1[j + 1] = Math.min(r1[j] + 1, r0[j + 1] + 1, r0[j] + cost);
    }
    r0 = [...r1];
  }
  return r0[b.length];
}

function fuzzyMatch(words, query) {
  if (!query) return true;
  const qWords = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!qWords.length) return true;

  const wArr = Array.isArray(words) ? words : [];
  return qWords.every((qw) => {
    return wArr.some((tw) => {
      if (tw.startsWith(qw) || tw.includes(qw)) return true;
      const maxDist = qw.length <= 4 ? 1 : 2;
      if (Math.abs(qw.length - tw.length) > maxDist) return false;
      const dist = levenshtein(qw, tw);
      return dist <= maxDist;
    });
  });
}

function getRelevanceScore(b, query) {
  if (!query) return 0;
  const q = query.toLowerCase().trim();
  let score = 0;
  const title = b.title.toLowerCase();

  // b._authorDisplay is already precomputed and passed in the book data
  const author = (b._authorDisplay || '').toLowerCase();
  const cat = b.category.toLowerCase();
  const blurb = (b.blurb || '').toLowerCase();

  if (title === q) score += 30;
  else if (title.startsWith(q)) score += 20;
  else if (title.includes(q)) score += 10;

  if (author.includes(q)) score += 8;
  if (cat.includes(q)) score += 5;
  if (blurb.includes(q)) score += 2;

  const qWords = q.split(/\s+/).filter(Boolean);
  qWords.forEach((qw) => {
    if (title.includes(qw)) score += 5;
    if (author.includes(qw)) score += 3;
    if (blurb.includes(qw)) score += 1;
  });
  return score;
}

self.onmessage = function (e) {
  const data = e.data;
  if (data.type === 'init') {
    books = data.books;
  } else if (data.type === 'search') {
    const { query, yearFilter, minPrice, maxPrice, genres, sortVal } = data;
    const q = query.toLowerCase().trim();
    const showAll = genres.includes('All') || genres.length === 0;

    const filtered = books
      .map((b) => {
        const score = q ? getRelevanceScore(b, q) : 0;
        return { ...b, _score: score };
      })
      .filter((b) => {
        const mY = yearFilter === 'All' || b.year.toString() === yearFilter;
        const mPrice =
          Number(b.price) >= minPrice && Number(b.price) <= maxPrice;
        const mGenre = showAll || genres.includes(b.category);
        const mQ = !q || b._score > 0 || fuzzyMatch(b._searchWords || [], q);
        return mY && mPrice && mGenre && mQ;
      });

    filtered.sort((a, b) => {
      if (q) {
        const diff = b._score - a._score;
        if (diff !== 0) return diff;
      }
      if (sortVal === 'price-asc') return a.price - b.price;
      if (sortVal === 'price-desc') return b.price - a.price;
      if (sortVal === 'title-asc') return a.title.localeCompare(b.title);
      return b.year - a.year; // newest
    });

    self.postMessage({ type: 'results', books: filtered });
  }
};
