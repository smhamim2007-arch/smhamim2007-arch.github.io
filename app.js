// ===================== APP STATE =====================
let ST={div:'',ss:[],sc:{},tracks:[],ci:-1,pomo:{div:'',tgt:'',dur:50,brk:12,dmin:240,tsec:0,ld:'',ptoday:0},theme:'dark'};

(function(){try{let d=localStorage.getItem('tcv5');if(d){let p=JSON.parse(d);ST=Object.assign(ST,p);const t=new Date().toISOString().slice(0,10);if(ST.pomo.ld!==t){ST.pomo.tsec=0;ST.pomo.ptoday=0;}}}catch(e){}document.body.dataset.theme=ST.theme;})();

const sv=()=>{try{localStorage.setItem('tcv5',JSON.stringify(ST))}catch(e){}};

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      console.log('SW registered: ', reg.scope);
    }).catch(err => {
      console.log('SW registration failed: ', err);
    });
  });
}

// THEME
function openTheme(){document.getElementById('th-modal').classList.add('show');['dark','light','ocean','purple'].forEach(t=>{const el=document.getElementById('t-'+t);if(el)el.classList.toggle('at',ST.theme===t);});}
function closeTh(e){if(e.target===document.getElementById('th-modal'))document.getElementById('th-modal').classList.remove('show');}
function setTh(t){ST.theme=t;document.body.dataset.theme=t;sv();openTheme();}

// NAV
const PAGES=['home','track','today','timer','store','info','about'];
const NAV=['home','track','today','timer','store','info'];
function gp(p){
  PAGES.forEach(pg=>{const el=document.getElementById('p-'+pg);if(el)el.classList.toggle('on',pg===p);});
  document.querySelectorAll('.bni').forEach((ni,i)=>ni.classList.toggle('on',NAV[i]===p));
  if(p==='home')rHome();else if(p==='track')rTrack();else if(p==='today')rToday();
  else if(p==='timer')rTimer();else if(p==='store')rStore();else if(p==='info')rInfo();else if(p==='about')rAbout();
}

// SCHEDULE
function buildSched(ss,sc,div,days){
  let all=[];
  ss.forEach((subj,si)=>{const chs=HSC[div].subjects[subj].ch;(sc[subj]||[]).forEach(ci=>{const ch=chs[ci];for(let pt=0;pt<ch.sz;pt++)all.push({subject:subj,si,chapter:ch.n,part:ch.sz>1?pt+1:0,tp:ch.sz,priority:ch.p,size:ch.sz,done:false});});});
  if(!all.length)return[];
  let byS={};all.forEach(s=>{if(!byS[s.subject])byS[s.subject]=[];byS[s.subject].push(s);});
  const so=Object.keys(byS).sort((a,b)=>Math.min(...byS[a].map(x=>x.priority))-Math.min(...byS[b].map(x=>x.priority)));
  so.forEach(s=>byS[s].sort((a,b)=>a.priority-b.priority||a.part-b.part));
  let il=[];const ml=Math.max(...so.map(s=>byS[s].length));
  for(let i=0;i<ml;i++)so.forEach(s=>{if(i<byS[s].length)il.push(byS[s][i]);});
  const ppd=Math.ceil(il.length/days);let sched=[];const td=new Date();
  for(let d=0;d<days;d++){const sl=il.slice(d*ppd,(d+1)*ppd);if(!sl.length)break;const dt=new Date(td);dt.setDate(td.getDate()+d);sched.push({day:d+1,ds:dt.toLocaleDateString('bn-BD'),di:dt.toISOString().slice(0,10),tasks:sl.map(s=>({...s}))});}
  return sched;
}
const gT=()=>ST.ci>=0?ST.tracks[ST.ci]:ST.tracks[0];
const gSC=(t,subj)=>SC[t.subjects.indexOf(subj)%SC.length];
const tdN=(t)=>Math.floor((new Date(new Date().toISOString().slice(0,10))-new Date(t.si))/86400000)+1;
const s2t=(s)=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');

// HOME
function rHome(){
  const c=document.getElementById('p-home');
  if(!ST.tracks.length){c.innerHTML=`<div class="empty"><div style="font-size:44px;margin-bottom:12px">📚</div><div style="font-size:16px;font-weight:700;color:var(--tx);margin-bottom:6px">কোনো ট্র্যাক নেই</div><p style="color:var(--tx2)">নিচের ট্র্যাক ট্যাবে গিয়ে শুরু করো</p></div>`;return;}
  const t=gT(),tn=tdN(t),tot=t.schedule.reduce((a,d)=>a+d.tasks.length,0),dn=t.schedule.reduce((a,d)=>a+d.tasks.filter(x=>x.done).length,0),pct=tot?Math.round(dn/tot*100):0,td=t.schedule.find(d=>d.day===tn),tdd=td?td.tasks.filter(x=>x.done).length:0,tdt=td?td.tasks.length:0;
  let h=ST.tracks.length>1?`<div class="card"><div class="sl" style="margin-top:0">সক্রিয় ট্র্যাক</div><select onchange="ST.ci=parseInt(this.value);sv();rHome()">${ST.tracks.map((tr,i)=>`<option value="${i}" ${i===ST.ci?'selected':''}>${tr.name}</option>`).join('')}</select></div>`:'';
  h+=`<div class="stg"><div class="sb"><div class="sn">${pct}%</div><div class="slb">অগ্রগতি</div></div><div class="sb"><div class="sn">${Math.max(0,t.schedule.length-(tn-1))}</div><div class="slb">বাকি দিন</div></div><div class="sb"><div class="sn">${Math.floor((ST.pomo.tsec||0)/60)}</div><div class="slb">আজ পড়েছো (মিনিট)</div></div></div>`;
  h+=`<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div style="font-size:15px;font-weight:600">${t.name}</div><span class="badge bg">${HSC[t.division].label}</span></div><div class="pb"><div class="pf pfg" style="width:${pct}%"></div></div><div style="display:flex;justify-content:space-between;margin-top:5px;font-size:11px;color:var(--tx2)"><span>${dn}/${tot} সেশন</span><span>${pct}% সম্পন্ন</span></div><div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:10px">${t.subjects.map((s,i)=>`<span style="display:flex;align-items:center;gap:3px;font-size:11px;color:var(--tx2);background:var(--bg3);padding:2px 8px;border-radius:12px"><span style="width:7px;height:7px;border-radius:2px;background:${SC[i%SC.length]};display:inline-block"></span>${s}</span>`).join('')}</div></div>`;
  if(td){const di=t.schedule.findIndex(d=>d.day===tn);h+=`<div class="card card-accent"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><div><div style="font-size:15px;font-weight:600">আজকের পড়া</div><div style="font-size:11px;color:var(--tx2);margin-top:2px">দিন ${tn} — ${td.ds}</div></div><span class="badge ${tdd===tdt&&tdt>0?'bg':'ba'}">${tdd}/${tdt} ✓</span></div>`;
  td.tasks.forEach((task,i)=>{const col=gSC(t,task.subject);h+=`<div class="ti"><div class="tc ${task.done?'dn':''}" onclick="htT(${di},${i})">${task.done?'✓':''}</div><div class="sd" style="background:${col}"></div><div><div class="tt ${task.done?'st':''}">${task.subject} — ${task.chapter}${task.tp>1?' (পর্ব '+task.part+'/'+task.tp+')':''}</div><div style="font-size:10px;color:var(--tx3);margin-top:1px">${task.priority===1?'⚡ উচ্চ প্রায়োরিটি':task.priority===2?'📌 মাঝারি':'📖 সাধারণ'}</div></div></div>`;});
  h+=`</div>`;}
  c.innerHTML=h;
}
function htT(di,ti){const t=gT();t.schedule[di].tasks[ti].done=!t.schedule[di].tasks[ti].done;sv();rHome();}

// TRACK
function rTrack(){
  const c=document.getElementById('p-track');
  let h=`<div class="card"><div class="ct">✨ নতুন স্টাডি ট্র্যাক</div><div class="sl" style="margin-top:0">বিভাগ</div>
  <select id="dv" onchange="onDv()"><option value="">-- বিভাগ বেছে নাও --</option><option value="science" ${ST.div==='science'?'selected':''}>বিজ্ঞান বিভাগ</option><option value="humanities" ${ST.div==='humanities'?'selected':''}>মানবিক বিভাগ</option><option value="commerce" ${ST.div==='commerce'?'selected':''}>ব্যবসায় শিক্ষা</option></select>`;
  if(ST.div){
    h+=`<div class="sl">বিষয়</div><div class="sg">${Object.keys(HSC[ST.div].subjects).map(s=>`<div class="sc ${ST.ss.includes(s)?'on':''}" onclick="tgSj('${s}')">${s}</div>`).join('')}</div>`;
    if(ST.ss.length){
      h+=`<div class="sl">অধ্যায় <span style="font-weight:400">(⚡উচ্চ 📌মাঝারি 📖সাধারণ)</span></div><div class="chs">`;
      ST.ss.forEach(subj=>{const chs=HSC[ST.div].subjects[subj].ch;if(!ST.sc[subj])ST.sc[subj]=chs.map((_,i)=>i);
      h+=`<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:.5px solid var(--bd)"><span style="font-size:13px;font-weight:700;color:var(--tx)">${subj}</span><span style="font-size:11px;color:var(--ac);cursor:pointer" onclick="tgAll('${subj}')">সব/বাতিল</span></div>`;
      chs.forEach((ch,i)=>{const chk=ST.sc[subj]&&ST.sc[subj].includes(i);const pi=ch.p===1?'⚡':ch.p===2?'📌':'📖';const sz=ch.sz===3?'বড়':ch.sz===2?'মাঝারি':'ছোট';
      h+=`<div class="chi"><input type="checkbox" ${chk?'checked':''} onchange="tgCh('${subj}',${i})"><span style="flex:1">${ch.n}</span><span style="font-size:10px;margin-left:3px">${pi}</span><span style="font-size:10px;color:var(--tx3);margin-left:4px">[${sz}]</span></div>`;});h+=`</div>`;});h+=`</div>`;
    }
  }
  h+=`<div class="g2"><div><div class="sl" style="margin-top:0">মোট দিন</div><input type="number" id="di" min="7" max="365" value="30"></div><div><div class="sl" style="margin-top:0">ঘণ্টা/দিন</div><input type="number" id="hi" min="1" max="14" value="4"></div></div>
  <div class="sl">ট্র্যাকের নাম</div><input type="text" id="tn" placeholder="HSC ফাইনাল প্রস্তুতি ২০২৫">
  <button class="btn btp" onclick="doGen()">🚀 ট্র্যাক তৈরি করো</button></div>`;
  if(ST.tracks.length){h+=`<div class="card"><div class="ct">📋 আমার ট্র্যাকসমূহ</div>`;
  ST.tracks.forEach((tr,i)=>{const tot=tr.schedule.reduce((a,d)=>a+d.tasks.length,0),dn=tr.schedule.reduce((a,d)=>a+d.tasks.filter(x=>x.done).length,0),pct=tot?Math.round(dn/tot*100):0;
  h+=`<div style="padding:10px 0;border-bottom:.5px solid var(--bd)"><div style="display:flex;justify-content:space-between;align-items:center"><div style="font-size:13px;font-weight:600">${tr.name}</div><div style="display:flex;gap:6px;align-items:center">${i===ST.ci?'<span class="badge bg">সক্রিয়</span>':''}<span style="font-size:11px;color:var(--ac);cursor:pointer;font-weight:500" onclick="ST.ci=${i};sv();gp('home')">→ সক্রিয় করো</span></div></div><div class="pb" style="margin-top:6px"><div class="pf pfg" style="width:${pct}%"></div></div><div style="font-size:11px;color:var(--tx2);margin-top:3px">${dn}/${tot} সেশন · ${HSC[tr.division].label} · ${pct}%</div></div>`;});
  h+=`</div>`;}
  c.innerHTML=h;
}
function onDv(){ST.div=document.getElementById('dv').value;ST.ss=[];ST.sc={};rTrack();}
function tgSj(s){const i=ST.ss.indexOf(s);if(i>=0){ST.ss.splice(i,1);delete ST.sc[s];}else ST.ss.push(s);rTrack();}
function tgAll(subj){const chs=HSC[ST.div].subjects[subj].ch;ST.sc[subj]=(ST.sc[subj]&&ST.sc[subj].length===chs.length)?[]:chs.map((_,i)=>i);rTrack();}
function tgCh(subj,i){if(!ST.sc[subj])ST.sc[subj]=[];const pos=ST.sc[subj].indexOf(i);if(pos>=0)ST.sc[subj].splice(pos,1);else ST.sc[subj].push(i);}
function doGen(){
  if(!ST.div){alert('বিভাগ সিলেক্ট করো');return;}if(!ST.ss.length){alert('অন্তত একটি বিষয় সিলেক্ট করো');return;}
  if(!ST.ss.some(s=>ST.sc[s]&&ST.sc[s].length>0)){alert('অন্তত একটি অধ্যায় সিলেক্ট করো');return;}
  const days=parseInt(document.getElementById('di').value)||30,name=document.getElementById('tn').value||'আমার স্টাডি ট্র্যাক';
  const sched=buildSched(ST.ss,ST.sc,ST.div,days);if(!sched.length){alert('শিডিউল তৈরি হয়নি');return;}
  const tot=sched.reduce((a,d)=>a+d.tasks.length,0);
  ST.tracks.push({id:Date.now(),name,division:ST.div,subjects:[...ST.ss],schedule:sched,si:new Date().toISOString().slice(0,10)});
  ST.ci=ST.tracks.length-1;sv();
  alert(`✅ ট্র্যাক তৈরি!\n${sched.length} দিন · ${tot} সেশন\nপ্রতিদিন মিক্স বিষয় + প্রায়োরিটি অনুযায়ী সাজানো।`);gp('home');
}

// TODAY
function rToday(){
  const c=document.getElementById('p-today');
  if(!ST.tracks.length){c.innerHTML=`<div class="empty"><p>প্রথমে ট্র্যাক তৈরি করো</p></div>`;return;}
  const t=gT(),tn=tdN(t);let h='';
  t.schedule.forEach((day,di)=>{
    const dn=day.tasks.filter(x=>x.done).length,tot=day.tasks.length,isTd=day.day===tn,all=dn===tot&&tot>0;
    h+=`<div class="dc ${isTd?'tdy':''}"><div class="dh"><div style="display:flex;align-items:center;gap:8px"><div style="min-width:30px;height:30px;border-radius:10px;background:${isTd?'var(--ac)':all?'var(--acl)':'var(--bg3)'};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:${isTd?'#fff':all?'var(--act)':'var(--tx2)'}">${day.day}</div><div><div style="font-size:13px;font-weight:600">${day.ds}${isTd?' <span style="color:var(--ac);font-size:11px">← আজ</span>':''}</div><div style="font-size:11px;color:var(--tx2)">${[...new Set(day.tasks.map(t=>t.subject))].join(' · ')}</div></div></div><span class="badge ${all?'bg':isTd?'ba':'bb'}">${dn}/${tot}</span></div>
    <div class="pb" style="margin-bottom:8px"><div class="pf pfg" style="width:${tot?Math.round(dn/tot*100):0}%"></div></div>`;
    day.tasks.forEach((task,ti)=>{const col=gSC(t,task.subject);h+=`<div class="ti"><div class="tc ${task.done?'dn':''}" onclick="sTk(${di},${ti})">${task.done?'✓':''}</div><div class="sd" style="background:${col}"></div><div class="tt ${task.done?'st':''}">${task.subject}: ${task.chapter}${task.tp>1?' পর্ব '+task.part+'/'+task.tp:''}</div></div>`;});
    h+=`</div>`;});
  c.innerHTML=h;
}
function sTk(di,ti){const t=gT();t.schedule[di].tasks[ti].done=!t.schedule[di].tasks[ti].done;sv();rToday();}

// ============ POMODORO + MCQ ============
let PM={phase:'idle',timer:null,rem:0,brem:0,bt:null,mt:null,mrem:0,mlim:35,curQ:null,mans:false,mok:0,mtot:0,used:[]};

function rTimer(){if(PM.phase==='study')rStudy();else if(PM.phase==='break')rBreak();else rTSetup();}
function rTSetup(){
  const p=ST.pomo;const td=new Date().toISOString().slice(0,10);if(p.ld!==td){p.tsec=0;p.ptoday=0;sv();}
  let aH='';
  if(p.div==='science')aH=`<div class="sl">ভর্তির লক্ষ্য</div><div class="chipw"><div class="chip ${p.tgt==='medical'?'on':''}" onclick="setTgt('medical')">মেডিকেল</div><div class="chip ${p.tgt==='engineering'?'on':''}" onclick="setTgt('engineering')">BUET/ইঞ্জিনিয়ারিং</div><div class="chip ${p.tgt==='university'?'on':''}" onclick="setTgt('university')">বিশ্ববিদ্যালয়</div></div>`;
  document.getElementById('p-timer').innerHTML=`<div class="card"><div class="ct">⏱ Pomodoro টাইমার</div>
  <div class="sl" style="margin-top:0">তোমার বিভাগ</div>
  <select onchange="ST.pomo.div=this.value;ST.pomo.tgt='';sv();rTimer()"><option value="">-- বিভাগ --</option><option value="science" ${p.div==='science'?'selected':''}>বিজ্ঞান</option><option value="humanities" ${p.div==='humanities'?'selected':''}>মানবিক</option><option value="commerce" ${p.div==='commerce'?'selected':''}>ব্যবসায়</option></select>
  ${aH}
  <div class="sl">সেশন দৈর্ঘ্য</div>
  <div class="chipw">${[[25,'২৫'],[30,'৩০'],[45,'৪৫'],[50,'৫০ ✓'],[60,'৬০']].map(([v,l])=>`<div class="chip ${p.dur===v?'on':''}" onclick="setDur(${v})">${l} মিনিট</div>`).join('')}</div>
  <div class="sl">দৈনিক টার্গেট</div>
  <select onchange="ST.pomo.dmin=parseInt(this.value);sv()">${[[120,'২ ঘণ্টা'],[180,'৩ ঘণ্টা'],[240,'৪ ঘণ্টা ✓'],[300,'৫ ঘণ্টা'],[360,'৬ ঘণ্টা']].map(([v,l])=>`<option value="${v}" ${p.dmin===v?'selected':''}>${l}</option>`).join('')}</select>
  <div style="background:var(--bg3);border-radius:var(--rs);padding:12px;margin:10px 0;font-size:12px;color:var(--tx2);border:.5px solid var(--bd)">💡 ব্রেকে MCQ পপআপ হবে · একই প্রশ্ন বারবার আসবে ঘন ঘন · ব্রেক: ${p.dur<=30?'৫–৭':'১০–১৫'} মিনিট</div>
  <button class="btn btp" onclick="startP()">▶ টাইমার শুরু করো</button>
  ${p.tsec>0?`<div style="text-align:center;margin-top:12px;font-size:13px;color:var(--tx2)">আজ পড়েছো: <strong style="color:var(--act)">${Math.floor(p.tsec/60)} মিনিট</strong> · ${p.ptoday}টি পোমো সম্পন্ন</div>`:''}
  </div>`;
}
function setTgt(t){ST.pomo.tgt=t;sv();rTimer();}
function setDur(v){ST.pomo.dur=v;ST.pomo.brk=v<=30?6:12;sv();rTimer();}
function startP(){
  if(!ST.pomo.div){alert('বিভাগ সিলেক্ট করো');return;}
  if(ST.pomo.div==='science'&&!ST.pomo.tgt){alert('ভর্তির লক্ষ্য সিলেক্ট করো');return;}
  PM.phase='study';PM.rem=ST.pomo.dur*60;PM.used=[];rStudy();runST();
}
function rStudy(){
  const p=ST.pomo,pct=Math.min(100,Math.round(p.tsec/(p.dmin*60)*100)),sp=Math.round((1-PM.rem/(p.dur*60))*100);
  const dots=Array.from({length:Math.max(4,p.ptoday+2)},(_,i)=>`<div class="pd ${i<p.ptoday?'dnd':i===p.ptoday?'acd':''}"></div>`).join('');
  document.getElementById('p-timer').innerHTML=`<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><span class="badge bg">📖 পড়ার সময়</span><span style="font-size:12px;color:var(--tx2);font-weight:500">পোমো #${p.ptoday+1}</span></div>
  <div class="pdots">${dots}</div>
  <div class="tw"><div class="tn" id="td">${s2t(PM.rem)}</div><div class="tph">${p.dur} মিনিটের সেশন চলছে</div></div>
  <div class="pb" style="margin-bottom:4px"><div class="pf pfg" id="tsb" style="width:${sp}%"></div></div>
  <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--tx2);margin-bottom:14px;margin-top:4px"><span>সেশন অগ্রগতি</span><span>${sp}%</span></div>
  <div class="stg"><div class="sb"><div class="sn">${Math.floor(p.tsec/60)}</div><div class="slb">আজ (মিনিট)</div></div><div class="sb"><div class="sn">${Math.max(0,p.dmin-Math.floor(p.tsec/60))}</div><div class="slb">টার্গেট বাকি</div></div><div class="sb"><div class="sn">${p.ptoday}</div><div class="slb">পোমো ✓</div></div></div>
  <div class="sl">দৈনিক লক্ষ্য (${p.dmin} মিনিট)</div><div class="pb"><div class="pf pfg" style="width:${pct}%"></div></div>
  <div style="text-align:right;font-size:11px;color:var(--tx2);margin-top:3px;margin-bottom:14px">${pct}%</div>
  <button class="btn btd" onclick="stopP()">⏹ বন্ধ করো ও সেভ করো</button></div>`;
}
function runST(){
  clearInterval(PM.timer);PM.timer=setInterval(()=>{
    PM.rem--;ST.pomo.tsec++;ST.pomo.ld=new Date().toISOString().slice(0,10);sv();
    const el=document.getElementById('td'),bar=document.getElementById('tsb');
    if(el)el.textContent=s2t(PM.rem);
    if(bar)bar.style.width=Math.round((1-PM.rem/(ST.pomo.dur*60))*100)+'%';
    if(PM.rem<=0){clearInterval(PM.timer);ST.pomo.ptoday++;sv();sN('Topper\'s Cave ⏰','পোমো #'+ST.pomo.ptoday+' শেষ! ব্রেক নাও।');startBrk();}
  },1000);
}
function stopP(){clearInterval(PM.timer);clearInterval(PM.bt);clearInterval(PM.mt);PM.phase='idle';closeMCQ();rTimer();}

// MCQ SYSTEM
function getMCQPool(){
  if(ST.pomo.div==='science')return SCIENCE_MCQ.map((q,i)=>({...q,idx:i}));
  return HUM_MCQ.map((q,i)=>({q:q.q,o:q.o,a:q.a,e:q.e,id:i+1000,idx:i+1000}));
}
function startBrk(){
  PM.phase='break';PM.brem=ST.pomo.brk*60;PM.mans=false;PM.used=[];PM.mok=0;PM.mtot=0;
  rBreak();runBT();nxQ();
}
function rBreak(){
  const p=ST.pomo;
  document.getElementById('p-timer').innerHTML=`<div class="card" style="border-color:var(--am)"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><span class="badge ba">☕ ব্রেক টাইম</span><span style="font-size:18px;font-weight:700;color:var(--am)" id="bcd">${s2t(PM.brem)}</span></div>
  <div style="text-align:center;padding:20px 0"><div style="font-size:40px;margin-bottom:8px">🧠</div><div style="font-size:14px;color:var(--tx2)">MCQ প্র্যাকটিস চলছে...</div><div style="font-size:12px;color:var(--tx3);margin-top:4px">সঠিক: <strong id="msc" style="color:var(--act)">${PM.mok}</strong> / ${PM.mtot}</div></div>
  <div class="stg" style="margin-bottom:10px"><div class="sb"><div class="sn">${ST.pomo.ptoday}</div><div class="slb">পোমো সম্পন্ন</div></div><div class="sb"><div class="sn">${Math.floor(ST.pomo.tsec/60)}</div><div class="slb">মোট মিনিট</div></div><div class="sb"><div class="sn" id="brk-pct">0%</div><div class="slb">MCQ সঠিক</div></div></div>
  <button class="btn btp" onclick="endBE()">📖 ব্রেক শেষ, পড়তে বসো →</button></div>`;
}
function runBT(){clearInterval(PM.bt);PM.bt=setInterval(()=>{PM.brem--;const el=document.getElementById('bcd');if(el)el.textContent=s2t(PM.brem);if(PM.brem<=0){clearInterval(PM.bt);clearInterval(PM.mt);closeMCQ();endBrk();}},1000);}

function showMCQ(){
  const q=PM.curQ;if(!q)return;
  const keys=['a','b','c','d'];
  const opts=q.options?keys.map(k=>q.options[k]):q.o;
  const ansKey=q.answer||keys[q.a];
  const ansIdx=q.answer?keys.indexOf(q.answer):q.a;
  const subj=q.subject||'';
  document.getElementById('mcq-overlay').style.display='block';
  document.getElementById('mcq-overlay').innerHTML=`<div class="mcq-overlay" onclick="">
  <div class="mcq-sheet">
    <div class="mcq-hdr">
      <span class="badge bb">${subj}</span>
      <div style="display:flex;align-items:center;gap:8px"><span class="badge ba">${PM.mtot+1}টি প্রশ্ন</span><span style="font-size:13px;font-weight:700;color:var(--am)" id="mtc">${PM.mrem}s</span></div>
    </div>
    <div class="mcq-tbar"><div class="mcq-tfill" id="mtf" style="width:100%"></div></div>
    <div class="mcq-q">${q.question||q.q}</div>
    <div class="mcq-opts">${opts.map((o,i)=>`<button class="mcq-opt" id="op${i}" onclick="ansQ(${i})">${String.fromCharCode(65+i)}. ${o}</button>`).join('')}</div>
    <div id="mres"></div>
  </div></div>`;
}
function closeMCQ(){document.getElementById('mcq-overlay').style.display='none';document.getElementById('mcq-overlay').innerHTML='';}

function nxQ(){
  clearInterval(PM.mt);
  const pool=getMCQPool();
  PM.mlim=ST.pomo.tgt==='engineering'?60:35;
  let av=pool.filter(q=>!PM.used.includes(q.id||q.idx));
  if(!av.length){PM.used=[];av=pool;}
  const q=av[Math.floor(Math.random()*av.length)];
  PM.used.push(q.id||q.idx);PM.curQ=q;PM.mans=false;PM.mrem=PM.mlim;
  showMCQ();
  PM.mt=setInterval(()=>{PM.mrem--;const bar=document.getElementById('mtf'),cnt=document.getElementById('mtc');if(bar)bar.style.width=Math.round(PM.mrem/PM.mlim*100)+'%';if(cnt)cnt.textContent=PM.mrem+'s';if(PM.mrem<=0&&!PM.mans){clearInterval(PM.mt);aRev();}},1000);
}
function ansQ(chosen){
  if(PM.mans)return;clearInterval(PM.mt);PM.mans=true;PM.mtot++;
  const q=PM.curQ;
  const keys=['a','b','c','d'];
  const ansIdx=q.answer?keys.indexOf(q.answer):q.a;
  const ok=chosen===ansIdx;if(ok)PM.mok++;
  document.querySelectorAll('.mcq-opt').forEach((b,i)=>{b.disabled=true;if(i===ansIdx)b.classList.add('ok');else if(i===chosen&&!ok)b.classList.add('ng');});
  const res=document.getElementById('mres');
  const exp=q.e||q.explanation||'';
  if(res)res.innerHTML=`<div class="mcq-res ${ok?'mrok':'mrng'}">${ok?'✅ সঠিক উত্তর!':'❌ ভুল। সঠিক: '+String.fromCharCode(65+ansIdx)+'. '+(q.options?q.options[keys[ansIdx]]:q.o[ansIdx])}${exp?'<br><span style="font-size:11px;opacity:.85;font-weight:400">'+exp+'</span>':''}</div>`;
  const sc=document.getElementById('msc');if(sc)sc.textContent=PM.mok;
  const pp=document.getElementById('brk-pct');if(pp)pp.textContent=PM.mtot?Math.round(PM.mok/PM.mtot*100)+'%':'0%';
  setTimeout(()=>{if(PM.brem>0&&PM.phase==='break')nxQ();},2500);
}
function aRev(){
  if(PM.mans)return;PM.mans=true;PM.mtot++;
  const q=PM.curQ;const keys=['a','b','c','d'];const ansIdx=q.answer?keys.indexOf(q.answer):q.a;
  document.querySelectorAll('.mcq-opt').forEach((b,i)=>{b.disabled=true;if(i===ansIdx)b.classList.add('rv');});
  const res=document.getElementById('mres');
  if(res)res.innerHTML=`<div class="mcq-res mrng">⏱ সময় শেষ! সঠিক: ${String.fromCharCode(65+ansIdx)}. ${q.options?q.options[keys[ansIdx]]:q.o[ansIdx]}</div>`;
  const pp=document.getElementById('brk-pct');if(pp)pp.textContent=PM.mtot?Math.round(PM.mok/PM.mtot*100)+'%':'0%';
  setTimeout(()=>{if(PM.brem>0&&PM.phase==='break')nxQ();},2500);
}
function endBrk(){closeMCQ();PM.phase='study';PM.rem=ST.pomo.dur*60;sN('Topper\'s Cave 📖','নতুন পোমোডোরো শুরু!');rStudy();runST();}
function endBE(){clearInterval(PM.bt);clearInterval(PM.mt);endBrk();}
function sN(title,body){try{if(typeof AndroidBridge!=='undefined')AndroidBridge.showNotification(title,body);else if(typeof Notification!=='undefined'&&Notification.permission==='granted')new Notification(title,{body});}catch(e){}}
try{if(typeof Notification!=='undefined'&&Notification.permission==='default')Notification.requestPermission();}catch(e){}

// STORE HOUSE
function rStore(){
  document.getElementById('p-store').innerHTML=`
  <div style="margin-bottom:16px">
    <div style="font-size:20px;font-weight:800;background:linear-gradient(135deg,var(--act),var(--bl));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:4px">📦 Store House</div>
    <div style="font-size:13px;color:var(--tx2)">তোমার পড়াশোনার সেরা রিসোর্স একসাথে</div>
  </div>
  <a href="https://aapathshala.com" target="_blank" class="store-card store-card-1" onclick="openLink('https://aapathshala.com')">
    <div class="store-icon">🎯</div>
    <div class="store-title">আপাঠশালা</div>
    <ul class="store-features">
      <li>→ আনলিমিটেড এক্সাম</li>
      <li>→ প্রশ্ন ব্যাংক</li>
      <li>→ দাগানো বই</li>
      <li>→ অনলাইন লাইব্রেরী</li>
    </ul>
    <div class="store-badge">aapathshala.com →</div>
    <div class="store-arrow">›</div>
  </a>
  <a href="https://drive.google.com/folderview?id=18sW1HXeq-T8tTTkYoZo69vyrWctYhe8W" target="_blank" class="store-card store-card-2" onclick="openLink('https://drive.google.com/folderview?id=18sW1HXeq-T8tTTkYoZo69vyrWctYhe8W')">
    <div class="store-icon">📂</div>
    <div class="store-title">Special Archive</div>
    <ul class="store-features">
      <li>→ বিশেষ নোটস ও গাইড</li>
      <li>→ এক্সক্লুসিভ মেটেরিয়াল</li>
      <li>→ Google Drive কালেকশন</li>
    </ul>
    <div class="store-badge" style="background:rgba(255,255,255,.15)">Google Drive →</div>
    <div class="store-arrow">›</div>
  </a>`;
}
function openLink(url){
  try{if(typeof AndroidBridge!=='undefined'&&AndroidBridge.openUrl)AndroidBridge.openUrl(url);else window.open(url,'_blank');}catch(e){window.open(url,'_blank');}
}

// INFO
function rInfo(){document.getElementById('p-info').innerHTML=`
<div class="card"><div class="ct">📋 HSC পরীক্ষার তথ্য</div>
  <div class="ir"><span class="ik">বোর্ড</span><span>বাংলাদেশ মাধ্যমিক ও উচ্চমাধ্যমিক শিক্ষা বোর্ড</span></div>
  <div class="ir"><span class="ik">পরীক্ষার সময়</span><span>সাধারণত এপ্রিল–মে</span></div>
  <div class="ir"><span class="ik">পাসমার্ক</span><span>প্রতি বিষয়ে ৩৩</span></div>
  <div class="ir"><span class="ik">সর্বোচ্চ GPA</span><span>৫.০০</span></div>
</div>
<div class="card"><div class="ct">📝 প্রশ্নপত্রের ধরন</div>
  <div class="ir"><span class="ik">MCQ</span><span>৩০টি, ৩০ নম্বর, ৩০ মিনিট</span></div>
  <div class="ir"><span class="ik">সৃজনশীল</span><span>৭টি উত্তর, ৭০ নম্বর, ২.৩০ ঘণ্টা</span></div>
  <div class="ir"><span class="ik">ব্যবহারিক</span><span>বিজ্ঞান বিভাগে ২৫ নম্বর</span></div>
</div>
<div class="card"><div class="ct">🎓 ভর্তি পরীক্ষা</div>
  <div class="ir"><span class="ik">ঢাবি</span><span>ক/খ/গ/ঘ/ঙ ইউনিট আলাদা পরীক্ষা</span></div>
  <div class="ir"><span class="ik">BUET</span><span>পদার্থ + রসায়ন + গণিত</span></div>
  <div class="ir"><span class="ik">মেডিকেল</span><span>জীববিজ্ঞান + রসায়ন + পদার্থ + ইংরেজি + GK</span></div>
  <div class="ir"><span class="ik">GST গুচ্ছ</span><span>একসাথে অনেক বিশ্ববিদ্যালয়</span></div>
</div>
<div class="card"><div class="ct">📊 গ্রেডিং সিস্টেম</div>
  <div class="gg">
    <div class="gbox"><div style="font-size:18px;font-weight:700;color:var(--act)">A+</div><div style="font-size:10px;color:var(--tx2)">৮০–১০০</div></div>
    <div class="gbox"><div style="font-size:18px;font-weight:700;color:var(--act)">A</div><div style="font-size:10px;color:var(--tx2)">৭০–৭৯</div></div>
    <div class="gbox"><div style="font-size:18px;font-weight:700;color:var(--bl)">A-</div><div style="font-size:10px;color:var(--tx2)">৬০–৬৯</div></div>
    <div class="gbox"><div style="font-size:18px;font-weight:700;color:var(--am)">B</div><div style="font-size:10px;color:var(--tx2)">৫০–৫৯</div></div>
    <div class="gbox"><div style="font-size:18px;font-weight:700;color:var(--am)">C</div><div style="font-size:10px;color:var(--tx2)">৪০–৪৯</div></div>
    <div class="gbox"><div style="font-size:18px;font-weight:700;color:var(--rd)">D</div><div style="font-size:10px;color:var(--tx2)">৩৩–৩৯</div></div>
  </div>
</div>`;}

// ABOUT
function rAbout(){document.getElementById('p-about').innerHTML=`<div class="ab-center">
  <div class="ab-logo"><svg width="40" height="40" viewBox="0 0 40 40" fill="none"><path d="M7 10h26M7 20h18M7 30h22" stroke="white" stroke-width="3" stroke-linecap="round"/></svg></div>
  <div style="font-size:32px;font-weight:800;background:linear-gradient(135deg,var(--act),var(--bl));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-family:serif;margin-bottom:4px">Topper's Cave</div>
  <div style="font-size:13px;color:var(--tx2);margin-bottom:28px">HSC Study Tracker · Bangladesh Board</div>
  <div class="card" style="text-align:left;max-width:320px;margin:0 auto 16px">
    <div class="ir"><span class="ik">নির্মাতা</span><span style="font-weight:700;font-size:16px;background:linear-gradient(135deg,var(--act),var(--bl));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">Hamim</span></div>
    <div class="ir"><span class="ik">ভার্সন</span><span>1.0.0</span></div>
    <div class="ir"><span class="ik">প্ল্যাটফর্ম</span><span>Web / PWA</span></div>
    <div class="ir"><span class="ik">MCQ ব্যাংক</span><span>১৩০+ বিজ্ঞান প্রশ্ন</span></div>
  </div>
  <div style="font-size:12px;color:var(--tx3)">বাংলাদেশের HSC শিক্ষার্থীদের জন্য তৈরি 🇧🇩</div>
</div>`;}

// INIT
setTimeout(()=>{document.getElementById('splash').classList.add('out');},2500);
rHome();
