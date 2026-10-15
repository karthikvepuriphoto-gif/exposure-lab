// Exposure Lab - dials, controls, sound, roll, learning flow
'use strict';
// ---------- sound & haptics ----------
let AC=null; function ac(){ if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } if(AC&&AC.state==='suspended') AC.resume(); return AC; }
let sfxOn=true;
function tickSound(){ if(!sfxOn) return; const a=ac(); if(!a) return; const t=a.currentTime; const o=a.createOscillator(), g=a.createGain(); o.type='square'; o.frequency.value=2400;
  g.gain.setValueAtTime(0.05,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.018); o.connect(g).connect(a.destination); o.start(t); o.stop(t+0.02); if(navigator.vibrate) try{navigator.vibrate(4);}catch(e){} }
function noiseBurst(a,t,dur,vol,freq){ const n=a.createBuffer(1,Math.ceil(a.sampleRate*dur),a.sampleRate), d=n.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);
  const s=a.createBufferSource(); s.buffer=n; const f=a.createBiquadFilter(); f.type='bandpass'; f.frequency.value=freq; f.Q.value=0.8; const g=a.createGain(); g.gain.value=vol; s.connect(f).connect(g).connect(a.destination); s.start(t); }
function shutterSound(sec){ if(!sfxOn) return; const a=ac(); if(!a) return; const t=a.currentTime; noiseBurst(a,t,0.05,0.9,2500); noiseBurst(a,t+0.01,0.03,0.6,700);
  const t2=t+Math.max(0.06,Math.min(sec,1.2)); noiseBurst(a,t2,0.05,0.8,2000); noiseBurst(a,t2+0.01,0.04,0.5,600); }

// ---------- Wheel (horizontal scroll dial) ----------
class Wheel {
  constructor(cv){ this.cv=cv; this.pos=0; this.def=null; this.sp=64; this.vel=0; this.anim=false;
    let drag=null;
    cv.addEventListener('pointerdown',e=>{ ac(); if(!this.def) return; cv.setPointerCapture(e.pointerId); drag={x:e.clientX,t:performance.now(),moved:0}; this.vel=0; this.anim=false; e.preventDefault(); });
    cv.addEventListener('pointermove',e=>{ if(!drag) return; const dx=e.clientX-drag.x, now=performance.now(); drag.moved+=Math.abs(dx);
      const dt=Math.max(1,now-drag.t); this.vel=0.7*this.vel+0.3*(-dx/this.sp)/dt; drag.x=e.clientX; drag.t=now; this.move(-dx/this.sp); e.preventDefault(); });
    const end=e=>{ if(!drag) return; const tap=drag.moved<6; drag=null;
      if(tap){ const r=cv.getBoundingClientRect(); const off=(e.clientX-r.left-r.width/2)/this.sp; if(Math.abs(off)>0.5) this.move(Math.round(off)*this.stepSize()); this.settle(); return; }
      if(Math.abs(this.vel)>0.002){ this.fling(); } else this.settle(); };
    cv.addEventListener('pointerup',end); cv.addEventListener('pointercancel',end);
    let wacc=0; cv.addEventListener('wheel',e=>{ e.preventDefault(); wacc+=(Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY); while(Math.abs(wacc)>=30){ this.move(Math.sign(wacc)*this.stepSize()); wacc-=Math.sign(wacc)*30; } this.settle(); },{passive:false});
    cv.addEventListener('keydown',e=>{ if(['ArrowRight','ArrowUp'].includes(e.key)){this.move(this.stepSize());this.settle();e.preventDefault();} if(['ArrowLeft','ArrowDown'].includes(e.key)){this.move(-this.stepSize());this.settle();e.preventDefault();} });
    new ResizeObserver(()=>this.draw()).observe(cv); }
  stepSize(){ return this.def&&this.def.full&&ST.full?3:1; }
  bind(def){ this.def=def; this.pos=def.get(); this.anim=false; this.draw(); this.cv.setAttribute('aria-label',def.name+' wheel'); }
  move(d){ const D=this.def; if(!D) return; if(D.disabled()){ toast(D.blocked()); return; }
    const n=D.labels.length-1; this.pos=Math.max(0,Math.min(n,this.pos+d)); let idx=Math.round(this.pos); const k=this.stepSize(); if(k>1) idx=Math.round(idx/k)*k; idx=Math.max(0,Math.min(n,idx));
    if(idx!==D.get()){ D.set(idx); tickSound(); }
    this.draw(); }
  fling(){ this.anim=true; let last=performance.now(); const go=now=>{ if(!this.anim) return; const dt=now-last; last=now; this.move(this.vel*dt); this.vel*=Math.pow(0.994,dt);
      const n=this.def.labels.length-1; if(Math.abs(this.vel)<0.0015||this.pos<=0||this.pos>=n){ this.anim=false; this.settle(); return; } requestAnimationFrame(go); }; requestAnimationFrame(go); }
  settle(){ const target=this.def.get(); const from=this.pos; const t0=performance.now(); this.anim=false;
    const go=now=>{ const k=Math.min(1,(now-t0)/140); this.pos=from+(target-from)*(1-Math.pow(1-k,3)); this.draw(); if(k<1&&!this.anim) requestAnimationFrame(go); }; requestAnimationFrame(go); }
  sync(){ if(!this.def||this.anim) return; const g=this.def.get(); if(Math.round(this.pos)!==g){ this.pos=g; this.draw(); } }
  draw(){ const cv=this.cv, r=cv.getBoundingClientRect(); if(!r.width||!this.def) return; const dpr=Math.min(2,window.devicePixelRatio||1);
    const W=Math.round(r.width*dpr), H=Math.round(r.height*dpr); if(cv.width!==W||cv.height!==H){ cv.width=W; cv.height=H; }
    const c=cv.getContext('2d'); c.setTransform(dpr,0,0,dpr,0,0); const w=r.width, h=r.height, D=this.def, dis=D.disabled(); c.clearRect(0,0,w,h);
    this.sp = Math.max(74, Math.min(100, w/4.4));
    const cx=w/2, n=D.labels.length, k=this.stepSize();
    for(let i=Math.max(0,Math.floor(this.pos-w/2/this.sp)-1); i<=Math.min(n-1,Math.ceil(this.pos+w/2/this.sp)+1); i++){
      const x=cx+(i-this.pos)*this.sp, dist=Math.abs(x-cx)/(w/2); const al=Math.max(0,1-dist*0.85);
      const major=i%3===0; c.fillStyle=`rgba(255,255,255,${(major?0.55:0.3)*al})`; c.fillRect(x-1,h-(major?22:14),2,major?16:9);
      for(let m=1;m<3;m++){ const xm=x+m*this.sp/3; c.fillStyle=`rgba(255,255,255,${0.12*al})`; c.fillRect(xm-0.5,h-11,1,6); }
      if(k>1&&i%k) continue;
      const near=Math.abs(i-this.pos)<0.5; c.font=`${near?800:600} ${near?Math.min(21,h*0.25):Math.min(13.5,h*0.18)}px ui-monospace,Menlo,monospace`; c.textAlign='center'; c.textBaseline='middle';
      c.fillStyle= near? (dis?'#8fb4d9':'#fff') : `rgba(220,225,235,${al*0.8})`; c.fillText((D.prefix||'')+D.labels[i],x,h*0.42); }
    const g=c.createLinearGradient(0,0,w,0); g.addColorStop(0,'rgba(12,13,16,1)'); g.addColorStop(0.18,'rgba(12,13,16,0)'); g.addColorStop(0.82,'rgba(12,13,16,0)'); g.addColorStop(1,'rgba(12,13,16,1)'); c.fillStyle=g; c.fillRect(0,0,w,h);
    c.fillStyle=dis?'#7a8a99':'#ff5a36'; c.beginPath(); c.moveTo(cx-8,0); c.lineTo(cx+8,0); c.lineTo(cx,10); c.fill(); c.fillRect(cx-1.5,h-26,3,24);
    cv.setAttribute('aria-valuetext',(D.prefix||'')+D.labels[D.get()]); }
}
// ---------- toast & callouts ----------
let toastT=0; function toast(msg,ms=2600){ const t=$('#toast'); t.innerHTML=msg; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),ms); }
let prevSnap=null, changeT=0;
function snapState(){ const fr=computeFrame(G.time); const m=metrics(fr); return {ti:ST.ti,ai:ST.ai,qi:ST.qi,focal:ST.focal,nd:ST.nd,ec:ST.ec,m,ev:fr.ev}; }
function whatChanged(kind){ if(!G.meterMap) return; clearTimeout(changeT); if(!prevSnap) prevSnap=snapState(); const before=prevSnap;
  changeT=setTimeout(()=>{ const a=before, b=snapState(); prevSnap=b; const L=[];
    const dEV=(a.ev-b.ev); // positive = more light
    const st=x=>fmtStops(Math.round(x*3)/3,true);
    if(a.ti!==b.ti){ const d=(b.ti-a.ti)/-3; L.push(`Shutter ${SHUTTER_LABELS[a.ti]} → ${SHUTTER_LABELS[b.ti]}: ${st(d)} stop${Math.abs(d)===1?'':'s'} of light. Subject motion blur ${a.m.subMot.toFixed(1)} → ${b.m.subMot.toFixed(1)} px${b.m.shake>1.5?`, camera shake ${b.m.shake.toFixed(1)} px`:''}.`); }
    if(a.ai!==b.ai){ const d=(a.ai-b.ai)/3; L.push(`Aperture f/${APERTURE_LABELS[a.ai]} → f/${APERTURE_LABELS[b.ai]}: ${st(d)} stop${Math.abs(d)===1?'':'s'} of light. Background blur ${a.m.bgBlur.toFixed(0)} → ${b.m.bgBlur.toFixed(0)} px (depth of field ${b.ai>a.ai?'deeper':'shallower'}).`); }
    if(a.qi!==b.qi){ const d=(b.qi-a.qi)/3; L.push(`ISO ${ISO_LABELS[a.qi]} → ${ISO_LABELS[b.qi]}: ${st(d)} stop${Math.abs(d)===1?'':'s'} brighter; noise ${a.m.noise.toFixed(1)}% → ${b.m.noise.toFixed(1)}% in midtones.`); }
    if(a.nd!==b.nd){ L.push(`ND filter: ${st(a.nd-b.nd)} stops of light. Same look, so you can use a slower shutter or wider aperture.`); }
    if(a.focal!==b.focal){ L.push(`Focal length ${a.focal} → ${b.focal}mm: field of view ${fov(a.focal)}° → ${fov(b.focal)}°. Background blur ${a.m.bgBlur.toFixed(0)} → ${b.m.bgBlur.toFixed(0)} px.`); }
    if(a.ec!==b.ec){ L.push(`Exposure compensation ${st(a.ec/3)} → ${st(b.ec/3)} EV: the camera changes ${ST.mode==='Av'?'shutter speed':ST.mode==='Tv'?'aperture':'its settings'} to make the photo ${b.ec>a.ec?'brighter':'darker'}.`); }
    if(ST.mode!=='M' && (a.ti!==b.ti||a.ai!==b.ai||a.qi!==b.qi) && kind!=='auto') L.push(`<i>In ${ST.mode} mode the camera re-balanced the other settings to keep the same exposure.</i>`);
    if(!L.length) return; const html=L.join('<br>'); const S=[];
    if(a.ti!==b.ti) S.push(`${st((b.ti-a.ti)/-3)} EV · motion blur ${a.m.subMot.toFixed(0)}→${b.m.subMot.toFixed(0)}px`);
    if(a.ai!==b.ai) S.push(`${st((a.ai-b.ai)/3)} EV · background blur ${a.m.bgBlur.toFixed(0)}→${b.m.bgBlur.toFixed(0)}px`);
    if(a.qi!==b.qi) S.push(`${st((b.qi-a.qi)/3)} EV · noise ${a.m.noise.toFixed(0)}→${b.m.noise.toFixed(0)}%`);
    if(a.nd!==b.nd) S.push(`ND ${st(a.nd-b.nd)} EV`); if(a.focal!==b.focal) S.push(`${b.focal}mm · ${fov(b.focal)}° view`); if(a.ec!==b.ec) S.push(`EV comp ${st(b.ec/3)}`);
    if(ST.mode!=='M'&&kind!=='auto'&&(a.ti!==b.ti||a.ai!==b.ai)) S.push(`${ST.mode}: camera re-balanced`);
    if(S.length){ $('#changed').innerHTML=S.slice(0,2).join(' · '); $('#changed').classList.add('show'); clearTimeout(whatChanged.h); whatChanged.h=setTimeout(()=>$('#changed').classList.remove('show'),2200); }
    const lc=$('#lessonChanged'); if(lc) lc.innerHTML=html; },250); }
function fov(f){ return Math.round(2*Math.atan(36/(2*f))*180/Math.PI); }

// ---------- setting chips + wheel ----------
let D={}, WHEEL=null, SEL='t';
const MODES=['Auto','P','Tv','Av','M'];
function blockedMsg(name){ return `${name} is set by the camera in <b>${ST.mode}</b> mode. Pick ${name==='Shutter'?'Tv or M':name==='Aperture'?'Av or M':'M, Av, Tv or P'} on the Mode chip to control it.`; }
const DEFS={
 t:{name:'Shutter',labels:SHUTTER_LABELS,full:true,get:()=>ST.ti,set:v=>{ST.ti=v;afterChange('t');},disabled:()=>['Av','P','Auto'].includes(ST.mode),blocked:()=>blockedMsg('Shutter'),hint:'Fast = freeze motion · slow = blur'},
 a:{name:'Aperture',labels:APERTURE_LABELS,prefix:'f/',full:true,get:()=>ST.ai,set:v=>{ST.ai=v;afterChange('a');},disabled:()=>['Tv','P','Auto'].includes(ST.mode),blocked:()=>blockedMsg('Aperture'),hint:'Small f-number = blurry background'},
 q:{name:'ISO',labels:ISO_LABELS,full:true,get:()=>ST.qi,set:v=>{ST.qi=v;afterChange('q');},disabled:()=>ST.mode==='Auto',blocked:()=>blockedMsg('ISO'),hint:'Higher = brighter but noisier'},
 ec:{name:'EV',labels:EC_LABELS,get:()=>ST.ec+9,set:v=>{ST.ec=v-9;afterChange('ec');},disabled:()=>ST.mode==='M',blocked:()=>'Exposure compensation works in P, Tv, Av and Auto. In M, watch the meter instead.',hint:'Tell auto modes: brighter / darker'},
 mode:{name:'Mode',labels:['Auto','P','Tv/S','Av/A','M'],get:()=>MODES.indexOf(ST.mode),set:v=>{ST.mode=MODES[v]; if(ST.mode==='Auto') ST.flash=false; afterChange('mode');},disabled:()=>false,hint:'M: you set all · Av: you set aperture · Tv: you set shutter'}
};
function chipVal(k){ const d=DEFS[k]; return (d.prefix||'')+d.labels[d.get()]; }
function makeDials(){
  $('#chips').innerHTML=Object.keys(DEFS).map(k=>`<button class="chip" data-k="${k}"><small>${DEFS[k].name}</small><b></b></button>`).join('')+`<button class="chip" data-k="more"><small>More</small><b>⚙︎</b></button>`;
  $('#chips').onclick=e=>{ const b=e.target.closest('.chip'); if(!b) return; ac(); tickSound(); if(b.dataset.k==='more'){ openSheet('settings'); return; } selectSetting(b.dataset.k); };
  WHEEL=new Wheel($('#wheel')); selectSetting('t'); }
function selectSetting(k){ SEL=k; WHEEL.bind(DEFS[k]); $$('#chips .chip').forEach(c=>c.classList.toggle('on',c.dataset.k===k)); $('#wheelTitle').textContent=DEFS[k].name+' · '+DEFS[k].hint; }
function syncDials(){ if(!WHEEL) return; $$('#chips .chip').forEach(c=>{ const k=c.dataset.k; if(!DEFS[k]) return; $('b',c).textContent=chipVal(k); c.classList.toggle('auto',DEFS[k].disabled()&&k!=='mode'); }); WHEEL.sync(); }
function afterChange(kind){ if(ST.mode!=='M') autoExpose(); syncDials(); syncControls(); whatChanged(kind); lessonCheck(); save(); }
// ---------- control panel ----------
function seg(host,key,opts,cb){ const el=$(host); el.innerHTML=opts.map(o=>`<button data-v="${o[0]}">${o[1]}</button>`).join('');
  el.onclick=e=>{ const b=e.target.closest('button'); if(!b) return; let v=b.dataset.v; if(v==='true')v=true; else if(v==='false')v=false; else if(!isNaN(+v)&&v!=='') v=+v; ST[key]=v; tickSound(); if(cb) cb(v); afterChange(key); }; }
function syncControls(){ $$('.seg').forEach(el=>{ const key=el.dataset.key; $$('button',el).forEach(b=>{ let v=b.dataset.v; b.classList.toggle('on', String(ST[key])===v); }); });
  $('#focal').value=Math.round(Math.log(ST.focal/14)/Math.log(200/14)*1000); $('#focalV').textContent=ST.focal+'mm · '+fov(ST.focal)+'° wide';
  $('#mf').value=Math.round(Math.log(ST.mf/0.3)/Math.log(1000/0.3)*1000); $('#mfV').textContent=fmtDist(ST.mf); $('#mfRow').style.display=ST.af==='MF'?'':'none';
  $('#kel').value=ST.K; $('#kelV').textContent=ST.K+'K'; $('#kelRow').style.display=ST.wb==='Kelvin'?'':'none';
  $('#fec').value=ST.fec*3; $('#fecV').textContent=fmtStops(ST.fec,true)+' EV'; $('#flashRow').style.display=ST.flash?'':'none';
  $('#histBox').style.display=ST.hist?'':'none'; $('#rec').value=ST.recover*3; $('#recV').textContent=fmtStops(ST.recover,true)+' EV';
  $('#keep').checked=ST.keepSize; updDof(); $$('#scenes button').forEach(b=>b.classList.toggle('on',b.dataset.s===ST.scene)); }
function updDof(){ const fr=G.frame; if(fr){ const c=0.03, H=fr.f*fr.f/(fr.N*c)/1000+fr.f/1000, s=fr.s; const near=s*(H-fr.f/1000)/(H+s-2*fr.f/1000), far=s<H? s*(H-fr.f/1000)/(H-s):1e9;
    $('#dof').innerHTML=`Depth of field at f/${APERTURE_LABELS[ST.ai]}, ${ST.focal}mm, focused at ${fmtDist(s)}: <b>${fmtDist(near)} – ${far>=1e8?'∞':fmtDist(far)}</b> · hyperfocal ${fmtDist(H)}`; } }
setInterval(updDof,400);
function buildControls(){
  $('#scenes').innerHTML=Object.entries(SCENES).map(([k,s])=>`<button data-s="${k}" title="${s.desc}"><span>${s.icon}</span>${s.name}</button>`).join('');
  $('#scenes').onclick=e=>{ const b=e.target.closest('button'); if(b) setScene(b.dataset.s); };
  seg('#segAF','af',[['AF-S','AF-S single'],['AF-C','AF-C continuous'],['MF','MF manual']],v=>{ if(v!=='MF') ST.focusS=targetDist(G.time); else ST.mf=Math.max(0.3,G.frame?G.frame.s:5); });
  seg('#segMeter','meter',[['matrix','Matrix / evaluative'],['center','Center-weighted'],['spot','Spot']]);
  seg('#segWB','wb',Object.keys(WB_PRESETS).map(k=>[k,k]));
  seg('#segFlash','flash',[[false,'Off'],[true,'⚡ On']]); seg('#segHSS','hss',[[false,'Normal sync'],[true,'High-speed sync']]);
  seg('#segND','nd',[[0,'None'],[3,'ND8 (3 stops)'],[6,'ND64 (6)'],[10,'ND1000 (10)']]);
  seg('#segIS','is',[[true,'IS on'],[false,'IS off']]); seg('#segTri','tripod',[[false,'Handheld'],[true,'Tripod']]);
  seg('#segDrive','drive',[['single','Single'],['burst','Burst 10 fps']]); seg('#segRaw','raw',[[false,'JPEG'],[true,'RAW']]);
  seg('#segStops','full',[[false,'⅓ stops'],[true,'Full stops']],v=>{ if(v){ ST.ti=Math.round(ST.ti/3)*3; ST.ai=Math.round(ST.ai/3)*3; ST.qi=Math.round(ST.qi/3)*3; } });
  seg('#segGrid','grid',[[true,'Grid on'],[false,'Off']]); seg('#segWarn','warn',[['off','Off'],['zebra','Zebras'],['blink','Blinkies']]);
  seg('#segPeak','peaking',[[false,'Peaking off'],[true,'Peaking on']]); seg('#segHist','hist',[[true,'Show'],[false,'Hide']]);
  $('#focal').oninput=e=>{ const f=Math.round(14*Math.pow(200/14,e.target.value/1000)); if(f!==ST.focal){ ST.focal=f; tickSound(); if(ST.af!=='MF') ST.focusS=targetDist(G.time); afterChange('focal'); } };
  $$('#focalChips button').forEach(b=>b.onclick=()=>{ ST.focal=+b.dataset.f; if(ST.af!=='MF') ST.focusS=targetDist(G.time); tickSound(); afterChange('focal'); });
  $('#keep').onchange=e=>{ ST.keepSize=e.target.checked; afterChange('focal'); };
  $('#mf').oninput=e=>{ ST.mf=+(0.3*Math.pow(1000/0.3,e.target.value/1000)).toFixed(2); tickSound(); afterChange('mf'); };
  $('#kel').oninput=e=>{ ST.K=+e.target.value; afterChange('K'); };
  $('#fec').oninput=e=>{ ST.fec=e.target.value/3; afterChange('fec'); };
  $('#rec').oninput=e=>{ ST.recover=e.target.value/3; afterChange('rec'); };
  $$('.ptabs button').forEach(b=>b.onclick=()=>{ $$('.ptabs button').forEach(x=>x.classList.toggle('on',x===b)); $$('.pane').forEach(p=>p.classList.toggle('on',p.id===b.dataset.p)); });
  // viewfinder tap = focus point
  $('#ov').addEventListener('pointerdown',e=>{ ac(); const r=e.target.getBoundingClientRect(); const dw=Math.max(r.width,r.height*TEXW/TEXH), dh=dw*TEXH/TEXW; const u=(e.clientX-r.left-(r.width-dw)/2)/dw, v=(e.clientY-r.top-(r.height-dh)/2)/dh; ST.focusPt=[u,v];
    const p=pickAt(u,v,G.time); ST.afLayer=p.id; if(ST.af!=='MF'){ ST.focusS=p.d; toast(`Focus: ${p.id==='ground'?'ground':p.id} at ${fmtDist(p.d)}`,1400); } tickSound(); afterChange('focus'); });
  const sh=$('#shutter'); let halfT=0, pressed=false;
  sh.addEventListener('pointerdown',e=>{ e.preventDefault(); ac(); pressed=true; sh.classList.add('half'); halfPress(); });
  sh.addEventListener('pointerup',e=>{ if(!pressed) return; pressed=false; sh.classList.remove('half'); sh.classList.add('full'); setTimeout(()=>sh.classList.remove('full'),150); takePhoto(); });
  sh.addEventListener('pointerleave',()=>{ if(pressed){ pressed=false; sh.classList.remove('half'); G.afLock=0; } });
  sh.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); halfPress(); takePhoto(); } });
  seg('#segInside','inside',[[true,'Show'],[false,'Hide']]); seg('#segBody','body',[['DSLR','DSLR (mirror)'],['Mirrorless','Mirrorless']]); document.addEventListener('keydown',e=>{ if(e.code==='Space'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)&&!document.activeElement.classList.contains('dial-c')){ e.preventDefault(); takePhoto(); } });
  $('#sfx').onclick=()=>{ sfxOn=!sfxOn; $('#sfx').textContent=sfxOn?'On':'Off'; $('#sfx').classList.toggle('on',sfxOn); };

}
function setScene(k,keepLens){ ST.scene=k; const sc=SCENES[k]; if(!keepLens){ ST.focal=sc.focal; ST.keepSize=false; } ST.afLayer=sc.focus;
  const sub=sc.layers.find(l=>l.id===sc.focus); ST.focusPt=[0.5,0.55]; buildScene(); ST.focusS=targetDist(G.time); ST.mf=ST.focusS;
  if(ST.wb==='Kelvin') {} afterChange('scene'); }

// ---------- photos & roll ----------
let ROLL=[]; try{ ROLL=JSON.parse(localStorage.getItem('el_roll')||'[]'); }catch(e){ ROLL=[]; }
function capture(time){ const fr=computeFrame(time); R.draw(fr); const c=document.createElement('canvas'); c.width=640; c.height=400; c.getContext('2d').drawImage($('#gl'),0,0,640,400);
  return { img:c.toDataURL('image/jpeg',0.72), fr, m:metrics(fr) }; }
function shotInfo(fr){ return {mode:ST.mode,t:SHUTTER_LABELS[ST.ti],N:APERTURE_LABELS[ST.ai],iso:ISO_LABELS[ST.qi],f:ST.focal,ev:ST.mode==='M'?Math.round(fr.meter*3)/3:ST.ec/3,wb:ST.wb==='Kelvin'?ST.K+'K':ST.wb,nd:ST.nd,flash:ST.flash,raw:ST.raw,scene:SC().name,af:ST.af,meter:ST.meter,focus:fmtDist(fr.s),time:new Date().toLocaleString()}; }
function afBeep(){ if(!sfxOn) return; const a=ac(); if(!a) return; const t=a.currentTime; for(const d of [0,0.09]){ const o=a.createOscillator(), g=a.createGain(); o.type='sine'; o.frequency.value=3100; g.gain.setValueAtTime(0.06,t+d); g.gain.exponentialRampToValueAtTime(0.0001,t+d+0.06); o.connect(g).connect(a.destination); o.start(t+d); o.stop(t+d+0.07); } }
function halfPress(){ if(ST.af!=='MF'){ ST.focusS=targetDist(G.time); } G.afLock=performance.now(); afBeep(); }
function takePhoto(){ ac(); if(ST.inside) insideAnim(); const t=tOf(ST.ti); shutterSound(t); const vf=$('#vf'); vf.classList.add('flashing'); setTimeout(()=>vf.classList.remove('flashing'),Math.min(900,120+t*300));
  const shots=[]; const n=ST.drive==='burst'?8:1; for(let i=0;i<n;i++){ const s=capture(G.time+i*0.1); s.info=shotInfo(s.fr); shots.push(s); }
  if(n>1){ let k=1; const iv=setInterval(()=>{ if(k++>=n) return clearInterval(iv); shutterSound(Math.min(t,0.05)); },100); }
  const burstId=n>1?Date.now():0; for(const s of shots) ROLL.unshift({img:s.img,info:s.info,burst:burstId,m:{subMot:+s.m.subMot.toFixed(1),subBlur:+s.m.subBlur.toFixed(1),bgBlur:+s.m.bgBlur.toFixed(0),shake:+s.m.shake.toFixed(1)}});
  ROLL=ROLL.slice(0,48); try{ localStorage.setItem('el_roll',JSON.stringify(ROLL)); }catch(e){ ROLL=ROLL.slice(0,16); try{localStorage.setItem('el_roll',JSON.stringify(ROLL));}catch(e2){} }
  $('#rollCount').textContent=ROLL.length; updPlate(); $('#lastShot').src=shots[0].img; $('#lastShot').style.display='';
  challengeCheck(shots); renderRoll(); }
function exifLine(i){ return `${i.mode} · ${i.t}${/"/.test(i.t)?'':'s'} · f/${i.N} · ISO ${i.iso} · ${i.f}mm · ${i.ev>=0?'+':''}${fmtStops(i.ev)} EV · WB ${i.wb}${i.nd?' · ND '+i.nd+' stops':''}${i.flash?' · Flash':''} · ${i.raw?'RAW':'JPEG'}`; }
function renderRoll(){ const g=$('#rollGrid'); if(!g) return; $('#rollCount').textContent=ROLL.length;
  g.innerHTML=ROLL.length? ROLL.map((r,i)=>`<figure data-i="${i}"><img src="${r.img}" alt="Photo ${i+1}" loading="lazy"><figcaption>${r.burst?'▶▶ ':''}${r.info.t} · f/${r.info.N} · ISO ${r.info.iso} · ${r.info.f}mm</figcaption></figure>`).join('') : '<p class="muted">No photos yet. Press the shutter button (or Space) to take one.</p>';
  g.onclick=e=>{ const f=e.target.closest('figure'); if(!f) return; const r=ROLL[+f.dataset.i];
    modal(`<img class="full" src="${r.img}"><div class="exif">${exifLine(r.info)}<br><span class="muted">${r.info.scene} · ${r.info.af} · ${r.info.meter} metering · focus ${r.info.focus} · ${r.info.time}</span><br>Subject motion blur ${r.m.subMot}px · focus blur ${r.m.subBlur}px · background blur ${r.m.bgBlur}px · camera shake ${r.m.shake}px</div>`); }; }
function modal(html){ $('#modalBody').innerHTML=html; $('#modal').classList.add('show'); }
function closeModal(){ $('#modal').classList.remove('show'); }

// ---------- persistence ----------
function save(){ try{ localStorage.setItem('el_state',JSON.stringify(ST)); }catch(e){} }
function load(){ try{ const s=JSON.parse(localStorage.getItem('el_state')||'null'); if(s&&SCENES[s.scene]) Object.assign(ST,s); }catch(e){} }

// ---------- top plate ----------
function updPlate(){ const n=ROLL.length; $('#shotsLeft').textContent='['+Math.max(0,999-n)+']'; $('#batLvl').style.width=Math.max(15,90-n*1.5)+'%'; }
// ---------- "how it works inside" animation ----------
function insideAnim(){ const cv=$('#inside'); cv.classList.add('show'); const c=cv.getContext('2d'), W=cv.width, H=cv.height; const t=tOf(ST.ti), N=nOf(ST.ai), dslr=ST.body==='DSLR';
  const expDur=Math.max(0.12,Math.min(0.7,0.12+Math.log2(1+t*8)*0.25)); const ph=dslr?[0.12,0.08,expDur,0.08,0.12]:[0.08,0.08,expDur,0.08,0.08]; const total=ph.reduce((x,y)=>x+y)+0.25; const t0=performance.now();
  const open=Math.max(0.16,Math.pow(1.4/N,0.6));
  const iris=(x,y,r,o)=>{ c.save(); c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.fillStyle='#2b2d33'; c.fill(); c.clip();
    const ro=r*o; c.beginPath(); for(let i=0;i<7;i++){ const a=i/7*Math.PI*2-Math.PI/2; const px=x+Math.cos(a)*ro, py=y+Math.sin(a)*ro; i?c.lineTo(px,py):c.moveTo(px,py);} c.closePath(); c.fillStyle='#9fd3ff'; c.fill();
    c.strokeStyle='#16171b'; c.lineWidth=1.5; for(let i=0;i<7;i++){ const a=i/7*Math.PI*2-Math.PI/2; c.beginPath(); c.moveTo(x+Math.cos(a)*ro,y+Math.sin(a)*ro); c.lineTo(x+Math.cos(a+1.2)*r*1.2,y+Math.sin(a+1.2)*r*1.2); c.stroke(); }
    c.restore(); c.strokeStyle='#666'; c.lineWidth=1.5; c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.stroke(); };
  const go=now=>{ const s=(now-t0)/1000; let k=s, stage=0; for(;stage<ph.length&&k>ph[stage];stage++) k-=ph[stage]; const p=stage<ph.length?k/ph[stage]:1;
    c.clearRect(0,0,W,H); c.fillStyle='#0b0c0e'; c.fillRect(0,0,W,H);
    const st= stage===0?1-p*(1-open): stage>=1&&stage<=3?open: stage===4?open+(1-open)*p:1;
    const sx=196, sy=34, sh=78, exposing= stage===2||(stage===1&&p>0.5)||(stage===3&&p<0.5);
    if(exposing){ c.fillStyle='rgba(255,220,130,.28)'; c.beginPath(); c.moveTo(48,73-30*st); c.lineTo(sx,sy); c.lineTo(sx,sy+sh); c.lineTo(48,73+30*st); c.closePath(); c.fill(); }
    iris(48,73,32,st);
    c.fillStyle='#2a2d33'; c.fillRect(sx,sy,12,sh); if(exposing){ c.fillStyle='#ffd27a'; c.fillRect(sx,sy,12,sh); }
    const front= stage<=1?(stage===1?1-p:1):0, rear= stage===3?p:stage>3?1:0;
    c.fillStyle='#5a5d64'; c.fillRect(sx-10,sy,7,sh*front); c.fillStyle='#8a8d94'; c.fillRect(sx-10,sy+sh*(1-rear),7,sh*rear);
    if(dslr){ const ang= stage===0?p: stage>=1&&stage<=3?1: stage===4?1-p:0; const mx=125,my=73, a=Math.PI/4*(1-ang)+0.0; // 45° down -> flat up
      const yy=my-ang*42; c.strokeStyle='#e6e6e6'; c.lineWidth=3; c.beginPath(); c.moveTo(mx-24*Math.cos(a),yy+24*Math.sin(a)); c.lineTo(mx+24*Math.cos(a),yy-24*Math.sin(a)); c.stroke(); }
    c.font='600 12px system-ui,sans-serif'; c.fillStyle='#aab'; c.textAlign='left';
    c.fillText('f/'+APERTURE_LABELS[ST.ai],28,128); c.fillText('sensor',180,128); c.fillText(dslr?'DSLR':'Mirrorless',6,16);
    c.fillStyle='#fff'; c.textAlign='right'; c.fillText(['stop down','front curtain','exposing '+SHUTTER_LABELS[ST.ti],'rear curtain','reset',''][Math.min(stage,5)],W-6,16);
    if(s<total) requestAnimationFrame(go); else cv.classList.remove('show'); };
  requestAnimationFrame(go); }
