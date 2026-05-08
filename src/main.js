const WATCH_ALIASES = ['Video Browsing History', 'Watch History', 'Video Browsing', 'WatchHistory'];
const SEARCH_ALIASES = ['Search History', 'SearchHistory'];
const URL_RE = /(https?:\/\/[^\s"'<>]+)/gi;
const SAMPLE_DATA = `Video Browsing History\nDate: 2026-05-08 09:10:00\nLink: https://www.tiktok.com/@tiktok/video/7320000000000000000\n\nSearch History\nDate: 2026-05-08 10:15:00\nSearch Term: resep ayam crispy\nDate: 2026-05-08 11:25:00\nSearch Term: belajar coding pemula`;

const state = {
  items: [],
  activeTab: 'all',
  query: '',
  sort: 'newest',
  error: '',
  notice: '',
  fileName: '',
  preview: null,
  dragging: false,
  pasteOpen: false,
  pasteText: '',
};

const app = document.getElementById('app');

const icons = {
  upload: icon('path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"'),
  shield: icon('path d="M20 13c0 5-3.5 7.5-7.7 8.9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.6a1.3 1.3 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"'),
  chart: icon('line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"'),
  json: icon('path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M10 12a2 2 0 0 0-2 2v1a2 2 0 0 1-2 2 2 2 0 0 1 2 2v1a2 2 0 0 0 2 2"/><path d="M14 12a2 2 0 0 1 2 2v1a2 2 0 0 0 2 2 2 2 0 0 0-2 2v1a2 2 0 0 1-2 2"'),
  text: icon('path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"'),
  alert: icon('circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"'),
  search: icon('circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"'),
  history: icon('path d="M3 12a9 9 0 1 0 9-9 9.8 9.8 0 0 0-6.7 2.6L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"'),
  play: icon('circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"'),
  link: icon('path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20l1.1-1.1"'),
  external: icon('path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"'),
  download: icon('path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"'),
  close: icon('path d="M18 6 6 18"/><path d="m6 6 12 12"'),
  trash: icon('path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"'),
  clipboard: icon('rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"'),
};

function icon(content) {
  return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${content}</svg>`;
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}

function normalizeDate(value) {
  if (!value) return '';
  const text = String(value).trim();
  const normalized = text.replace(/ UTC$/i, 'Z').replace(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})$/, '$1T$2');
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? text : date.toISOString();
}

function humanDate(value) {
  if (!value) return 'Tanggal tidak tersedia';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function shortUrl(value) {
  try {
    const url = new URL(value);
    return `${url.hostname}${url.pathname}`.replace(/\/$/, '');
  } catch {
    return value;
  }
}

const cleanUrl = (url) => String(url || '').replace(/[),.;]+$/g, '').trim();
const searchToUrl = (term) => `https://www.tiktok.com/search?q=${encodeURIComponent(term)}`;

function findObjectValue(obj, aliases) {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const alias of aliases) if (Object.prototype.hasOwnProperty.call(obj, alias)) return obj[alias];
  for (const [key, value] of Object.entries(obj)) {
    if (aliases.some((alias) => key.toLowerCase().includes(alias.toLowerCase()))) return value;
  }
  return undefined;
}

function deepCollect(node, predicate, results = []) {
  if (!node || typeof node !== 'object') return results;
  if (Array.isArray(node)) {
    node.forEach((item) => deepCollect(item, predicate, results));
    return results;
  }
  if (predicate(node)) results.push(node);
  Object.values(node).forEach((value) => deepCollect(value, predicate, results));
  return results;
}

function asArrayFromSection(section, preferredKeys) {
  if (!section) return [];
  if (Array.isArray(section)) return section;
  for (const key of preferredKeys) if (Array.isArray(section[key])) return section[key];
  return deepCollect(section, (item) => preferredKeys.some((key) => Array.isArray(item[key])))
    .flatMap((item) => preferredKeys.flatMap((key) => (Array.isArray(item[key]) ? item[key] : [])));
}

function readAny(item, keys) {
  for (const key of keys) {
    if (item && item[key] !== undefined && item[key] !== null && String(item[key]).trim() !== '') return item[key];
  }
  return '';
}

function parseJson(text) {
  const data = JSON.parse(text);
  const activity = findObjectValue(data, ['Activity']) || data;
  const watchSection = findObjectValue(activity, WATCH_ALIASES) || findObjectValue(data, WATCH_ALIASES);
  const searchSection = findObjectValue(activity, SEARCH_ALIASES) || findObjectValue(data, SEARCH_ALIASES);
  const watchCandidates = asArrayFromSection(watchSection, ['VideoList', 'Videos', 'ItemList', 'List']);
  const searchCandidates = asArrayFromSection(searchSection, ['SearchList', 'Searches', 'ItemList', 'List']);
  const fallbackWatch = deepCollect(data, (item) => Boolean(readAny(item, ['Link', 'link', 'Url', 'url', 'VideoLink', 'videoLink'])));
  const fallbackSearch = deepCollect(data, (item) => Boolean(readAny(item, ['SearchTerm', 'searchTerm', 'Search Term', 'Keyword', 'keyword', 'Query', 'query'])));

  const watchItems = (watchCandidates.length ? watchCandidates : fallbackWatch)
    .map((item, index) => {
      const link = cleanUrl(readAny(item, ['Link', 'link', 'Url', 'url', 'VideoLink', 'videoLink']));
      if (!link) return null;
      return {
        id: `watch-${index}-${link}`,
        type: 'watch',
        title: readAny(item, ['Title', 'title', 'Desc', 'desc', 'Description', 'description']) || 'Video TikTok',
        date: normalizeDate(readAny(item, ['Date', 'date', 'Time', 'time', 'Timestamp', 'timestamp'])),
        url: link,
        raw: item,
      };
    })
    .filter(Boolean);

  const searchItems = (searchCandidates.length ? searchCandidates : fallbackSearch)
    .map((item, index) => {
      const term = String(readAny(item, ['SearchTerm', 'searchTerm', 'Search Term', 'Keyword', 'keyword', 'Query', 'query'])).trim();
      if (!term) return null;
      return {
        id: `search-${index}-${term}`,
        type: 'search',
        title: term,
        date: normalizeDate(readAny(item, ['Date', 'date', 'Time', 'time', 'Timestamp', 'timestamp'])),
        url: searchToUrl(term),
        raw: item,
      };
    })
    .filter(Boolean);

  return [...watchItems, ...searchItems];
}

function parseText(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const items = [];
  let section = '';
  let current = {};

  const flush = () => {
    const link = cleanUrl(current.Link || current.URL || current.Url || current.link || '');
    const term = current.SearchTerm || current['Search Term'] || current.Keyword || current.Query || current.search || '';
    if (link) items.push({ id: `watch-${items.length}-${link}`, type: 'watch', title: current.Title || 'Video TikTok', date: normalizeDate(current.Date || current.Time || current.Timestamp), url: link, raw: { ...current } });
    else if (term) items.push({ id: `search-${items.length}-${term}`, type: 'search', title: String(term).trim(), date: normalizeDate(current.Date || current.Time || current.Timestamp), url: searchToUrl(term), raw: { ...current } });
    current = {};
  };

  for (const line of lines) {
    if (/watch|video browsing|browsing history/i.test(line) && !line.includes(':')) section = 'watch';
    if (/search history/i.test(line) && !line.includes(':')) section = 'search';

    const pair = line.match(/^([^:]+):\s*(.*)$/);
    if (pair) {
      const key = pair[1].trim();
      const value = pair[2].trim();
      if (/^(date|time|timestamp)$/i.test(key) && Object.keys(current).some((k) => /^(date|time|timestamp|link|url|search|keyword|query)/i.test(k))) flush();
      const normalizedKey = key.replace(/\s+/g, ' ');
      current[normalizedKey] = value;
      if (/search\s*term|keyword|query/i.test(normalizedKey)) current.SearchTerm = value;
      if (/^(link|url)$/i.test(normalizedKey)) current.Link = value;
      continue;
    }

    const urls = line.match(URL_RE) || [];
    if (urls.length) {
      if (Object.keys(current).length) flush();
      urls.forEach((url) => items.push({ id: `watch-${items.length}-${url}`, type: 'watch', title: 'Video TikTok', date: '', url: cleanUrl(url), raw: { sourceLine: line } }));
    } else if (section === 'search' && line.length > 1 && !/^-+$/.test(line)) {
      items.push({ id: `search-${items.length}-${line}`, type: 'search', title: line, date: '', url: searchToUrl(line), raw: { sourceLine: line } });
    }
  }
  flush();
  return items;
}

function parseFileContent(text, fileName = '') {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (fileName.toLowerCase().endsWith('.json') || trimmed.startsWith('{') || trimmed.startsWith('[')) return parseJson(trimmed);
  return parseText(trimmed);
}

function uniqueItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.type}|${item.date}|${item.title}|${item.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map((item, index) => ({ ...item, id: `${item.type}-${index}-${stableHash(item.url + item.title)}` }));
}

function stableHash(value) {
  let hash = 0;
  for (const char of String(value)) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  return Math.abs(hash).toString(36);
}

function getStats() {
  const datedItems = state.items.filter((item) => item.date && !Number.isNaN(new Date(item.date).getTime()));
  const latest = datedItems.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  return {
    all: state.items.length,
    watch: state.items.filter((item) => item.type === 'watch').length,
    search: state.items.filter((item) => item.type === 'search').length,
    latest: latest ? humanDate(latest.date) : 'Belum ada',
  };
}

function getVisibleItems() {
  const q = state.query.toLowerCase();
  return [...state.items]
    .filter((item) => state.activeTab === 'all' || item.type === state.activeTab)
    .filter((item) => !q || `${item.title} ${item.url} ${item.date} ${item.source || ''}`.toLowerCase().includes(q))
    .sort((a, b) => {
      if (state.sort === 'oldest') return new Date(a.date || 0) - new Date(b.date || 0);
      if (state.sort === 'type') return a.type.localeCompare(b.type) || (new Date(b.date || 0) - new Date(a.date || 0));
      if (state.sort === 'title') return a.title.localeCompare(b.title);
      return new Date(b.date || 0) - new Date(a.date || 0);
    });
}

function setItems(items, sourceLabel) {
  const cleaned = uniqueItems(items.map((item) => ({ ...item, source: item.source || sourceLabel })));
  state.items = cleaned;
  state.notice = cleaned.length ? `${cleaned.length.toLocaleString('id-ID')} item berhasil dimuat.` : '';
  if (!cleaned.length) state.error = 'Data terbaca, tapi tidak ditemukan watch history atau search history. Coba upload file Activity/History dari export TikTok.';
}

async function handleFiles(files) {
  state.error = '';
  state.notice = '';
  const selected = Array.from(files || []).filter((file) => /\.(json|txt)$/i.test(file.name));
  if (!selected.length) {
    state.error = 'Pilih file .json atau .txt dari arsip data TikTok.';
    render();
    return;
  }
  try {
    const parsed = [];
    for (const file of selected) parsed.push(...parseFileContent(await file.text(), file.name).map((item) => ({ ...item, source: file.name })));
    state.fileName = selected.map((file) => file.name).join(', ');
    setItems(parsed, state.fileName);
  } catch (err) {
    state.error = `Gagal membaca file: ${err.message}`;
  }
  render();
}

function loadPastedText() {
  state.error = '';
  state.notice = '';
  try {
    setItems(parseFileContent(state.pasteText, 'pasted.txt'), 'Paste manual');
    state.fileName = 'Paste manual';
  } catch (err) {
    state.error = `Gagal membaca teks: ${err.message}`;
  }
  render({ focusPaste: Boolean(state.error) });
}

function loadSample() {
  state.pasteText = SAMPLE_DATA;
  state.fileName = 'Contoh data';
  state.error = '';
  setItems(parseText(SAMPLE_DATA), 'Contoh data');
  render();
}

function clearData() {
  state.items = [];
  state.fileName = '';
  state.error = '';
  state.notice = '';
  state.preview = null;
  render();
}

function csvEscape(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function downloadCsv() {
  const visibleItems = getVisibleItems();
  const rows = [['type', 'date', 'title', 'url', 'source'], ...visibleItems.map((item) => [item.type, item.date, item.title, item.url, item.source || ''])];
  const blob = new Blob([rows.map((row) => row.map(csvEscape).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = 'tiktok-history-filtered.csv';
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

function openPopup(item) {
  const popup = window.open(item.url, 'tiktok-history-preview', 'popup=yes,width=430,height=760');
  if (popup) popup.opener = null;
  else state.error = 'Pop-up diblokir browser. Izinkan pop-up atau gunakan tombol Buka tab.';
}

function renderHistoryCard(item) {
  const isWatch = item.type === 'watch';
  return `<article class="history-card">
    <div class="type-icon ${isWatch ? 'watch' : 'search'}">${isWatch ? icons.play : icons.search}</div>
    <div class="history-card__body">
      <div class="history-card__meta">
        <span>${isWatch ? 'Watch history' : 'Search history'}</span>
        <time>${escapeHtml(humanDate(item.date))}</time>
        ${item.source ? `<span>${escapeHtml(item.source)}</span>` : ''}
      </div>
      <h3>${escapeHtml(item.title)}</h3>
      <a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">${icons.link} ${escapeHtml(shortUrl(item.url))}</a>
    </div>
    <div class="history-card__actions">
      <button class="secondary compact" data-preview="${escapeHtml(item.id)}">Preview</button>
      <button class="primary compact" data-popup="${escapeHtml(item.id)}">Pop-up ${icons.external}</button>
    </div>
  </article>`;
}

function renderModal() {
  if (!state.preview) return '';
  const item = state.preview;
  return `<div class="modal" role="dialog" aria-modal="true" aria-label="Preview link">
    <div class="modal__panel">
      <div class="modal__header">
        <div><span>${item.type === 'watch' ? 'Preview video/link' : 'Preview pencarian'}</span><strong>${escapeHtml(item.title)}</strong></div>
        <button class="icon-button" data-close-modal aria-label="Tutup">${icons.close}</button>
      </div>
      <iframe title="Preview ${escapeHtml(item.title)}" src="${escapeHtml(item.url)}" sandbox="allow-scripts allow-same-origin allow-popups allow-forms"></iframe>
      <div class="modal__footer">
        <p>TikTok kadang memblokir iframe. Kalau kosong, klik “Pop-up / tab baru”.</p>
        <button class="primary compact" data-popup="${escapeHtml(item.id)}">Pop-up ${icons.external}</button>
        <a class="secondary compact" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">Buka tab baru</a>
      </div>
    </div>
  </div>`;
}

function renderUploadPanel() {
  return `<section class="upload-grid">
    <div class="dropzone ${state.dragging ? 'is-dragging' : ''}" data-dropzone>
      <input id="file-input" type="file" accept=".json,.txt,application/json,text/plain" multiple hidden />
      <div class="dropzone__icon">${icons.upload}</div>
      <h2>Upload file TikTok</h2>
      <p>Tarik file ke sini atau klik untuk pilih file JSON/TXT dari export TikTok.</p>
      <div class="filetypes"><span>${icons.json} JSON</span><span>${icons.text} TXT</span></div>
      ${state.fileName ? `<p class="filename">Sumber: ${escapeHtml(state.fileName)}</p>` : ''}
    </div>

    <div class="paste-card">
      <div class="section-title"><span>${icons.clipboard}</span><div><h2>Paste manual</h2><p>Kalau datanya sudah kamu copy, tempel di sini lalu klik parse.</p></div></div>
      <textarea id="paste-input" placeholder="Contoh:\nDate: 2026-05-08 09:10:00\nLink: https://www.tiktok.com/@...\n\nSearch Term: resep ayam" rows="8">${escapeHtml(state.pasteText)}</textarea>
      <div class="paste-actions">
        <button class="primary compact" data-parse-paste>Parse teks</button>
        <button class="secondary compact" data-sample>Isi contoh</button>
        <button class="ghost compact" data-clear ${state.items.length ? '' : 'disabled'}>${icons.trash} Reset</button>
      </div>
    </div>
  </section>`;
}

function renderToolbar(stats, visibleItems) {
  return `<section class="toolbar">
    <div class="tabs" role="tablist" aria-label="Filter history">
      ${[['all', 'Semua', stats.all], ['watch', 'Watch', stats.watch], ['search', 'Search', stats.search]].map(([key, label, count]) => `<button class="${state.activeTab === key ? 'active' : ''}" data-tab="${key}">${label}<span>${count}</span></button>`).join('')}
    </div>
    <label class="searchbox">${icons.search}<input id="query-input" value="${escapeHtml(state.query)}" placeholder="Cari keyword, URL, tanggal, atau nama file..." /></label>
    <select id="sort-select" aria-label="Urutkan data">
      <option value="newest" ${state.sort === 'newest' ? 'selected' : ''}>Terbaru dulu</option>
      <option value="oldest" ${state.sort === 'oldest' ? 'selected' : ''}>Terlama dulu</option>
      <option value="type" ${state.sort === 'type' ? 'selected' : ''}>Kelompokkan tipe</option>
      <option value="title" ${state.sort === 'title' ? 'selected' : ''}>Judul A-Z</option>
    </select>
    <button class="secondary compact" data-download ${visibleItems.length ? '' : 'disabled'}>${icons.download} CSV</button>
  </section>`;
}

function renderResults(visibleItems) {
  if (!state.items.length) {
    return `<div class="empty">${icons.history}<h3>Belum ada data</h3><p>Upload file export TikTok atau paste teks untuk mulai melihat daftar history.</p></div>`;
  }
  if (!visibleItems.length) {
    return `<div class="empty">${icons.search}<h3>Tidak ada hasil</h3><p>Coba ubah kata kunci pencarian, tab filter, atau urutan data.</p></div>`;
  }
  return visibleItems.map(renderHistoryCard).join('');
}

function render(options = {}) {
  const stats = getStats();
  const visibleItems = getVisibleItems();
  app.innerHTML = `<main>
    <section class="hero">
      <div class="hero__content">
        <span class="eyebrow">${icons.shield} 100% lokal di browser</span>
        <h1>Lihat history TikTok tanpa ribet.</h1>
        <p>Upload atau paste data TXT/JSON dari TikTok. Semua parsing berjalan di browser kamu, tampil rapi, bisa dicari, dan siap deploy ke Vercel atau Railway.</p>
        <div class="hero__actions">
          <button class="primary" data-upload>${icons.upload} Upload file</button>
          <button class="secondary" data-sample>Lihat contoh</button>
          <a class="secondary" href="https://support.tiktok.com/id/account-and-privacy/personalized-ads-and-data/requesting-your-data" target="_blank" rel="noreferrer">Cara request data ${icons.external}</a>
        </div>
      </div>
      <div class="hero__side">
        <div class="stat-card"><span>Total</span><strong>${stats.all.toLocaleString('id-ID')}</strong><small>item terbaca</small></div>
        <div class="mini-stats"><div><b>${stats.watch}</b><span>Watch</span></div><div><b>${stats.search}</b><span>Search</span></div></div>
        <p>Terakhir: ${escapeHtml(stats.latest)}</p>
      </div>
    </section>

    ${renderUploadPanel()}
    ${(state.error || state.notice) ? `<section class="message ${state.error ? 'is-error' : 'is-success'}">${state.error ? icons.alert : icons.shield}<span>${escapeHtml(state.error || state.notice)}</span></section>` : ''}
    ${renderToolbar(stats, visibleItems)}

    <section class="results-head">
      <div><h2>Daftar history</h2><p>Menampilkan ${visibleItems.length.toLocaleString('id-ID')} dari ${state.items.length.toLocaleString('id-ID')} item</p></div>
      ${state.items.length ? `<button class="ghost compact" data-clear>${icons.trash} Bersihkan</button>` : ''}
    </section>
    <section class="results" aria-live="polite">${renderResults(visibleItems)}</section>
    ${renderModal()}
  </main>`;

  bindEvents();
  if (options.focusQuery) {
    const queryInput = document.getElementById('query-input');
    queryInput?.focus();
    queryInput?.setSelectionRange(queryInput.value.length, queryInput.value.length);
  }
  if (options.focusPaste) document.getElementById('paste-input')?.focus();
}

function bindEvents() {
  const input = document.getElementById('file-input');
  document.querySelectorAll('[data-upload], [data-dropzone]').forEach((el) => el.addEventListener('click', (event) => {
    if (event.target.closest('a, button, textarea')) return;
    input?.click();
  }));
  document.querySelector('[data-upload]')?.addEventListener('click', () => input?.click());
  input?.addEventListener('change', (event) => handleFiles(event.target.files));

  const dropzone = document.querySelector('[data-dropzone]');
  dropzone?.addEventListener('dragover', (event) => {
    event.preventDefault();
    if (!state.dragging) {
      state.dragging = true;
      render();
    }
  });
  dropzone?.addEventListener('dragleave', () => { state.dragging = false; render(); });
  dropzone?.addEventListener('drop', (event) => { event.preventDefault(); state.dragging = false; handleFiles(event.dataTransfer.files); });

  document.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => { state.activeTab = button.dataset.tab; render(); }));
  document.getElementById('query-input')?.addEventListener('input', (event) => { state.query = event.target.value; render({ focusQuery: true }); });
  document.getElementById('sort-select')?.addEventListener('change', (event) => { state.sort = event.target.value; render(); });
  document.getElementById('paste-input')?.addEventListener('input', (event) => { state.pasteText = event.target.value; });
  document.querySelectorAll('[data-sample]').forEach((button) => button.addEventListener('click', loadSample));
  document.querySelector('[data-parse-paste]')?.addEventListener('click', loadPastedText);
  document.querySelector('[data-download]')?.addEventListener('click', downloadCsv);
  document.querySelectorAll('[data-clear]').forEach((button) => button.addEventListener('click', clearData));
  document.querySelectorAll('[data-preview]').forEach((button) => button.addEventListener('click', () => {
    state.preview = state.items.find((item) => item.id === button.dataset.preview);
    render();
  }));
  document.querySelectorAll('[data-popup]').forEach((button) => button.addEventListener('click', () => {
    const item = state.items.find((historyItem) => historyItem.id === button.dataset.popup);
    if (item) {
      state.error = '';
      openPopup(item);
      if (state.error) render();
    }
  }));
  document.querySelector('[data-close-modal]')?.addEventListener('click', () => { state.preview = null; render(); });
  document.querySelector('.modal')?.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
      state.preview = null;
      render();
    }
  });
}

render();
