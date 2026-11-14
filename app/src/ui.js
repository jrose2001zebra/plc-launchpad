/* PLC Launchpad 2.0 · shell, routing, binding, the launchpad homepage, plans list */

const AREAS = { home: 'a-plans', plans: 'a-plans', plan: 'a-plans', meetings: 'a-meet', meeting: 'a-meet', assess: 'a-assess', worked: 'a-assess', settings: 'a-set', help: 'a-set' };

function route() {
  const h = decodeURIComponent(location.hash.replace(/^#/, '')) || 'home';
  const [page, a, b] = h.split('-');
  return { page, a, b, raw: h };
}
const go = hash => { if (location.hash === '#' + hash) render(); else location.hash = hash; };

function shell() {
  const m = runningMeeting();
  return `<header class="top"><div class="top-in">
    <a class="brand" href="#home" aria-label="PLC Launchpad home"><svg width="28" height="28" viewBox="0 0 34 34" aria-hidden="true"><circle cx="17" cy="17" r="8" fill="var(--plans)"/><ellipse cx="17" cy="17" rx="15" ry="6.5" fill="none" stroke="var(--meet)" stroke-width="2.5" transform="rotate(-30 17 17)"/></svg>PLC Launchpad</a>
    <button class="team-name" type="button" data-act="switchTeam" title="Switch team">${esc(S.team.name)}</button>
    <span class="spacer"></span>
    ${m ? `<a class="timer-pill" href="#meeting-${m.id}">${icon('clock')}Meeting <b data-timer>--:--</b></a>` : ''}
    <span class="status-dot" id="saveStatus"><i></i><span></span></span>
  </div></header>`;
}

/* "Home › Plans › …" so you always know where you are and how to get back. */
function crumbs(r) {
  const out = [['Home', 'home']];
  const p = r.a && planById(r.a);
  const short = t => (t.length > 46 ? t.slice(0, 45) + '…' : t);
  if (r.page === 'plans') out.push(['Plans']);
  if (r.page === 'plan' && p) { out.push(['Plans', 'plans']); if (r.b) { out.push([short(planTitle(p)), 'plan-' + p.id]); out.push([step(r.b)?.label || '']); } else out.push([short(planTitle(p))]); }
  if (r.page === 'meetings') out.push(['Meetings']);
  if (r.page === 'meeting') { const m = S.meetings.find(x => x.id === r.a); out.push(['Meetings', 'meetings'], [m ? fmtDate(m.date, { weekday: 'long', month: 'short', day: 'numeric' }) : 'Meeting']); }
  if (r.page === 'assess') { out.push(['Assessments & Results', r.a ? 'assess' : null]); if (p && r.b) out.push([{ build: 'Common assessment', scores: 'Enter scores', results: 'Team results' }[r.b] || '']); }
  if (r.page === 'worked') out.push(['Assessments & Results', 'assess'], ['What worked for us']);
  if (r.page === 'settings') out.push(['Team settings']);
  if (r.page === 'help') out.push(['Help and PLC words']);
  if (out.length === 1) return '';
  return `<nav class="crumbs" aria-label="You are here">${out.map(([label, href], i) => (i ? icon('arrow') : '') + (href ? `<a href="#${href}">${esc(label)}</a>` : `<span aria-current="page">${esc(label)}</span>`)).join('')}</nav>`;
}

function render() {
  const r = route();
  const views = { home: viewHome, plans: viewPlans, plan: viewPlan, meetings: viewMeetings, meeting: viewMeeting, assess: viewAssess, worked: viewWorked, settings: viewTeam, help: viewWords };
  const view = views[r.page] || viewHome;
  const scrollY = window.scrollY, focusId = document.activeElement?.id;
  const sameView = render.last === r.raw;
  document.getElementById('app').innerHTML = shell() + `<main id="main" class="${AREAS[r.page] || 'a-plans'}">${APP.demo && r.page === 'home' ? demoBanner() : ''}${crumbs(r)}${view(r)}</main>`;
  setStatus(APP.status);
  tickTimer();
  if (sameView) { window.scrollTo(0, scrollY); if (focusId) document.getElementById(focusId)?.focus(); }
  else window.scrollTo(0, 0);
  render.last = r.raw;
  const titles = { home: 'Home', plans: 'Plans', plan: 'Plan', meetings: 'Meetings', meeting: 'Meeting', assess: 'Assessments & Results', worked: 'What worked for us', settings: 'Team settings', help: 'Help' };
  document.title = (titles[r.page] || 'Home') + ' · PLC Launchpad';
}
function demoBanner() {
  return `<div class="demo-banner">${icon('spark')}<span>This is an example team. Try anything; it only saves in this browser.</span><button class="btn sm ghost" data-act="startOwnTeam">Start our own team</button></div>`;
}

/* ---------- binding: inputs with data-bind write straight into the workspace ---------- */
function scopeObj(scope) {
  const r = route();
  if (scope === 'p') return planById(r.a);
  if (scope === 'm') return S.meetings.find(m => m.id === r.a);
  return S;
}
function walk(obj, path) {
  const parts = path.split('.');
  let o = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    o = k.startsWith('#') ? o.find(x => x.id === k.slice(1)) : (o[k] ??= {});
    if (o == null) return [null];
  }
  return [o, parts[parts.length - 1]];
}
function setPath(obj, path, val) { const [o, k] = walk(obj, path); if (o) o[k] = val; }
document.addEventListener('input', e => {
  const el = e.target;
  if (el.matches('[data-bind]')) {
    const [scope, path] = el.dataset.bind.split(':');
    let v = el.type === 'checkbox' ? el.checked : el.value;
    if (el.dataset.type === 'number') v = v === '' ? '' : Number(v);
    setPath(scopeObj(scope), path, v);
    save();
    if (el.dataset.live) refreshLive(el.dataset.live, el);
  }
  if (el.matches('[data-filter]')) refreshLive(el.dataset.filter, el);
});
const LIVE = {};
function refreshLive(name, el) { (LIVE[name] || (() => {}))(el); }

/* ---------- actions: buttons with data-act ---------- */
const ACT = {};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const fn = ACT[b.dataset.act];
  if (fn) { e.preventDefault(); fn(b, e); }
});
ACT.toggleTerm = b => { const open = b.getAttribute('aria-expanded') !== 'true'; b.setAttribute('aria-expanded', String(open)); document.getElementById(b.getAttribute('aria-controls')).hidden = !open; };
ACT.say = b => voice.say(b.dataset.text);

ACT.switchTeam = async () => {
  if (APP.mode === 'cloud' && APP.directory) {
    const code = t => (/^[0-9a-f-]{36}$/.test(t.id) ? 'team-' + t.id : t.id);
    const live = APP.directory.teams.filter(t => !t.removed && APP.directory.subjects.some(s => s.id === t.subjectId && !s.removed));
    const fd = await ask(`<h2>Switch team</h2><div class="field"><label for="teamPick">PLC team</label><select id="teamPick" name="team">${APP.directory.subjects.filter(s => !s.removed).map(s =>
      `<optgroup label="${esc(s.name)}">${live.filter(t => t.subjectId === s.id).map(t => `<option value="${esc(code(t))}" ${code(t) === APP.subject ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</optgroup>`).join('')}</select></div>
      <div class="row end"><button type="button" class="btn ghost" data-cancel>Cancel</button><button class="btn">Open team</button></div>`);
    if (fd && fd.get('team') !== APP.subject) { voice.stop(); plcNavigate('?course=' + encodeURIComponent(fd.get('team'))); }
    return;
  }
  const teams = store.get('lp-teams') || [];
  const fd = await ask(`<h2>Switch team</h2><p class="muted">On your school's Google site, this list comes from the school directory.</p>
    <div class="field"><label for="teamPick">Team</label><select id="teamPick" name="team"><option value="demo" ${APP.teamKey === 'demo' ? 'selected' : ''}>Example team</option>${teams.map(t => `<option value="${esc(t.key)}" ${t.key === APP.teamKey ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select></div>
    <div class="row end"><button type="button" class="btn ghost" data-cancel>Cancel</button><button class="btn">Open team</button></div>`);
  if (fd) { store.set('lp-current-team', fd.get('team')); location.hash = 'home'; location.reload(); }
};
ACT.startOwnTeam = async () => {
  const fd = await ask(`<h2>Start your team</h2><div class="field"><label for="nt">Team name</label><input id="nt" name="name" type="text" required placeholder="Engineering 9 team"></div>
    <div class="field"><label for="nc">Course</label><input id="nc" name="course" type="text" placeholder="Introduction to Engineering Design"></div>
    <div class="field"><label for="ncat">Standards</label><select id="ncat" name="cat">${Object.entries(APP.catalogs).map(([k, c]) => `<option value="${k}">${esc(c.title || k)}</option>`).join('')}</select></div>
    <div class="row end"><button type="button" class="btn ghost" data-cancel>Cancel</button><button class="btn">Create team</button></div>`);
  if (!fd) return;
  const key = 't' + Date.now().toString(36);
  const teams = store.get('lp-teams') || []; teams.push({ key, name: fd.get('name') }); store.set('lp-teams', teams);
  store.set('plc-launchpad-1:' + key, blankState(fd.get('name'), fd.get('course'), [fd.get('cat')]));
  store.set('lp-current-team', key); location.hash = 'settings'; location.reload();
};

/* ---------- who's using this device ---------- */
async function needMe(reason) {
  if (ME && member(ME)) return true;
  if (!S.members.length) { toast('Add your team members first.'); go('settings'); return false; }
  const fd = await ask(`<h2>Which teacher are you?</h2><p class="muted">${esc(reason || 'Launchpad uses this to show your own classes.')}</p>
    <div class="chips">${S.members.map(m => `<label class="chip"><input type="radio" name="me" value="${m.id}" required> ${esc(m.name)}</label>`).join('')}</div>
    <div class="row end"><button type="button" class="btn ghost" data-cancel>Cancel</button><button class="btn">That's me</button></div>`);
  if (!fd) return false;
  setMe(fd.get('me')); render(); return true;
}
ACT.whoAmI = async () => { ME = null; await needMe(); };

/* ================================================================ HOME: the launchpad */
function viewHome() {
  const p = activePlan(), last = lastMeeting(), running = runningMeeting(), me = member(ME);
  const todos = openTodos(), invites = invitationsFor(ME);
  const act = (href, label, sub, main) => `<a class="act ${main ? 'main' : ''}" href="${href}">${label}${sub ? `<small>${sub}</small>` : ''}</a>`;
  const actBtn = (actName, label, sub, main) => `<button type="button" class="act ${main ? 'main' : ''}" data-act="${actName}">${label}${sub ? `<small>${sub}</small>` : ''}</button>`;

  let plans;
  if (!S.plans.length) plans = actBtn('newPlan', 'Build your first plan', 'We\'ll walk you through it, one question at a time', true);
  else if (p && !planDone(p)) { const n = nextStep(p); plans = act(`#plan-${p.id}-${n.key}`, 'Continue: ' + esc(trimTo(planTitle(p), 38)), 'Next up: ' + esc(n.label), true) + actBtn('newPlan', '+ Build a new plan'); }
  else plans = actBtn('newPlan', 'Build a new plan', 'One question at a time', true);
  if (S.plans.length) plans += act('#plans', `All our plans (${S.plans.length})`);

  let meet = running ? act(`#meeting-${running.id}`, 'Back to today\'s meeting', 'The timer is running', true)
    : actBtn('startMeeting', 'Start this week\'s meeting', '45 minutes · agenda ready', true);
  meet += act('#meetings', 'Past meetings and notes', last ? 'Last met ' + esc(fmtDate(last.date)) : '');
  if (todos.length) meet += act('#meetings', `To-dos (${todos.length})`);

  let assess;
  if (!p) assess = actBtn('newPlan', 'Start a plan first', 'Each plan has one common assessment', true);
  else if (!p.check.items.length) assess = act(`#assess-${p.id}-build`, 'Build the common assessment', esc(trimTo(planTitle(p), 40)), true);
  else { const inCount = S.members.filter(m => stats(p, { teacherId: m.id }).n).length; assess = act(`#assess-${p.id}-scores`, 'Enter scores', `${esc(p.check.name || 'Common assessment')} · ${inCount} of ${S.members.length} teachers done`, true); }
  assess += act('#assess', 'Our common assessments', 'Build, edit or print');
  if (p && p.scores.length) assess += act(`#assess-${p.id}-results`, 'Team results');
  assess += act('#worked', 'What worked for us', invites.length ? `${plural(invites.length, 'invitation')} for you` : '');

  const settings = act('#settings', 'Our team members') + act('#settings', 'Our norms') + act('#settings', 'Standards we use');

  const door = (cls, ic, title, inner) => `<section class="door ${cls}"><div class="door-head"><span class="orb">${icon(ic)}</span><h2>${title}</h2></div><div class="acts">${inner}</div></section>`;
  const welcome = last ? `${me ? 'Welcome back, ' + esc(me.name) : 'Welcome back'}` : 'Welcome to PLC Launchpad';
  return `<div class="hello"><h1>${welcome}</h1><p>What are we doing today?</p></div>
    <div class="doors">
      ${door('a-plans', 'plan', 'Plans', plans)}
      ${door('a-meet', 'meeting', 'Meetings', meet)}
      ${door('a-assess', 'check', 'Assessments &amp; Results', assess)}
      ${door('a-set', 'settings', 'Team settings', settings)}
    </div>
    <div class="home-foot"><a class="btn sm ghost" href="#help">${icon('glossary')}Help and PLC words</a>
      ${S.members.length ? `<button class="btn sm ghost" data-act="whoAmI">${icon('person')}${me ? 'You\'re ' + esc(me.name) : 'Which teacher are you?'}</button>` : ''}</div>`;
}
const trimTo = (t, n) => (t.length > n ? t.slice(0, n - 1) + '…' : t);

/* ================================================================ PLANS */
function viewPlans() {
  const cards = S.plans.map(p => {
    const s = p.standardIds.length && standardById(p.standardIds[0]);
    const done = STEPS.filter(x => stepState(p, x.key) === 100).length, n = nextStep(p);
    return `<a class="plan-card" href="#plan-${p.id}"><span class="small muted">${s ? esc(s.code) : 'No skill chosen yet'}</span><b>${esc(planTitle(p))}</b>
      <div class="bar"><i style="width:${Math.round((100 * done) / STEPS.length)}%"></i></div>
      <span class="small muted">${planDone(p) ? 'Finished' : `${done} of ${STEPS.length} steps done · next: ${esc(n.label)}`}</span></a>`;
  }).join('');
  return `<div class="page-head"><div class="lead"><h1>Our plans</h1><p>Each plan takes one must-learn skill through DuFour's four questions.</p></div>
    <button class="btn" data-act="newPlan">${icon('plus')}Build a new plan</button></div>
    ${S.plans.length ? `<div class="plan-cards">${cards}</div>` : `<div class="empty"><b>No plans yet</b><button class="btn" data-act="newPlan">Build your first plan</button></div>`}`;
}
ACT.newPlan = () => { const p = blankPlan(); S.plans.push(p); S.activePlanId = p.id; save(); go(`plan-${p.id}-skill`); };

function todoRow(t) {
  const owner = t.ownerId === 'all' ? 'Everyone' : memberName(t.ownerId);
  return `<div class="li todo ${t.done ? 'done' : ''}"><button type="button" class="check-circle" aria-pressed="${!!t.done}" aria-label="Mark done: ${esc(t.text)}" data-act="toggleTodo" data-meeting="${t.meetingId}" data-id="${t.id}">${t.done ? icon('done') : ''}</button>
    <span><b>${esc(t.text)}</b><span class="sub">${esc(owner)}${t.due ? ' · by ' + esc(fmtDate(t.due)) : ''}</span></span><span></span></div>`;
}
ACT.toggleTodo = b => {
  const m = S.meetings.find(x => x.id === b.dataset.meeting), t = m?.todos.find(x => x.id === b.dataset.id);
  if (!t) return; t.done = !t.done; save(); render(); if (t.done) toast('To-do done.');
};
