const categoryLabels = {
  available: ['Abstrak tersedia', 'Abstrak telah disetujui melalui review manual.'],
  unavailable: ['Abstrak belum tersedia', 'Kategori sumber unavailable dan belum disetujui.'],
  excluded: ['Dikecualikan', 'Data tidak digunakan untuk modelling.'],
};
const number = new Intl.NumberFormat('id-ID');

function recordStatus(record) {
  if (record.reviewStatus === 'approved') return 'available';
  if (record.category === 'unavailable') return 'unavailable';
  return 'excluded';
}

export function filterRecords(records, query = '', category = 'all') {
  const needle = query.trim().toLocaleLowerCase('id');
  return records.filter((record) => {
    if (category !== 'all' && recordStatus(record) !== category) return false;
    return !needle || `${record.title ?? ''}\n${record.abstract ?? ''}`.toLocaleLowerCase('id').includes(needle);
  });
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function categoryInfo(category) {
  return categoryLabels[category] ?? [category || 'Status belum diketahui', 'Status data belum dipetakan.'];
}

function badge(value, label) {
  return element('span', `badge badge--${value || 'unknown'}`, label);
}

function makeRow(record) {
  const row = document.createElement('tr');
  row.dataset.detail = record.docId || '';
  const title = element('td', 'table-title', record.title || 'Judul tidak tersedia');
  const status = element('td', 'table-status');
  const badges = element('div', 'badges');
  const displayStatus = recordStatus(record);
  badges.append(badge(displayStatus, categoryInfo(displayStatus)[0]));
  status.append(badges);

  const note = element('td', 'table-note', categoryInfo(displayStatus)[1]);
  const year = element('td', 'table-year', record.year ? String(record.year) : '—');
  const action = element('td', 'table-action');
  const button = element('button', 'detail-button', 'Detail');
  button.type = 'button';
  button.dataset.detail = record.docId || '';
  action.append(button);
  row.append(title, status, note, year, action);
  return row;
}

function showDetail(record, updateUrl = false) {
  document.querySelector('#page-heading').hidden = true;
  const listView = document.querySelector('#list-view');
  const detailView = document.querySelector('#detail-view');
  listView.hidden = true;
  detailView.hidden = false;
  if (updateUrl) {
    const query = new URLSearchParams({ id: record.docId });
    history.pushState({ detailId: record.docId }, '', `${location.pathname}?${query}`);
  }

  document.title = `${record.title || 'Dataset'} · Korpus Abstrak JTI`;
  document.querySelector('#detail-title').textContent = record.title || 'Judul tidak tersedia';
  const displayStatus = recordStatus(record);
  document.querySelector('#detail-note').textContent = categoryInfo(displayStatus)[1];
  document.querySelector('#detail-status').replaceChildren(
    badge(displayStatus, categoryInfo(displayStatus)[0]),
  );
  const abstract = document.querySelector('#detail-abstract');
  abstract.textContent = record.abstract?.trim() || 'Abstrak belum tersedia pada data sumber.';
  abstract.classList.toggle('abstract-missing', !record.abstract?.trim());

  const fields = [
    ['Tahun', record.year],
    ['Penulis', Array.isArray(record.authors) ? record.authors.join(', ') : record.authors],
    ['Jenis dokumen', record.documentType],
    ['Program studi', record.studyProgram],
    ['Kata kunci', Array.isArray(record.keywords) ? record.keywords.join(', ') : record.keywords],
    ['ID', record.docId],
  ].filter(([, value]) => value !== undefined && value !== null && value !== '');
  const metadata = document.querySelector('#detail-metadata');
  metadata.replaceChildren();
  for (const [label, value] of fields) {
    metadata.append(element('dt', '', label), element('dd', '', String(value)));
  }

  const source = document.querySelector('#detail-source');
  const sourcePlaceholder = document.querySelector('#source-placeholder');
  source.hidden = !record.source;
  sourcePlaceholder.hidden = Boolean(record.source);
  if (record.source) source.href = record.source;
}

async function startCatalog() {
  const rows = document.querySelector('#record-list');
  if (!rows) return;
  const query = document.querySelector('#search-query');
  const form = document.querySelector('#search-form');
  const resultCount = document.querySelector('#result-count');
  const recordCount = document.querySelector('#record-count');
  const categoryNav = document.querySelector('#category-nav');
  const emptyState = document.querySelector('#empty-state');
  const errorState = document.querySelector('#load-error');
  const listView = document.querySelector('#list-view');
  const detailView = document.querySelector('#detail-view');
  let records;
  let activeCategory = 'all';

  try {
    const response = await fetch('./catalog.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    records = Array.isArray(data) ? data : data.records;
    if (!Array.isArray(records)) throw new Error('Format catalog.json tidak sesuai.');
  } catch (error) {
    errorState.hidden = false;
    errorState.textContent = `Dataset tidak dapat dimuat. Periksa catalog.json. (${error.message})`;
    recordCount.textContent = 'Dataset gagal dimuat';
    return;
  }

  recordCount.textContent = `${number.format(records.length)} record`;

  const categories = Object.keys(categoryLabels);
  const categoryOptions = [['all', 'Semua dataset'], ...categories.map((category) => [category, categoryInfo(category)[0]])];
  for (const [category, label] of categoryOptions) {
    const button = element('button', 'category-button');
    button.type = 'button';
    button.dataset.category = category;
    button.setAttribute('aria-pressed', category === activeCategory);
    button.append(element('span', '', label));
    button.append(element('span', 'category-count', number.format(
      category === 'all' ? records.length : records.filter((record) => recordStatus(record) === category).length
    )));
    categoryNav.append(button);
  }

  function renderList() {
    const matches = filterRecords(records, query.value, activeCategory);
    const fragment = document.createDocumentFragment();
    for (const record of matches) fragment.append(makeRow(record));
    rows.replaceChildren(fragment);
    resultCount.textContent = `${number.format(matches.length)} dari ${number.format(records.length)} dataset`;
    emptyState.hidden = matches.length > 0;
  }

  function renderRoute() {
    const id = new URLSearchParams(location.search).get('id');
    if (id) {
      const record = records.find((item) => item.docId === id);
      if (record) {
        showDetail(record);
        return;
      }
    }
    document.title = 'Dataset · Korpus Abstrak JTI';
    document.querySelector('#page-heading').hidden = false;
    detailView.hidden = true;
    listView.hidden = false;
    renderList();
  }

  function selectCategory(category) {
    activeCategory = category;
    for (const item of categoryNav.querySelectorAll('button')) {
      item.setAttribute('aria-pressed', item.dataset.category === category);
    }
    renderList();
    categoryNav.querySelector(`[data-category="${category}"]`).focus();
  }

  categoryNav.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-category]');
    if (button) selectCategory(button.dataset.category);
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    renderList();
  });

  rows.addEventListener('click', (event) => {
    if (event.target.closest('.table-status')) return;
    if (window.getSelection()?.toString()) return;
    const target = event.target.closest('[data-detail]');
    if (!target) return;
    const record = records.find((item) => item.docId === target.dataset.detail);
    if (record) showDetail(record, true);
  });

  document.querySelector('#back-to-list').addEventListener('click', () => {
    if (history.state?.detailId) history.back();
    else {
      history.replaceState(null, '', location.pathname);
      renderRoute();
    }
  });

  window.addEventListener('popstate', renderRoute);
  renderRoute();
}

if (typeof document !== 'undefined') startCatalog();
