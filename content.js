// Exposure Lab - lessons, challenges, quiz, cheat sheet, navigation
'use strict';
const T = s=>SHUTTER_LABELS.indexOf(s), A = s=>APERTURE_LABELS.indexOf(s), I = s=>ISO_LABELS.indexOf(s);
const fm=()=>G.frame?metrics(G.frame):null;
const LESSONS = [
 {id:'triangle', title:'The exposure triangle', scene:'street', setup:{mode:'M',ti:T('1/250'),ai:A('11'),qi:I('100'),nd:0,flash:false,tripod:false,is:true},
  text:`Exposure is how much light makes your photo. Three settings control it, and each one is measured in <b>stops</b>. One stop = double or half the light.<ul><li><b>Shutter speed</b>: how long the sensor sees light. 1/250 → 1/125 is +1 stop.</li><li><b>Aperture</b> (f-number): how big the lens opening is. f/8 → f/5.6 is +1 stop. Smaller number = bigger hole.</li><li><b>ISO</b>: how much the signal is amplified. 100 → 200 is +1 stop.</li></ul>Change one by a stop, change another by a stop the other way, and the brightness stays the same. What changes is the <i>look</i>: motion blur, background blur and noise.`,
  widget:'triangle',
  steps:[{t:'Turn the Shutter dial to 1/1000 (2 stops less light). The photo gets darker and the meter needle moves left.',ok:()=>ST.ti===T('1/1000')},
         {t:'Now turn Aperture to f/5.6 (2 stops more light). Brightness is back, but the background got softer.',ok:()=>ST.ti===T('1/1000')&&ST.ai===A('5.6')},
         {t:'Try the "Equivalent exposure" buttons below to trade stops instantly.',ok:()=>lessonFlag.eq}]},
 {id:'shutter', title:'Shutter speed: freeze or blur motion', scene:'street', setup:{mode:'M',ti:T('1/125'),ai:A('16'),qi:I('100'),tripod:true},
  text:`Shutter speed is the time the sensor is exposed. Moving things travel across the frame during that time, so they smear. Blur length ≈ <b>speed on sensor × time</b>. The cyclist (5 m/s, 7 m away) moves about 13 px per 1/30s here.<br>Fast shutter (1/1000+) freezes action. Slow shutter (1/30 and slower) shows motion. Each halving of time = 1 stop less light.`,
  steps:[{t:'Set 1/1000 and raise ISO to keep the meter near 0. The cyclist freezes.',ok:()=>ST.ti>=T('1/1000')&&Math.abs(G.frame.meter)<=0.7},
         {t:'Now go to 1/15 and close the aperture (bigger f-number) to balance. The cyclist and car streak.',ok:()=>ST.ti<=T('1/15')&&Math.abs(G.frame.meter)<=1},
         {t:'Switch to Handheld in the Body tab at 1/15: the whole frame gets camera shake too.',ok:()=>!ST.tripod&&ST.ti<=T('1/15')}]},
 {id:'aperture', title:'Aperture: depth of field & bokeh', scene:'portrait', setup:{mode:'Av',ai:A('1.8'),qi:I('100'),focal:85},
  text:`The aperture is the opening inside the lens. A <b>wide aperture</b> (f/1.4–f/2.8) lets in lots of light and gives a <b>shallow depth of field</b>: only a thin slice is sharp, the background melts into bokeh. A <b>small aperture</b> (f/11–f/22) gives deep focus. Past ~f/16 everything gets slightly soft from <b>diffraction</b> (exaggerated here so it's visible on screen).<br>Background blur also grows with focal length and how close you are to the subject. Bright spots become bokeh balls shaped like the aperture blades (7 here).`,
  steps:[{t:'At f/1.8 look at the sunlit leaves behind her: big soft bokeh circles.',ok:()=>ST.ai<=A('2')},
         {t:'Turn Aperture to f/16. The background becomes recognisable; the camera (Av) slowed the shutter to keep brightness.',ok:()=>ST.ai>=A('16')},
         {t:'Stop at f/5.6: notice the bokeh balls become 7-sided as the blades close.',ok:()=>ST.ai===A('5.6')}]},
 {id:'iso', title:'ISO: brightness vs noise', scene:'night', setup:{mode:'M',ti:T('1/60'),ai:A('2.8'),qi:I('100'),wb:'Auto',tripod:false,is:true},
  text:`ISO amplifies the sensor signal. It doesn't collect more light, so higher ISO means fewer photons per pixel and more visible <b>noise</b> (grain and color speckles), especially in shadows. Modern cameras look good to ~3200–6400; 12800+ is an emergency setting.<br>At night you're balancing: slow shutter (shake/motion blur), wide aperture (thin focus), or high ISO (noise).`,
  steps:[{t:'The scene is far too dark at ISO 100. Raise ISO until the meter reads about 0.',ok:()=>Math.abs(G.frame.meter)<=0.7},
         {t:'Push ISO to 12800 and lower the shutter to compensate: see the grain and color noise?',ok:()=>ST.qi>=I('12800')},
         {t:'Tip: tap the 🔍 to look closely at the shadows.',ok:()=>lessonFlag.zoom}]},
 {id:'meter', title:'Reading the meter & histogram', scene:'portrait', setup:{mode:'M',ti:T('1/500'),ai:A('4'),qi:I('100'),warn:'zebra',hist:true},
  text:`The <b>light meter</b> (−3 … +3 under the photo) shows how your settings compare with what the camera thinks is a correct exposure. 0 = middle grey.<br>The <b>histogram</b> is a graph of brightness: shadows on the left, highlights on the right. A pile against the right wall = <b>clipped highlights</b> (pure white, no detail). Against the left wall = <b>crushed shadows</b>. Zebra stripes mark clipped areas on the photo.`,
  steps:[{t:'Make the photo 2 stops too bright (meter +2). Zebras appear and the histogram slams right.',ok:()=>G.frame.meter>=1.6},
         {t:'Now make it 2 stops dark (meter −2). The histogram bunches left.',ok:()=>G.frame.meter<=-1.6},
         {t:'Find the exposure where nothing important clips. Often that is near 0.',ok:()=>Math.abs(G.frame.meter)<=0.4}]},
 {id:'modes', title:'Shooting modes: M, Av, Tv, P, Auto', scene:'sports', setup:{mode:'Av',ai:A('4'),qi:I('400'),ec:0},
  text:`<ul><li><b>M</b> Manual: you set all three; the meter just advises.</li><li><b>Av / A</b> Aperture priority: you pick aperture (depth of field), camera picks shutter.</li><li><b>Tv / S</b> Shutter priority: you pick shutter (motion), camera picks aperture.</li><li><b>P</b> Program: camera picks both; you can still use exposure comp.</li><li><b>Auto</b>: camera picks everything, including ISO.</li></ul>Watch the greyed-out dials move by themselves when you change the one you control.`,
  steps:[{t:'In Av, turn Aperture. The Shutter dial moves by itself.',ok:()=>ST.mode==='Av'&&ST.ai!==A('4')},
         {t:'Switch the Mode dial to Tv/S and set 1/1000 to freeze the kid.',ok:()=>ST.mode==='Tv'&&ST.ti>=T('1/1000')},
         {t:'Try Auto: the camera also chooses ISO.',ok:()=>ST.mode==='Auto'}]},
 {id:'ec', title:'Exposure compensation', scene:'portrait', setup:{mode:'Av',ai:A('2.8'),qi:I('100'),ec:0,meter:'matrix'},
  text:`The meter assumes the world averages to middle grey. Bright scenes (snow, backlit sky) fool it into making the photo too dark; dark scenes come out too bright. <b>Exposure compensation</b> tells the camera "go brighter/darker than you think" in P, Av, Tv and Auto. Here the face is in shadow against a bright background, so she looks dark.`,
  steps:[{t:'Turn Exp. comp to +1. The camera slows the shutter one stop and her face brightens.',ok:()=>ST.ec>=3},
         {t:'Overdo it: +2⅓. Watch the background clip in the histogram.',ok:()=>ST.ec>=7}]},
 {id:'metering', title:'Metering modes', scene:'portrait', setup:{mode:'Av',ai:A('2.8'),qi:I('100'),ec:0,meter:'matrix'},
  text:`<b>Matrix/Evaluative</b> looks at the whole frame. <b>Center-weighted</b> favors the middle. <b>Spot</b> measures a tiny circle at your focus point; great for backlit faces or a lit stage. In auto modes, the metered area decides the exposure.`,
  steps:[{t:'Switch metering to Spot (Light tab).',ok:()=>ST.meter==='spot'},
         {t:'Tap her face in the viewfinder: the spot meters the face and the exposure corrects for it.',ok:()=>ST.meter==='spot'&&ST.afLayer==='person'},
         {t:'Now tap the bright trees: the camera darkens everything.',ok:()=>ST.meter==='spot'&&ST.afLayer==='trees'}]},
 {id:'focal', title:'Focal length, zoom & perspective', scene:'portrait', setup:{mode:'Av',ai:A('2.8'),focal:85,keepSize:false},
  text:`Focal length sets the <b>field of view</b>: 14mm sees ~104° across, 50mm ~40°, 200mm ~10°. Zooming in from the same spot only crops. Perspective (how big the background looks relative to the subject) depends on <b>where you stand</b>. Tick "Keep subject same size" to walk back as you zoom in: the background looks closer and larger, the classic telephoto "compression".`,
  steps:[{t:'Zoom from 85mm to 24mm (Lens tab).',ok:()=>ST.focal<=28},
         {t:'Tick "Keep subject same size" and go to 200mm. The trees grow behind her.',ok:()=>ST.keepSize&&ST.focal>=180},
         {t:'Then try 24mm with it ticked: you are now very close and the background shrinks away.',ok:()=>ST.keepSize&&ST.focal<=28}]},
 {id:'focus', title:'Focus: AF-S, AF-C, manual & peaking', scene:'sports', setup:{mode:'Tv',ti:T('1/1000'),qi:I('400'),af:'AF-S',focal:135},
  text:`Tap the viewfinder to choose a focus point. <b>AF-S</b> (single) focuses once and locks; great for still subjects. <b>AF-C</b> (continuous) keeps tracking a moving subject. <b>MF</b> is you turning the focus ring; <b>focus peaking</b> paints sharp edges red so you can see what's in focus.`,
  steps:[{t:'In AF-S, tap the kid. As he runs closer and farther, he drifts out of focus (box turns yellow).',ok:()=>ST.af==='AF-S'&&ST.afLayer==='kid'},
         {t:'Switch to AF-C: focus follows him.',ok:()=>ST.af==='AF-C'},
         {t:'Switch to MF, turn on peaking and slide focus distance until the goal net glows red.',ok:()=>ST.af==='MF'&&ST.peaking}]},
 {id:'wb', title:'White balance', scene:'night', setup:{mode:'M',ti:T('1/30'),ai:A('2'),qi:I('200'),wb:'Daylight'},
  text:`Light has a color. Candles and street lamps are orange (~2000–3200 K), daylight ~5500 K, shade is bluish (~7500 K). <b>White balance</b> tells the camera what color "white" is. Set it to match the light and colors look neutral; set it lower than the light and the picture turns blue, higher and it turns orange.`,
  steps:[{t:'Daylight WB under street lamps = very orange. Pick Tungsten.',ok:()=>ST.wb==='Tungsten'},
         {t:'Choose Kelvin and slide it: 2500K is icy blue, 8000K glows orange.',ok:()=>ST.wb==='Kelvin'}]},
 {id:'flash', title:'Flash: fill light & sync speed', scene:'portrait', setup:{mode:'M',ti:T('1/200'),ai:A('5.6'),qi:I('100'),flash:false,fec:-1},
  text:`Flash adds light that falls off with distance squared, so it lights a close subject but not the background. <b>Fill flash</b> (about −1 to −2 EV) lifts shadows on a backlit face. Shutter speed controls ambient light; flash is a ~1/1000s burst. Above the <b>sync speed</b> (~1/250) the second shutter curtain blocks part of the frame, causing a dark band, unless you use <b>high-speed sync</b> (which costs flash power).`,
  steps:[{t:'Turn Flash on (Light tab) and adjust flash comp until her face is bright but natural.',ok:()=>ST.flash},
         {t:'Set shutter to 1/1000 with flash on: see the dark band at the bottom?',ok:()=>ST.flash&&ST.ti>=T('1/1000')&&!ST.hss},
         {t:'Enable High-speed sync to fix it.',ok:()=>ST.flash&&ST.hss}]},
 {id:'nd', title:'ND filters for long exposures', scene:'waterfall', setup:{mode:'M',ti:T('1/125'),ai:A('8'),qi:I('100'),nd:0,tripod:true},
  text:`A neutral density filter is sunglasses for your lens. It blocks a fixed number of stops (ND8 = 3, ND64 = 6, ND1000 ≈ 10) without changing color, so you can use slow shutter speeds in daylight for silky water or wide apertures in sun.`,
  steps:[{t:'Try 1/2s with no ND: hopelessly overexposed.',ok:()=>ST.ti<=T('0.5"')&&ST.nd===0},
         {t:'Add ND64 (6 stops) and find exposure ~0 with a 1/4s or slower shutter. Silky water!',ok:()=>ST.nd>0&&ST.ti<=T('1/4')&&Math.abs(G.frame.meter)<=0.7}]},
 {id:'is', title:'Stabilization, tripods & camera shake', scene:'night', setup:{mode:'M',ti:T('1/8'),ai:A('2.8'),qi:I('100'),is:false,tripod:false,wb:'Tungsten'},
  text:`Your hands shake. The old rule: handheld shutter speed should be at least <b>1/focal length</b> (1/50 at 50mm). <b>Image stabilization</b> (IS/VR/IBIS) buys about 3–5 stops more. A <b>tripod</b> removes shake entirely, but it can't freeze moving subjects; only shutter speed can.`,
  steps:[{t:'At 1/8 handheld without IS, everything is shaky. Turn IS on.',ok:()=>ST.is},
         {t:'Go to 2", close the aperture to f/11 and switch to Tripod: city sharp, the car turns into light trails.',ok:()=>ST.tripod&&ST.ti<=T('2"')}]},
 {id:'drive', title:'Drive mode: single vs burst', scene:'sports', setup:{mode:'Tv',ti:T('1/1600'),qi:I('800'),drive:'single',af:'AF-C'},
  text:`<b>Single</b> takes one photo per press. <b>Burst/continuous</b> fires many per second (10 fps here) so you can pick the moment with the best pose, ball position or expression. Pair it with AF-C and a fast shutter for sports.`,
  steps:[{t:'Switch Drive to Burst (Body tab) and press the shutter.',ok:()=>lessonFlag.burst},{t:'Open the Roll tab to compare the 8 frames.',ok:()=>lessonFlag.roll}]},
 {id:'raw', title:'RAW vs JPEG: recovering a shot', scene:'portrait', setup:{mode:'M',ti:T('1/250'),ai:A('2.8'),qi:I('100'),raw:false,recover:0,warn:'zebra'},
  text:`A <b>JPEG</b> is processed in-camera to 8 bits; clipped highlights are gone for good and pulling up shadows shows banding. A <b>RAW</b> file keeps all the sensor data (12–14 bits) with ~1 stop of hidden highlight headroom. This shot is about 2 stops overexposed.`,
  steps:[{t:'In the Body tab, drag "Edit exposure later" to −2 with JPEG: the sky stays flat grey, detail is lost.',ok:()=>!ST.raw&&ST.recover<=-1.6},
         {t:'Switch to RAW: the background highlights come back.',ok:()=>ST.raw&&ST.recover<=-1.6}]},
 {id:'thirds', title:'Composition: rule of thirds', scene:'street', setup:{mode:'Av',ai:A('5.6'),grid:true},
  text:`Imagine the frame split in thirds. Placing your subject or horizon on those lines (or where they cross) usually feels more dynamic than dead center. Leave space in front of a moving subject so it has somewhere to go.`,
  steps:[{t:'Grid is on. Press the shutter when the cyclist crosses the left third line.',ok:()=>lessonFlag.shot}]}
];
const CHALLENGES = [
 {id:'freeze', title:'Freeze the cyclist', scene:'street', setup:{mode:'M',ti:T('1/60'),ai:A('8'),qi:I('100'),tripod:false,nd:0}, goal:'Cyclist sharp (motion blur < 1.5 px) with correct exposure (±⅔ EV).',
  check:s=>{ const m=s.m; if(m.subMot>=1.5) return [false,`Cyclist still blurred ${m.subMot.toFixed(1)}px. Use a faster shutter.`]; if(Math.abs(m.expErr)>0.7) return [false,`Exposure off by ${fmtStops(Math.round(-m.expErr*3)/3,true)} EV. Balance with aperture or ISO.`]; return [true,'Frozen mid-pedal, nicely exposed!']; }},
 {id:'motion', title:'Show the speed', scene:'street', setup:{mode:'M',ti:T('1/500'),ai:A('4'),qi:I('100'),tripod:true}, goal:'Cyclist streaked (motion blur > 25 px), camera on tripod, exposure ±⅔ EV.',
  check:s=>{ const m=s.m; if(m.subMot<=25) return [false,`Only ${m.subMot.toFixed(0)}px of blur. Slow the shutter.`]; if(Math.abs(m.expErr)>0.7) return [false,`Exposure off by ${fmtStops(Math.round(-m.expErr*3)/3,true)} EV. Close the aperture / lower ISO / use ND.`]; return [true,'Great sense of movement!']; }},
 {id:'bokeh', title:'Blur the background', scene:'portrait', setup:{mode:'M',ti:T('1/125'),ai:A('11'),qi:I('400'),focal:50}, goal:'Background blur > 15 px, her face sharp (focus blur < 1.5 px), exposure ±⅔ EV.',
  check:s=>{ const m=s.m; if(m.subBlur>=1.5) return [false,'She is out of focus. Tap her face to focus.']; if(m.bgBlur<=15) return [false,`Background blur only ${m.bgBlur.toFixed(0)}px. Wider aperture, longer focal length.`]; if(Math.abs(m.expErr)>0.7) return [false,`Exposure off by ${fmtStops(Math.round(-m.expErr*3)/3,true)} EV.`]; return [true,'Creamy bokeh!']; }},
 {id:'silky', title:'Silky waterfall in daylight', scene:'waterfall', setup:{mode:'M',ti:T('1/250'),ai:A('8'),qi:I('100'),nd:0,tripod:false}, goal:'Water blur > 60 px, no camera shake (< 1.5 px), exposure ±⅔ EV. Hint: ND + tripod.',
  check:s=>{ const m=s.m; if(m.shake>=1.5) return [false,'Camera shake! Use a tripod.']; if(m.subMot<=60) return [false,`Water blur ${m.subMot.toFixed(0)}px. Slower shutter.`]; if(Math.abs(m.expErr)>0.7) return [false,`Exposure off by ${fmtStops(Math.round(-m.expErr*3)/3,true)} EV. Try an ND filter.`]; return [true,'Silky smooth!']; }},
 {id:'night', title:'Handheld at night', scene:'night', setup:{mode:'M',ti:T('1/60'),ai:A('8'),qi:I('100'),tripod:false,is:false,wb:'Auto'}, goal:'No tripod. Shake < 1.5 px, exposure ±⅔ EV, ISO ≤ 6400.',
  check:s=>{ const m=s.m; if(s.fr.iso>6500) return [false,'ISO above 6400, too noisy. Use IS and a wider aperture.']; if(m.shake>=1.5) return [false,`Shake ${m.shake.toFixed(1)}px. Faster shutter or turn IS on.`]; if(Math.abs(m.expErr)>0.7) return [false,`Exposure off by ${fmtStops(Math.round(-m.expErr*3)/3,true)} EV.`]; return [true,'Sharp and clean at night!']; }},
 {id:'deep', title:'Everything sharp', scene:'street', setup:{mode:'M',ti:T('1/125'),ai:A('2'),qi:I('100'),focal:24}, goal:'At 24mm or wider, every layer’s focus blur < 2 px (incl. diffraction) and exposure ±⅔ EV. Hint: focus a bit beyond the cyclist.',
  check:s=>{ const m=s.m; if(ST.focal>24) return [false,'Zoom out to 24mm or wider.']; if(m.maxBlur>=2) return [false,`Something is ${m.maxBlur.toFixed(1)}px soft. Smaller aperture / focus farther (but beware diffraction past f/16).`]; if(Math.abs(m.expErr)>0.7) return [false,'Exposure off.']; return [true,'Front-to-back sharp, the landscape way!']; }},
 {id:'fill', title:'Fill flash portrait', scene:'portrait', setup:{mode:'M',ti:T('1/200'),ai:A('5.6'),qi:I('100'),flash:false}, goal:'Background exposed ±⅔ EV, her face within ±½ EV of correct, using flash.',
  check:s=>{ const m=s.m; if(!ST.flash) return [false,'Turn on the flash.']; if(s.fr.syncBand>0) return [false,'Dark band! Shutter is faster than sync speed.']; if(Math.abs(m.expErr)>0.7) return [false,'Background exposure off.']; if(Math.abs(m.subjExp)>0.5) return [false,`Face is ${fmtStops(Math.round(m.subjExp*3)/3,true)} EV. Adjust flash comp.`]; return [true,'Balanced fill flash!']; }},
 {id:'sports', title:'Catch the sprint', scene:'sports', setup:{mode:'M',ti:T('1/250'),ai:A('8'),qi:I('100'),af:'AF-S',drive:'single'}, goal:'Burst mode, every frame: kid sharp (motion < 1.5 px, focus blur < 1.5 px), exposure ±⅔ EV.',
  check:(s,all)=>{ if(all.length<2) return [false,'Use Burst drive mode (Body tab).']; for(const x of all){ if(x.m.subMot>=1.5) return [false,'Motion blur in some frames. Faster shutter.']; if(x.m.subBlur>=1.5) return [false,'Some frames out of focus. Use AF-C and tap the kid.']; if(Math.abs(x.m.expErr)>0.7) return [false,'Exposure off.']; } return [true,'Every frame tack-sharp!']; }},
 {id:'wb', title:'Neutral night colors', scene:'night', setup:{mode:'M',ti:T('1/30'),ai:A('2'),qi:I('3200'),wb:'Shade'}, goal:'Set white balance within 400 K of the 3200 K lamp light and expose ±⅔ EV.',
  check:s=>{ if(Math.abs(s.fr.setK-3200)>400) return [false,`WB is ${Math.round(s.fr.setK)}K. Match the lamps (~3200K).`]; if(Math.abs(s.m.expErr)>0.7) return [false,'Exposure off.']; return [true,'Natural colors!']; }}
];
const QUIZ = [
 {q:'You go from f/4 to f/5.6. How much light?',a:['Twice as much','Half as much (−1 stop)','The same'],c:1},
 {q:'Which is the same exposure as 1/250 s, f/8, ISO 100?',a:['1/500 s, f/5.6, ISO 100','1/125 s, f/5.6, ISO 100','1/500 s, f/11, ISO 100'],c:0},
 {q:'To freeze a running child, you mainly need…',a:['A small aperture','A fast shutter speed','Low ISO'],c:1},
 {q:'Which setting gives the blurriest background?',a:['f/16 at 24mm','f/2 at 135mm','f/8 at 50mm'],c:1},
 {q:'The histogram is piled against the right edge. This means…',a:['Shadows are crushed','Highlights are clipped','Perfect exposure'],c:1},
 {q:'Snow scene comes out grey in Av mode. You should…',a:['Use −1 exposure comp','Use +1 to +2 exposure comp','Raise ISO'],c:1},
 {q:'"Sunny 16" says in bright sun at f/16 the shutter is about…',a:['1/ISO','1/focal length','1/16 s'],c:0},
 {q:'An ND1000 filter blocks about…',a:['3 stops','6 stops','10 stops'],c:2},
 {q:'Tungsten lamp light looks orange. Set white balance to about…',a:['3200 K','5500 K','7500 K'],c:0},
 {q:'Your flash photo has a black band at the bottom. Cause?',a:['ISO too high','Shutter faster than flash sync speed','Flash too weak'],c:1},
 {q:'Third-stop shutter speeds between 1/125 and 1/250 are…',a:['1/150 and 1/200','1/160 and 1/200','1/180 and 1/220'],c:1},
 {q:'Handheld at 200mm without stabilization, a safe shutter speed is about…',a:['1/30','1/60','1/250'],c:2}
];
const lessonFlag={};
let CUR=null; // {type:'lesson'|'challenge', item}
function applySetup(it){ const s=Object.assign({mode:'M',nd:0,flash:false,ec:0,tripod:false,is:true,af:'AF-S',drive:'single',raw:false,recover:0,meter:'matrix',wb:'Auto',keepSize:false,peaking:false,hss:false,warn:ST.warn},it.setup||{});
  const keepLens = s.focal!==undefined; setScene(it.scene); Object.assign(ST,s); if(keepLens){ ST.focusS=targetDist(G.time); }
  ST.afLayer=SCENES[it.scene].focus; ST.focusS=targetDist(G.time); ST.mf=ST.focusS; for(const k in lessonFlag) delete lessonFlag[k]; prevSnap=null; afterChange('setup'); }
function openLesson(i){ const L=LESSONS[i]; CUR={type:'lesson',i,item:L}; applySetup(L); showTab('camera'); renderCard(); }
function openChallenge(i){ const C=CHALLENGES[i]; CUR={type:'challenge',i,item:C}; applySetup(C); showTab('camera'); renderCard(); }
function renderCard(){ const el=$('#card'); if(!CUR){ el.innerHTML=''; el.style.display='none'; return; } el.style.display=''; const it=CUR.item;
  if(CUR.type==='lesson'){ const n=CUR.i;
    el.innerHTML=`<div class="card-h"><span class="pill">Lesson ${n+1}/${LESSONS.length}</span><button class="x" onclick="CUR=null;renderCard()" aria-label="Close lesson">✕</button></div><h2>${it.title}</h2><div class="lt">${it.text}</div>
    ${it.widget==='triangle'?triangleWidget():''}
    <h3>Try it</h3><ol class="steps">${it.steps.map((s,k)=>`<li data-k="${k}">${s.t}</li>`).join('')}</ol>
    <div class="callout"><b>What changed:</b> <span id="lessonChanged">turn a dial and I'll explain.</span></div>
    <div class="row"><button class="btn" ${n?'':'disabled'} onclick="openLesson(${n-1})">← Prev</button><button class="btn pri" ${n<LESSONS.length-1?'':'disabled'} onclick="openLesson(${n+1})">Next lesson →</button></div>`;
  } else { const done=JSON.parse(localStorage.getItem('el_ch')||'{}');
    el.innerHTML=`<div class="card-h"><span class="pill gold">Challenge ${CUR.i+1}/${CHALLENGES.length}</span><button class="x" onclick="CUR=null;renderCard()" aria-label="Close challenge">✕</button></div><h2>${done[it.id]?'✅ ':''}${it.title}</h2><p class="lt">${it.goal}</p><p class="muted">Set up the shot, then press the shutter. I'll grade the photo.</p><div class="callout" id="chResult">Waiting for your shot…</div>
    <div class="row"><button class="btn" onclick="openChallenge(${CUR.i})">↺ Reset</button><button class="btn pri" ${CUR.i<CHALLENGES.length-1?'':'disabled'} onclick="openChallenge(${CUR.i+1})">Next →</button></div>`; }
  lessonCheck(); }
function triangleWidget(){ return `<div class="tri"><div class="tri-row"><button class="btn sm" onclick="eqTrade('t','a')">Shutter −1 stop, Aperture +1</button><button class="btn sm" onclick="eqTrade('a','t')">Aperture −1 stop, Shutter +1</button><button class="btn sm" onclick="eqTrade('q','t')">ISO +1 stop, Shutter −1</button></div>
  <svg viewBox="0 0 200 120" class="tri-svg" aria-hidden="true"><polygon points="100,8 190,112 10,112" fill="none" stroke="#ff7a45" stroke-width="2"/><text x="100" y="30" text-anchor="middle">EXPOSURE</text><text x="100" y="5" text-anchor="middle" dy="0">Shutter: motion</text><text x="18" y="108">ISO: noise</text><text x="182" y="108" text-anchor="end">Aperture: DOF</text></svg>
  <p class="muted" id="eqLine"></p></div>`; }
function eqTrade(a,b){ // a gets 1 stop LESS light (for t: faster; a: smaller), b gets 1 stop MORE
  if(ST.mode!=='M'){ ST.mode='M'; }
  const step=3; const mv={t:(d)=>ST.ti=Math.max(0,Math.min(54,ST.ti+d)), a:(d)=>ST.ai=Math.max(0,Math.min(24,ST.ai+d)), q:(d)=>ST.qi=Math.max(0,Math.min(24,ST.qi+d))};
  // "less light": t faster(+), a smaller (+); q is more light(+)
  if(a==='q'){ mv.q(step); mv.t(step); } else { mv[a](step); mv[b==='t'?'t':'a'](-step); }
  lessonFlag.eq=true; tickSound(); afterChange('eq'); const e=$('#eqLine'); if(e) e.textContent=`Now ${SHUTTER_LABELS[ST.ti]} · f/${APERTURE_LABELS[ST.ai]} · ISO ${ISO_LABELS[ST.qi]}: same brightness, different look.`; }
function lessonCheck(){ if(!CUR||CUR.type!=='lesson'||!G.frame) return; CUR.item.steps.forEach((s,k)=>{ let ok=false; try{ ok=s.ok(); }catch(e){} const li=$(`.steps li[data-k="${k}"]`); if(li&&ok&&!li.classList.contains('done')){ li.classList.add('done'); } });
  const done=JSON.parse(localStorage.getItem('el_les')||'{}'); if($$('.steps li').length&&$$('.steps li').every(li=>li.classList.contains('done'))&&!done[CUR.item.id]){ done[CUR.item.id]=1; localStorage.setItem('el_les',JSON.stringify(done)); toast('🎉 Lesson complete!'); renderLists(); } }
setInterval(lessonCheck,500);
function challengeCheck(shots){ if(ST.drive==='burst') lessonFlag.burst=true; lessonFlag.shot=true; if(!CUR||CUR.type!=='challenge') return;
  const s=shots[0]; const [ok,msg]=CUR.item.check(s,shots); const r=$('#chResult'); if(r) r.innerHTML=(ok?'✅ <b>Passed!</b> ':'❌ ')+msg+`<br><span class="muted">${exifLine(s.info)}</span>`;
  if(ok){ const d=JSON.parse(localStorage.getItem('el_ch')||'{}'); d[CUR.item.id]=1; localStorage.setItem('el_ch',JSON.stringify(d)); toast('🏆 Challenge passed: '+CUR.item.title); renderLists(); } }
function renderLists(){ const ld=JSON.parse(localStorage.getItem('el_les')||'{}'), cd=JSON.parse(localStorage.getItem('el_ch')||'{}');
  $('#lessonList').innerHTML=LESSONS.map((l,i)=>`<button class="li" onclick="openLesson(${i})"><span class="num">${ld[l.id]?'✓':i+1}</span><span><b>${l.title}</b><small>${SCENES[l.scene].icon} ${SCENES[l.scene].name}</small></span></button>`).join('');
  $('#challengeList').innerHTML=CHALLENGES.map((c,i)=>`<button class="li" onclick="openChallenge(${i})"><span class="num">${cd[c.id]?'🏆':i+1}</span><span><b>${c.title}</b><small>${c.goal}</small></span></button>`).join('');
  $('#progress').textContent=`${Object.keys(ld).length}/${LESSONS.length} lessons · ${Object.keys(cd).length}/${CHALLENGES.length} challenges`; }
function renderQuiz(){ $('#quiz').innerHTML=QUIZ.map((q,i)=>`<div class="q"><p><b>${i+1}.</b> ${q.q}</p>${q.a.map((a,k)=>`<button class="btn sm" data-q="${i}" data-k="${k}">${a}</button>`).join('')}<span class="qr" id="qr${i}"></span></div>`).join('');
  $('#quiz').onclick=e=>{ const b=e.target.closest('button'); if(!b) return; const q=QUIZ[b.dataset.q], ok=+b.dataset.k===q.c; $('#qr'+b.dataset.q).textContent=ok?'✅ Correct':'❌ Try again'; b.classList.add(ok?'right':'wrong'); }; }
function renderCheat(){ const third=(arr)=>arr.map((l,i)=>`<span class="${i%3===0?'full':''}">${l}</span>`).join('');
  $('#cheatBody').innerHTML=`
  <section><h3>Stop scales <small>(bold = full stops, others = ⅓ stops)</small></h3>
  <p><b>Shutter</b><br><span class="scale">${third(SHUTTER_LABELS)}</span></p><p><b>Aperture f/</b><br><span class="scale">${third(APERTURE_LABELS)}</span></p><p><b>ISO</b><br><span class="scale">${third(ISO_LABELS)}</span></p>
  <p>Each full stop doubles or halves the light. Aperture full stops go up by ×1.4 (√2) because light depends on the area of the opening.</p></section>
  <section><h3>What each setting does</h3><table><tr><th></th><th>More light</th><th>Side effect</th></tr>
   <tr><td>Shutter</td><td>slower (1/60 → 1/30)</td><td>motion blur, camera shake</td></tr><tr><td>Aperture</td><td>smaller f-number (f/8 → f/5.6)</td><td>shallower depth of field</td></tr><tr><td>ISO</td><td>higher (400 → 800)</td><td>more noise, less dynamic range</td></tr></table></section>
  <section><h3>Starting points</h3><table><tr><th>Scene</th><th>Try</th></tr>
   <tr><td>Sunny day (Sunny 16)</td><td>f/16, 1/ISO (ISO 100 → 1/100, nearest 1/125)</td></tr><tr><td>Portrait, blurry background</td><td>Av, f/1.8–2.8, 85mm+, focus on the eye</td></tr>
   <tr><td>Landscape</td><td>f/8–f/11, tripod, ISO 100, focus ⅓ into the scene</td></tr><tr><td>Kids &amp; sports</td><td>Tv 1/1000+, AF-C, burst, Auto ISO</td></tr>
   <tr><td>Silky water</td><td>Tripod, ND, ½ s – 2 s, f/8–11</td></tr><tr><td>Night city handheld</td><td>f/1.8–2.8, 1/30–1/60 with IS, ISO 1600–6400</td></tr>
   <tr><td>Light trails</td><td>Tripod, 5–30 s, f/8–11, ISO 100</td></tr><tr><td>Indoor no flash</td><td>f/2, 1/125, Auto ISO</td></tr></table></section>
  <section><h3>Rules of thumb</h3><ul><li>Handheld minimum shutter ≈ 1/(focal length); stabilization adds ~3–5 stops.</li><li>Freeze: walking 1/250, running 1/1000, birds in flight 1/2000+.</li>
   <li>Diffraction softens most lenses beyond ~f/11–f/16 on full frame.</li><li>Flash sync is usually 1/160–1/250. Faster needs high-speed sync.</li>
   <li>Expose to the right without clipping important highlights; check the histogram, not the screen.</li><li>Bright scenes (snow, beach): +1 to +2 EV comp. Dark scenes: −1 EV.</li></ul></section>
  <section><h3>White balance (Kelvin)</h3><table><tr><td>Candle</td><td>~1900K</td></tr><tr><td>Tungsten bulb</td><td>2700–3200K</td></tr><tr><td>Fluorescent</td><td>~4000K</td></tr><tr><td>Daylight / flash</td><td>5000–5500K</td></tr><tr><td>Cloudy</td><td>6500K</td></tr><tr><td>Shade</td><td>7500K+</td></tr></table></section>
  <section><h3>ND filters</h3><table><tr><th>Filter</th><th>Stops</th><th>1/250 becomes</th></tr><tr><td>ND8 (0.9)</td><td>3</td><td>1/30</td></tr><tr><td>ND64 (1.8)</td><td>6</td><td>1/4</td></tr><tr><td>ND1000 (3.0)</td><td>10</td><td>4 s</td></tr></table></section>
  <section><h3>Equivalent exposures</h3><p>All the same brightness: 1/1000 f/4 · 1/500 f/5.6 · 1/250 f/8 · 1/125 f/11 · 1/60 f/16 (ISO 100). Pick based on what should be sharp or blurred.</p>
  <p>EV₁₀₀ = log₂(N²/t) − log₂(ISO/100). Bright sun ≈ EV 15, shade ≈ 12–13, indoors ≈ 7–8, city street at night ≈ 5–7.</p></section>
  <section><h3>Modes</h3><table><tr><td>M</td><td>You set all three.</td></tr><tr><td>Av / A</td><td>You set aperture, camera sets shutter.</td></tr><tr><td>Tv / S</td><td>You set shutter, camera sets aperture.</td></tr><tr><td>P</td><td>Camera sets both, you can shift/compensate.</td></tr><tr><td>AF-S / AF-C</td><td>Focus once / keep focusing.</td></tr><tr><td>Matrix / Center / Spot</td><td>Whole frame / middle / tiny point.</td></tr></table></section>`; }
function showTab(t){ $$('.nav button').forEach(b=>b.classList.toggle('on',b.dataset.t===t)); $$('.view').forEach(v=>v.classList.toggle('on',v.id==='v-'+t)); if(t==='camera'){ requestAnimationFrame(()=>{ sizeCanvas(); Object.values(D).forEach(d=>d.draw()); }); } if(t==='roll'){ renderRoll(); lessonFlag.roll=true; } window.scrollTo(0,0); }

// ---------- init ----------
window.addEventListener('DOMContentLoaded',()=>{
  load(); try{ R=new Renderer($('#gl')); }catch(e){ $('#vf').innerHTML='<p style="padding:2em">Sorry, this browser does not support WebGL2, which Exposure Lab needs. Try a recent Safari, Chrome or Edge.</p>'; console.warn(e); return; }
  ST.recover=0; makeDials(); buildControls(); buildScene(); ST.focusS=targetDist(0);
  $$('.nav button').forEach(b=>b.onclick=()=>showTab(b.dataset.t));
  $('#modal').onclick=e=>{ if(e.target.id==='modal'||e.target.classList.contains('mx')) closeModal(); };
  $('#zoomBtn').onclick=()=>{ $('#vf').classList.toggle('zoom'); lessonFlag.zoom=true; };
  $('#clearRoll').onclick=()=>{ if(confirm('Delete all photos in the roll?')){ ROLL=[]; localStorage.removeItem('el_roll'); renderRoll(); $('#lastShot').style.display='none'; } };
  $('#lastShot').onclick=()=>showTab('roll'); if(ROLL[0]){ $('#lastShot').src=ROLL[0].img; } else $('#lastShot').style.display='none';
  $('#startBtn').onclick=()=>openLesson(0); $('#sandboxBtn').onclick=()=>{ CUR=null; renderCard(); showTab('camera'); };
  renderLists(); renderQuiz(); renderCheat(); renderRoll(); afterChange('init'); $('#histBox').style.display=ST.hist?'':'none';
  window.addEventListener('resize',sizeCanvas); new ResizeObserver(sizeCanvas).observe($('#vf'));
  sizeCanvas(); G.last=performance.now(); requestAnimationFrame(tick);
});
