// Run from the repository root: node checks/r03walk.cjs
// Uses the pre-installed Playwright Chromium. Screenshots and notes go to checks/out/.
const path=require('path');const ROOT='file://'+path.resolve(__dirname,'..')+'/';const OUT=path.join(__dirname,'out');require('fs').mkdirSync(OUT,{recursive:true});
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1360,height:950}});let p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push('pageerror: '+e.message+' @ '+(e.stack||'').split('\n').slice(1,3).join(' ')));p.on('requestfailed',r=>errs.push('failed: '+r.url().slice(0,90)));p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text())});
p.on('dialog',d=>d.accept());
await p.goto(ROOT+'PLC-Launchpad-R03.html');await p.waitForTimeout(1200);
await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
const state=async(tag)=>{await p.waitForTimeout(500);const info=await p.evaluate(()=>{const vis=e=>e.offsetParent!==null;return {hash:location.hash,h:[...document.querySelectorAll('#workspaceBody h1,#workspaceBody h2')].filter(vis).slice(0,3).map(e=>e.textContent.trim().slice(0,70)),btns:[...document.querySelectorAll('#workspaceBody button,#workspaceBody a.route-link,#workspaceBody a.r03-btn')].filter(vis).map(e=>e.textContent.trim().slice(0,40)).filter(Boolean).slice(0,14),inputs:[...document.querySelectorAll('#workspaceBody input:not([type=hidden]),#workspaceBody textarea,#workspaceBody select')].filter(vis).length}});console.log('\n##',tag,JSON.stringify(info));};
await p.click('a.r03-btn.blue');await state('after start');

await p.evaluate(()=>{const i=[...document.querySelectorAll('#workspaceBody input')].find(i=>i.value==='ca-cte-ea-B7.4');if(i){i.closest('details')&&(i.closest('details').open=true);i.click();}});
await state('picked');
await p.click('text=Use this standard & continue').catch(e=>console.log('no use btn'));await state('after use');
for(let k=0;k<30;k++){
  const r=await p.evaluate(()=>{const vis=e=>e.offsetParent!==null;
    for(const el of [...document.querySelectorAll('#workspaceBody input[type=text],#workspaceBody input:not([type]),#workspaceBody textarea')].filter(vis)){if(!el.value.trim()){el.value=el.tagName==='TEXTAREA'?'I can read an inch ruler to the nearest 1/16 inch.':'Accurate Ruler Measurement';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}}
    for(const el of [...document.querySelectorAll('#workspaceBody input[type=number]')].filter(vis)){if(!el.value){el.value='80';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}}
    for(const el of [...document.querySelectorAll('#workspaceBody input[type=date]')].filter(vis)){if(!el.value){el.value='2026-12-18';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}}
    for(const cb of [...document.querySelectorAll('#workspaceBody input[type=checkbox]')].filter(vis))if(!cb.checked)cb.click();
    for(const sel of [...document.querySelectorAll('#workspaceBody select')].filter(vis))if(!sel.value){const o=[...sel.options].find(o=>o.value);if(o){sel.value=o.value;sel.dispatchEvent(new Event('change',{bubbles:true}));sel.dispatchEvent(new Event('input',{bubbles:true}))}}
    const radios=[...document.querySelectorAll('#workspaceBody input[type=radio]')].filter(vis);if(radios.length&&!radios.some(r=>r.checked)){radios[0].click()}
    const btn=[...document.querySelectorAll('#workspaceBody button')].filter(vis).find(b=>/^Continue|^Use this|^Save & continue|^Next|^Finish|^Done/i.test(b.textContent.trim())&&!b.disabled);
    if(btn){const t=btn.textContent.trim();btn.click();return t}return null});
  await state('step '+k+' clicked '+r);
  if(!r)break;
}

const ids=await p.evaluate(()=>{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!k.includes('plc-launchpad')||k.includes(':'+'r03'))continue;try{const s=JSON.parse(localStorage.getItem(k));if(s&&s.cycles&&s.cycles.length){const c=s.cycles[0];return {key:k,schema:s.schemaVersion,cid:c.id,sid:c.standardIds[0],aid:(c.assessments[0]||{}).id,acts:Array.isArray(c.activities),title:c.title}}}catch{}}return null});
console.log('\nSTATE',JSON.stringify(ids));

const U=ROOT+'PLC-Launchpad-R03.html';
const T1='I can read an inch ruler to the nearest 1/8 inch.',T2='I can read an inch ruler to the nearest 1/16 inch.';
const raw=await p.evaluate(k=>localStorage.getItem(k),ids.key);
const st=JSON.parse(raw);{const c=st.cycles[0],a=c.assessments[0];c.learning=T1+'\n'+T2;
  Object.assign(a,{title:'Ruler Measurement Check',sourceType:'build',format:'quiz',instructions:'Measure each strip.',threshold:'8',criteria:'',
    items:Array.from({length:10},(_,n)=>({id:'q'+n,prompt:'Measure strip '+(n+1),answer:'Exact length',maxPoints:'1',standardId:ids.sid,learningTarget:n<5?T1:T2,targetSource:'custom'}))});
  st.members=[['m1','Ms. Alvarez'],['m2','Mr. Chen'],['m3','Ms. Okafor'],['m4','Mr. Delgado']].map(([id,name])=>({id,name,email:id+'@example.org',periods:'1',role:'member'}));}
await p.close();p=await ctx.newPage();
p.on('pageerror',e=>errs.push('pageerror: '+e.message));p.on('dialog',d=>d.accept());
await p.addInitScript(([k,v])=>{if(!sessionStorage.getItem('inj')){localStorage.setItem(k,v);sessionStorage.setItem('inj','1')}},[ids.key,JSON.stringify(st)]);
const confirmDlg=async()=>{await p.waitForTimeout(400);await p.evaluate(()=>{const d=[...document.querySelectorAll('dialog[open]')].pop();if(!d)return;const b=[...d.querySelectorAll('button')].find(b=>!/cancel|keep|close/i.test(b.textContent)&&b.offsetParent);b&&b.click()});await p.waitForTimeout(700);};
await p.goto(U+'#/engineering/assessment/'+ids.sid+'/'+ids.cid+'/'+ids.aid+'/tools');await p.waitForTimeout(1200);
await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
console.log('makeRulerMc visible',await p.locator('#makeRulerMc').isVisible(),'| save:',await p.textContent('#saveState'),'| title field:',await p.evaluate(()=>document.querySelector('#assessmentTitle,[data-assessment="title"]')?.value),'| items:',await p.evaluate(()=>document.querySelectorAll('#assessmentItems details').length));
await p.click('#makeRulerMc');await confirmDlg();
console.log('sampleMcResults visible',await p.locator('#sampleMcResults').isVisible());
await p.evaluate(()=>document.getElementById('sampleMcResults').click());await confirmDlg();await state('after fictional results');
// Teach: add two activities
await p.goto(U+'#/engineering/cycle/'+ids.sid+'/'+ids.cid+'/teach');await p.waitForTimeout(800);await state('teach');
for(const [t,tg,link,look] of [['Ruler Race warm-up',0,'https://example.org/slides','Students line up the object with the zero mark.'],['Sixteenths Number Line',1,'Count tick marks out loud.','Students count tick marks instead of guessing.']]){
  await p.click('[data-r03-act="open-form"]');await p.fill('#r03Title',t);await p.selectOption('#r03Target',{index:tg});
  if(!link.startsWith('http'))await p.selectOption('#r03AttType','note');await p.fill('#r03AttValue',link);await p.fill('#r03Look',look);await p.click('[data-r03-act="save-activity"]');await p.waitForTimeout(400);}
await p.click('[data-r03-act="toggle-who"]');await p.waitForTimeout(200);
for(const id of ['m1','m2'])await p.check('[data-r03-used][value="'+id+'"]');await p.waitForTimeout(300);
await p.selectOption('[data-r03-result]',{value:'tweak'});await p.waitForTimeout(300);
await p.screenshot({path:OUT+'/teach.png',fullPage:true});
console.log('activity cards',await p.locator('.r03-act').count(),'| evidence:',await p.evaluate(()=>[...document.querySelectorAll('.r03-evidence')].map(e=>e.textContent).join(' / ')));
// Respond
await p.goto(U+'#/engineering/cycle/'+ids.sid+'/'+ids.cid+'/respond');await p.waitForTimeout(1200);await state('respond');
await p.screenshot({path:OUT+'/respond.png'});
const filled=await p.evaluate(()=>{const t=[...document.querySelectorAll('#workspaceBody textarea')].filter(e=>e.offsetParent);const tgt=t.find(e=>/support|next/i.test((e.closest('label')?.textContent||'')+e.id+(e.dataset?Object.values(e.dataset).join(' '):'')))||t[0];if(!tgt)return 'none';tgt.value='Small-group reteach with ruler stations on Tuesday; extension: measure with metric too.';tgt.dispatchEvent(new Event('input',{bubbles:true}));tgt.dispatchEvent(new Event('change',{bubbles:true}));return (tgt.closest('label')?.textContent||tgt.id).slice(0,80)});
console.log('respond field filled:',filled);await p.waitForTimeout(500);
// Home with data
await p.goto(U+'#/engineering');await p.waitForTimeout(900);await p.screenshot({path:OUT+'/home-data.png',fullPage:true});
console.log('home now:',await p.evaluate(()=>document.querySelector('.r03-now-top')?.innerText.replace(/\s+/g,' ')));
console.log('home steps:',await p.evaluate(()=>[...document.querySelectorAll('.r03-now .r03-step')].map(s=>s.className.replace('r03-step','').trim()+':'+s.querySelector('b').textContent).join(' | ')));
// Close and next cycle
await p.goto(U+'#/engineering/cycle/'+ids.sid+'/'+ids.cid+'/close');await p.waitForTimeout(900);
await p.click('[data-r03-decide^="act:"][data-value="keep"]');await p.waitForTimeout(300);
await p.screenshot({path:OUT+'/close.png',fullPage:true});
await p.click('[data-r03-act="close-cycle"]');await p.waitForTimeout(400);
await p.click('[data-r03-act="next-cycle"]');await p.waitForTimeout(1200);await state('after next cycle');
const fin=await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));return s.cycles.map(c=>({title:c.title,acts:c.activities.length,closed:!!c.close.closedAt,next:!!c.close.nextCycleId,learning:c.learning.split('\n').length}))},ids.key);
console.log('CYCLES',JSON.stringify(fin));
const c1=await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));const c=s.cycles[0];return {baseline:c.baseline,status:c.baselineStatus,evidence:c.baselineEvidence,assessment:c.assessment,proficiency:c.proficiency}},ids.key);
console.log('AUTO-FILLED GOAL FIELDS',JSON.stringify(c1));
await p.goto(U+'#/engineering/assessment/'+ids.sid+'/'+ids.cid+'/'+ids.aid+'/tools');await p.waitForTimeout(900);
await p.evaluate(()=>{const b=[...document.querySelectorAll('#workspaceBody button')].find(b=>/^Google Forms Quiz/.test(b.textContent.trim()));b&&b.click()});await p.waitForTimeout(500);
console.log('FORMS VISIBLE',await p.evaluate(()=>{const d=document.querySelector('section.digital-quiz');return d&&!d.hidden&&d.offsetParent!==null}));
console.log('FORMS ADVANCED',JSON.stringify(await p.evaluate(()=>{const d=document.querySelector('section.digital-quiz>details.r03-advanced');return {exists:!!d,summary:d?.querySelector('summary')?.textContent,quizControlsInside:['teacherFormUrl','schoolReport','connectQuiz','prepareConnector'].filter(id=>d?.querySelector('#'+id)).join(','),useAssessmentHidden:document.getElementById('useAssessment')?.hidden}})));
for(const [w,h] of [['home',''],['teach','cycle/'+ids.sid+'/'+ids.cid+'/teach'],['close','cycle/'+ids.sid+'/'+ids.cid+'/close'],['meetings','meetings']]){await p.setViewportSize({width:400,height:850});await p.goto(U+'#/engineering/'+h);await p.waitForTimeout(600);console.log('PHONE',w,await p.evaluate(()=>document.documentElement.scrollWidth),'sidebar visible:',await p.evaluate(()=>{const s=document.getElementById('productSidebar');return s?getComputedStyle(s).display!=='none'&&s.getBoundingClientRect().left>=0&&s.getBoundingClientRect().right>0:false}));if(w==='home')await p.screenshot({path:OUT+'/phone-home.png',fullPage:true});}

// new meeting agenda
await p.goto(U+'#/engineering/meetings');await p.waitForTimeout(600);await p.click('[data-meeting-action="new"]');await p.waitForTimeout(800);
console.log('new meeting agenda:',await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));const m=s.meetings[s.meetings.length-1];return m.title+' :: '+m.agenda.map(a=>a.title+(a.planId?' [cycle]':'')).join(' | ')},ids.key));
await p.screenshot({path:OUT+'/w-end.png'});console.log(await p.evaluate(()=>document.querySelector('.guide-card,.guided-question,#workspaceBody main,#workspaceBody')?.innerText.slice(0,1500)));

console.log('ERRORS',JSON.stringify(errs));await b.close();})();
