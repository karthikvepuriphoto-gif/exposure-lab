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

// ---------- Dial ----------
class Dial {
  constructor(host,o){ this.o=o; this.labels=o.labels; this.value=o.value; this.host=host; this.disabled=false;
    host.innerHTML=`<div class="dial-title">${o.title}</div><canvas class="dial-c" tabindex="0" role="slider" aria-label="${o.title}"></canvas><div class="dial-val"></div>`;
    this.cv=$('canvas',host); this.vl=$('.dial-val',host); this.acc=0; this.spacing=o.spacing||20; this.anim=0;
    const cv=this.cv; let drag=null;
    cv.addEventListener('pointerdown',e=>{ ac(); cv.setPointerCapture(e.pointerId); const r=cv.getBoundingClientRect(); drag={cx:r.left+r.width/2,cy:r.top+r.height/2,a:null,x:e.clientX,y:e.clientY}; drag.a=this.ang(e,drag); e.preventDefault(); });
    cv.addEventListener('pointermove',e=>{ if(!drag) return; const a=this.ang(e,drag); let da;
      const dist=Math.hypot(e.clientX-drag.cx,e.clientY-drag.cy), r=cv.getBoundingClientRect().width/2;
      if(dist<r*0.25){ da=(e.clientX-drag.x)*0.9; } else { da=a-drag.a; if(da>180) da-=360; if(da<-180) da+=360; }
      drag.a=a; drag.x=e.clientX; drag.y=e.clientY; this.spin(da); e.preventDefault(); });
    const end=e=>{ if(drag){ drag=null; this.acc=0; this.draw(); } }; cv.addEventListener('pointerup',end); cv.addEventListener('pointercancel',end);
    let wacc=0; cv.addEventListener('wheel',e=>{ e.preventDefault(); wacc+=(Math.abs(e.deltaY)>Math.abs(e.deltaX)?e.deltaY:e.deltaX); while(Math.abs(wacc)>=40){ this.step(wacc>0?1:-1); wacc-=Math.sign(wacc)*40; } },{passive:false});
    cv.addEventListener('keydown',e=>{ if(['ArrowRight','ArrowUp'].includes(e.key)){this.step(1);e.preventDefault();} if(['ArrowLeft','ArrowDown'].includes(e.key)){this.step(-1);e.preventDefault();} });
    new ResizeObserver(()=>this.draw()).observe(cv); this.draw(); }
  ang(e,d){ return Math.atan2(e.clientY-d.cy,e.clientX-d.cx)*180/Math.PI; }
  spin(da){ if(this.disabled){ this.blocked(); return; } this.acc+=da; const sp=this.spacing*(this.o.stepSize?this.o.stepSize():1);
    while(this.acc>=sp){ this.acc-=sp; this.step(1,true); } while(this.acc<=-sp){ this.acc+=sp; this.step(-1,true); } this.draw(); }
  step(dir,fromDrag){ if(this.disabled){ this.blocked(); return; } const k=this.o.stepSize?this.o.stepSize():1; let v=this.value+dir*k; if(this.o.snap) v=this.o.snap(v);
    v=Math.max(0,Math.min(this.labels.length-1,v)); if(v!==this.value){ this.value=v; tickSound(); this.o.onChange(v); } else if(!fromDrag) {} this.draw(); }
  blocked(){ if(this.o.blockedMsg) toast(this.o.blockedMsg()); }
  set(v){ if(v===this.value) return; this.value=v; this.draw(); }
  draw(){ const cv=this.cv, r=cv.getBoundingClientRect(); if(!r.width) return; const dpr=Math.min(2,window.devicePixelRatio||1); const W=Math.round(r.width*dpr);
    if(cv.width!==W){ cv.width=W; cv.height=W; } const c=cv.getContext('2d'); c.setTransform(dpr,0,0,dpr,0,0); const s=r.width, R0=s/2;
    c.clearRect(0,0,s,s); c.save(); c.translate(R0,R0);
    const g=c.createRadialGradient(-R0*0.3,-R0*0.4,R0*0.1,0,0,R0); g.addColorStop(0,'#4a4d55'); g.addColorStop(1,'#16171b'); c.fillStyle=g; c.beginPath(); c.arc(0,0,R0-2,0,7); c.fill();
    const rot=-(this.acc/ (this.spacing*(this.o.stepSize?this.o.stepSize():1)))*this.spacing; // live feedback
    c.save(); c.rotate(rot*Math.PI/180);
    for(let a=0;a<360;a+=6){ c.rotate(6*Math.PI/180); c.fillStyle='rgba(255,255,255,.12)'; c.fillRect(-1,-R0+3,2,6); }
    c.restore();
    c.font=`600 ${Math.max(10,s*0.105)}px system-ui, sans-serif`; c.textAlign='center'; c.textBaseline='middle';
    const step=this.o.stepSize?this.o.stepSize():1;
    for(let k=-4;k<=4;k++){ const i=this.value+k*step; if(i<0||i>=this.labels.length) continue; const a=(k*this.spacing*1.6 - rot*0)*Math.PI/180 - Math.PI/2 + (this.acc/(this.spacing*step))*this.spacing*1.6*Math.PI/180*-1*-1*0;
      const rad=R0*0.66; c.save(); c.rotate(a+Math.PI/2); c.translate(0,-rad); c.fillStyle= k===0? (this.disabled?'#9ab':'#fff') : 'rgba(255,255,255,'+(0.55-Math.abs(k)*0.1)+')'; c.fillText(this.labels[i],0,0); c.restore(); }
    c.fillStyle=this.disabled?'#7a8a99':'#ff5a36'; c.beginPath(); c.moveTo(-6,-R0+1); c.lineTo(6,-R0+1); c.lineTo(0,-R0+10); c.fill();
    c.beginPath(); c.arc(0,0,R0*0.3,0,7); c.fillStyle='#0d0e11'; c.fill(); c.strokeStyle='rgba(255,255,255,.08)'; c.stroke(); c.restore();
    this.vl.textContent=(this.o.prefix||'')+this.labels[this.value]+(this.o.suffix||''); cv.setAttribute('aria-valuetext',this.vl.textContent);
    this.host.classList.toggle('auto',this.disabled); }
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
    if(!L.length) return; const html=L.join('<br>'); $('#changed').innerHTML='<b>What changed</b><br>'+html; $('#changed').classList.add('show'); clearTimeout(whatChanged.h); whatChanged.h=setTimeout(()=>$('#changed').classList.remove('show'),6000);
    const lc=$('#lessonChanged'); if(lc) lc.innerHTML=html; },350); }
function fov(f){ return Math.round(2*Math.atan(36/(2*f))*180/Math.PI); }

// ---------- dials ----------
let D={};
function dialBlocked(name){ return ()=>`${name} is set by the camera in <b>${ST.mode}</b> mode. Switch the mode dial to ${name==='Shutter'?'Tv/S or M':name==='Aperture'?'Av/A or M':'M, Av or Tv'} to control it.`; }
function makeDials(){
  const stepSize=()=>ST.full?3:1, snapF=v=>ST.full?Math.round(v/3)*3:v;
  D.mode=new Dial($('#dMode'),{title:'Mode',labels:['Auto','P','Tv/S','Av/A','M'],value:4,spacing:24,onChange:v=>{ ST.mode=['Auto','P','Tv','Av','M'][v]; if(ST.mode==='Auto'){ST.flash=false;} afterChange('mode'); }});
  D.t=new Dial($('#dT'),{title:'Shutter',labels:SHUTTER_LABELS,value:ST.ti,spacing:26,stepSize,snap:snapF,blockedMsg:dialBlocked('Shutter'),onChange:v=>{ST.ti=v;afterChange('t');}});
  D.a=new Dial($('#dA'),{title:'Aperture',labels:APERTURE_LABELS,value:ST.ai,prefix:'f/',stepSize,snap:snapF,blockedMsg:dialBlocked('Aperture'),onChange:v=>{ST.ai=v;afterChange('a');}});
  D.q=new Dial($('#dQ'),{title:'ISO',labels:ISO_LABELS,value:ST.qi,spacing:24,stepSize,snap:snapF,blockedMsg:dialBlocked('ISO'),onChange:v=>{ST.qi=v;afterChange('q');}});
  D.ec=new Dial($('#dEC'),{title:'Exp. comp',labels:EC_LABELS,value:ST.ec+9,suffix:' EV',blockedMsg:()=>'Exposure compensation works in P, Tv, Av and Auto. In M you set exposure yourself (watch the meter).',onChange:v=>{ST.ec=v-9;afterChange('ec');}});
}
function syncDials(){ if(!D.t) return; D.t.set(ST.ti); D.a.set(ST.ai); D.q.set(ST.qi); D.ec.set(ST.ec+9); D.mode.set(['Auto','P','Tv','Av','M'].indexOf(ST.mode));
  const m=ST.mode; const dis={t:m==='Av'||m==='P'||m==='Auto', a:m==='Tv'||m==='P'||m==='Auto', q:m==='Auto', ec:m==='M'};
  for(const k in dis){ if(D[k].disabled!==dis[k]){ D[k].disabled=dis[k]; D[k].draw(); } } }
function afterChange(kind){ if(ST.mode!=='M') autoExpose(); syncDials(); syncControls(); whatChanged(kind); lessonCheck(); save(); }

// ---------- control panel ----------
function seg(host,key,opts,cb){ const el=$(host); el.innerHTML=opts.map(o=>`<button data-v="${o[0]}">${o[1]}</button>`).join('');
  el.onclick=e=>{ const b=e.target.closest('button'); if(!b) return; let v=b.dataset.v; if(v==='true')v=true; else if(v==='false')v=false; else if(!isNaN(+v)&&v!=='') v=+v; ST[key]=v; tickSound(); if(cb) cb(v); afterChange(key); }; }
function syncControls(){ $$('.seg').forEach(el=>{ const key=el.dataset.key; $$('button',el).forEach(b=>{ let v=b.dataset.v; b.classList.toggle('on', String(ST[key])===v); }); });
  $('#focal').value=Math.round(Math.log(ST.focal/14)/Math.log(200/14)*1000); $('#focalV').textContent=ST.focal+'mm · '+fov(ST.focal)+'° wide';
  $('#mf').value=Math.round(Math.log(ST.mf/0.3)/Math.log(1000/0.3)*1000); $('#mfV').textContent=fmtDist(ST.mf); $('#mfRow').style.display=ST.af==='MF'?'':'none';
  $('#kel').value=ST.K; $('#kelV').textContent=ST.K+'K'; $('#kelRow').style.display=ST.wb==='Kelvin'?'':'none';
  $('#fec').value=ST.fec*3; $('#fecV').textContent=fmtStops(ST.fec,true)+' EV'; $('#flashRow').style.display=ST.flash?'':'none';
  $('#rec').value=ST.recover*3; $('#recV').textContent=fmtStops(ST.recover,true)+' EV';
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
  seg('#segPeak','peaking',[[false,'Peaking off'],[true,'Peaking on']]); seg('#segHist','hist',[[true,'Histogram'],[false,'Hide']],v=>$('#histBox').style.display=v?'':'none');
  $('#focal').oninput=e=>{ const f=Math.round(14*Math.pow(200/14,e.target.value/1000)); if(f!==ST.focal){ ST.focal=f; tickSound(); if(ST.af!=='MF') ST.focusS=targetDist(G.time); afterChange('focal'); } };
  $$('#focalChips button').forEach(b=>b.onclick=()=>{ ST.focal=+b.dataset.f; if(ST.af!=='MF') ST.focusS=targetDist(G.time); tickSound(); afterChange('focal'); });
  $('#keep').onchange=e=>{ ST.keepSize=e.target.checked; afterChange('focal'); };
  $('#mf').oninput=e=>{ ST.mf=+(0.3*Math.pow(1000/0.3,e.target.value/1000)).toFixed(2); tickSound(); afterChange('mf'); };
  $('#kel').oninput=e=>{ ST.K=+e.target.value; afterChange('K'); };
  $('#fec').oninput=e=>{ ST.fec=e.target.value/3; afterChange('fec'); };
  $('#rec').oninput=e=>{ ST.recover=e.target.value/3; afterChange('rec'); };
  $$('.ptabs button').forEach(b=>b.onclick=()=>{ $$('.ptabs button').forEach(x=>x.classList.toggle('on',x===b)); $$('.pane').forEach(p=>p.classList.toggle('on',p.id===b.dataset.p)); });
  // viewfinder tap = focus point
  $('#ov').addEventListener('pointerdown',e=>{ ac(); const r=e.target.getBoundingClientRect(); const u=(e.clientX-r.left)/r.width, v=(e.clientY-r.top)/r.height; ST.focusPt=[u,v];
    const p=pickAt(u,v,G.time); ST.afLayer=p.id; if(ST.af!=='MF'){ ST.focusS=p.d; toast(`Focus: ${p.id==='ground'?'ground':p.id} at ${fmtDist(p.d)}`,1400); } tickSound(); afterChange('focus'); });
  $('#shutter').onclick=takePhoto; document.addEventListener('keydown',e=>{ if(e.code==='Space'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)&&!document.activeElement.classList.contains('dial-c')){ e.preventDefault(); takePhoto(); } });
  $('#sfx').onclick=()=>{ sfxOn=!sfxOn; $('#sfx').textContent=sfxOn?'🔊':'🔇'; };
}
function setScene(k,keepLens){ ST.scene=k; const sc=SCENES[k]; if(!keepLens){ ST.focal=sc.focal; ST.keepSize=false; } ST.afLayer=sc.focus;
  const sub=sc.layers.find(l=>l.id===sc.focus); ST.focusPt=[0.5,0.55]; buildScene(); ST.focusS=targetDist(G.time); ST.mf=ST.focusS;
  if(ST.wb==='Kelvin') {} afterChange('scene'); }

// ---------- photos & roll ----------
let ROLL=[]; try{ ROLL=JSON.parse(localStorage.getItem('el_roll')||'[]'); }catch(e){ ROLL=[]; }
function capture(time){ const fr=computeFrame(time); R.draw(fr); const c=document.createElement('canvas'); c.width=640; c.height=400; c.getContext('2d').drawImage($('#gl'),0,0,640,400);
  return { img:c.toDataURL('image/jpeg',0.72), fr, m:metrics(fr) }; }
function shotInfo(fr){ return {mode:ST.mode,t:SHUTTER_LABELS[ST.ti],N:APERTURE_LABELS[ST.ai],iso:ISO_LABELS[ST.qi],f:ST.focal,ev:ST.mode==='M'?Math.round(fr.meter*3)/3:ST.ec/3,wb:ST.wb==='Kelvin'?ST.K+'K':ST.wb,nd:ST.nd,flash:ST.flash,raw:ST.raw,scene:SC().name,af:ST.af,meter:ST.meter,focus:fmtDist(fr.s),time:new Date().toLocaleString()}; }
function takePhoto(){ ac(); const t=tOf(ST.ti); shutterSound(t); const vf=$('#vf'); vf.classList.add('flashing'); setTimeout(()=>vf.classList.remove('flashing'),Math.min(900,120+t*300));
  const shots=[]; const n=ST.drive==='burst'?8:1; for(let i=0;i<n;i++){ const s=capture(G.time+i*0.1); s.info=shotInfo(s.fr); shots.push(s); }
  if(n>1){ let k=1; const iv=setInterval(()=>{ if(k++>=n) return clearInterval(iv); shutterSound(Math.min(t,0.05)); },100); }
  const burstId=n>1?Date.now():0; for(const s of shots) ROLL.unshift({img:s.img,info:s.info,burst:burstId,m:{subMot:+s.m.subMot.toFixed(1),subBlur:+s.m.subBlur.toFixed(1),bgBlur:+s.m.bgBlur.toFixed(0),shake:+s.m.shake.toFixed(1)}});
  ROLL=ROLL.slice(0,48); try{ localStorage.setItem('el_roll',JSON.stringify(ROLL)); }catch(e){ ROLL=ROLL.slice(0,16); try{localStorage.setItem('el_roll',JSON.stringify(ROLL));}catch(e2){} }
  $('#rollCount').textContent=ROLL.length; $('#lastShot').src=shots[0].img; $('#lastShot').style.display='';
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
