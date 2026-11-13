/* PLC Launchpad 1.0 · core: icons, helpers, state, saving, plan steps, scores, invitations */
'use strict';

/* ------------------------------------------------------------------ icons */
const ICONS = {
  learn: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle class="fill" cx="12" cy="12" r="1.8"/>',
  check: '<rect x="5" y="4" width="14" height="17" rx="2.5"/><path d="M9 3h6v3H9z"/><path d="m8.5 13.5 2.5 2.5 4.5-5"/>',
  reteach: '<path d="M4 12a8 8 0 0 1 13.7-5.6"/><path d="M18 3v4h-4"/><path d="M20 12a8 8 0 0 1-13.7 5.6"/><path d="M6 21v-4h4"/>',
  stretch: '<path d="M3 21h5v-5h5v-5h4"/><path d="M15 3h6v6"/><path d="m21 3-7 7"/>',
  team: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16.2 14a5 5 0 0 1 5.3 5"/>',
  standard: '<path d="M5 5a2 2 0 0 1 2-2h12v15H7a2 2 0 0 0-2 2z"/><path d="M5 20a2 2 0 0 0 2 2h12v-4"/><path d="m12 6.6 1 2.1 2.2.3-1.6 1.5.4 2.2-2-1.1-2 1.1.4-2.2L8.8 9l2.2-.3z"/>',
  target: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><circle cx="12" cy="12" r="6"/><circle class="fill" cx="12" cy="12" r="2"/>',
  goal: '<path d="M5 21V4"/><path d="M5 4h12l-2.5 4.5L17 13H5"/>',
  results: '<path d="M4 20h16"/><path d="M7 16v-4"/><path d="M12 16V6"/><path d="M17 16V9"/>',
  score: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 10h18M9 4v16"/><path d="m12.5 15 1.6 1.6 3.4-3.6"/>',
  recheck: '<rect x="5" y="4" width="14" height="17" rx="2.5"/><path d="M9 3h6v3H9z"/><path d="M9 14a3 3 0 1 0 1-2.2"/><path d="M9 10v2h2"/>',
  practice: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  meeting: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/><circle class="fill" cx="8" cy="15" r="1.4"/><circle class="fill" cx="12" cy="15" r="1.4"/>',
  norms: '<path d="M10 6h10M10 12h10M10 18h10"/><path d="m3.5 6 1.3 1.3L7.5 4.6M3.5 12l1.3 1.3 2.7-2.7M3.5 18l1.3 1.3 2.7-2.7"/>',
  resource: '<path d="M20.5 11.5 12 20a5 5 0 0 1-7-7l8.5-8.5a3.5 3.5 0 0 1 5 5L10.5 17.5a2 2 0 0 1-3-3L15 7"/>',
  plan: '<circle cx="12" cy="12" r="3.2"/><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-30 12 12)"/><circle class="fill" cx="19.5" cy="6" r="1.6"/>',
  glossary: '<path d="M4 5h16v11H10l-5 4v-4H4z"/><path d="m7.5 13 2.2-5.5 2.3 5.5M8.3 11.2h2.8"/><circle cx="15.5" cy="11.5" r="1.6"/><path d="M17.1 10v3"/>',
  settings: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  history: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3 4v5h5"/><path d="M12 8v4.5l3 2"/>',
  guide: '<path d="M12 3c.8 4.3 2.7 6.2 7 7-4.3.8-6.2 2.7-7 7-.8-4.3-2.7-6.2-7-7 4.3-.8 6.2-2.7 7-7z"/><path d="M19 16v4M17 18h4"/>',
  listen: '<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6"/><path d="M18.2 6.5a8 8 0 0 1 0 11"/>',
  play: '<circle cx="12" cy="12" r="9"/><path class="fill" d="M10 8.5v7l6-3.5z"/>',
  pause: '<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>',
  done: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  half: '<path d="M6 12h12"/>',
  empty: '<circle cx="12" cy="12" r="1.5" class="fill"/>',
  home: '<circle cx="12" cy="12" r="2.6"/><circle cx="12" cy="12" r="8.5" stroke-dasharray="2 3.4"/><circle class="fill" cx="18" cy="6" r="1.8"/><circle class="fill" cx="6" cy="18" r="1.8"/>',
  unit: '<path d="M4 7h16v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M4 7l2-3h12l2 3"/><path d="M10 12h4"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/><circle class="fill" cx="12" cy="15.5" r="1.4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  share: '<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5"/><path d="M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6"/>',
  paste: '<rect x="5" y="4" width="14" height="17" rx="2.5"/><path d="M9 3h6v3H9z"/><path d="M9 11h6M9 15h4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  note: '<path d="M5 4h14v12l-4 4H5z"/><path d="M15 20v-4h4M8.5 9h7M8.5 12.5h5"/>',
  person: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>'
};
const icon = (name, cls = 'ico') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;

/* ---------------------------------------------------------------- helpers */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => 'x' + (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 11);
const clone = o => JSON.parse(JSON.stringify(o));
const todayISO = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const fmtDate = (iso, opts = { weekday: 'short', month: 'short', day: 'numeric' }) => {
  if (!iso) return '';
  const d = new Date(String(iso).length <= 10 ? iso + 'T12:00:00' : iso);
  return isNaN(d) ? '' : d.toLocaleDateString(undefined, opts);
};
const initials = name => String(name || '?').replace(/^(Ms|Mr|Mrs|Dr|Mx)\.?\s+/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';
const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
const LETTERS = 'ABCDEFGH';
const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};

function toast(text) {
  $$('.toast').forEach(t => t.remove());
  const t = document.createElement('div');
  t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = text;
  document.body.append(t);
  setTimeout(() => t.remove(), 3200);
}

/* Builds a dialog from HTML. Resolves with the submitted FormData, or null if cancelled. */
function ask(html, { onOpen } = {}) {
  return new Promise(resolve => {
    const d = document.createElement('dialog');
    d.innerHTML = `<form method="dialog">${html}</form>`;
    document.body.append(d);
    const form = $('form', d);
    let result = null;
    form.addEventListener('submit', e => { e.preventDefault(); result = new FormData(form); d.close(); });
    $$('[data-cancel]', d).forEach(b => b.addEventListener('click', () => d.close()));
    d.addEventListener('close', () => { d.remove(); resolve(result); });
    d.showModal();
    onOpen && onOpen(d);
  });
}

/* ------------------------------------------------------------ voice (Zava) */
const voice = {
  pick() {
    if (!window.speechSynthesis) return null;
    const vs = speechSynthesis.getVoices();
    return vs.find(v => /en(-|_)US/i.test(v.lang) && /natural|samantha|aria|jenny|google/i.test(v.name)) || vs.find(v => /^en/i.test(v.lang)) || null;
  },
  say(text, onEnd) {
    if (!window.speechSynthesis) { onEnd && setTimeout(onEnd, Math.max(3000, text.split(' ').length * 350)); return false; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = this.pick(); if (v) u.voice = v;
    u.rate = 0.98;
    if (onEnd) { u.onend = onEnd; u.onerror = onEnd; }
    speechSynthesis.speak(u);
    return true;
  },
  stop() { window.speechSynthesis && speechSynthesis.cancel(); }
};
if (window.speechSynthesis) speechSynthesis.onvoiceschanged = () => {};

/* ---------------------------------------------------------- PLC glossary */
/* fam, plain words Launchpad uses, PLC term, meaning, example */
const WORDS = [
  ['learn', 'Must-learn skill', 'Essential standard', 'One of the few skills your team agrees every student must master, no matter whose class they are in.', 'Of 22 drafting standards, the team picks "sketch an object in three views" because every later unit depends on it.'],
  ['learn', 'Big standard · one skill inside it', 'Broad standard · specific indicator', 'The state groups skills under a big standard. You can pick the whole thing, or just one skill inside it, which is usually easier to teach and check.', 'B2.0 is the big standard on sketching. B2.1 is one skill inside it.'],
  ['learn', '"I can" statement', 'Learning target', 'The skill rewritten in words a student understands, usually starting with "I can". Each one should be something a short check can see.', '"I can sketch the front, top and side views of a simple object."'],
  ['learn', 'Why this skill made the cut', 'Endurance · leverage · readiness', 'Three tests for a must-learn skill: it lasts beyond this year (endurance), it is used in other subjects (leverage), and students need it for what comes next (readiness).', 'Measuring is used in math and science too, so it has leverage.'],
  ['check', 'Proficiency score', 'Proficiency', 'The percentage on the team check that shows a student has learned the skill. A student at or above it is proficient. The team agrees on it before anyone sees results.', '75% on the team check, or 6 of 8 points.'],
  ['check', 'Team check', 'Common formative assessment (CFA)', '"Common" means every teacher gives the same check. "Formative" means it happens during learning, while there is still time to help.', 'A 4-question exit ticket every 9th-grade class takes on Thursday.'],
  ['check', 'SMART goal (team goal)', 'SMART goal', 'A clear target: how many students will show the skill, on which check, by what date. SMART stands for specific, measurable, attainable, results-oriented and time-bound.', 'By Dec 3, 80% of our students will score 75% or higher on the sketching check.'],
  ['check', 'Where students started', 'Baseline', 'How students did before the teaching, so the team can see growth.', '40% of students were proficient on the pre-check.'],
  ['check', 'Scoring practice together', 'Calibration', 'Teachers score the same few pieces of student work, then talk until they score them the same way.', 'Everyone scores three sketches, then compares.'],
  ['check', 'Student work', 'Evidence of learning', 'Anything students produce that shows what they know: answers, sketches, explanations, projects.', ''],
  ['check', 'Not scored yet', 'Awaiting evidence', 'A student row with a missing score. It is left out of results until it is complete.', ''],
  ['check', 'Hidden to protect privacy', 'Minimum group size', 'Team results stay hidden until at least 5 students from 3 teachers are scored, so no one teacher\'s class can be singled out.', ''],
  ['check', 'Looking at results together', 'Collective inquiry', 'The team studies evidence together to find out what works, instead of guessing.', ''],
  ['reteach', 'Reteach time', 'Intervention (Tier 2)', 'Extra small-group time, with a different approach, for students who have not learned the skill yet. It is in addition to regular class.', 'Two 20-minute sessions with paper models instead of a worksheet.'],
  ['reteach', 'Re-check', 'Follow-up assessment', 'A second short check after reteaching, to see whether it worked.', ''],
  ['reteach', 'What worked for us', 'Shared instructional practice', 'A teaching move a teammate shares after their students did especially well, so everyone can try it.', ''],
  ['stretch', 'Stretch', 'Extension / enrichment', 'Going deeper with the same skill for students who already know it, at the same time others get reteaching.', 'Sketch an object with a hidden feature and explain the hidden lines.'],
  ['team', 'Team agreements', 'Norms', 'How your team agrees to work together, like starting on time and assuming good intent. Revisit them often.', ''],
  ['team', 'Team time', 'Collaborative team meeting', 'Your weekly time together. Launchpad keeps the agenda, notes, decisions and where you stopped.', ''],
  ['team', 'Team lead · subject lead', 'PLC team lead · subject coordinator', 'The people who help organize a team\'s work and a subject\'s teams.', ''],
  ['team', 'Plan for one skill', 'PLC cycle', 'One must-learn skill taken through all four questions, from choosing it to stretching the students who are already proficient.', '']
];
const term = name => WORDS.find(w => w[2] === name || w[1] === name);

/* A dashed "PLC term" chip that opens a short definition with a Hear it button. */
function termChip(name, fam) {
  const w = term(name); if (!w) return '';
  const id = 'def-' + Math.random().toString(36).slice(2, 8);
  return `<span class="f-${fam || w[0]}" style="display:grid;gap:8px;justify-items:start">
    <button type="button" class="term" aria-expanded="false" aria-controls="${id}" data-act="toggleTerm"><span class="tag">PLC term</span>${esc(w[2])}</button>
    <span class="def" id="${id}" hidden><b>${esc(w[2])}</b><span>${esc(w[3])}</span>${w[4] ? `<span class="example"><i>Example:</i> ${esc(w[4])}</span>` : ''}
      <span class="row"><button type="button" class="btn sm" data-act="say" data-text="${esc(w[2] + '. ' + w[3] + (w[4] ? ' For example: ' + w[4] : ''))}">${icon('listen')}Hear it</button>
      <a class="btn sm ghost" href="#words">${icon('glossary')}All PLC words</a></span></span></span>`;
}

/* Zava's help is folded away until someone asks for it, so each step shows only what to do. */
function zava(text, example, fam = 'learn') {
  return `<details class="zava f-${fam}"><summary><span class="z" aria-hidden="true">${icon('guide')}</span><span>Need help? Tips${example ? ' and an example' : ''} from Zava, your plan guide</span></summary>
    <div class="say"><span>${text}</span>${example ? `<div class="example"><i>Example:</i> ${example}</div>` : ''}
    <span><button type="button" class="btn sm soft" data-act="say" data-text="${esc(String(text).replace(/<[^>]+>/g, ''))}">${icon('listen')}Listen</button></span></div></details>`;
}

const privacyNote = text => `<p class="privacy">${icon('lock')}<span>${text}</span></p>`;

/* ------------------------------------------------------------ plan steps */
const FAMILIES = {
  learn: { n: 1, word: 'Learn', q: 'What must every student learn?' },
  check: { n: 2, word: 'Check', q: 'How will we know they learned it?' },
  reteach: { n: 3, word: 'Reteach', q: 'What if a student hasn\'t learned it yet?' },
  stretch: { n: 4, word: 'Stretch', q: 'What if a student already knows it?' }
};
const STEPS = [
  { key: 'skill', fam: 'learn', label: 'Choose the skill', icon: 'standard', minutes: 20,
    q: 'Which skill matters most right now?', what: 'Pick one must-learn skill from your state standards. Choosing one specific skill makes the rest of the plan much easier.', term: 'Essential standard' },
  { key: 'targets', fam: 'learn', label: 'Write "I can" statements', icon: 'target', minutes: 15,
    q: 'What will students say they can do?', what: 'Rewrite the skill in student words. Most plans need one to three "I can" statements.', term: 'Learning target' },
  { key: 'gotit', fam: 'learn', label: 'Set the proficiency score', icon: 'score', minutes: 10,
    q: 'What score shows a student is proficient?', what: 'Agree on the percentage a student needs on the team check. Decide it before anyone sees results.', term: 'Proficiency' },
  { key: 'build', fam: 'check', label: 'Build the team check', icon: 'check', minutes: 25,
    q: 'What will be on the team check?', what: 'Write a short check every teacher gives the same way. Tie each question to an "I can" statement.', term: 'Common formative assessment (CFA)' },
  { key: 'goal', fam: 'check', label: 'Set our SMART goal', icon: 'goal', minutes: 10,
    q: 'What is our SMART goal?', what: 'Say what share of students will be proficient on the team check, and by when. Launchpad writes the goal sentence for you.', term: 'SMART goal' },
  { key: 'scores', fam: 'check', label: 'Enter scores', icon: 'score', minutes: 15,
    q: 'How did your students do?', what: 'Each teacher enters their own classes. Your team only ever sees totals.', term: 'Evidence of learning' },
  { key: 'results', fam: 'check', label: 'Look at results together', icon: 'results', minutes: 20,
    q: 'What did the check show us?', what: 'Read the team results together, talk about them, and decide what to do next.', term: 'Collective inquiry' },
  { key: 'reteach', fam: 'reteach', label: 'Plan reteaching', icon: 'reteach', minutes: 20,
    q: 'How will we reteach students who aren\'t proficient yet?', what: 'Plan extra time and a different approach. Ideas your teammates shared show up here.', term: 'Intervention (Tier 2)' },
  { key: 'recheck', fam: 'reteach', label: 'Re-check', icon: 'recheck', minutes: 15,
    q: 'Did the reteaching work?', what: 'Give a short second check to the students you retaught, and enter their scores.', term: 'Follow-up assessment' },
  { key: 'stretch', fam: 'stretch', label: 'Plan the stretch', icon: 'stretch', minutes: 15,
    q: 'How will we stretch students who are already proficient?', what: 'Plan something deeper, not just more of the same, that runs while others are retaught.', term: 'Extension / enrichment' },
  { key: 'wrap', fam: 'stretch', label: 'Did we reach our goal?', icon: 'goal', minutes: 15,
    q: 'Did we reach our goal?', what: 'Compare results with your team goal, write down what you learned, and choose what comes next.', term: 'PLC cycle' }
];
const step = key => STEPS.find(s => s.key === key);

/* -------------------------------------------------------------- the state */
function blankState(name = 'Our PLC team', course = '', catalogs = ['engineering']) {
  return { schema: 'launchpad-1', team: { name, course, grade: '', catalogs }, members: [], norms: [], plans: [], activePlanId: null,
    meetings: [], strategies: [], invites: {}, createdAt: new Date().toISOString() };
}
function blankPlan() {
  return { id: uid(), title: '', standardIds: [], why: [], targets: [], gotIt: 80, gotItNote: '',
    check: { name: '', date: '', items: [] }, goal: { baseline: '', target: 80, date: '' },
    scores: [], results: { notes: '', decision: '' }, reteach: { leader: '', when: '', how: '', groups: '' },
    stretch: { activity: '', how: [], materials: '' }, wrap: { reflection: '', next: '' }, steps: {}, talk: {}, createdAt: new Date().toISOString() };
}

let S = null;              // the team workspace
let ME = null;             // id of the teacher using this device
const APP = { mode: 'local', status: 'saved', etag: '', wsId: '', root: '', directory: null, catalogs: {}, teamKey: 'demo', demo: false };

const planById = id => S.plans.find(p => p.id === id);
const activePlan = () => planById(S.activePlanId) || S.plans[0] || null;
const member = id => S.members.find(m => m.id === id);
const memberName = id => member(id)?.name || 'A teammate';

/* ---------------------------------------------------------------- standards */
function catalogStandards() {
  const out = [];
  for (const key of S.team.catalogs || []) {
    const cat = APP.catalogs[key]; if (!cat) continue;
    for (const s of cat.standards) out.push({ ...s, catalog: key, catalogTitle: cat.title || key });
  }
  return out;
}
const standardById = id => catalogStandards().find(s => s.id === id) || Object.values(APP.catalogs).flatMap(c => c.standards).find(s => s.id === id);
const isBroad = s => /\.0$/.test(s.code || '');
const parentCode = s => (s.code || '').replace(/\.\d+$/, '.0');

/* --------------------------------------------------------- scores & results */
/* Optional letter grade beside each percentage (standard 90/80/70/60 scale). */
const letterGrade = v => (v >= 90 ? 'A' : v >= 80 ? 'B' : v >= 70 ? 'C' : v >= 60 ? 'D' : 'F');
const scoreText = (p, v) => (p.scoreAs === 'letter' ? `${v}% · ${letterGrade(v)}` : `${v}%`);
const maxPoints = p => p.check.items.reduce((a, i) => a + (Number(i.points) || 0), 0);
function rowResult(p, row) {
  const items = p.check.items;
  if (!items.length) return { complete: false };
  const vals = items.map(i => row.s?.[i.id]);
  const complete = vals.every(v => v !== '' && v != null && !isNaN(Number(v)));
  const total = vals.reduce((a, v) => a + (Number(v) || 0), 0);
  const max = maxPoints(p);
  const per = {};
  for (const t of p.targets) {
    const its = items.filter(i => i.targetId === t.id);
    const tmax = its.reduce((a, i) => a + (Number(i.points) || 0), 0);
    if (!tmax) continue;
    const tgot = its.reduce((a, i) => a + (Number(row.s?.[i.id]) || 0), 0);
    per[t.id] = complete ? (100 * tgot) / tmax >= p.gotIt : null;
  }
  const score = max ? Math.round((100 * total) / max) : 0;
  return { complete, total, max, score, got: complete && max > 0 && (100 * total) / max >= p.gotIt, per };
}
function stats(p, { kind = 'first', teacherId = null } = {}) {
  const sets = p.scores.filter(s => (s.kind || 'first') === kind && (!teacherId || s.teacherId === teacherId));
  const rows = sets.flatMap(s => s.rows.map(r => ({ ...r, teacherId: s.teacherId })));
  const done = rows.map(r => ({ r, res: rowResult(p, r) })).filter(x => x.res.complete);
  const teachers = new Set(done.map(x => x.r.teacherId));
  const per = {};
  for (const t of p.targets) {
    const scored = done.filter(x => x.res.per[t.id] != null);
    per[t.id] = { n: scored.length, got: scored.filter(x => x.res.per[t.id]).length };
    per[t.id].pct = pct(per[t.id].got, per[t.id].n);
  }
  const got = done.filter(x => x.res.got).length;
  return { n: done.length, waiting: rows.length - done.length, got, pct: pct(got, done.length), teachers: teachers.size, per };
}
const PRIVACY_MIN_STUDENTS = 5, PRIVACY_MIN_TEACHERS = 3;
const teamUnlocked = st => st.n >= PRIVACY_MIN_STUDENTS && st.teachers >= PRIVACY_MIN_TEACHERS;

/* Invitations to share: offered only to a teacher whose students beat the team on an "I can" statement. */
function invitationsFor(teacherId) {
  if (!teacherId) return [];
  const out = [];
  for (const p of S.plans) {
    const team = stats(p); if (!teamUnlocked(team)) continue;
    const mine = stats(p, { teacherId }); if (mine.n < 3) continue;
    for (const t of p.targets) {
      const key = p.id + ':' + t.id, a = mine.per[t.id], b = team.per[t.id];
      if (!a || !b || !a.n || a.pct <= b.pct) continue;
      const answered = S.invites[teacherId]?.[key];
      const shared = S.strategies.some(s => s.planId === p.id && s.targetId === t.id && s.teacherId === teacherId);
      if (shared || answered === 'never' || (answered && answered.startsWith('later:') && answered.slice(6) > new Date().toISOString())) continue;
      out.push({ plan: p, target: t, mine: a.pct, team: b.pct, key });
    }
  }
  return out;
}

/* -------------------------------------------------------- step progress */
function stepState(p, key) {
  if (p.steps[key]?.done) return 100;
  const started = {
    skill: p.standardIds.length > 0, targets: p.targets.some(t => t.text.trim()), gotit: !!p.gotItNote,
    build: p.check.items.length > 0 || !!p.check.name, goal: !!p.goal.date, scores: p.scores.some(s => (s.kind || 'first') === 'first' && s.rows.length),
    results: !!p.results.notes, reteach: !!(p.reteach.how || p.reteach.leader), recheck: p.scores.some(s => s.kind === 'recheck' && s.rows.length),
    stretch: !!p.stretch.activity, wrap: !!p.wrap.reflection
  }[key];
  return started ? 50 : 0;
}
const famProgress = (p, fam) => { const ss = STEPS.filter(s => s.fam === fam); return Math.round(ss.reduce((a, s) => a + stepState(p, s.key), 0) / ss.length); };
const nextStep = p => STEPS.find(s => stepState(p, s.key) < 100) || STEPS[STEPS.length - 1];
const planDone = p => STEPS.every(s => stepState(p, s.key) === 100);
function planTitle(p) {
  const t = p.targets.find(t => t.text.trim());
  if (p.title) return p.title;
  if (t) return t.text;
  const s = p.standardIds.length && standardById(p.standardIds[0]);
  return s ? s.text : 'New plan';
}
const pipHTML = p => `<span class="pips" aria-label="Progress through the four questions">${Object.keys(FAMILIES).map(f => {
  const v = famProgress(p, f); return `<b class="f-${f} ${v >= 100 ? 'on' : v > 0 ? 'half' : ''}"></b>`; }).join('')}</span>`;
const tokHTML = (v, ic) => `<span class="tok ${v >= 100 ? 'done' : ''}" style="--p:${v}"><i>${icon(v >= 100 ? 'done' : v > 0 ? 'half' : ic || 'empty')}</i></span>`;

/* ------------------------------------------------------------------ meetings */
const runningMeeting = () => S.meetings.find(m => m.startedAt && !m.endedAt);
const lastMeeting = () => S.meetings.filter(m => m.endedAt).sort((a, b) => (a.endedAt < b.endedAt ? 1 : -1))[0] || null;
const openTodos = () => S.meetings.flatMap(m => (m.todos || []).map(t => ({ ...t, meetingId: m.id }))).filter(t => !t.done);
function suggestedAgenda(p) {
  const items = [{ id: uid(), topic: 'Check in and review our agreements', minutes: 5, kind: 'checkin', notes: '' }];
  if (openTodos().length) items.push({ id: uid(), topic: 'Follow up on last week\'s to-dos', minutes: 5, kind: 'todos', notes: '' });
  if (p) {
    const remaining = STEPS.filter(s => stepState(p, s.key) < 100);
    let left = 45 - items.reduce((a, i) => a + i.minutes, 0) - 7;
    for (const s of remaining) {
      if (left < 8) break;
      const m = Math.min(s.minutes, left);
      items.push({ id: uid(), topic: s.label, minutes: m, kind: 'step', planId: p.id, stepKey: s.key, notes: '' });
      left -= m;
    }
  }
  items.push({ id: uid(), topic: 'Wrap up: where we stopped and what\'s next', minutes: 7, kind: 'wrap', notes: '' });
  return items;
}

/* -------------------------------------------------------------- saving */
const bridge = window.__PLC || null;
let saveTimer = null;
function setStatus(s) {
  APP.status = s;
  const el = $('#saveStatus'); if (!el) return;
  el.className = 'status-dot ' + (s === 'saving' ? 'saving' : s === 'error' ? 'error' : '');
  el.querySelector('span').textContent = { saved: APP.mode === 'cloud' ? 'Saved online' : APP.demo ? 'Example team' : 'Saved in this browser', saving: 'Saving…', error: 'Not saved yet' }[s];
}
function save() {
  if (APP.mode === 'local') { store.set(localKey(), S); setStatus('saved'); return; }
  store.set('lp-pending:' + APP.wsId, S);
  setStatus('saving');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveCloud, 900);
}
const localKey = () => 'plc-launchpad-1:' + APP.teamKey;
async function api(method, path, body, headers = {}) {
  const res = await fetch(path, { method, headers: { 'Content-Type': 'application/json', ...headers }, body: body == null ? undefined : JSON.stringify(body) });
  let data = {}; try { data = await res.json(); } catch (e) {}
  return { ok: res.ok, status: res.status, data };
}
let saving = false, dirtyAgain = false;
async function saveCloud() {
  if (saving) { dirtyAgain = true; return; }
  saving = true;
  const snapshot = clone(S);
  try {
    const r = await api('PUT', '/api/demo/' + APP.wsId, { subject: APP.subject, catalogId: (S.team.catalogs || [])[0] || 'none', state: snapshot }, { 'If-Match': APP.etag });
    if (r.status === 409) { await resolveConflict(snapshot); return; }
    if (!r.ok) throw new Error(r.data.error || 'Save failed');
    APP.etag = r.data.etag;
    store.del('lp-pending:' + APP.wsId);
    setStatus('saved');
  } catch (e) {
    setStatus('error');
    toast((e && e.message) || 'Not saved yet. Launchpad will try again.');
    clearTimeout(saveTimer); saveTimer = setTimeout(saveCloud, 8000);
  } finally {
    saving = false;
    if (dirtyAgain) { dirtyAgain = false; saveCloud(); }
  }
}
/* Someone else saved first: keep a copy of ours in Version history, then load theirs. */
async function resolveConflict(mine) {
  await api('PUT', '/api/demo/' + APP.wsId + '?recovery=1', { subject: APP.subject, catalogId: (S.team.catalogs || [])[0] || 'none', state: mine });
  const r = await api('GET', '/api/demo/' + APP.wsId);
  if (r.ok && r.data.payload && !r.data.payload.fresh) { S = r.data.payload.state; APP.etag = r.data.etag; }
  store.del('lp-pending:' + APP.wsId);
  setStatus('saved');
  render();
  toast('A teammate saved at the same time. Their version is showing, and yours is kept in Version history.');
}

async function boot() {
  APP.catalogs = JSON.parse($('#catalogs').textContent);
  if (bridge) {
    if (bridge.ready) await bridge.ready;
    APP.mode = 'cloud';
    const params = bridge.params || {};
    APP.root = params.shared; APP.subject = params.course || 'engineering';
    try {
      const dir = await api('GET', '/api/directory/' + APP.root);
      if (dir.ok) APP.directory = dir.data;
      const look = await api('POST', '/api/demo/' + APP.root + '?course=' + encodeURIComponent(APP.subject));
      if (!look.ok) throw new Error(look.data.error || 'That team could not be opened.');
      APP.wsId = look.data.id;
      const got = await api('GET', '/api/demo/' + APP.wsId);
      if (!got.ok) throw new Error(got.data.error || 'That team could not be opened.');
      const team = APP.directory?.teams.find(t => (/^[0-9a-f-]{36}$/.test(t.id) ? 'team-' + t.id : t.id) === APP.subject);
      if (got.data.payload.fresh || got.data.payload.state?.schema !== 'launchpad-1') {
        S = blankState(team?.name || 'Our PLC team', '', team?.catalogs?.length ? team.catalogs : [APP.subject]);
        APP.etag = got.data.etag || '';
        if (!got.data.payload.fresh) APP.etag = got.data.etag; // older workspace: replaced on first save, kept in history
      } else { S = got.data.payload.state; APP.etag = got.data.etag; }
      const pending = store.get('lp-pending:' + APP.wsId);
      if (pending && pending.schema === 'launchpad-1' && JSON.stringify(pending) !== JSON.stringify(S)) { S = pending; save(); toast('Your unsaved changes from last time were restored.'); }
      const email = (bridge.email || '').toLowerCase();
      ME = S.members.find(m => (m.email || '').toLowerCase() === email)?.id || store.get('lp-me:' + APP.wsId);
    } catch (e) {
      document.body.innerHTML = `<main><div class="card" style="max-width:560px;margin:60px auto"><h2>This team couldn't be opened</h2><p class="muted">${esc(e.message)}</p><button class="btn" onclick="plcReload()">Try again</button></div></main>`;
      return false;
    }
  } else {
    APP.mode = 'local';
    APP.teamKey = store.get('lp-current-team') || 'demo';
    S = store.get(localKey());
    if (!S || S.schema !== 'launchpad-1') { S = APP.teamKey === 'demo' ? sampleState() : blankState(); store.set(localKey(), S); }
    APP.demo = APP.teamKey === 'demo';
    ME = store.get('lp-me:' + APP.teamKey) || (APP.demo ? 'm1' : null);
  }
  return true;
}
function setMe(id) {
  ME = id;
  store.set('lp-me:' + (APP.mode === 'cloud' ? APP.wsId : APP.teamKey), id);
}

/* ------------------------------------------------------- the example team */
function sampleState() {
  const s = blankState('Engineering 9 · Example team', 'Introduction to Engineering Design', ['engineering']);
  s.team.grade = 'Grade 9';
  s.members = [
    { id: 'm1', name: 'Ms. Alvarez', email: 'alvarez@example.org', role: 'Team lead', periods: '1, 3' },
    { id: 'm2', name: 'Mr. Chen', email: 'chen@example.org', role: 'Teacher', periods: '2, 4' },
    { id: 'm3', name: 'Ms. Okafor', email: 'okafor@example.org', role: 'Teacher', periods: '5' },
    { id: 'm4', name: 'Mr. Delgado', email: 'delgado@example.org', role: 'Teacher', periods: '6' }
  ];
  s.norms = [
    { id: uid(), text: 'We start and end on time.' },
    { id: uid(), text: 'We talk about all of our students as "our" students.' },
    { id: uid(), text: 'Data is about learning, not about judging teachers.' },
    { id: uid(), text: 'Everyone leaves with a clear next step.' }
  ];
  const p = blankPlan();
  p.standardIds = ['ca-cte-ea-B2.1'];
  p.why = ['Needed for what comes next', 'Lasts beyond this year'];
  p.targets = [{ id: 'tA', text: 'I can sketch the front, top and side views of a simple object.' }, { id: 'tB', text: 'I can line up the views so their sizes match.' }];
  p.gotIt = 75; p.gotItNote = 'A proficient student draws all three views in the right places with matching sizes. Small line wobbles are fine.';
  p.check = { name: 'Three-view sketch check', date: addDays(todayISO(), -6), items: [
    { id: 'i1', prompt: 'Sketch the front view of the block shown.', points: 2, targetId: 'tA', guide: '2: correct shape and features · 1: shape right, features missing' },
    { id: 'i2', prompt: 'Sketch the top view.', points: 2, targetId: 'tA', guide: '' },
    { id: 'i3', prompt: 'Sketch the right side view.', points: 2, targetId: 'tA', guide: '' },
    { id: 'i4', prompt: 'Draw projection lines to show the views line up.', points: 2, targetId: 'tB', guide: '2: widths and heights match across views' }] };
  p.goal = { baseline: 40, target: 80, date: addDays(todayISO(), 21) };
  let n = 1001;
  const mk = (teacherId, period, skill) => ({ id: uid(), teacherId, period, kind: 'first', rows: Array.from({ length: 9 }, (_, k) => {
    const r = (k * 7 + teacherId.charCodeAt(1) * 3) % 10;
    const a = Math.min(2, Math.max(0, Math.round(skill + (r - 5) / 4)));
    return { id: uid(), student: String(n++), s: { i1: a, i2: Math.min(2, a + (r % 3 === 0 ? 0 : 0)), i3: Math.max(0, a - (r % 4 === 0 ? 1 : 0)), i4: Math.max(0, Math.min(2, a - (r % 2))) } };
  }) });
  p.scores = [mk('m1', 'Period 1', 2.3), mk('m2', 'Period 2', 1.8), mk('m3', 'Period 5', 1.6), mk('m4', 'Period 6', 1.9)];
  p.steps = { skill: { done: true }, targets: { done: true }, gotit: { done: true }, build: { done: true }, goal: { done: true }, scores: { done: true } };
  p.talk = { build: [{ id: uid(), at: addDays(todayISO(), -14), by: 'm2', text: 'Agreed to use the same wooden block photo for every class.' }] };
  s.plans = [p]; s.activePlanId = p.id;
  const p2 = blankPlan();
  p2.standardIds = ['ca-cte-ea-B7.3']; p2.targets = [{ id: uid(), text: 'I can measure to the nearest 1/16 inch.' }];
  p2.steps = { skill: { done: true } };
  s.plans.push(p2);
  const last = addDays(todayISO(), -7);
  s.meetings = [{ id: uid(), date: last, planId: p.id, startedAt: last + 'T15:00:00', endedAt: last + 'T15:45:00', minutes: 45,
    attendance: ['m1', 'm2', 'm3', 'm4'],
    agenda: [{ id: uid(), topic: 'Check in and review our agreements', minutes: 5, kind: 'checkin', notes: '' },
      { id: uid(), topic: 'Enter scores', minutes: 20, kind: 'step', planId: p.id, stepKey: 'scores', notes: 'Everyone finished entering scores during the meeting.' },
      { id: uid(), topic: 'Wrap up: where we stopped and what\'s next', minutes: 7, kind: 'wrap', notes: '' }],
    discussion: 'Several students drew the views in the wrong places. We think the orientation of the block is confusing them.',
    decisions: 'Results conversation next week. Bring two student sketches each: one strong, one that missed.',
    todos: [{ id: uid(), text: 'Bring two student sketches (one strong, one that missed)', ownerId: 'all', due: todayISO(), done: false },
      { id: uid(), text: 'Find a short video on orthographic projection', ownerId: 'm3', due: todayISO(), done: false }],
    stoppedAt: { planId: p.id, stepKey: 'results' }, nextTime: 'Look at results together and plan reteaching for target B.' }];
  s.strategies = [{ id: uid(), planId: p2.id, targetId: p2.targets[0].id, teacherId: 'm2', anonymous: false, text: 'I had students measure their own desks and phones first, then trade and check each other\'s measurements before the worksheet.', tags: ['Hands-on', 'Partner check'], link: '', mine: 86, team: 71, sharedAt: addDays(todayISO(), -30) }];
  return s;
}
