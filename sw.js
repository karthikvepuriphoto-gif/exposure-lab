const CACHE='exposure-lab-v5';
const ASSETS=['./','index.html','style.css?v=5','scenes.js?v=5','engine.js?v=5','app.js?v=5','ui.js?v=5','content.js?v=5','manifest.webmanifest','icons/icon-180.png','icons/icon-192.png','icons/icon-512.png','icons/icon-192-maskable.png','icons/icon-512-maskable.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{ if(e.request.method!=='GET') return;
  e.respondWith(caches.match(e.request,{ignoreSearch:e.request.mode==='navigate'}).then(r=>r||fetch(e.request).then(res=>{ if(res.ok&&(res.type==='basic'||res.type==='cors')){const cp=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));} return res; }).catch(()=>e.request.mode==='navigate'?caches.match('index.html'):undefined))); });
