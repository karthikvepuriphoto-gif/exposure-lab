// Exposure Lab - app state, simulation and UI
'use strict';
const $ = (s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const ST = { scene:'street', mode:'M', ti:42, ai:15, qi:0, ec:0, full:false, focal:35, keepSize:false, af:'AF-S', mf:8, focusPt:[0.5,0.62], afLayer:'cyclist', focusS:7,
  peaking:false, wb:'Auto', K:5500, meter:'matrix', flash:false, fec:-1, hss:false, nd:0, is:true, tripod:false, drive:'single', raw:false, recover:0, grid:true, warn:'off', hist:true };
const WB_PRESETS = {Auto:null, Daylight:5500, Cloudy:6500, Shade:7500, Tungsten:3200, Fluorescent:4000, Flash:5500, Kelvin:'K'};
const G = { layers:[], canvases:[], alpha:[], gain:1, meterMap:null, time:0, last:performance.now(), seed:0, dirty:true, frame:null, hist:null, clamped:false, built:'' };
const SC = ()=>SCENES[ST.scene];
let R; // renderer

// ---------- scene build ----------
function retreat(){ const sc=SC(); const sub=sc.layers.find(l=>l.subject); return ST.keepSize ? sub.d*(ST.focal/sc.focal-1) : 0; }
function horizonUp(){ return 0.5 + (SC().tilt||0)*ST.focal/SENSOR_H; }
function buildScene(){
  const sc=SC(), f=ST.focal, b=retreat(); VIEW.b=b; VIEW.tilt=sc.tilt||0; VIEW.k=TEXW*f/SENSOR_W;
  const order=[...sc.layers].sort((a,c)=>(a.ground?-1:c.ground?1:c.d-a.d));
  G.layers=order; G.canvases=order.map(l=>{ const c=document.createElement('canvas'); c.width=TEXW; c.height=TEXH; const ctx=c.getContext('2d',{willReadFrequently:true});
    if(l.ground) l.draw(ctx,f); else { const k=TEXW*f/(SENSOR_W*(l.d+b)); ctx.setTransform(k,0,0,k,TEXW/2,TEXH/2-VIEW.k*VIEW.tilt); l.draw(ctx); }
    return c; });
  G.alpha=G.canvases.map(c=>{ const d=c.getContext('2d').getImageData(0,0,TEXW,TEXH).data; const a=new Uint8Array(TEXW*TEXH); for(let i=0;i<a.length;i++) a[i]=d[i*4+3]; return a; });
  // light meter map (64x40), linear luminance with the same highlight boost as the shader
  const m=document.createElement('canvas'); m.width=64; m.height=40; const mc=m.getContext('2d'); G.canvases.forEach(c=>mc.drawImage(c,0,0,64,40));
  const d=mc.getImageData(0,0,64,40).data, L=new Float32Array(64*40);
  for(let i=0;i<L.length;i++){ const r=Math.pow(d[i*4]/255,2.2),g=Math.pow(d[i*4+1]/255,2.2),bb=Math.pow(d[i*4+2]/255,2.2); const mx=Math.max(r,g,bb); const sm=Math.min(1,Math.max(0,(mx-0.82)/0.18)); L[i]=(0.2126*r+0.7152*g+0.0722*bb)*(1+10*sm*sm*(3-2*sm)); }
  G.meterMap=L; G.m0=meterAvg('matrix'); G.gain=0.18*(SC().key||1)/G.m0;
  R.setLayers(G.canvases); G.built=ST.scene+'|'+f+'|'+b; G.dirty=true;
}
function meterAvg(mode){ const L=G.meterMap; let s=0,w=0; const [fx,fy]=ST.focusPt;
  for(let y=0;y<40;y++) for(let x=0;x<64;x++){ const u=(x+0.5)/64, v=(y+0.5)/40; let wt=1;
    if(mode==='center'){ const dx=u-0.5, dy=(v-0.5)*0.625; wt=Math.exp(-(dx*dx+dy*dy)/(2*0.18*0.18)); }
    else if(mode==='spot'){ const dx=u-fx, dy=(v-fy)*0.625; wt=(dx*dx+dy*dy)<0.035*0.035?1:0; }
    else if(mode==='matrix'){ wt=0.6+0.4*Math.exp(-((u-0.5)**2+((v-0.5)*0.625)**2)/0.08); }
    s+=Math.log2(Math.max(L[y*64+x],1e-4))*wt; w+=wt; }
  if(w===0){ return meterAvg('center'); } return Math.pow(2,s/w); }

// ---------- layer motion & focus ----------
function layerState(l,time){ const sc=SC(), f=ST.focal, b=retreat(); let d=l.d||0; if(l.dist) d=l.d+l.dist.amp*Math.sin(time*l.dist.rate);
  const deff=d+b, scale=l.ground?1:(l.d+b)/deff; let off=[0,0], vpx=[0,0];
  if(l.move){ const vuv=l.move.v*f/(deff*SENSOR_W); const span=l.move.span; let p=((time*vuv+span/2)%span+span)%span-span/2; off=[p,0]; vpx=[l.move.v*f/deff*TEXW/SENSOR_W,0]; }
  if(l.flow){ vpx=[0,-l.flow.v*f/deff*TEXW/SENSOR_W]; }
  return {deff,scale,off,vpx}; }
function pickAt(u,vy,time){ const hc=1-horizonUp(); const idx=G.layers.map((l,i)=>i).reverse();
  for(const i of idx){ const l=G.layers[i]; if(l.ground) continue; const ls=layerState(l,time);
    const cx=Math.round(((u-0.5-ls.off[0])/ls.scale+0.5)*TEXW), cy=Math.round(((vy-hc)/ls.scale+hc)*TEXH);
    if(cx>=0&&cy>=0&&cx<TEXW&&cy<TEXH&&G.alpha[i][cy*TEXW+cx]>80) return {id:l.id,d:ls.deff}; }
  const ang=(vy-hc)*SENSOR_H/ST.focal; return {id:'ground',d:ang>0.002?Math.min(1000,1.6/ang):1000,gy:vy}; }
function targetDist(time){ if(ST.afLayer==='ground'){ const hc=1-horizonUp(); const ang=(ST.focusPt[1]-hc)*SENSOR_H/ST.focal; return ang>0.002?Math.min(1000,1.6/ang):1000; }
  const l=G.layers.find(x=>x.id===ST.afLayer); return l?layerState(l,time).deff:10; }

// ---------- exposure & auto modes ----------
function evSet(){ const N=nOf(ST.ai), t=tOf(ST.ti), iso=isoOf(ST.qi); return Math.log2(N*N/t)-Math.log2(iso/100)+ST.nd; }
function meterReading(){ return SC().ev + Math.log2(meterAvg(ST.meter)/G.m0) - evSet(); }
function snap(i){ return ST.full? Math.round(i/3)*3 : Math.round(i); }
function autoExpose(){ if(ST.mode==='M') return; const sc=SC(); const target=sc.ev+Math.log2(meterAvg(ST.meter)/G.m0)-ST.ec/3; let clamped=false;
  const solve=()=>{ const X=target+ST.qi/3-ST.nd; // X = log2(N^2/t)
    if(ST.mode==='Av'){ let i=snap(3*X+12-ST.ai); if(i<0||i>54) clamped=true; ST.ti=Math.max(0,Math.min(54,i)); }
    else if(ST.mode==='Tv'){ let j=snap(3*X+12-ST.ti); if(j<0||j>24) clamped=true; ST.ai=Math.max(0,Math.min(24,j)); }
    else { const aN=Math.max(1,Math.min(9,1+(X-6)*0.5)); ST.ai=Math.max(0,Math.min(24,snap(3*aN-3))); let i=snap(3*X+12-ST.ai); if(i<0||i>54) clamped=true; ST.ti=Math.max(0,Math.min(54,i)); } };
  clamped=false; if(ST.mode==='Auto'){ ST.qi=0; for(let k=0;k<19;k++){ clamped=false; solve(); const lim=ST.tripod?30:1/Math.max(60,ST.focal*(ST.is?0.5:1)); if(tOf(ST.ti)<=lim*1.01||ST.qi>=18) break; ST.qi+=ST.full?3:1; } }
  else solve(); G.clamped=clamped; }

// ---------- per-frame physics ----------
function computeFrame(time){
  const sc=SC(), f=ST.focal, N=nOf(ST.ai), t=tOf(ST.ti), iso=isoOf(ST.qi), b=retreat();
  const ev=evSet(); const base=Math.pow(2,sc.ev-ev)*G.gain;
  const s = ST.af==='MF'? ST.mf : ST.focusS;
  const shake = ST.tripod?0: PHYS.shakeRate*(ST.is?Math.pow(2,-PHYS.isStops):1)*f*TEXW/SENSOR_W*t;
  const sdir=[0.8,0.6], diff=diffractionPx(N);
  const sub=G.layers.find(l=>l.subject); const subD=layerState(sub,time).deff;
  let flashSub=0, syncBand=-1; const fast=t<PHYS.syncSpeed*0.99;
  if(ST.flash){ let maxT=Math.pow(PHYS.GN*Math.sqrt(iso/100)/(N*subD),2); if(fast&&ST.hss) maxT*=0.25*PHYS.syncSpeed/t; flashSub=Math.min(Math.pow(2,ST.fec),maxT); if(fast&&!ST.hss) syncBand=1-t/PHYS.syncSpeed; }
  const A=f/N, cocK=A*f/Math.max(1e-3,s*1000-f);
  const layers=G.layers.map(l=>{ const ls=layerState(l,time); let coc=l.ground?0:cocPx(f,N,s,ls.deff); coc=Math.sqrt(coc*coc+diff*diff);
    const mot=[ls.vpx[0]*t+sdir[0]*shake, ls.vpx[1]*t+sdir[1]*shake];
    const fl= l.ground? flashSub*Math.pow(subD/12,2)*0.5 : flashSub*Math.pow(subD/ls.deff,2);
    return {id:l.id,ground:!!l.ground,off:[ls.off[0],0],scale:ls.scale,coc,mot,expo:base*(l.shade||1),flash:fl,deff:ls.deff,subjectMove:Math.hypot(ls.vpx[0],ls.vpx[1])*t}; });
  let setK = ST.wb==='Auto' ? (sc.K<4200? sc.K+600 : sc.K) : ST.wb==='Kelvin'? ST.K : WB_PRESETS[ST.wb];
  if(ST.flash && ST.wb==='Auto') setK=(setK+5500)/2;
  const roundness = N<=2.0?1: N>=8?0.35: 1-(Math.log2(N)-1)/2*0.65;
  return { f,N,t,iso,s,b,ev,base,shake,diff,cocK,layers,syncBand, horizon:horizonUp(), blades:7, roundness, wb:wbGains(sc.K,setK), setK,
    raw:ST.raw, recover:ST.recover, zebra: ST.warn==='zebra'?1: (ST.warn==='blink' && Math.floor(performance.now()/350)%2?2:0), peaking:ST.peaking&&ST.af==='MF',
    seed:(G.seed=(G.seed+1)%997)*0.37, meter:meterReading(), subD, flashSub };
}
function metrics(fr){ const sub=fr.layers.find(l=>G.layers.find(x=>x.id===l.id).subject); const bgs=fr.layers.filter(l=>!l.ground&&l!==sub&&l.deff>sub.deff);
  const bgBlur=bgs.length?Math.max(...bgs.map(l=>l.coc)):0; const fgs=fr.layers.filter(l=>!l.ground&&l.deff<sub.deff);
  const allBlur=Math.max(...fr.layers.filter(l=>!l.ground).map(l=>l.coc), fr.cocK*fr.f/1.6*0 );
  const subMot=Math.hypot(sub.mot[0]-0.8*fr.shake, sub.mot[1]-0.6*fr.shake);
  const subjExp=Math.log2((sub.expo+sub.flash)/1);
  return { subBlur:sub.coc, subMot, bgBlur, fgBlur:fgs.length?Math.max(...fgs.map(l=>l.coc)):0, maxBlur:allBlur, shake:fr.shake, expErr:SC().ev-fr.ev, subjExp,
    noise:Math.sqrt(0.18*0.00015*fr.iso/100)/0.18*100, subD:fr.subD, subId:sub.id }; }

// ---------- render loop ----------
function needsAnim(){ return SC().layers.some(l=>l.move||l.dist) || ST.af==='AF-C' || ST.warn==='blink' || true; }
function sizeCanvas(){ const cv=$('#gl'); const r=cv.getBoundingClientRect(); const dpr=Math.min(window.devicePixelRatio||1, 1.5);
  let w=Math.round(r.width*dpr); w=Math.min(w,1280); w=Math.max(w,320); const h=Math.round(w*TEXH/TEXW); R.ensure(w,h); const ov=$('#ov'); ov.width=w; ov.height=h; G.dirty=true; }
let histT=0, lastHud='';
function tick(now){
  const dt=Math.min(0.1,(now-G.last)/1000); G.last=now; if(!G.paused) G.time+=dt;
  if(G.built!==ST.scene+'|'+ST.focal+'|'+retreat()) buildScene();
  if(ST.af==='AF-C'){ const tg=targetDist(G.time); ST.focusS+= (tg-ST.focusS)*Math.min(1,dt*6); }
  if(ST.mode!=='M') autoExpose();
  const fr=computeFrame(G.time); G.frame=fr; R.draw(fr);
  if(ST.hist && now-histT>180){ histT=now; G.hist=R.histogram(); drawHist(); }
  drawOverlay(fr); hud(fr);
  requestAnimationFrame(tick);
}

// ---------- overlay / HUD ----------
function drawOverlay(fr){ const ov=$('#ov'), c=ov.getContext('2d'), w=ov.width, h=ov.height; c.clearRect(0,0,w,h);
  if(ST.grid){ c.strokeStyle='rgba(255,255,255,.35)'; c.lineWidth=1; c.beginPath(); for(const k of [1,2]){ c.moveTo(w*k/3,0); c.lineTo(w*k/3,h); c.moveTo(0,h*k/3); c.lineTo(w,h*k/3);} c.stroke(); }
  if(fr.syncBand>0){ c.fillStyle='rgba(0,0,0,0)'; }
  const [fx,fy]=ST.focusPt; const bx=fx*w, by=fy*h, s=Math.max(18,w*0.035);
  const tgt=ST.af==='MF'?null:targetDist(G.time); const inF = ST.af==='MF' ? null : Math.abs(cocPx(fr.f,fr.N,fr.s,tgt))<1.6;
  c.strokeStyle= ST.af==='MF' ? 'rgba(255,255,255,.6)' : inF?'#45e07a':'#ffcc33'; c.lineWidth=2;
  const L=s*0.35; for(const [sx,sy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ c.beginPath(); c.moveTo(bx+sx*s,by+sy*s-sy*L); c.lineTo(bx+sx*s,by+sy*s); c.lineTo(bx+sx*s-sx*L,by+sy*s); c.stroke(); }
  if(ST.meter==='spot'){ c.beginPath(); c.arc(bx,by,w*0.035,0,7); c.strokeStyle='rgba(255,255,255,.5)'; c.stroke(); }
  if(ST.meter==='center'){ c.beginPath(); c.arc(w/2,h/2,w*0.18,0,7); c.strokeStyle='rgba(255,255,255,.25)'; c.setLineDash([6,6]); c.stroke(); c.setLineDash([]); }
}
function drawHist(){ const cv=$('#hist'); if(!cv||!G.hist) return; const c=cv.getContext('2d'), w=cv.width, h=cv.height, H=G.hist; c.clearRect(0,0,w,h); c.fillStyle='rgba(0,0,0,.55)'; c.fillRect(0,0,w,h);
  let mx=1; for(const k of ['r','g','b']) for(let i=1;i<63;i++) mx=Math.max(mx,H[k][i]);
  c.globalCompositeOperation='lighter'; for(const [k,col] of [['r','rgba(255,60,60,.7)'],['g','rgba(60,255,90,.7)'],['b','rgba(70,120,255,.8)']]){ c.fillStyle=col; c.beginPath(); c.moveTo(0,h);
    for(let i=0;i<64;i++){ c.lineTo(i/63*w, h-Math.min(1,H[k][i]/mx)*(h-4)); } c.lineTo(w,h); c.fill(); }
  c.globalCompositeOperation='source-over'; c.strokeStyle='rgba(255,255,255,.2)'; for(const k of [1,2,3,4]){ c.beginPath(); c.moveTo(w*k/5,0); c.lineTo(w*k/5,h); c.stroke(); }
  if(H.clipHi>0.01){ c.fillStyle='#ff4d4d'; c.fillRect(w-6,0,6,h); } if(H.clipLo>0.01){ c.fillStyle='#4d7dff'; c.fillRect(0,0,6,h); }
  $('#histNote').textContent = (H.clipHi>0.01?`${Math.round(H.clipHi*100)}% clipped highlights `:'')+(H.clipLo>0.01?`${Math.round(H.clipLo*100)}% crushed shadows`:'');
}
function hud(fr){ const m=fr.meter; const ec=ST.mode==='M'?m:ST.ec/3;
  const key=[ST.mode,ST.ti,ST.ai,ST.qi,ST.ec,ST.focal,ST.wb,ST.K,ST.nd,ST.flash,Math.round(m*3),G.clamped,ST.af,ST.meter,ST.drive,ST.raw].join();
  const met=metrics(fr); $('#phys').innerHTML = `Subject blur <b>${met.subMot.toFixed(1)}px</b> · Focus blur <b>${met.subBlur.toFixed(1)}px</b> · Background blur <b>${met.bgBlur.toFixed(0)}px</b> · Shake <b>${fr.shake.toFixed(1)}px</b> · Focus <b>${fmtDist(fr.s)}</b>`;
  if(key===lastHud) return; lastHud=key;
  $('#iMode').textContent=ST.mode; $('#iT').textContent=SHUTTER_LABELS[ST.ti]; $('#iN').textContent='f/'+APERTURE_LABELS[ST.ai]; $('#iISO').textContent='ISO '+ISO_LABELS[ST.qi]+(ST.mode==='Auto'?' (auto)':'');
  $('#iF').textContent=ST.focal+'mm'; $('#iWB').textContent='WB '+(ST.wb==='Kelvin'?ST.K+'K':ST.wb); $('#iExtra').textContent=[ST.nd?'ND'+(ST.nd===3?'8':ST.nd===6?'64':'1000'):'',ST.flash?'⚡':'',ST.raw?'RAW':'JPEG',ST.drive==='burst'?'▶▶':''].filter(Boolean).join(' ');
  // meter scale
  const sc=$('#meterScale'); const pos=Math.max(-3.2,Math.min(3.2,ST.mode==='M'?m:ST.ec/3)); $('#meterNeedle').style.left=(50+pos/3.4*50)+'%';
  $('#meterNeedle').classList.toggle('over', Math.abs(ST.mode==='M'?m:0)>3 || G.clamped); sc.title='Meter: '+fmtStops(Math.round(m*3)/3,true)+' EV';
  $('#meterVal').textContent=(ST.mode==='M'? fmtStops(Math.round(m*3)/3,true)+' EV' : 'EC '+fmtStops(ST.ec/3,true)) + (G.clamped?' ⚠ out of range':'');
  $('#iT').classList.toggle('blink',G.clamped&&ST.mode!=='Tv'); $('#iN').classList.toggle('blink',G.clamped&&ST.mode==='Tv');
  syncDials();
}
function fmtDist(d){ return d>=999?'∞': d<1? Math.round(d*100)+'cm' : d<10? d.toFixed(1)+'m' : Math.round(d)+'m'; }
