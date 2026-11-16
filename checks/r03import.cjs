// Run from the repository root: node checks/r03import.cjs
// Uses the pre-installed Playwright Chromium. Screenshots and notes go to checks/out/.
const path=require('path');const ROOT='file://'+path.resolve(__dirname,'..')+'/';const OUT=path.join(__dirname,'out');require('fs').mkdirSync(OUT,{recursive:true});
const {chromium}=require('playwright');const fs=require('fs');
const summary=s=>({schema:s.schemaVersion,selected:s.selected.length,cycles:s.cycles.length,assessments:s.cycles.reduce((n,c)=>n+c.assessments.length,0),results:s.cycles.reduce((n,c)=>n+c.assessments.reduce((m,a)=>m+a.results.length,0),0),rows:s.cycles.reduce((n,c)=>n+c.assessments.reduce((m,a)=>m+a.results.reduce((k,r)=>k+r.rows.length,0),0),0),meetings:(s.meetings||[]).length,agenda:(s.meetings||[]).reduce((n,m)=>n+m.agenda.length,0),norms:(s.norms||'').length,members:(s.members||[]).length,folders:(s.planFolders||[]).length,foldered:s.cycles.filter(c=>c.folderId).length,notes:Object.keys(s.notes||{}).length});
(async()=>{const b=await chromium.launch();const errs=[];
// 1. make a v0.509 workspace with v0.509 itself
let ctx=await b.newContext();let p=await ctx.newPage();p.on('pageerror',e=>errs.push('v0509: '+e.message));
await p.goto(ROOT+'legacy/v0.509.html');await p.waitForTimeout(1500);
await p.evaluate(()=>document.getElementById('briefSample')?.click());await p.waitForTimeout(1500);
let v5=JSON.parse(await p.evaluate(()=>localStorage.getItem('plc-launchpad:v1')));
v5.selected=['ca-cte-ea-B7.4','ca-cte-ea-B2.1'];v5.notes={'ca-cte-ea-B7.4':'Measure to 1/16 inch'};
v5.norms='We start on time.\nWe assume good intent.';
v5.members=[{id:'m1',name:'Ms. Alvarez',email:'a@example.org',periods:'1',role:'member'},{id:'m2',name:'Mr. Chen',email:'c@example.org',periods:'2',role:'coordinator'}];
v5.planFolders=[{id:'f1',name:'Fall units',color:'#2d5ea8'}];v5.cycles[0].folderId='f1';
v5.meetings=[{id:'mt1',title:'Weekly PLC',date:'2026-11-20',time:'15:00',location:'Room 12',notes:'Bring scores',agenda:[{id:'ag1',title:'Review results',planId:v5.cycles[0].id,notes:'Most got it',decision:'Reteach 1/16',owner:'Ms. Alvarez',due:'2026-11-25'}]}];
console.log('v0.509 workspace:',JSON.stringify(summary(v5)));
const backup={...v5,catalogId:'ca-cte-engineering-architecture'};fs.writeFileSync(OUT+'/v0509-backup.json',JSON.stringify(backup));
await ctx.close();
// 2a. R03 opens the same browser data
ctx=await b.newContext();p=await ctx.newPage();p.on('pageerror',e=>errs.push('r03: '+e.message));
await p.addInitScript(v=>{if(!sessionStorage.getItem('i')){localStorage.setItem('plc-launchpad:v1',v);sessionStorage.setItem('i','1')}},JSON.stringify(v5));
await p.goto(ROOT+'PLC-Launchpad-R03.html#/engineering/cycles');await p.waitForTimeout(1500);
await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
await p.goto(ROOT+'PLC-Launchpad-R03.html#/engineering/settings');await p.waitForTimeout(800);
let s6=JSON.parse(await p.evaluate(()=>localStorage.getItem('plc-launchpad:v1')));
console.log('R03 after opening :',JSON.stringify(summary(s6)),'| meeting kept:',JSON.stringify(s6.meetings[0].agenda[0].decision),'| activities arrays:',s6.cycles.every(c=>Array.isArray(c.activities)));
await p.goto(ROOT+'PLC-Launchpad-R03.html#/engineering/cycles');await p.waitForTimeout(800);
await p.screenshot({path:OUT+'/cycles.png',fullPage:true});
console.log('Our Cycles shows folder:',await p.evaluate(()=>document.body.innerText.includes('Fall units')));
await ctx.close();
// 2b. R03 imports the backup file through Import Backup File
ctx=await b.newContext();p=await ctx.newPage();p.on('pageerror',e=>errs.push('r03 import: '+e.message));
await p.goto(ROOT+'PLC-Launchpad-R03.html#/engineering/settings');await p.waitForTimeout(1500);
await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
await p.setInputFiles('#file',OUT+'/v0509-backup.json');await p.waitForTimeout(600);
await p.evaluate(()=>{const d=[...document.querySelectorAll('dialog[open]')].pop();const b=d&&[...d.querySelectorAll('button')].find(b=>/restore/i.test(b.textContent));b&&b.click()});await p.waitForTimeout(1000);
s6=JSON.parse(await p.evaluate(()=>localStorage.getItem('plc-launchpad:v1')));
console.log('R03 after import  :',JSON.stringify(summary(s6)));
console.log('toast:',await p.evaluate(()=>[...document.querySelectorAll('.toast,[role=status]')].map(e=>e.textContent.trim()).filter(Boolean).slice(-1)[0]));
// 3. old words gone from what users see on main pages
const pages=['','cycles','settings','meetings','glossary','setup'];let bad=[];
for(const h of pages){await p.goto(ROOT+'PLC-Launchpad-R03.html#/engineering/'+h);await p.waitForTimeout(500);const t=await p.evaluate(()=>document.body.innerText);const m=t.match(/PLC plans?|learning cycles?/gi);if(m)bad.push(h+':'+m.join(','))}
console.log('old words on pages:',bad.length?bad:'none');
console.log('ERRORS',JSON.stringify(errs));await b.close();})();
