/* ======================================================================================
   R03 · Five-step cycle (Plan · Build check · Teach · Respond · Close), Our Home, Teach, Close
   Everything below runs inside the app's launch scope, so it uses the same state, save(),
   routing and helpers as the rest of the app. Data: schemaVersion 6 adds cycle.activities
   and cycle.close; older workspaces are migrated in normalize() through r03Migrate().
   ====================================================================================== */
const R03_STEPS=[
  {key:'plan',label:'Plan',icon:'target',chip:'c-plan',ring:'#b9d0e9',sub:'Standard, targets, goal'},
  {key:'check',label:'Build check',icon:'quiz',chip:'c-assess',ring:'#ebc69c',sub:'Our common check'},
  {key:'teach',label:'Teach',icon:'activity',chip:'c-teach',ring:'#d6c3e9',sub:'Our activities'},
  {key:'respond',label:'Respond',icon:'results',chip:'c-results',ring:'#bed8c5',sub:'Results, support, extend'},
  {key:'close',label:'Close',icon:'check',chip:'c-close',ring:'#daabba',sub:'Keep, refine, or replace'}
];
const R03_RESULT={new:['p-new','Not used yet'],worked:['p-worked','Worked'],tweak:['p-tweak','Tweak'],dropped:['p-dropped','Dropped']};
const R03_DECIDE=[['keep','Keep'],['refine','Refine'],['replace','Replace']];
const R03_AVATAR=['#2d5ea8','#8953b4','#418f4d','#d77b18','#c0607f','#3a9aa3','#6b5d2f','#5d6b84'];
let r03Filter='all',r03Form=null,r03WhoOpen='';

/* ---------- helpers shared by every R03 screen ---------- */
function r03Sid(c){return c.standardIds.find(id=>state.selected.includes(id))||c.standardIds.find(id=>byId.has(id))||'unlinked'}
function r03Number(c){return state.cycles.indexOf(c)+1}
function r03Name(c){return 'Cycle '+r03Number(c)+' · '+(c.title.trim()||'Untitled cycle')}
function r03ActiveCycle(){
  let id=null;try{id=localStorage.getItem(key+':r03-active')}catch{}
  return state.cycles.find(c=>c.id===id)||[...state.cycles].reverse().find(c=>!c.close?.closedAt)||state.cycles[state.cycles.length-1]||null;
}
function r03SetActive(c){try{localStorage.setItem(key+':r03-active',c.id)}catch{}}
function r03Primary(c){
  const common=a=>!a.followupSourceId&&a.checkpoint!=='followup';
  return (c.goalAssessmentId&&c.assessments.find(a=>a.id===c.goalAssessmentId&&common(a)))||c.assessments.find(common)||null;
}
function r03Results(c){
  const a=r03Primary(c);if(!a)return null;
  const list=a.results.filter(r=>analyzeResults(r).assessed.length);
  return list.length?{a,r:list[list.length-1],first:list[0]}:null;
}
/* A cycle's learning targets: each line of the Plan's learning target, plus every target named on the common check. */
function r03Targets(c){
  const seen=new Map(),add=t=>{t=String(t||'').trim();if(t&&!seen.has(t.toLowerCase()))seen.set(t.toLowerCase(),t)};
  String(c.learning||'').split(/\n+/).forEach(add);
  (r03Primary(c)?.items||[]).forEach(i=>add(i.learningTarget));
  return [...seen.values()].slice(0,12).map((text,i)=>({id:text,label:'T'+(i+1),text}));
}
function r03Target(c,id){return r03Targets(c).find(t=>t.id===id)}
/* How students did on one target, from the latest results. Hidden until 5 students from 3 teachers (same rule as the team view). */
function r03TargetStat(c,targetId){
  const R=r03Results(c);if(!R)return null;
  const items=R.r.snapshot.assessment.items,idx=items.map((it,i)=>(String(it.learningTarget||it.prompt||'').trim()===targetId?i:-1)).filter(i=>i>=0);
  if(!idx.length)return {none:true};
  return skillEvidence(analyzeResults(R.r).rows,items,idx);
}
function r03TeamRate(R){
  const an=analyzeResults(R.r),teachers=new Set(an.assessed.map(x=>x.row.teacher.trim()));
  return {rate:an.rate,n:an.assessed.length,shared:an.assessed.length>=5&&teachers.size>=3};
}
function r03Steps(c){
  r03Ensure(c);
  const a=r03Primary(c),R=r03Results(c),tp=R?.r.teamPlan||{};
  const done={plan:issues(c).length===0,check:!!a&&!assessmentIssues(a,c).length,teach:!!R,
    respond:!!R&&!!((tp.support||'').trim()||(tp.extension||'').trim()||(R.r.nextSteps||'').trim()),close:!!c.close?.closedAt};
  return {done,current:(R03_STEPS.find(s=>!done[s.key])||R03_STEPS[4]).key};
}
function r03StepUrl(c,step){return urlFor('cycle',r03Sid(c),c.id,step)}
function r03Today(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function r03Initials(name){return String(name||'?').replace(/^(Ms|Mr|Mrs|Dr|Mx)\.?\s+/i,'').split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('')||'?'}
function r03Member(id){return state.members.find(m=>m.id===id)}
function r03Hash(s){let h=0;for(const ch of String(s))h=(h*31+ch.charCodeAt(0))|0;return Math.abs(h).toString(36)}
function r03IconPaths(){return {
  activity:'<path d="M4 5h16v11H4Z"/><path d="M8 20h8M12 16v4"/><path d="m9 9 2 2 4-4"/>',
  link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  file:'<path d="M6 3h8l4 4v14H6Z"/><path d="M14 3v4h4M9 12h6m-6 4h6"/>',
  photo:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-8 8"/>',
  note:'<path d="M5 4h14v16H5Z"/><path d="M8 8h8m-8 4h8m-8 4h5"/>',
  pin:'<path d="M8 3h8l-1 6 3 4v2H6v-2l3-4-1-6ZM12 15v7"/>',
  cycle:'<path d="M20 12a8 8 0 0 1-14.3 4.9M4 12a8 8 0 0 1 14.3-4.9"/><path d="M18.5 3v4.2h-4.2M5.5 21v-4.2h4.2"/>'
}}

/* ---------- data: schemaVersion 6 (runs inside normalize, before the rest of R03 loads) ---------- */
function r03Clean(v,n){return typeof v==='string'?v.slice(0,n):''}
function r03Migrate(ws){
  ws.schemaVersion=6;
  for(const c of ws.cycles||[]){
    c.activities=(Array.isArray(c.activities)?c.activities:[]).filter(a=>a&&typeof a==='object').slice(0,200).map(a=>({
      id:/^[\w-]{1,80}$/.test(a.id||'')?a.id:crypto.randomUUID(),
      title:r03Clean(a.title,200)||'Untitled activity',
      targetId:r03Clean(a.targetId,3000),
      attachments:(Array.isArray(a.attachments)?a.attachments:[]).filter(x=>x&&['link','file','photo','note'].includes(x.type)).slice(0,10).map(x=>({
        type:x.type,label:r03Clean(x.label,200),value:r03Clean(x.value,3000),
        ...(x.file&&typeof x.file==='object'?{file:{workspaceId:r03Clean(x.file.workspaceId,80),fileId:r03Clean(x.file.fileId,80),driveId:r03Clean(x.file.driveId,200),name:r03Clean(x.file.name,200)}}:{})})),
      lookFor:r03Clean(a.lookFor,1000),
      usedBy:(Array.isArray(a.usedBy)?a.usedBy:[]).filter(x=>typeof x==='string'&&x.length<=80).slice(0,100),
      result:['new','worked','tweak','dropped'].includes(a.result)?a.result:'new',
      createdBy:r03Clean(a.createdBy,160),createdAt:r03Clean(a.createdAt,40),updatedAt:r03Clean(a.updatedAt,40)}));
    const cl=c.close&&typeof c.close==='object'&&!Array.isArray(c.close)?c.close:{};
    const dec=cl.decisions&&typeof cl.decisions==='object'?cl.decisions:{};
    c.close={decisions:Object.fromEntries(Object.entries(dec).filter(([k,v])=>k.length<=120&&['keep','refine','replace'].includes(v)).slice(0,300)),
      notes:r03Clean(cl.notes,6000),closedAt:r03Clean(cl.closedAt,40),nextCycleId:r03Clean(cl.nextCycleId,80)};
  }
  return ws;
}
function r03ValidActivities(list){return Array.isArray(list)&&list.length<=200&&list.every(a=>a&&typeof a==='object'&&typeof a.title==='string'&&a.title.length<=200)}

/* ---------- order fix: the goal's assessment name, proficiency rule and baseline fill in from later steps ---------- */
/* Cycles created during this session (for example by Zava's guided flow) get the R03 fields right away. */
function r03Ensure(c){
  if(!Array.isArray(c.activities))c.activities=[];
  if(!c.close||typeof c.close!=='object')c.close={decisions:{},notes:'',closedAt:'',nextCycleId:''};
  return c;
}
function r03Sync(){
  let changed=false;
  for(const c of state.cycles){
    r03Ensure(c);
    const a=r03Primary(c);
    if(a&&a.title.trim()&&!c.assessment.trim()){c.assessment=a.title;c.goalAssessmentId=a.id;changed=true}
    if(a&&String(a.threshold).trim()&&assessmentTotal(a)>0&&!c.proficiency.trim()){c.proficiency='Score at least '+a.threshold+' of '+Number(assessmentTotal(a).toFixed(6))+' points'+(a.criteria.trim()?'; '+a.criteria.trim():'')+'.';changed=true}
    const R=r03Results(c);
    if(R&&!c.baselineManual&&(c.baselineStatus!=='known'||c.baselineAuto&&c.baselineEvidence!=='First results: '+(R.a.title||'common check'))){
      const rate=analyzeResults(R.first).rate;
      if(rate!==null){c.baselineStatus='known';c.baseline=String(Math.round(rate));c.baselineDate=/^\d{4}-\d{2}-\d{2}$/.test(R.first.date)?R.first.date:r03Today();c.baselineEvidence='First results: '+(R.a.title||'common check');c.baselineAuto=true;changed=true}
    }
  }
  if(changed)save();
}

/* ---------- routing ---------- */
function r03Prep(){
  stopZavaCoach();stopEssentialDemo();
  guideObserver?.disconnect();guideObserver=null;
  document.querySelectorAll('.guided-embedded,.guide-branch,.guide-leaf').forEach(e=>e.classList.remove('guided-embedded','guide-branch','guide-leaf'));
  centeredOutlineObserver?.disconnect();
  const body=$('workspaceBody');body.classList.remove('centered-plan-preview','stacked-plan-preview');
  for(const editor of Object.values(editors))shelf.append(editor);
  body.replaceChildren();return body;
}
function r03Redirect(...parts){location.replace(urlFor(...parts))}
function renderRoute(){
  r03Sync();
  const [page='home',id,cid,step]=locationParts;
  if(page==='home'){const body=r03Prep();breadcrumb([['Our Home']]);body.innerHTML=r03HomeScreen();return}
  if(page==='cycles'){const body=r03Prep();breadcrumb([['Our Home',[]],['Our Cycles']]);body.innerHTML=homeScreen();return}
  if(page==='activities'){const c=r03ActiveCycle();if(c){r03Redirect('cycle',r03Sid(c),c.id,'teach');return}const body=r03Prep();breadcrumb([['Our Home',[]],['Our Activities']]);body.innerHTML=r03NoCycle('Our Activities','Activities belong to a cycle. Start our first cycle, then add the activities we teach with.');return}
  if(page==='cycle'){
    const c=state.cycles.find(x=>x.id===cid);if(!c){go();return}
    r03SetActive(c);
    const sid=r03Sid(c);
    if(step==='plan'){r03Redirect('goal',sid,c.id);return}
    if(step==='check'){
      let a=r03Primary(c);
      if(!a){a=newCommonQuiz(c,(c.title.trim()||'Our')+' common check');c.goalAssessmentId=a.id;save()}
      r03Redirect('assessment',sid,c.id,a.id);return;
    }
    if(step==='respond'){
      const R=r03Results(c),a=r03Primary(c);
      if(R){r03Redirect('results',sid,c.id,R.a.id,R.r.id);return}
      if(a&&!assessmentIssues(a,c).length){r03Redirect('entry',sid,c.id,a.id);return}
    }
    const body=r03Prep();
    breadcrumb([['Our Home',[]],[r03Name(c),['cycle',sid,c.id,r03Steps(c).current]],[R03_STEPS.find(s=>s.key===step)?.label||'Step']]);
    body.innerHTML=r03Stepbar(c,step)+(step==='teach'?r03TeachScreen(c):step==='close'?r03CloseScreen(c):r03RespondWaiting(c));
    return;
  }
  renderRouteV0509();
  r03Decorate(page);
}
/* Put the five-step bar on top of the existing cycle pages. */
function r03Decorate(page){
  const map={goal:'plan',target:'plan',assessment:'check',results:'respond',entry:'respond'};
  let step=map[page];
  if(page==='organizer')step=locationParts.slice(3).some(p=>/^a-|assess/.test(String(p)))?'check':'plan';
  const c=state.cycles.find(x=>x.id===locationParts[2]);
  if(!step||!c)return;
  r03SetActive(c);
  if(locationParts.includes('a-forms'))document.querySelector('section.digital-quiz>details.r03-advanced')?.setAttribute('open','');
  const body=$('workspaceBody');
  if(!body.querySelector(':scope>.r03-stepbar'))body.insertAdjacentHTML('afterbegin',r03Stepbar(c,step));
  updateProductNavigation(page);
}
function r03Stepper(c,here){
  const {done,current}=r03Steps(c);
  if(c.id==='blank')return '<div class="r03-stepper">'+R03_STEPS.map((s,i)=>'<span class="r03-step '+(i===0?'current':'')+'" style="--ring:'+s.ring+'"><span class="r03-chip '+s.chip+'">'+productIcon(s.icon)+'</span><b>'+esc(s.label)+'</b><small>'+esc(s.sub)+'</small></span>').join('')+'</div>';
  return '<div class="r03-stepper">'+R03_STEPS.map(s=>'<a class="r03-step '+(done[s.key]?'done ':'')+(s.key===here?'here ':!here&&s.key===current?'current ':'')+'" style="--ring:'+s.ring+'" href="'+r03StepUrl(c,s.key)+'"'+(s.key===here?' aria-current="step"':'')+'><span class="r03-chip '+s.chip+'">'+productIcon(s.icon)+'</span><b>'+esc(s.label)+'</b><small>'+esc(r03StepNote(c,s.key,done,current))+'</small></a>').join('')+'</div>';
}
function r03StepNote(c,key,done,current){
  if(key==='plan')return done.plan?'Standard, targets, goal':'Standard, targets, goal'+(current==='plan'?' · in progress':'');
  if(key==='check')return done.check?'Common check ready':current==='check'?'Building our check':'Our common check';
  if(key==='teach'){const n=c.activities.length;return current==='teach'?(n?n+' activit'+(n===1?'y':'ies')+' · in progress':'Add our activities'):n?n+' activit'+(n===1?'y':'ies'):'Our activities'}
  if(key==='respond')return done.respond?'Groups planned':current==='respond'?'Results are in':'Results, support, extend';
  return done.close?'Closed':'Keep, refine, or replace';
}
function r03Stepbar(c,here){
  return '<nav class="r03 r03-stepbar" aria-label="Cycle steps"><div class="r03-stepbar-name"><span>'+esc(r03Name(c))+'</span><a href="'+urlFor()+'">Our Home</a></div>'+r03Stepper(c,here)+'</nav>';
}
function r03NoCycle(title,text){
  return '<section class="r03"><div class="r03-head"><span class="r03-chip lg c-plan">'+productIcon('layers')+'</span><div><h1>'+esc(title)+'</h1></div></div><div class="r03-empty"><p>'+esc(text)+'</p><p><a class="r03-btn blue" href="'+urlFor('organizer')+'">'+productIcon('plus')+'Start our first cycle</a></p></div></section>';
}
function r03RespondWaiting(c){
  const a=r03Primary(c);
  return '<section class="r03"><div class="r03-card results"><div class="r03-card-h"><span class="r03-chip c-results">'+productIcon('results')+'</span><h3>Our Results</h3></div><div class="r03-card-b"><p class="r03-later">Results open once our common check is ready. Finish it in Build check, give it to students, then enter scores here.</p><p style="margin-top:12px"><a class="r03-btn" href="'+r03StepUrl(c,'check')+'">'+productIcon('quiz')+(a?'Finish our common check':'Build our common check')+'</a></p></div></div></section>';
}

/* ---------- Our Home ---------- */
function r03HomeScreen(){
  const subjectName=getSelectorsData().subjects.find(s=>s.id===(directoryTeam||getSelectorsData().teams.find(t=>teamCode(t)===subject))?.subjectId)?.name;
  const eyebrow=[subjectName,state.course].filter(Boolean).map(esc).join(' · ')||'Our team workspace';
  const head='<div class="r03-head"><span class="r03-chip lg c-home">'+productIcon('home')+'</span><div><div class="eyebrow">'+eyebrow+'</div><h1>Our PLC Home</h1></div></div>';
  const c=r03ActiveCycle();
  if(!c)return '<section class="r03">'+head+'<div class="r03-now"><div class="r03-now-top"><div><div class="label">Where we are</div><h2>Let’s start our first cycle</h2><p>A cycle takes one essential standard through five steps: Plan, Build check, Teach, Respond and Close.</p></div><div class="go">'+(state.selected.length?'':'<a class="r03-btn" href="'+urlFor('setup','browse')+'">'+productIcon('book')+'Choose our standards</a>')+'<a class="r03-btn blue" href="'+urlFor('organizer')+'">'+productIcon('plus')+'Start our first cycle</a></div></div>'+r03Stepper({...r03BlankCycle(),title:''},'')+'</div>'+r03Cards(null)+'</section>';
  const {current,done}=r03Steps(c),st=R03_STEPS.find(s=>s.key===current);
  const switcher=state.cycles.length>1?'<label class="r03-switch r03-quiet">Cycle<select data-r03-switch aria-label="Switch cycle">'+state.cycles.map(x=>'<option value="'+esc(x.id)+'" '+(x===c?'selected':'')+'>'+esc(r03Name(x))+(x.close?.closedAt?' (closed)':'')+'</option>').join('')+'</select></label>':'';
  const btnClass={plan:'blue',check:'',teach:'primary',respond:'green',close:'rose'}[current];
  return '<section class="r03">'+head+'<div class="r03-now"><div class="r03-now-top"><div><div class="label">Where we are</div><h2>'+esc(r03Name(c))+'</h2><p>'+r03Status(c,current,done)+'</p></div><div class="go">'+switcher+
    '<a class="r03-btn '+btnClass+'" href="'+r03StepUrl(c,current)+'">'+productIcon(st.icon)+(done.close?'Look back at this cycle':current==='close'?'Close our cycle':'Open '+esc(st.label))+'</a></div></div>'+r03Stepper(c,'')+'</div>'+r03Cards(c)+
    '</section>';
}
function r03BlankCycle(){const c={id:'blank',course:'',goalOverride:'',standardIds:[],assessments:[],activities:[],close:{decisions:{},notes:'',closedAt:'',nextCycleId:''}};cycleFields.forEach(k=>c[k]='');c.baselineStatus='unknown';return c}
function r03Status(c,current,done){
  const a=r03Primary(c),date=a?.date||'';
  if(done.close)return 'This cycle is closed. Start the next one from Close.';
  if(current==='plan')return 'We’re planning: choosing our standard and targets and writing our goal.';
  if(current==='check')return 'We’re building our common check'+(date?' for <b>'+esc(prettyDate(date))+'</b>':'')+'.';
  if(current==='teach'){const used=c.activities.filter(x=>x.usedBy.length).length;return 'We’re teaching.'+(date?' Our common check is <b>'+esc(prettyDate(date))+'</b>.':'')+(c.activities.length?' '+used+' of our '+c.activities.length+' activities are in use.':' Add the activities we’ll teach with.')}
  if(current==='respond')return 'Results are in. Let’s plan support for students who need more time and extension for students who are ready.';
  return 'Time to close: keep, refine, or replace what we tried, then start the next cycle.';
}
function r03Cards(c){
  return '<div class="r03-grid">'+r03MeetingCard(c)+r03ActivitiesCard(c)+r03ResultsCard(c)+r03FollowupsCard(c)+'</div>';
}
function r03MeetingCard(c){
  const today=r03Today();
  const m=(state.meetings||[]).filter(m=>m.date&&m.date>=today).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))[0];
  const items=m?m.agenda:r03GeneratedAgenda(true);
  const list='<ul class="r03-agenda">'+items.slice(0,5).map(i=>{const t=/ · (\d+ min)$/.exec(i.title);return '<li><span class="t">'+(t?t[1]:'')+'</span><span>'+esc(t?i.title.slice(0,t.index):i.title)+'</span></li>'}).join('')+'</ul>';
  return '<section class="r03-card meet"><div class="r03-card-h"><span class="r03-chip c-meet">'+productIcon('calendar')+'</span><h3>Our Next Meeting</h3><span class="right">'+(m?esc(meetingDate(m)):'Not scheduled')+'</span></div><div class="r03-card-b">'+(items.length?list:'')+
    '<div class="r03-auto">'+productIcon('layers')+(m?'<a href="'+urlFor('meetings',m.id)+'">Open the agenda</a>':(c?'Built from where '+esc('Cycle '+r03Number(c))+' is. Notes save back into the cycle.':'Built from where our cycle is.')+' <button type="button" class="r03-btn small" data-r03-act="make-meeting">'+productIcon('plus')+'Create this meeting</button>')+'</div></div></section>';
}
function r03ActivitiesCard(c){
  const acts=c?c.activities:[];
  const body=acts.length?acts.slice(0,4).map(a=>{const [cls,label]=R03_RESULT[a.result];const t=r03Target(c,a.targetId);return '<div class="r03-mini"><span class="name">'+esc(a.title)+'</span>'+(t?'<span class="r03-pill r03-tgt">'+t.label+'</span>':'')+'<span class="r03-pill '+cls+'" style="margin-left:auto">'+label+'</span></div>'}).join('')
    :'<p class="r03-later">'+(c?'No activities yet. Add the lessons and tasks our team teaches with, tied to our targets.':'Activities belong to a cycle.')+'</p>';
  return '<section class="r03-card teach"><div class="r03-card-h"><span class="r03-chip c-teach">'+productIcon('activity')+'</span><h3>Our Activities</h3>'+(c?'<a class="r03-btn small right" href="'+r03StepUrl(c,'teach')+'">'+(acts.length?'See all '+acts.length:'Add one')+'</a>':'')+'</div><div class="r03-card-b">'+body+'</div></section>';
}
function r03ResultsCard(c){
  const R=c&&r03Results(c),a=c&&r03Primary(c);
  let body;
  if(!R)body='<div class="r03-later">Opens after '+(a?.date?esc(prettyDate(a.date))+'’s':'our')+' common check. Enter scores once, and we’ll see who needs support and who’s ready to go further, by student and by target.</div>';
  else{
    const t=r03TeamRate(R);
    const rows=r03Targets(c).map(tg=>{const s=r03TargetStat(c,tg.id);if(!s||s.none)return '';return '<div class="r03-mini"><span class="r03-pill r03-tgt">'+tg.label+'</span><span class="r03-bar"><i style="width:'+(s.shared?Math.round(s.rate):0)+'%"></i></span><span style="min-width:70px;text-align:right">'+(s.shared?Math.round(s.rate)+'%':'Hidden')+'</span></div>'}).join('');
    body=(t.shared?'<p><span class="r03-big">'+Math.round(t.rate)+'%</span> proficient · '+t.n+' students'+(percent(c.target)?' · goal '+esc(c.target)+'%':'')+'</p>':'<p class="r03-later">Team results stay hidden until at least 5 students from 3 teachers are scored.</p>')+rows+
      '<p style="margin-top:10px"><a class="r03-btn small" href="'+r03StepUrl(c,'respond')+'">'+productIcon('results')+'Open Respond</a></p>';
  }
  return '<section class="r03-card results"><div class="r03-card-h"><span class="r03-chip c-results">'+productIcon('results')+'</span><h3>Our Results</h3></div><div class="r03-card-b">'+body+'</div></section>';
}
function r03FollowupsDue(){
  const out=[],today=r03Today(),soon=new Date(Date.now()+7*864e5).toISOString().slice(0,10);
  for(const c of state.cycles)for(const a of c.assessments){
    if(a.checkpoint!=='followup'&&!a.followupSourceId)continue;
    for(const r of a.results)if(!r.teamPlan?.reflection?.trim()&&analyzeResults(r).rows.some(x=>x.assessed))out.push({icon:'team',text:'Review follow-up results: '+(a.title||c.title||'follow-up'),href:urlFor('results',r03Sid(c),c.id,a.id,r.id),planId:c.id});
  }
  for(const m of state.meetings||[])for(const i of m.agenda)if(i.due&&i.due<=soon&&!i.decision.trim()&&!i.carried)out.push({icon:'edit',text:i.title+(i.owner?' · '+i.owner:'')+(i.due<today?' (overdue)':''),href:urlFor('meetings',m.id),planId:i.planId});
  const c=r03ActiveCycle();
  if(c){
    for(const a of c.activities.filter(a=>a.result==='tweak'))out.push({icon:'activity',text:'Agree on the change to “'+a.title+'”',href:r03StepUrl(c,'teach'),planId:c.id});
    const R=r03Results(c);if(R&&!r03Steps(c).done.respond)out.push({icon:'results',text:'Plan support and extension groups for '+r03Name(c),href:r03StepUrl(c,'respond'),planId:c.id});
  }
  return out;
}
function r03FollowupsCard(){
  const due=r03FollowupsDue();
  return '<section class="r03-card close"><div class="r03-card-h"><span class="r03-chip c-close">'+productIcon('pin')+'</span><h3>Our Follow-ups</h3><span class="right">'+(due.length?due.length+' due':'')+'</span></div><div class="r03-card-b">'+
    (due.length?due.slice(0,5).map(f=>'<a class="r03-fu" href="'+f.href+'">'+productIcon(f.icon)+'<span>'+esc(f.text)+'</span></a>').join(''):'<p class="r03-later">Nothing due. Follow-ups from meetings, re-checks and activity changes show up here.</p>')+'</div></section>';
}

/* ---------- meetings: the next agenda comes from the active cycle's current step ---------- */
function r03MeetingTitle(){const c=r03ActiveCycle();if(!c)return '';const st=R03_STEPS.find(s=>s.key===r03Steps(c).current);return 'Cycle '+r03Number(c)+' · '+st.label}
/* preview adds the norms check-in that the meeting editor already shows as its built-in first item. */
function r03GeneratedAgenda(preview=false){
  const c=r03ActiveCycle(),item=(title,extra={})=>({id:crypto.randomUUID(),title,planId:'',notes:'',decision:'',owner:'',due:'',...extra});
  const items=preview?[item((String(state.norms||'').trim()?'Norms check-in':'Agree on our norms')+' · 5 min')]:[];
  if(c){
    const p={planId:c.id},acts=c.activities,worked=acts.filter(a=>a.result==='worked').map(a=>a.title),tweak=acts.filter(a=>a.result==='tweak').map(a=>a.title);
    const defs={
      plan:['Agree on the standard and learning targets · 15 min','Draft our SMART goal wording · 15 min'],
      check:['Review and finalize our common check · 20 min','Set the check date and who scores it · 10 min'],
      teach:['Share what’s working'+(worked.length?': '+worked.join(', '):'')+' · 15 min',(tweak.length?'Agree on changes to '+tweak.join(', '):'Agree on any changes to our activities')+' · 10 min'],
      respond:['Review results by learning target · 15 min','Assign support and extension groups · 15 min'],
      close:['Keep, refine, or replace our activities and strategies · 15 min','Start the next cycle · 10 min']
    }[r03Steps(c).current]||[];
    defs.forEach(t=>items.push(item(t,p)));
  }
  for(const f of r03FollowupsDue().slice(0,4))items.push(item('Follow-up: '+f.text,{planId:f.planId||''}));
  return items.slice(0,100);
}

/* ---------- Teach: our shared activity library ---------- */
function r03TeachScreen(c){
  const targets=r03Targets(c),a=r03Primary(c);
  const filters='<button type="button" class="r03-filter '+(r03Filter==='all'?'on':'')+'" data-r03-filter="all">All targets</button>'+targets.map(t=>'<button type="button" class="r03-filter '+(r03Filter===t.id?'on':'')+'" data-r03-filter="'+esc(t.id)+'">'+t.label+' · '+esc(t.text)+'</button>').join('');
  const list=c.activities.filter(x=>r03Filter==='all'||x.targetId===r03Filter);
  return '<section class="r03 r03-quiet"><div class="r03-head"><span class="r03-chip lg c-teach">'+productIcon('activity')+'</span><div><div class="eyebrow">'+esc(r03Name(c))+' · Step 3 of 5</div><h1>Our Activities</h1></div></div>'+
    '<div class="r03-how">'+productIcon('target')+'<b>Learning target</b><span class="arr">→</span><b>Our activity</b><span class="arr">→</span><b>What to look for</b><span class="arr">→</span><b>Our common check</b>'+(a?.date?' ('+esc(prettyDate(a.date))+')':'')+'<span style="margin-left:auto;color:var(--r03-muted)">After Respond, each activity shows how students did.</span></div>'+
    (r03Form?r03ActivityForm(c,targets):'')+
    '<div class="r03-toolbar">'+filters+(r03Form?'':'<button type="button" class="r03-btn primary" data-r03-act="open-form">'+productIcon('plus')+'Add activity</button>')+'</div>'+
    (list.length?'<div class="r03-acts">'+list.map(x=>r03ActivityCard(c,x)).join('')+'</div>':'<div class="r03-empty">'+(c.activities.length?'No activities for this target yet.':'No activities yet. Add the lessons, tasks and warm-ups our team teaches with. Anyone on the team can add one.')+'</div>')+
    '<p class="r03-note">Shared only: every activity belongs to the team. Anyone on the team can add one, mark who used it, and mark how it went.</p>'+
    '<p style="margin-top:14px"><a class="r03-btn green" href="'+r03StepUrl(c,'respond')+'">'+productIcon('results')+'Next: Respond</a></p></section>';
}
function r03ActivityForm(c,targets){
  const x=r03Form.id?c.activities.find(a=>a.id===r03Form.id):null,att=x?.attachments[0];
  const uploads=cloudDemo&&!!sharedId;
  return '<div class="r03-form" id="r03Form"><h3>'+(x?'Edit activity':'Add an activity for our team')+'</h3><div class="r03-fgrid">'+
    '<label>Activity name<input id="r03Title" maxlength="200" placeholder="e.g., Ruler scavenger hunt" value="'+esc(x?.title||'')+'"></label>'+
    '<label>Which target does it teach?'+(targets.length?'<select id="r03Target">'+targets.map(t=>'<option value="'+esc(t.id)+'" '+(x?.targetId===t.id?'selected':'')+'>'+t.label+' · '+esc(t.text)+'</option>').join('')+'</select>':'<select id="r03Target" disabled><option value="">No targets yet</option></select><small>Add learning targets in <a href="'+r03StepUrl(c,'plan')+'">Plan</a> first.</small>')+'</label>'+
    '<label class="full">Link, file, or notes <small>Anything works: a slide deck, a worksheet, a photo of the board, a video, or a few sentences.</small><span class="r03-attach-row"><select id="r03AttType"><option value="link" '+(att?.type==='link'?'selected':'')+'>Link</option><option value="note" '+(att?.type==='note'?'selected':'')+'>Notes</option><option value="file" '+(uploads?'':'disabled')+'>File'+(uploads?'':' (online workspace)')+'</option><option value="photo" '+(uploads?'':'disabled')+'>Photo'+(uploads?'':' (online workspace)')+'</option></select><span><input id="r03AttValue" maxlength="3000" placeholder="Paste a link or describe it" value="'+esc(att&&!att.file?att.value:'')+'"><input id="r03AttFile" type="file" hidden></span></span></label>'+
    '<label class="full">What to look for <small>What will students do that shows the target? This ties the activity to our common check.</small><input id="r03Look" maxlength="1000" placeholder="e.g., Students start measuring from the zero edge, not the ruler’s end" value="'+esc(x?.lookFor||'')+'"></label>'+
    '</div><p class="r03-hint" id="r03FormMsg" role="status"></p><div class="r03-form-actions"><button type="button" class="r03-btn" data-r03-act="cancel-form">Cancel</button><button type="button" class="r03-btn primary" data-r03-act="save-activity">'+productIcon(x?'check':'plus')+(x?'Save activity':'Add to our activities')+'</button></div></div>';
}
function r03AttachmentChip(att){
  const icon=att.type,label=esc(att.label||({link:'Link',note:'Notes',file:'File',photo:'Photo'})[att.type]);
  const href=att.file?resourceURL({...att.file,kind:'file'}):att.type==='link'&&/^https?:\/\//i.test(att.value)?att.value:'';
  return href?'<a class="r03-att" href="'+esc(href)+'" target="_blank" rel="noopener" title="'+esc(att.value||att.label)+'">'+productIcon(icon)+label+'</a>':'<span class="r03-att" title="'+esc(att.value)+'">'+productIcon(icon)+label+'</span>';
}
function r03ActivityCard(c,x){
  const t=r03Target(c,x.targetId),stat=r03TargetStat(c,x.targetId),[cls]=R03_RESULT[x.result];
  let evidence;
  if(!stat)evidence='<div class="r03-evidence pending">'+productIcon('results')+'How students did shows here after Respond</div>';
  else if(stat.none||!t)evidence='<div class="r03-evidence pending">'+productIcon('results')+'Our common check doesn’t score this target</div>';
  else if(!stat.shared)evidence='<div class="r03-evidence pending">'+productIcon('results')+'Hidden until 5 students from 3 teachers are scored</div>';
  else evidence='<div class="r03-evidence">'+productIcon('results')+'Students earned '+Math.round(stat.rate)+'% of the points on '+t.label+' ('+stat.n+' students)</div>';
  const used=x.usedBy.map(r03Member).filter(Boolean);
  const notes=x.attachments.filter(a=>a.type==='note'&&a.value).map(a=>'<div class="r03-look"><b>Notes:</b> '+esc(a.value)+'</div>').join('');
  return '<article class="r03-act"><div class="row" style="justify-content:space-between"><h4>'+esc(x.title)+'</h4><span><button type="button" class="r03-icon-btn" data-r03-act="edit-activity" data-id="'+esc(x.id)+'" aria-label="Edit '+esc(x.title)+'">'+productIcon('edit')+'</button><button type="button" class="r03-icon-btn" data-r03-act="delete-activity" data-id="'+esc(x.id)+'" aria-label="Delete '+esc(x.title)+'">'+productIcon('trash')+'</button></span></div>'+
    (t?'<div class="row"><span class="r03-pill r03-tgt">'+t.label+' · '+esc(t.text)+'</span></div>':x.targetId?'<div class="row"><span class="r03-pill r03-tgt">'+esc(x.targetId)+'</span></div>':'')+
    (x.attachments.filter(a=>a.type!=='note').length?'<div class="row">'+x.attachments.filter(a=>a.type!=='note').map(r03AttachmentChip).join('')+'</div>':'')+notes+
    (x.lookFor?'<div class="r03-look"><b>Look for:</b> '+esc(x.lookFor)+'</div>':'')+evidence+
    (r03WhoOpen===x.id?'<div class="r03-who" aria-label="Who used it">'+(state.members.length?state.members.map(m=>'<label><input type="checkbox" data-r03-used="'+esc(x.id)+'" value="'+esc(m.id)+'" '+(x.usedBy.includes(m.id)?'checked':'')+'>'+esc(m.name||m.email||'Teammate')+'</label>').join(''):'<span class="r03-hint">Add team members in <a href="'+urlFor('settings','roster')+'">Our Team</a> to track who used it.</span>')+'</div>':'')+
    '<div class="r03-act-foot"><div class="r03-avs">'+used.map(m=>'<span class="r03-av" title="'+esc(m.name)+'" style="background:'+R03_AVATAR[Math.max(0,state.members.indexOf(m))%R03_AVATAR.length]+'">'+esc(r03Initials(m.name))+'</span>').join('')+'</div>'+
    '<button type="button" class="r03-used" data-r03-act="toggle-who" data-id="'+esc(x.id)+'">'+(used.length?'Used by '+used.length+' of '+state.members.length:'Who used it?')+'</button>'+
    '<select class="r03-result r03-pill '+cls+'" data-r03-result="'+esc(x.id)+'" aria-label="How did it go?">'+Object.entries(R03_RESULT).map(([k,[,label]])=>'<option value="'+k+'" '+(x.result===k?'selected':'')+'>'+label+'</option>').join('')+'</select></div></article>';
}

/* ---------- Close: keep, refine, or replace, then start the next cycle ---------- */
function r03Strategies(c){
  const R=r03Results(c);if(!R)return [];
  return (R.r.voluntaryStrategies||[]).filter(p=>p.text.trim()).map(p=>({key:'str:'+r03Hash(p.teacher+'|'+p.skill+'|'+p.text),title:p.text,sub:[p.skill,p.teacher].filter(Boolean).join(' · ')}));
}
function r03CloseScreen(c){
  const R=r03Results(c),t=R&&r03TeamRate(R),goal=percent(c.target)?Number(c.target):null,dec=c.close.decisions;
  let summary='<p class="r03-later">Results aren’t in yet. You can still decide what to keep, but the numbers will be stronger after Respond.</p>';
  if(t&&t.shared)summary='<p><span class="r03-big" style="color:var(--r03-close-ink)">'+Math.round(t.rate)+'%</span> of '+t.n+' students proficient'+(goal!==null?' · goal '+goal+'%':'')+'</p><p>'+(goal===null?'':t.rate>=goal?'We met our goal. Celebrate it together.':'We’re '+Math.round(goal-t.rate)+' points from our goal.')+'</p>';
  else if(t)summary='<p class="r03-later">Team results stay hidden until at least 5 students from 3 teachers are scored.</p>';
  const seg=(k,v)=>'<span class="r03-seg" role="group">'+R03_DECIDE.map(([d,label])=>'<button type="button" class="'+d+'" aria-pressed="'+(v===d)+'" data-r03-decide="'+esc(k)+'" data-value="'+d+'">'+label+'</button>').join('')+'</span>';
  const acts=c.activities.map(x=>{const tg=r03Target(c,x.targetId),s=r03TargetStat(c,x.targetId),[cls,label]=R03_RESULT[x.result];return '<div class="r03-row"><span><b>'+esc(x.title)+'</b><span class="sub">'+(tg?tg.label+' · ':'')+'<span class="r03-pill '+cls+'">'+label+'</span>'+(s&&s.shared&&!s.none?' · students earned '+Math.round(s.rate)+'% on this target':'')+'</span></span>'+seg('act:'+x.id,dec['act:'+x.id])+'</div>'}).join('');
  const strats=r03Strategies(c).map(s=>'<div class="r03-row"><span><b>'+esc(s.title)+'</b><span class="sub">'+esc(s.sub)+'</span></span>'+seg(s.key,dec[s.key])+'</div>').join('');
  const closed=!!c.close.closedAt,next=state.cycles.find(x=>x.id===c.close.nextCycleId);
  return '<section class="r03 r03-quiet r03-stack"><div class="r03-head" style="margin-bottom:0"><span class="r03-chip lg c-close">'+productIcon('check')+'</span><div><div class="eyebrow">'+esc(r03Name(c))+' · Step 5 of 5</div><h1>Close our cycle</h1></div></div>'+
    '<section class="r03-card close"><div class="r03-card-h"><span class="r03-chip c-close">'+productIcon('target')+'</span><h3>How we did</h3></div><div class="r03-card-b"><p class="r03-goal">'+esc(c.goalOverride||generatedGoal(c))+'</p><div style="margin-top:12px">'+summary+'</div></div></section>'+
    '<section class="r03-card teach"><div class="r03-card-h"><span class="r03-chip c-teach">'+productIcon('activity')+'</span><h3>Our activities</h3><span class="right">Keep, refine, or replace</span></div><div class="r03-card-b">'+(acts||'<p class="r03-later">No activities were added in Teach.</p>')+'</div></section>'+
    (strats?'<section class="r03-card results"><div class="r03-card-h"><span class="r03-chip c-results">'+productIcon('team')+'</span><h3>Strategies teammates shared</h3></div><div class="r03-card-b">'+strats+'</div></section>':'')+
    '<section class="r03-card close"><div class="r03-card-h"><span class="r03-chip c-close">'+productIcon('note')+'</span><h3>What we learned</h3></div><div class="r03-card-b"><textarea class="r03-text" rows="4" maxlength="6000" data-r03-close-notes placeholder="What will we keep doing? What will we change next time?">'+esc(c.close.notes)+'</textarea>'+
    '<p style="margin-top:12px">'+(closed?'<span class="r03-pill p-keep">Closed '+esc(prettyDate(c.close.closedAt.slice(0,10)))+'</span> <button type="button" class="r03-btn small" data-r03-act="reopen">Reopen this cycle</button>':'<button type="button" class="r03-btn rose" data-r03-act="close-cycle">'+productIcon('check')+'Close this cycle</button>')+'</p></div></section>'+
    '<section class="r03-card plan"><div class="r03-card-h"><span class="r03-chip c-plan">'+productIcon('cycle')+'</span><h3>Start the next cycle</h3></div><div class="r03-card-b">'+
    (next?'<p>We started <a href="'+r03StepUrl(next,r03Steps(next).current)+'">'+esc(r03Name(next))+'</a>.</p>':
    '<label class="r03-check"><input type="checkbox" id="r03CarryStd" checked>Carry over the standard'+(c.standardIds.length?' ('+esc(c.standardIds.map(id=>byId.get(id)?.code).filter(Boolean).join(', '))+')':'')+'</label>'+
    '<label class="r03-check"><input type="checkbox" id="r03CarryTargets" checked>Carry over the learning targets</label>'+
    '<label class="r03-check"><input type="checkbox" id="r03CarryActs" '+(c.activities.length?'checked':'disabled')+'>Carry over activities we’re keeping or refining</label>'+
    '<p style="margin-top:10px"><button type="button" class="r03-btn blue" data-r03-act="next-cycle">'+productIcon('plus')+'Start Cycle '+(state.cycles.length+1)+'</button></p>')+'</div></section></section>';
}

/* ---------- events ---------- */
document.addEventListener('click',async event=>{
  const el=event.target.closest('[data-r03-act],[data-r03-filter],[data-r03-decide]');if(!el)return;
  const c=state.cycles.find(x=>x.id===locationParts[2]);
  if(el.dataset.r03Filter!==undefined){r03Filter=el.dataset.r03Filter;renderRoute();return}
  if(el.dataset.r03Decide!==undefined){if(!c)return;const k=el.dataset.r03Decide;if(c.close.decisions[k]===el.dataset.value)delete c.close.decisions[k];else c.close.decisions[k]=el.dataset.value;save();renderRoute();return}
  const act=el.dataset.r03Act;
  if(act==='make-meeting'){
    state.meetings||=[];if(state.meetings.length>=300){toast('This workspace supports 300 meetings.');return}
    const previous=state.meetings[state.meetings.length-1];
    const m={id:crypto.randomUUID(),title:r03MeetingTitle(),date:'',time:previous?.time||'',location:previous?.location||'',notes:'',attendance:state.members.map(x=>({id:x.id,name:x.name,email:x.email})),agenda:r03GeneratedAgenda()};
    state.meetings.push(m);carryAgendaItems(state.meetings);save();go('meetings',m.id);toast('Meeting created with an agenda built from our cycle.');return;
  }
  if(!c)return;
  if(act==='open-form'){r03Form={};renderRoute();$('r03Title')?.focus();return}
  if(act==='cancel-form'){r03Form=null;renderRoute();return}
  if(act==='edit-activity'){r03Form={id:el.dataset.id};renderRoute();$('r03Form')?.scrollIntoView({block:'center'});$('r03Title')?.focus();return}
  if(act==='toggle-who'){r03WhoOpen=r03WhoOpen===el.dataset.id?'':el.dataset.id;renderRoute();return}
  if(act==='delete-activity'){
    const x=c.activities.find(a=>a.id===el.dataset.id);if(!x)return;
    if(!await confirmAction('Delete activity?','Delete','danger','Delete “'+x.title+'” for the whole team?',el))return;
    c.activities=c.activities.filter(a=>a!==x);save();renderRoute();toast('Activity deleted.');return;
  }
  if(act==='save-activity'){
    const title=$('r03Title').value.trim(),msg=$('r03FormMsg');
    if(!title){msg.textContent='Give the activity a name.';$('r03Title').focus();return}
    if(c.activities.length>=200&&!r03Form.id){msg.textContent='A cycle can hold up to 200 activities.';return}
    const type=$('r03AttType').value,value=$('r03AttValue').value.trim(),fileInput=$('r03AttFile');
    let attachments=[];
    if((type==='file'||type==='photo')&&fileInput.files.length){
      el.disabled=true;msg.textContent='Uploading…';
      try{const [f]=await uploadResourceFiles([...fileInput.files].slice(0,1),sharedId,new Map(),()=>{});attachments=[{type,label:f.name||fileInput.files[0].name,value:'',file:{workspaceId:f.workspaceId||sharedId,fileId:f.fileId||f.id,driveId:f.driveId||'',name:f.name||fileInput.files[0].name}}]}
      catch(err){el.disabled=false;msg.textContent=err.message||'Upload failed. Try again.';return}
    }else if(value)attachments=[{type:type==='note'||!/^https?:\/\//i.test(completeWebAddress(value))?'note':'link',label:type==='note'||!/^https?:\/\//i.test(completeWebAddress(value))?'Notes':'Link',value:type==='note'?value:completeWebAddress(value)}];
    const now=new Date().toISOString(),targetId=$('r03Target').value||'';
    const existing=r03Form.id&&c.activities.find(a=>a.id===r03Form.id);
    if(existing){Object.assign(existing,{title,targetId,lookFor:$('r03Look').value.trim(),updatedAt:now});if(attachments.length||!value)existing.attachments=attachments.length?attachments:existing.attachments.filter(a=>a.file)}
    else c.activities.unshift({id:crypto.randomUUID(),title,targetId,attachments,lookFor:$('r03Look').value.trim(),usedBy:[],result:'new',createdBy:directory?.email||'',createdAt:now,updatedAt:now});
    r03Form=null;r03Filter='all';save();renderRoute();toast(existing?'Activity saved.':'Added to our activities.');return;
  }
  if(act==='close-cycle'){c.close.closedAt=new Date().toISOString();save();renderRoute();toast(r03Name(c)+' is closed.');return}
  if(act==='reopen'){c.close.closedAt='';save();renderRoute();return}
  if(act==='next-cycle'){
    if(state.cycles.length>=100){toast('This workspace supports up to 100 cycles.');return}
    const carryStd=$('r03CarryStd')?.checked,carryTargets=$('r03CarryTargets')?.checked,carryActs=$('r03CarryActs')?.checked,now=new Date().toISOString();
    const n={id:crypto.randomUUID(),course:c.course||state.course,goalOverride:'',standardIds:carryStd?[...c.standardIds]:[],assessments:[]};
    cycleFields.forEach(k=>n[k]='');
    Object.assign(n,{baselineStatus:'unknown',scope:c.scope,scopeConfirmed:false,group:c.group,title:carryStd?c.title:'',learning:carryTargets?c.learning:''});
    if(c.folderId)n.folderId=c.folderId;
    n.activities=carryActs?c.activities.filter(a=>(c.close.decisions['act:'+a.id]||'keep')!=='replace').map(a=>({...JSON.parse(JSON.stringify(a)),id:crypto.randomUUID(),usedBy:[],result:'new',createdAt:now,updatedAt:now})):[];
    n.close={decisions:{},notes:'',closedAt:'',nextCycleId:''};
    if(!c.close.closedAt)c.close.closedAt=now;
    c.close.nextCycleId=n.id;state.cycles.push(n);r03SetActive(n);save();
    toast(r03Name(n)+' started.');go('cycle',r03Sid(n),n.id,'plan');return;
  }
});
document.addEventListener('change',event=>{
  const el=event.target;
  if(el.matches('[data-r03-switch]')){const c=state.cycles.find(x=>x.id===el.value);if(c){r03SetActive(c);renderRoute();updateProductNavigation('home')}return}
  const c=state.cycles.find(x=>x.id===locationParts[2]);if(!c)return;
  if(el.matches('[data-r03-result]')){const x=c.activities.find(a=>a.id===el.dataset.r03Result);if(x){x.result=el.value;x.updatedAt=new Date().toISOString();save();renderRoute()}return}
  if(el.matches('[data-r03-used]')){const x=c.activities.find(a=>a.id===el.dataset.r03Used);if(x){x.usedBy=el.checked?[...new Set([...x.usedBy,el.value])]:x.usedBy.filter(id=>id!==el.value);x.updatedAt=new Date().toISOString();if(el.checked&&x.result==='new')x.result='worked';save();renderRoute()}return}
  if(el.id==='r03AttType'){const file=['file','photo'].includes(el.value);$('r03AttValue').hidden=file;$('r03AttFile').hidden=!file;$('r03AttFile').accept=el.value==='photo'?'image/*':'';return}
});
document.addEventListener('input',event=>{
  if(!event.target.matches('[data-r03-close-notes]'))return;
  const c=state.cycles.find(x=>x.id===locationParts[2]);if(c){c.close.notes=event.target.value;save()}
});
/* Typing in a baseline field means the team set it by hand; stop filling it in automatically. */
document.addEventListener('input',event=>{if(event.target.matches('[data-cycle^="baseline"]')){const c=activeCycle();if(c){c.baselineManual=true;delete c.baselineAuto}}},true);

/* ---------- sidebar: Our Home, Our Cycles, Our Activities, Our Standards, Our Meetings, Our Team ---------- */
function updateProductNavigation(page){
  const c=r03ActiveCycle();
  const active=page==='home'?'home':page==='cycles'?'cycles':page==='activities'||page==='cycle'&&locationParts[3]==='teach'?'activities':['setup','connections','standard'].includes(page)?'standards':page==='meetings'?'meetings':['team','settings'].includes(page)?'team':page==='glossary'?'glossary':'cycles';
  const entries=[['home','Our Home','home',[]],['cycles','Our Cycles','layers',['cycles']],['activities','Our Activities','activity',c?['cycle',r03Sid(c),c.id,'teach']:['activities']],['standards','Our Standards','book',['setup']],['meetings','Our Meetings','calendar',['meetings']],['team','Our Team','team',['settings','roster']]];
  $('productNavigation').innerHTML=entries.map(([id,label,icon,route])=>'<a href="'+urlFor(...route)+'" class="product-nav-link '+(active===id?'active':'')+'" '+(active===id?'aria-current="page"':'')+' title="'+label+'">'+productIcon(icon)+'<span>'+label+'</span>'+(id==='activities'?'<span class="r03-new">NEW</span>':'')+'</a>').join('')+
    '<a href="'+urlFor('glossary')+'" class="r03-glossary-link'+(active==='glossary'?' active':'')+'">'+productIcon('book')+'<span>PLC Glossary</span></a>';
}

/* ---------- one-time page set-up ---------- */
(function r03Setup(){
  /* The Forms panel moves around the page (right column, guided step), so the disclosure goes inside it. */
  const dq=document.querySelector('section.digital-quiz');
  if(dq&&!dq.querySelector(':scope>details.r03-advanced')){const d=document.createElement('details');d.className='r03-advanced';d.innerHTML='<summary>'+productIcon('quiz')+'Advanced: connect Google Forms</summary>';d.append(...dq.childNodes);dq.append(d)}
  const use=$('useAssessment');if(use)use.hidden=true;
  for(const [field,text] of [['assessment','Fills in from our common check in Build check.'],['proficiency','Fills in from our common check’s scoring rule.'],['baselineStatus','No need to enter this now: the baseline fills in from our first results.']]){
    const label=document.querySelector('[data-cycle="'+field+'"]')?.closest('label');
    if(label&&!label.querySelector('.r03-hint'))label.insertAdjacentHTML('beforeend','<small class="r03-hint">'+text+'</small>');
  }
})();
