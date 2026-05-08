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

const ui = {
  shell: 'mx-auto w-full max-w-[1240px] px-3 py-5 sm:px-4 lg:px-0 lg:py-10',
  glass: 'border border-white/10 bg-slate-950/70 shadow-glow backdrop-blur-2xl',
  primary: 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-tiktok-cyan via-white to-tiktok-pink px-5 py-2.5 text-sm font-black text-slate-950 shadow-lg shadow-cyan-950/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:pointer-events-none disabled:opacity-45',
  secondary: 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-2.5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/15 disabled:pointer-events-none disabled:opacity-45',
  ghost: 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-transparent px-5 py-2.5 text-sm font-extrabold text-slate-200 transition hover:-translate-y-0.5 hover:bg-white/10 disabled:pointer-events-none disabled:opacity-45',
  compact: 'min-h-9 px-4 py-2 text-xs sm:text-sm',
  badge: 'inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black text-slate-200',
  input: 'w-full rounded-[1.35rem] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-tiktok-cyan/70 focus:ring-4 focus:ring-tiktok-cyan/10',
};


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
  const iconWrap = isWatch ? 'bg-tiktok-cyan/10 text-tiktok-cyan ring-tiktok-cyan/20' : 'bg-tiktok-pink/10 text-pink-200 ring-tiktok-pink/20';
  return `<article class="group grid gap-4 rounded-[1.6rem] border border-white/10 bg-slate-950/70 p-4 shadow-lg shadow-black/20 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-slate-900/80 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-5">
    <div class="grid size-12 place-items-center rounded-2xl ring-1 ${iconWrap} sm:size-14">${isWatch ? icons.play : icons.search}</div>
    <div class="min-w-0">
      <div class="mb-2 flex flex-wrap items-center gap-2 text-xs font-black text-slate-400">
        <span class="${ui.badge}">${isWatch ? 'Watch history' : 'Search history'}</span>
        <time>${escapeHtml(humanDate(item.date))}</time>
        ${item.source ? `<span class="max-w-full truncate rounded-full bg-white/5 px-2.5 py-1 text-slate-300">${escapeHtml(item.source)}</span>` : ''}
      </div>
      <h3 class="break-words text-base font-black leading-snug text-white sm:text-lg">${escapeHtml(item.title)}</h3>
      <a class="mt-2 inline-flex max-w-full items-center gap-2 truncate text-sm font-bold text-tiktok-cyan hover:text-white" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">${icons.link}<span class="truncate">${escapeHtml(shortUrl(item.url))}</span></a>
    </div>
    <div class="flex flex-wrap gap-2 sm:justify-end">
      <button class="${ui.secondary} ${ui.compact} flex-1 sm:flex-none" data-preview="${escapeHtml(item.id)}">Preview</button>
      <button class="${ui.primary} ${ui.compact} flex-1 sm:flex-none" data-popup="${escapeHtml(item.id)}">Pop-up ${icons.external}</button>
    </div>
  </article>`;
}

function renderModal() {
  if (!state.preview) return '';
  const item = state.preview;
  return `<div class="modal fixed inset-0 z-50 grid place-items-center bg-black/80 p-3 backdrop-blur-sm sm:p-5" role="dialog" aria-modal="true" aria-label="Preview link">
    <div class="grid h-[94vh] w-full max-w-6xl grid-rows-[auto_1fr_auto] overflow-hidden rounded-[1.6rem] border border-white/10 bg-slate-950 shadow-glow sm:h-[88vh] sm:rounded-[2rem]">
      <div class="flex items-center justify-between gap-3 border-b border-white/10 p-4">
        <div class="min-w-0"><span class="text-xs font-black uppercase tracking-[.2em] text-slate-500">${item.type === 'watch' ? 'Preview video/link' : 'Preview pencarian'}</span><strong class="block truncate text-base font-black text-white">${escapeHtml(item.title)}</strong></div>
        <button class="grid size-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20" data-close-modal aria-label="Tutup">${icons.close}</button>
      </div>
      <iframe class="h-full w-full border-0 bg-white" title="Preview ${escapeHtml(item.title)}" src="${escapeHtml(item.url)}" sandbox="allow-scripts allow-same-origin allow-popups allow-forms"></iframe>
      <div class="flex flex-col gap-3 border-t border-white/10 p-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p>TikTok kadang memblokir iframe. Kalau kosong, klik “Pop-up / tab baru”.</p>
        <div class="flex flex-wrap gap-2"><button class="${ui.primary} ${ui.compact}" data-popup="${escapeHtml(item.id)}">Pop-up ${icons.external}</button><a class="${ui.secondary} ${ui.compact}" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">Buka tab baru</a></div>
      </div>
    </div>
  </div>`;
}

function renderUploadPanel() {
  const dropState = state.dragging ? 'scale-[.99] border-tiktok-cyan bg-tiktok-cyan/10 ring-4 ring-tiktok-cyan/10' : 'border-white/10 bg-slate-950/70 hover:border-tiktok-cyan/50 hover:bg-slate-900/80';
  return `<section class="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
    <div class="dropzone ${dropState} group grid min-h-[19rem] cursor-pointer place-items-center rounded-[2rem] border border-dashed p-6 text-center shadow-glow backdrop-blur-2xl transition" data-dropzone>
      <input id="file-input" type="file" accept=".json,.txt,application/json,text/plain" multiple hidden />
      <div class="grid size-20 place-items-center rounded-[1.5rem] bg-tiktok-cyan/10 text-4xl text-tiktok-cyan ring-1 ring-tiktok-cyan/20 transition group-hover:scale-105">${icons.upload}</div>
      <div><h2 class="mt-5 text-2xl font-black text-white">Upload file TikTok</h2><p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">Tarik file ke sini atau klik untuk pilih file JSON/TXT dari export TikTok.</p></div>
      <div class="mt-4 flex flex-wrap justify-center gap-2"><span class="${ui.badge}">${icons.json} JSON</span><span class="${ui.badge}">${icons.text} TXT</span></div>
      ${state.fileName ? `<p class="mt-4 max-w-full break-words rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-slate-200">Sumber: ${escapeHtml(state.fileName)}</p>` : ''}
    </div>

    <div class="rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-glow backdrop-blur-2xl sm:p-6">
      <div class="flex gap-3">
        <span class="grid size-12 place-items-center rounded-2xl bg-tiktok-pink/10 text-2xl text-pink-200 ring-1 ring-tiktok-pink/20">${icons.clipboard}</span>
        <div><h2 class="text-2xl font-black text-white">Paste manual</h2><p class="mt-1 text-sm leading-6 text-slate-400">Kalau datanya sudah kamu copy, tempel di sini lalu klik parse.</p></div>
      </div>
      <textarea class="${ui.input} mt-5 min-h-[12rem] resize-y font-mono leading-6" id="paste-input" placeholder="Contoh:\nDate: 2026-05-08 09:10:00\nLink: https://www.tiktok.com/@...\n\nSearch Term: resep ayam" rows="8">${escapeHtml(state.pasteText)}</textarea>
      <div class="mt-4 flex flex-wrap gap-2">
        <button class="${ui.primary} ${ui.compact} flex-1 sm:flex-none" data-parse-paste>Parse teks</button>
        <button class="${ui.secondary} ${ui.compact} flex-1 sm:flex-none" data-sample>Isi contoh</button>
        <button class="${ui.ghost} ${ui.compact} flex-1 sm:flex-none" data-clear ${state.items.length ? '' : 'disabled'}>${icons.trash} Reset</button>
      </div>
    </div>
  </section>`;
}

function renderToolbar(stats, visibleItems) {
  const tabs = [['all', 'Semua', stats.all], ['watch', 'Watch', stats.watch], ['search', 'Search', stats.search]];
  return `<section class="sticky top-3 z-30 mt-4 grid gap-3 rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-3 shadow-glow backdrop-blur-2xl lg:grid-cols-[auto_1fr_auto_auto] lg:items-center">
    <div class="flex flex-wrap gap-2" role="tablist" aria-label="Filter history">
      ${tabs.map(([key, label, count]) => `<button class="inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2 text-sm font-black transition ${state.activeTab === key ? 'bg-white text-slate-950' : 'bg-white/10 text-slate-200 hover:bg-white/15'}" data-tab="${key}">${label}<span class="rounded-full bg-black/15 px-2 py-0.5 text-xs">${count}</span></button>`).join('')}
    </div>
    <label class="flex min-h-11 items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 text-slate-300 transition focus-within:border-tiktok-cyan/70 focus-within:ring-4 focus-within:ring-tiktok-cyan/10">${icons.search}<input class="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500" id="query-input" value="${escapeHtml(state.query)}" placeholder="Cari keyword, URL, tanggal, atau nama file..." /></label>
    <select class="min-h-11 rounded-full border border-white/10 bg-slate-900 px-4 text-sm font-extrabold text-white outline-none focus:border-tiktok-cyan/70 focus:ring-4 focus:ring-tiktok-cyan/10" id="sort-select" aria-label="Urutkan data">
      <option value="newest" ${state.sort === 'newest' ? 'selected' : ''}>Terbaru dulu</option>
      <option value="oldest" ${state.sort === 'oldest' ? 'selected' : ''}>Terlama dulu</option>
      <option value="type" ${state.sort === 'type' ? 'selected' : ''}>Kelompokkan tipe</option>
      <option value="title" ${state.sort === 'title' ? 'selected' : ''}>Judul A-Z</option>
    </select>
    <button class="${ui.secondary} ${ui.compact}" data-download ${visibleItems.length ? '' : 'disabled'}>${icons.download} CSV</button>
  </section>`;
}

function renderResults(visibleItems) {
  if (!state.items.length) {
    return `<div class="rounded-[2rem] border border-white/10 bg-slate-950/70 px-5 py-16 text-center shadow-glow backdrop-blur-2xl">${icons.history}<h3 class="mt-4 text-2xl font-black text-white">Belum ada data</h3><p class="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400">Upload file export TikTok atau paste teks untuk mulai melihat daftar history.</p></div>`;
  }
  if (!visibleItems.length) {
    return `<div class="rounded-[2rem] border border-white/10 bg-slate-950/70 px-5 py-16 text-center shadow-glow backdrop-blur-2xl">${icons.search}<h3 class="mt-4 text-2xl font-black text-white">Tidak ada hasil</h3><p class="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400">Coba ubah kata kunci pencarian, tab filter, atau urutan data.</p></div>`;
  }
  return visibleItems.map(renderHistoryCard).join('');
}

function render(options = {}) {
  const stats = getStats();
  const visibleItems = getVisibleItems();
  app.innerHTML = `<main class="${ui.shell}">
    <section class="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div class="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-slate-950/70 p-6 shadow-glow backdrop-blur-2xl sm:p-10 lg:p-14">
        <div class="pointer-events-none absolute -bottom-24 -right-20 size-72 rounded-full bg-gradient-to-br from-tiktok-cyan via-white to-tiktok-pink opacity-20 blur-2xl"></div>
        <span class="inline-flex items-center gap-2 rounded-full border border-tiktok-cyan/30 bg-tiktok-cyan/10 px-3 py-1.5 text-xs font-black text-cyan-100">${icons.shield} 100% lokal di browser</span>
        <h1 class="mt-6 max-w-4xl text-5xl font-black leading-[.92] tracking-[-0.07em] text-white sm:text-6xl lg:text-7xl">Lihat history TikTok tanpa ribet.</h1>
        <p class="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">Upload atau paste data TXT/JSON dari TikTok. Semua parsing berjalan di browser kamu, tampil rapi, bisa dicari, dan siap deploy ke Vercel atau Railway.</p>
        <div class="mt-8 flex flex-wrap gap-3">
          <button class="${ui.primary}" data-upload>${icons.upload} Upload file</button>
          <button class="${ui.secondary}" data-sample>Lihat contoh</button>
          <a class="${ui.secondary}" href="https://support.tiktok.com/id/account-and-privacy/personalized-ads-and-data/requesting-your-data" target="_blank" rel="noreferrer">Cara request data ${icons.external}</a>
        </div>
      </div>
      <div class="grid gap-3 rounded-[2rem] border border-white/10 bg-gradient-to-br from-tiktok-cyan/15 to-tiktok-pink/10 p-5 shadow-glow backdrop-blur-2xl">
        <div class="rounded-[1.5rem] bg-black/20 p-5"><span class="text-sm font-black text-slate-400">Total</span><strong class="mt-2 block text-6xl font-black leading-none tracking-[-0.08em] text-white">${stats.all.toLocaleString('id-ID')}</strong><small class="font-bold text-slate-400">item terbaca</small></div>
        <div class="grid grid-cols-2 gap-3"><div class="rounded-2xl bg-white/10 p-4"><b class="block text-3xl font-black text-white">${stats.watch}</b><span class="text-sm font-bold text-slate-400">Watch</span></div><div class="rounded-2xl bg-white/10 p-4"><b class="block text-3xl font-black text-white">${stats.search}</b><span class="text-sm font-bold text-slate-400">Search</span></div></div>
        <p class="rounded-2xl bg-white/5 p-4 text-sm font-bold text-slate-300">Terakhir: ${escapeHtml(stats.latest)}</p>
      </div>
    </section>

    <div class="mt-4">${renderUploadPanel()}</div>
    ${(state.error || state.notice) ? `<section class="mt-4 flex items-center gap-3 rounded-2xl border p-4 text-sm font-bold ${state.error ? 'border-tiktok-pink/30 bg-tiktok-pink/10 text-pink-100' : 'border-tiktok-cyan/30 bg-tiktok-cyan/10 text-cyan-100'}">${state.error ? icons.alert : icons.shield}<span>${escapeHtml(state.error || state.notice)}</span></section>` : ''}
    ${renderToolbar(stats, visibleItems)}

    <section class="mt-4 flex flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-4 shadow-lg backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
      <div><h2 class="text-2xl font-black text-white">Daftar history</h2><p class="mt-1 text-sm text-slate-400">Menampilkan ${visibleItems.length.toLocaleString('id-ID')} dari ${state.items.length.toLocaleString('id-ID')} item</p></div>
      ${state.items.length ? `<button class="${ui.ghost} ${ui.compact}" data-clear>${icons.trash} Bersihkan</button>` : ''}
    </section>
    <section class="mt-3 grid gap-3" aria-live="polite">${renderResults(visibleItems)}</section>
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
