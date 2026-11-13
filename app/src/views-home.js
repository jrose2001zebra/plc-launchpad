/* PLC Launchpad 1.0 · shell, routing, binding, home, plans, tour */

const NAV = [
  ['home', 'Home', 'home', 'tool'],
  ['plans', 'Plans', 'plan', 'learn'],
  ['meetings', 'Team time', 'meeting', 'team'],
  ['results', 'Results', 'results', 'check'],
  ['worked', 'What worked', 'practice', 'reteach'],
  ['team', 'Team', 'team', 'team']
];

function route() {
  const h = decodeURIComponent(location.hash.replace(/^#/, '')) || 'home';
  const [page, a, b] = h.split('-');
  return { page, a, b, raw: h };
}
const go = hash => { if (location.hash === '#' + hash) render(); else location.hash = hash; };

function shell() {
  const r = route();
  const nav = NAV.map(([k, label, ic, fam]) => {
    const cur = r.page === k || (k === 'plans' && r.page === 'plan') || (k === 'meetings' && r.page === 'meeting');
    return `<a href="#${k}" class="f-${fam}" ${cur ? 'aria-current="page"' : ''}>${icon(ic)}<span>${label}</span></a>`;
  }).join('');
  const m = runningMeeting();
  return `<header class="top"><div class="top-in">
    <a class="brand" href="#home" aria-label="PLC Launchpad home"><svg width="32" height="32" viewBox="0 0 34 34" aria-hidden="true"><circle cx="17" cy="17" r="8" fill="var(--ink)"/><ellipse cx="17" cy="17" rx="15" ry="6.5" fill="none" stroke="var(--check)" stroke-width="2.5" transform="rotate(-30 17 17)"/><circle cx="29" cy="10" r="3" fill="var(--learn)"/></svg><span>PLC Launchpad</span></a>
    <button class="team-pill f-team" type="button" data-act="switchTeam" title="Switch team"><span class="orb">${icon('team')}</span><span>${esc(S.team.name)}</span></button>
    ${m ? `<a class="timer-pill" href="#meeting-${m.id}">${icon('clock')}Team time <b data-timer>--:--</b><span class="go">Open</span></a>` : ''}
    <nav class="nav" aria-label="Main">${nav}</nav>
    <span class="status-dot" id="saveStatus"><i></i><span></span></span>
  </div></header>`;
}

function render() {
  const r = route();
  const views = { home: viewHome, plans: viewPlans, plan: viewPlan, meetings: viewMeetings, meeting: viewMeeting, results: viewResults, worked: viewWorked, team: viewTeam, words: viewWords };
  const view = views[r.page] || viewHome;
  const scrollY = window.scrollY, focusId = document.activeElement?.id;
  const sameView = render.last === r.raw;
  document.getElementById('app').innerHTML = shell() + `<main id="main">${APP.demo ? demoBanner() : ''}${view(r)}</main>`;
  setStatus(APP.status);
  tickTimer();
  if (sameView) { window.scrollTo(0, scrollY); if (focusId) document.getElementById(focusId)?.focus(); }
  else window.scrollTo(0, 0);
  render.last = r.raw;
  const titles = { home: 'Home', plans: 'Plans', plan: 'Plan', meetings: 'Team time', meeting: 'Team time', results: 'Results', worked: 'What worked for us', team: 'Team', words: 'PLC words' };
  document.title = (titles[r.page] || 'Home') + ' · PLC Launchpad';
}
function demoBanner() {
  return `<div class="demo-banner">${icon('spark')}<span><b>You're looking at an example team.</b> Try anything; it only saves in this browser.</span><button class="btn sm" data-act="startOwnTeam">Start our own team</button></div>`;
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
function getPath(obj, path) { const [o, k] = walk(obj, path); return o ? o[k] : undefined; }

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
document.addEventListener('change', e => { if (e.target.matches('[data-bind][data-rerender]')) render(); });

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
ACT.go = b => go(b.dataset.to);

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
  const fd = await ask(`<h2>Teams in this browser</h2><p class="muted">When Launchpad runs on your school's Google site, your team list comes from the school directory instead.</p>
    <div class="field"><label for="teamPick">Open</label><select id="teamPick" name="team"><option value="demo" ${APP.teamKey === 'demo' ? 'selected' : ''}>Example team</option>${teams.map(t => `<option value="${esc(t.key)}" ${t.key === APP.teamKey ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select></div>
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
  store.set('lp-current-team', key); location.hash = 'team'; location.reload();
};

/* ---------- who's using this device ---------- */
async function needMe(reason) {
  if (ME && member(ME)) return true;
  if (!S.members.length) { toast('Add your team members first.'); go('team'); return false; }
  const fd = await ask(`<h2>Which teacher are you?</h2><p class="muted">${esc(reason || 'Launchpad uses this to show your own classes and invitations.')}</p>
    <div class="chips">${S.members.map(m => `<label class="chip"><input type="radio" name="me" value="${m.id}" required> ${esc(m.name)}</label>`).join('')}</div>
    ${privacyNote('This is remembered on this device only.')}
    <div class="row end"><button type="button" class="btn ghost" data-cancel>Cancel</button><button class="btn">That's me</button></div>`);
  if (!fd) return false;
  setMe(fd.get('me')); render(); return true;
}
ACT.whoAmI = async () => { ME = null; await needMe(); };

/* ================================================================ HOME */
function viewHome() {
  const p = activePlan();
  const last = lastMeeting();
  const running = runningMeeting();
  const me = member(ME);
  const invites = invitationsFor(ME);
  const todos = openTodos();
  let welcome;
  if (running) {
    welcome = `<div class="welcome"><span class="eyebrow" style="color:inherit;opacity:.7">Team time is running</span><h2>You're in a team meeting</h2>
      <div class="row"><a class="btn light lead-orb" href="#meeting-${running.id}"><span class="orb f-team">${icon('meeting')}</span>Back to the meeting</a></div></div>`;
  } else if (last) {
    const stop = last.stoppedAt && planById(last.stoppedAt.planId);
    const st = last.stoppedAt && step(last.stoppedAt.stepKey);
    welcome = `<div class="welcome">
      <span class="eyebrow" style="color:inherit;opacity:.7">Welcome back${me ? ', ' + esc(me.name) : ''}</span>
      <h2>${st ? `Last time (${esc(fmtDate(last.date))}) you stopped at step ${STEPS.indexOf(st) + 1}: ${esc(st.label)}.` : `Your last meeting was ${esc(fmtDate(last.date))}.`}</h2>
      ${last.nextTime ? `<p class="quote">Next time we'll… ${esc(last.nextTime)}</p>` : ''}
      <p>${plural(todos.length, 'open to-do')}${stop ? ' · ' + esc(planTitle(stop)) : ''}</p>
      <div class="row">
        <button class="btn light lead-orb" data-act="startMeeting"><span class="orb f-team">${icon('meeting')}</span>Start this week's team time</button>
        ${stop && st ? `<a class="btn ghost" href="#plan-${stop.id}-${st.key}">Go to ${esc(st.label)}</a>` : ''}
      </div></div>`;
  } else {
    welcome = `<div class="welcome"><span class="eyebrow" style="color:inherit;opacity:.7">Welcome to Launchpad</span>
      <h2>Your team works through four questions for each must-learn skill.</h2>
      <p>Launchpad walks you through every step, keeps your meeting notes, and remembers where you stopped each week.</p>
      <div class="row"><button class="btn light lead-orb" data-act="${p ? 'startMeeting' : 'newPlan'}"><span class="orb f-${p ? 'team' : 'learn'}">${icon(p ? 'meeting' : 'plus')}</span>${p ? 'Start team time' : 'Start your first plan'}</button>
      <button class="btn ghost" data-act="tour">${icon('play')}Watch the 90-second tour</button></div></div>`;
  }

  const orbit = p ? orbitSVG(p) : `<div class="empty">${icon('plan')}<b>No plans yet</b><span>A plan takes one must-learn skill through all four questions.</span><button class="btn fam f-learn" data-act="newPlan">${icon('plus')}Start a plan</button></div>`;

  const inviteHTML = invites.slice(0, 2).map(inviteCard).join('');
  const todoHTML = todos.length ? `<div class="card f-team"><div class="card-head"><span class="orb sm">${icon('norms')}</span><div class="grow"><h3>Open to-dos</h3><span class="small muted">From your team meetings</span></div></div>
    <div class="list">${todos.slice(0, 5).map(todoRow).join('')}</div></div>` : '';
  const plans = S.plans.length ? `<div class="card"><div class="card-head"><span class="orb sm f-learn">${icon('plan')}</span><div class="grow"><h3>Our plans</h3></div><a class="btn sm ghost" href="#plans">All plans</a></div>
    <div class="list">${S.plans.slice(0, 4).map(planRow).join('')}</div></div>` : '';
  const strat = S.strategies.slice(-1).map(stratCard).join('');

  return `<div class="page-head"><div class="lead"><span class="eyebrow">${esc(S.team.course || 'Team home')}</span><h1>${esc(S.team.name)}</h1></div>
    <div class="row">${me ? `<button class="btn sm soft" data-act="whoAmI">${icon('person')}You're ${esc(me.name)}</button>` : S.members.length ? `<button class="btn sm soft" data-act="whoAmI">${icon('person')}Which teacher are you?</button>` : ''}
    <button class="btn sm ghost" data-act="tour">${icon('play')}Tour</button></div></div>
    <div class="home">
      <div class="stack">${welcome}<div class="orbit-wrap">${orbit}${p ? `<p class="small muted">Showing: <b>${esc(planTitle(p))}</b>${S.plans.length > 1 ? ` · <a href="#plans">switch plan</a>` : ''}</p>` : ''}</div></div>
      <div class="stack">${inviteHTML}${todoHTML}${plans}${strat ? `<div class="stack"><div class="row"><h3 class="spacer">What worked for us</h3><a class="btn sm ghost" href="#worked">See all</a></div>${strat}</div>` : ''}</div>
    </div>`;
}

function orbitSVG(p) {
  const pos = { learn: [125, 125], check: [395, 125], reteach: [395, 395], stretch: [125, 395] };
  const C = 2 * Math.PI * 70;
  const planets = Object.entries(FAMILIES).map(([f, info]) => {
    const [x, y] = pos[f], v = famProgress(p, f);
    const first = STEPS.find(s => s.fam === f && stepState(p, s.key) < 100) || STEPS.find(s => s.fam === f);
    const label = `Question ${info.n}, ${info.word}: ${info.q} ${v}% done. Open ${first.label}.`;
    return `<a href="#plan-${p.id}-${first.key}" class="planet" aria-label="${esc(label)}"><g class="face">
      <circle class="track" cx="${x}" cy="${y}" r="70" fill="none" stroke="var(--line)" stroke-width="7"/>
      <circle cx="${x}" cy="${y}" r="70" fill="none" stroke="var(--${f})" stroke-width="7" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - v / 100)}" transform="rotate(-90 ${x} ${y})"/>
      <circle cx="${x}" cy="${y}" r="58" fill="var(--paper)" stroke="var(--${f})" stroke-width="3"/>
      <svg x="${x - 15}" y="${y - 40}" width="30" height="30" viewBox="0 0 24 24" class="ico" style="color:var(--${f})">${ICONS[f]}</svg>
      <text x="${x}" y="${y + 10}" text-anchor="middle" font-size="18" font-weight="800" fill="var(--ink)">${info.word}</text>
      <text x="${x}" y="${y + 30}" text-anchor="middle" font-size="13" fill="var(--ink-soft)" style="font-family:var(--body)">${v >= 100 ? 'Done' : v > 0 ? v + '% done' : 'Not started'}</text>
      <circle cx="${x + 50}" cy="${y - 46}" r="15" fill="var(--${f})"/>
      <text x="${x + 50}" y="${y - 41}" text-anchor="middle" font-size="15" font-weight="800" fill="var(--on-${f})">${info.n}</text></g></a>`;
  }).join('');
  const t = planTitle(p), lines = wrapText(t, 16, 3);
  return `<svg class="orbit" viewBox="0 0 520 520" role="group" aria-label="This plan's four questions">
    <circle class="ring" cx="260" cy="260" r="191"/>
    <g class="moon"><circle cx="260" cy="69" r="8" fill="var(--team)"/><animateTransform attributeName="transform" type="rotate" from="0 260 260" to="360 260 260" dur="40s" repeatCount="indefinite"/></g>
    <circle cx="260" cy="260" r="84" fill="var(--ink)"/>
    <text x="260" y="${236 - (lines.length - 1) * 9}" text-anchor="middle" font-size="12" fill="var(--sky)" opacity=".7" style="font-family:var(--body);letter-spacing:.1em">THIS PLAN</text>
    ${lines.map((l, i) => `<text x="260" y="${262 - (lines.length - 1) * 9 + i * 20}" text-anchor="middle" font-size="15" font-weight="700" fill="var(--sky)">${esc(l)}</text>`).join('')}
    ${planets}</svg>`;
}
function wrapText(text, width, maxLines) {
  const words = String(text).replace(/^I can /i, 'I can ').split(/\s+/), lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > width && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && cur) lines.push(cur);
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '') + '…';
  return lines;
}

function planRow(p) {
  const s = p.standardIds.length && standardById(p.standardIds[0]);
  const n = nextStep(p);
  return `<a class="li f-learn" href="#plan-${p.id}-${n.key}"><span class="orb sm">${icon('plan')}</span><span><b>${esc(planTitle(p))}</b><span class="sub">${s ? esc(s.code) + ' · ' : ''}${planDone(p) ? 'Finished' : 'Next: ' + esc(n.label)}</span></span>${pipHTML(p)}</a>`;
}
function todoRow(t) {
  const owner = t.ownerId === 'all' ? 'Everyone' : memberName(t.ownerId);
  return `<div class="li todo f-team ${t.done ? 'done' : ''}"><button type="button" class="check-circle" aria-pressed="${!!t.done}" aria-label="Mark done: ${esc(t.text)}" data-act="toggleTodo" data-meeting="${t.meetingId}" data-id="${t.id}">${t.done ? icon('done') : ''}</button>
    <span><b>${esc(t.text)}</b><span class="sub">${esc(owner)}${t.due ? ' · by ' + esc(fmtDate(t.due)) : ''}</span></span><span></span></div>`;
}
ACT.toggleTodo = b => {
  const m = S.meetings.find(x => x.id === b.dataset.meeting), t = m?.todos.find(x => x.id === b.dataset.id);
  if (!t) return; t.done = !t.done; save(); render(); if (t.done) toast('To-do done.');
};

ACT.newPlan = () => {
  const p = blankPlan(); S.plans.push(p); S.activePlanId = p.id; save(); go(`plan-${p.id}-skill`);
};

/* ================================================================ PLANS */
function viewPlans() {
  const cards = S.plans.map(p => {
    const s = p.standardIds.length && standardById(p.standardIds[0]);
    const n = nextStep(p), active = p.id === S.activePlanId;
    return `<div class="plan-card f-learn"><div class="row"><span class="orb sm">${icon('plan')}</span><span class="tag spacer">${s ? esc(s.code) : 'No skill chosen yet'}</span>${active ? `<span class="chip" aria-pressed="true" style="--c:var(--team);--on:var(--on-team)">On home screen</span>` : ''}</div>
      <b>${esc(planTitle(p))}</b>${pipHTML(p)}<span class="small muted">${planDone(p) ? 'Finished' : 'Next step: ' + esc(n.label)}</span>
      <div class="row"><a class="btn sm fam" href="#plan-${p.id}-${n.key}">${planDone(p) ? 'Open' : 'Continue'}${icon('arrow')}</a>
      ${active ? '' : `<button class="btn sm ghost" data-act="makeActive" data-id="${p.id}">Show on home</button>`}</div></div>`;
  }).join('');
  return `<div class="page-head"><div class="lead"><span class="eyebrow">Plans</span><h1>One plan for each must-learn skill</h1>
    <p>Each plan takes one skill through the four questions. Most teams work on one or two at a time.</p></div>
    <button class="btn fam f-learn lead-orb" data-act="newPlan"><span class="orb" style="background:var(--paper);color:var(--learn)">${icon('plus')}</span>Start a new plan</button></div>
    ${S.plans.length ? `<div class="plan-cards">${cards}</div>` : `<div class="empty">${icon('plan')}<b>No plans yet</b><button class="btn fam f-learn" data-act="newPlan">Start your first plan</button></div>`}`;
}
ACT.makeActive = b => { S.activePlanId = b.dataset.id; save(); render(); toast('This plan now shows on the home screen.'); };

/* ================================================================ TOUR */
ACT.tour = () => {
  const CH = [
    ['center', 'A PLC is a team of teachers who share one promise: every student will learn. Launchpad keeps your team\'s work for each must-learn skill in one plan.'],
    ['learn', 'Question one, in blue: what must every student learn? You choose one skill from your state standards and write it as an I can statement.'],
    ['check', 'Question two, in orange: how will we know they learned it? Every teacher gives the same short check. Each teacher enters their own scores, and the team only sees totals.'],
    ['reteach', 'Question three, in green: what if a student hasn\'t learned it yet? You plan reteaching with a new approach, then check again.'],
    ['stretch', 'Question four, in gold: what if a student already knows it? You plan a way to stretch them further.'],
    ['team', 'Your team time, in purple, keeps the agenda, notes and to-dos. When you end a meeting, Launchpad remembers where you stopped, so next week starts right there.'],
    ['share', 'When your students do better than the team on a skill, Launchpad invites you to share what you did. Sharing is always your choice.']
  ];
  const svg = `<svg viewBox="0 0 520 340" style="width:100%;height:auto;display:block" aria-hidden="true">
    <circle cx="260" cy="170" r="120" fill="none" stroke="var(--line)" stroke-width="2" stroke-dasharray="3 8"/>
    <g data-tour="center"><circle cx="260" cy="170" r="54" fill="var(--ink)"/><text x="260" y="166" text-anchor="middle" font-size="14" font-weight="800" fill="var(--sky)" style="font-family:var(--display)">Every student</text><text x="260" y="186" text-anchor="middle" font-size="14" font-weight="800" fill="var(--sky)" style="font-family:var(--display)">learns</text></g>
    ${[['learn', 175, 85, 1], ['check', 345, 85, 2], ['reteach', 345, 255, 3], ['stretch', 175, 255, 4]].map(([f, x, y]) => `<g data-tour="${f}" class="tour-p"><circle cx="${x}" cy="${y}" r="38" fill="var(--${f})"/><svg x="${x - 16}" y="${y - 16}" width="32" height="32" viewBox="0 0 24 24" class="ico" style="color:var(--on-${f})">${ICONS[f]}</svg></g>`).join('')}
    <g data-tour="team" class="tour-p"><circle cx="460" cy="170" r="30" fill="var(--team)"/><svg x="446" y="156" width="28" height="28" viewBox="0 0 24 24" class="ico" style="color:var(--on-team)">${ICONS.meeting}</svg></g>
    <g data-tour="share" class="tour-p"><circle cx="60" cy="170" r="30" fill="var(--reteach)"/><svg x="46" y="156" width="28" height="28" viewBox="0 0 24 24" class="ico" style="color:var(--on-reteach)">${ICONS.practice}</svg></g>
  </svg>`;
  ask(`<div class="row"><h2 class="spacer">How Launchpad works</h2><button type="button" class="icon-btn" data-cancel aria-label="Close">${icon('close')}</button></div>
    <div style="background:var(--wash);border-radius:28px;padding:10px">${svg}</div>
    <p id="tourCap" aria-live="polite" style="min-height:4.6em">Press play for a narrated tour. It takes about 90 seconds.</p>
    <div class="row"><button type="button" class="btn fam f-check lead-orb" id="tourPlay"><span class="orb" style="background:var(--paper);color:var(--check)">${icon('play')}</span><span>Play</span></button><span class="small muted spacer" id="tourStep">7 short parts</span></div>`, {
    onOpen(d) {
      let i = -1, playing = false, token = 0;
      const paint = () => $$('[data-tour]', d).forEach(g => { const on = i < 0 || g.dataset.tour === CH[i][0] || g.dataset.tour === 'center'; g.style.opacity = on ? 1 : 0.18; g.style.transition = 'opacity .5s'; });
      const stepTo = n => {
        const my = ++token;
        if (n >= CH.length) { playing = false; $('#tourPlay span:last-child', d).textContent = 'Play again'; i = -1; paint(); return; }
        i = n; paint();
        $('#tourCap', d).textContent = CH[n][1]; $('#tourStep', d).textContent = `Part ${n + 1} of ${CH.length}`;
        voice.say(CH[n][1], () => { if (playing && my === token) setTimeout(() => stepTo(n + 1), 400); });
      };
      $('#tourPlay', d).addEventListener('click', () => {
        if (playing) { playing = false; token++; voice.stop(); $('#tourPlay span:last-child', d).textContent = 'Play'; return; }
        playing = true; $('#tourPlay span:last-child', d).textContent = 'Pause'; stepTo(i < 0 ? 0 : i);
      });
      d.addEventListener('close', () => { token++; voice.stop(); });
    }
  });
};
