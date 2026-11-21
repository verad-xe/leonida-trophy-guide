// Leonida Legend — GTA VI Trophy Guide & Platinum Roadmap.
// Vanilla JavaScript, no frameworks, no network beyond this app's own data files.
// Progress lives in localStorage, keyed by trophy name, and can be exported,
// imported and reset from the header panel.

const PROGRESS_KEY = 'leonida-legend-progress-v1';
const SPOILER_KEY = 'leonida-legend-spoiler-v1';
const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];
const GRADE_LABEL = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };

let trophies = [];
let roadmap = null;
let earned = loadEarned();
let spoilerOn = loadSpoiler();
const openGuides = new Set();
const filters = { q: '', grade: 'all', kind: 'all', status: 'all', missableOnly: false };

function loadEarned() {
  try {
    const raw = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '[]');
    return new Set(Array.isArray(raw) ? raw : []);
  } catch {
    return new Set();
  }
}

function loadSpoiler() {
  const saved = localStorage.getItem(SPOILER_KEY);
  return saved === null ? true : saved === 'on';
}

function saveEarned() {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify([...earned]));
}

function saveSpoiler() {
  localStorage.setItem(SPOILER_KEY, spoilerOn ? 'on' : 'off');
}

function isSpoilerHidden(trophy) {
  return spoilerOn && trophy.kind === 'story' && !earned.has(trophy.name);
}

function trophyMatches(trophy) {
  if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
  if (filters.kind !== 'all' && trophy.kind !== filters.kind) return false;
  if (filters.status === 'earned' && !earned.has(trophy.name)) return false;
  if (filters.status === 'unearned' && earned.has(trophy.name)) return false;
  if (filters.missableOnly && !trophy.missable) return false;
  if (filters.q) {
    const haystack = (trophy.name + ' ' + trophy.description + ' ' + trophy.guide + ' ' + trophy.kind).toLowerCase();
    if (!haystack.includes(filters.q.toLowerCase())) return false;
  }
  return true;
}

function renderProgress() {
  const total = trophies.length;
  const done = trophies.filter((t) => earned.has(t.name)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('progress-count').textContent = done + ' of ' + total + ' earned';
  document.getElementById('progress-pct').textContent = pct + '%';
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-bar').setAttribute('aria-valuenow', String(pct));
  const parts = GRADE_ORDER.map((grade) => {
    const inGrade = trophies.filter((t) => t.grade === grade);
    const got = inGrade.filter((t) => earned.has(t.name)).length;
    return GRADE_LABEL[grade] + ' ' + got + '/' + inGrade.length;
  });
  document.getElementById('grade-counts').textContent = parts.join(' · ');
}

function makeChip(text, className) {
  const chip = document.createElement('span');
  chip.className = 'chip ' + className;
  chip.textContent = text;
  return chip;
}

function buildTrophyCard(trophy) {
  const card = document.createElement('article');
  card.className = 'card grade-' + trophy.grade;
  card.id = 'trophy-' + trophy.id;
  const hidden = isSpoilerHidden(trophy);

  const head = document.createElement('div');
  head.className = 'card-head';
  const label = document.createElement('label');
  label.className = 'earned-label';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(trophy.name);
  box.setAttribute('aria-label', 'Mark ' + trophy.name + ' as earned');
  box.addEventListener('change', () => {
    if (box.checked) earned.add(trophy.name);
    else earned.delete(trophy.name);
    saveEarned();
    renderAll();
  });
  label.append(box, document.createTextNode(' Earned'));
  const badge = makeChip(GRADE_LABEL[trophy.grade], 'badge-' + trophy.grade);
  head.append(label, badge);
  card.append(head);

  const title = document.createElement('h3');
  title.className = hidden ? 'trophy-name spoiler-blur' : 'trophy-name';
  title.textContent = hidden ? 'Hidden story trophy' : trophy.name;
  card.append(title);

  const desc = document.createElement('p');
  desc.className = hidden ? 'trophy-desc spoiler-blur' : 'trophy-desc';
  desc.textContent = hidden
    ? 'Hidden story trophy — mark earned or turn off spoiler protection to reveal.'
    : trophy.description;
  card.append(desc);

  const chips = document.createElement('p');
  chips.className = 'chips';
  chips.append(makeChip('Kind: ' + trophy.kind, 'chip-kind'));
  chips.append(makeChip('Roadmap stage ' + trophy.stage, 'chip-stage'));
  if (trophy.missable) chips.append(makeChip('MISSABLE', 'chip-missable'));
  if (hidden) chips.append(makeChip('Spoiler protected', 'chip-spoiler'));
  card.append(chips);

  const details = document.createElement('details');
  details.className = 'guide-details';
  if (openGuides.has(trophy.name)) details.open = true;
  details.addEventListener('toggle', () => {
    if (details.open) openGuides.add(trophy.name);
    else openGuides.delete(trophy.name);
  });
  const summary = document.createElement('summary');
  summary.textContent = 'Guide, steps & source';
  details.append(summary);
  const guide = document.createElement('p');
  guide.className = 'guide-text';
  guide.textContent = hidden ? 'Guide hidden by spoiler protection until this trophy is earned.' : trophy.guide;
  details.append(guide);
  if (!hidden && Array.isArray(trophy.steps) && trophy.steps.length) {
    const list = document.createElement('ol');
    list.className = 'steps';
    for (const step of trophy.steps) {
      const item = document.createElement('li');
      item.textContent = step;
      list.append(item);
    }
    details.append(list);
  }
  if (trophy.missable && trophy.missable_note) {
    const note = document.createElement('p');
    note.className = 'missable-note';
    note.textContent = 'Missable: ' + trophy.missable_note;
    details.append(note);
  }
  const source = document.createElement('p');
  source.className = 'source';
  source.textContent = 'Source: ' + trophy.source;
  details.append(source);
  card.append(details);
  return card;
}

function renderGuide() {
  const wrap = document.getElementById('cards');
  wrap.replaceChildren();
  const visible = trophies.filter(trophyMatches);
  visible.forEach((trophy, index) => {
    const card = buildTrophyCard(trophy);
    if (index === 0 && !openGuides.size) {
      const details = card.querySelector('.guide-details');
      if (details) details.open = true;
    }
    wrap.append(card);
  });
  document.getElementById('result-line').textContent =
    'Showing ' + visible.length + ' of ' + trophies.length + ' trophies' +
    (filters.missableOnly ? ' · missable only' : '') +
    (spoilerOn ? ' · spoiler protection on' : ' · spoiler protection off') + '.';
}

function buildMissableCard(trophy) {
  const card = document.createElement('article');
  card.className = 'card grade-' + trophy.grade;
  const head = document.createElement('div');
  head.className = 'card-head';
  head.append(makeChip(GRADE_LABEL[trophy.grade], 'badge-' + trophy.grade), makeChip('MISSABLE', 'chip-missable'));
  card.append(head);
  const title = document.createElement('h3');
  title.className = 'trophy-name';
  title.textContent = trophy.name;
  card.append(title);
  const desc = document.createElement('p');
  desc.className = 'trophy-desc';
  desc.textContent = trophy.description;
  card.append(desc);
  const note = document.createElement('p');
  note.className = 'missable-note';
  note.textContent = 'Why it can be missed: ' + trophy.missable_note;
  card.append(note);
  const guide = document.createElement('p');
  guide.className = 'guide-text';
  guide.textContent = trophy.guide;
  card.append(guide);
  const source = document.createElement('p');
  source.className = 'source';
  source.textContent = 'Source: ' + trophy.source;
  card.append(source);
  return card;
}

function renderMissables() {
  const strategy = document.getElementById('missables-strategy');
  strategy.replaceChildren();
  const heading = document.createElement('h3');
  heading.textContent = roadmap.missables_strategy.title;
  const body = document.createElement('p');
  body.textContent = roadmap.missables_strategy.detail;
  strategy.append(heading, body);
  const wrap = document.getElementById('missable-cards');
  wrap.replaceChildren();
  for (const trophy of trophies.filter((t) => t.missable)) wrap.append(buildMissableCard(trophy));
}

function jumpToTrophy(name) {
  switchView('guide');
  filters.q = name;
  filters.grade = 'all';
  filters.kind = 'all';
  filters.status = 'all';
  filters.missableOnly = false;
  syncFilterInputs();
  openGuides.add(name);
  renderGuide();
  const target = trophies.find((t) => t.name === name);
  const el = target ? document.getElementById('trophy-' + target.id) : null;
  if (el) {
    el.scrollIntoView({ block: 'start' });
    el.classList.add('jump-highlight');
  }
}

function buildStageCard(stage) {
  const card = document.createElement('article');
  card.className = 'stage-card';
  const heading = document.createElement('h3');
  heading.textContent = 'Stage ' + stage.n + ' — ' + stage.title;
  const goal = document.createElement('p');
  goal.className = 'stage-goal';
  goal.textContent = stage.goal;
  const detail = document.createElement('p');
  detail.textContent = stage.detail;
  card.append(heading, goal, detail);
  const chips = document.createElement('p');
  chips.className = 'chips';
  for (const name of stage.trophies) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip chip-link';
    chip.textContent = name;
    chip.addEventListener('click', () => jumpToTrophy(name));
    chips.append(chip);
  }
  card.append(chips);
  return card;
}

function renderRoadmap() {
  document.getElementById('roadmap-title').textContent = roadmap.title;
  const cards = document.getElementById('roadmap-cards');
  cards.replaceChildren();
  const difficulty = document.createElement('article');
  difficulty.className = 'info-card accent-card';
  const dHead = document.createElement('h3');
  dHead.textContent = 'Platinum difficulty: ' + roadmap.difficulty.rating + ' · ' + roadmap.difficulty.hours;
  const dBody = document.createElement('p');
  dBody.textContent = roadmap.difficulty.label + '. ' + roadmap.difficulty.detail;
  difficulty.append(dHead, dBody);
  const online = document.createElement('article');
  online.className = 'info-card accent-card';
  const oHead = document.createElement('h3');
  oHead.textContent = roadmap.online_split.title + ': all 55 offline';
  const oBody = document.createElement('p');
  oBody.textContent = roadmap.online_split.detail;
  online.append(oHead, oBody);
  cards.append(difficulty, online);

  const stages = document.getElementById('roadmap-stages');
  stages.replaceChildren();
  for (const stage of roadmap.stages) stages.append(buildStageCard(stage));

  const miss = document.getElementById('roadmap-missables');
  miss.replaceChildren();
  const mHead = document.createElement('h3');
  mHead.textContent = roadmap.missables_strategy.title;
  const mBody = document.createElement('p');
  mBody.textContent = roadmap.missables_strategy.detail;
  const mList = document.createElement('ul');
  for (const rule of roadmap.missables_strategy.rules) {
    const item = document.createElement('li');
    item.textContent = rule;
    mList.append(item);
  }
  miss.append(mHead, mBody, mList);

  const before = document.getElementById('roadmap-before');
  before.replaceChildren();
  const bHead = document.createElement('h3');
  bHead.textContent = 'Before you start';
  const bList = document.createElement('ul');
  for (const line of roadmap.before_you_start) {
    const item = document.createElement('li');
    item.textContent = line;
    bList.append(item);
  }
  before.append(bHead, bList);
}

function switchView(name) {
  for (const view of ['guide', 'roadmap', 'missables', 'about']) {
    document.getElementById('view-' + view).hidden = view !== name;
    document.getElementById('tab-' + view).classList.toggle('active', view === name);
  }
}

function syncFilterInputs() {
  document.getElementById('q').value = filters.q;
  document.getElementById('grade-filter').value = filters.grade;
  document.getElementById('kind-filter').value = filters.kind;
  document.getElementById('status-filter').value = filters.status;
  document.getElementById('missable-only').checked = filters.missableOnly;
  document.getElementById('spoiler-toggle').checked = spoilerOn;
}

function applyQueryParams() {
  const params = new URLSearchParams(location.search);
  const view = params.get('view');
  if (view && ['guide', 'roadmap', 'missables', 'about'].includes(view)) switchView(view);
  const grade = params.get('grade');
  if (grade && ['platinum', 'gold', 'silver', 'bronze'].includes(grade)) filters.grade = grade;
  const kind = params.get('kind');
  if (kind) filters.kind = kind;
  const q = params.get('q');
  if (q) filters.q = q;
  if (params.get('missable') === '1') filters.missableOnly = true;
}

function wireControls() {
  for (const tab of document.querySelectorAll('#tabs button')) {
    tab.addEventListener('click', () => switchView(tab.dataset.view));
  }
  document.getElementById('q').addEventListener('input', (e) => { filters.q = e.target.value; renderGuide(); });
  document.getElementById('grade-filter').addEventListener('change', (e) => { filters.grade = e.target.value; renderGuide(); });
  document.getElementById('kind-filter').addEventListener('change', (e) => { filters.kind = e.target.value; renderGuide(); });
  document.getElementById('status-filter').addEventListener('change', (e) => { filters.status = e.target.value; renderGuide(); });
  document.getElementById('missable-only').addEventListener('change', (e) => { filters.missableOnly = e.target.checked; renderGuide(); });
  document.getElementById('spoiler-toggle').addEventListener('change', (e) => {
    spoilerOn = e.target.checked;
    saveSpoiler();
    renderGuide();
  });
  document.getElementById('export-btn').addEventListener('click', exportProgress);
  document.getElementById('import-file').addEventListener('change', importProgress);
  document.getElementById('reset-btn').addEventListener('click', () => {
    earned = new Set();
    saveEarned();
    renderAll();
  });
}

function exportProgress() {
  const payload = JSON.stringify({ app: 'leonida-legend', earned: [...earned] }, null, 2);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  link.download = 'leonida-legend-progress.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

async function importProgress(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const names = Array.isArray(parsed) ? parsed : parsed.earned;
    if (Array.isArray(names)) {
      earned = new Set(names.filter((name) => trophies.some((t) => t.name === name)));
      saveEarned();
      renderAll();
    }
  } catch {
    document.getElementById('result-line').textContent = 'Import failed: that file is not valid progress JSON.';
  }
  event.target.value = '';
}

function renderAll() {
  renderProgress();
  renderGuide();
}

async function init() {
  const trophyDoc = await (await fetch('data/trophies.json')).json();
  trophies = trophyDoc.trophies;
  roadmap = await (await fetch('data/roadmap.json')).json();
  const kindFilter = document.getElementById('kind-filter');
  const kinds = [...new Set(trophies.map((t) => t.kind))].sort();
  for (const kind of kinds) {
    const option = document.createElement('option');
    option.value = kind;
    option.textContent = kind;
    kindFilter.append(option);
  }
  wireControls();
  applyQueryParams();
  syncFilterInputs();
  document.getElementById('spoiler-toggle').checked = spoilerOn;
  renderAll();
  renderRoadmap();
  renderMissables();
}

init();
