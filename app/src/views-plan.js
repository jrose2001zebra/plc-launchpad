/* PLC Launchpad 1.0 · the plan flight path and its eleven steps */

function viewPlan(r) {
  const p = planById(r.a);
  if (!p) return `<div class="empty">${icon('plan')}<b>That plan isn't here anymore.</b><a class="btn" href="#plans">See all plans</a></div>`;
  const st = step(r.b) || nextStep(p);
  const last = lastMeeting();
  const stoppedHere = last?.stoppedAt?.planId === p.id ? last.stoppedAt.stepKey : null;

  let path = `<h3>${esc(planTitle(p))}</h3>`;
  for (const [f, info] of Object.entries(FAMILIES)) {
    path += `<div class="fam-label f-${f}">${icon(f)}${info.n} · ${info.word}</div>`;
    for (const s of STEPS.filter(s => s.fam === f)) {
      path += `<a class="step-link f-${f} ${s.key === stoppedHere ? 'here' : ''}" href="#plan-${p.id}-${s.key}" ${s.key === st.key ? 'aria-current="step"' : ''}>${tokHTML(stepState(p, s.key), s.icon)}<span>${esc(s.label)}</span></a>`;
    }
  }
  const idx = STEPS.indexOf(st), prev = STEPS[idx - 1], next = STEPS[idx + 1];
  const done = stepState(p, st.key) === 100;
  const fam = FAMILIES[st.fam];
  const body = (STEP_VIEWS[st.key] || (() => ''))(p);
  const talk = (p.talk[st.key] || []);
  const meeting = runningMeeting();

  return `<div class="plan-layout">
    <nav class="path" aria-label="Plan steps">${path}<div style="padding:12px 6px 0">${pipHTML(p)}</div></nav>
    <section class="card station tint f-${st.fam}" aria-labelledby="stepTitle">
      <div class="st-head"><span class="orb lg">${icon(st.icon)}</span><div class="grow">
        <span class="eyebrow" style="color:var(--c)">Question ${fam.n} · ${fam.word} · Step ${idx + 1} of ${STEPS.length}</span>
        <h2 id="stepTitle">${esc(st.q)}</h2><p class="what">${esc(st.what)}</p>
        <div class="row" style="align-items:flex-start">${termChip(st.term, st.fam)}<button type="button" class="btn sm soft" data-act="say" data-text="${esc(st.q + ' ' + st.what)}">${icon('listen')}Read this to me</button></div>
      </div></div>
      <div class="st-body">${body}</div>
      <div class="talk f-team"><div class="card-head"><span class="orb">${icon('note')}</span><div class="grow"><h4>Team talk</h4><span class="small muted">Notes from your conversation about this step${meeting ? ' · also saved to today\'s meeting' : ''}</span></div></div>
        ${talk.map(n => `<div class="li" style="border-radius:22px"><span class="avatar">${esc(initials(memberName(n.by)))}</span><span><b style="font-weight:400">${esc(n.text)}</b><span class="sub">${esc(memberName(n.by))} · ${esc(fmtDate(n.at))}</span></span><button class="icon-btn" aria-label="Delete note" data-act="delTalk" data-id="${n.id}">${icon('trash')}</button></div>`).join('')}
        <div class="row"><input type="text" id="talkInput" placeholder="What did the team say or decide?" style="flex:1;min-width:200px"><button class="btn sm" data-act="addTalk">${icon('plus')}Add note</button></div>
      </div>
      <div class="st-foot">
        ${prev ? `<a class="btn ghost" href="#plan-${p.id}-${prev.key}">${icon('back')}${esc(prev.label)}</a>` : ''}
        <span class="spacer"></span>
        <button class="btn ${done ? 'soft' : 'fam'} lead-orb" data-act="markStep" data-step="${st.key}"><span class="orb" style="background:${done ? 'var(--c)' : 'var(--paper)'};color:${done ? 'var(--on)' : 'var(--c)'}">${icon('done')}</span>${done ? 'Done · undo' : next ? 'Mark done and go on' : 'Mark done'}</button>
        ${next ? `<a class="btn ghost" href="#plan-${p.id}-${next.key}">${esc(next.label)}${icon('arrow')}</a>` : ''}
      </div>
    </section></div>`;
}
ACT.markStep = b => {
  const p = planById(route().a), key = b.dataset.step;
  const was = p.steps[key]?.done;
  p.steps[key] = { ...(p.steps[key] || {}), done: !was, at: new Date().toISOString() };
  save();
  const next = STEPS[STEPS.indexOf(step(key)) + 1];
  if (!was && next) { toast('Step done. Next: ' + next.label); go(`plan-${p.id}-${next.key}`); } else render();
};
ACT.addTalk = () => {
  const input = $('#talkInput'), text = input.value.trim(); if (!text) { input.focus(); return; }
  const r = route(), p = planById(r.a), key = (step(r.b) || nextStep(p)).key;
  const note = { id: uid(), at: todayISO(), by: ME || '', text };
  (p.talk[key] ||= []).push(note);
  const m = runningMeeting();
  if (m) (m.stepNotes ||= []).push({ ...note, planId: p.id, stepKey: key });
  save(); render();
};
ACT.delTalk = b => { const r = route(), p = planById(r.a), key = (step(r.b) || nextStep(p)).key; p.talk[key] = (p.talk[key] || []).filter(n => n.id !== b.dataset.id); save(); render(); };

const STEP_VIEWS = {};

/* ---------------------------------------------------------------- 1 skill */
STEP_VIEWS.skill = p => {
  const chosen = p.standardIds.map(standardById).filter(Boolean);
  const why = [['Needed for what comes next', 'readiness'], ['Used in other subjects', 'leverage'], ['Lasts beyond this year', 'endurance'], ['On the state test', '']];
  return `${zava('Look for a skill students will use again and need for what comes next. If a big standard feels like too much for one plan, pick one skill inside it.',
      'Of 22 drafting standards, a team picks <b>B2.1 · sketching in three views</b>. Every later unit uses it, and a short check can show whether students have it.')}
    ${chosen.length ? chosen.map(s => `<div class="chosen"><span class="orb f-learn">${icon('standard')}</span><div class="stack" style="gap:4px"><span class="eyebrow" style="color:var(--learn)">Our must-learn skill · ${esc(s.code)}</span><b>${esc(s.text)}</b><span class="small muted">${esc(s.pathway || s.catalogTitle || '')}</span></div><button class="icon-btn" data-act="toggleStd" data-id="${s.id}" aria-label="Remove">${icon('close')}</button></div>`).join('') : ''}
    <div class="field f-learn"><span class="lbl">Why this skill made the cut</span><span class="help">Tap all that are true. PLC words: readiness, leverage, endurance.</span>
      <div class="chips">${why.map(([w, t]) => `<button type="button" class="chip" aria-pressed="${p.why.includes(w)}" data-act="toggleWhy" data-v="${esc(w)}">${esc(w)}${t ? ` <small>· ${t}</small>` : ''}</button>`).join('')}</div></div>
    <div class="field f-learn"><label for="stdSearch">${chosen.length ? 'Choose a different skill' : 'Find the skill in your state standards'}</label>
      <div class="std-tools"><input type="search" id="stdSearch" placeholder="Search by word or code, like sketch or B2" data-filter="std"></div>
      <div class="std-list" id="stdList">${stdListHTML(p, '')}</div></div>`;
};
function stdListHTML(p, q) {
  const all = catalogStandards();
  if (!all.length) return `<div class="empty">No standards are set for this team. Choose them on the Team page.</div>`;
  const ql = q.trim().toLowerCase();
  const match = s => !ql || (s.code + ' ' + s.text + ' ' + (s.pathway || '')).toLowerCase().includes(ql);
  const out = [];
  for (const s of all) {
    const broad = isBroad(s);
    const kids = broad ? all.filter(k => !isBroad(k) && parentCode(k) === s.code && k.catalog === s.catalog) : [];
    if (!broad && all.some(b => isBroad(b) && b.code === parentCode(s) && b.catalog === s.catalog)) continue; // listed under its parent
    if (!match(s) && !kids.some(match)) continue;
    out.push(stdBtn(p, s, broad ? 'Big standard' : 'Skill'));
    for (const k of kids) if (match(k) || match(s)) out.push(stdBtn(p, k, 'One skill inside it', true));
  }
  return out.join('') || `<div class="empty">Nothing matches "${esc(q)}". Try a shorter word.</div>`;
}
const stdBtn = (p, s, kind, child) => `<button type="button" class="std ${isBroad(s) ? 'broad' : ''} ${child ? 'child' : ''}" aria-pressed="${p.standardIds.includes(s.id)}" data-act="toggleStd" data-id="${s.id}"><span class="code">${esc(s.code)}</span><span><span class="kind">${kind}</span>${esc(s.text)}</span></button>`;
LIVE.std = el => { const p = planById(route().a); $('#stdList').innerHTML = stdListHTML(p, el.value); };
ACT.toggleStd = b => {
  const p = planById(route().a), id = b.dataset.id;
  p.standardIds = p.standardIds.includes(id) ? p.standardIds.filter(x => x !== id) : [id];
  save(); render(); if (p.standardIds.length) toast('Skill chosen. Next, write it in student words.');
};
ACT.toggleWhy = b => { const p = planById(route().a), v = b.dataset.v; p.why = p.why.includes(v) ? p.why.filter(x => x !== v) : [...p.why, v]; save(); render(); };

/* -------------------------------------------------------------- 2 targets */
STEP_VIEWS.targets = p => {
  const s = p.standardIds.length && standardById(p.standardIds[0]);
  if (!p.targets.length) p.targets.push({ id: uid(), text: '' });
  return `${s ? `<div class="chosen"><span class="orb sm f-learn">${icon('standard')}</span><div><span class="eyebrow" style="color:var(--learn)">Official wording · ${esc(s.code)}</span><p>${esc(s.text)}</p></div></div>` : `<div class="empty">Choose the skill first. <a class="btn sm" href="#plan-${p.id}-skill">Choose the skill</a></div>`}
    ${zava('Start with "I can". Use words a student would use, and name something you could see them do on a short check. Each statement gets a letter that follows it through the whole plan.',
      '<b>Official:</b> "Demonstrate the sketching process used in concept development."<br><b>A:</b> I can sketch the front, top and side views of a simple object.<br><b>B:</b> I can line up the views so their sizes match.')}
    <div class="stack" id="targetRows">${p.targets.map((t, i) => `<div class="target-row f-learn"><span class="letter">${LETTERS[i]}</span>
      <textarea id="t-${t.id}" data-bind="p:targets.#${t.id}.text" placeholder="I can…" aria-label="I can statement ${LETTERS[i]}" style="min-height:60px">${esc(t.text)}</textarea>
      <button class="icon-btn" data-act="delTarget" data-id="${t.id}" aria-label="Remove statement ${LETTERS[i]}">${icon('trash')}</button></div>`).join('')}</div>
    <div class="row">${p.targets.length < 4 ? `<button class="btn sm ghost" data-act="addTarget">${icon('plus')}Add another "I can"</button>` : ''}
      ${APP.mode === 'cloud' ? `<button class="btn sm fam f-learn" data-act="suggestTargets">${icon('guide')}Suggest wording</button>` : ''}</div>
    <div id="suggestions"></div>`;
};
ACT.addTarget = () => { const p = planById(route().a); p.targets.push({ id: uid(), text: '' }); save(); render(); };
ACT.delTarget = b => { const p = planById(route().a); p.targets = p.targets.filter(t => t.id !== b.dataset.id); p.check.items.forEach(i => { if (i.targetId === b.dataset.id) i.targetId = ''; }); save(); render(); };
ACT.suggestTargets = async b => {
  const p = planById(route().a), box = $('#suggestions');
  b.disabled = true; box.innerHTML = `<p class="muted">Zava is writing two suggestions…</p>`;
  const r = await api('POST', '/api/learning-targets', { teamId: APP.root, subject: APP.subject, planId: p.id, standards: p.standardIds.map(standardById).filter(Boolean).map(s => ({ code: s.code, text: s.text })), draft: p.targets.map(t => t.text).filter(Boolean).join('\n') });
  b.disabled = false;
  if (!r.ok) { box.innerHTML = `<p class="muted">${esc(r.data.error || 'Suggestions are unavailable right now.')}</p>`; return; }
  box.innerHTML = `<div class="stack">${r.data.suggestions.map(sg => `<div class="li f-learn" style="border-radius:22px"><span class="orb sm">${icon('guide')}</span><span><b style="font-weight:400">${esc(sg)}</b></span><button class="btn sm" data-act="useSuggestion" data-text="${esc(sg)}">Use this</button></div>`).join('')}</div>`;
};
ACT.useSuggestion = b => { const p = planById(route().a); const empty = p.targets.find(t => !t.text.trim()); if (empty) empty.text = b.dataset.text; else p.targets.push({ id: uid(), text: b.dataset.text }); save(); render(); };

/* --------------------------------------------------------------- 3 got it */
STEP_VIEWS.gotit = p => {
  return `${zava('Decide this before anyone sees results, so the team sorts students the same way. Many teams use 75% or 80% of the points.', 'On an 8-point check with "got it" at 75%, a student needs 6 points.', 'learn')}
    <div class="fields f-learn">
      <div class="field"><label for="gotIt">"Got it" means at least this much of the points</label><div class="row"><input id="gotIt" type="number" min="1" max="100" step="5" style="width:110px" data-type="number" data-bind="p:gotIt" data-live="gotit" value="${esc(p.gotIt)}"><b>%</b></div></div>
      <div class="field"><span class="lbl">In points</span><p id="gotItPoints" class="goal-sentence" style="font-size:1.1rem;padding:12px 16px">${gotItPoints(p)}</p></div>
      <div class="field wide"><label for="gotNote">What does a student who has it do?</label><span class="help">Describe it so any teacher on the team would score the same work the same way.</span>
        <textarea id="gotNote" data-bind="p:gotItNote" placeholder="A student who has it…">${esc(p.gotItNote)}</textarea></div>
    </div>`;
};
const gotItPoints = p => { const m = maxPoints(p); return m ? `${Math.ceil((m * p.gotIt) / 100)} of ${m} points on the team check` : 'Set once the team check has points.'; };
LIVE.gotit = () => { const el = $('#gotItPoints'); if (el) el.textContent = gotItPoints(planById(route().a)); };

/* ------------------------------------------------------------ 4 the check */
STEP_VIEWS.build = p => {
  const opts = id => `<option value="">Which "I can"?</option>` + p.targets.map((t, i) => `<option value="${t.id}" ${t.id === id ? 'selected' : ''}>${LETTERS[i]} · ${esc(t.text.slice(0, 40) || 'statement ' + LETTERS[i])}</option>`).join('');
  return `${zava('Keep it short: four to six questions is plenty. Give it on the same day in every class if you can, and tie every question to an "I can" statement so results show which part students missed.', '', 'check')}
    <div class="fields f-check">
      <div class="field"><label for="ckName">Name of the check</label><input id="ckName" type="text" data-bind="p:check.name" value="${esc(p.check.name)}" placeholder="Three-view sketch check"></div>
      <div class="field"><label for="ckDate">Day every class takes it</label><input id="ckDate" type="date" data-bind="p:check.date" value="${esc(p.check.date)}"></div>
    </div>
    <div class="stack f-check" id="items">${p.check.items.map((it, i) => `<div class="item-row">
      <span class="n">${i + 1}</span>
      <textarea id="ip-${it.id}" data-bind="p:check.items.#${it.id}.prompt" aria-label="Question ${i + 1}" placeholder="Question or task">${esc(it.prompt)}</textarea>
      <input type="number" min="0" step="1" aria-label="Points for question ${i + 1}" data-type="number" data-bind="p:check.items.#${it.id}.points" data-live="points" value="${esc(it.points)}" placeholder="Points">
      <select aria-label="I can statement for question ${i + 1}" data-bind="p:check.items.#${it.id}.targetId">${opts(it.targetId)}</select>
      <button class="icon-btn" data-act="delItem" data-id="${it.id}" aria-label="Remove question ${i + 1}">${icon('trash')}</button>
      <textarea style="grid-column:2/-1;min-height:48px" data-bind="p:check.items.#${it.id}.guide" aria-label="Scoring guide for question ${i + 1}" placeholder="Scoring guide (teachers only): what earns each point">${esc(it.guide || '')}</textarea>
    </div>`).join('')}</div>
    <div class="row"><button class="btn sm fam f-check" data-act="addItem">${icon('plus')}Add a question</button><span class="spacer"></span><b id="totalPts">${maxPoints(p)} points in all</b></div>
    ${!p.targets.some(t => t.text) ? `<p class="small muted">Tip: write your "I can" statements first so each question can be tied to one.</p>` : ''}`;
};
ACT.addItem = () => { const p = planById(route().a); p.check.items.push({ id: uid(), prompt: '', points: 1, targetId: p.targets[0]?.id || '', guide: '' }); save(); render(); setTimeout(() => $$('#items textarea')[$$('#items textarea').length - 2]?.focus(), 30); };
ACT.delItem = b => { const p = planById(route().a); p.check.items = p.check.items.filter(i => i.id !== b.dataset.id); save(); render(); };
LIVE.points = () => { const el = $('#totalPts'); if (el) el.textContent = maxPoints(planById(route().a)) + ' points in all'; };

/* ------------------------------------------------------------ 5 team goal */
STEP_VIEWS.goal = p => `${zava('A good goal is a stretch but reachable. If you gave a pre-check, enter where students started so you can see growth.', 'By Dec 3, 80% of our students will reach "got it" on the three-view sketch check, up from 40%.', 'check')}
  <div class="fields f-check">
    <div class="field"><label for="gTarget">Share of students who will reach "got it"</label><div class="row"><input id="gTarget" type="number" min="1" max="100" step="5" style="width:110px" data-type="number" data-bind="p:goal.target" data-live="goal" value="${esc(p.goal.target)}"><b>%</b></div></div>
    <div class="field"><label for="gDate">By this date</label><input id="gDate" type="date" data-bind="p:goal.date" data-live="goal" value="${esc(p.goal.date)}"></div>
    <div class="field"><label for="gBase">Where students started (optional)</label><span class="help">PLC word: baseline</span><div class="row"><input id="gBase" type="number" min="0" max="100" style="width:110px" data-type="number" data-bind="p:goal.baseline" data-live="goal" value="${esc(p.goal.baseline)}"><b>%</b></div></div>
  </div>
  <div class="field"><span class="lbl">Our team goal</span><p class="goal-sentence" id="goalSentence">${goalSentence(p)}</p></div>`;
function goalSentence(p) {
  const d = p.goal.date ? fmtDate(p.goal.date, { month: 'long', day: 'numeric' }) : '<mark>a date</mark>';
  return `By ${p.goal.date ? `<mark>${esc(d)}</mark>` : d}, <mark>${esc(p.goal.target || '?')}%</mark> of our students will reach "got it" on ${p.check.name ? `the <mark>${esc(p.check.name)}</mark>` : 'our team check'}${p.goal.baseline !== '' && p.goal.baseline != null ? `, up from <mark>${esc(p.goal.baseline)}%</mark>` : ''}.`;
}
LIVE.goal = () => { const el = $('#goalSentence'); if (el) el.innerHTML = goalSentence(planById(route().a)); };

/* --------------------------------------------------------------- 6 scores */
STEP_VIEWS.scores = p => scoresView(p, 'first');
function scoresView(p, kind) {
  if (!p.check.items.length) return `<div class="empty">${icon('check')}<b>Build the team check first</b><span>Scores are entered for each question on the check.</span><a class="btn fam f-check" href="#plan-${p.id}-build">Build the team check</a></div>`;
  const me = member(ME);
  const entry = S.members.map(m => { const st = stats(p, { kind, teacherId: m.id }); return `<span class="tdot ${st.n ? 'in' : ''}"><i>${esc(initials(m.name))}</i>${esc(m.name)} · ${st.n ? plural(st.n, 'student') : 'not yet'}</span>`; }).join('');
  if (!me) return `<div class="teacher-dots">${entry}</div><div class="empty">${icon('person')}<b>Which teacher are you?</b><span>You enter scores for your own classes only.</span><button class="btn" data-act="whoAmI">Choose your name</button></div>`;
  const sets = p.scores.filter(s => s.teacherId === ME && (s.kind || 'first') === kind);
  const intro = kind === 'recheck'
    ? zava('Re-check only the students who didn\'t reach "got it" the first time. Launchpad adds them for you.', '', 'reteach')
    : zava('Enter a score for each question. A total and "got it" fill in on their own. You can paste straight from a spreadsheet: student ID first, then one column per question.', '', 'check');
  return `${intro}
    <div class="row"><span class="small muted">Who has entered:</span><div class="teacher-dots">${entry}</div></div>
    ${privacyNote('Use student ID numbers, not names. Your teammates never see your students\' rows, only team totals.')}
    ${sets.map(set => scoreTable(p, set)).join('') || `<div class="empty">No classes yet.</div>`}
    <div class="row"><button class="btn fam ${kind === 'recheck' ? 'f-reteach' : 'f-check'}" data-act="addSet" data-kind="${kind}">${icon('plus')}${kind === 'recheck' ? 'Start my re-check list' : sets.length ? 'Add another class' : 'Add my first class'}</button></div>`;
}
function scoreTable(p, set) {
  const items = p.check.items;
  return `<div class="stack"><div class="row"><span class="orb sm f-check">${icon('score')}</span><input type="text" aria-label="Class name" data-bind="p:scores.#${set.id}.period" value="${esc(set.period)}" style="max-width:220px" placeholder="Class period">
    <span class="spacer"></span><button class="btn sm ghost" data-act="pasteRows" data-set="${set.id}">${icon('paste')}Paste from a spreadsheet</button><button class="btn sm danger" data-act="delSet" data-set="${set.id}">${icon('trash')}Remove class</button></div>
    <div class="score-wrap"><table class="scores"><thead><tr><th scope="col">Student ID</th>${items.map((it, i) => `<th scope="col" title="${esc(it.prompt)}">Q${i + 1}<br><span class="muted">/${esc(it.points)}${it.targetId ? ' · ' + LETTERS[p.targets.findIndex(t => t.id === it.targetId)] : ''}</span></th>`).join('')}<th scope="col">Total</th><th scope="col">Result</th><th></th></tr></thead>
    <tbody>${set.rows.map(row => scoreRow(p, set, row)).join('')}</tbody></table></div>
    <div><button class="btn sm soft" data-act="addRow" data-set="${set.id}">${icon('plus')}Add a student</button></div></div>`;
}
function scoreRow(p, set, row) {
  const res = rowResult(p, row);
  return `<tr id="row-${row.id}"><td><input class="sid" type="text" aria-label="Student ID" data-bind="p:scores.#${set.id}.rows.#${row.id}.student" value="${esc(row.student)}"></td>
    ${p.check.items.map((it, i) => `<td><input type="number" min="0" max="${esc(it.points)}" aria-label="Student ${esc(row.student)} question ${i + 1}" data-type="number" data-bind="p:scores.#${set.id}.rows.#${row.id}.s.${it.id}" data-live="row" data-row="${row.id}" data-set="${set.id}" value="${esc(row.s?.[it.id] ?? '')}"></td>`).join('')}
    <td class="num" data-total>${res.complete ? `${res.total}/${res.max}` : '–'}</td><td data-got>${gotPill(res)}</td>
    <td><button class="icon-btn" data-act="delRow" data-set="${set.id}" data-row="${row.id}" aria-label="Remove student">${icon('close')}</button></td></tr>`;
}
const gotPill = res => res.complete ? (res.got ? `<span class="got yes">${icon('done')}Got it</span>` : `<span class="got no">Not yet</span>`) : `<span class="got wait">Not scored yet</span>`;
LIVE.row = el => {
  const p = planById(route().a), set = p.scores.find(s => s.id === el.dataset.set), row = set.rows.find(r => r.id === el.dataset.row);
  const res = rowResult(p, row), tr = $('#row-' + row.id);
  $('[data-total]', tr).textContent = res.complete ? `${res.total}/${res.max}` : '–';
  $('[data-got]', tr).innerHTML = gotPill(res);
};
ACT.addSet = b => {
  const p = planById(route().a), kind = b.dataset.kind, me = member(ME);
  const set = { id: uid(), teacherId: ME, period: kind === 'recheck' ? 'Re-check' : (me?.periods ? 'Period ' + String(me.periods).split(/[,\s]+/)[p.scores.filter(s => s.teacherId === ME).length] || 'My class' : 'My class'), kind, rows: [] };
  if (kind === 'recheck') {
    for (const s of p.scores.filter(s => s.teacherId === ME && (s.kind || 'first') === 'first'))
      for (const r of s.rows) { const res = rowResult(p, r); if (res.complete && !res.got) set.rows.push({ id: uid(), student: r.student, s: {} }); }
    if (!set.rows.length) { toast('None of your students need a re-check.'); return; }
  } else set.rows.push({ id: uid(), student: '', s: {} });
  p.scores.push(set); save(); render();
};
ACT.delSet = async b => {
  const ok = await ask(`<h2>Remove this class?</h2><p class="muted">Its scores will be deleted. Version history keeps earlier saves.</p><div class="row end"><button type="button" class="btn ghost" data-cancel>Keep it</button><button class="btn danger">Remove class</button></div>`);
  if (!ok) return; const p = planById(route().a); p.scores = p.scores.filter(s => s.id !== b.dataset.set); save(); render();
};
ACT.addRow = b => { const p = planById(route().a), set = p.scores.find(s => s.id === b.dataset.set); const row = { id: uid(), student: '', s: {} }; set.rows.push(row); save(); render(); setTimeout(() => $(`#row-${row.id} .sid`)?.focus(), 30); };
ACT.delRow = b => { const p = planById(route().a), set = p.scores.find(s => s.id === b.dataset.set); set.rows = set.rows.filter(r => r.id !== b.dataset.row); save(); render(); };
ACT.pasteRows = async b => {
  const p = planById(route().a), set = p.scores.find(s => s.id === b.dataset.set);
  const fd = await ask(`<h2>Paste scores</h2><p class="muted">Copy rows from your spreadsheet: the student ID first, then one column for each of the ${p.check.items.length} questions, in order.</p>
    <textarea name="rows" rows="8" placeholder="1001&#9;2&#9;1&#9;2&#9;2" style="font-family:ui-monospace,monospace" required></textarea>
    <div class="row end"><button type="button" class="btn ghost" data-cancel>Cancel</button><button class="btn">Add these students</button></div>`);
  if (!fd) return;
  let added = 0;
  for (const line of String(fd.get('rows')).split(/\r?\n/)) {
    const cells = line.split(/\t|,/).map(c => c.trim()); if (!cells[0]) continue;
    const s = {}; p.check.items.forEach((it, i) => { const v = cells[i + 1]; if (v !== undefined && v !== '' && !isNaN(Number(v))) s[it.id] = Number(v); });
    set.rows = set.rows.filter(r => r.student || Object.keys(r.s).length);
    set.rows.push({ id: uid(), student: cells[0], s }); added++;
  }
  save(); render(); toast(`${plural(added, 'student')} added.`);
};

/* -------------------------------------------------------------- 7 results */
STEP_VIEWS.results = p => {
  const team = stats(p), mine = ME ? stats(p, { teacherId: ME }) : null;
  const inv = invitationsFor(ME).filter(i => i.plan.id === p.id);
  const discuss = [['Discuss', 'Which "I can" statement was hardest? What did we expect?'], ['Look at student work', 'Compare one strong and one missed answer. What is the error?'], ['Decide together', 'Who needs reteaching, and what will we do differently?']];
  return `${resultsPanel(p, team, mine)}
    ${inv.map(inviteCard).join('')}
    <div class="grid3">${discuss.map(([h, q], i) => `<div class="card bubble"><span class="eyebrow" style="color:var(--check)">${i + 1} · ${h}</span><p>${q}</p></div>`).join('')}</div>
    <div class="fields f-check"><div class="field wide"><label for="rNotes">What we noticed</label><textarea id="rNotes" data-bind="p:results.notes" placeholder="Most students drew the right views, but in the wrong places…">${esc(p.results.notes)}</textarea></div>
      <div class="field wide"><label for="rDec">What we decided</label><textarea id="rDec" data-bind="p:results.decision" placeholder="Reteach target B in small groups on Tuesday…">${esc(p.results.decision)}</textarea></div></div>`;
};
function resultsPanel(p, team, mine, compact) {
  if (!p.check.items.length || !team.n) return `<div class="locked">${icon('results')}<div><b>No scores yet</b><p class="small muted">Results appear once teachers enter scores.</p></div></div>`;
  if (!teamUnlocked(team)) return `<div class="locked">${icon('lock')}<div><b>Team results are hidden for now</b><p class="small muted">To protect privacy, they appear once at least ${PRIVACY_MIN_STUDENTS} students from ${PRIVACY_MIN_TEACHERS} teachers are scored. So far: ${plural(team.n, 'student')} from ${plural(team.teachers, 'teacher')}.</p></div></div>
    ${mine && mine.n ? myLine(mine) : ''}`;
  const R = 74, C = 2 * Math.PI * R, goal = Number(p.goal.target) || 0;
  const ring = `<div class="big-ring f-check"><svg viewBox="0 0 170 170"><circle cx="85" cy="85" r="${R}" fill="none" stroke="var(--wash)" stroke-width="14"/>
    <circle cx="85" cy="85" r="${R}" fill="none" stroke="var(--check)" stroke-width="14" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - team.pct / 100)}" transform="rotate(-90 85 85)"/>
    ${goal ? `<line x1="85" y1="4" x2="85" y2="22" stroke="var(--ink)" stroke-width="3" stroke-linecap="round" transform="rotate(${goal * 3.6} 85 85)"/>` : ''}</svg>
    <b class="num">${team.pct}%</b><span>got it</span></div>`;
  const bars = p.targets.map((t, i) => { const s = team.per[t.id]; if (!s || !s.n) return ''; return `<div class="barrow f-learn"><span class="letter sm">${LETTERS[i]}</span>
    <div class="track"><i style="width:${s.pct}%;background:var(--check)"></i>${goal ? `<span class="goal" style="left:${goal}%" title="Team goal ${goal}%"></span>` : ''}</div><b class="num">${s.pct}%</b>
    <span class="lab">${esc(t.text)}</span></div>`; }).join('');
  return `<div class="card f-check" style="background:var(--paper)"><div class="row" style="align-items:center;gap:26px">${ring}
      <div class="stack" style="flex:1;min-width:240px"><div><span class="eyebrow">Whole team · ${plural(team.n, 'student')} · ${plural(team.teachers, 'teacher')}</span>
      <h3 style="margin-top:4px">${team.got} of ${team.n} students got it${goal ? ` · goal ${goal}%` : ''}</h3>${team.waiting ? `<p class="small muted">${plural(team.waiting, 'row')} not scored yet are left out.</p>` : ''}</div>
      ${compact ? '' : `<div class="bars">${bars}</div>`}</div></div>
    ${mine && mine.n ? myLine(mine, team) : ''}</div>`;
}
function myLine(mine, team) {
  return `<div class="li" style="border-radius:22px;background:var(--wash)"><span class="orb sm f-tool">${icon('lock')}</span><span><b>Your students: ${mine.pct}% got it${team ? ` · team ${team.pct}%` : ''}</b><span class="sub">Only you see this line.</span></span><span></span></div>`;
}

/* -------------------------------------------------------------- 8 reteach */
STEP_VIEWS.reteach = p => {
  const team = stats(p);
  const groups = p.targets.map((t, i) => { const s = team.per[t.id]; return s && s.n ? `<div class="li f-reteach" style="border-radius:22px"><span class="letter sm" style="background:var(--reteach);color:var(--on-reteach)">${LETTERS[i]}</span><span><b>${s.n - s.got} students need reteaching</b><span class="sub">${esc(t.text)}</span></span><span></span></div>` : ''; }).join('');
  const myKids = ME ? p.scores.filter(s => s.teacherId === ME && (s.kind || 'first') === 'first').flatMap(s => s.rows).filter(r => { const x = rowResult(p, r); return x.complete && !x.got; }).map(r => r.student) : [];
  const ideas = S.strategies.filter(s => s.planId === p.id || p.targets.some(t => t.id === s.targetId)).concat(S.strategies.filter(s => s.planId !== p.id)).slice(0, 3);
  return `${zava('Teaching it again the same way rarely works. Try a hands-on model, a visual, or a small group with a different teacher. Your teammates\' shared ideas are below.', '', 'reteach')}
    ${teamUnlocked(team) ? `<div class="stack">${groups}</div>` : `<div class="locked">${icon('lock')}<div><b>Group sizes appear with team results</b><p class="small muted">Once ${PRIVACY_MIN_STUDENTS} students from ${PRIVACY_MIN_TEACHERS} teachers are scored.</p></div></div>`}
    ${myKids.length ? `<div class="li" style="border-radius:22px"><span class="orb sm f-tool">${icon('lock')}</span><span><b>Your students for reteaching: ${myKids.map(esc).join(', ')}</b><span class="sub">Only you see these IDs.</span></span><span></span></div>` : ''}
    <div class="fields f-reteach">
      <div class="field"><label for="rtLead">Who leads the reteach group?</label><select id="rtLead" data-bind="p:reteach.leader"><option value="">Choose…</option>${S.members.map(m => `<option value="${m.id}" ${p.reteach.leader === m.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}<option value="each" ${p.reteach.leader === 'each' ? 'selected' : ''}>Each teacher with their own students</option></select></div>
      <div class="field"><label for="rtWhen">When?</label><input id="rtWhen" type="text" data-bind="p:reteach.when" value="${esc(p.reteach.when)}" placeholder="Tuesday and Thursday, first 20 minutes"></div>
      <div class="field wide"><label for="rtHow">The new way we'll teach it</label><textarea id="rtHow" data-bind="p:reteach.how" placeholder="Students hold a real block and trace each face onto grid paper…">${esc(p.reteach.how)}</textarea></div>
    </div>
    ${ideas.length ? `<div class="stack"><h3>${icon('practice')} Ideas from your team</h3>${ideas.map(stratCard).join('')}</div>` : ''}`;
};

/* --------------------------------------------------------------- 9 re-check */
STEP_VIEWS.recheck = p => {
  const re = stats(p, { kind: 'recheck' });
  return `${scoresView(p, 'recheck')}
    ${re.n ? `<div class="card f-reteach" style="background:var(--paper)"><h3>${re.got} of ${re.n} retaught students now have it</h3><p class="small muted">Across the whole team. ${teamUnlocked(stats(p)) ? '' : 'Individual classes are never shown.'}</p></div>` : ''}`;
};

/* --------------------------------------------------------------- 10 stretch */
STEP_VIEWS.stretch = p => {
  const ways = ['On their own', 'With a partner', 'Small group', 'Teach it back'];
  return `${zava('A good stretch asks "why" or "what if" with the same skill. Avoid simply handing out more problems of the same kind. It runs while other students are retaught, so nobody waits.', 'Sketch an object with a hidden hole, show it with hidden lines, and explain your choice to a partner.', 'stretch')}
    <div class="fields f-stretch">
      <div class="field wide"><label for="stAct">The stretch activity</label><textarea id="stAct" data-bind="p:stretch.activity" placeholder="Students who got it will…">${esc(p.stretch.activity)}</textarea></div>
      <div class="field wide"><span class="lbl">How students work on it</span><div class="chips">${ways.map(w => `<button type="button" class="chip" aria-pressed="${p.stretch.how.includes(w)}" data-act="toggleWay" data-v="${esc(w)}">${w}</button>`).join('')}</div></div>
      <div class="field wide"><label for="stMat">Materials link (optional)</label><input id="stMat" type="url" data-bind="p:stretch.materials" value="${esc(p.stretch.materials)}" placeholder="https://"></div>
    </div>`;
};
ACT.toggleWay = b => { const p = planById(route().a), v = b.dataset.v; p.stretch.how = p.stretch.how.includes(v) ? p.stretch.how.filter(x => x !== v) : [...p.stretch.how, v]; save(); render(); };

/* ----------------------------------------------------------------- 11 wrap */
function finalStats(p) {
  const team = stats(p); if (!team.n) return team;
  const re = p.scores.filter(s => s.kind === 'recheck');
  let got = team.got;
  for (const set of re) for (const r of set.rows) {
    const res = rowResult(p, r); if (!res.complete || !res.got) continue;
    const first = p.scores.filter(s => s.teacherId === set.teacherId && (s.kind || 'first') === 'first').flatMap(s => s.rows).find(x => x.student === r.student);
    if (first && !rowResult(p, first).got) got++;
  }
  return { ...team, got, pct: pct(got, team.n) };
}
STEP_VIEWS.wrap = p => {
  const f = finalStats(p), goal = Number(p.goal.target) || 0;
  const met = teamUnlocked(f) && goal && f.pct >= goal;
  return `<div class="card f-stretch" style="background:var(--paper)">
      ${teamUnlocked(f) ? `<span class="eyebrow">After reteaching</span><h3 style="font-size:1.6rem">${f.pct}% of students have it${goal ? ` · goal ${goal}%` : ''}</h3>
      <p>${goal ? (met ? 'You reached your team goal. Celebrate it together!' : `You're ${goal - f.pct} points from your goal.`) : ''}</p>` : `<div class="locked">${icon('lock')}<div><b>Results appear once enough scores are in</b></div></div>`}
    </div>
    ${zava('Take five minutes to name what worked. Then decide whether to keep going with this skill or start the next one.', '', 'stretch')}
    <div class="fields f-stretch">
      <div class="field wide"><label for="wRef">What did we learn as a team?</label><textarea id="wRef" data-bind="p:wrap.reflection" placeholder="Hands-on models worked better than the worksheet…">${esc(p.wrap.reflection)}</textarea></div>
      <div class="field wide"><span class="lbl">What's next?</span><div class="chips">${['Start the next must-learn skill', 'Keep working on this skill', 'Revisit later in the year'].map(w => `<button type="button" class="chip" aria-pressed="${p.wrap.next === w}" data-act="setNext" data-v="${esc(w)}">${w}</button>`).join('')}</div></div>
    </div>
    ${p.wrap.next === 'Start the next must-learn skill' ? `<div><button class="btn fam f-learn" data-act="newPlan">${icon('plus')}Start the next plan</button></div>` : ''}`;
};
ACT.setNext = b => { const p = planById(route().a); p.wrap.next = b.dataset.v; save(); render(); };
