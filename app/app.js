// Leonida Legend — offline trophy tracker. Progress lives only in localStorage, keyed by trophy name.
const KEY = 'leonida-legend-progress-v1';
let trophies = [];
let roadmap = null;
let earned = new Set();
try { earned = new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch (e) { earned = new Set(); }
const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
function save() { localStorage.setItem(KEY, JSON.stringify([...earned])); }
function esc(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
function showView(name) {
  ['guide', 'roadmap', 'missables', 'about'].forEach((v) => {
    const el = $('view-' + v); if (el) el.classList.toggle('hidden', v !== name);
  });
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.view === name));
  try { const u = new URL(location.href); u.searchParams.set('view', name); history.replaceState(null, '', u); } catch (e) {}
}
function updateProgress() {
  const total = trophies.length || 55;
  const pct = total ? Math.round((earned.size / total) * 100) : 0;
  $('prog-text').textContent = earned.size + ' of ' + total + ' earned';
  $('prog-pct').textContent = pct + '%';
  $('prog-bar').style.width = pct + '%';
  const grades = ['platinum', 'gold', 'silver', 'bronze'];
  $('grade-counts').innerHTML = grades.map((g) => {
    const all = trophies.filter((t) => t.grade === g).length;
    const got = trophies.filter((t) => t.grade === g && earned.has(t.name)).length;
    return '<span class="chip">' + g + ': ' + got + ' / ' + all + '</span>';
  }).join('');
}
function isHidden(t) {
  return $('f-spoiler').checked && t.kind === 'story' && !earned.has(t.name);
}
// Keyboard shortcut: pressing "/" focuses the search box from anywhere in the guide.
document.addEventListener('keydown', (ev) => {
  if (ev.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
    ev.preventDefault(); const q = $('q'); if (q) q.focus();
  }
});
function cardHTML(t) {
  const hidden = isHidden(t);
  const name = hidden ? 'Hidden story trophy' : t.name;
  const desc = hidden ? 'Hidden story trophy — mark earned or turn off spoiler protection to reveal' : t.description;
  const guide = hidden ? 'Hidden story trophy — mark earned or turn off spoiler protection to reveal' : t.guide;
  const steps = hidden ? [] : (t.steps || []);
  return '<article class="card" id="card-' + t.id + '">'
    + '<label class="earn"><input type="checkbox" data-name="' + esc(t.name) + '" ' + (earned.has(t.name) ? 'checked' : '') + '> Mark earned</label>'
    + '<div><span class="badge b-' + esc(t.grade) + '">' + esc(t.grade) + '</span> '
    + '<span class="chip">' + esc(t.kind) + '</span><span class="chip">Stage ' + t.stage + '</span>'
    + (t.missable ? '<span class="chip miss">MISSABLE</span>' : '') + '</div>'
    + '<h3 class="' + (hidden ? 'blurred' : '') + '">' + esc(name) + '</h3>'
    + '<p class="desc ' + (hidden ? 'blurred' : '') + '">' + esc(desc) + '</p>'
    + '<details><summary>Guide, steps &amp; source</summary>'
    + '<p>' + esc(guide) + '</p>'
    + (steps.length ? '<ol>' + steps.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ol>' : '')
    + (t.missable && t.missable_note ? '<p class="mnote"><strong>Missable:</strong> ' + esc(t.missable_note) + '</p>' : '')
    + '<p class="source">Source: ' + esc(t.source) + '</p></details></article>';
}
function renderGuide() {
  const q = ($('q').value || '').toLowerCase();
  const grade = $('f-grade').value, kind = $('f-kind').value, status = $('f-status').value, missOnly = $('f-missable').checked;
  const list = trophies.filter((t) => {
    if (grade !== 'all' && t.grade !== grade) return false;
    if (kind !== 'all' && t.kind !== kind) return false;
    if (status === 'earned' && !earned.has(t.name)) return false;
    if (status === 'unearned' && earned.has(t.name)) return false;
    if (missOnly && !t.missable) return false;
    if (q && !(t.name + ' ' + t.description + ' ' + t.guide + ' ' + t.kind).toLowerCase().includes(q)) return false;
    return true;
  });
  $('result-count').textContent = 'Showing ' + list.length + ' of ' + trophies.length + ' trophies';
  $('cards').innerHTML = list.map(cardHTML).join('');
  document.querySelectorAll('#cards input[type=checkbox]').forEach((box) => {
    box.addEventListener('change', () => {
      if (box.checked) earned.add(box.dataset.name); else earned.delete(box.dataset.name);
      save(); updateProgress(); renderGuide();
      if (!$('view-roadmap').classList.contains('hidden')) renderRoadmap();
    });
  });
  updateProgress();
}
function renderRoadmap() {
  if (!roadmap) return;
  const el = $('view-roadmap');
  let h = '<div class="grid2"><article class="panel"><h2>Platinum difficulty (estimate)</h2><p>' + esc(roadmap.difficulty) + '</p></article>'
    + '<article class="panel"><h2>Online / offline split</h2><p>' + esc(roadmap.online_split) + '</p></article></div>';
  h += '<article class="panel"><h2>Before you start</h2><p>' + esc(roadmap.before_you_start) + '</p><h3>Missables strategy</h3><p>' + esc(roadmap.missables_strategy) + '</p></article>';
  (roadmap.stages || []).forEach((s) => {
    h += '<article class="panel stage"><h3>Stage ' + s.n + ' — ' + esc(s.title) + '</h3><p><strong>' + esc(s.goal) + '</strong></p><p>' + esc(s.detail) + '</p><div>'
      + (s.trophies || []).map((n) => '<button type="button" class="chip stagechip" data-jump="' + esc(n) + '">' + esc(n) + '</button>').join('') + '</div></article>';
  });
  el.innerHTML = h;
  el.querySelectorAll('[data-jump]').forEach((b) => b.addEventListener('click', () => {
    showView('guide');
    $('q').value = b.dataset.jump; renderGuide();
    const t = trophies.find((x) => x.name === b.dataset.jump);
    if (t) { const c = $('card-' + t.id); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }));
}
function renderMissables() {
  const list = trophies.filter((t) => t.missable);
  let h = '<article class="panel"><h2>Missables</h2><p>' + esc(roadmap ? roadmap.missables_strategy : '') + '</p><p class="muted">' + list.length + ' trophies are flagged missable. Pure grind and count trophies are not flagged.</p></article>';
  h += '<div class="cards" style="margin-top:14px">' + list.map((t) => '<article class="card"><span class="badge b-' + esc(t.grade) + '">' + esc(t.grade) + '</span> <span class="chip miss">MISSABLE</span><h3>' + esc(t.name) + '</h3><p class="desc">' + esc(t.description) + '</p><p class="mnote">' + esc(t.missable_note) + '</p><p>' + esc(t.guide) + '</p><p class="source">Source: ' + esc(t.source) + '</p></article>').join('') + '</div>';
  $('view-missables').innerHTML = h;
}
async function load() {
  const tr = await fetch('data/trophies.json'); const tj = await tr.json(); trophies = tj.trophies || [];
  try { const rr = await fetch('data/roadmap.json'); roadmap = await rr.json(); } catch (e) { roadmap = null; }
  const kinds = [...new Set(trophies.map((t) => t.kind))].sort();
  kinds.forEach((k) => { const o = document.createElement('option'); o.value = k; o.textContent = k; $('f-kind').appendChild(o); });
  if (params.get('grade')) $('f-grade').value = params.get('grade');
  if (params.get('kind')) $('f-kind').value = params.get('kind');
  if (params.get('q')) $('q').value = params.get('q');
  ['q', 'f-grade', 'f-kind', 'f-status', 'f-missable', 'f-spoiler'].forEach((id) => { $(id).addEventListener('input', renderGuide); $(id).addEventListener('change', renderGuide); });
  document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => showView(b.dataset.view)));
  $('export-btn').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify([...earned], null, 2)], { type: 'application/json' }));
    a.download = 'leonida-legend-progress.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
  $('import-file').addEventListener('change', async (ev) => {
    const f = ev.target.files[0]; if (!f) return;
    try { const data = JSON.parse(await f.text()); const arr = Array.isArray(data) ? data : (data.earned || []); earned = new Set(arr); save(); renderGuide(); renderMissables(); } catch (e) { alert('Could not read that progress file.'); }
  });
  $('reset-btn').addEventListener('click', () => { if (confirm('Clear all earned progress?')) { earned = new Set(); save(); renderGuide(); renderMissables(); } });
  renderGuide(); renderRoadmap(); renderMissables();
  const v = params.get('view'); if (v && ['guide', 'roadmap', 'missables', 'about'].includes(v)) showView(v);
}
load();
