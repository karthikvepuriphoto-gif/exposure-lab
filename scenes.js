// Exposure Lab - procedural scenes. Layers are drawn in METERS at their depth (pinhole projection).
// Texture size and a 36mm-wide full-frame sensor define pixels per mm on the sensor.
'use strict';
const TEXW = 1280, TEXH = 800, SENSOR_W = 36, SENSOR_H = 36 * TEXH / TEXW, CAM_H = 1.6;
function rng(seed){ let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function circ(ctx,x,y,r,col){ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();}
// projection helpers for backdrop (ground) layers, drawn in pixel space
const VIEW={b:0,tilt:0};
function projector(f){ const k = TEXW * f / SENSOR_W; return (X,Y,Z)=>{Z=Math.max(0.05,Z+VIEW.b);return [TEXW/2 + k*X/Z, TEXH/2 + k*(Y/Z - VIEW.tilt)];}; }
function quad(ctx,P,pts,col){ctx.fillStyle=col;ctx.beginPath();pts.forEach((p,i)=>{const q=P(...p);i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]);});ctx.closePath();ctx.fill();}
function hz(){return TEXH/2 - VIEW.k*VIEW.tilt;}
function sky(ctx,top,bot){const H=hz();const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,top);g.addColorStop(1,bot);ctx.fillStyle=g;ctx.fillRect(0,0,TEXW,H+2);}
function groundFill(ctx,near,far){const H=hz();const g=ctx.createLinearGradient(0,H,0,TEXH);g.addColorStop(0,far);g.addColorStop(1,near);ctx.fillStyle=g;ctx.fillRect(0,H,TEXW,TEXH-H);}

function tree(ctx,x,base,h,r,cols){ctx.fillStyle='#5a3d24';ctx.fillRect(x-h*0.04,base-h*0.55,h*0.08,h*0.55);
  const R=rng(Math.floor(x*97+h*13));for(let i=0;i<14;i++){circ(ctx,x+(R()-0.5)*r*1.4,base-h*0.6-(R()-0.3)*r*1.1,r*(0.45+R()*0.35),cols[i%cols.length]);}}
function person(ctx,x,base,o){ // standing person, meters
  const h=o.h||1.75; ctx.save(); ctx.translate(x,base);
  ctx.fillStyle=o.pants||'#2c3e66'; ctx.fillRect(-0.17,-h*0.48,0.15,h*0.48); ctx.fillRect(0.02,-h*0.48,0.15,h*0.48);
  ctx.fillStyle=o.shirt||'#d9534f'; rr(ctx,-0.24,-h*0.82,0.48,h*0.38,0.08); ctx.fill();
  circ(ctx,0,-h*0.9,0.12,o.skin||'#c98d6b'); ctx.restore(); }

const SCENES = {
 street: {
  name:'City street', icon:'🚲', ev:15, K:5500, focal:35, focus:'cyclist', desc:'Sunny street: a cyclist rides past, a car drives in the distance.',
  layers:[
   {id:'backdrop', ground:true, draw(ctx,f){ const P=projector(f); sky(ctx,'#4f8fd8','#bcd9f2'); groundFill(ctx,'#7d8a6a','#a4ab92');
      quad(ctx,P,[[-4.5,CAM_H,1],[4.5,CAM_H,1],[4.5,CAM_H,400],[-4.5,CAM_H,400]],'#55585e');
      quad(ctx,P,[[-7.5,CAM_H,1],[-4.5,CAM_H,1],[-4.5,CAM_H,400],[-7.5,CAM_H,400]],'#b9b2a5');
      quad(ctx,P,[[4.5,CAM_H,1],[7.5,CAM_H,1],[7.5,CAM_H,400],[4.5,CAM_H,400]],'#b9b2a5');
      for(let z=1;z<200;z+=6) quad(ctx,P,[[-0.08,CAM_H,z],[0.08,CAM_H,z],[0.08,CAM_H,z+3],[-0.08,CAM_H,z+3]],'#e8d36a');
      for(let z=1;z<200;z+=1.5) quad(ctx,P,[[-7.5,CAM_H,z],[-4.5,CAM_H,z],[-4.5,CAM_H,z+0.05],[-7.5,CAM_H,z+0.05]],'#9c9588');
      // crossing road far
      quad(ctx,P,[[-400,CAM_H,30],[400,CAM_H,30],[400,CAM_H,38],[-400,CAM_H,38]],'#55585e');
   }},
   {id:'buildings', d:45, draw(ctx){ const R=rng(7); let x=-90;
      while(x<90){ const w=7+R()*8, h=8+R()*22, c=['#c9a27e','#b5654f','#d8cdb8','#8e9bae','#e0b86a','#9f7a63'][Math.floor(R()*6)];
        ctx.fillStyle=c; ctx.fillRect(x,CAM_H-h,w,h); ctx.fillStyle='rgba(0,0,0,.12)'; ctx.fillRect(x+w-0.6,CAM_H-h,0.6,h);
        for(let wy=CAM_H-h+1.2;wy<CAM_H-2.5;wy+=3) for(let wx=x+0.9;wx<x+w-1.2;wx+=2.1){ctx.fillStyle=R()<0.15?'#f4f7fb':'#3b4d63';ctx.fillRect(wx,wy,1.1,1.5);}
        ctx.fillStyle='#3a2f2a';ctx.fillRect(x+w/2-0.8,CAM_H-2.6,1.6,2.6); x+=w+0.2; }
      ctx.fillStyle='#fff';ctx.font='bold 1.5px sans-serif'; }},
   {id:'trees', d:16, draw(ctx){ for(const x of [-12,-7.5,7.5,13]) tree(ctx,x,CAM_H,6.5,2.2,['#3f7d3a','#4f9a45','#2f6430','#6ab04c']);
      for(const x of [-6,6]){ctx.fillStyle='#2b2f36';ctx.fillRect(x-0.07,CAM_H-4.8,0.14,4.8);ctx.fillRect(x-0.07,CAM_H-4.8,(x<0?1:-1)*0.9,0.12);}
      person(ctx,-9.5,CAM_H,{shirt:'#f0c419',h:1.7}); person(ctx,10.5,CAM_H,{shirt:'#5aa0d6',pants:'#333',h:1.8}); }},
   {id:'car', d:24, move:{v:-11,span:1.6}, draw(ctx){ ctx.fillStyle='#d23b2f'; rr(ctx,-2.2,CAM_H-1.35,4.4,0.95,0.25); ctx.fill(); rr(ctx,-1.3,CAM_H-1.95,2.4,0.75,0.3); ctx.fill();
      ctx.fillStyle='#a8d0ea'; ctx.fillRect(-1.1,CAM_H-1.85,0.95,0.55); ctx.fillRect(0.0,CAM_H-1.85,0.9,0.55);
      circ(ctx,-1.4,CAM_H-0.35,0.35,'#1d1d1d'); circ(ctx,1.4,CAM_H-0.35,0.35,'#1d1d1d'); circ(ctx,-1.4,CAM_H-0.35,0.15,'#bbb'); circ(ctx,1.4,CAM_H-0.35,0.15,'#bbb');
      circ(ctx,-2.15,CAM_H-1.0,0.12,'#fff3b0'); }},
   {id:'cyclist', d:7, subject:true, move:{v:5,span:1.5}, draw(ctx){ const b=CAM_H; ctx.lineWidth=0.05; ctx.strokeStyle='#222';
      for(const wx of [-0.55,0.55]){ctx.beginPath();ctx.arc(wx,b-0.34,0.34,0,7);ctx.stroke(); ctx.lineWidth=0.02; for(let a=0;a<6.28;a+=0.52){ctx.beginPath();ctx.moveTo(wx,b-0.34);ctx.lineTo(wx+Math.cos(a)*0.32,b-0.34+Math.sin(a)*0.32);ctx.stroke();} ctx.lineWidth=0.05;}
      ctx.strokeStyle='#1c7ed6';ctx.lineWidth=0.06;ctx.beginPath();ctx.moveTo(-0.55,b-0.34);ctx.lineTo(-0.1,b-0.34);ctx.lineTo(0.35,b-0.85);ctx.lineTo(-0.25,b-0.85);ctx.lineTo(-0.55,b-0.34);ctx.moveTo(-0.1,b-0.34);ctx.lineTo(-0.28,b-0.95);ctx.moveTo(0.55,b-0.34);ctx.lineTo(0.38,b-1.0);ctx.stroke();
      ctx.strokeStyle='#333';ctx.lineWidth=0.09;ctx.beginPath();ctx.moveTo(-0.25,b-1.0);ctx.lineTo(0.05,b-0.62);ctx.lineTo(-0.08,b-0.3);ctx.moveTo(-0.25,b-1.0);ctx.lineTo(-0.15,b-0.6);ctx.lineTo(0.0,b-0.4);ctx.stroke();
      ctx.fillStyle='#ff7a1a';ctx.beginPath();ctx.moveTo(-0.32,b-1.02);ctx.lineTo(0.02,b-1.55);ctx.lineTo(0.18,b-1.45);ctx.lineTo(-0.12,b-0.95);ctx.fill();
      ctx.strokeStyle='#ff7a1a';ctx.lineWidth=0.08;ctx.beginPath();ctx.moveTo(0.05,b-1.45);ctx.lineTo(0.38,b-1.05);ctx.stroke();
      circ(ctx,0.12,b-1.68,0.12,'#c98d6b'); ctx.fillStyle='#f2f2f2'; ctx.beginPath();ctx.arc(0.1,b-1.72,0.14,Math.PI,0);ctx.fill(); }}
  ]},
 waterfall: {
  name:'Waterfall', icon:'💧', ev:13, K:6500, focal:35, focus:'water', desc:'Shaded waterfall: fast-moving water (~4 m/s).',
  layers:[
   {id:'backdrop', ground:true, draw(ctx,f){ sky(ctx,'#a9c4dc','#e4edf3'); groundFill(ctx,'#2e4a3f','#4f6e62'); const P=projector(f);
      quad(ctx,P,[[-30,CAM_H,4],[30,CAM_H,4],[30,CAM_H,40],[-30,CAM_H,40]],'#4a7b84');
      const R=rng(3); for(let i=0;i<220;i++){const z=4+R()*30,x=(R()-0.5)*40;const q=P(x,CAM_H,z),r=TEXW*f/36*0.25/z;ctx.fillStyle=R()<0.5?'rgba(255,255,255,.35)':'rgba(20,40,50,.3)';ctx.fillRect(q[0]-r*3,q[1],r*6,Math.max(1,r*0.4));} }},
   {id:'cliff', d:30, draw(ctx){ const R=rng(11); ctx.fillStyle='#5b5650'; ctx.beginPath(); ctx.moveTo(-60,CAM_H); ctx.lineTo(-60,-14); 
      for(let x=-60;x<=60;x+=3) ctx.lineTo(x,-12-R()*5); ctx.lineTo(60,CAM_H); ctx.fill();
      for(let i=0;i<120;i++){ctx.fillStyle=R()<0.5?'#6d675f':'#47433e';ctx.fillRect((R()-0.5)*120,-14+R()*15,1+R()*4,0.4+R()*1.5);}
      for(let i=0;i<70;i++){const x=(R()-0.5)*120;if(Math.abs(x)<6)continue; tree(ctx,x,-12+R()*2,5+R()*4,1.6,['#2e5b34','#3c7a43','#24472a']);}
      for(let i=0;i<40;i++){const x=(R()-0.5)*110;if(Math.abs(x)<5)continue;ctx.fillStyle='#4f7d3d';ctx.beginPath();ctx.arc(x,-6+R()*7,0.8+R()*1.5,0,7);ctx.fill();}
      ctx.fillStyle='#3d3a36'; ctx.fillRect(-5,-13,10,15); }},
   {id:'water', d:29, subject:true, flow:{v:4}, draw(ctx){ const R=rng(5); const g=ctx.createLinearGradient(-4,0,4,0); g.addColorStop(0,'#9fb9c4');g.addColorStop(0.5,'#eef5f8');g.addColorStop(1,'#a8c1cc');
      ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(-3.8,-13.2); ctx.lineTo(3.8,-13.2); ctx.lineTo(4.6,CAM_H); ctx.lineTo(-4.6,CAM_H); ctx.fill();
      for(let i=0;i<900;i++){const y=-13+R()*14.6,x=(R()-0.5)*(7.6+(y+13)*0.06);ctx.fillStyle=R()<0.55?'rgba(255,255,255,.95)':'rgba(70,100,115,.75)';ctx.fillRect(x,y,0.06+R()*0.18,0.15+R()*0.6);}
      for(let i=0;i<160;i++){circ(ctx,(R()-0.5)*11,CAM_H-0.2-R()*1.6,0.2+R()*0.5,R()<0.7?'rgba(255,255,255,.9)':'rgba(200,220,228,.85)');} }},
   {id:'rocks', d:6, draw(ctx){ const R=rng(21); for(const [x,s] of [[-3.6,1.3],[-2.6,0.8],[3.4,1.4],[2.4,0.7],[-4.4,1]]){ctx.fillStyle='#3f3b35';ctx.beginPath();ctx.ellipse(x,CAM_H,s,s*0.7,0,Math.PI,0);ctx.fill();ctx.fillStyle='#5f8a3e';ctx.beginPath();ctx.ellipse(x-s*0.2,CAM_H-s*0.55,s*0.6,s*0.18,0,0,7);ctx.fill();}
      for(let i=0;i<30;i++){const x=(R()<0.5?-1:1)*(2.2+R()*2.6);ctx.strokeStyle='#3e7d32';ctx.lineWidth=0.04;ctx.beginPath();ctx.moveTo(x,CAM_H);ctx.quadraticCurveTo(x+(R()-0.5)*0.5,CAM_H-0.8,x+(R()-0.5)*1.0,CAM_H-1.2-R()*0.5);ctx.stroke();} }}
  ]},
 night: {
  name:'Night city', icon:'🌃', key:0.28, ev:6, K:3200, focal:35, focus:'street', desc:'City at night: street lamps, neon, a car with lights. Tungsten-ish light (~3200K).',
  layers:[
   {id:'backdrop', ground:true, draw(ctx,f){ sky(ctx,'#060b1c','#1c2440'); groundFill(ctx,'#1b1a20','#111118'); const R=rng(9);
      for(let i=0;i<160;i++){ctx.fillStyle='rgba(255,255,255,'+(0.4+R()*0.6)+')';ctx.fillRect(R()*TEXW,R()*TEXH*0.42,1.3,1.3);}
      const P=projector(f); for(let i=0;i<60;i++){const z=3+R()*60,x=(R()-0.5)*16,q=P(x,CAM_H,z);ctx.fillStyle=['rgba(255,190,90,.35)','rgba(255,80,160,.3)','rgba(90,200,255,.3)'][i%3];ctx.fillRect(q[0]-1,q[1],2+R()*3,30*f/35/z*10);} }},
   {id:'skyline', d:300, draw(ctx){ const R=rng(17); let x=-400; while(x<400){const w=12+R()*25,h=20+R()*110; ctx.fillStyle='#0d1222';ctx.fillRect(x,CAM_H-h,w,h);
      for(let wy=CAM_H-h+3;wy<CAM_H-4;wy+=4.5)for(let wx=x+2;wx<x+w-3;wx+=4){if(R()<0.35){ctx.fillStyle=R()<0.8?'#ffd27a':'#cfe3ff';ctx.fillRect(wx,wy,2,2.4);}}
      if(R()<0.15){circ(ctx,x+w/2,CAM_H-h-3,1.4,'#ff3a3a');} x+=w+1;} }},
   {id:'street', d:22, draw(ctx){ const R=rng(31);
      for(const x of [-15,-8,8,15]){ctx.fillStyle='#22252c';ctx.fillRect(x-0.08,CAM_H-5,0.16,5);ctx.fillRect(x-0.6,CAM_H-5.05,1.2,0.18);
        const g=ctx.createRadialGradient(x,CAM_H-4.8,0,x,CAM_H-4.8,1.4);g.addColorStop(0,'rgba(255,220,160,.7)');g.addColorStop(0.2,'rgba(255,190,110,.35)');g.addColorStop(1,'rgba(255,170,80,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,CAM_H-4.8,1.4,0,7);ctx.fill();circ(ctx,x,CAM_H-4.85,0.25,'#fffef5');}
      ctx.fillStyle='#14161d';ctx.fillRect(-30,CAM_H-9,13,9);ctx.fillRect(18,CAM_H-10,14,10);
      ctx.font='bold 1.4px sans-serif';ctx.fillStyle='#ff4fb0';ctx.fillText('CAFÉ',-27,CAM_H-6);ctx.strokeStyle='#ff4fb0';ctx.lineWidth=0.15;ctx.strokeRect(-27.6,CAM_H-7.6,6,2.1);
      ctx.fillStyle='#4fe3ff';ctx.fillText('BOOKS',20,CAM_H-7);ctx.fillStyle='#ffd27a';ctx.fillRect(-26,CAM_H-3,4,2.6);ctx.fillRect(21,CAM_H-3.2,5,2.8); }},
   {id:'car', d:14, subject:true, move:{v:12,span:1.6}, draw(ctx){ ctx.fillStyle='#22283a'; rr(ctx,-2.2,CAM_H-1.35,4.4,0.95,0.25); ctx.fill(); rr(ctx,-1.3,CAM_H-1.95,2.4,0.75,0.3); ctx.fill();
      ctx.fillStyle='#2f3d56'; ctx.fillRect(-1.1,CAM_H-1.85,0.95,0.55); ctx.fillRect(0.0,CAM_H-1.85,0.9,0.55);
      circ(ctx,-1.4,CAM_H-0.35,0.35,'#0b0b0b'); circ(ctx,1.4,CAM_H-0.35,0.35,'#0b0b0b');
      circ(ctx,2.12,CAM_H-1.0,0.16,'#ffffff'); circ(ctx,-2.15,CAM_H-1.0,0.13,'#ff2a2a'); }}
  ]},
 portrait: {
  name:'Portrait', icon:'🙂', ev:13, K:6000, focal:85, focus:'person', desc:'Backlit portrait in a park, sun shining through the trees behind.',
  layers:[
   {id:'backdrop', ground:true, draw(ctx,f){ sky(ctx,'#cfe6f7','#fbf4dd'); groundFill(ctx,'#5f8f3a','#8fb35a'); }},
   {id:'trees', d:30, draw(ctx){ const R=rng(41); ctx.fillStyle='#4d7a34'; ctx.fillRect(-80,-14,160,16);
      for(let i=0;i<60;i++) tree(ctx,(R()-0.5)*150,CAM_H,7+R()*6,2.6,['#3c6b2b','#5a8f3a','#2e5524','#79a84b']);
      for(let i=0;i<140;i++){circ(ctx,(R()-0.5)*150,-5+R()*6,0.12+R()*0.18,R()<0.7?'#fffbe8':'#fff1b8');} }},
   {id:'flowers', d:7, draw(ctx){ const R=rng(43); for(let i=0;i<70;i++){const x=(R()-0.5)*14;ctx.strokeStyle='#3d6e2a';ctx.lineWidth=0.03;ctx.beginPath();ctx.moveTo(x,CAM_H);ctx.lineTo(x,CAM_H-0.4-R()*0.5);ctx.stroke();}
      for(let i=0;i<70;i++){circ(ctx,(R()-0.5)*14,CAM_H-0.5-R()*0.5,0.08,['#f25f5c','#ffe066','#ffffff','#c77dff'][i%4]);}
      ctx.fillStyle='#6b4a2e';ctx.fillRect(3.2,CAM_H-1.0,2.6,0.12);ctx.fillRect(3.3,CAM_H-1.0,0.1,1);ctx.fillRect(5.6,CAM_H-1.0,0.1,1);ctx.fillRect(3.2,CAM_H-1.6,2.6,0.1); }},
   {id:'person', d:2.5, subject:true, shade:0.55, draw(ctx){ const b=0.62; ctx.save();
      ctx.fillStyle='#2f6fa6'; ctx.beginPath(); ctx.moveTo(-0.32,b); ctx.quadraticCurveTo(-0.3,b-0.42,0,b-0.45); ctx.quadraticCurveTo(0.3,b-0.42,0.32,b); ctx.fill();
      ctx.fillStyle='#c48a66'; ctx.fillRect(-0.06,b-0.56,0.12,0.14);
      ctx.fillStyle='#3a2416'; ctx.beginPath(); ctx.ellipse(0,b-0.67,0.13,0.15,0,0,7); ctx.fill(); ctx.fillRect(-0.13,b-0.68,0.26,0.24);
      ctx.fillStyle='#d39b76'; ctx.beginPath(); ctx.ellipse(0,b-0.63,0.095,0.12,0,0,7); ctx.fill();
      circ(ctx,-0.035,b-0.65,0.011,'#2a1a10'); circ(ctx,0.035,b-0.65,0.011,'#2a1a10');
      ctx.strokeStyle='#8a4a3a';ctx.lineWidth=0.01;ctx.beginPath();ctx.arc(0,b-0.6,0.035,0.3,2.8);ctx.stroke();
      ctx.fillStyle='#3a2416'; ctx.beginPath(); ctx.ellipse(0,b-0.73,0.11,0.06,0,Math.PI,0); ctx.fill();
      ctx.strokeStyle='rgba(255,240,200,.9)';ctx.lineWidth=0.012;ctx.beginPath();ctx.ellipse(0,b-0.67,0.135,0.155,0,3.6,5.9);ctx.stroke(); ctx.restore(); }}
  ]},
 sports: {
  name:'Kids sports', icon:'⚽', tilt:0.07, ev:15, K:5500, focal:135, focus:'kid', desc:'A kid sprints across the field (~6 m/s), moving closer and farther.',
  layers:[
   {id:'backdrop', ground:true, draw(ctx,f){ sky(ctx,'#5a9de0','#cfe4f6'); groundFill(ctx,'#3f8f3a','#5aa64c'); const P=projector(f);
      for(let z=4;z<120;z+=8) quad(ctx,P,[[-200,CAM_H,z],[200,CAM_H,z],[200,CAM_H,z+4],[-200,CAM_H,z+4]],'#4c9c43');
      quad(ctx,P,[[-200,CAM_H,40],[200,CAM_H,40],[200,CAM_H,40.3],[-200,CAM_H,40.3]],'#f4f4f4'); }},
   {id:'stands', d:70, draw(ctx){ const R=rng(51); ctx.fillStyle='#9aa3ad'; ctx.fillRect(-120,CAM_H-9,240,9);
      for(let i=0;i<500;i++){circ(ctx,(R()-0.5)*230,CAM_H-8+R()*7,0.3,['#e63946','#f1fa8c','#457b9d','#ffffff','#2a9d8f','#f4a261'][i%6]);}
      for(let i=0;i<20;i++) tree(ctx,-120+i*12.5,CAM_H-9,8,2.5,['#2f6a35','#3f8a44']); }},
   {id:'goal', d:32, draw(ctx){ ctx.strokeStyle='#ffffff'; ctx.lineWidth=0.14; ctx.strokeRect(6,CAM_H-2.44,7.32,2.44); ctx.lineWidth=0.02; ctx.strokeStyle='rgba(255,255,255,.6)';
      for(let x=6;x<13.4;x+=0.3){ctx.beginPath();ctx.moveTo(x,CAM_H-2.44);ctx.lineTo(x,CAM_H);ctx.stroke();} for(let y=CAM_H-2.44;y<CAM_H;y+=0.3){ctx.beginPath();ctx.moveTo(6,y);ctx.lineTo(13.3,y);ctx.stroke();}
      ctx.fillStyle='#ff9f1c';for(const x of [-9,-6,-3]){ctx.beginPath();ctx.moveTo(x,CAM_H);ctx.lineTo(x+0.15,CAM_H-0.4);ctx.lineTo(x+0.3,CAM_H);ctx.fill();} }},
   {id:'kid', d:12, subject:true, move:{v:6,span:1.2}, dist:{amp:4,rate:0.5}, draw(ctx){ const b=CAM_H, h=1.35; ctx.lineCap='round';
      ctx.strokeStyle='#1d3557'; ctx.lineWidth=0.11; ctx.beginPath(); ctx.moveTo(0,b-h*0.5); ctx.lineTo(0.25,b-h*0.25); ctx.lineTo(0.15,b-0.05); ctx.moveTo(0,b-h*0.5); ctx.lineTo(-0.15,b-h*0.27); ctx.lineTo(-0.38,b-h*0.12); ctx.stroke();
      ctx.fillStyle='#e63946'; rr(ctx,-0.17,b-h*0.85,0.34,h*0.4,0.06); ctx.fill(); ctx.fillStyle='#fff'; ctx.font='bold 0.18px sans-serif'; ctx.fillText('7',-0.05,b-h*0.62);
      ctx.strokeStyle='#c98d6b'; ctx.lineWidth=0.08; ctx.beginPath(); ctx.moveTo(0.1,b-h*0.8); ctx.lineTo(0.3,b-h*0.62); ctx.moveTo(-0.1,b-h*0.8); ctx.lineTo(-0.3,b-h*0.68); ctx.stroke();
      circ(ctx,0.02,b-h*0.94,0.11,'#c98d6b'); ctx.fillStyle='#4a2c17'; ctx.beginPath(); ctx.arc(0.02,b-h*0.96,0.115,Math.PI,0); ctx.fill();
      circ(ctx,0.45,b-0.11,0.11,'#ffffff'); ctx.fillStyle='#222'; ctx.beginPath(); ctx.arc(0.45,b-0.11,0.04,0,7); ctx.fill(); }}
  ]}
};
