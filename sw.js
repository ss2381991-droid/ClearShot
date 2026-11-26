/* Offline support. Only touches caches that start with "clearshot-", because other apps can share the same web address. */
const VERSION='clearshot-1a57129b65', AI='clearshot-ai-v1';
const FILES=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES.map(f=>new Request(f,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('clearshot-')&&k!==VERSION&&k!==AI).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
const keep=async(name,req,res)=>{if(res.ok){const c=await caches.open(name);await c.put(req,res.clone())}return res};
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.href.startsWith('https://cdn.jsdelivr.net/npm/@mediapipe/')){
    e.respondWith(caches.open(AI).then(c=>c.match(req)).then(hit=>hit||fetch(req).then(res=>keep(AI,req,res))));return}
  if(url.origin!==location.origin||!url.href.startsWith(self.registration.scope))return;
  /* Newest copy when online, saved copy when offline */
  e.respondWith(fetch(req,{cache:'no-cache'}).then(res=>keep(VERSION,req,res)).catch(()=>caches.open(VERSION).then(c=>c.match(req,{ignoreSearch:true}).then(hit=>hit||c.match('./')))));
});
