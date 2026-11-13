/* PLC Launchpad 1.0 · team time, results, what worked for us, team, PLC words */

/* ================================================================ TEAM TIME */
function viewMeetings() {
  const running = runningMeeting();
  const past = S.meetings.filter(m => m.endedAt).sort((a, b) => (a.date < b.date ? 1 : -1));
  const todos = openTodos();
  return `<div class="page-head"><div class="lead"><span class="eyebrow">Team time</span><h1>Your weekly 45 minutes</h1>
    <p>Start team time when you sit down together. Launchpad builds the agenda from where you stopped, keeps your notes and to-dos, and remembers where you ended.</p></div>
    ${running ? `<a class="btn fam f-team lead-orb" href="#meeting-${running.id}"><span class="orb" style="background:var(--paper);color:var(--team)">${icon('clock')}</span>Back to today's meeting</a>`
      : `<button class="btn fam f-team lead-orb" data-act="startMeeting"><span class="orb" style="background:var(--paper);color:var(--team)">${icon('play')}</span>Start team time</button>`}</div>
    <div class="meet-layout"><div class="stack">
      ${past.length ? past.map(m => {
        const st = m.stoppedAt && step(m.stoppedAt.stepKey), p = m.planId && planById(m.planId);
        return `<a class="meeting-row" href="#meeting-${m.id}"><span class="date">${esc(fmtDate(m.date, { day: 'numeric' }))}<small>${esc(fmtDate(m.date, { month: 'short' }))}</small></span>
          <span><b>${p ? esc(planTitle(p)) : 'Team meeting'}</b><span class="sub muted small" style="display:block">${st ? 'Stopped at ' + esc(st.label) : ''}${m.attendance?.length ? ' · ' + plural(m.attendance.length, 'teacher') : ''}${(m.todos || []).length ? ' · ' + plural(m.todos.length, 'to-do') : ''}</span></span>${icon('arrow')}</a>`;
      }).join('') : `<div class="empty">${icon('meeting')}<b>No meetings yet</b><span>Your first team time will show up here with its notes.</span></div>`}
    </div><div class="stack">
      ${todos.length ? `<div class="card f-team"><h3>Open to-dos</h3><div class="list">${todos.map(todoRow).join('')}</div></div>` : ''}
      <div class="card f-team"><div class="card-head"><span class="orb sm">${icon('norms')}</span><h3>Our agreements</h3></div>
        ${S.norms.length ? `<ul style="margin:0;padding-left:20px;display:grid;gap:6px">${S.norms.map(n => `<li>${esc(n.text)}</li>`).join('')}</ul>` : `<p class="muted small">Add your team agreements on the Team page.</p>`}
        ${termChip('Norms', 'team')}</div>
    </div></div>`;
}

ACT.startMeeting = async () => {
  if (runningMeeting()) { go('meeting-' + runningMeeting().id); return; }
  const p = activePlan();
  const fd = await ask(`<h2>Start team time</h2>
    <div class="field"><label for="mPlan">What will you work on?</label><select id="mPlan" name="plan">${S.plans.map(x => `<option value="${x.id}" ${x === p ? 'selected' : ''}>${esc(planTitle(x))}</option>`).join('')}<option value="">Something else (no plan)</option></select></div>
    <div class="field"><label for="mLen">How long?</label><div class="row"><input id="mLen" name="len" type="number" min="10" max="120" step="5" value="45" style="width:100px"><span>minutes</span></div></div>
    <p class="small muted">Launchpad suggests an agenda from where you stopped. You can change it.</p>
    <div class="row end"><button type="button" class="btn ghost" data-cancel>Cancel</button><button class="btn fam f-team">${icon('play')}Start</button></div>`);
  if (!fd) return;
  const plan = planById(fd.get('plan'));
  const m = { id: uid(), date: todayISO(), planId: plan?.id || '', startedAt: new Date().toISOString(), endedAt: '', minutes: Number(fd.get('len')) || 45,
    attendance: ME ? [ME] : [], agenda: suggestedAgenda(plan), discussion: '', decisions: '', todos: [], stepNotes: [] };
  if (plan) S.activePlanId = plan.id;
  S.meetings.push(m); save(); go('meeting-' + m.id);
};

function viewMeeting(r) {
  const m = S.meetings.find(x => x.id === r.a);
  if (!m) return `<div class="empty">That meeting isn't here anymore. <a class="btn" href="#meetings">All meetings</a></div>`;
  const live = m.startedAt && !m.endedAt;
  const p = planById(m.planId);
  const earlier = openTodos().filter(t => t.meetingId !== m.id);
  const agenda = m.agenda.map((a, i) => {
    const st = a.kind === 'step' && step(a.stepKey);
    const fam = st ? st.fam : a.kind === 'wrap' || a.kind === 'checkin' || a.kind === 'todos' ? 'team' : 'tool';
    return `<div class="agenda-item f-${fam}"><div class="card-head"><span class="orb sm">${icon(st ? st.icon : a.kind === 'checkin' ? 'norms' : a.kind === 'todos' ? 'done' : a.kind === 'wrap' ? 'history' : 'note')}</span>
      <div class="grow"><input type="text" aria-label="Agenda item ${i + 1}" data-bind="m:agenda.#${a.id}.topic" value="${esc(a.topic)}" style="border:0;padding:4px 0;font-weight:700;font-family:var(--display);font-size:1.05rem;background:transparent"></div>
      <span class="mins"><input type="number" min="0" aria-label="Minutes" data-type="number" data-bind="m:agenda.#${a.id}.minutes" value="${esc(a.minutes)}" style="width:62px;padding:4px 8px"> min</span>
      ${st && p ? `<a class="btn sm fam" href="#plan-${p.id}-${st.key}">Open step</a>` : ''}
      <button class="icon-btn" data-act="delAgenda" data-id="${a.id}" aria-label="Remove agenda item">${icon('close')}</button></div>
      ${a.kind === 'checkin' && S.norms.length ? `<p class="small muted">${S.norms.map(n => esc(n.text)).join(' · ')}</p>` : ''}
      <textarea aria-label="Notes for ${esc(a.topic)}" data-bind="m:agenda.#${a.id}.notes" placeholder="Notes" style="min-height:58px">${esc(a.notes)}</textarea></div>`;
  }).join('');
  const total = m.agenda.reduce((s, a) => s + (Number(a.minutes) || 0), 0);
  const stepNotes = (m.stepNotes || []).map(n => `<div class="li" style="border-radius:22px"><span class="avatar">${esc(initials(memberName(n.by)))}</span><span><b style="font-weight:400">${esc(n.text)}</b><span class="sub">${esc(step(n.stepKey)?.label || '')} · ${esc(memberName(n.by))}</span></span><span></span></div>`).join('');
  const st = m.stoppedAt && step(m.stoppedAt.stepKey);

  return `<div class="page-head"><div class="lead"><span class="eyebrow">${live ? 'Team time · in progress' : 'Team meeting notes'} · ${esc(fmtDate(m.date, { weekday: 'long', month: 'long', day: 'numeric' }))}</span>
    <h1 style="font-size:clamp(1.6rem,3.2vw,2.4rem)">${p ? esc(planTitle(p)) : 'Team meeting'}</h1>${!live && st ? `<p>Stopped at <b>${esc(st.label)}</b>${m.nextTime ? ` · Next time: ${esc(m.nextTime)}` : ''}</p>` : ''}</div>
    <div class="row">${live ? `<button class="btn fam f-team lead-orb" data-act="endMeeting"><span class="orb" style="background:var(--paper);color:var(--team)">${icon('done')}</span>End team time</button>` : `<a class="btn ghost" href="#meetings">${icon('back')}All meetings</a><button class="btn danger sm" data-act="delMeeting">${icon('trash')}Delete</button>`}</div></div>
  <div class="meet-layout">
    <div class="stack">
      <div class="card f-team"><div class="card-head"><span class="orb sm">${icon('team')}</span><h3 class="grow">Who's here</h3></div>
        <div class="attend">${S.members.map(x => `<button type="button" class="chip" aria-pressed="${m.attendance.includes(x.id)}" data-act="toggleAttend" data-id="${x.id}">${esc(x.name)}</button>`).join('') || '<span class="muted small">Add team members on the Team page.</span>'}</div></div>
      ${earlier.length ? `<div class="card f-team"><h3>To-dos from earlier meetings</h3><div class="list">${earlier.map(todoRow).join('')}</div></div>` : ''}
      <div class="row"><h2 class="spacer" style="font-size:1.4rem">Agenda <span class="small muted num">· ${total} of ${m.minutes} minutes</span></h2><button class="btn sm ghost" data-act="addAgenda">${icon('plus')}Add item</button></div>
      ${agenda}
      ${stepNotes ? `<div class="card f-team"><h3>Notes added in plan steps</h3><div class="list">${stepNotes}</div></div>` : ''}
      <div class="card f-team"><div class="fields">
        <div class="field wide"><label for="mDisc">What we talked about</label><span class="help">The conversation in a few sentences: questions raised, what surprised you.</span><textarea id="mDisc" data-bind="m:discussion" placeholder="We noticed…">${esc(m.discussion)}</textarea></div>
        <div class="field wide"><label for="mDec">What we decided</label><textarea id="mDec" data-bind="m:decisions" placeholder="We will…">${esc(m.decisions)}</textarea></div>
      </div></div>
      <div class="card f-team"><div class="row"><h3 class="spacer">To-dos</h3><button class="btn sm fam" data-act="addTodo">${icon('plus')}Add to-do</button></div>
        ${(m.todos || []).map(t => `<div class="todo-row"><input type="text" aria-label="To-do" data-bind="m:todos.#${t.id}.text" value="${esc(t.text)}" placeholder="What needs doing">
          <select aria-label="Who" data-bind="m:todos.#${t.id}.ownerId"><option value="all" ${t.ownerId === 'all' ? 'selected' : ''}>Everyone</option>${S.members.map(x => `<option value="${x.id}" ${t.ownerId === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>
          <input type="date" aria-label="By when" data-bind="m:todos.#${t.id}.due" value="${esc(t.due)}">
          <button class="icon-btn" data-act="delTodo" data-id="${t.id}" aria-label="Remove to-do">${icon('trash')}</button></div>`).join('') || '<p class="muted small">Nothing yet.</p>'}</div>
      ${!live ? `<div class="card f-team"><div class="fields"><div class="field"><label for="mStop">Where we stopped</label><select id="mStop" data-act-change="stop">${stopOptions(m)}</select></div>
        <div class="field"><label for="mNext">Next time we'll…</label><input id="mNext" type="text" data-bind="m:nextTime" value="${esc(m.nextTime || '')}"></div></div></div>` : ''}
    </div>
    <aside class="stack" style="position:sticky;top:84px">
      ${live ? `<div class="card f-team" style="justify-items:center;text-align:center">${clockHTML()}<p class="small muted">Ends at ${esc(new Date(Date.parse(m.startedAt) + m.minutes * 60000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))}</p>
        <div class="row"><button class="btn sm ghost" data-act="addTime" data-min="5">+5 min</button></div></div>` : ''}
      ${p ? `<div class="card"><div class="card-head"><span class="orb sm f-learn">${icon('plan')}</span><div class="grow"><b>${esc(planTitle(p))}</b>${pipHTML(p)}</div></div>
        <a class="btn sm fam f-learn" href="#plan-${p.id}-${nextStep(p).key}">Next step: ${esc(nextStep(p).label)}</a></div>` : ''}
    </aside>
  </div>`;
}
const stopOptions = m => { const p = planById(m.planId); return p ? STEPS.map(s => `<option value="${s.key}" ${m.stoppedAt?.stepKey === s.key ? 'selected' : ''}>${esc(s.label)}</option>`).join('') : '<option value="">No plan</option>'; };
document.addEventListener('change', e => {
  if (e.target.matches('[data-act-change="stop"]')) { const m = S.meetings.find(x => x.id === route().a); m.stoppedAt = { planId: m.planId, stepKey: e.target.value }; save(); }
});
function clockHTML() {
  const R = 66, C = 2 * Math.PI * R;
  return `<div class="clock f-team"><svg viewBox="0 0 150 150"><circle cx="75" cy="75" r="${R}" fill="none" stroke="var(--wash)" stroke-width="12"/><circle data-clock cx="75" cy="75" r="${R}" fill="none" stroke="var(--team)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="0" transform="rotate(-90 75 75)"/></svg><b data-timer>--:--</b><span>left</span></div>`;
}
function tickTimer() {
  const m = runningMeeting(); if (!m) return;
  const end = Date.parse(m.startedAt) + m.minutes * 60000, left = Math.round((end - Date.now()) / 1000);
  const txt = left >= 0 ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : `+${Math.floor(-left / 60)}:${String(-left % 60).padStart(2, '0')}`;
  $$('[data-timer]').forEach(el => { el.textContent = txt; });
  const c = $('[data-clock]'); if (c) { const C = 2 * Math.PI * 66; c.setAttribute('stroke-dashoffset', String(C * (1 - Math.max(0, left) / (m.minutes * 60)))); }
  if (left === 300) toast('Five minutes left. Time to wrap up: where did you stop?');
}
setInterval(tickTimer, 1000);
const curMeeting = () => S.meetings.find(x => x.id === route().a);
ACT.toggleAttend = b => { const m = curMeeting(), id = b.dataset.id; m.attendance = m.attendance.includes(id) ? m.attendance.filter(x => x !== id) : [...m.attendance, id]; save(); render(); };
ACT.addAgenda = () => { curMeeting().agenda.push({ id: uid(), topic: '', minutes: 5, kind: 'other', notes: '' }); save(); render(); };
ACT.delAgenda = b => { const m = curMeeting(); m.agenda = m.agenda.filter(a => a.id !== b.dataset.id); save(); render(); };
ACT.addTodo = () => { (curMeeting().todos ||= []).push({ id: uid(), text: '', ownerId: 'all', due: addDays(todayISO(), 7), done: false }); save(); render(); setTimeout(() => { const ins = $$('.todo-row input[type=text]'); ins[ins.length - 1]?.focus(); }, 30); };
ACT.delTodo = b => { const m = curMeeting(); m.todos = m.todos.filter(t => t.id !== b.dataset.id); save(); render(); };
ACT.addTime = b => { curMeeting().minutes += Number(b.dataset.min); save(); render(); };
ACT.delMeeting = async () => {
  if (!await ask(`<h2>Delete these meeting notes?</h2><p class="muted">Version history keeps earlier saves.</p><div class="row end"><button type="button" class="btn ghost" data-cancel>Keep</button><button class="btn danger">Delete</button></div>`)) return;
  S.meetings = S.meetings.filter(m => m.id !== route().a); save(); go('meetings');
};
ACT.endMeeting = async () => {
  const m = curMeeting(), p = planById(m.planId), guess = p ? nextStep(p).key : '';
  const fd = await ask(`<h2>Wrap up team time</h2><p class="muted">Next week, Launchpad opens right here.</p>
    ${p ? `<div class="field"><label for="eStop">Where did you stop?</label><select id="eStop" name="stop">${STEPS.map(s => `<option value="${s.key}" ${s.key === guess ? 'selected' : ''}>${esc(s.label)}${stepState(p, s.key) === 100 ? ' (done)' : ''}</option>`).join('')}</select></div>` : ''}
    <div class="field"><label for="eNext">Next time we'll…</label><input id="eNext" name="next" type="text" placeholder="Look at results together and plan reteaching"></div>
    <div class="row end"><button type="button" class="btn ghost" data-cancel>Keep working</button><button class="btn fam f-team">${icon('done')}End and save notes</button></div>`);
  if (!fd) return;
  m.endedAt = new Date().toISOString();
  if (p) m.stoppedAt = { planId: p.id, stepKey: fd.get('stop') };
  m.nextTime = String(fd.get('next') || '');
  save(); toast('Saved. Next week starts where you stopped.'); go('home');
};

/* ================================================================ RESULTS */
function viewResults() {
  const withScores = S.plans.filter(p => p.scores.length);
  return `<div class="page-head"><div class="lead"><span class="eyebrow">Results</span><h1>How our students are doing</h1>
    <p>Totals for each plan's team check. Each teacher's own classes are visible only to them.</p></div></div>
    ${privacyNote(`Team results stay hidden until at least ${PRIVACY_MIN_STUDENTS} students from ${PRIVACY_MIN_TEACHERS} teachers are scored, so no one class can be singled out.`)}
    <div class="stack" style="margin-top:16px">${withScores.length ? withScores.map(p => {
      const team = stats(p), mine = ME ? stats(p, { teacherId: ME }) : null;
      return `<div class="stack"><div class="row"><span class="orb sm f-learn">${icon('plan')}</span><h3 class="spacer">${esc(planTitle(p))}</h3><a class="btn sm fam f-check" href="#plan-${p.id}-results">Open results step</a><a class="btn sm ghost" href="#plan-${p.id}-scores">Enter scores</a></div>
        <div class="teacher-dots">${S.members.map(m => { const st = stats(p, { teacherId: m.id }); return `<span class="tdot ${st.n ? 'in' : ''}"><i>${esc(initials(m.name))}</i>${st.n ? 'Scores in' : 'Waiting'}</span>`; }).join('')}</div>
        ${resultsPanel(p, team, mine)}</div>`;
    }).join('') : `<div class="empty">${icon('results')}<b>No scores yet</b><span>Scores are entered in step 6 of each plan.</span></div>`}</div>`;
}

/* ============================================================ WHAT WORKED */
function inviteCard(inv) {
  const i = inv.plan.targets.indexOf(inv.target);
  return `<div class="invite f-reteach"><div class="card-head"><span class="orb">${icon('practice')}</span><div class="grow"><span class="eyebrow" style="color:var(--reteach)">An invitation for you · only you see this</span>
    <h3>Your students did better than the team on "${esc(inv.target.text)}"</h3></div></div>
    <div class="vs"><span class="letter sm">${LETTERS[i]}</span>
      <div class="vs-bar f-reteach"><div class="bar"><i style="width:${inv.mine}%"></i></div><span><b>Your students</b><b>${inv.mine}%</b></span></div>
      <div class="vs-bar f-tool"><div class="bar"><i style="width:${inv.team}%;background:var(--line)"></i></div><span><b>Whole team</b><b>${inv.team}%</b></span></div></div>
    <p>Would you share what you did? A sentence or two helps your teammates plan their reteaching. You choose whether your name shows.</p>
    <div class="row"><button class="btn fam f-reteach" data-act="share" data-key="${inv.key}">${icon('share')}Share what I did</button>
      <button class="btn ghost sm" data-act="inviteLater" data-key="${inv.key}">Not now</button><button class="btn ghost sm" data-act="inviteNever" data-key="${inv.key}">Don't ask for this skill</button></div></div>`;
}
function stratCard(s) {
  const p = planById(s.planId), t = p?.targets.find(x => x.id === s.targetId);
  const who = s.anonymous ? 'A teammate' : memberName(s.teacherId);
  return `<article class="strat f-reteach"><div class="who"><span class="avatar">${s.anonymous ? icon('person') : esc(initials(who))}</span><span><b style="color:var(--ink)">${esc(who)}</b> shared ${esc(fmtDate(s.sharedAt))}</span></div>
    <blockquote>${esc(s.text)}</blockquote>
    <div class="row">${s.mine != null ? `<span class="proof">${icon('results')}${s.mine}% got it · team ${s.team}%</span>` : ''}${(s.tags || []).map(x => `<span class="chip" style="font-size:.78rem;padding:3px 10px">${esc(x)}</span>`).join('')}</div>
    ${t ? `<p class="small muted">For: ${esc(t.text)}</p>` : ''}${s.link ? `<a class="small" href="${esc(s.link)}" target="_blank" rel="noopener">${icon('link')} Materials</a>` : ''}
    ${s.teacherId === ME ? `<div><button class="btn sm ghost" data-act="unshare" data-id="${s.id}">Stop sharing</button></div>` : ''}</article>`;
}
function viewWorked() {
  const invites = invitationsFor(ME);
  const byPlan = S.plans.map(p => [p, S.strategies.filter(s => s.planId === p.id)]).filter(([, l]) => l.length);
  return `<div class="page-head"><div class="lead"><span class="eyebrow">What worked for us</span><h1>Teaching moves our team shares</h1>
    <p>When a teacher's students do better than the team on a skill, Launchpad invites them to share what they did. Sharing is always a choice, and you decide whether your name shows.</p></div>${termChip('Shared instructional practice', 'reteach')}</div>
    ${invites.length ? `<div class="stack" style="margin-bottom:26px">${invites.map(inviteCard).join('')}</div>` : ''}
    ${byPlan.length ? byPlan.map(([p, list]) => `<div class="stack" style="margin-bottom:26px"><div class="row"><span class="orb sm f-learn">${icon('plan')}</span><h3>${esc(planTitle(p))}</h3></div><div class="grid2">${list.map(stratCard).join('')}</div></div>`).join('')
      : `<div class="empty">${icon('practice')}<b>Nothing shared yet</b><span>Invitations appear after team results come in.</span></div>`}`;
}
const inviteByKey = key => invitationsFor(ME).find(i => i.key === key);
ACT.inviteLater = b => { ((S.invites[ME] ||= {}))[b.dataset.key] = 'later:' + addDays(todayISO(), 7); save(); render(); toast('We\'ll ask again next week.'); };
ACT.inviteNever = b => { ((S.invites[ME] ||= {}))[b.dataset.key] = 'never'; save(); render(); toast('Got it. We won\'t ask about this skill again.'); };
ACT.share = async b => {
  const inv = inviteByKey(b.dataset.key); if (!inv) return;
  const tags = ['Hands-on', 'Visual', 'Small groups', 'Partner check', 'Explained it differently', 'Real-world example', 'Technology', 'More practice time'];
  const fd = await ask(`<h2>Share what you did</h2><p class="muted">For "${esc(inv.target.text)}" · your students ${inv.mine}%, team ${inv.team}%</p>
    <div class="field"><label for="shText">What did you do that you think made the difference?</label><textarea id="shText" name="text" required placeholder="I had students hold a real block and trace each face before drawing…"></textarea></div>
    <div class="field"><span class="lbl">Tags (optional)</span><div class="chips">${tags.map(t => `<label class="chip"><input type="checkbox" name="tags" value="${esc(t)}"> ${esc(t)}</label>`).join('')}</div></div>
    <div class="field"><label for="shLink">Link to materials (optional)</label><input id="shLink" name="link" type="url" placeholder="https://"></div>
    <div class="field"><span class="lbl">Show my name?</span><div class="chips"><label class="chip"><input type="radio" name="anon" value="no" checked> Yes, show my name</label><label class="chip"><input type="radio" name="anon" value="yes"> Share as "a teammate"</label></div></div>
    <div class="row end"><button type="button" class="btn ghost" data-cancel>Cancel</button><button class="btn fam f-reteach">${icon('share')}Share with my team</button></div>`);
  if (!fd) return;
  S.strategies.push({ id: uid(), planId: inv.plan.id, targetId: inv.target.id, teacherId: ME, anonymous: fd.get('anon') === 'yes', text: String(fd.get('text')).trim(),
    tags: fd.getAll('tags').map(String), link: String(fd.get('link') || '').trim(), mine: inv.mine, team: inv.team, sharedAt: todayISO() });
  save(); render(); toast('Thank you. Your idea now shows in What worked for us.');
};
ACT.unshare = async b => {
  if (!await ask(`<h2>Stop sharing this?</h2><p class="muted">It will be removed for your whole team.</p><div class="row end"><button type="button" class="btn ghost" data-cancel>Keep sharing</button><button class="btn danger">Stop sharing</button></div>`)) return;
  S.strategies = S.strategies.filter(s => s.id !== b.dataset.id); save(); render();
};

/* ================================================================ TEAM */
function viewTeam() {
  const roles = ['Teacher', 'Team lead', 'Coach', 'Administrator'];
  const cats = Object.entries(APP.catalogs);
  return `<div class="page-head"><div class="lead"><span class="eyebrow">Team</span><h1>Our team</h1><p>Who's on the team, how you work together, and which standards you use.</p></div>
    <a class="btn ghost" href="#words">${icon('glossary')}PLC words</a></div>
    <div class="grid2" style="align-items:start">
      <div class="stack">
        <div class="card f-team"><div class="card-head"><span class="orb sm">${icon('team')}</span><h3 class="grow">Team details</h3></div>
          <div class="fields"><div class="field"><label for="tName">Team name</label><input id="tName" type="text" data-bind="t:team.name" value="${esc(S.team.name)}"></div>
            <div class="field"><label for="tCourse">Course</label><input id="tCourse" type="text" data-bind="t:team.course" value="${esc(S.team.course)}"></div>
            <div class="field"><label for="tGrade">Grade or level</label><input id="tGrade" type="text" data-bind="t:team.grade" value="${esc(S.team.grade)}"></div></div></div>
        <div class="card f-team"><div class="row"><span class="orb sm">${icon('person')}</span><h3 class="spacer">Members</h3><button class="btn sm fam" data-act="addMember">${icon('plus')}Add a teacher</button></div>
          ${S.members.map(m => `<div class="stack" style="background:var(--wash);border-radius:24px;padding:12px 14px;gap:10px"><div class="row"><span class="avatar">${esc(initials(m.name))}</span><input type="text" aria-label="Name" data-bind="t:members.#${m.id}.name" value="${esc(m.name)}" placeholder="Name" style="flex:1;min-width:140px">${m.id === ME ? '<span class="chip" aria-pressed="true" style="--c:var(--team);--on:var(--on-team)">You</span>' : ''}<button class="icon-btn" data-act="delMember" data-id="${m.id}" aria-label="Remove ${esc(m.name)}">${icon('trash')}</button></div>
            <div class="fields"><input type="email" aria-label="School email" data-bind="t:members.#${m.id}.email" value="${esc(m.email)}" placeholder="School email">
            <select aria-label="Role" data-bind="t:members.#${m.id}.role">${roles.map(r => `<option ${m.role === r ? 'selected' : ''}>${r}</option>`).join('')}</select>
            <input type="text" class="wide" aria-label="Class periods" data-bind="t:members.#${m.id}.periods" value="${esc(m.periods || '')}" placeholder="Class periods, like 1, 3, 5"></div></div>`).join('') || '<p class="muted small">No one yet. Add each teacher on the team.</p>'}
          ${privacyNote('School emails let Launchpad know who\'s signed in on your school\'s Google site.')}
          ${S.members.length ? `<button class="btn sm soft" data-act="whoAmI">${icon('person')}${ME && member(ME) ? 'Change which teacher you are' : 'Which teacher are you?'}</button>` : ''}</div>
      </div>
      <div class="stack">
        <div class="card f-team"><div class="row"><span class="orb sm">${icon('norms')}</span><h3 class="spacer">Team agreements</h3><button class="btn sm fam" data-act="addNorm">${icon('plus')}Add</button></div>
          ${termChip('Norms', 'team')}
          ${S.norms.map((n, i) => `<div class="row"><span class="orb sm soft">${i + 1}</span><input type="text" aria-label="Agreement ${i + 1}" data-bind="t:norms.#${n.id}.text" value="${esc(n.text)}" style="flex:1"><button class="icon-btn" data-act="delNorm" data-id="${n.id}" aria-label="Remove agreement">${icon('trash')}</button></div>`).join('') || `<p class="muted small">Agreements like "We start and end on time" keep meetings on track.</p>`}</div>
        <div class="card f-learn"><div class="card-head"><span class="orb sm">${icon('standard')}</span><h3 class="grow">Standards we use</h3></div>
          ${APP.mode === 'cloud' ? `<p class="small muted">Set by your school's Launchpad admin in the directory.</p><ul class="small">${(S.team.catalogs || []).map(k => `<li>${esc(APP.catalogs[k]?.title || k)}</li>`).join('')}</ul>`
            : `<div class="chips">${cats.map(([k, c]) => `<button type="button" class="chip" aria-pressed="${(S.team.catalogs || []).includes(k)}" data-act="toggleCat" data-k="${k}">${esc(c.title || k)}</button>`).join('')}</div>`}</div>
        ${APP.mode === 'local' ? `<div class="card"><h3>This browser</h3><p class="small muted">Right now your team saves only in this browser. Once Launchpad is on your school's Google site, it saves online for the whole team.</p>
          <div class="row">${APP.demo ? `<button class="btn sm" data-act="startOwnTeam">${icon('plus')}Start our own team</button><button class="btn sm ghost" data-act="resetDemo">Reset the example</button>` : `<button class="btn sm ghost" data-act="startOwnTeam">${icon('plus')}Start another team</button>`}</div></div>` : ''}
      </div>
    </div>`;
}
ACT.addMember = () => { S.members.push({ id: uid(), name: '', email: '', role: 'Teacher', periods: '' }); save(); render(); setTimeout(() => { const ins = $$('[data-bind$=".name"]'); ins[ins.length - 1]?.focus(); }, 30); };
ACT.delMember = async b => {
  if (!await ask(`<h2>Remove this teacher?</h2><p class="muted">Scores they entered stay with the plan.</p><div class="row end"><button type="button" class="btn ghost" data-cancel>Keep</button><button class="btn danger">Remove</button></div>`)) return;
  S.members = S.members.filter(m => m.id !== b.dataset.id); save(); render();
};
ACT.addNorm = () => { S.norms.push({ id: uid(), text: '' }); save(); render(); };
ACT.delNorm = b => { S.norms = S.norms.filter(n => n.id !== b.dataset.id); save(); render(); };
ACT.toggleCat = b => { const k = b.dataset.k, c = S.team.catalogs || []; S.team.catalogs = c.includes(k) ? c.filter(x => x !== k) : [...c, k]; save(); render(); };
ACT.resetDemo = async () => {
  if (!await ask(`<h2>Reset the example team?</h2><div class="row end"><button type="button" class="btn ghost" data-cancel>Cancel</button><button class="btn">Reset</button></div>`)) return;
  S = sampleState(); ME = 'm1'; store.set('lp-me:demo', 'm1'); save(); go('home');
};

/* ================================================================ PLC WORDS */
function viewWords() {
  return `<div class="page-head"><div class="lead"><span class="eyebrow">PLC words</span><h1>Plain words, real terms</h1>
    <p>Launchpad uses everyday words on every screen, with the PLC term right beside them. Here they all are in one place.</p></div></div>
    ${Object.entries({ ...FAMILIES, team: { n: '', word: 'Team', q: 'How do we work together?' } }).map(([f, info]) => `<div class="stack" style="margin-bottom:28px">
      <div class="row f-${f}"><span class="orb">${icon(f)}</span><h2 style="font-size:1.4rem">${info.n ? info.n + ' · ' : ''}${info.word}</h2><span class="muted">${esc(info.q)}</span></div>
      <div class="words">${WORDS.filter(w => w[0] === f).map(w => `<div class="word f-${f}"><h3>${esc(w[1])}</h3><span class="term" style="cursor:default"><span class="tag">PLC term</span>${esc(w[2])}</span>
        <p>${esc(w[3])}</p>${w[4] ? `<p class="example"><i>Example:</i> ${esc(w[4])}</p>` : ''}
        <div><button class="btn sm soft" data-act="say" data-text="${esc(w[2] + '. ' + w[3])}">${icon('listen')}Hear it</button></div></div>`).join('')}</div></div>`).join('')}`;
}

/* ================================================================ START */
window.addEventListener('hashchange', () => { voice.stop(); render(); });
boot().then(ok => { if (ok) render(); });
