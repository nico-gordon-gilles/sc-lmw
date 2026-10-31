/* SC LMW shell. Same-origin pages and files stay available offline after one visit.
   Room APIs and other sites are left to the network. */
var CACHE = 'sclmw-pwa-1';
var SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './config.js',
  './favicon.ico',
  './css/starmap.css',
  './js/i18n.js',
  './js/icons.js',
  './js/loc.js',
  './js/holo.js',
  './js/guides.js',
  './js/planet-tex.js',
  './js/starmap.js',
  './js/room.js',
  './js/history.js',
  './js/sc-lmw.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/made-by-the-community.png',
  './vendor/three/three.min.js',
  './vendor/three/examples/OrbitControls.js',
  './vendor/three/examples/GLTFLoader.js',
  './vendor/three/examples/DRACOLoader.js',
  './vendor/three/draco/draco_wasm_wrapper.js'
];

self.addEventListener('install', function(event){
  event.waitUntil(caches.open(CACHE).then(function(cache){
    return Promise.all(SHELL.map(function(url){
      return cache.add(url).catch(function(){});
    }));
  }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener('activate', function(event){
  event.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(key){ return key!==CACHE; }).map(function(key){ return caches.delete(key); }));
  }).then(function(){ return self.clients.claim(); }));
});

function sameOrigin(url){
  return url.origin===self.location.origin;
}

function networkFirst(req){
  return fetch(req).then(function(res){
    if(res && res.ok){
      var copy = res.clone();
      caches.open(CACHE).then(function(cache){ cache.put(req, copy); });
    }
    return res;
  }).catch(function(){
    return caches.match(req).then(function(hit){
      if(hit) return hit;
      if(req.mode==='navigate') return caches.match('./index.html');
      return new Response('', {status:504, statusText:'offline'});
    });
  });
}

self.addEventListener('fetch', function(event){
  var req = event.request;
  if(req.method!=='GET') return;
  var url;
  try{ url = new URL(req.url); }catch(e){ return; }
  if(!sameOrigin(url)) return;
  if(url.pathname.indexOf('/api/')!==-1) return;
  event.respondWith(networkFirst(req));
});
