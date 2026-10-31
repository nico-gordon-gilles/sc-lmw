/* Holo: 3D-Schiffsmodelle von FleetYards.net, live im Browser geladen (siehe CREDITS.md).
   Daten: ./data/fleet.json (taeglicher Spiegel, scripts/fy-mirror.py). Die glTF-Dateien laedt
   der Browser direkt von FleetYards (CORS offen). three.js r128 + GLTFLoader/OrbitControls/
   DRACOLoader liegen unter ./vendor/three und werden erst geladen, wenn wirklich ein Holo
   gezeigt wird. Unofficial fan project, not affiliated with FleetYards, CIG or RSI.
   Oeffentlich:
     fleetData()            -> Promise(fleet.json)
     fleetShip(name)           -> Promise(Schiff|null)  (unser UEX-Name, z.B. "Aegis Avenger Titan")
     holo(el, url, o)   -> haengt ein drehbares Holo in el. Raeumt sich selbst auf, wenn el aus der Seite faellt.
     shipSpecs(fy)      -> HTML-Block mit Daten, Kaufen/Mieten, Loaner und Quellenangabe
     holoMount(root)    -> startet alle .holo-box[data-holo] unter root                      */
(function(){
  // EIN globaler Name: alles Oeffentliche haengt an window.SCLMW, nicht an einzelnen window.xyz-
  // Namen (das war die alte, direkt an mitglieder.html gebundene Fassung). starmap.js ruft diese
  // ueber die SCLMW-Kurzform SC unten auf.
  // One global name: everything public hangs off window.SCLMW, not separate window.xyz names
  // (that was the old version, tied directly to mitglieder.html). starmap.js calls these through
  // the SCLMW short form SC below.
  var SC=window.SCLMW=window.SCLMW||{};
  // Oberflaechen-Sprache, siehe js/i18n.js (dieselben _t/tn-Kurzformen wie in js/starmap.js).
  // UI language, see js/i18n.js (same _t/tn short forms as in js/starmap.js).
  function _t(k,v){ return SC.i18n?SC.i18n.t(k,v):k; }
  function tn(n,o){ return SC.i18n?SC.i18n.num(n,o):String(n); }
  var FLEET=null, SCRIPTS={}, MODELS={}, BASE='./';
  SC.setHoloBase=function(b){ BASE=b||'./'; FLEET=null; };   // von SCLMW.mount() gesetzt, siehe starmap.js
  function norm(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]/g,''); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function load(src){ if(SCRIPTS[src]) return SCRIPTS[src];
    return SCRIPTS[src]=new Promise(function(ok,no){ var s=document.createElement('script'); s.src=src; s.onload=ok; s.onerror=function(){ delete SCRIPTS[src]; no(new Error('Laden fehlgeschlagen: '+src)); }; document.head.appendChild(s); }); }
  function threeCore(){ return window.THREE?Promise.resolve():load(BASE+'vendor/three/three.min.js'); }
  function three(){ return threeCore()
    .then(function(){ return Promise.all([THREE.GLTFLoader?0:load(BASE+'vendor/three/examples/GLTFLoader.js'), THREE.OrbitControls?0:load(BASE+'vendor/three/examples/OrbitControls.js'), THREE.DRACOLoader?0:load(BASE+'vendor/three/examples/DRACOLoader.js')]); }); }
  // FleetYards-Modelle sind Draco-komprimiert: ohne Decoder laedt keins.
  var DRACO=null; function draco(){ if(!DRACO){ DRACO=new THREE.DRACOLoader(); DRACO.setDecoderPath(BASE+'vendor/three/draco/'); } return DRACO; }

  SC.fleetData=function(){ if(!FLEET) FLEET=fetch(BASE+'data/fleet.json',{cache:'force-cache'}).then(function(r){ return r.json(); }).catch(function(){ FLEET=null; return {ships:{},uex:{}}; }); return FLEET; };
  SC.fleetShip=function(name){ return SC.fleetData().then(function(f){ if(!name) return null; var sl=(f.uex||{})[name];
    if(!sl){ var n=norm(name), best=null; Object.keys(f.ships||{}).forEach(function(k){ var s=f.ships[k], a=norm((s.mf||'').split(' ')[0]+s.name), b=norm(s.name); if(n===a||n===b||n===norm((s.mf||'')+s.name)) best=k; }); sl=best; }
    return sl?(f.ships||{})[sl]||null:null; }); };

  function holoScene(src,color,op){ op=op||{}; // eingefaerbte Kopie: halbtransparente Huelle + leuchtende Kanten
    var root=new THREE.Group(), obj=src.clone(true);
    var fill=new THREE.MeshBasicMaterial({color:color||0x2fb8ff,transparent:true,opacity:op.fill||.10,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
    var line=new THREE.LineBasicMaterial({color:color?new THREE.Color(color).lerp(new THREE.Color(0xffffff),.12):0x7fe8ff,transparent:true,opacity:op.line||.55,blending:THREE.AdditiveBlending,depthWrite:false});
    obj.traverse(function(m){ if(m.isMesh){ m.material=fill; if(op.noEdges) return; if(!m.geometry.userData.shipEdges) m.geometry.userData.shipEdges=new THREE.EdgesGeometry(m.geometry,28); var l=new THREE.LineSegments(m.geometry.userData.shipEdges,line); m.add(l); } });
    var box=new THREE.Box3().setFromObject(obj), size=box.getSize(new THREE.Vector3()), c=box.getCenter(new THREE.Vector3());
    obj.position.sub(c); var k=10/Math.max(size.x,size.y,size.z,0.001); root.add(obj); root.scale.setScalar(k);
    return root; }

  // Fuer eigene Szenen (Taktik-Tisch): Holo als Objekt, groesste Kante = 1, zentriert, in Wunschfarbe.
  // SICHERE MODELLWAHL (25.09.2026: Perseus-Vollmodell = 34,8 MB, hat die Seite eingefroren):
  // Standard ist IMMER das leichte Modell /holo/<slug>.glb. Das volle nur auf Wunsch und nur bis 15 MB.
  var SIZE={};
  function sizeOf(url){ if(SIZE[url]!=null) return Promise.resolve(SIZE[url]); return fetch(url,{method:'HEAD'}).then(function(r){ var n=+(r.headers.get('content-length')||0); SIZE[url]=r.ok?(n||1):-1; return SIZE[url]; }).catch(function(){ return SIZE[url]=-1; }); }
  // DIESES Projekt hat keine Pipeline, die ein eigenes leichtes Modell (fy.lo) erzeugt -- die gab
  // es nur auf dem alten Server (eigener Konvertierungsschritt, hier bewusst nicht nachgebaut, um
  // keine eigene Asset-Hosting-Pflicht aufzubauen). fy.lo ist deshalb hier immer leer. modelUrl
  // greift trotzdem sicher zu: es nimmt das volle FleetYards-Modell nur, wenn es unter 15 MB bleibt
  // (siehe Kommentar oben, 25.09.2026: ein 34,8-MB-Vollmodell hat die Seite einfrieren lassen).
  // This project has no pipeline that produces its own light model (fy.lo) -- that only existed on
  // the old server (its own conversion step, deliberately not rebuilt here to avoid an asset-hosting
  // duty of our own). fy.lo is therefore always empty here. modelUrl still stays safe: it only
  // uses the full FleetYards model if it stays under 15 MB (see comment above).
  SC.lowpolyUrl=function(fy){ return fy?(fy.lo||''):''; };
  SC.modelUrl=function(fy,full){ if(!fy) return Promise.resolve(null); var lo=SC.lowpolyUrl(fy);
    if(full&&fy.holo) return sizeOf(fy.holo).then(function(n){ return n>0&&n<=15e6?fy.holo:(lo||null); });
    return lo?sizeOf(lo).then(function(n){ return n>0?lo:null; }):Promise.resolve(null); };
  SC.holoObject=function(url,color,op){ return three().then(function(){
      if(!MODELS[url]) MODELS[url]=new Promise(function(ok,no){ (function(){ var gl=new THREE.GLTFLoader(); gl.setDRACOLoader(draco()); return gl; })().load(url,function(g){ ok(g.scene); },undefined,no); });
      return MODELS[url]; }).then(function(src){
      var g=holoScene(src,color,op||{line:.16,fill:.22}); g.scale.multiplyScalar(0.1); var w=new THREE.Group(); w.add(g); return w; }); };
  SC.loadThreeCore=threeCore;
  SC.loadThree=three;
  SC.holo=function(el, url, o){ o=o||{};
    if(!el||!url) return;
    el.classList.add('holo-on'); el.innerHTML='<div class="holo-msg">'+esc(_t('holo.loading'))+'</div>';
    three().then(function(){
      if(!MODELS[url]) MODELS[url]=new Promise(function(ok,no){ (function(){ var gl=new THREE.GLTFLoader(); gl.setDRACOLoader(draco()); return gl; })().load(url,function(g){ ok(g.scene); },undefined,no); });
      return MODELS[url];
    }).then(function(src){
      if(!el.isConnected) return;
      var w=el.clientWidth||300, h=el.clientHeight||200;
      var r=new THREE.WebGLRenderer({antialias:true,alpha:true}); r.setPixelRatio(Math.min(2,window.devicePixelRatio||1)); r.setSize(w,h);
      el.innerHTML=''; el.appendChild(r.domElement);
      var sc=new THREE.Scene(), cam=new THREE.PerspectiveCamera(35,w/h,0.1,200); cam.position.set(6.6,3.4,8); cam.lookAt(0,0,0);
      var small=el.clientHeight<200, model=holoScene(src,null,small?{line:.1,fill:.08}:{}); sc.add(model);
      var grid=new THREE.PolarGridHelper(7,16,6,48,0x1b6d8f,0x123e52); grid.position.y=-3.2; grid.material.transparent=true; grid.material.opacity=.45; sc.add(grid);
      var ctl=null; if(o.controls!==false){ ctl=new THREE.OrbitControls(cam,r.domElement); ctl.enableDamping=true; ctl.enablePan=false; ctl.minDistance=6; ctl.maxDistance=40; ctl.autoRotate=o.rotate!==false&&!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches); ctl.autoRotateSpeed=1.4; }
      var dead=false, ro=null;
      function stop(){ if(dead) return; dead=true; try{ ro&&ro.disconnect(); ctl&&ctl.dispose(); r.dispose(); r.forceContextLoss&&r.forceContextLoss(); }catch(e){} }
      if(window.ResizeObserver){ ro=new ResizeObserver(function(){ var W=el.clientWidth,H=el.clientHeight; if(W&&H){ r.setSize(W,H); cam.aspect=W/H; cam.updateProjectionMatrix(); } }); ro.observe(el); }
      (function tick(){ if(dead) return; if(!el.isConnected){ stop(); return; } requestAnimationFrame(tick); if(!ctl) model.rotation.y+=0.006; else ctl.update(); r.render(sc,cam); })();
      el._holoStop=stop;
    }).catch(function(){ if(el.isConnected){ el.classList.remove('holo-on'); el.innerHTML=o.fallback||'<div class="holo-msg">'+esc(_t('holo.no_model'))+'</div>'; } });
  };
  SC.holoMount=function(root){ (root||document).querySelectorAll('.holo-box[data-holo]').forEach(function(b){ if(b._holoDone) return; b._holoDone=true; SC.holo(b,b.getAttribute('data-holo'),{fallback:b.getAttribute('data-fallback')?'<img src="'+esc(b.getAttribute('data-fallback'))+'" alt="" style="width:100%;height:100%;object-fit:cover">':''}); }); };

  var STATUS={'flight-ready':'ship.status.flight_ready','in-concept':'ship.status.in_concept','in-production':'ship.status.in_production','announced':'ship.status.announced'};
  var RENTAL={'1-day':'rental.1day','3-days':'rental.3days','7-days':'rental.7days','30-days':'rental.30days'};
  function num(v){ return tn(+v||0); }
  SC.shipSpecs=function(s){ if(!s) return '';
    var rows=[];
    if(s.klasse||s.fokus) rows.push([_t('ship.role'),[s.klasse,s.fokus].filter(Boolean).join(' · ')]);
    if(s.groesse) rows.push([_t('ship.size'),s.groesse+(s.l?' · '+num(s.l)+' × '+num(s.b)+' × '+num(s.h)+' m':'')]);
    if(s.crew&&(s.crew[0]||s.crew[1])) rows.push([_t('ship.crew'),s.crew[0]===s.crew[1]||!s.crew[1]?String(s.crew[0]||s.crew[1]):s.crew[0]+'–'+s.crew[1]]);
    if(s.scu) rows.push([_t('ship.cargo'),num(s.scu)+' SCU']);
    if(s.scm) rows.push([_t('ship.speed'),'SCM '+num(s.scm)+' · max '+num(s.max)+' m/s']);
    if(s.status) rows.push([_t('ship.status'),STATUS[s.status]?_t(STATUS[s.status]):s.status]);
    if(s.pledge) rows.push([_t('ship.pledge_label'),'$'+num(s.pledge)]);
    if(s.preis) rows.push([_t('ship.ingame_price'),num(s.preis)+' aUEC']);
    if(s.loaner&&s.loaner.length) rows.push([_t('ship.loaners'),s.loaner.join(', ')]);
    var shop=function(l,t){ return l&&l.length?'<div class="holo-shops"><b>'+t+'</b>'+l.map(function(x){ return '<span>'+esc(x.ort)+(x.preis?' · '+num(x.preis)+' aUEC'+(x.zeit?' / '+esc(RENTAL[x.zeit]?_t(RENTAL[x.zeit]):x.zeit):''):'')+'</span>'; }).join('')+'</div>':''; };
    return '<div class="iisec holo-specs">'+rows.map(function(x){ return '<div class="iirow"><span>'+esc(x[0])+'</span><b>'+esc(x[1])+'</b></div>'; }).join('')+'</div>'+shop(s.kaufen,esc(_t('ship.buy_ingame')))+shop(s.mieten,esc(_t('ship.rent_ingame')))+
      '<p class="holo-src">'+_t('attribution.model_data',{link:'<a href="'+esc(s.fy||'https://fleetyards.net')+'" target="_blank" rel="noopener">FleetYards.net</a>'})+'</p>'; };

  // Unter .sc-lmw skaliert, wie der Rest der Karte (siehe css/starmap.css): keine Regel greift
  // ausserhalb des eigenen Wurzel-Containers auf die Gastseite durch.
  // Scoped under .sc-lmw like the rest of the map (see css/starmap.css): no rule reaches outside
  // its own root container into the host page.
  if(!document.getElementById('sclmw-holo-style')){
    var st=document.createElement('style'); st.id='sclmw-holo-style';
    st.textContent='.sc-lmw .holo-box{position:relative;width:100%;height:260px;border-radius:14px;overflow:hidden;margin:4px 0 12px;background:radial-gradient(ellipse at 50% 60%,rgba(47,184,255,.14),rgba(4,10,20,.0) 70%),#050b16;border:1px solid rgba(55,225,255,.22);cursor:grab}'+
      '.sc-lmw .holo-box canvas{display:block;width:100%!important;height:100%!important}'+
      '.sc-lmw .holo-box .holo-msg{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#7fe8ff;font-size:.82rem;letter-spacing:.08em}'+
      '.sc-lmw .holo-box.sm{height:150px}'+
      '.sc-lmw .holo-box::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(127,232,255,.035) 0 1px,transparent 1px 3px)}'+
      '.sc-lmw .holo-shops{margin-top:10px;font-size:.82rem;display:flex;flex-direction:column;gap:3px}.sc-lmw .holo-shops b{font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:#9fb2c8;margin-bottom:2px}.sc-lmw .holo-shops span{color:#cdd6e8}'+
      '.sc-lmw .holo-src{font-size:.72rem;color:#7d8ba1;margin:12px 0 0}.sc-lmw .holo-src a{color:#37e1ff}'+
      '.sc-lmw .holo-specs{display:grid;gap:2px;margin:6px 0}.sc-lmw .holo-specs .iirow{display:flex;justify-content:space-between;gap:12px;font-size:.86rem;padding:5px 0;border-bottom:1px solid rgba(120,165,230,.12)}.sc-lmw .holo-specs .iirow span{color:#9fb2c8}.sc-lmw .holo-specs .iirow b{text-align:right;font-weight:600}'+
      '@media (prefers-reduced-motion:reduce){.sc-lmw .holo-box::after{display:none}}';
    document.head.appendChild(st);
  }
})();
