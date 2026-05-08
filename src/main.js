const WATCH_ALIASES = ['Video Browsing History', 'Watch History', 'Video Browsing', 'WatchHistory'];
const SEARCH_ALIASES = ['Search History', 'SearchHistory'];
const URL_RE = /(https?:\/\/[^\s"'<>]+)/gi;

const state = {
  items: [],
  activeTab: 'all',
  query: '',
  sort: 'newest',
  error: '',
  fileName: '',
  preview: null,
  dragging: false,
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
  const date = new Date(text.replace(/ UTC$/i, 'Z'));
  return Number.isNaN(date.getTime()) ? text : date.toISOString();
}

function humanDate(value) {
  if (!value) return 'Tanggal tidak tersedia';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
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

function parseJson(text) {
  const data = JSON.parse(text);
  const activity = findObjectValue(data, ['Activity']) || data;
  const watchSection = findObjectValue(activity, WATCH_ALIASES) || findObjectValue(data, WATCH_ALIASES);
  const searchSection = findObjectValue(activity, SEARCH_ALIASES) || findObjectValue(data, SEARCH_ALIASES);
  const watchCandidates = asArrayFromSection(watchSection, ['VideoList', 'Videos', 'ItemList', 'List']);
  const searchCandidates = asArrayFromSection(searchSection, ['SearchList', 'Searches', 'ItemList', 'List']);
  const fallbackWatch = deepCollect(data, (item) => Boolean(item.Link || item.link || item.Url || item.url));
  const fallbackSearch = deepCollect(data, (item) => Boolean(item.SearchTerm || item.searchTerm || item.Keyword || item.keyword));

  const watchItems = (watchCandidates.length ? watchCandidates : fallbackWatch)
    .map((item, index) => {
      const link = cleanUrl(item.Link || item.link || item.Url || item.url || item.VideoLink || '');
      if (!link) return null;
      return { id: `watch-${index}-${link}`, type: 'watch', title: item.Title || item.title || item.Desc || item.description || 'Video TikTok', date: normalizeDate(item.Date || item.date || item.Time || item.time || item.Timestamp || item.timestamp), url: link, raw: item };
    })
    .filter(Boolean);

  const searchItems = (searchCandidates.length ? searchCandidates : fallbackSearch)
    .map((item, index) => {
      const term = String(item.SearchTerm || item.searchTerm || item.Keyword || item.keyword || item.Query || item.query || '').trim();
      if (!term) return null;
      return { id: `search-${index}-${term}`, type: 'search', title: term, date: normalizeDate(item.Date || item.date || item.Time || item.time || item.Timestamp || item.timestamp), url: searchToUrl(term), raw: item };
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
    if (/watch|video browsing/i.test(line) && !line.includes(':')) section = 'watch';
    if (/search history/i.test(line) && !line.includes(':')) section = 'search';
    const pair = line.match(/^([^:]+):\s*(.*)$/);
    if (pair) {
      const key = pair[1].trim();
      const value = pair[2].trim();
      if (/^(date|time|timestamp)$/i.test(key) && Object.keys(current).some((k) => /^(date|time|timestamp|link|url|search)/i.test(k))) flush();
      const normalizedKey = key.replace(/\s+/g, ' ');
      current[normalizedKey] = value;
      if (/search\s*term|keyword|query/i.test(normalizedKey)) current.SearchTerm = value;
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
  });
}

function getStats() {
  return {
    all: state.items.length,
    watch: state.items.filter((item) => item.type === 'watch').length,
    search: state.items.filter((item) => item.type === 'search').length,
  };
}

function getVisibleItems() {
  const q = state.query.toLowerCase();
  return [...state.items]
    .filter((item) => state.activeTab === 'all' || item.type === state.activeTab)
    .filter((item) => !q || `${item.title} ${item.url} ${item.date}`.toLowerCase().includes(q))
    .sort((a, b) => {
      if (state.sort === 'oldest') return new Date(a.date || 0) - new Date(b.date || 0);
      if (state.sort === 'type') return a.type.localeCompare(b.type) || (new Date(b.date || 0) - new Date(a.date || 0));
      return new Date(b.date || 0) - new Date(a.date || 0);
    });
}

async function handleFiles(files) {
  state.error = '';
  const selected = Array.from(files || []).filter((file) => /\.(json|txt)$/i.test(file.name));
  if (!selected.length) {
    state.error = 'Pilih file .json atau .txt dari arsip data TikTok.';
    render();
    return;
  }
  try {
    const parsed = [];
    for (const file of selected) parsed.push(...parseFileContent(await file.text(), file.name));
    const cleaned = uniqueItems(parsed);
    state.items = cleaned;
    state.fileName = selected.map((file) => file.name).join(', ');
    if (!cleaned.length) state.error = 'File terbaca, tapi tidak ditemukan watch history atau search history. Coba upload file Activity/History dari export TikTok.';
  } catch (err) {
    state.error = `Gagal membaca file: ${err.message}`;
  }
  render();
}

function csvEscape(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function downloadCsv() {
  const visibleItems = getVisibleItems();
  const rows = [['type', 'date', 'title', 'url'], ...visibleItems.map((item) => [item.type, item.date, item.title, item.url])];
  const blob = new Blob([rows.map((row) => row.map(csvEscape).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = 'tiktok-history-filtered.csv';
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

function renderHistoryCard(item) {
  const isWatch = item.type === 'watch';
  return `<article class="history-card">
    <div class="type-icon ${isWatch ? 'watch' : 'search'}">${isWatch ? icons.play : icons.search}</div>
    <div class="history-card__body">
      <div class="history-card__meta"><span>${isWatch ? 'Watch history' : 'Search history'}</span><time>${escapeHtml(humanDate(item.date))}</time></div>
      <h3>${escapeHtml(item.title)}</h3>
      <a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">${icons.link} ${escapeHtml(item.url)}</a>
    </div>
    <div class="history-card__actions">
      <button class="primary compact" data-preview="${escapeHtml(item.id)}">Pop-up preview</button>
      <a class="secondary compact" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">Buka ${icons.external}</a>
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
        <p>Jika TikTok memblokir embed di iframe, gunakan tombol “Buka tab baru”.</p>
        <a class="primary compact" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">Buka tab baru ${icons.external}</a>
      </div>
    </div>
  </div>`;
}

function render(options = {}) {
  const stats = getStats();
  const visibleItems = getVisibleItems();
  app.innerHTML = `<main>
    <section class="hero">
      <div class="hero__content">
        <span class="eyebrow">${icons.shield} 100% lokal di browser</span>
        <h1>Lihat Watch History & Search History TikTok dengan rapi.</h1>
        <p>Upload file TXT atau JSON dari data export TikTok. Data tidak dikirim ke server, siap dipakai sebagai static web dan deploy ke Vercel atau Railway.</p>
        <div class="hero__actions">
          <button class="primary" data-upload>${icons.upload} Upload file</button>
          <a class="secondary" href="https://support.tiktok.com/id/account-and-privacy/personalized-ads-and-data/requesting-your-data" target="_blank" rel="noreferrer">Cara request data ${icons.external}</a>
        </div>
      </div>
      <div class="hero__card">${icons.chart}<strong>${stats.all.toLocaleString('id-ID')}</strong><span>Total item terbaca</span></div>
    </section>

    <section class="dropzone ${state.dragging ? 'is-dragging' : ''}" data-dropzone>
      <input id="file-input" type="file" accept=".json,.txt,application/json,text/plain" multiple hidden />
      ${icons.upload}
      <h2>Tarik file ke sini atau klik Upload</h2>
      <p>Mendukung file JSON/TXT, termasuk format TikTok “Video Browsing History” dan “Search History”.</p>
      <div class="filetypes"><span>${icons.json} JSON</span><span>${icons.text} TXT</span></div>
      ${state.fileName ? `<p class="filename">File aktif: ${escapeHtml(state.fileName)}</p>` : ''}
      ${state.error ? `<div class="alert">${icons.alert} ${escapeHtml(state.error)}</div>` : ''}
    </section>

    <section class="toolbar">
      <div class="tabs" role="tablist" aria-label="Filter history">
        ${[['all', 'Semua', stats.all], ['watch', 'Watch', stats.watch], ['search', 'Search', stats.search]].map(([key, label, count]) => `<button class="${state.activeTab === key ? 'active' : ''}" data-tab="${key}">${label}<span>${count}</span></button>`).join('')}
      </div>
      <label class="searchbox">${icons.search}<input id="query-input" value="${escapeHtml(state.query)}" placeholder="Cari keyword, URL, atau tanggal..." /></label>
      <select id="sort-select">
        <option value="newest" ${state.sort === 'newest' ? 'selected' : ''}>Terbaru dulu</option>
        <option value="oldest" ${state.sort === 'oldest' ? 'selected' : ''}>Terlama dulu</option>
        <option value="type" ${state.sort === 'type' ? 'selected' : ''}>Kelompokkan tipe</option>
      </select>
      <button class="secondary compact" data-download ${visibleItems.length ? '' : 'disabled'}>${icons.download} CSV</button>
    </section>

    <section class="results" aria-live="polite">
      ${!state.items.length ? `<div class="empty">${icons.history}<h3>Belum ada data</h3><p>Upload file export TikTok berformat JSON atau TXT untuk mulai melihat daftar history.</p></div>` : visibleItems.map(renderHistoryCard).join('')}
    </section>
    ${renderModal()}
  </main>`;

  bindEvents();
  if (options.focusQuery) {
    const queryInput = document.getElementById('query-input');
    queryInput?.focus();
    queryInput?.setSelectionRange(queryInput.value.length, queryInput.value.length);
  }
}

function bindEvents() {
  const input = document.getElementById('file-input');
  document.querySelectorAll('[data-upload], [data-dropzone]').forEach((el) => el.addEventListener('click', (event) => {
    if (event.target.closest('a')) return;
    input?.click();
  }));
  input?.addEventListener('change', (event) => handleFiles(event.target.files));

  const dropzone = document.querySelector('[data-dropzone]');
  dropzone?.addEventListener('dragover', (event) => { event.preventDefault(); state.dragging = true; render(); });
  dropzone?.addEventListener('dragleave', () => { state.dragging = false; render(); });
  dropzone?.addEventListener('drop', (event) => { event.preventDefault(); state.dragging = false; handleFiles(event.dataTransfer.files); });

  document.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => { state.activeTab = button.dataset.tab; render(); }));
  document.getElementById('query-input')?.addEventListener('input', (event) => { state.query = event.target.value; render({ focusQuery: true }); });
  document.getElementById('sort-select')?.addEventListener('change', (event) => { state.sort = event.target.value; render(); });
  document.querySelector('[data-download]')?.addEventListener('click', downloadCsv);
  document.querySelectorAll('[data-preview]').forEach((button) => button.addEventListener('click', () => {
    state.preview = state.items.find((item) => item.id === button.dataset.preview);
    render();
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
