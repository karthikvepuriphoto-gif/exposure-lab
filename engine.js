// Exposure Lab - camera math + WebGL renderer
'use strict';
// ---------- stop scales (index in 1/3 stops) ----------
const SHUTTER_LABELS = ['30"','25"','20"','15"','13"','10"','8"','6"','5"','4"','3.2"','2.5"','2"','1.6"','1.3"','1"','0.8"','0.6"','0.5"','0.4"','0.3"','1/4','1/5','1/6','1/8','1/10','1/13','1/15','1/20','1/25','1/30','1/40','1/50','1/60','1/80','1/100','1/125','1/160','1/200','1/250','1/320','1/400','1/500','1/640','1/800','1/1000','1/1250','1/1600','1/2000','1/2500','1/3200','1/4000','1/5000','1/6400','1/8000'];
const APERTURE_LABELS = ['1.4','1.6','1.8','2','2.2','2.5','2.8','3.2','3.5','4','4.5','5','5.6','6.3','7.1','8','9','10','11','13','14','16','18','20','22'];
const ISO_LABELS = ['100','125','160','200','250','320','400','500','640','800','1000','1250','1600','2000','2500','3200','4000','5000','6400','8000','10000','12800','16000','20000','25600'];
const EC_LABELS = []; for (let i=-9;i<=9;i++){ EC_LABELS.push(fmtStops(i/3,true)); }
const tOf = i => Math.pow(2,(15-i)/3);           // exact seconds (index 0 = 30" nominal = 2^5 exact)
const nOf = j => Math.pow(2,(3+j)/6);            // exact f-number (index 0 = f/1.4)
const isoOf = q => 100*Math.pow(2,q/3);
function fmtStops(x,sign){ const s=x<0?'−':(sign&&x>0?'+':''); const a=Math.abs(x), w=Math.floor(a+1e-6), fr=Math.round((a-w)*3);
  const fs=fr===1?'⅓':fr===2?'⅔':''; return s+(w||!fs?w:'')+fs; }
function shutterIdxFromSec(sec){ let best=0,bd=1e9; for(let i=0;i<SHUTTER_LABELS.length;i++){const d=Math.abs(Math.log2(tOf(i))-Math.log2(sec)); if(d<bd){bd=d;best=i;}} return best; }
function apIdxFromN(n){ return Math.max(0,Math.min(24,Math.round(6*Math.log2(n)-3))); }
function isoIdxFromIso(v){ return Math.max(0,Math.min(24,Math.round(3*Math.log2(v/100)))); }

// ---------- color temperature ----------
function kelvinRGB(K){ const t=K/100; let r,g,b;
  if(t<=66){ r=255; g=99.4708025861*Math.log(t)-161.1195681661; b=t<=19?0:138.5177312231*Math.log(t-10)-305.0447927307; }
  else { r=329.698727446*Math.pow(t-60,-0.1332047592); g=288.1221695283*Math.pow(t-60,-0.0755148492); b=255; }
  const c=v=>Math.pow(Math.max(0,Math.min(255,v))/255,2.2); return [c(r),c(g),c(b)]; }
function wbGains(sceneK,setK){ const a=kelvinRGB(sceneK), b=kelvinRGB(setK); const g=[a[0]/b[0],a[1]/b[1],a[2]/b[2]];
  const l=0.2126*g[0]+0.7152*g[1]+0.0722*g[2]; return g.map(x=>x/l); }

// ---------- physics ----------
const PHYS = { shakeRate:0.05, isStops:4, GN:40, syncSpeed:1/250, diffractionBoost:3 };
function cocPx(f,N,S,D){ // f mm, N, S,D meters -> blur RADIUS in texture px
  const A=f/N, Smm=S*1000, Dmm=D*1000; if(Smm<=f) return 60; const c=A*Math.abs(Dmm-Smm)/Dmm*f/(Smm-f); return Math.min(120,c*TEXW/SENSOR_W/2); }
function diffractionPx(N){ const airy=2.44*0.00055*N*TEXW/SENSOR_W; return Math.max(0,airy*PHYS.diffractionBoost-1.0)/2; }

// ---------- WebGL renderer ----------
const VS=`#version 300 es
in vec2 p; out vec2 v; void main(){ v=p*0.5+0.5; gl_Position=vec4(p,0,1); }`;
const FS_LAYER=`#version 300 es
precision highp float;
uniform sampler2D T; uniform vec2 texSize; uniform vec2 off; uniform float scl; uniform float coc; uniform vec2 mot;
uniform float ground; uniform float cocK; uniform float sDist; uniform float fmm; uniform float horizon; uniform float hmm; uniform float pxmm; uniform float diff;
uniform float blades; uniform float roundness; uniform float expo; uniform float flash; uniform float syncBand; uniform float seed; uniform float accScale; uniform float bD;
in vec2 v; layout(location=0) out vec4 o; layout(location=1) out vec4 pk;
vec4 samp(vec2 uv){ vec2 cc=vec2(0.5,horizon); vec2 s=(uv-cc-off)/scl+cc; if(s.x<0.0||s.y<0.0||s.x>1.0||s.y>1.0) return vec4(0);
  vec4 c=texture(T,s); vec3 l=pow(c.rgb,vec3(2.2)); float m=max(l.r,max(l.g,l.b)); l*=1.0+10.0*smoothstep(0.82,1.0,m); return vec4(l*c.a,c.a); }
void main(){
  float r=coc;
  if(ground>0.5){ float ang=(horizon-v.y)*hmm/fmm; float d= ang>0.0005 ? 1.6/ang : 1e5; r=cocK*abs(d-sDist)/d*pxmm*0.5; r=min(r,120.0); r=sqrt(r*r+diff*diff); }
  float rnd=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233))+seed)*43758.5453);
  int ns = (r<0.6 && length(mot)<0.6) ? 1 : (r+length(mot)<6.0 ? 24 : 56);
  vec4 acc=vec4(0); float sec=6.2831853/blades;
  for(int i=0;i<56;i++){ if(i>=ns) break; float fi=float(i)+0.5; float fn=float(ns);
    vec2 d=vec2(0);
    if(ns>1){ float rr=sqrt(fi/fn); float a=fi*2.39996323+rnd*6.2831853; float am=mod(a,sec)-sec*0.5; float poly=cos(sec*0.5)/cos(am);
      d=vec2(cos(a),sin(a))*rr*r*mix(poly,1.0,roundness); float tl=fract(fi*0.618034+rnd)-0.5; d+=mot*tl; }
    acc+=samp(v+d/texSize); }
  acc/=float(ns);
  float fl = v.y<syncBand ? 0.0 : flash;
  acc.rgb*= (expo+fl)*accScale;
  o=acc;
  // focus peaking: sharp edges of in-focus layers
  float e=0.0; if(r<1.6 && ground<0.5){ vec2 px=1.0/texSize; vec4 a=samp(v+vec2(px.x,0)),b=samp(v-vec2(px.x,0)),c=samp(v+vec2(0,px.y)),dd=samp(v-vec2(0,px.y));
    vec3 g=abs(a.rgb-b.rgb)+abs(c.rgb-dd.rgb); e=smoothstep(0.25,0.6,dot(pow(g,vec3(0.45)),vec3(0.33))); }
  pk=vec4(e,0,0,1)*acc.a;
}`;
const FS_FINAL=`#version 300 es
precision highp float;
uniform sampler2D C; uniform sampler2D P; uniform vec3 wb; uniform float iso; uniform float seed; uniform float raw; uniform float recover; uniform float zebra; uniform float peakOn; uniform float accScale; uniform vec2 res; uniform float vign;
in vec2 v; out vec4 o;
float h(vec2 p,float s){ return fract(sin(dot(p,vec2(127.1,311.7))+s)*43758.5453); }
void main(){
  vec3 c=texture(C,v).rgb/accScale*wb;
  vec2 q=v-0.5; c*=1.0-vign*dot(q,q)*1.2;
  vec2 fc=floor(gl_FragCoord.xy);
  float g1=(h(fc,seed)+h(fc,seed+1.7)+h(fc,seed+3.1)+h(fc,seed+5.3)-2.0)*1.73;
  vec3 gc=vec3(h(fc,seed+7.0),h(fc,seed+9.0),h(fc,seed+11.0))-0.5;
  float lum=max(dot(c,vec3(0.2126,0.7152,0.0722)),0.0);
  float k=0.00015*iso/100.0; float rd=0.0007*sqrt(iso/100.0);
  float sig=sqrt(lum*k+rd*rd);
  c+= vec3(g1)*sig + gc*sig*1.6*clamp(iso/3200.0,0.15,1.0);
  if(raw<0.5){ c=clamp(c,0.0,1.0); c=floor(pow(c,vec3(1.0/2.2))*255.0+0.5)/255.0; c=pow(c,vec3(2.2)); }
  else { c=clamp(c,0.0,2.0); }
  c*=exp2(recover);
  vec3 s=pow(clamp(c,0.0,1.0),vec3(1.0/2.2));
  s=s*s*(3.0-2.0*s)*0.25+s*0.75; // gentle tone curve
  if(zebra>1.5 && max(s.r,max(s.g,s.b))>0.985){ s=vec3(1.0,0.0,0.0); }
  else if(zebra>0.5 && zebra<1.5 && max(s.r,max(s.g,s.b))>0.985){ float st=step(0.5,fract((gl_FragCoord.x+gl_FragCoord.y)/14.0)); s=mix(s,vec3(st),0.75); }
  if(zebra>0.5 && zebra<1.5 && max(s.r,max(s.g,s.b))<0.02){ float st=step(0.5,fract((gl_FragCoord.x-gl_FragCoord.y)/14.0)); s=mix(s,vec3(0.1,0.3,1.0)*st,0.8); }
  float pe=texture(P,v).r*peakOn; s=mix(s,vec3(1.0,0.15,0.1),clamp(pe,0.0,1.0));
  o=vec4(s,1);
}`;

class Renderer {
  constructor(canvas){
    this.cv=canvas; const gl=canvas.getContext('webgl2',{antialias:false,alpha:false,preserveDrawingBuffer:false,powerPreference:'high-performance'});
    if(!gl) throw new Error('WebGL2 not supported'); this.gl=gl;
    this.float = !!gl.getExtension('EXT_color_buffer_float'); this.accScale=this.float?1:0.25;
    this.pL=this.prog(VS,FS_LAYER); this.pF=this.prog(VS,FS_FINAL);
    const b=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,b); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    this.vao=gl.createVertexArray(); gl.bindVertexArray(this.vao); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
    this.tex=[]; this.w=0; this.h=0;
  }
  prog(vs,fs){ const gl=this.gl; const p=gl.createProgram(); for(const [t,s] of [[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]]){const sh=gl.createShader(t);gl.shaderSource(sh,s);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(sh));gl.attachShader(p,sh);}
    gl.bindAttribLocation(p,0,'p'); gl.linkProgram(p); if(!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u={}; const n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS); for(let i=0;i<n;i++){const a=gl.getActiveUniform(p,i);u[a.name]=gl.getUniformLocation(p,a.name);} return {p,u}; }
  setLayers(canvases){ const gl=this.gl; this.tex.forEach(t=>gl.deleteTexture(t)); this.tex=canvases.map(c=>{const t=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE); return t; }); }
  ensure(w,h){ const gl=this.gl; if(w===this.w&&h===this.h) return; this.w=w;this.h=h; this.cv.width=w; this.cv.height=h;
    if(this.fb){gl.deleteFramebuffer(this.fb);gl.deleteTexture(this.ct);gl.deleteTexture(this.pt);}
    const mk=(fmt,type,ifmt)=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,ifmt,w,h,0,fmt,type,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t;};
    this.ct=this.float?mk(gl.RGBA,gl.HALF_FLOAT,gl.RGBA16F):mk(gl.RGBA,gl.UNSIGNED_BYTE,gl.RGBA8); this.pt=mk(gl.RGBA,gl.UNSIGNED_BYTE,gl.RGBA8);
    this.fb=gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER,this.fb); gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,this.ct,0); gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT1,gl.TEXTURE_2D,this.pt,0);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0,gl.COLOR_ATTACHMENT1]); }
  draw(fr){ const gl=this.gl; gl.bindVertexArray(this.vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER,this.fb); gl.viewport(0,0,this.w,this.h); gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    const L=this.pL; gl.useProgram(L.p); const u=L.u;
    gl.uniform2f(u.texSize,TEXW,TEXH); gl.uniform1f(u.cocK,fr.cocK); gl.uniform1f(u.sDist,fr.s); gl.uniform1f(u.fmm,fr.f); gl.uniform1f(u.horizon,fr.horizon); gl.uniform1f(u.hmm,SENSOR_H);
    gl.uniform1f(u.pxmm,TEXW/SENSOR_W); gl.uniform1f(u.diff,fr.diff); gl.uniform1f(u.blades,fr.blades); gl.uniform1f(u.roundness,fr.roundness); gl.uniform1f(u.syncBand,fr.syncBand);
    gl.uniform1f(u.accScale,this.accScale); gl.uniform1f(u.bD,fr.b); gl.uniform1i(u.T,0); gl.activeTexture(gl.TEXTURE0);
    fr.layers.forEach((l,i)=>{ gl.bindTexture(gl.TEXTURE_2D,this.tex[i]); gl.uniform2f(u.off,l.off[0],l.off[1]); gl.uniform1f(u.scl,l.scale); gl.uniform1f(u.coc,l.coc);
      gl.uniform2f(u.mot,l.mot[0],l.mot[1]); gl.uniform1f(u.ground,l.ground?1:0); gl.uniform1f(u.expo,l.expo); gl.uniform1f(u.flash,l.flash); gl.uniform1f(u.seed,fr.seed+i*1.3);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4); });
    gl.disable(gl.BLEND); gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.viewport(0,0,this.w,this.h);
    const F=this.pF; gl.useProgram(F.p); const v=F.u; gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,this.ct); gl.uniform1i(v.C,0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D,this.pt); gl.uniform1i(v.P,1);
    gl.uniform3fv(v.wb,fr.wb); gl.uniform1f(v.iso,fr.iso); gl.uniform1f(v.seed,fr.seed); gl.uniform1f(v.raw,fr.raw?1:0); gl.uniform1f(v.recover,fr.recover);
    gl.uniform1f(v.zebra,fr.zebra||0); gl.uniform1f(v.peakOn,fr.peaking?1:0); gl.uniform1f(v.accScale,this.accScale); gl.uniform1f(v.vign,0.25);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4); gl.activeTexture(gl.TEXTURE0); }
  histogram(){ const gl=this.gl, w=this.w, h=this.h; const px=new Uint8Array(w*h*4); gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,px);
    const H={r:new Uint32Array(64),g:new Uint32Array(64),b:new Uint32Array(64),l:new Uint32Array(64)}; let clipHi=0,clipLo=0,n=0;
    for(let i=0;i<px.length;i+=4*7){ const r=px[i],g=px[i+1],b=px[i+2]; H.r[r>>2]++;H.g[g>>2]++;H.b[b>>2]++; const l=(0.2126*r+0.7152*g+0.0722*b)|0; H.l[l>>2]++; n++;
      if(Math.max(r,g,b)>=252) clipHi++; if(Math.max(r,g,b)<=4) clipLo++; }
    H.clipHi=clipHi/n; H.clipLo=clipLo/n; return H; }
}
