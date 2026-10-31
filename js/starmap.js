/* Live Map: an interactive 3D star map for the Star Citizen "Stanton" universe
 * (Stanton, Pyro, Nyx: systems, planets, moons, stations, jump points, search
 * across locations/ores/items/ships/commodities/blueprints/missions, live UEX
 * prices, live FleetYards 3D ship models, and player positions from a URL you
 * configure yourself, see config.js and docs/PLAYERS_API.md).
 *
 * Unofficial fan project. Not affiliated with or endorsed by Cloud Imperium
 * Games or Roberts Space Industries. Star Citizen(R) is a trademark of Cloud
 * Imperium Rights LLC. See CREDITS.md for all data/asset sources and licenses.
 *
 * Diese Datei ist ein inoffizielles Fan-Projekt und steht in keiner Verbindung
 * zu Cloud Imperium Games oder Roberts Space Industries.
 *
 * Call initLiveMap() once the DOM is ready (see index.html). It creates its
 * own fullscreen <canvas>, loads three.js via holo.js's loader, and mounts
 * the map UI. No login, no backend of ours required.
 */
(function(){
'use strict';
function esc(s){ return (s||'').replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
// ROOT ist der Mount-Container (siehe SCLMW.mount() unten): alle DOM-Ids sind mit einem Praefix
// eindeutig, koennen also weiter per document.getElementById gefunden werden, egal wo im Baum
// ROOT haengt. Neue Panels/Ueberlagerungen haengen sich an ROOT an, NIE an document.body --
// das waere die Gastseite. BASE ist der Basispfad fuer data/, vendor/three/, ... (SCLMW.mount()
// bzw. das eigene <script data-base> setzen ihn), damit die Karte unter jedem URL-Pfad laeuft.
// ROOT is the mount container (see SCLMW.mount() below): all DOM ids are unique via a prefix, so
// they can still be found with plain document.getElementById no matter where in the tree ROOT
// lives. New panels/overlays attach to ROOT, NEVER to document.body -- that would be the host
// page. BASE is the base path for data/, vendor/three/, ... (set by SCLMW.mount() or the script
// tag's data-base), so the map works under any URL path.
let ROOT=null, BASE='./';
function ID(name){ return 'sclmw-'+name; }
function $(id){ return document.getElementById(id.indexOf('sclmw-')===0?id:ID(id)); }
function pathOf(rel){ return BASE+rel; }
function rootW(){ return (ROOT&&ROOT.clientWidth)||window.innerWidth||999; }
// SC ist holo.js' Namensraum (siehe js/holo.js): fleetShip/holoMount/loadThree/... haengen dort,
// nicht als eigene window.xyz-Namen -- "ein globaler Name" gilt fuer beide Dateien zusammen.
// SC is holo.js' namespace (see js/holo.js): fleetShip/holoMount/loadThree/... live there, not
// as separate window.xyz names -- "one global name" covers both files together.
const SC=window.SCLMW=window.SCLMW||{};
// Fuer js/guides.js: Kartendaten, Basispfad, Kameraflug / for js/guides.js: map data, base path, camera flight
SC.data=()=>ST_DATA; SC.basePath=()=>BASE; SC.flyTo=o=>{ if(window.__stCtl) window.__stCtl.flyTo(o); };
// Oberflaechen-Sprache (js/i18n.js, EIGENSTAENDIG von ST_LANG unten -- das bleibt die alte
// Spieltexte-Umschaltung). t()/tn() sind kurze Aufrufe fuer den ganzen Rest dieser Datei.
// UI language (js/i18n.js, SEPARATE from ST_LANG below -- that stays the old game-text toggle).
// t()/tn() are short calls used throughout the rest of this file.
// _t/tn statt "t": "t" ist in dieser Datei ueberall als lokaler Variablenname belegt
// (Kurven-Parameter, Zeit, Tests...) -- ein globales "t" wuerde davon ueberdeckt.
// _t/tn instead of "t": "t" is used everywhere in this file as a local variable name
// (curve parameter, time, tests...) -- a global "t" would get shadowed by those.
const _t=(k,v)=>(SC.i18n?SC.i18n.t(k,v):k), tn=(n,o)=>(SC.i18n?SC.i18n.num(n,o):String(n));
// Game names (places, ships, items, missions). English stays in the data; js/loc.js swaps in Chinese.
const gn=s=>SC.loc?SC.loc.text(s):s;
// UEX writes "Hangar L" and "Pharmacy - Stanton Gateway (Nyx)". The game pack uses
// "Hangar (L)" and translates the shop and the place separately.
const ST_NAME_ALIAS={
  'Hangar S':'Hangar (S)','Hangar M':'Hangar (M)','Hangar L':'Hangar (L)','Hangar XL':'Hangar (XL)',
  'Landing Pad S':'Landing Pad (S)','Landing Pad M':'Landing Pad (M)','Landing Pad L':'Landing Pad (L)','Landing Pad XL':'Landing Pad (XL)',
  'Buy Ship Items and Weapons':'Buy Ship Items/Weapons','Buy and Rent Vehicles':'Buy/Rent Vehicles',
  'Area 18':'Area18','Seraphim':'Seraphim Station',
  "Ellroy's":"Ellroy's Coffee",'Medical Shop':'Medical_Shop'
};
const ST_NAME_OFFICIAL={
  'Cargo Center':{hans:'货运中心',hant:'貨運中心'}
};
function officialName(s){
  var row=ST_NAME_OFFICIAL[s]; if(!row) return '';
  var lang=SC.i18n&&SC.i18n.lang;
  if(lang==='zh-Hans') return row.hans;
  if(lang==='zh-Hant') return row.hant;
  return '';
}
function gnBit(s){
  s=String(s||'').trim();
  if(!s) return s;
  var z=gn(s);
  if(z && z!==s) return z;
  var al=ST_NAME_ALIAS[s];
  if(al){ z=gn(al); if(z && z!==al) return z; }
  var off=officialName(s);
  if(off) return off;
  var m=s.match(/^(.*)\s+\(([^)]+)\)\s*$/);
  if(m){
    var a=gnBit(m[1]), b=gnBit(m[2]);
    if(a!==m[1].trim() || b!==m[2].trim()) return a+' ('+b+')';
  }
  return s;
}
function gnLine(s){
  if(s==null || s==='') return s;
  var raw=String(s).replace(/\s+[–—-]\s+/g,' - ').replace(/[ \t]+/g,' ').trim();
  var whole=gn(raw);
  if(whole && whole!==raw) return whole;
  if(raw.indexOf(' - ')>=0){
    var orig=raw.split(' - '), parts=orig.map(gnBit);
    if(parts.some(function(p,i){ return p!==orig[i].trim(); })) return parts.join(' - ');
    return s;
  }
  var bit=gnBit(raw);
  return bit!==raw ? bit : s;
}
SC.gnLine=gnLine;
function translated(s){ if(s==null||s==='') return ''; var hit=gn(s); return (hit && hit!==String(s)) ? hit : ''; }
function playerPlaceName(p){
  if(!p) return '';
  var direct=translated(p.location); if(direct) return direct;
  var loc=stPlayerLoc(p);
  if(loc&&loc.n){ var named=translated(loc.n); if(named) return named; if(String(loc.n)!==String(p.location||'')) return gn(loc.n); }
  return p.location?gn(p.location):'';
}

// Galaxie: alle drei Systeme in einem Raum, Lage aus der RSI-Sternenkarte (1 Lichtjahr = ST_K Einheiten).
// Ebene "sys": 1 Einheit = 1 Mio km, Planeten und alles am Stern an der echten Position.
// Ebene "body": 1 Einheit = Radius des Planeten/Monds, Oberflaeche und Stationen echt, Mondabstaende gestaucht.
const ST_KIND={
  star:{c:'#fff2c0',l:'Stern'}, planet:{c:'#cfe0ee',l:'Planet'}, moon:{c:'#a9b4c4',l:'Mond'},
  city:{c:'#ffd76a',l:'Stadt'}, station:{c:'#37e1ff',l:'Station'}, reststop:{c:'#5ab8ff',l:'Raststation (Lagrange)'},
  gateway:{c:'#b072ff',l:'Gateway'}, jump:{c:'#ff7a3d',l:'Sprungpunkt'}, wikelo:{c:'#ff62ab',l:'Wikelo'},
  outpost:{c:'#38d39f',l:'Außenposten'}, miningbase:{c:'#e0a458',l:'Mining-Basis'}, lagrange:{c:'#c8b08a',l:'Asteroidenfeld (Lagrange)'},
  halo:{c:'#9c8b76',l:'Asteroidengürtel'}, comm:{c:'#8a9ab8',l:'Comm-Array'}, poi:{c:'#f0f0f0',l:'Ort von Interesse'},
  asteroid:{c:'#8a8070',l:'Einzel-Asteroid'}, belt:{c:'#b8ad9c',l:'Asteroidengürtel (Ort)'}, player:{c:'#4dff9a',l:'Spieler'}
};
// ST_KIND.l ist der interne (deutsche) Schluessel, NIE direkt anzeigen -- kindLabel() uebersetzt
// ihn live in die aktuelle Oberflaechensprache (siehe kind.* in js/i18n.js).
// ST_KIND.l is the internal (German) key, NEVER shown directly -- kindLabel() translates it live
// into the current UI language (see kind.* in js/i18n.js).
function kindLabel(k){ return ST_KIND[k]?_t('kind.'+k):k; }
const ST_MARK={planet:'mkplanet',moon:'mkmoon',city:'mkcity',station:'mkstation',reststop:'mkrest',gateway:'mkgate',jump:'mkjump',wikelo:'mkwikelo',outpost:'mkout',miningbase:'mkmine',lagrange:'mklag',halo:'mkhalo',comm:'mkcomm',poi:'mkpoi',asteroid:'mkrock',belt:'mkbelt',player:'mklive'};
function sigil(name,color,motion){ return '<i class="st-mk'+(motion?' '+motion:'')+'" style="color:'+color+'">'+(SC.ico?SC.ico(name):'')+'</i>'; }
function kindMark(k){ const c=(ST_KIND[k]||{}).c||'#cfe0ee', motion=k==='jump'?'mk-jump':(k==='comm'?'mk-comm':(k==='gateway'?'mk-gate':'')); return sigil(ST_MARK[k]||'mkpoi', c, motion); }
const ST_K=8, ST_PULL=0.35;
const ST_IRREG={Delamar:2.7};   // Koerper, die als Asteroid statt Kugel gezeichnet werden (Wert = Form-Saat)
let ST_SYS='stanton';
const ST_THEME_SYS={amber:'stanton',red:'pyro',cyan:'nyx'};
const ST_SYSLOOK={
  stanton:{star:0xfff2c0,glow:0xffffff,light:0xfff2d0,belt:0x9c8b76,nebOp:.10,neb:[0x8a5aff,0x2ec6ff,0xff5aa0,0x5affc0,0x9a7aff,0x4ac6ff],sky:[0x8a5aff,0x2ec6ff,0xff5aa0,0x5affc0,0x9a7aff,0x6a7aff,0xff7ac0,0x4ac6ff,0xb06aff,0x7affd0],dot:'#ffb347'},
  pyro:{star:0xffb070,glow:0xff8a40,light:0xffb080,belt:0xa0705a,nebOp:.5,skyOp:.62,neb:[0xff4a2a,0xff8a3d,0xff2a3a,0xffa040,0xc4162a,0xff6a2a,0xe03a1a,0xffc060],sky:[0xff4a2a,0xff8a3d,0xff2a3a,0xffa040,0xc4162a,0xff6a2a,0xe03a1a,0xffc060,0xa02a1a,0xff7a4a],dot:'#ff5a4d'},
  nyx:{star:0xd8e8ff,glow:0x9ccaff,light:0xd0e4ff,belt:0x9ab0c0,nebOp:.3,skyOp:.5,neb:[0x2ec6ff,0x2affd0,0x4a7aff,0x6affea,0x1a9aff,0x3ad8ff,0x2a8aff,0x5affc8],sky:[0x2ec6ff,0x2affd0,0x4a7aff,0x6affea,0x1a9aff,0x3ad8ff,0x2a8aff,0x5affc8,0x1a6aff,0x7affe0],dot:'#37e1ff'}};
const ST_PSIZE={Hurston:.42,Crusader:.78,ArcCorp:.48,microTech:.54};
const ST_LOOK={Hurston:['#8a6146',0],Crusader:['#d9c088',1],ArcCorp:['#b8483a',0],microTech:['#cfe0ee',0],
  Arial:['#b0603a',0],Aberdeen:['#b9a24a',0],Magda:['#8a8a92',0],Ita:['#9c8c7a',0],Cellin:['#8f8f86',0],Daymar:['#c7a878',0],
  Yela:['#dfe8f2',0],Lyria:['#c9d8e8',0],Wala:['#a89c8c',0],Calliope:['#d8e4ef',0],Clio:['#c4d6e6',0],Euterpe:['#e6eef5',0],
  'Pyro I':['#8a4a32',0],Monox:['#c9a45a',0],Bloom:['#6f8a52',0],'Pyro IV':['#b07050',0],'Pyro V':['#e0a060',1],Terminus:['#8a8f9a',0],
  Ignis:['#b86a3a',0],Vatra:['#9a8a7a',0],Adir:['#a09080',0],Fairo:['#c8b8a0',0],Fuego:['#c0603a',0],Vuur:['#a07058',0],
  Delamar:['#5a544c',0],'Nyx I':['#6a7a8a',0],'Nyx II':['#8aa0b0',0],'Nyx III':['#b0c8d8',0]};
const ST_PRIO={player:2,belt:2,star:3,planet:3,gateway:2,moon:2,city:2,station:2,reststop:2,jump:2,wikelo:2,lagrange:1,poi:1,outpost:1,miningbase:0,comm:0,asteroid:0};
let ST_DATA=null, ST_DATA_ERR=false, ST_HID=false, ST_PAUSE=false; const ST_VIS={};
let ST_LANG='en';
function syncGameLang(){
  const ui=SC.i18n&&SC.i18n.lang;
  ST_LANG=ui==='de'?'de':'en';
  try{ localStorage.setItem('livemap_lang', ST_LANG); }catch(e){}
}
const ST_AM_DE={'Buy Armor':'Rüstung kaufen','Buy Clothing':'Kleidung kaufen','Buy Ship Items and Weapons':'Schiffsteile & -waffen','Buy Weapons':'Waffen kaufen',
  'Buy and Rent Vehicles':'Fahrzeuge kaufen & mieten','Rent Vehicles':'Fahrzeuge mieten','Clinic':'Klinik','Hospital':'Krankenhaus','Docking':'Andocken',
  'Commodity Trading - Freight Elevator':'Warenhandel (Frachtaufzug)','Commodity Trading - Loading Dock':'Warenhandel (Ladedock)','Food Court':'Essen & Trinken',
  'Garage':'Garage','Hangar L':'Hangar L','Hangar XL':'Hangar XL','Landing Pad L':'Landeplatz L','Landing Pad M':'Landeplatz M','Refinery':'Raffinerie','Vehicle Services':'Fahrzeugservice'};
Object.keys(ST_KIND).forEach(k=>ST_VIS[k]=k!=='asteroid');
async function stLoad(){ if(ST_DATA) return ST_DATA;
  const js=u=>fetch(u,{cache:'no-cache'}).then(r=>{ if(!r.ok) throw new Error(u+' '+r.status); return r.json(); });
  const gal=await js(pathOf('data/galaxy.json')); const parts=await Promise.all(gal.systems.map(s=>js(pathOf('data/sys-'+s.k+'.json'))));
  const objects=[], mining={}, nofix={}, by={}, kids={}, sys={}; const base=gal.systems.find(s=>s.k==='stanton')||gal.systems[0];
  parts.forEach((d,i)=>{ const s=gal.systems[i]; d.objects.forEach(o=>{ o.sy=s.k; objects.push(o); }); Object.assign(mining,d.mining); Object.assign(nofix,d.nofix||{});
    sys[s.k]={k:s.k,n:s.n,img:s.img,d:s.d,dde:s.dde,star:d.objects.find(o=>o.k==='star'),
      off:[(s.ly[0]-base.ly[0])*ST_K,(s.ly[2]-base.ly[2])*ST_K,-(s.ly[1]-base.ly[1])*ST_K]}; });
  // Darstellung: Stanton um ST_PULL naeher an Pyro/Nyx geschoben (Nicos Wunsch), innerhalb der Systeme bleibt alles echt
  const oth=Object.values(sys).filter(s=>s.k!=='stanton'); if(sys.stanton&&oth.length){ const m=[0,1,2].map(i=>oth.reduce((a,s)=>a+s.off[i],0)/oth.length); sys.stanton.off=sys.stanton.off.map((v,i)=>v+(m[i]-v)*ST_PULL); }
  objects.forEach(o=>{ by[o.id]=o; }); objects.forEach(o=>{ if(o.p&&by[o.p]) (kids[o.p]=kids[o.p]||[]).push(o); });
  ST_DATA={d:{objects,mining,nofix,version:parts[0].version},by,kids,sys,gal,get star(){ return (sys[ST_SYS]||sys.stanton).star; }}; return ST_DATA; }
const stSysName=o=>{ const n=(ST_DATA&&o&&ST_DATA.sys[o.sy]||{}).n||''; return n?gn(n):''; };
function stMineLabel(k){ if(k==='HPP_AaronHalo') return 'Aaron Halo'; if(k==='AsteroidCluster_Medium_Yield') return _t('mine.asteroid_cluster_medium'); if(k==='AsteroidCluster_Low_Yield') return _t('mine.asteroid_cluster_low'); if(k==='HPP_Lagrange_Occupied') return _t('mine.lagrange_occupied'); if(k==='HPP_Stanton2c_Belt') return _t('mine.yela_belt');
  let m=k.match(/^HPP_Lagrange_(\w+)$/); if(m) return _t('mine.lagrange_type',{type:m[1]}); if(/^HPP_(Stanton|Pyro)\d/.test(k)) return _t('mine.surface'); if(k==='HPP_Pyro_DeepSpaceAsteroids') return _t('mine.deep_space_asteroids'); if(k==='HPP_Pyro_AkiroCluster') return 'Akiro Cluster';
  if(k==='HPP_Nyx_KeegerBelt') return 'Keeger Belt'; if(k==='HPP_Nyx_GlaciemRing') return 'Glaciem Ring'; m=k.match(/^HPP_Pyro_(Cool|Warm)0?(\d+)$/); if(m) return _t('mine.lagrange_temp',{temp:_t(m[1]==='Cool'?'mine.cold':'mine.warm'),n:m[2]});
  m=k.match(/^Loot_Caves_(Occupied|Unoccupied)_(Rock|Sand|Acidic)/); if(m) return _t('mine.cave',{material:_t({Rock:'mine.rock',Sand:'mine.sand',Acidic:'mine.acidic'}[m[2]]),occ:m[1]==='Occupied'?_t('mine.occupied_suffix'):''});
  return k.replace(/_/g,' '); }
const ST_TY_DE={'Mercenary':'Söldner','Hauling - Planetary':'Fracht (Planet)','Delivery':'Lieferung','Hauling':'Fracht','Bounty Hunter':'Kopfgeldjagd',
  'Priority':'Priorität','Investigation':'Ermittlung','Ship Mining':'Schiffs-Mining','Salvage':'Bergung','Refueling':'Betankung','Courier':'Kurier',
  'Hauling - Interstellar':'Fracht (interstellar)','Hauling - Stellar':'Fracht (System)','Hauling - Local':'Fracht (lokal)','Maintenance':'Wartung',
  'Hand Mining':'Hand-Mining','Ground Vehicle Mining':'ROC-Mining','Search':'Suche','Racing':'Rennen','Research':'Forschung','ECN Alert':'ECN-Alarm',
  'Appointment':'Termin','Job':'Job','Collection':'Sammeln'};
const stTy=t=>{ const z=gn(t); if(z!==t) return z; return ST_LANG==='de'?(ST_TY_DE[t]||t):t; };
let ST_MIS=null;
// Alle Blueprints mit Rezept (blueprints-build.py aus den Spieldaten). Laedt erst, wenn jemand Blueprints ansieht.
let ST_BPS=null;
async function stBps(){ if(ST_BPS) return ST_BPS; try{ ST_BPS=await fetch(pathOf('data/blueprints.json'),{cache:'no-cache'}).then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); }); }catch(e){ return {bps:{}}; } return ST_BPS; }
async function stMis(){ if(ST_MIS) return ST_MIS; try{ const d=await fetch(pathOf('data/missions.json'),{cache:'no-cache'}).then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); }); const byLoc={};
  d.groups.forEach((g,i)=>g.locs.forEach(id=>(byLoc[id]=byLoc[id]||[]).push(i))); ST_MIS={d,byLoc}; return ST_MIS; }catch(e){ return {d:{groups:[],bps:{},lsets:[]},byLoc:{},failed:1}; } }
function stMisRow(g,i){ return '<details class="st-dep"><summary><b>'+esc(stTy(g.ty))+'</b>'+(g.il?'<em class="t-ill">'+esc(_t('tag.illegal'))+'</em>':'')+'<span title="'+esc(_t('tooltip.mission_variants'))+'">'+g.n+'×</span></summary><div class="st-mis-b"><div class="sc-lmw-muted">'+esc(gn(g.g))+(g.bp?' · 🧩 '+g.bp.length+' '+esc(_t('cat.bp')):'')+'</div>'+(g.t.length?g.t.map(t=>'<div>· '+esc(gn(t))+'</div>').join(''):'')+'</div></details>'; }
// ---- SPIELER: Position/Status kommen aus einer externen, konfigurierbaren Quelle (window.LIVEMAP_CONFIG.PLAYERS_URL). Siehe docs/PLAYERS_API.md. ----
let ST_PL=null, ST_PL_ERR='', ST_PL_ON=true, ST_PL_OFF=true, ST_PL_SIG='';
let ST_VIEW='stanton';
const ST_PL_OTHER_KEY='sclmw_pl_other';
let ST_PL_OTHER={on:false, off:false};
(function(){ try{ const s=JSON.parse(localStorage.getItem(ST_PL_OTHER_KEY)||'null'); if(s&&typeof s==='object'){ ST_PL_OTHER.on=!!s.on; ST_PL_OTHER.off=!!s.off; } }catch(e){} })();
function savePlOther(){ try{ localStorage.setItem(ST_PL_OTHER_KEY, JSON.stringify({on:!!ST_PL_OTHER.on, off:!!ST_PL_OTHER.off})); }catch(e){} }
function stOtherFaded(sys, online){ if(!ST_VIEW||!sys||sys===ST_VIEW) return false; return online? !ST_PL_OTHER.on : !ST_PL_OTHER.off; }
async function stLoadPlayers(){ try{ const cfg=window.LIVEMAP_CONFIG||{};
    const r=await fetch(cfg.PLAYERS_URL||pathOf('players.example.json'),{headers:cfg.PLAYERS_HEADERS||{},cache:'no-store'});
    if(!r.ok) throw new Error(r.status);
    const d=await r.json(); ST_PL=d.players||[]; ST_PL_ERR=''; }catch(e){ ST_PL_ERR='Spielerdaten gerade nicht erreichbar.'; if(!ST_PL) ST_PL=[]; }
  const sig=JSON.stringify(ST_PL.map(p=>[p.id,p.online,p.code,p.ship])); const ch=sig!==ST_PL_SIG; ST_PL_SIG=sig; return ch; }
const ST_ABBR={HUR:'Stanton1',CRU:'Stanton2',ARC:'Stanton3',MIC:'Stanton4'};
function stPlayerLoc(p){ const D=ST_DATA; if(!D||!p) return null; const nm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const foldCode=s=>String(s||'').trim().replace(/[\s-]+/g,'_').replace(/_+/g,'_').replace(/^RR_S([1-4])_/i,(m,n)=>'RR_'+['HUR','CRU','ARC','MIC'][n-1]+'_');
  let code=foldCode(p.code); const locCode=foldCode(p.location); if(!code && /^RR_/i.test(locCode)) code=locCode;
  const low=code.toLowerCase();
  if(!D.tagIdx){ D.tagIdx={}; D.nameIdx={}; D.d.objects.forEach(o=>{ if(o.tag&&!D.tagIdx[o.tag.toLowerCase()]) D.tagIdx[o.tag.toLowerCase()]=o; const k=nm(o.n); if(k&&!D.nameIdx[k]&&!o.h) D.nameIdx[k]=o; }); }
  // System ZUERST aus dem Ortscode: das vom Tool gemeldete 'system' ist unzuverlaessig (RR_P6_LEO kam als 'Stanton' -> Spieler in der Sonne von Stanton)
  const sysOf=()=>{ const c=low.startsWith('pyro')||/^rr_p\d/.test(low)?'pyro':(low.startsWith('nyx')?'nyx':(low.startsWith('stanton')||/^rr_(hur|cru|arc|mic)/.test(low)?'stanton':'')); if(c) return c; const s=nm(p.system); return D.sys[s]?s:''; };
  const sy=sysOf();
  // 1) Klartext-Name. Derselbe Name kann in zwei Systemen stehen (Stanton Gateway in Pyro und Nyx).
  { const k=nm(p.location); if(k){ const all=D.d.objects.filter(o=>!o.h&&nm(o.n)===k); const inSys=sy?all.filter(o=>o.sy===sy):all; if(inSys.length) return inSys[0]; if(all.length===1) return all[0]; } }
  // 2) Ort hinter dem Unterstrich (Stanton4_NewBabbage, Nyx_Levski)
  // Lagrange codes name the hidden asteroid field first. The rest stop at the same point is the mark on the map.
  let m2=code.match(/^RR_(HUR|CRU|ARC|MIC)_L(\d)$/i); if(m2){ const o=D.d.objects.find(x=>x.k==='reststop'&&!x.h&&x.n.toUpperCase().startsWith(m2[1].toUpperCase()+'-L'+m2[2])); if(o) return o; }
  const m1=code.match(/^[A-Za-z]+\d*[a-z]?_(.+)$/); if(m1){ const o=D.tagIdx[m1[1].toLowerCase()]||D.nameIdx[nm(m1[1].replace(/([a-z])([A-Z])/g,'$1 $2'))]; if(o&&!o.h) return o; }
  // 3) Orbit-Stationen: RR_CRU_LEO, RR_P2_L4, RR_JP_PyroStanton
  m2=code.match(/^RR_(HUR|CRU|ARC|MIC)_LEO$/i); if(m2){ const tag=ST_ABBR[m2[1].toUpperCase()].toLowerCase(); const pl=D.d.objects.find(x=>x.k==='planet'&&String(x.tag||'').toLowerCase()===tag); const o=pl&&(D.kids[pl.id]||[]).find(x=>x.k==='station'&&!x.h); if(o) return o; }
  // Kennung 'pyroN' tragen auch alle Aussenposten des Planeten: gezielt den PLANETEN nehmen, nicht den ersten Treffer
  const pyPl=n=>D.d.objects.find(x=>x.k==='planet'&&String(x.tag||'').toLowerCase()==='pyro'+n);
  m2=code.match(/^RR_P(\d)_L(\d)$/i); if(m2){ const o=D.d.objects.find(x=>x.sy==='pyro'&&x.n.toUpperCase()==='PYR'+m2[1]+' L'+m2[2]); if(o) return o; const pl=pyPl(m2[1]); if(pl) return pl; }
  m2=code.match(/^RR_P(\d)_LEO$/i); if(m2){ const pl=pyPl(m2[1]); const o=pl&&D.d.objects.find(x=>x.p===pl.id&&x.k==='station'); if(o) return o; if(pl) return pl; }
  m2=code.match(/^RR_JP_([A-Z][a-z]+)([A-Z][a-z]+)$/); if(m2){ const here=(sy||m2[1].toLowerCase()), other=[m2[1],m2[2]].find(s=>s.toLowerCase()!==here)||m2[2]; const o=D.d.objects.find(x=>x.sy===here&&x.k==='gateway'&&x.n===other+' Gateway'); if(o) return o; }
  // 3b) GrimHEX & Co.: der ganze Code ist der Name
  { const o=D.nameIdx[nm(code)]; if(o&&(!sy||o.sy===sy)) return o; }
  // 3c) Sprungpunkt ohne Gateway (Stanton-Magnus, Nyx-Castra): der Sprungpunkt selbst
  { const mj=code.match(/^RR_JP_([A-Z][a-z]+)([A-Z][a-z]+)$/); if(mj){ const here=mj[1].toLowerCase(), to=mj[2].toLowerCase(); const o=D.d.objects.find(x=>x.sy===here&&/jump|poi|gateway/.test(x.k)&&x.n.toLowerCase().includes(to)); if(o) return o; } }
  // 4) Name aus den Teilen der Kennung (Stanton4a_RayariHydro_Kaltag -> Rayari Kaltag Research Outpost, Outpost_PAF_Stanton2b_Attritus_2 -> Attritus PAF-II)
  const body=stBodyFromCode(D,low), fz=stFuzzyLoc(D,code,sy||(body&&body.sy)||'',body); if(fz) return fz;
  // 5) sonst der Planet/Mond aus der Kennung (nie ein Aussenposten, der zufaellig dieselbe Kennung traegt)
  if(body) return body;
  // Der Ortsname kann selbst die Kennung sein, waehrend code leer oder ein anderes Feld ist.
  if(locCode && locCode!==code && /^RR_/i.test(locCode)) return stPlayerLoc({code:locCode, location:'', system:p.system});
  // 6) nur das System ist bekannt: KEIN Punkt auf der Karte (frueher der Stern, dort sassen dann Spieler "in der Sonne"); die Liste zeigt den Ort als Text
  return null; }
SC.playerLoc = stPlayerLoc;
// Monde eines Planeten, die in derselben Richtung stehen (Clio und Euterpe bei microTech), um mindestens minDeg auseinanderziehen.
// Nur die Richtung in der Bahnebene aendert sich, Hoehe und Abstand bleiben. Rueckgabe: id -> Richtung (Vector3, Laenge wie vorher)
function stSpread(list,minDeg){ const out={}, n=list.length, min=minDeg*Math.PI/180; if(!n) return out;
  const a=list.map(e=>({e,ang:Math.atan2(e.v.z,e.v.x)})).sort((p,q)=>p.ang-q.ang);
  if(n>1&&n*min<Math.PI*2) for(let it=0;it<40;it++){ let moved=false;
    for(let i=0;i<n;i++){ const j=(i+1)%n; let d=a[j].ang-a[i].ang; if(j===0) d+=Math.PI*2; if(d<min){ const k=(min-d)/2; a[i].ang-=k; a[j].ang+=k; moved=true; } }
    if(!moved) break; }
  a.forEach(x=>{ const v=x.e.v.clone(), h=Math.hypot(v.x,v.z); v.x=h*Math.cos(x.ang); v.z=h*Math.sin(x.ang); out[x.e.id]=v; });
  return out; }
function stBodyFromCode(D,low){ const m3=low.match(/(?:^|_)((?:stanton|pyro|nyx|terra)\d+[a-z]?)(?=_|$)/); if(!m3) return null; let t=m3[1];
  while(t.length>2){ const o=D.d.objects.find(x=>(x.k==='planet'||x.k==='moon')&&String(x.tag||'').toLowerCase()===t); if(o) return o; t=t.slice(0,-1); } return null; }
const ST_STOP=new Set(['rr','asd','outpost','col','m','indy','hmstd','trdp','mng','social','asteroidclusterbase','cluster','base','tsg','monorail','hydro','facility','research','station','the','of','and','mining','distributioncentre']);
function stFuzzyLoc(D,code,sy,body){ const rom={1:'i',2:'ii',3:'iii',4:'iv',5:'v',6:'vi',7:'vii',8:'viii'};
  const toks=code.replace(/([a-z])([A-Z])/g,'$1_$2').toLowerCase().split(/[_\-\s]+/).filter(t=>t&&!ST_STOP.has(t)&&!/^(stanton|pyro|nyx|terra)\d*[a-z]?$/.test(t));
  const words=toks.filter(t=>/[a-z]/.test(t)&&t.length>=3), nums=toks.filter(t=>/^\d+$/.test(t));
  if(!words.length) return null;
  let best=null, bs=0;
  for(const o of D.d.objects){ if(sy&&o.sy!==sy) continue; if(o.k==='star'||o.k==='planet'&&!words.length) continue;
    const nt=String(o.n||'').toLowerCase().split(/[\s\-_.·]+/).filter(Boolean), flat=nt.join('');
    let sc=0, w=0; words.forEach(t=>{ if(nt.includes(t)||flat.includes(t)&&t.length>=5){ sc+=3; w++; } });
    if(!w) continue;
    nums.forEach(n=>{ const k=String(+n); if(nt.some(x=>x===n||x===k||x.endsWith(n)||x===rom[+n])) sc+=1; });
    if(body&&(o.p===body.id||o.id===body.id)) sc+=1; if(!o.h) sc+=0.5;
    if(sc>bs){ bs=sc; best=o; } }
  return best; }
// Ort gilt als frisch, wenn die letzte Ortsmeldung juenger als 15 Minuten ist (online heisst nur: das Tool laeuft)
function stLocFresh(p){ const t=Date.parse(String(p.when||p.last_seen||'').replace(' ','T')); return !!t&&Date.now()-t<15*60000; }   // 'when' optional (Zeit der letzten Ortsmeldung), sonst last_seen
function stAgo(ts){ const d=Date.parse(String(ts||'').replace(' ','T')); if(!d) return _t('location.unknown'); const m=Math.max(0,Math.round((Date.now()-d)/60000));
  return m<2?_t('time.just_now'):m<60?_t('time.ago_min',{n:m}):m<1440?_t('time.ago_hour',{n:Math.round(m/60)}):_t('time.ago_day',{n:Math.round(m/1440)}); }
function stPlayerObj(p){ const o=stPlayerLoc(p); if(!o) return null; return {id:'pl-'+p.id,n:p.name||p.player||_t('entity.player'),k:'player',sy:o.sy,p:o.id,x:o.x,y:o.y,z:o.z,pl:p,loc:o,on:!!p.online}; }
function stOpenGroup(g){ const L=g.grp, nOn=L.filter(x=>x.on).length;
  const body=stCard(nOn?'#4dff9a':'#8a93a6',(g.loc&&g.loc.n)?gn(g.loc.n):_t('player.multiple'),nOn?_t('player.here_count_online',{n:L.length,on:nOn}):_t('player.here_count',{n:L.length}));
  body.innerHTML=L.map((x,i)=>{ const p=x.pl; return '<div class="st-pr" data-gi="'+i+'" style="cursor:pointer"><div><b>'+(x.on?'<span style="color:#4dff9a">●</span> ':'<span class="sc-lmw-muted">○</span> ')+esc(x.n)+'</b><span>'+esc([playerPlaceName(p)||(x.loc&&translated(x.loc.n))||'',x.on?_t('status.online'):_t('status.offline_last',{time:stAgo(p.last_seen||p.when)}),gn(p.ship||'')].filter(Boolean).join(' · '))+'</span></div><em>'+_t('action.profile')+'</em></div>'; }).join('');
  body.querySelectorAll('[data-gi]').forEach(r=>r.onclick=()=>stOpenPlayer(L[+r.getAttribute('data-gi')].pl)); }
let ST_PIN='', ST_CALL_HELD=false, ST_CALL_DRAG=null, ST_CALL_MINI=false;
function callStore(){ try{ const s=JSON.parse(localStorage.getItem('sclmw_call_frame')||'null'); return s&&typeof s==='object'?s:{}; }catch(e){ return {}; } }
function callSave(part){ const s=callStore(); Object.keys(part).forEach(function(k){ s[k]=part[k]; }); try{ localStorage.setItem('sclmw_call_frame', JSON.stringify(s)); }catch(e){} }
function portLabel(port){ const k='pilot.port.'+port, s=_t(k); return s===k?String(port||'').replace(/^Armor_/,''):s; }
function gearName(g){ if(!g) return ''; var exact=g.cls&&SC.loc&&SC.loc.item?SC.loc.item(g.cls):''; if(exact) return exact; return gn(g.name||'')||g.name||''; }
function pilotBits(p){ return {gear:Array.isArray(p.gear)?p.gear:[], ship:p.ship?gn(String(p.ship)):'', place:playerPlaceName(p)||_t('location.unknown')}; }
function pilotAge(p){ const d=Date.parse(String(p.when||p.last_seen||'').replace(' ','T')); if(!d) return _t('location.unknown');
  const s=Math.max(0, Math.round((Date.now()-d)/1000));
  if(s<5) return _t('time.just_now');
  if(s<60) return _t('time.ago_sec',{n:s});
  return stAgo(p.when||p.last_seen); }
function pilotRows(p){ const loc=stPlayerLoc(p), body=loc?stBodyOf(loc):null, rows=[[_t('pilot.place'), playerPlaceName(p)||_t('location.unknown')]];
  if(loc&&loc.k) rows.push([_t('pilot.kind'), kindLabel(loc.k)]);
  const sys=loc?stSysName(loc):(p.system?gn(p.system):''); if(sys) rows.push([_t('pilot.system'), sys]);
  if(body&&loc&&body!==loc&&body.k!=='star') rows.push([_t('pilot.body'), gn(body.n)]);
  if(p.code) rows.push([_t('pilot.code'), String(p.code)]);
  if(p.server) rows.push([_t('pilot.server'), String(p.server)]);
  const trip=travelBlurb(p); if(trip) rows.push([_t('pilot.travel'), trip]);
  return rows; }
function placeChips(title, items){ if(!items||!items.length) return '';
  return '<div class="st-call-sec">'+esc(title)+'</div><div class="st-chips">'+items.map(function(a){ return '<span>'+esc(a)+'</span>'; }).join('')+'</div>'; }
function placeExtra(p){ const loc=stPlayerLoc(p); if(!loc) return '';
  let h='';
  if(typeof loc.x==='number') h+='<p class="st-call-dist">'+esc(_t('coord.from_star',{dist:stDist(Math.hypot(loc.x,loc.y,loc.z)),x:tn(Math.round(loc.x)),y:tn(Math.round(loc.y)),z:tn(Math.round(loc.z))}))+'</p>';
  const am=(loc.am||[]).map(function(a){ const z=gnLine(a); return (z&&z!==a)?z:(ST_LANG==='de'?(ST_AM_DE[a]||a):a); });
  const terms=(loc.terms||[]).map(function(t){ return gnLine(t.n||''); }).filter(Boolean);
  h+=placeChips(_t('label.amenities'), am);
  h+=placeChips(_t('label.terminals',{n:terms.length}), terms);
  return h; }
function travelBlurb(p){ const tr=p&&p.travel; if(!tr||!(tr.to||tr.from)) return '';
  const to=gn(tr.to||'');
  if(tr.mode==='aim') return _t('travel.to',{to:to});
  if(tr.from) return _t('travel.jump_from_to',{from:gn(tr.from),to:to});
  return _t('travel.jump_to',{to:to}); }
function hideLeader(){ const svg=$('stLeader'), line=$('stLeaderLn'), dot=$('stLeaderDot');
  if(line){ line.setAttribute('x1',0); line.setAttribute('y1',0); line.setAttribute('x2',0); line.setAttribute('y2',0); }
  if(dot){ dot.setAttribute('cx',-40); dot.setAttribute('cy',-40); }
  if(svg){ svg.hidden=true; svg.style.display='none'; } }
function sheetMode(){ const w=(ROOT&&ROOT.clientWidth)||999, h=(ROOT&&ROOT.clientHeight)||999; return w<=700 || (w<=900 && h<=500); }
function clearSheet(box){ if(!box) return; box.style.left=''; box.style.top=''; box.style.right=''; box.style.bottom=''; box.style.width=''; box.style.height=''; }
function clampCall(box, left, top){ const W=ROOT.clientWidth||1, H=ROOT.clientHeight||1, w=box.offsetWidth||300, h=box.offsetHeight||160;
  left=Math.max(8, Math.min(left, W-w-8)); top=Math.max(8, Math.min(top, H-h-8));
  box.style.left=left+'px'; box.style.top=top+'px'; }
function ensurePilotUi(){ if(!ROOT||$('stCall')) return;
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.id=ID('stLeader'); svg.setAttribute('class','st-leader'); svg.hidden=true;
  const ln=document.createElementNS('http://www.w3.org/2000/svg','line'); ln.id=ID('stLeaderLn'); svg.appendChild(ln);
  const dot=document.createElementNS('http://www.w3.org/2000/svg','circle'); dot.id=ID('stLeaderDot'); dot.setAttribute('r','4'); svg.appendChild(dot);
  const tip=document.createElement('div'); tip.id=ID('stTip'); tip.className='st-tip'; tip.hidden=true;
  const box=document.createElement('div'); box.id=ID('stCall'); box.className='st-call'; box.hidden=true; box.title=_t('pilot.drag'); box.setAttribute('role','dialog');
  const edges=['n','s','e','w','nw','ne','sw','se'].map(function(d){ return '<i class="st-room-edge '+d+'" data-resize="'+d+'"></i>'; }).join('');
  box.innerHTML='<i class="st-call-c tl"></i><i class="st-call-c tr"></i><i class="st-call-c bl"></i><i class="st-call-c br"></i>'+
    '<div class="st-call-head"><i class="st-call-grip"></i><i class="st-call-pip"></i><div class="st-call-id"><b class="st-call-name"></b><span class="st-call-status"></span></div>'+
    '<button type="button" class="st-call-min">'+esc(_t('pilot.fold'))+'</button><button type="button" class="st-call-x">✕</button></div>'+
    '<div class="st-call-body"><div class="st-call-rows"></div><div class="st-call-place"></div><div class="st-call-when"><span></span><b></b></div><div class="st-call-ship"></div><div class="st-call-gear"></div></div>'+edges;
  const ico=document.createElement('button'); ico.type='button'; ico.id=ID('stCallIco'); ico.className='st-float-ico st-call-ico'; ico.hidden=true;
  ROOT.appendChild(svg); ROOT.appendChild(tip); ROOT.appendChild(box); ROOT.appendChild(ico);
  const saved=callStore();
  if(typeof saved.l==='number' && !sheetMode()){ box.style.left=saved.l+'px'; box.style.top=saved.t+'px'; box.style.width=saved.w+'px'; box.style.height=saved.h+'px'; ST_CALL_HELD=true; }
  box.querySelector('.st-call-x').onclick=function(ev){ ev.preventDefault(); ev.stopPropagation(); window.__stPinPlayer(null); };
  box.querySelector('.st-call-min').onclick=function(ev){ ev.preventDefault(); ev.stopPropagation();
    const prev=callStore();
    const ix=typeof prev.ix==='number'?prev.ix:box.offsetLeft, iy=typeof prev.iy==='number'?prev.iy:box.offsetTop;
    callSave({mini:1, ix:ix, iy:iy, l:box.offsetLeft, t:box.offsetTop, w:box.offsetWidth, h:box.offsetHeight});
    ST_CALL_MINI=true; ST_CALL_HELD=true; ico.style.left=ix+'px'; ico.style.top=iy+'px'; };
  box.addEventListener('pointerdown', function(ev){ if(ev.button!=null&&ev.button!==0) return;
    if(ev.target.closest&&ev.target.closest('button')) return;
    const edge=ev.target.closest&&ev.target.closest('[data-resize]');
    const rect=ROOT.getBoundingClientRect();
    if(edge) ST_CALL_DRAG={id:ev.pointerId, mode:edge.getAttribute('data-resize'), x:ev.clientX, y:ev.clientY, l:box.offsetLeft, t:box.offsetTop, w:box.offsetWidth, h:box.offsetHeight};
    else ST_CALL_DRAG={id:ev.pointerId, mode:'move', ox:ev.clientX-rect.left-box.offsetLeft, oy:ev.clientY-rect.top-box.offsetTop};
    try{ box.setPointerCapture(ev.pointerId); }catch(e){}
    box.classList.add('is-drag'); ev.preventDefault(); });
  box.addEventListener('pointermove', function(ev){ if(!ST_CALL_DRAG||ev.pointerId!==ST_CALL_DRAG.id) return;
    if(ST_CALL_DRAG.mode==='move'){ const rect=ROOT.getBoundingClientRect(); clampCall(box, ev.clientX-rect.left-ST_CALL_DRAG.ox, ev.clientY-rect.top-ST_CALL_DRAG.oy); return; }
    const d=ST_CALL_DRAG, dx=ev.clientX-d.x, dy=ev.clientY-d.y, m=d.mode;
    let l=d.l, t=d.t, w=d.w, h=d.h;
    const east=m==='e'||m==='ne'||m==='se', west=m==='w'||m==='nw'||m==='sw', south=m==='s'||m==='se'||m==='sw', north=m==='n'||m==='ne'||m==='nw';
    if(east) w=d.w+dx; if(south) h=d.h+dy; if(west){ w=d.w-dx; l=d.l+dx; } if(north){ h=d.h-dy; t=d.t+dy; }
    if(w<260){ if(west) l-=260-w; w=260; } if(h<180){ if(north) t-=180-h; h=180; }
    const W=ROOT.clientWidth||1, H=ROOT.clientHeight||1;
    w=Math.min(w, W-16); h=Math.min(h, H-16);
    l=Math.max(8, Math.min(l, W-w-8)); t=Math.max(8, Math.min(t, H-h-8));
    box.style.left=l+'px'; box.style.top=t+'px'; box.style.width=w+'px'; box.style.height=h+'px'; });
  const endDrag=function(ev){ if(!ST_CALL_DRAG||ev.pointerId!==ST_CALL_DRAG.id) return; ST_CALL_DRAG=null; ST_CALL_HELD=true; box.classList.remove('is-drag');
    callSave({l:box.offsetLeft, t:box.offsetTop, w:box.offsetWidth, h:box.offsetHeight}); };
  box.addEventListener('pointerup', endDrag); box.addEventListener('pointercancel', endDrag);
  let icoDrag=null, icoMoved=false;
  ico.addEventListener('pointerdown', function(ev){ if(ev.button!=null&&ev.button!==0) return;
    icoDrag={id:ev.pointerId, x:ev.clientX, y:ev.clientY, l:ico.offsetLeft, t:ico.offsetTop}; icoMoved=false;
    try{ ico.setPointerCapture(ev.pointerId); }catch(e){} ev.preventDefault(); });
  ico.addEventListener('pointermove', function(ev){ if(!icoDrag||ev.pointerId!==icoDrag.id) return;
    const dx=ev.clientX-icoDrag.x, dy=ev.clientY-icoDrag.y; if(Math.abs(dx)>4||Math.abs(dy)>4) icoMoved=true;
    const W=ROOT.clientWidth||1, H=ROOT.clientHeight||1, w=ico.offsetWidth||48, h=ico.offsetHeight||48;
    ico.style.left=Math.max(8, Math.min(icoDrag.l+dx, W-w-8))+'px';
    ico.style.top=Math.max(8, Math.min(icoDrag.t+dy, H-h-8))+'px'; });
  const endIco=function(ev){ if(!icoDrag||ev.pointerId!==icoDrag.id) return; icoDrag=null;
    callSave({ix:ico.offsetLeft, iy:ico.offsetTop}); if(!icoMoved){ ST_CALL_MINI=false; ST_CALL_HELD=true; callSave({mini:0}); } };
  ico.addEventListener('pointerup', endIco); ico.addEventListener('pointercancel', endIco);
}
function paintPilot(p){ ensurePilotUi(); const box=$('stCall'); if(!box||!p) return;
  const bits=pilotBits(p), rows=pilotRows(p), extra=placeExtra(p), sig=JSON.stringify([ST_LANG,p.name,p.player,!!p.online,bits.place,bits.ship,bits.gear,rows,extra,p.code]);
  if(box.dataset.sig!==sig){ box.dataset.sig=sig;
    const nm=p.name||p.player||_t('entity.player'); box.querySelector('.st-call-name').textContent=nm; box.setAttribute('aria-label', nm);
    box.querySelector('.st-call-status').textContent=p.online?_t('status.online'):_t('status.offline');
    box.querySelector('.st-call-pip').classList.toggle('on', !!p.online);
    box.querySelector('.st-call-rows').innerHTML=rows.map(function(r){ return '<div><span>'+esc(r[0])+'</span><b>'+esc(r[1])+'</b></div>'; }).join('');
    let place=box.querySelector('.st-call-place');
    if(!place){ place=document.createElement('div'); place.className='st-call-place'; const when=box.querySelector('.st-call-when'); if(when) when.parentNode.insertBefore(place, when); }
    if(place) place.innerHTML=extra;
    const when=box.querySelector('.st-call-when'); when.querySelector('span').textContent=_t('pilot.updated');
    box.querySelector('.st-call-ship').textContent=bits.ship||_t('pilot.no_ship');
    box.querySelector('.st-call-ship').classList.toggle('is-empty', !bits.ship);
    const gear=box.querySelector('.st-call-gear');
    gear.innerHTML=bits.gear.length?bits.gear.map(function(g){ return '<div><span>'+esc(portLabel(g.port))+'</span><b>'+esc(gearName(g))+'</b></div>'; }).join(''):'<p>'+esc(_t('pilot.no_gear'))+'</p>';
  }
  const age=pilotAge(p), ageEl=box.querySelector('.st-call-when b'); if(ageEl.textContent!==age) ageEl.textContent=age;
  const ico=$('stCallIco'); if(ico){ ico.textContent=(p.name||p.player||'?').slice(0,1); ico.title=p.name||p.player||_t('entity.player'); }
  if(!ST_CALL_MINI) box.hidden=false;
}
function playerAt(entries, id){ if(!id) return null;
  for(const e of entries){ if(!e.o||e.o.k!=='player') continue;
    if(e.o.pl&&String(e.o.pl.id)===String(id)) return e;
    if(e.o.grp){ const hit=e.o.grp.find(function(g){ return g.pl&&String(g.pl.id)===String(id); }); if(hit) return e; }
  }
  return null;
}
function edgePoint(box, x, y){ const left=box.offsetLeft, top=box.offsetTop, w=box.offsetWidth||1, h=box.offsetHeight||1, cx=left+w/2, cy=top+h/2, dx=x-cx, dy=y-cy;
  if(!dx&&!dy) return {x:cx,y:cy};
  const s=Math.min((w/2)/Math.abs(dx||1e-6),(h/2)/Math.abs(dy||1e-6));
  return {x:cx+dx*s, y:cy+dy*s};
}
window.__stPinPlayer=function(p){ const next=p&&p.id!=null?String(p.id):'';
  if(next!==ST_PIN) ST_CALL_HELD=false;
  ST_PIN=next; ST_CALL_DRAG=null;
  const box=$('stCall'); if(box) box.classList.remove('is-drag');
  if(!ST_PIN){ ST_CALL_MINI=false; if(box) box.hidden=true; const ico=$('stCallIco'); if(ico) ico.hidden=true; hideLeader(); return; }
  ST_CALL_MINI=false; callSave({mini:0});
  paintPilot((ST_PL||[]).find(function(x){ return String(x.id)===ST_PIN; })||p);
};
window.__stLeaderFrame=function(entries, scr, hover){ ensurePilotUi();
  const tip=$('stTip'), box=$('stCall'), line=$('stLeaderLn'), svg=$('stLeader'), dot=$('stLeaderDot');
  if(!tip||!box||!line||!svg) return;
  const live=ST_PIN&&(ST_PL||[]).find(function(x){ return String(x.id)===ST_PIN; });
  if(live) paintPilot(live);
  const pinned=playerAt(entries, ST_PIN), pt=pinned?scr(pinned.p):null;
  const ico=$('stCallIco');
  if(ST_PIN&&ST_CALL_MINI&&ico){ box.hidden=true; ico.hidden=false;
    if(pinned&&pt){ const W=ROOT.clientWidth||1, H=ROOT.clientHeight||1;
      svg.setAttribute('viewBox','0 0 '+W+' '+H); svg.setAttribute('width',W); svg.setAttribute('height',H);
      const edge=edgePoint(ico, pt.x, pt.y);
      line.setAttribute('x1',pt.x); line.setAttribute('y1',pt.y); line.setAttribute('x2',edge.x); line.setAttribute('y2',edge.y);
      if(dot){ dot.setAttribute('cx',pt.x); dot.setAttribute('cy',pt.y); }
      svg.hidden=false; svg.style.display='';
    } else hideLeader();
  } else { if(ico) ico.hidden=true;
  if(pinned&&pt&&!box.hidden){ const W=ROOT.clientWidth||1, H=ROOT.clientHeight||1;
    svg.setAttribute('viewBox','0 0 '+W+' '+H); svg.setAttribute('width',W); svg.setAttribute('height',H);
    if(sheetMode()){ clearSheet(box); }
    else if(!ST_CALL_HELD&&!ST_CALL_DRAG){ let left=pt.x+36, top=pt.y-28, bw=box.offsetWidth||300, bh=box.offsetHeight||180;
      if(left+bw>W-12) left=Math.max(12, pt.x-bw-36);
      if(top+bh>H-12) top=Math.max(12, H-bh-12);
      if(top<12) top=12; if(left<12) left=12;
      box.style.left=left+'px'; box.style.top=top+'px';
    } else if(!ST_CALL_DRAG) clampCall(box, box.offsetLeft, box.offsetTop);
    const edge=edgePoint(box, pt.x, pt.y);
    line.setAttribute('x1',pt.x); line.setAttribute('y1',pt.y); line.setAttribute('x2',edge.x); line.setAttribute('y2',edge.y);
    if(dot){ dot.setAttribute('cx',pt.x); dot.setAttribute('cy',pt.y); }
    svg.hidden=false; svg.style.display='';
  } else hideLeader(); }
  const hv=hover&&hover.o&&hover.o.k==='player'&&hover.o.pl&&!hover.o.grp?hover:null;
  if(hv&&String(hv.o.pl.id)!==ST_PIN){ const hp=scr(hv.p);
    if(hp){ const bits=pilotBits(hv.o.pl);
      const lines=[hv.o.n, bits.place, bits.ship||_t('pilot.no_ship')];
      const sig=lines.join('\n');
      if(tip.dataset.sig!==sig){
        tip.dataset.sig=sig;
        tip.innerHTML=lines.map(function(line,i){ return (i?'<span':'<b')+' class="st-fit"><span class="st-run">'+esc(line)+'</span>'+(i?'</span>':'</b>'); }).join('');
      }
      const W=ROOT.clientWidth||1, cap=Math.min(440, Math.max(160, W-32));
      tip.style.maxWidth=cap+'px';
      let left=hp.x+16, top=hp.y+14;
      tip.hidden=false;
      if(left+tip.offsetWidth>W-8) left=Math.max(8, hp.x-tip.offsetWidth-16);
      if(top+tip.offsetHeight>(ROOT.clientHeight||1)-8) top=Math.max(8, hp.y-tip.offsetHeight-12);
      tip.style.left=left+'px'; tip.style.top=top+'px';
      tip.querySelectorAll('.st-fit').forEach(tuneFit);
    } else tip.hidden=true;
  } else tip.hidden=true;
};
function stOpenPlayer(p){ if(p && window.__stPinPlayer) window.__stPinPlayer(p); }
window.stOpenPlayer=stOpenPlayer;
const ST_WK_TABS=[['ship','wikelo.tab.ship'],['Armor','wikelo.tab.armor'],['Personal Weapons','wikelo.tab.weapons'],['other','wikelo.tab.other'],['favor','wikelo.tab.favor']];
function stWkCat(w){ if(w.rw.some(r=>r[0]==='Wikelo Favor')) return 'favor'; if(w.k==='ship') return 'ship'; return (w.cat==='Armor'||w.cat==='Personal Weapons')?w.cat:'other'; }
async function stWikeloHTML(box){ const M=await stMis(), W=(M.d.wikelo||[]), C=await uexCatalog(); if(!box||!ROOT.contains(box)) return;
  if(!W.length){ box.innerHTML=''; return; }
  const shipOf=n=>C.ships.filter(s=>n.indexOf(s.n)===0).sort((a,b)=>b.n.length-a.n.length)[0];
  const row=w=>{ const sh=w.k==='ship'?shipOf(w.t):null, im=sh&&stShipImg(sh), fav=stWkCat(w)==='favor';
    const favN=w.rw.find(r=>r[0]==='Wikelo Favor')||['Wikelo Favor',1];
    const ttl=fav?w.cost.map(c=>gn(c[0])).join(' + ')+' → '+favN[1]+'× '+gn('Wikelo Favor'):gn(w.t);
    return '<details class="st-dep st-wk"><summary>'+(im?'<img src="'+esc(im)+'" alt="" onerror="this.remove()">':'')+'<b>'+esc(ttl)+'</b><span title="'+esc(_t('wikelo.rep'))+'">+'+w.rep+'</span></summary><div class="st-mis-b">'+
      '<div class="st-wk-h">'+_t('wikelo.you_get')+'</div>'+w.rw.map(r=>'<div>· '+esc(gn(r[0]))+(r[1]>1?' ×'+r[1]:'')+'</div>').join('')+
      '<div class="st-wk-h">'+_t('wikelo.you_give')+'</div>'+(w.cost.length?w.cost.map(c=>'<div>· '+esc(gn(c[0]))+(c[1]?(c[2]==='scu'?' · '+c[1]+' SCU':' ×'+c[1]):'')+'</div>').join(''):'<div class="sc-lmw-muted">'+_t('wikelo.nothing_specified')+'</div>')+
      (w.pre.length?'<div class="st-wk-h">'+_t('label.requirement')+'</div>'+w.pre.map(p=>'<div>· '+esc(gn(p))+'</div>').join(''):'')+'</div></details>'; };
  const draw=tab=>{ const L=W.filter(w=>stWkCat(w)===tab); box.querySelector('.st-wk-list').innerHTML=(tab==='favor'?'<p class="st-mnote" style="margin:0 0 8px">'+_t('wikelo.favor_note')+'</p>':'')+(L.map(row).join('')||'<p class="sc-lmw-muted" style="font-size:.8rem">'+_t('common.nothing_in_category')+'</p>');
    box.querySelectorAll('[data-wkt]').forEach(b=>b.classList.toggle('on',b.getAttribute('data-wkt')===tab)); };
  box.innerHTML='<div class="st-slbl">'+_t('wikelo.title')+' <span class="st-cnt">'+_t('wikelo.offers',{n:W.length})+'</span></div><div class="st-wk-tabs">'+ST_WK_TABS.map(tb=>'<button data-wkt="'+tb[0]+'">'+_t(tb[1])+' <span>'+W.filter(w=>stWkCat(w)===tb[0]).length+'</span></button>').join('')+'</div><div class="st-wk-list"></div>';
  box.querySelectorAll('[data-wkt]').forEach(b=>b.onclick=()=>draw(b.getAttribute('data-wkt'))); draw('ship'); }
// Was es an einem Ort zu kaufen gibt (alle Nicht-Waren-Terminals, live von UEX)
async function stShopHTML(o,box){ const C=await uexCatalog(); const byI={}; C.items.forEach(x=>{ if(x.k!=='c') byI[x.i]=x; }); const shipI={}; C.ships.forEach(s=>{ shipI[s.i]=s; });
  const T=(o.terms||[]).filter(t=>!/^(commodity|refinery|fuel)/.test(t.t||'')).slice(0,10);
  const lists=await Promise.all(T.map(t=>/vehicle/.test(t.t||'')?stGet(UEX_BASE+'/vehicles_purchases_prices?id_terminal='+t.id).then(r=>r.map(x=>({ship:shipI[x.id_vehicle],price:x.price_buy,term:t.n}))):stGet(UEX_BASE+'/items_prices?id_terminal='+t.id).then(r=>r.map(x=>({item:byI[x.id_item]||{n:x.item_name,i:x.id_item,s:''},price:x.price_buy,term:t.n})))));
  if(!box||!ROOT.contains(box)) return;
  // gleiche Items/Schiffe an mehreren Terminals: einmal, guenstigster Preis, Terminals zusammen
  const mm={}; [].concat(...lists).filter(x=>x.price>0&&(x.item||x.ship)).forEach(x=>{ const k=(x.ship?'s':'i')+((x.ship||x.item).i||(x.ship||x.item).n); const y=mm[k];
    if(!y) mm[k]=Object.assign({},x,{terms:[x.term]}); else { if(x.price<y.price) y.price=x.price; if(y.terms.indexOf(x.term)<0) y.terms.push(x.term); y.term=y.terms.length>1?_t('count.terminals',{n:y.terms.length}):y.terms[0]; } });
  const all=Object.values(mm); if(!all.length){ box.innerHTML='<p class="sc-lmw-muted" style="font-size:.82rem">'+_t('shop.none')+'</p>'; return; }
  const rk=x=>x.ship?0:(x.item.s?1:2); all.sort((a,b)=>rk(a)-rk(b)||String(a.ship?'':a.item.s).localeCompare(String(b.ship?'':b.item.s))||(a.ship||a.item).n.localeCompare((b.ship||b.item).n));
  const draw=q=>{ const L=all.filter(x=>{ if(!q) return true; const n=(x.ship||x.item).n||'', s=(x.item||{}).s||''; return n.toLowerCase().indexOf(q)>=0||String(gn(n)).toLowerCase().indexOf(q)>=0||s.toLowerCase().indexOf(q)>=0||String(gn(s)).toLowerCase().indexOf(q)>=0; }); let last='';
    box.querySelector('.st-shop-l').innerHTML=L.slice(0,200).map((x,i)=>{ const sec=x.ship?_t('cat.ship'):(gn(x.item.s)||_t('common.misc2')), hd=sec!==last?'<div class="st-rh">'+esc(sec)+'</div>':''; last=sec;
      return hd+'<div class="st-pr" data-si="'+all.indexOf(x)+'"><div><b>'+esc(gn((x.ship||x.item).n))+'</b><span>'+esc(gnLine(x.term))+'</span></div><em>'+uexMoney(x.price)+'</em></div>'; }).join('')+(L.length>200?'<p class="sc-lmw-muted" style="font-size:.78rem">'+_t('shop.more_filter',{n:L.length-200})+'</p>':'');
    box.querySelectorAll('[data-si]').forEach(el=>el.onclick=()=>{ const x=all[+el.getAttribute('data-si')]; if(x.ship) stOpenBuy('ship',x.ship); else if(x.item.i) stOpenBuy('item',x.item); }); };
  box.innerHTML='<input class="st-shop-f" placeholder="'+esc(_t('shop.filter_placeholder',{n:all.length}))+'"><div class="st-shop-l"></div>'; box.querySelector('.st-shop-f').oninput=e=>draw(e.target.value.trim().toLowerCase()); draw(''); }
function stDestLoc(tr){ if(!tr) return null; return stPlayerLoc({code:tr.to_raw||'',location:tr.to||'',system:''}); }
function stBodyOf(o){ const D=ST_DATA; let x=o; while(x&&x.k!=='planet'&&x.k!=='moon'&&x.k!=='star') x=D.by[x.p]; return x||D.star; }

function stantonScene(canvas,sysKey){
  if(!canvas || !window.THREE) return null;
  if(window.__stCtl&&window.__stCtl._cleanup){ try{ window.__stCtl._cleanup(); }catch(e){} }   // nie zwei Karten gleichzeitig (doppelte Listener, Zombie-Schleife)
  if(sysKey) ST_SYS=sysKey;
  const T=THREE;
  const renderer=new T.WebGLRenderer({canvas:canvas,antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  const scene=new T.Scene();
  const camera=new T.PerspectiveCamera(42,1,0.004,4000);
  const lblLayer=document.createElement('div'); lblLayer.className='st-lbls'; (canvas.parentNode||ROOT).appendChild(lblLayer);
  // Groesse/Koordinaten IMMER relativ zum Mount-Container (ROOT), nie zum Browser-Fenster: sonst
  // liesse sich die Karte nur als Vollbild-Seite einbetten, nicht in einer kleinen Box irgendwo
  // auf einer fremden Seite. Size/coordinates ALWAYS relative to the mount container (ROOT), never
  // the browser window: otherwise the map could only be embedded as a fullscreen page, never in a
  // small box somewhere on a host page.
  function boxWH(){ return {w:ROOT.clientWidth||1,h:ROOT.clientHeight||1}; }
  function relXY(cx,cy){ const r=ROOT.getBoundingClientRect(); return {x:cx-r.left,y:cy-r.top}; }
  function size(){ const b=boxWH(); renderer.setSize(b.w,b.h,false); camera.aspect=b.w/b.h; camera.updateProjectionMatrix(); isMobile=b.w<700; }
  const explore=()=>ROOT.classList.contains('st-explore');
  let isMobile=boxWH().w<700;
  // Himmel (folgt der Kamera, damit er auf jeder Ebene gleich aussieht)
  const sky=new T.Group(); scene.add(sky); const skyNeb=[]; let skyStars=null, skyGlowTex=null;
  function glowTex(cols){ const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');const g=x.createRadialGradient(64,64,0,64,64,64);cols.forEach(s=>g.addColorStop(s[0],s[1]));x.fillStyle=g;x.fillRect(0,0,128,128);return new T.CanvasTexture(c); }
  const neb=glowTex([[0,'rgba(140,100,255,.5)'],[0.5,'rgba(60,120,255,.16)'],[1,'rgba(0,0,0,0)']]);
  [[-220,80,-320,0x8a5aff,300],[300,-60,-380,0x2ec6ff,340],[100,150,-500,0xff5aa0,280],[-320,-120,-240,0x5affc0,240],[260,210,-600,0x9a7aff,360],[-120,-160,-180,0x6a7aff,160],[160,-30,-200,0xff7ac0,140],[40,180,-260,0x4ac6ff,150],[-260,120,-420,0xb06aff,200],[210,90,-300,0x7affd0,150]].forEach(n=>{ const s=new T.Sprite(new T.SpriteMaterial({map:neb,color:n[3],transparent:true,opacity:.38,blending:T.AdditiveBlending,depthWrite:false})); s.position.set(n[0],n[1],n[2]); s.scale.set(n[4],n[4],1); sky.add(s); skyNeb.push(s); });
  function skyGlowMap(){ if(skyGlowTex) return skyGlowTex; const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'); const g=x.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(0.22,'rgba(255,255,255,.5)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,64,64); skyGlowTex=new T.CanvasTexture(c); return skyGlowTex; }
  function tintSky(k){ const L=ST_SYSLOOK[k]||ST_SYSLOOK.stanton, pal=L.sky; const style=ST_SKY.on?ST_SKY.style:'off'; const show=style==='classic'||style==='dense'||style==='spectrum'||style==='glow'; const mul=style==='dense'?0.4:(style==='glow'?0.75:1); skyNeb.forEach((s,i)=>{ s.visible=show; s.material.color.setHex(pal[i%pal.length]); s.material.opacity=(L.skyOp||.38)*mul; }); }
  function applySky(){
    if(skyStars){ sky.remove(skyStars); skyStars.geometry.dispose(); skyStars.material.dispose(); skyStars=null; }
    const style=ST_SKY.on?ST_SKY.style:'off';
    tintSky(ST_SYS);
    if(style==='off') return;
    let n=1900, size=1.2, spread=900, colors=null, map=null, transparent=false, blending=T.NormalBlending;
    if(style==='sparse'){ n=380; size=2.6; spread=700; }
    else if(style==='dense'){ n=5600; size=0.85; spread=1100; }
    else if(style==='spectrum'){ n=2400; size=1.7; colors=new Float32Array(n*3); }
    else if(style==='glow'){ n=820; size=9; map=skyGlowMap(); transparent=true; blending=T.AdditiveBlending; }
    const pos=new Float32Array(n*3);
    for(let i=0;i<n;i++){ const r=380+Math.random()*spread, th=Math.random()*6.283, ph=Math.acos(2*Math.random()-1); pos[i*3]=r*Math.sin(ph)*Math.cos(th); pos[i*3+1]=r*Math.cos(ph); pos[i*3+2]=r*Math.sin(ph)*Math.sin(th); }
    if(colors){ const pal=[[1,1,1],[0.72,0.86,1],[1,0.84,0.55],[1,0.62,0.45]]; for(let i=0;i<n;i++){ const p=pal[Math.random()<0.62?0:1+((Math.random()*3)|0)]; colors[i*3]=p[0]; colors[i*3+1]=p[1]; colors[i*3+2]=p[2]; } }
    const g=new T.BufferGeometry(); g.setAttribute('position',new T.BufferAttribute(pos,3)); if(colors) g.setAttribute('color',new T.BufferAttribute(colors,3));
    skyStars=new T.Points(g,new T.PointsMaterial({color:0xffffff,size:size,sizeAttenuation:false,vertexColors:!!colors,map:map,transparent:transparent,blending:blending,depthWrite:false}));
    sky.add(skyStars);
  }
  const sunGlowTex=glowTex([[0,'rgba(255,240,180,.95)'],[0.4,'rgba(255,190,90,.4)'],[1,'rgba(255,150,50,0)']]);
  const dotTex=(function(){ const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d');x.beginPath();x.arc(16,16,11,0,7);x.fillStyle='#fff';x.fill();x.lineWidth=4;x.strokeStyle='rgba(0,0,0,.75)';x.stroke();return new T.CanvasTexture(c); })();
  function iconTex(draw){ const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'); x.lineJoin='round'; x.lineCap='round';
    const pass=(col,w)=>{ x.strokeStyle=col; x.fillStyle=col; x.lineWidth=w; draw(x,w); }; pass('rgba(0,0,0,.9)',8); pass('#fff',3.2);
    const tex=new T.CanvasTexture(c); tex.generateMipmaps=false; tex.minFilter=T.LinearFilter; tex.magFilter=T.LinearFilter; return tex; }
  function poly(x, pts){ x.beginPath(); pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])); x.closePath(); x.fill(); x.stroke(); }
  const ICON={
    station:iconTex(x=>{ x.beginPath(); x.arc(32,32,11,0,7); x.fill(); x.stroke(); x.fillRect(4,24,8,16); x.strokeRect(4,24,8,16); x.fillRect(52,24,8,16); x.strokeRect(52,24,8,16); }),
    rest:iconTex(x=>{ poly(x, [[32,8],[52,20],[52,44],[32,56],[12,44],[12,20]]); }),
    wikelo:iconTex(x=>{ poly(x, [[32,8],[52,20],[52,44],[32,56],[12,44],[12,20]]); x.globalCompositeOperation='destination-out'; poly(x, [[32,22],[42,32],[32,42],[22,32]]); x.globalCompositeOperation='source-over'; }),
    gateway:iconTex(x=>{ x.beginPath(); x.arc(32,32,22,0,7); x.arc(32,32,10,0,7,true); x.fill('evenodd'); x.beginPath(); x.arc(32,32,22,0,7); x.stroke(); }),
    city:iconTex(x=>{ x.fillRect(8,30,12,26); x.strokeRect(8,30,12,26); x.fillRect(24,12,14,44); x.strokeRect(24,12,14,44); x.fillRect(42,22,14,34); x.strokeRect(42,22,14,34); }),
    jump:iconTex(x=>{ poly(x, [[8,14],[32,32],[8,50]]); poly(x, [[56,14],[32,32],[56,50]]); }),
    outpost:iconTex(x=>{ x.fillRect(16,8,5,48); x.strokeRect(16,8,5,48); poly(x, [[21,12],[48,22],[34,30],[48,38],[21,30]]); }),
    mine:iconTex(x=>{ poly(x, [[14,46],[36,18],[50,28],[28,52]]); poly(x, [[36,18],[54,14],[50,28]]); }),
    lag:iconTex(x=>{ [[16,44,11],[36,16,13],[50,42,8]].forEach(p=>{ x.beginPath(); x.arc(p[0],p[1],p[2],0,7); x.fill(); x.stroke(); }); }),
    comm:iconTex(x=>{ x.fillRect(29,22,6,32); x.lineWidth=5; x.beginPath(); x.moveTo(16,24); x.quadraticCurveTo(32,8,48,24); x.moveTo(8,16); x.quadraticCurveTo(32,-2,56,16); x.stroke(); x.beginPath(); x.arc(32,54,5,0,7); x.fill(); x.stroke(); }),
    poi:iconTex(x=>{ x.lineWidth=6; x.beginPath(); x.arc(32,32,16,0,7); x.stroke(); x.beginPath(); x.arc(32,32,5,0,7); x.fill(); x.fillRect(29,4,6,12); x.fillRect(29,48,6,12); x.fillRect(4,29,12,6); x.fillRect(48,29,12,6); }),
    rock:iconTex(x=>{ poly(x, [[16,40],[22,18],[36,12],[52,24],[56,42],[44,54],[22,52]]); }),
    belt:iconTex(x=>{ x.beginPath(); x.ellipse(32,32,24,11,0,0,7); x.lineWidth=6; x.stroke(); [[16,30],[32,40],[48,28]].forEach(p=>{ x.beginPath(); x.arc(p[0],p[1],4,0,7); x.fill(); }); })
  };
  const ICONOF={station:ICON.station,reststop:ICON.rest,wikelo:ICON.wikelo,gateway:ICON.gateway,city:ICON.city,jump:ICON.jump,outpost:ICON.outpost,miningbase:ICON.mine,lagrange:ICON.lag,comm:ICON.comm,poi:ICON.poi,asteroid:ICON.rock,belt:ICON.belt};
  const ICON_BIG={station:1,reststop:1,wikelo:1,gateway:1,city:1,jump:1};
  function beaconHex(){ return ({classic:0x37e1ff,compact:0xe8eaef,practical:0xd8d4c8,chassis:0xffb000,scifi:0x00e5cc,haze:0x39e7ff})[ST_UI_THEME]||0x37e1ff; }
  function makeBeacon(live){
    const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d');
    const tex=new T.CanvasTexture(c); tex.generateMipmaps=false; tex.minFilter=T.LinearFilter; tex.magFilter=T.LinearFilter;
    function arm(cx,cy,ix,iy,len){ x.beginPath(); x.moveTo(cx+ix*len,cy); x.lineTo(cx,cy); x.lineTo(cx,cy+iy*len); x.stroke(); }
    function draw(now){
      x.clearRect(0,0,128,128);
      const t=(now||0)*0.001;
      x.save(); x.translate(64,64); x.lineJoin='round'; x.lineCap='round'; x.strokeStyle='#fff'; x.fillStyle='#fff';
      if(live){
        const glow=x.createRadialGradient(0,0,2,0,0,62), a=0.42+0.18*Math.sin(t*3.4);
        glow.addColorStop(0,'rgba(255,255,255,'+a.toFixed(3)+')');
        glow.addColorStop(0.4,'rgba(255,255,255,'+(a*0.32).toFixed(3)+')');
        glow.addColorStop(1,'rgba(255,255,255,0)');
        x.fillStyle=glow; x.beginPath(); x.arc(0,0,60,0,Math.PI*2); x.fill();
        const p=(t%1.45)/1.45;
        x.globalAlpha=(1-p)*0.95; x.lineWidth=2.4; x.strokeStyle='#fff';
        x.beginPath(); x.arc(0,0,14+p*44,0,Math.PI*2); x.stroke(); x.globalAlpha=1;
        x.save(); x.rotate(t*1.8);
        x.lineWidth=3.4; x.beginPath(); x.arc(0,0,27,-0.2,1.45); x.stroke();
        x.lineWidth=1.7; x.beginPath(); x.arc(0,0,37,2.3,3.8); x.stroke();
        x.restore();
      }
      x.strokeStyle='#fff'; x.lineWidth=live?3.2:2.2;
      const span=live?44:36, hook=live?16:13;
      [[-1,-1,1,1],[1,-1,-1,1],[1,1,-1,-1],[-1,1,1,-1]].forEach(function(d){ arm(d[0]*span,d[1]*span,d[2],d[3],hook); });
      x.lineWidth=2.2; x.beginPath(); x.moveTo(0,-14); x.lineTo(11,0); x.lineTo(0,14); x.lineTo(-11,0); x.closePath(); x.stroke();
      x.fillStyle='#fff'; x.beginPath();
      x.moveTo(0,-9); x.lineTo(2.4,-2.4); x.lineTo(9,0); x.lineTo(2.4,2.4); x.lineTo(0,9); x.lineTo(-2.4,2.4); x.lineTo(-9,0); x.lineTo(-2.4,-2.4); x.closePath(); x.fill();
      x.restore(); tex.needsUpdate=true;
    }
    draw(0); return {tex:tex, draw:draw};
  }
  const beaconOn=makeBeacon(true), beaconOff=makeBeacon(false);
  const sunLight=new T.PointLight(0xfff2d0,2.6,0); scene.add(sunLight); scene.add(new T.AmbientLight(0x24304a,0.6));
  const BODY_MAP={};
  function bodyMap(o, base){
    const big=o.k==='planet'||o.n==='Delamar';
    const key=o.n+(big?':p':':m');
    if(BODY_MAP[key]) return BODY_MAP[key];
    const canvas=SC.paintBody(o.n, base, big&&!isMobile);
    const tex=new T.CanvasTexture(canvas);
    const maxA=renderer.capabilities&&renderer.capabilities.getMaxAnisotropy?renderer.capabilities.getMaxAnisotropy():1;
    tex.anisotropy=Math.min(8, maxA||1);
    BODY_MAP[key]=tex; return tex;
  }
  // Unregelmaessige Koerper (Asteroiden wie Delamar): Ikosaeder mit fester Knubbel-Verformung, laenglich gestreckt
  function rockGeo(rad,seed){ const g=new T.SphereGeometry(rad,128,80), P=g.attributes.position, v=new T.Vector3();
    // feste Zufallszahlen aus der Saat, damit der Stein immer gleich aussieht
    let sd=Math.floor(seed*1000)||1; const rnd=()=>{ sd=(sd*16807)%2147483647; return (sd-1)/2147483646; };
    const dirs=[]; for(let i=0;i<9;i++){ const u=rnd()*2-1, t=rnd()*6.283, q=Math.sqrt(1-u*u); dirs.push({d:new T.Vector3(q*Math.cos(t),u,q*Math.sin(t)), a:(rnd()<0.4?-1:1)*(0.18+rnd()*0.36), k:2+rnd()*4}); }
    const pits=[]; for(let i=0;i<14;i++){ const u=rnd()*2-1, t=rnd()*6.283, q=Math.sqrt(1-u*u); pits.push({d:new T.Vector3(q*Math.cos(t),u,q*Math.sin(t)), r:0.05+rnd()*0.14, dep:0.04+rnd()*0.08}); }
    for(let i=0;i<P.count;i++){ v.fromBufferAttribute(P,i).normalize(); let n=0;
      dirs.forEach(L=>{ n+=L.a*Math.exp(-(1-v.dot(L.d))*L.k); });                       // grosse Buckel und Einbuchtungen
      n+=Math.sin(v.x*7.1+seed)*0.035+Math.sin(v.y*9.7+seed*1.3)*0.03+Math.sin(v.z*13.3+seed*2.1)*0.02;   // Unebenheiten
      n+=Math.abs(Math.sin((v.x*5.3+v.y*3.1+v.z*4.7)*2.2+seed))*-0.05;                   // scharfe Grate
      pits.forEach(C=>{ const x=(1-v.dot(C.d))/C.r; if(x<1) n-=C.dep*(1-x*x); });         // Krater
      v.multiplyScalar(rad*Math.max(0.45,1+n)); v.x*=1.55; v.y*=0.78; v.z*=1.1; P.setXYZ(i,v.x,v.y,v.z); }
    g.computeVertexNormals(); return g; }
  function bodyMesh(o,rad){ const lk=ST_LOOK[o.n]||['#9a9a9a',0], irr=ST_IRREG[o.n];
    const map=bodyMap(o,lk[0]);
    const m=new T.Mesh(irr?rockGeo(rad,irr):new T.SphereGeometry(rad,48,48),new T.MeshStandardMaterial({map:map,emissive:0xffffff,emissiveMap:map,emissiveIntensity:o.n==='ArcCorp'?.28:.07,roughness:SC.bodyRough(o.n),metalness:o.n==='ArcCorp'?.08:.02}));
    spin.push(m); return m; }
  function ringPoints(G,rin,rout,thick,n,color){ const a=new Float32Array(n*3); for(let i=0;i<n;i++){ const rr=rin+Math.random()*(rout-rin), th=Math.random()*6.283; a[i*3]=rr*Math.cos(th); a[i*3+1]=(Math.random()-0.5)*thick; a[i*3+2]=rr*Math.sin(th); }
    const g=new T.BufferGeometry(); g.setAttribute('position',new T.BufferAttribute(a,3)); const p=new T.Points(g,new T.PointsMaterial({color:color,size:1.5,sizeAttenuation:false})); G.add(p); return p; }
  let level={t:'sys',o:null}, grp=null, entries=[], spin=[], animNodes=[], lastEx=null, wormClock=null, wormMouths=[], wormStat=null, sysTick=0, sysGroups=[], bgAmt=0, spinHold=false;
  const LV={sys:{min:0.8,max:1000,def:isMobile?64:52,bgMin:isMobile?52:46,bgMax:isMobile?82:58}, body:{min:1.35,max:36,def:isMobile?7.5:4.4}};
  let az=0.6, el=isMobile?0.75:0.5, azT=az, elT=el, R=LV.sys.def, RT=R;
  const OFF={}, ZERO=new T.Vector3(); const offOf=k=>OFF[k]||((ST_DATA&&ST_DATA.sys[k])?(OFF[k]=new T.Vector3().fromArray(ST_DATA.sys[k].off)):ZERO);
  const Vs=(o)=>new T.Vector3(o.x*1e-6, o.z*1e-6, -o.y*1e-6).add(offOf(o.sy));
  let BGK=1; function bgScale(){ const S=ST_DATA&&ST_DATA.sys[ST_SYS]; if(!S) return; const pl=(ST_DATA.kids[S.star.id]||[]).filter(o=>o.k==='planet'); const m=Math.max(1,...pl.map(o=>Math.hypot(o.x,o.y,o.z)/1e6)); BGK=Math.max(0.7,m/43.4); }
  const pSize=pl=>ST_PSIZE[pl.n]||Math.min(0.85,Math.max(0.3,0.3+0.2*Math.log10(Math.max(pl.r||300,100)/300)));
  function descendants(id,skip){ const D=ST_DATA, out=[]; (function walk(pid){ (D.kids[pid]||[]).forEach(c=>{ if(skip(c)) return; out.push(c); walk(c.id); }); })(id); return out; }
  function addMarkers(list,posFn){ const byK={};
    list.forEach(o=>{ if(!ST_VIS[o.k]) return; if(o.h&&!ST_HID) return; const p=posFn(o); if(!p) return; entries.push({o,p,prio:ST_PRIO[o.k]||0}); (byK[o.k]=byK[o.k]||[]).push(p); });
    Object.keys(byK).forEach(k=>{ const ps=byK[k], a=new Float32Array(ps.length*3); ps.forEach((p,i)=>{a[i*3]=p.x;a[i*3+1]=p.y;a[i*3+2]=p.z;});
      const g=new T.BufferGeometry(); g.setAttribute('position',new T.BufferAttribute(a,3));
      const ic=ICONOF[k], sz=k==='asteroid'?(isMobile?8:7):(ICON_BIG[k]?(isMobile?22:18):(isMobile?20:16));
      const pt=new T.Points(g,new T.PointsMaterial({color:(ST_KIND[k]||{}).c||'#fff',size:sz,sizeAttenuation:false,map:ic||dotTex,transparent:true,alphaTest:0.15,depthWrite:false}));
      pt.renderOrder=5; grp.add(pt); }); }
  // Dashboard: nur das gewaehlte System, Planeten kreisen. Karte: alle drei Systeme, echte Positionen, Wurmloecher.
  function buildSys(){ const D=ST_DATA, anim=!explore(); sunLight.intensity=0;
    (anim?[D.sys[ST_SYS]||D.sys.stanton]:Object.values(D.sys)).forEach(S=>buildOneSys(S,anim));
    if(!anim) buildLinks(); }
  function buildOneSys(S,anim){ const G0=grp, sg=new T.Group(); sg.userData.sys=S.k; G0.add(sg); sysGroups.push(sg); grp=sg; const e0=entries.length;
    try{ buildOneSysInner(S,anim); } finally { grp=G0; for(let i=e0;i<entries.length;i++) entries[i].sys=S.k; } }
  function buildOneSysInner(S,anim){ const D=ST_DATA, star=S.star, c0=offOf(S.k), look=ST_SYSLOOK[S.k]||ST_SYSLOOK.stanton, sr=S.k==='stanton'?1.9:1.3;
    const sun=new T.Mesh(new T.SphereGeometry(sr,48,48),new T.MeshBasicMaterial({color:look.star})); sun.position.copy(c0); grp.add(sun); spin.push(sun);
    const gl=new T.Sprite(new T.SpriteMaterial({map:sunGlowTex,color:look.glow,transparent:true,blending:T.AdditiveBlending,depthWrite:false})); gl.scale.set(sr*7,sr*7,1); gl.position.copy(c0); grp.add(gl);
    const L=new T.PointLight(look.light,2.6,260,1); L.position.copy(c0); grp.add(L);
    entries.push({o:star,p:c0.clone(),body:true,r:sr,prio:3});
    // Gasnebel des Systems (Pyro rot-orange, Nyx blau-tuerkis)
    look.neb.forEach((col,i)=>{ const a=i*2.399+S.k.length, rr=45+(i*37%70), s=new T.Sprite(new T.SpriteMaterial({map:neb,color:col,transparent:true,opacity:look.nebOp,blending:T.AdditiveBlending,depthWrite:false}));
      s.position.set(c0.x+Math.cos(a)*rr,c0.y+((i%3)-1)*14,c0.z+Math.sin(a)*rr); const sc=110+(i*53%120); s.scale.set(sc,sc,1); grp.add(s); });
    if(star.ring&&ST_VIS.halo){ const p=ringPoints(grp,star.ring.in*1e-6,star.ring.out*1e-6,0.12,4200,look.belt); p.position.copy(c0); }
    (D.kids[star.id]||[]).filter(o=>o.k==='belt'&&o.belt).forEach(b=>{ if(!ST_VIS.halo) return; const pc=Vs(D.by[b.p]||star), w=Math.max(0.9,(b.belt.out-b.belt.in)*1e-6);
      const p=ringPoints(grp,b.belt.in*1e-6-w/2,b.belt.out*1e-6+w/2,Math.max(0.2,b.belt.depth*1e-6),S.k==='nyx'?7000:3000,look.belt); p.position.copy(pc); });
    (D.kids[star.id]||[]).filter(o=>o.k==='planet').forEach(pl=>{
      const pp=Vs(pl), d=pp.distanceTo(c0), rad=pSize(pl);
      { const n=360, a=new Float32Array(n*3); for(let i=0;i<n;i++){ const t=i/n*Math.PI*2; a[i*3]=d*Math.cos(t); a[i*3+2]=d*Math.sin(t); } const g=new T.BufferGeometry(); g.setAttribute('position',new T.BufferAttribute(a,3)); const ol=new T.LineLoop(g,new T.LineBasicMaterial({color:0x5a78a8,transparent:true,opacity:.35})); ol.position.copy(c0); grp.add(ol); }
      const pivot=new T.Object3D(); pivot.position.copy(c0); grp.add(pivot); const holder=new T.Object3D(); holder.position.copy(pp).sub(c0); pivot.add(holder);
      const m=bodyMesh(pl,rad); holder.add(m); entries.push({o:pl,p:pp.clone(),body:true,r:rad,prio:3,node:holder});
      if(anim) animNodes.push({o:pivot,s:0.0012*Math.pow(12.85/d,1.5)});
      const mDir=stSpread((D.kids[pl.id]||[]).filter(o=>o.k==='moon').map(mo=>({id:mo.id,v:Vs(mo).sub(pp).normalize()})),28);
      (D.kids[pl.id]||[]).filter(o=>o.k==='moon').forEach((mo,i)=>{ if(!ST_VIS.moon) return;
        const dir=mDir[mo.id].clone(), dist=Math.hypot(mo.x-pl.x,mo.y-pl.y,mo.z-pl.z);
        const off=dir.multiplyScalar(rad+0.28*Math.log10(dist/pl.r));
        const mp=new T.Object3D(); holder.add(mp); const mm=bodyMesh(mo,0.09); mm.position.copy(off); mp.add(mm);
        entries.push({o:mo,p:pp.clone().add(off),body:true,r:0.09,prio:2,node:mm});
        if(anim) animNodes.push({o:mp,s:0.004}); });   // alle Monde eines Planeten gleich schnell: sonst holen sie sich ein und kleben wieder aneinander
    });
    (D.kids[star.id]||[]).filter(o=>o.k==='moon'&&ST_VIS.moon).forEach(mo=>{ const mp=Vs(mo), mm=bodyMesh(mo,0.16); mm.position.copy(mp); grp.add(mm); entries.push({o:mo,p:mp,body:true,r:0.16,prio:2}); });
    addMarkers(descendants(star.id,c=>c.k==='planet'||c.k==='moon').filter(o=>!anim||o.k==='gateway'),Vs);
  }
  // Spieler: an ihrem Ort; liegt der Ort auf einem Planeten/Mond, sitzt die Figur ueber dessen Kugel
  let plPts=[];
  function buildPlayers(){ plPts=[]; if(!explore()||!ST_PL||!ST_PL.length||!ST_VIS.player) return; const D=ST_DATA, byAnchor={}, on=[], off=[];
    // Mehrere Spieler am selben Ort (Nico, 28.09.2026): EIN Schild "Levski · 4 Spieler", Tippen klappt die Liste auf
    const seen=[];
    ST_PL.forEach(p=>{ if(p.online?!ST_PL_ON:!ST_PL_OFF) return; const po=stPlayerObj(p); if(!po) return; let pos=null, key, anc=po.loc;
      if(level.t==='sys'){ const b=stBodyOf(po.loc), eb=b&&b.k!=='star'?entries.find(e=>e.o.id===b.id):null;
        if(eb){ pos=eb.p.clone().add(new T.Vector3(0,eb.r+0.14,0)); key=b.id; anc=b; } else { pos=Vs(po.loc); key=po.loc.id; } }
      else { let x=po.loc; while(x&&x.id!==level.o.id) x=D.by[x.p]; if(!x) return; const F=level.o, s=1/F.r;
        if(po.loc.id===F.id){ pos=new T.Vector3(0,ST_IRREG[F.n]?1.5:1.18,0); } else { pos=new T.Vector3((po.loc.x-F.x)*s,(po.loc.z-F.z)*s,-(po.loc.y-F.y)*s); pos.setLength(Math.max(pos.length(),ST_IRREG[F.n]?1.32:1.07)); } key=po.loc.id; }
      if(!byAnchor[key]){ byAnchor[key]={pos,anc,sy:po.sy,list:[]}; seen.push(key); } byAnchor[key].list.push(po); });
    seen.forEach(key=>{ const g=byAnchor[key], L=g.list, sys=level.t==='sys'?g.sy:null;
      if(L.length===1){ entries.push({o:L[0],p:g.pos,prio:2,sys}); (L[0].on?on:off).push(g.pos); return; }
      L.sort((a,b)=>(b.on-a.on)||String(a.n).localeCompare(String(b.n)));
      const same=L.every(x=>x.loc&&x.loc.id===L[0].loc.id), place=same?L[0].loc:g.anc;   // alle am selben Ort -> Ortsname (Levski), sonst der Planet
      const nOn=L.filter(x=>x.on).length, go={id:'grp-'+key,n:(place&&place.n?gn(place.n)+' · ':'')+(nOn?_t('player.here_group_online',{n:L.length,on:nOn}):_t('player.here_group',{n:L.length})),k:'player',grp:L,sy:g.sy,loc:place,on:nOn>0,pl:{}};
      entries.push({o:go,p:g.pos,prio:2,sys}); (nOn?on:off).push(g.pos); });
    if(level.t==='sys') entries.filter(e=>e.o.k==='player'&&e.o.pl.travel).forEach(e=>{ const dl=stDestLoc(e.o.pl.travel); if(!dl) return; const b=stBodyOf(dl), eb=b&&b.k!=='star'?entries.find(x=>x.o.id===b.id):null, to=eb?eb.p.clone().add(new T.Vector3(0,eb.r+0.1,0)):Vs(dl);
      const g=new T.BufferGeometry().setFromPoints([e.p,to]); const ln=new T.Line(g,new T.LineDashedMaterial({color:beaconHex(),dashSize:0.6,gapSize:0.4,transparent:true,opacity:.85,depthTest:false})); ln.computeLineDistances(); ln.renderOrder=5; ln.userData.sys=e.sys; ln.userData.live=true; plPts.push(ln); grp.add(ln); });
    const bySys={}; entries.filter(e=>e.o.k==='player').forEach(e=>{ const k=(e.sys||'-')+'|'+(e.o.on?1:0); (bySys[k]=bySys[k]||[]).push(e.p); });
    Object.keys(bySys).forEach(k=>{ const [sy,onl]=k.split('|'), ps=bySys[k], a=new Float32Array(ps.length*3); ps.forEach((p,i)=>{a[i*3]=p.x;a[i*3+1]=p.y;a[i*3+2]=p.z;});
      const g=new T.BufferGeometry(); g.setAttribute('position',new T.BufferAttribute(a,3));
      const live=onl==='1';
      const pt=new T.Points(g,new T.PointsMaterial({color:live?beaconHex():0x8a93a6,size:live?(isMobile?58:68):(isMobile?48:56),sizeAttenuation:false,map:live?beaconOn.tex:beaconOff.tex,transparent:true,alphaTest:0.02,depthTest:false,blending:live?T.AdditiveBlending:T.NormalBlending})); pt.renderOrder=6; pt.userData.beacon=live; pt.userData.sys=sy==='-'?null:sy; if(sy==='-') pt.userData.sys=ST_SYS; plPts.push(pt); grp.add(pt); }); }
  // Wurmloecher: eine sanfte Beugung zwischen den Toren, nur Sterne und Planeten werden
  // knapp ausgespart. Die Roehre selbst kriecht im Shader, ohne die Strecke zu verlaengern.
  const WORM_VERT=[
    'attribute float room; attribute float glow; attribute vec3 side; attribute vec3 lift;',
    'uniform float uTime; uniform float uPhase; uniform float uSpin; uniform float uThrob;',
    'varying vec2 vUv; varying float vGlow; varying float vNd; varying float vU; varying float vPulse;',
    'void main(){',
    '  vUv=uv; vU=uv.x; vGlow=glow;',
    '  vPulse=0.0;',
    '  float env=sin(uv.x*3.14159265);',
    '  float ang=uTime*0.07, cs=cos(ang), sn=sin(ang);',
    '  vec3 s1=side*cs+lift*sn, s2=lift*cs-side*sn;',
    '  float amp=min(8.0, max(2.6, room*0.22))*env;',
    '  float wave=sin(uv.x*9.0-uTime*0.38+uPhase);',
    '  float wave2=cos(uv.x*4.5-uTime*0.16+uPhase);',
    '  float pulse=0.5+0.5*sin(uv.x*6.0-uTime*0.32+uPhase);',
    '  vPulse=pulse*env;',
    '  vec3 p=position+s1*wave*amp+s2*wave2*amp*0.62;',
    '  p+=normal*pulse*uThrob;',
    '  vec4 mv=modelViewMatrix*vec4(p,1.0);',
    '  vNd=abs(dot(normalize(normalMatrix*normal), normalize(-mv.xyz)));',
    '  gl_Position=projectionMatrix*mv;',
    '}'
  ].join('\n');
  const WORM_FRAG=[
    'uniform vec3 uA; uniform vec3 uB; uniform float uTime; uniform float uGain;',
    'varying vec2 vUv; varying float vGlow; varying float vNd; varying float vU; varying float vPulse;',
    'void main(){',
    '  float u=vU;',
    '  vec3 col=mix(uA,uB,smoothstep(0.06,0.94,u));',
    '  float core=pow(vNd,2.4), rim=pow(1.0-vNd,2.8);',
    '  float flow=fract(u-uTime*0.055);',
    '  float packet=smoothstep(0.0,0.04,flow)*smoothstep(0.28,0.08,flow);',
    '  float tide=0.72+0.28*vPulse;',
    '  float roll=0.5+0.5*sin(vUv.y*12.566-uTime*0.18);',
    '  vec3 rgb=col*(0.18+core*1.15)*tide+vec3(1.0,0.97,0.92)*packet*core*0.95+col*rim*(0.16+roll*0.14);',
    '  float ends=smoothstep(0.0,0.07,u)*smoothstep(1.0,0.93,u);',
    '  float alpha=uGain*vGlow*(0.14+core*0.62+rim*0.2+packet*0.7+vPulse*0.16)*ends;',
    '  gl_FragColor=vec4(rgb, alpha);',
    '}'
  ].join('\n');
  function buildLinks(){ const D=ST_DATA; wormClock={value:0}; wormMouths=[];
    const spheres=[];
    D.d.objects.forEach(function(o){
      if(o.k!=='star'&&o.k!=='planet') return;
      const r=o.k==='star'?(o.sy==='stanton'?1.9:1.3)+1.6:pSize(o)+1.2;
      spheres.push({p:Vs(o), r:r, tag:o.k+' '+(o.n||'')}); });
    const cen=Object.keys(D.sys).map(k=>offOf(k));
    function clearanceAt(x,y,z){ let m=48, tag='';
      for(let i=0;i<spheres.length;i++){ const o=spheres[i], d=Math.hypot(x-o.p.x,y-o.p.y,z-o.p.z)-o.r; if(d<m){ m=d; tag=o.tag; } }
      clearanceAt.tag=tag; return m; }
    function pushOut(p){
      for(let i=0;i<spheres.length;i++){ const o=spheres[i], need=o.r+0.8; let dx=p.x-o.p.x, dy=p.y-o.p.y, dz=p.z-o.p.z, d=Math.hypot(dx,dy,dz);
        if(d<need){ if(d<1e-4){ p.y+=need; continue; } const k=(need-d)/d; p.x+=dx*k; p.y+=dy*k; p.z+=dz*k; } } }
    function smoothSpine(pts){ const px=pts.map(p=>p.x), py=pts.map(p=>p.y), pz=pts.map(p=>p.z);
      for(let i=1;i<pts.length-1;i++){ pts[i].x=px[i]*0.72+(px[i-1]+px[i+1])*0.14; pts[i].y=py[i]*0.72+(py[i-1]+py[i+1])*0.14; pts[i].z=pz[i]*0.72+(pz[i-1]+pz[i+1])*0.14; } }
    function starFade(x,y,z){ let dmin=1e9; for(let i=0;i<cen.length;i++){ const c=cen[i], d=Math.hypot(x-c.x,y-c.y,z-c.z); if(d<dmin) dmin=d; }
      const s=Math.min(1,Math.max(0,(dmin-16)/26)); return 0.45+0.55*s*s*(3-2*s); }
    const stat={tubes:0, minRoom:1e9, links:[]}; wormStat=stat;
    (D.gal.links||[]).forEach(function(l,li){ const A=D.by[l.a], B=D.by[l.b]; if(!A||!B) return; const pa=Vs(A), pb=Vs(B);
      if(!l.live){ const g=new T.BufferGeometry().setFromPoints([pa,pb]); const ln=new T.Line(g,new T.LineDashedMaterial({color:0x8aa0c8,dashSize:6,gapSize:5,transparent:true,opacity:.35})); ln.computeLineDistances(); grp.add(ln); return; }
      const dir=pb.clone().sub(pa), len=dir.length(); dir.normalize();
      const up=Math.abs(dir.y)<0.9?new T.Vector3(0,1,0):new T.Vector3(1,0,0), n1=new T.Vector3().crossVectors(dir,up).normalize(), n2=new T.Vector3().crossVectors(dir,n1).normalize();
      const N=48, amp=Math.min(11, len*0.02), pts=[], chord=[];
      for(let i=0;i<=N;i++){ const t=i/N, env=Math.sin(Math.PI*t), p=pa.clone().lerp(pb,t);
        chord.push(p.clone()); pts.push(p.addScaledVector(n2, env*amp)); }
      function lock(){ pts[0].copy(pa); pts[N].copy(pb); }
      function hold(){ for(let i=1;i<N;i++){ let dx=pts[i].x-chord[i].x, dy=pts[i].y-chord[i].y, dz=pts[i].z-chord[i].z, d=Math.hypot(dx,dy,dz);
        if(d>amp+4){ const k=(amp+4)/d; pts[i].x=chord[i].x+dx*k; pts[i].y=chord[i].y+dy*k; pts[i].z=chord[i].z+dz*k; } } }
      for(let iter=0; iter<4; iter++){ for(let i=1;i<N;i++) pushOut(pts[i]); hold(); lock(); smoothSpine(pts); hold(); lock(); }
      const curve=new T.CatmullRomCurve3(pts,false,'centripetal'), scratch=new T.Vector3();
      let minRoom=1e9, near='', bow=0;
      for(let s=0;s<=200;s++){ const u=s/200; curve.getPoint(u,scratch); const c=clearanceAt(scratch.x,scratch.y,scratch.z); if(c<minRoom){ minRoom=c; near=clearanceAt.tag||''; }
        const straight=pa.clone().lerp(pb,u); bow=Math.max(bow, scratch.distanceTo(straight)); }
      if(minRoom<stat.minRoom) stat.minRoom=minRoom;
      const seg=180, radS=12, ca=new T.Color((ST_SYSLOOK[l.sa]||ST_SYSLOOK.stanton).dot), cb=new T.Color((ST_SYSLOOK[l.sb]||ST_SYSLOOK.stanton).dot);
      const phase=li*2.1;
      function wormMat(gain,spin,throb,ph){ return new T.ShaderMaterial({
        uniforms:{uTime:wormClock, uPhase:{value:phase+ph}, uGain:{value:gain}, uSpin:{value:spin}, uThrob:{value:throb}, uA:{value:ca}, uB:{value:cb}},
        vertexShader:WORM_VERT, fragmentShader:WORM_FRAG, transparent:true, depthWrite:false, depthTest:true, fog:false,
        blending:T.AdditiveBlending, side:T.DoubleSide }); }
      [[0.16,0.82,0,0.08,0],[0.46,0.34,0,0.22,0],[1.15,0.12,0,0.12,0]].forEach(function(layer){
        const geo=new T.TubeGeometry(curve,seg,layer[0],radS,false), count=geo.attributes.position.count, step=radS+1;
        const roomA=new Float32Array(count), glowA=new Float32Array(count), sideA=new Float32Array(count*3), liftA=new Float32Array(count*3);
        for(let i=0;i<=seg;i++){ curve.getPointAt(i/seg,scratch); const room=Math.max(0,clearanceAt(scratch.x,scratch.y,scratch.z)), glow=starFade(scratch.x,scratch.y,scratch.z);
          for(let j=0;j<=radS;j++){ const ix=i*step+j; if(ix>=count) break; roomA[ix]=room; glowA[ix]=glow; sideA[ix*3]=n1.x; sideA[ix*3+1]=n1.y; sideA[ix*3+2]=n1.z; liftA[ix*3]=n2.x; liftA[ix*3+1]=n2.y; liftA[ix*3+2]=n2.z; } }
        geo.setAttribute('room',new T.BufferAttribute(roomA,1)); geo.setAttribute('glow',new T.BufferAttribute(glowA,1));
        geo.setAttribute('side',new T.BufferAttribute(sideA,3)); geo.setAttribute('lift',new T.BufferAttribute(liftA,3));
        const mesh=new T.Mesh(geo,wormMat(layer[1],layer[2],layer[3],layer[4])); mesh.renderOrder=3; grp.add(mesh); stat.tubes++; });
      function mouth(p,tangent,color,ph){
        const ring=new T.Mesh(new T.TorusGeometry(1.25,0.05,8,32), new T.MeshBasicMaterial({color:color,transparent:true,opacity:0.85,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}));
        ring.position.copy(p); const axis=tangent.clone().normalize(); if(axis.lengthSq()>0.5) ring.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),axis);
        ring.userData={ph:ph,bs:1,op:0.85}; ring.renderOrder=4; grp.add(ring); wormMouths.push(ring);
        const sp=new T.Sprite(new T.SpriteMaterial({map:sunGlowTex,color:color,transparent:true,opacity:0.38,blending:T.AdditiveBlending,depthWrite:false}));
        sp.position.copy(p); sp.scale.set(6,6,1); sp.userData={ph:ph+0.8,bs:6,op:0.38}; sp.renderOrder=4; grp.add(sp); wormMouths.push(sp); }
      curve.getPoint(0.5,scratch);
      stat.links.push({id:l.sa+'-'+l.sb, minRoom:+minRoom.toFixed(2), bow:+bow.toFixed(1), near:near, mid:[+scratch.x.toFixed(2),+scratch.y.toFixed(2),+scratch.z.toFixed(2)]});
      mouth(pa, curve.getTangentAt(0), ca, phase); mouth(pb, curve.getTangentAt(1), cb, phase+1.2); });
    if(!isFinite(stat.minRoom)) stat.minRoom=null; }
  function buildBody(F){ const D=ST_DATA, s=1/F.r;
    const rel=o=>new T.Vector3((o.x-F.x)*s,(o.z-F.z)*s,-(o.y-F.y)*s);
    const m=bodyMesh(F,1); grp.add(m); entries.push({o:F,p:new T.Vector3(),body:true,r:1,prio:3});
    const toStar=new T.Vector3(-F.x,-F.z,F.y).normalize();
    sunLight.intensity=2.6; sunLight.color.setHex((ST_SYSLOOK[F.sy]||ST_SYSLOOK.stanton).light); sunLight.position.copy(toStar).multiplyScalar(900);
    const sg=new T.Sprite(new T.SpriteMaterial({map:sunGlowTex,transparent:true,blending:T.AdditiveBlending,depthWrite:false})); sg.position.copy(toStar).multiplyScalar(900); sg.scale.set(60,60,1); grp.add(sg);
    if(F.ring&&ST_VIS.halo) ringPoints(grp,F.ring.in*s,F.ring.out*s,0.01,2600,0xb8ad9c);
    const bDir=stSpread((D.kids[F.id]||[]).filter(o=>o.k==='moon').map(mo=>({id:mo.id,v:rel(mo)})),14);
    (D.kids[F.id]||[]).filter(o=>o.k==='moon').forEach(mo=>{ if(!ST_VIS.moon) return;
      const v0=rel(mo), q=v0.length(), d=q>3?3+4*Math.log10(q/3):q, v=bDir[mo.id].clone().setLength(d);
      const rad=Math.max(mo.r*s,0.14); const mm=bodyMesh(mo,rad); mm.position.copy(v); grp.add(mm); entries.push({o:mo,p:v,body:true,r:rad,prio:2}); });
    const lift=ST_IRREG[F.n]?1.22:1.012;
    addMarkers(descendants(F.id,c=>c.k==='moon'),o=>{ const v=rel(o); if(v.length()<lift) v.setLength(lift); return v; });
  }
  function dispose(g){ const kept=Object.values(BODY_MAP); g.traverse(x=>{ if(x.geometry) x.geometry.dispose(); if(x.material){ if(x.material.map&&x.material.map!==dotTex&&x.material.map!==sunGlowTex&&x.material.map!==neb&&!Object.values(ICON).includes(x.material.map)&&kept.indexOf(x.material.map)<0) x.material.map.dispose(); x.material.dispose(); } }); }
  function rebuild(){ wormClock=null; wormMouths=[]; wormStat=null; if(!ST_DATA) return;
    if(grp){ scene.remove(grp); dispose(grp); } grp=new T.Group(); scene.add(grp); entries=[]; spin=[]; animNodes=[]; sysGroups=[]; lblLayer.innerHTML='';
    camera.near=level.t==='sys'?0.05:0.004; camera.updateProjectionMatrix();
    if(level.t==='sys') buildSys(); else buildBody(level.o);
    buildPlayers();
    entries.sort((a,b)=>b.prio-a.prio);
    entries.forEach(e=>{ const d=document.createElement('div'); d.className='st-lbl p'+e.prio; d.textContent=e.o.k==='player'?e.o.n:gn(e.o.n); lblLayer.appendChild(d); e.el=d; });
    if(typeof drawHl==='function') drawHl();
    if(window.__stCtl&&window.__stCtl.onLevel) window.__stCtl.onLevel(level); }
  // Blickziel: ausserhalb des Easter-Eggs immer die Sonne, im Erkunden-Modus frei verschiebbar (nur Systemebene)
  const tgt=new T.Vector3(), tgtT=new T.Vector3();
  function focus(o){
    if(!o||o.k==='star'){ let b=level.o; while(b&&b.k!=='planet') b=ST_DATA.by[b.p]; level={t:'sys',o:null};
      if(b&&explore()){ tgtT.copy(Vs(b)); tgt.copy(tgtT); R=2.5; RT=7; } else { tgtT.copy(offOf(ST_SYS)); tgt.copy(tgtT); R=Math.min(R*3,120); RT=explore()?30:LV.sys.def; } }
    else { level={t:'body',o}; setSys(o.sy); tgtT.set(0,0,0); tgt.set(0,0,0); R=LV.body.max; RT=LV.body.def; }
    rebuild();
    // Anflug von der Sonnenseite, damit die Oberflaeche zu sehen ist. Liegt der wichtigste Ort
    // (Stadt/Station) ebenfalls im Tageslicht, bleibt die Blickrichtung in seiner Naehe.
    if(level.t==='body'){ const F=level.o, sun=new T.Vector3(-F.x,-F.z,F.y).normalize(); const top=entries.find(e=>!e.body&&e.prio>=2&&e.p.length()<1.6); let aim=sun; if(top&&top.p.dot(sun)>0.15) aim=top.p.clone().normalize().lerp(sun,.35).normalize(); azT=Math.atan2(aim.x,aim.z); elT=Math.max(-1.1,Math.min(1.1,Math.asin(Math.max(-1,Math.min(1,aim.y))))); } }
  function setSys(k){ if(!k||k===ST_SYS) return; ST_SYS=k; tintSky(k); if(ST_VIEW) ST_VIEW=k; if(window.__stCtl&&window.__stCtl.onSys) window.__stCtl.onSys(ST_VIEW?k:'all'); }
  function home(){ hl=null; if(level.t!=='sys'){ level={t:'sys',o:null}; rebuild(); } if(explore()){ ST_VIEW=ST_SYS; if(window.__stCtl&&window.__stCtl.onSys) window.__stCtl.onSys(ST_VIEW); } tgtT.copy(offOf(ST_SYS)); RT=explore()?(isMobile?84:44):LV.sys.def; }
  function goSystem(k){ hl=null; ST_VIEW=k; setSys(k); if(level.t!=='sys'){ level={t:'sys',o:null}; rebuild(); } tgtT.copy(offOf(k)); RT=isMobile?84:48; }
  function galaxy(){ hl=null; ST_VIEW=null; if(level.t!=='sys'){ level={t:'sys',o:null}; rebuild(); } const c=new T.Vector3(); Object.keys(ST_DATA.sys).forEach(k=>c.add(offOf(k))); tgtT.copy(c.divideScalar(Object.keys(ST_DATA.sys).length)); RT=isMobile?900:620; if(window.__stCtl&&window.__stCtl.onSys) window.__stCtl.onSys('all'); }
  let hl=null;
  function lookAtMarker(e){ if(level.t==='sys'){ tgtT.copy(e.p); clampT(); RT=Math.min(RT,5); }
    else { const v=e.p.clone(); azT=Math.atan2(v.x,v.z); elT=Math.max(-1.2,Math.min(1.3,Math.asin(v.y/(v.length()||1)))); RT=Math.max(1.6,Math.min(RT,3)); } }
  function flyTo(o){ if(!ST_DATA||!o) return; const b=stBodyOf(o); if(o.sy){ ST_VIEW=o.sy; setSys(o.sy); if(window.__stCtl&&window.__stCtl.onSys) window.__stCtl.onSys(o.sy); }
    if(b.k==='star'){ if(level.t!=='sys') focus(null); } else if(!(level.o&&level.o.id===b.id)) focus(b);
    hl=o.id; const e=entries.find(x=>x.o.id===o.id);
    if(e&&!e.body) lookAtMarker(e);
    else if(o.k==='star'){ tgtT.copy(offOf(o.sy)); RT=Math.min(RT,60); }
    else if(level.t==='sys'&&typeof o.x==='number'){ tgtT.copy(Vs(o)); clampT(); RT=Math.min(RT,12); } }
  // Verdeckt? Nur auf Koerper-Ebene: Strahl Kamera->Punkt schneidet die Kugel r=1 im Ursprung
  const tmp=new T.Vector3(), tmp2=new T.Vector3();
  function behind(p){ if(level.t==='sys') return false; const c=camera.position; tmp2.copy(p).sub(c); const L=tmp2.length(); tmp2.divideScalar(L); const b=c.dot(tmp2), disc=b*b-(c.lengthSq()-1); if(disc<0) return false; const t=-b-Math.sqrt(disc); return t>0&&t<L-1e-4; }
  function scr(p){ tmp.copy(p).project(camera); const b=boxWH(); return tmp.z>1?null:{x:(tmp.x+1)/2*b.w,y:(1-tmp.y)/2*b.h}; }
  function scrRadius(e){ const a=scr(e.p); if(!a) return 0; tmp2.copy(camera.up).multiplyScalar(e.r).add(e.p); const b=scr(tmp2); return b?Math.hypot(a.x-b.x,a.y-b.y):0; }
  const eVis=e=>true;   // Nico 23.09.2026: andere Systeme werden beim Zoomen nie ausgeblendet
  function nearest(cx,cy,maxPx){ let best=null,bs=1e9;
    for(const e of entries){ if(!eVis(e)) continue; if(bgAmt>0.66&&e.sys&&e.sys!==ST_SYS) continue; const s=scr(e.p); if(!s) continue; const dd=Math.hypot(s.x-cx,s.y-cy);
      if(e.body){ const rr=Math.max(14,scrRadius(e)); if(dd<rr){ const sc=12+dd*0.2; if(sc<bs){bs=sc;best=e;} } }
      else { const hit=e.o&&e.o.k==='player'&&!e.o.on?Math.max(maxPx,26):maxPx; if(dd<hit && !behind(e.p)){ const sc=dd-e.prio*0.5; if(sc<bs){bs=sc;best=e;} } } }
    return best; }
  function pickAt(cx,cy){ if(!explore()||!ST_DATA) return; const e=nearest(cx,cy,isMobile?18:12); if(!e) return; const o=e.o;
    window.__stPlace=o;
    if((o.k==='planet'||o.k==='moon')&&!(level.o&&level.o.id===o.id)) focus(o);
    else if(o.k==='star'){ setSys(o.sy); if(level.t!=='sys') focus(null); tgtT.copy(offOf(o.sy)); }
    else if(!e.body) lookAtMarker(e);
    hl=o.id; if(typeof window.openStPanel==='function') window.openStPanel(o); }
  let hover=null, hoverReq=false, hx=0, hy=0, hlSet=null;
  // Namen erst in der Naehe: Kameraabstand je Rang (System: Mio km, Koerper: Radien). Rang 3 steht immer.
  const LBL={sys:[3,7,18],body:[1.6,2.3,6]};
  function labels(){ const ex=explore(), _b=boxWH(), W=_b.w, H=_b.h, placed=[], cp=camera.position;
    const isHl=e=>hlVis&&hlVis.has(e.o.id), isF=e=>e.o.id===hl||e===hover||(e.o.k==='player'&&(!e.sys||e.sys===ST_SYS)&&!stOtherFaded(e.sys,!!e.o.on));
    const order=hlVis||hl||hover?entries.filter(isF).concat(entries.filter(e=>!isF(e)&&isHl(e)),entries.filter(e=>!isF(e)&&!isHl(e))):entries;
    for(const e of order){ const d=e.el; if(!d) continue; d.classList.toggle('far', bgAmt>0.04&&!!e.sys&&e.sys!==ST_SYS); if(!eVis(e)){ d.style.transform='translate(-9999px,0)'; continue; } const o=e.o, force=isF(e), mark=isHl(e);
      const dc=cp.distanceTo(e.p); let show=force||mark||o.k==='star'||(e.prio>=3&&(!ex||level.t!=='sys'||dc<260))||(ex&&e.prio<3&&dc<LBL[level.t][e.prio]);
      let s=null; if(show){ s=scr(e.p); if(!s||s.x<-50||s.x>W+50||s.y<-20||s.y>H+20) show=false; else if(!e.body&&behind(e.p)) show=false; }
      if(show){ const label=o.k==='player'?o.n:gn(o.n); const w=label.length*(/[^\u0000-\u00ff]/.test(label)?13:(e.prio>=3?9:6.4))+8, h=16, x=s.x-w/2, y=s.y-(e.body?Math.max(10,scrRadius(e))+14:18);
        if(!force&&placed.some(r=>x<r.x+r.w&&x+w>r.x&&y<r.y+r.h&&y+h>r.y)) show=false; else { placed.push({x,y,w,h}); d.style.transform='translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px)'; } }
      if(!show) d.style.transform='translate(-9999px,0)'; d.classList.toggle('hl',force||mark); d.classList.toggle('dim', !!(e.o&&e.o.k==='player'&&stOtherFaded(e.sys,!!e.o.on))); }
    if(window.__stLeaderFrame) window.__stLeaderFrame(entries, scr, hover); }
  size();
  let raf=0, dragging=false, panning=false, lastX=0, lastY=0, downX=0, downY=0, uiDown=false;
  const onUI=(e)=> !!(e&&e.target&&e.target.closest&&e.target.closest('.st-loc-card,.st-zoom,.stx,.st-side,.st-crumb,.st-top,.st-room,.st-crew,.st-float-ico,.st-gate,.st-call,.st-sfx,.st-ctrldlg,.st-locdlg,.st-alert,.st-ctx'));
  const clampR=v=>explore()?Math.max(LV[level.t].min,Math.min(LV[level.t].max,v)):Math.max(LV.sys.bgMin*BGK,Math.min(LV.sys.bgMax*BGK,v));
  const canNav=()=>explore()&&level.t==='sys';
  const canPan=()=>explore()&&(level.t==='sys'||level.t==='body');
  const ray=new T.Raycaster(), ndc=new T.Vector2(), plane=new T.Plane(new T.Vector3(0,1,0),0);
  function clampT(){ if(tgtT.length()>800) tgtT.setLength(800); }
  function groundAt(cx,cy){ const b=boxWH(); ndc.set(cx/(b.w||1)*2-1,-(cy/(b.h||1))*2+1); ray.setFromCamera(ndc,camera); plane.constant=-tgt.y;
    const p=new T.Vector3(); if(!ray.ray.intersectPlane(plane,p)) return null; return p.distanceTo(tgt)>R*4?null:p; }
  // Zoomen zum Mauszeiger: der Punkt unter dem Zeiger bleibt stehen
  function zoomBy(f,cx,cy){ const nr=clampR(RT*f); if(canNav()&&cx!=null){ const p=groundAt(cx,cy); if(p){ tgtT.add(p.sub(tgtT).multiplyScalar(1-nr/RT)); clampT(); } } RT=nr; }
  // Bildschirmfläche: rechts/links und oben/unten. Die frühere Y-Bewegung lief auf dem Boden
  // in Blickrichtung und schob die Karte in die Tiefe.
  function pan(dx,dy){ if(!canPan()) return; const feel=ctrlSens('pan'); dx=dx*(ST_DRAG.x?-1:1)*feel; dy=dragDy(dy)*feel;
    const s=2*R*Math.tan(camera.fov*Math.PI/360)/(boxWH().h||1);
    camera.updateMatrixWorld(); const e=camera.matrixWorld.elements;
    tgtT.x+=(-dx*e[0]+dy*e[4])*s; tgtT.y+=(-dx*e[1]+dy*e[5])*s; tgtT.z+=(-dx*e[2]+dy*e[6])*s; clampT(); }
  // Alle Zeiger-/Rad-/Tastatur-Listener haengen am CANVAS bzw. an ROOT, NIE an window: eine Karte
  // in einer kleinen Box auf einer fremden Seite darf nicht deren Mausrad, Rechtsklick oder
  // Pfeiltasten global abfangen. ROOT bekommt dafuer tabindex, sonst kann ein <div> nie Tastatur-
  // Fokus haben. All pointer/wheel/keyboard listeners attach to the CANVAS or ROOT, never window:
  // a map in a small box on someone else's page must not globally hijack their wheel, right-click
  // or arrow keys. ROOT gets a tabindex for that, or a <div> could never receive keyboard focus.
  if(ROOT.tabIndex<0||ROOT.tabIndex==null) ROOT.tabIndex=0;
  const down=(e)=>{ ROOT.focus&&ROOT.focus({preventScroll:true}); uiDown=onUI(e); if(uiDown) return; if(e.button===1) e.preventDefault();
    const route=!!(window.__stRouteOn&&matchMouse(e,'route'));
    const act=route?null:mouseDragAction(e);
    if(act==='pan'&&canPan()) panning=true; else if(act==='orbit'||e.button===undefined) dragging=true;
    lastX=e.clientX; lastY=e.clientY; downX=e.clientX; downY=e.clientY; };
  const up=(e)=>{ const wasUI=uiDown, wasPan=panning; uiDown=false; dragging=false; panning=false;
    if(wasUI||!e||(Math.abs(e.clientX-downX)+Math.abs(e.clientY-downY))>=6) return;
    const p=relXY(e.clientX,e.clientY);
    if(window.__stRouteOn&&matchMouse(e,'route')){ const hit=nearest(p.x,p.y,isMobile?18:14); if(hit&&hit.o&&hit.o.k!=='player'&&typeof window.__stRouteAdd==='function') window.__stRouteAdd(hit.o); return; }
    if(!wasPan&&(e.button===undefined||matchMouse(e,'pick'))) pickAt(p.x,p.y); };
  const dragK=()=>level.t==='body'?Math.min(1,Math.max(0.12,(R-1)/3)):1;
  const rot=(dx,dy)=>{ const b=boxWH(), k=dragK()*ctrlSens('rot'); azT+=dragDx(dx)/(b.w||1)*3.2*k; elT=Math.max(-1.25,Math.min(1.35,elT+dragDy(dy)/(b.h||1)*2.4*k)); };
  const move=(e)=>{ if(panning){ pan(e.clientX-lastX,e.clientY-lastY); lastX=e.clientX; lastY=e.clientY; }
    else if(dragging){ rot(e.clientX-lastX,e.clientY-lastY); lastX=e.clientX; lastY=e.clientY; }
    else if(explore()&&!onUI(e)){ const p=relXY(e.clientX,e.clientY); hx=p.x; hy=p.y; hoverReq=true; } };
  const ctxm=(e)=>{ if(explore()&&!onUI(e)) e.preventDefault(); };
  let ro=null;
  const wheel=(e)=>{ if(onUI(e)) return; e.preventDefault(); const dir=(ST_CTRL.invertWheel?-1:1)*ctrlSens('zoom'); const p=relXY(e.clientX,e.clientY); if(explore()) zoomBy(Math.pow(1.0016,e.deltaY*dir),p.x,p.y); else RT=clampR(RT+((e.deltaY*dir)>0?1.1:-1.1)); };
  const key=(e)=>{ if(!explore()||ST_CAP||(e.target&&(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||(e.target.closest&&e.target.closest('.st-ctrldlg,.st-locdlg'))))) return; if(e.ctrlKey||e.altKey||e.metaKey) return; const act=keyAction(e); if(!act) return; const st=40*ctrlSens('pan');
    if(act==='panLeft') pan(st,0); else if(act==='panRight') pan(-st,0); else if(act==='panUp') pan(0,st); else if(act==='panDown') pan(0,-st);
    else if(act==='rotLeft') azT-=0.12*ctrlSens('rot'); else if(act==='rotRight') azT+=0.12*ctrlSens('rot');
    else if(act==='zoomIn') zoomBy(Math.pow(0.8, ctrlSens('zoom'))); else if(act==='zoomOut') zoomBy(Math.pow(1.25, ctrlSens('zoom')));
    else if(act==='home'&&window.__stCtl){ window.__stCtl.highlight(null); window.__stCtl.home(); }
    else if(act==='pause'){ ST_PAUSE=!ST_PAUSE; ST_CTRL.spin=!ST_PAUSE; saveCtrl(); }
    else if(act==='search'){ const q=$('stQ'); if(q){ q.focus(); if(q.select) q.select(); } }
    else return; e.preventDefault(); };
  const aux=(e)=>{ if(e.button===1) e.preventDefault(); };
  canvas.addEventListener('mousedown',down); window.addEventListener('mouseup',up); window.addEventListener('mousemove',move);
  canvas.addEventListener('wheel',wheel,{passive:false}); canvas.addEventListener('contextmenu',ctxm); canvas.addEventListener('auxclick',aux); ROOT.addEventListener('keydown',key);
  if(window.ResizeObserver){ ro=new ResizeObserver(()=>size()); ro.observe(ROOT); } else { window.addEventListener('resize',size); }
  let pinchD=0, lastTX=null, lastTY=null, midX=null, midY=null, tsx=0, tsy=0, tMoved=false, tUI=false;
  const tStart=(e)=>{ ROOT.focus&&ROOT.focus({preventScroll:true}); tUI=onUI(e); if(e.touches&&e.touches.length===1){ tsx=e.touches[0].clientX; tsy=e.touches[0].clientY; tMoved=false; } };
  const touch=(e)=>{ if(tUI) return; if(e.touches&&e.touches.length===1){ const t=e.touches[0]; if(lastTX!=null) rot(t.clientX-lastTX,t.clientY-lastTY); if(Math.abs(t.clientX-tsx)+Math.abs(t.clientY-tsy)>8) tMoved=true; lastTX=t.clientX; lastTY=t.clientY; if(e.cancelable) e.preventDefault(); }
    else if(e.touches&&e.touches.length===2){ const a=e.touches[0], b=e.touches[1], d=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY), mx=(a.clientX+b.clientX)/2, my=(a.clientY+b.clientY)/2;
      if(pinchD){ if(explore()){ const p=relXY(mx,my); zoomBy(pinchD/d,p.x,p.y); if(midX!=null) pan(mx-midX,my-midY); } else RT=clampR(RT+(pinchD-d)*0.05); }
      pinchD=d; midX=mx; midY=my; lastTX=null; tMoved=true; if(e.cancelable) e.preventDefault(); } };
  const touchEnd=(e)=>{ if(!tUI&&e&&e.changedTouches&&e.changedTouches.length&&!tMoved&&(Math.abs(e.changedTouches[0].clientX-tsx)+Math.abs(e.changedTouches[0].clientY-tsy))<10){ const p=relXY(e.changedTouches[0].clientX,e.changedTouches[0].clientY); pickAt(p.x,p.y); } if(!e.touches||e.touches.length<2){ pinchD=0; midX=null; midY=null; } lastTX=null; lastTY=null; };
  canvas.addEventListener('touchstart',tStart,{passive:true}); canvas.addEventListener('touchmove',touch,{passive:false}); canvas.addEventListener('touchend',touchEnd);
  let blurRT=null, blurRT2=null, blurCam=null, blurScene=null, blurMat=null, mosaicMat=null, blitMat=null, blurQuad=null, layersSplit=false, blurWantHi=false, blurIsHi=false, bgShown=-1, bgStamp=0, bgMove=0;
  function allocBlur(hi){
    const dw=Math.max(2, renderer.domElement.width), dh=Math.max(2, renderer.domElement.height);
    const w=hi?dw:Math.max(2,dw>>1), h=hi?dh:Math.max(2,dh>>1);
    if(blurRT&&blurRT.width===w&&blurRT.height===h&&blurIsHi===hi) return;
    blurIsHi=hi;
    if(blurRT){ blurRT.dispose(); blurRT2.dispose(); }
    const opt={minFilter:T.LinearFilter, magFilter:T.LinearFilter, format:T.RGBAFormat, depthBuffer:true};
    blurRT=new T.WebGLRenderTarget(w,h,opt); blurRT2=new T.WebGLRenderTarget(w,h,opt);
  }
  function ensureBlur(){
    if(blurMat) return;
    blurCam=new T.OrthographicCamera(-1,1,1,-1,0.01,3); blurCam.position.z=1;
    const vs='varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }';
    blurMat=new T.ShaderMaterial({
      uniforms:{tDiffuse:{value:null}, uDir:{value:new T.Vector2()}},
      vertexShader:vs,
      fragmentShader:[
        'varying vec2 vUv; uniform sampler2D tDiffuse; uniform vec2 uDir;',
        'void main(){',
        '  vec4 c=texture2D(tDiffuse,vUv)*0.227027;',
        '  c+=texture2D(tDiffuse,vUv+uDir)*0.1945946; c+=texture2D(tDiffuse,vUv-uDir)*0.1945946;',
        '  c+=texture2D(tDiffuse,vUv+uDir*2.0)*0.1216216; c+=texture2D(tDiffuse,vUv-uDir*2.0)*0.1216216;',
        '  c+=texture2D(tDiffuse,vUv+uDir*3.0)*0.054054; c+=texture2D(tDiffuse,vUv-uDir*3.0)*0.054054;',
        '  c+=texture2D(tDiffuse,vUv+uDir*4.0)*0.016216; c+=texture2D(tDiffuse,vUv-uDir*4.0)*0.016216;',
        '  gl_FragColor=c; }'
      ].join('\n'),
      depthTest:false, depthWrite:false
    });
    mosaicMat=new T.ShaderMaterial({
      uniforms:{tDiffuse:{value:null}, uPix:{value:new T.Vector2()}, uBlock:{value:8}, uMix:{value:0}, uTime:{value:0}},
      vertexShader:vs,
      fragmentShader:[
        'varying vec2 vUv; uniform sampler2D tDiffuse; uniform vec2 uPix; uniform float uBlock; uniform float uMix; uniform float uTime;',
        'void main(){',
        '  vec4 sharp=texture2D(tDiffuse,vUv);',
        '  vec2 cell=max(uPix*max(uBlock,1.0), vec2(0.00001));',
        '  vec2 gv=floor(vUv/cell);',
        '  float n=fract(sin(dot(gv,vec2(127.1,311.7))+uTime*0.17)*43758.5453);',
        '  vec2 uv=(gv+0.5)*cell+(n-0.5)*uPix*uMix*1.4;',
        '  float sh=uMix*uPix.x*1.6;',
        '  float r=texture2D(tDiffuse,uv+vec2(sh,0.0)).r;',
        '  float g=texture2D(tDiffuse,uv).g;',
        '  float b=texture2D(tDiffuse,uv-vec2(sh,0.0)).b;',
        '  float a=texture2D(tDiffuse,uv).a;',
        '  vec2 fr=abs(fract(vUv/cell)-0.5);',
        '  float edge=smoothstep(0.40,0.5,max(fr.x,fr.y));',
        '  float flick=0.62+0.38*sin(uTime*5.5+gv.x*1.3+gv.y*0.8);',
        '  vec3 block=vec3(r,g,b)+vec3(0.45,0.78,1.0)*edge*uMix*0.38*flick*a;',
        '  gl_FragColor=vec4(mix(sharp.rgb, block, uMix), mix(sharp.a, a, uMix));',
        '}'
      ].join('\n'),
      depthTest:false, depthWrite:false
    });
    blitMat=new T.ShaderMaterial({
      uniforms:{tDiffuse:{value:null}, uGain:{value:1}},
      vertexShader:vs,
      fragmentShader:'varying vec2 vUv; uniform sampler2D tDiffuse; uniform float uGain; void main(){ vec4 c=texture2D(tDiffuse,vUv); gl_FragColor=vec4(c.rgb*uGain, c.a); }',
      transparent:true, depthTest:false, depthWrite:false
    });
    blurScene=new T.Scene(); blurQuad=new T.Mesh(new T.PlaneGeometry(2,2), blurMat); blurQuad.frustumCulled=false; blurScene.add(blurQuad);
  }
  function splitLayers(focus){
    sysGroups.forEach(function(g){ const bit=g.userData.sys===focus?0:1; g.traverse(function(o){ o.layers.set(bit); }); });
    if(plPts) plPts.forEach(function(p){ p.layers.set(p.userData.sys&&p.userData.sys!==focus?1:0); });
    layersSplit=true;
  }
  function resetLayers(){
    if(!layersSplit) return;
    sysGroups.forEach(function(g){ g.traverse(function(o){ o.layers.set(0); }); });
    if(plPts) plPts.forEach(function(p){ p.layers.set(0); });
    layersSplit=false;
  }
  function bgAmount(){
    if(!ST_CTRL||!ST_CTRL.blurBg||!explore()||level.t!=='sys'||!ST_DATA) return 0;
    let nearD=1e9, farD=0, n=0;
    Object.keys(ST_DATA.sys).forEach(function(k){ const d=offOf(k).distanceTo(camera.position); if(d<nearD) nearD=d; if(d>farD) farD=d; n++; });
    if(n<2) return 0;
    const ratio=farD/Math.max(nearD,1);
    if(ratio>=4.4) return 1;
    if(ratio<=1.55) return 0;
    const t=(ratio-1.55)/(4.4-1.55); return t*t*(3-2*t);
  }
  function stepBg(target){
    const now=performance.now();
    if(bgShown<0){ bgShown=target; bgStamp=now; bgMove=0; return bgShown; }
    const dt=Math.min(0.08, Math.max(0.001, (now-bgStamp)/1000));
    bgStamp=now;
    const prev=bgShown;
    bgShown+=(target-bgShown)*(1-Math.exp(-dt/0.55));
    if(Math.abs(target-bgShown)<0.0012) bgShown=target;
    const vel=Math.abs(bgShown-prev)/dt;
    const want=Math.min(1, vel/0.42);
    bgMove+=(want-bgMove)*(1-Math.exp(-dt/0.16));
    if(bgMove<0.025) bgMove=0;
    return bgShown;
  }
  function mosaicOf(a){
    if(bgMove<0.05||a<=0.03||a>=0.97) return 0;
    const t=Math.max(0, Math.min(1, (a-0.03)/0.94));
    const shape=Math.sin(Math.PI*Math.pow(t, 0.85));
    return Math.min(1, Math.max(shape, 0.45)*bgMove);
  }
  function useHiRes(shown){
    if(shown<0.012) blurWantHi=false;
    else if(blurWantHi){ if(shown>0.94) blurWantHi=false; }
    else if(shown<0.9) blurWantHi=true;
    return blurWantHi;
  }
  function blurPass(src, dst, dx, dy){
    blurQuad.material=blurMat; blurMat.uniforms.tDiffuse.value=src.texture; blurMat.uniforms.uDir.value.set(dx,dy);
    renderer.setRenderTarget(dst); renderer.clear(true,true,true); renderer.render(blurScene, blurCam);
  }
  function renderView(){
    const shown=stepBg(bgAmount());
    bgAmt=shown;
    if(lblLayer){
      lblLayer.style.setProperty('--st-far', (shown*9).toFixed(2)+'px');
      lblLayer.style.setProperty('--st-far-op', (1-shown*0.5).toFixed(3));
    }
    if(shown<0.015||renderer.domElement.width<2){ resetLayers(); camera.layers.set(0); renderer.setRenderTarget(null); renderer.autoClear=true; renderer.render(scene,camera); return; }
    ensureBlur(); allocBlur(useHiRes(shown)); splitLayers(ST_SYS);
    renderer.setClearColor(0x000000, 0);
    renderer.autoClear=true;
    renderer.setRenderTarget(blurRT); renderer.clear(true,true,true);
    camera.layers.set(1); renderer.render(scene, camera);
    const w=blurRT.width, h=blurRT.height, dw=Math.max(1, renderer.domElement.width);
    const m=mosaicOf(shown);
    let src=blurRT;
    if(m>0.03){
      blurQuad.material=mosaicMat;
      mosaicMat.uniforms.tDiffuse.value=blurRT.texture;
      mosaicMat.uniforms.uPix.value.set(1/w, 1/h);
      mosaicMat.uniforms.uBlock.value=(5+m*20)*(0.94+0.06*Math.sin(performance.now()*0.004));
      mosaicMat.uniforms.uMix.value=m;
      mosaicMat.uniforms.uTime.value=performance.now()*0.001;
      renderer.setRenderTarget(blurRT2); renderer.clear(true,true,true); renderer.render(blurScene, blurCam);
      src=blurRT2;
    }
    const cover=m>0.45?0.4:1;
    const rad=((0.3+Math.pow(shown,1.45)*6.2)*cover)*(w/dw);
    const mid=src===blurRT?blurRT2:blurRT;
    blurPass(src, mid, rad/w, 0);
    const out1=mid===blurRT?blurRT2:blurRT;
    blurPass(mid, out1, 0, rad/h);
    let out=out1;
    if(shown>0.58){
      const rad2=(((shown-0.58)/0.42)*5.2)*(w/dw);
      const a=out===blurRT?blurRT2:blurRT;
      blurPass(out, a, rad2/w, 0);
      const b=a===blurRT?blurRT2:blurRT;
      blurPass(a, b, 0, rad2/h);
      out=b;
    }
    camera.layers.set(0);
    renderer.setRenderTarget(null); renderer.clear(true,true,true); renderer.autoClear=false;
    const dim=shown<=0.72?1:(1-0.14*((shown-0.72)/0.28));
    blurQuad.material=blitMat; blitMat.uniforms.tDiffuse.value=out.texture; blitMat.uniforms.uGain.value=dim;
    renderer.render(blurScene, blurCam);
    renderer.clearDepth();
    renderer.render(scene, camera);
    renderer.autoClear=true;
  }
  function cleanup(){ cancelAnimationFrame(raf); if(blurRT){ blurRT.dispose(); blurRT2.dispose(); blurRT=null; blurRT2=null; } if(blurMat){ blurMat.dispose(); mosaicMat.dispose(); blitMat.dispose(); if(blurQuad&&blurQuad.geometry) blurQuad.geometry.dispose(); blurMat=null; } if(routeLine){ scene.remove(routeLine); routeLine.geometry.dispose(); routeLine.material.dispose(); routeLine=null; } if(typeof clearTrail==='function') clearTrail(); window.__stCtl=null; canvas.removeEventListener('mousedown',down); window.removeEventListener('mouseup',up); window.removeEventListener('mousemove',move); if(ro) ro.disconnect(); else window.removeEventListener('resize',size); canvas.removeEventListener('wheel',wheel); canvas.removeEventListener('contextmenu',ctxm); canvas.removeEventListener('auxclick',aux); ROOT.removeEventListener('keydown',key); canvas.removeEventListener('touchstart',tStart); canvas.removeEventListener('touchmove',touch); canvas.removeEventListener('touchend',touchEnd); if(grp) dispose(grp); lblLayer.remove(); try{ renderer.dispose(); }catch(e){} }
  let loopErr=false;
  function loop(){ if(!canvas.isConnected){ cleanup(); return; } raf=requestAnimationFrame(loop); try{
    if(!ST_PAUSE&&!spinHold&&!dragging&&!panning) azT+=explore()?0.0003:0.00045;
    if(!ST_PAUSE&&!spinHold) spin.forEach(m=>{ m.rotation.y+=0.0012; });
    const ex=explore(); if(ex!==lastEx){ lastEx=ex; if(ST_DATA&&level.t==='sys') rebuild(); }
    if(!ex){ if(level.t!=='sys') focus(null); tgtT.copy(offOf(ST_SYS)); }
    else if(level.t==='sys'&&ST_DATA&&++sysTick%30===0){ let bk=null,bd=1e9; Object.keys(ST_DATA.sys).forEach(k=>{ const dd=offOf(k).distanceTo(tgtT); if(dd<bd){ bd=dd; bk=k; } }); if(bd<180) setSys(bk); }
    if(wormClock) wormClock.value=performance.now()*0.001;
    if(wormMouths.length) wormMouths.forEach(function(m){ const t=wormClock?wormClock.value:0, s=1+0.045*Math.sin(t*0.55+m.userData.ph); m.scale.set(m.userData.bs*s,m.userData.bs*s,m.userData.bs); if(m.material) m.material.opacity=m.userData.op*(0.78+0.22*(0.5+0.5*Math.sin(t*0.62+m.userData.ph))); });
    beaconOn.draw(performance.now());
    sysGroups.forEach(g=>{ g.visible=true; }); if(plPts){ const bcol=beaconHex(), pulse=0.5+0.5*Math.sin(performance.now()/240); plPts.forEach(p=>{ p.visible=true; const faded=stOtherFaded(p.userData.sys, !!(p.userData.beacon||p.userData.live)); if(p.userData.beacon){ p.material.color.setHex(bcol); const full=(isMobile?58:68)+pulse*18; p.material.size=faded?full*0.42:full; p.material.opacity=faded?0.22:(0.82+pulse*0.18); } else if(p.userData.live){ p.material.opacity=faded?0.14:0.85; } else if(p.material){ const full=isMobile?48:56; p.material.size=faded?full*0.45:full; p.material.opacity=faded?0.22:1; } }); }
    if(animNodes.length){ animNodes.forEach(a=>{ a.o.rotation.y+=a.s; }); entries.forEach(e=>{ if(e.node) e.node.getWorldPosition(e.p); }); }
    az+=(azT-az)*0.08; el+=(elT-el)*0.08; R+=(RT-R)*0.07; tgt.lerp(tgtT,0.1);
    camera.position.set(tgt.x+R*Math.cos(el)*Math.sin(az),tgt.y+R*Math.sin(el),tgt.z+R*Math.cos(el)*Math.cos(az)); camera.lookAt(tgt); sky.position.copy(camera.position);
    renderView();
    if(hoverReq){ hoverReq=false; const e=nearest(hx,hy,10); hover=(e&&!e.body)?e:null; }
    labels(); }catch(err){ if(!loopErr){ loopErr=true; console.error('Live Map, Fehler im Bildaufbau:',err); } } }
  const ringTex=(function(){ const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.beginPath();x.arc(32,32,24,0,7);x.lineWidth=6;x.strokeStyle='#fff';x.stroke();return new T.CanvasTexture(c); })();
  let hlPts=null;
  let hlVis=null;
  function drawHl(){ if(hlPts){ scene.remove(hlPts); hlPts.geometry.dispose(); hlPts.material.dispose(); hlPts=null; } hlVis=null; if(!hlSet) return;
    const on=new Set(entries.map(e=>e.o.id)); hlVis=new Set(); hlSet.forEach(id=>{ let x=ST_DATA.by[id]; while(x&&!on.has(x.id)) x=ST_DATA.by[x.p]; if(x&&x.k!=='star') hlVis.add(x.id); });
    const ps=entries.filter(e=>hlVis.has(e.o.id)).map(e=>e.p); if(!ps.length) return; const a=new Float32Array(ps.length*3); ps.forEach((p,i)=>{a[i*3]=p.x;a[i*3+1]=p.y;a[i*3+2]=p.z;});
    const g=new T.BufferGeometry(); g.setAttribute('position',new T.BufferAttribute(a,3));
    hlPts=new T.Points(g,new T.PointsMaterial({color:0xffd76a,size:isMobile?26:24,sizeAttenuation:false,map:ringTex,transparent:true,depthTest:false,alphaTest:0.2})); hlPts.renderOrder=5; scene.add(hlPts); }
  function highlight(ids){ hlSet=ids&&ids.length?new Set(ids):null; if(hlSet){ hl=null; home(); } drawHl(); }
  let routeLine=null;
  function showRoute(ids){ if(routeLine){ scene.remove(routeLine); routeLine.geometry.dispose(); routeLine.material.dispose(); routeLine=null; }
    if(!ids||ids.length<2) return; const pts=[]; ids.forEach(id=>{ const e=entries.find(x=>x.o&&x.o.id===id); if(e) pts.push(e.p.clone()); }); if(pts.length<2) return;
    routeLine=new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({color:0xffb000,depthTest:false})); routeLine.renderOrder=6; scene.add(routeLine); }
  let trailMesh=[];
  function dropMesh(o){ scene.remove(o); if(o.geometry) o.geometry.dispose(); if(o.material){ o.material.map=null; o.material.dispose(); } }
  function clearTrail(){ trailMesh.forEach(dropMesh); trailMesh=[]; }
  function trailPoints(objects){ const pts=[]; (objects||[]).forEach(o=>{ if(o&&typeof o.x==='number') pts.push(Vs(o)); }); return pts; }
  // Endpoints stay on the places. Samples between them move out of a star or planet
  // they would otherwise cut through. The shared route line is left alone.
  function liftSegment(a,b,bodies){
    const steps=8, raw=[];
    for(let s=0;s<=steps;s++) raw.push(a.clone().lerp(b,s/steps));
    for(let s=1;s<steps;s++){
      const p=raw[s];
      for(let pass=0;pass<4;pass++){
        let moved=false;
        bodies.forEach(body=>{
          const need=body.r*1.22, dist=p.distanceTo(body.p);
          if(dist>=need) return;
          const dir=p.clone().sub(body.p);
          if(dir.lengthSq()<1e-8) dir.set(0,1,0); else dir.normalize();
          p.copy(body.p).add(dir.multiplyScalar(need));
          moved=true;
        });
        if(!moved) break;
      }
    }
    raw[0].copy(a); raw[steps].copy(b);
    return raw;
  }
  function liftTrail(pts){
    const bodies=entries.filter(e=>e&&e.body&&e.p&&e.r>0);
    if(pts.length<2) return {line:pts.map(p=>p.clone()), segs:[]};
    const segs=[], line=[];
    for(let i=0;i<pts.length-1;i++){
      const seg=liftSegment(pts[i], pts[i+1], bodies);
      segs.push(seg);
      if(!line.length) line.push(seg[0]);
      for(let j=1;j<seg.length;j++) line.push(seg[j]);
    }
    return {line, segs};
  }
  function pointOnSegs(segs, u){
    if(!segs.length) return null;
    const span=segs.length*Math.max(0, Math.min(1, u||0));
    let i=Math.min(segs.length-1, Math.floor(span));
    let k=span-i;
    if(i===segs.length-1) k=Math.min(1, k);
    const seg=segs[i], f=k*(seg.length-1);
    let j=Math.min(seg.length-2, Math.floor(f));
    if(j<0) j=0;
    return seg[j].clone().lerp(seg[j+1], f-j);
  }
  function pathUntil(segs, u){
    const cur=pointOnSegs(segs, u);
    if(!cur) return [];
    const span=segs.length*Math.max(0, Math.min(1, u||0));
    let i=Math.min(segs.length-1, Math.floor(span));
    const out=[];
    for(let s=0;s<i;s++){
      const seg=segs[s];
      if(!out.length) out.push(seg[0]);
      for(let j=1;j<seg.length;j++) out.push(seg[j]);
    }
    const seg=segs[i], k=Math.min(1, span-i), f=k*(seg.length-1);
    let j=Math.min(seg.length-2, Math.floor(f));
    if(j<0) j=0;
    if(!out.length) out.push(seg[0].clone());
    for(let n=1;n<=j;n++) out.push(seg[n]);
    out.push(cur);
    return out;
  }
  function playTrail(objects, u, follow){ clearTrail(); if(!ST_DATA||!objects||!objects.length) return null;
    if(level.t!=='sys') focus(null);
    const pts=trailPoints(objects); if(!pts.length) return null;
    u=Math.max(0, Math.min(1, u||0));
    const lifted=liftTrail(pts);
    let cur=pts[0];
    if(pts.length>1){
      const full=new T.Line(new T.BufferGeometry().setFromPoints(lifted.line), new T.LineBasicMaterial({color:0x7fd7ff,transparent:true,opacity:0.35,depthTest:false}));
      full.renderOrder=7; scene.add(full); trailMesh.push(full);
      cur=pointOnSegs(lifted.segs, u)||pts[0];
      const pastPts=pathUntil(lifted.segs, u);
      const past=new T.Line(new T.BufferGeometry().setFromPoints(pastPts), new T.LineBasicMaterial({color:0xffb000,depthTest:false}));
      past.renderOrder=8; scene.add(past); trailMesh.push(past);
    }
    const mark=new T.Points(new T.BufferGeometry().setFromPoints([cur]), new T.PointsMaterial({color:0xfff2c4,size:isMobile?40:30,sizeAttenuation:false,map:beaconOn.tex,transparent:true,depthTest:false,blending:T.AdditiveBlending}));
    mark.renderOrder=9; scene.add(mark); trailMesh.push(mark);
    if(follow){ tgtT.copy(cur); RT=Math.min(Math.max(RT, 12), 22); }
    return cur;
  }
  function frameTrail(objects){ const cur=playTrail(objects, 0, false); const pts=trailPoints(objects); if(!pts.length) return cur;
    const c=new T.Vector3(); pts.forEach(p=>c.add(p)); c.multiplyScalar(1/pts.length);
    let reach=14; pts.forEach(p=>{ reach=Math.max(reach, c.distanceTo(p)*2.4); });
    tgtT.copy(c); RT=Math.max(16, Math.min(LV.sys.max*0.85, reach));
    return cur;
  }
  window.__stCtl={ _cleanup:cleanup, getAz:()=>az, holdSpin:on=>{ spinHold=!!on; }, level:()=>level, focus, flyTo, rebuild, home, zoomBy, pan, highlight, showRoute, clearTrail, playTrail, frameTrail, goSystem, galaxy, onSys:null,
    hitAt:function(cx,cy){ const p=relXY(cx,cy); const hit=nearest(p.x,p.y,isMobile?22:16); return hit&&hit.o&&hit.o.k!=='player'?hit.o:null; },
    setSystem:k=>{ if(!k) return; ST_SYS=k; tintSky(k); if(!explore()&&ST_DATA){ bgScale(); rebuild(); tgtT.copy(offOf(k)); tgt.copy(tgtT); RT=LV.sys.def*BGK; } },
    zoom01:()=>{ const L=LV[level.t]; return (Math.log(RT)-Math.log(L.min))/(Math.log(L.max)-Math.log(L.min)); },
    setZoom01:t=>{ const L=LV[level.t]; RT=Math.exp(Math.log(L.min)+t*(Math.log(L.max)-Math.log(L.min))); },
    debug:()=>({R,RT,tgt:tgt.toArray(),tgtT:tgtT.toArray(),level:level.t}), pos:n=>{ const e=entries.find(x=>x.o.n===n); return e?e.p.toArray():null; }, links:()=>(ST_DATA.gal.links||[]).map(l=>({l:l.sa+'-'+l.sb,live:l.live,a:ST_DATA.by[l.a]&&ST_DATA.by[l.a].n,b:ST_DATA.by[l.b]&&ST_DATA.by[l.b].n,pa:ST_DATA.by[l.a]&&Vs(ST_DATA.by[l.a]).toArray().map(v=>+v.toFixed(1)),pb:ST_DATA.by[l.b]&&Vs(ST_DATA.by[l.b]).toArray().map(v=>+v.toFixed(1))})), tubes:()=>wormStat?wormStat.tubes:0, worm:()=>wormStat, aim:(x,y,z,d)=>{ tgtT.set(x,y,z); tgt.copy(tgtT); if(d>0){ RT=d; R=d; } },
    applySky:applySky,
    skyInfo:()=>({on:ST_SKY.on, style:ST_SKY.style, points:skyStars?skyStars.geometry.getAttribute('position').count:0, nebula:skyNeb.filter(s=>s.visible).length, size:skyStars?skyStars.material.size:0}),
    reset:()=>{ hl=null; hover=null; hlSet=null; drawHl(); if(level.t!=='sys') focus(null);
      const th=document.querySelector('.cmd'), tk=th&&ST_THEME_SYS[th.getAttribute('data-dtheme')]; if(tk){ ST_SYS=tk; tintSky(tk); } bgScale(); tgtT.copy(offOf(ST_SYS)); RT=LV.sys.def*BGK; }, onLevel:null };
  applySky();
  stLoad().then(()=>{ bgScale(); tgtT.copy(offOf(ST_SYS)); tgt.copy(tgtT); RT=R=LV.sys.def*BGK; rebuild(); }).catch(()=>{});
  loop();
  return cleanup;
}
// Ein Sprachknopf. Die Auswahl setzt die Oberflaeche und die Spieltexte zusammen:
// Deutsch -> deutsche Spieltexte, jede andere Sprache -> englische Spieltexte.
// Chinesische Ortsnamen kommen aus js/loc.js. Ohne gespeicherte Wahl folgt die Seite
// der Browsersprache (siehe js/i18n.js browserLang).
const ST_DRAG_KEY='sclmw_drag_invert';
const ST_CTRL_KEY='sclmw_controls';
const ST_CTRL_DEFAULT={
  invertX:false, invertY:false, invertWheel:false, hint:true, spin:true, castSound:true, blurBg:true,
  sensRot:1, sensPan:1, sensZoom:1,
  mouse:{
    orbit:[{b:0}],
    pan:[{b:2},{b:1},{b:0,shift:1},{b:0,ctrl:1}],
    pick:[{b:0}],
    route:[{b:0,shift:1}]
  },
  keys:{
    panLeft:['a','arrowleft'], panRight:['d','arrowright'], panUp:['w','arrowup'], panDown:['s','arrowdown'],
    rotLeft:['q'], rotRight:['e'], zoomIn:['='], zoomOut:['-'],
    home:['home'], pause:['space'], search:['/']
  }
};
const ST_MOUSE_ACTS=['orbit','pan','pick','route'];
const ST_KEY_ACTS=['panLeft','panRight','panUp','panDown','rotLeft','rotRight','zoomIn','zoomOut','home','pause','search'];
let ST_DRAG={x:false,y:false};
let ST_CTRL=null;
let ST_CAP=null;
let ST_CAP_ON=false;
function ctrlDefaults(){ return JSON.parse(JSON.stringify(ST_CTRL_DEFAULT)); }
function chordSame(a,b){ return !!a&&!!b&&a.b===b.b&&!!a.shift===!!b.shift&&!!a.ctrl===!!b.ctrl&&!!a.alt===!!b.alt; }
function validChord(c){ return c&&(c.b===0||c.b===1||c.b===2); }
function readCtrl(){
  let saved=null;
  try{ saved=JSON.parse(localStorage.getItem(ST_CTRL_KEY)||'null'); }catch(e){}
  const d=ctrlDefaults();
  if(saved&&typeof saved==='object'){
    ['invertX','invertY','invertWheel','hint','spin','castSound','blurBg'].forEach(function(k){ if(typeof saved[k]==='boolean') d[k]=saved[k]; });
    ['sensRot','sensPan','sensZoom'].forEach(function(k){ const n=+saved[k]; if(n>=0.25&&n<=3) d[k]=n; });
    if(saved.mouse) ST_MOUSE_ACTS.forEach(function(a){ if(Array.isArray(saved.mouse[a])) d.mouse[a]=saved.mouse[a].filter(validChord).slice(0,4); });
    if(saved.keys) ST_KEY_ACTS.forEach(function(a){ if(Array.isArray(saved.keys[a])) d.keys[a]=saved.keys[a].filter(function(x){ return typeof x==='string'&&x.length&&x.length<24; }).slice(0,4); });
  }else{
    try{ const old=JSON.parse(localStorage.getItem(ST_DRAG_KEY)||'null'); if(old&&typeof old==='object'){ d.invertX=!!old.x; d.invertY=!!old.y; } }catch(e){}
  }
  ST_CTRL=d;
  ST_DRAG={x:!!d.invertX,y:!!d.invertY};
  ST_PAUSE=!d.spin;
}
readCtrl();
SC.castSound=function(on){ if(on===undefined) return !!(ST_CTRL&&ST_CTRL.castSound); ST_CTRL.castSound=!!on; saveCtrl(); return ST_CTRL.castSound; };
const ST_SKY_KEY='sclmw_sky';
const ST_SKY_STYLES=['classic','sparse','dense','spectrum','glow'];
let ST_SKY={on:true, style:'classic'};
function readSky(){
  let saved=null; try{ saved=JSON.parse(localStorage.getItem(ST_SKY_KEY)||'null'); }catch(e){}
  if(saved&&typeof saved==='object'){
    ST_SKY.on=saved.on!==false;
    if(ST_SKY_STYLES.indexOf(saved.style)>=0) ST_SKY.style=saved.style;
  }
}
function saveSky(){ try{ localStorage.setItem(ST_SKY_KEY, JSON.stringify({on:ST_SKY.on, style:ST_SKY.style})); }catch(e){} if(window.__stCtl&&window.__stCtl.applySky) window.__stCtl.applySky(); }
function resetSky(){ ST_SKY={on:true, style:'classic'}; saveSky(); }
readSky();
function ctrlSens(kind){ const n=kind==='rot'?ST_CTRL.sensRot:kind==='zoom'?ST_CTRL.sensZoom:ST_CTRL.sensPan; return n>=0.25&&n<=3?n:1; }
function matchMouse(e, act){ return !!(e&&ST_CTRL&&(ST_CTRL.mouse[act]||[]).some(function(c){ return c.b===e.button&&!!c.shift===!!e.shiftKey&&!!c.ctrl===!!e.ctrlKey&&!!c.alt===!!e.altKey; })); }
function mouseDragAction(e){ if(matchMouse(e,'pan')) return 'pan'; if(matchMouse(e,'orbit')) return 'orbit'; return null; }
function canonKey(e){ const k=e&&e.key; if(!k||k==='Escape'||k==='Shift'||k==='Control'||k==='Alt'||k==='Meta') return ''; if(k===' ') return 'space'; if(k==='+') return '='; return k.length===1?k.toLowerCase():k.toLowerCase(); }
function keyHit(e, name){ const c=canonKey(e); return c===name||(name==='='&&c==='='); }
function keyAction(e){ if(!ST_CTRL) return null; let found=null; ST_KEY_ACTS.forEach(function(a){ if(!found&&(ST_CTRL.keys[a]||[]).some(function(n){ return keyHit(e,n); })) found=a; }); return found; }
// Orbit X starts mirrored. Pan X is already natural. The saved invert flag flips both.
function dragDx(dx){ return dx*(ST_DRAG.x?1:-1); }
function dragDy(dy){ return dy*(ST_DRAG.y?-1:1); }
function mouseLabel(c){ const parts=[]; if(c.ctrl) parts.push(_t('ctrl.ctrl')); if(c.alt) parts.push(_t('ctrl.alt')); if(c.shift) parts.push(_t('ctrl.shift')); parts.push(_t('ctrl.mouse'+c.b)); return parts.join('+'); }
function keyLabel(name){ if(name==='space') return _t('ctrl.space'); if(name==='arrowleft') return '←'; if(name==='arrowright') return '→'; if(name==='arrowup') return '↑'; if(name==='arrowdown') return '↓'; if(name==='='||name==='+') return '+'; if(name==='home') return 'Home'; return String(name).toUpperCase(); }
function controlsHint(){ const orbit=(ST_CTRL.mouse.orbit[0]&&mouseLabel(ST_CTRL.mouse.orbit[0]))||_t('ctrl.unset'); const pan=(ST_CTRL.mouse.pan[0]&&mouseLabel(ST_CTRL.mouse.pan[0]))||_t('ctrl.unset'); return _t('ctrl.hint_live',{orbit:orbit,pan:pan}); }
function syncPauseBtn(){ const pause=$('stPause'); if(!pause) return; pause.innerHTML=SC.ico?SC.ico(ST_PAUSE?'play':'pause'):''; pause.title=ST_PAUSE?_t('action.resume_rotation'):_t('action.pause_rotation'); }
function applyCtrlSideEffects(){
  ST_DRAG={x:!!ST_CTRL.invertX,y:!!ST_CTRL.invertY};
  const hint=$('stHint'); if(hint){ hint.hidden=!ST_CTRL.hint; hint.textContent=controlsHint(); }
  syncPauseBtn();
}
function saveCtrl(){
  ST_DRAG={x:!!ST_CTRL.invertX,y:!!ST_CTRL.invertY};
  try{ localStorage.setItem(ST_CTRL_KEY, JSON.stringify(ST_CTRL)); localStorage.setItem(ST_DRAG_KEY, JSON.stringify(ST_DRAG)); }catch(e){}
  applyCtrlSideEffects();
}
function dedupeChord(list){ const out=[]; list.forEach(function(c){ if(!out.some(function(x){ return chordSame(x,c); })) out.push(c); }); return out; }
function setMouse(act, index, chord){
  let list=(ST_CTRL.mouse[act]||[]).slice();
  if(index>=0&&index<list.length) list[index]=chord; else list.push(chord);
  ST_CTRL.mouse[act]=dedupeChord(list).slice(0,4);
  if(act==='pan'||act==='orbit'){ const other=act==='pan'?'orbit':'pan'; ST_CTRL.mouse[other]=(ST_CTRL.mouse[other]||[]).filter(function(c){ return !chordSame(c,chord); }); }
  saveCtrl();
}
function setKey(act, index, name){
  let list=(ST_CTRL.keys[act]||[]).slice();
  if(index>=0&&index<list.length) list[index]=name; else list.push(name);
  const seen={}; list=list.filter(function(k){ if(seen[k]) return false; seen[k]=1; return true; }).slice(0,4);
  ST_CTRL.keys[act]=list;
  ST_KEY_ACTS.forEach(function(a){ if(a!==act) ST_CTRL.keys[a]=(ST_CTRL.keys[a]||[]).filter(function(k){ return k!==name; }); });
  saveCtrl();
}
function capStop(){ if(!ST_CAP_ON) return; ST_CAP_ON=false; window.removeEventListener('keydown', capKey, true); window.removeEventListener('mousedown', capMouse, true); window.removeEventListener('contextmenu', capMenu, true); }
function capMenu(e){ if(ST_CAP&&ST_CAP.kind==='mouse'){ e.preventDefault(); e.stopPropagation(); } }
function capKey(e){
  if(!ST_CAP) return;
  if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); ST_CAP=null; capStop(); paintCtrl(); return; }
  if(ST_CAP.kind!=='key'||e.ctrlKey||e.altKey||e.metaKey) return;
  const name=canonKey(e); if(!name) return;
  e.preventDefault(); e.stopPropagation();
  const cap=ST_CAP; ST_CAP=null; capStop(); setKey(cap.act, cap.index, name); paintCtrl();
}
function capMouse(e){
  if(!ST_CAP) return;
  if(ST_CAP.kind==='key'){
    const inside=e.target.closest&&e.target.closest('.st-ctrldlg');
    ST_CAP=null; capStop(); if(!inside) paintCtrl(); return;
  }
  e.preventDefault(); e.stopPropagation();
  const cap=ST_CAP; ST_CAP=null; capStop();
  setMouse(cap.act, cap.index, {b:e.button, shift:e.shiftKey?1:0, ctrl:e.ctrlKey?1:0, alt:e.altKey?1:0});
  paintCtrl();
}
function beginCapture(kind, act, index){
  ST_CAP={kind:kind, act:act, index:index};
  paintCtrl();
  setTimeout(function(){ if(!ST_CAP) return; capStop(); ST_CAP_ON=true; window.addEventListener('keydown', capKey, true); window.addEventListener('mousedown', capMouse, true); window.addEventListener('contextmenu', capMenu, true); }, 0);
}
function bindChips(kind, act){
  const list=kind==='mouse'?(ST_CTRL.mouse[act]||[]):(ST_CTRL.keys[act]||[]);
  const waiting=ST_CAP&&ST_CAP.kind===kind&&ST_CAP.act===act;
  let html=list.map(function(item, i){
    const label=kind==='mouse'?mouseLabel(item):keyLabel(item);
    const wait=waiting&&ST_CAP.index===i;
    return '<span class="st-ctrl-chip'+(wait?' wait':'')+'"><button type="button" data-rebind="'+kind+'" data-act="'+act+'" data-i="'+i+'">'+(wait?esc(_t('ctrl.listen')):esc(label))+'</button><button type="button" data-clear="'+kind+'" data-act="'+act+'" data-i="'+i+'" aria-label="'+esc(_t('ctrl.reset'))+'">×</button></span>';
  }).join('');
  if(list.length<4){
    const adding=waiting&&ST_CAP.index<0;
    html+='<button type="button" class="st-ctrl-add'+(adding?' wait':'')+'" data-add="'+kind+'" data-act="'+act+'">'+(adding?esc(_t('ctrl.listen')):esc(_t('ctrl.add')))+'</button>';
  }
  if(!list.length&&!(waiting&&ST_CAP.index<0)) html='<span class="st-ctrl-name">'+esc(_t('ctrl.unset'))+'</span>'+html;
  return html;
}
function paintCtrl(){
  const body=$('stCtrlBody'); if(!body) return;
  const row=function(kind, act){ return '<div class="st-ctrl-row"><span class="st-ctrl-name">'+esc(_t('ctrl.'+act))+'</span><span class="st-ctrl-binds">'+bindChips(kind, act)+'</span></div>'; };
  const flag=function(key){ const on=!!ST_CTRL[key]; return '<button type="button" class="st-ctrl-flag'+(on?' on':'')+'" data-flag="'+key+'">'+esc(_t('ctrl.'+key))+' · '+esc(_t(on?'ctrl.flipped':'ctrl.normal'))+'</button>'; };
  const slide=function(key){ const n=Math.round((ST_CTRL[key]||1)*100); return '<label class="st-ctrl-slide"><span>'+esc(_t('ctrl.'+key))+'</span><input type="range" min="40" max="220" step="5" data-sens="'+key+'" value="'+n+'"><b data-sens-out="'+key+'">'+n+'</b></label>'; };
  const tog=function(key){ const on=!!ST_CTRL[key]; return '<button type="button" class="st-ctrl-flag'+(on?' on':'')+'" data-flag="'+key+'">'+esc(_t('ctrl.'+key))+' · '+esc(_t(on?'ctrl.on':'ctrl.off'))+'</button>'; };
  body.innerHTML='<p class="st-ctrldlg-lead">'+esc(_t('ctrl.lead'))+'</p>'+
    '<div class="st-ctrl-sec">'+esc(_t('ctrl.mouse'))+'</div>'+ST_MOUSE_ACTS.map(function(a){ return row('mouse', a); }).join('')+
    '<div class="st-ctrl-sec">'+esc(_t('ctrl.keys'))+'</div>'+ST_KEY_ACTS.map(function(a){ return row('key', a); }).join('')+
    '<div class="st-ctrl-sec">'+esc(_t('ctrl.feel'))+'</div><div class="st-ctrl-flags">'+flag('invertX')+flag('invertY')+flag('invertWheel')+'</div>'+
    slide('sensRot')+slide('sensPan')+slide('sensZoom')+
    '<div class="st-ctrl-sec">'+esc(_t('sky.title'))+'</div><div class="st-ctrl-flags"><button type="button" class="st-ctrl-flag'+(ST_SKY.on?' on':'')+'" data-sky="toggle">'+esc(_t('sky.title'))+' · '+esc(_t(ST_SKY.on?'ctrl.on':'ctrl.off'))+'</button></div><div class="st-ctrl-flags">'+ST_SKY_STYLES.map(function(id){ return '<button type="button" class="st-ctrl-flag'+(ST_SKY.on&&ST_SKY.style===id?' on':'')+'" data-sky="'+id+'">'+esc(_t('sky.'+id))+'</button>'; }).join('')+'</div>'+
    '<div class="st-ctrl-sec">'+esc(_t('ctrl.more'))+'</div><div class="st-ctrl-flags">'+tog('spin')+tog('hint')+tog('castSound')+tog('blurBg')+'</div>'+
    '<div class="st-ctrl-row"><button type="button" class="st-ctrl-reset" data-ctrl="reset">'+esc(_t('ctrl.reset'))+'</button></div>';
}
function openCtrl(){
  let dlg=$('stCtrlDlg');
  if(!dlg){
    dlg=document.createElement('div'); dlg.id=ID('stCtrlDlg'); dlg.className='st-ctrldlg'; dlg.hidden=true;
    dlg.innerHTML='<div class="st-ctrldlg-card"><div class="st-ctrldlg-h"><h3>'+esc(_t('ctrl.title'))+'</h3><button type="button" class="st-ctrldlg-x" id="'+ID('stCtrlX')+'">×</button></div><div class="st-ctrldlg-body" id="'+ID('stCtrlBody')+'"></div></div>';
    ROOT.appendChild(dlg);
    $('stCtrlX').onclick=function(){ closeCtrl(); };
    dlg.addEventListener('mousedown', function(e){ if(e.target===dlg) closeCtrl(); });
    $('stCtrlBody').addEventListener('click', onCtrlClick);
    $('stCtrlBody').addEventListener('input', onCtrlInput);
  }
  const h=dlg.querySelector('h3'); if(h) h.textContent=_t('ctrl.title');
  dlg.hidden=false; paintCtrl();
}
function closeCtrl(){ const dlg=$('stCtrlDlg'); ST_CAP=null; capStop(); if(dlg) dlg.hidden=true; }
function onCtrlClick(e){
  const t=e.target.closest('[data-rebind],[data-add],[data-clear],[data-flag],[data-ctrl],[data-sky]');
  if(!t) return;
  e.preventDefault(); e.stopPropagation();
  if(t.hasAttribute('data-clear')){ const kind=t.getAttribute('data-clear'), act=t.getAttribute('data-act'), i=+t.getAttribute('data-i'); const list=kind==='mouse'?ST_CTRL.mouse[act]:ST_CTRL.keys[act]; if(list) list.splice(i,1); ST_CAP=null; capStop(); saveCtrl(); paintCtrl(); return; }
  if(t.hasAttribute('data-rebind')){ beginCapture(t.getAttribute('data-rebind'), t.getAttribute('data-act'), +t.getAttribute('data-i')); return; }
  if(t.hasAttribute('data-add')){ beginCapture(t.getAttribute('data-add'), t.getAttribute('data-act'), -1); return; }
  if(t.hasAttribute('data-flag')){ const k=t.getAttribute('data-flag'); ST_CTRL[k]=!ST_CTRL[k]; if(k==='spin') ST_PAUSE=!ST_CTRL.spin; saveCtrl(); paintCtrl(); return; }
  if(t.hasAttribute('data-sky')){ const v=t.getAttribute('data-sky'); if(v==='toggle') ST_SKY.on=!ST_SKY.on; else if(ST_SKY_STYLES.indexOf(v)>=0){ ST_SKY.style=v; ST_SKY.on=true; } saveSky(); paintCtrl(); return; }
  if(t.getAttribute('data-ctrl')==='reset'){ ST_CTRL=ctrlDefaults(); ST_PAUSE=!ST_CTRL.spin; ST_CAP=null; capStop(); saveCtrl(); resetSky(); paintCtrl(); }
}
function onCtrlInput(e){
  const s=e.target.closest('[data-sens]'); if(!s) return;
  const key=s.getAttribute('data-sens'), n=Math.max(40, Math.min(220, +s.value||100));
  ST_CTRL[key]=n/100;
  const out=s.parentNode&&s.parentNode.querySelector('[data-sens-out="'+key+'"]'); if(out) out.textContent=String(n);
  saveCtrl();
}
function paintDrag(){
  const btn=$('stDrag'); if(btn) btn.title=_t('ctrl.title');
  applyCtrlSideEffects();
  const dlg=$('stCtrlDlg'); if(dlg&&!dlg.hidden){ const h=dlg.querySelector('h3'); if(h) h.textContent=_t('ctrl.title'); paintCtrl(); }
}
function paintSysNames(){
  if(!ROOT) return;
  ROOT.querySelectorAll('[data-sys]').forEach(b=>{ const k=b.getAttribute('data-sys'); if(!k||k==='all') return;
    const name=k.charAt(0).toUpperCase()+k.slice(1), i=b.querySelector('i'), label=gn(name);
    b.textContent=''; if(i) b.appendChild(i); b.appendChild(document.createTextNode(label)); });
}
function refreshGameText(){
  paintSysNames();
  if(window.__stCtl) window.__stCtl.rebuild();
  const lp=$('stLoc'); if(lp&&lp.__re) lp.__re();
  const box=$('stRes'); if(box&&!box.hidden) stSearch();
  stPlList();
  const call=$('stCall'); if(call) delete call.dataset.sig;
  if(ST_PIN){ const pinned=(ST_PL||[]).find(function(x){ return String(x.id)===ST_PIN; }); if(pinned) paintPilot(pinned); }
  if(window.__stCtl&&window.__stCtl.onLevel) window.__stCtl.onLevel(window.__stCtl.level());
}
function paintLoc(){
  const box=$('stLocPick'); if(!box||!SC.loc) return;
  const st=SC.loc.stats(), mode=st.mode;
  const row=(id,on)=>'<button type="button" data-loc="'+id+'"'+(on?' class="on"':'')+'>'+esc(_t('loc.'+id))+'</button>';
  box.innerHTML=row('auto',mode==='auto')+row('hans',mode==='hans')+row('hant',mode==='hant')+row('off',mode==='off')+
    '<button type="button" data-loc="load">'+esc(_t('loc.load'))+'</button>'+
    '<button type="button" data-loc="paste">'+esc(_t('loc.paste'))+'</button>'+
    '<button type="button" data-loc="clear">'+esc(_t('loc.clear'))+'</button>'+
    '<div class="st-loc-stat">'+esc(st.custom?_t('loc.using',{n:st.custom}):_t('loc.none'))+'</div>';
  const btn=$('stLocBtn'); if(btn){ btn.title=_t('loc.title'); btn.classList.toggle('on', mode!=='auto'&&mode!=='off'||!!st.custom); }
}
function openLocPaste(){
  let dlg=$('stLocDlg');
  if(!dlg){
    dlg=document.createElement('div'); dlg.id=ID('stLocDlg'); dlg.className='st-locdlg';
    dlg.innerHTML='<div class="st-locdlg-card"><h3>'+esc(_t('loc.paste_title'))+'</h3><p>'+esc(_t('loc.paste_hint'))+'</p><textarea id="'+ID('stLocIni')+'" spellcheck="false"></textarea><p class="st-loc-err" id="'+ID('stLocErr')+'"></p><div class="st-locdlg-row"><button type="button" class="sc-lmw-btn sm primary" id="'+ID('stLocApply')+'">'+esc(_t('loc.apply'))+'</button><button type="button" class="sc-lmw-btn sm" id="'+ID('stLocCancel')+'">'+esc(_t('loc.cancel'))+'</button></div></div>';
    ROOT.appendChild(dlg);
    $('stLocCancel').onclick=()=>{ dlg.hidden=true; };
    $('stLocApply').onclick=()=>{ const err=$('stLocErr'); err.textContent='';
      SC.loc.applyText($('stLocIni').value).then(()=>{ dlg.hidden=true; }).catch(()=>{ err.textContent=_t('loc.bad'); }); };
  }
  $('stLocErr').textContent=''; $('stLocIni').value=''; dlg.hidden=false;
}
function onLocPick(action){
  if(action==='load'){ let inp=$('stLocFile'); if(!inp){ inp=document.createElement('input'); inp.type='file'; inp.id=ID('stLocFile'); inp.accept='.ini,text/plain'; inp.hidden=true; ROOT.appendChild(inp);
      inp.onchange=()=>{ const f=inp.files&&inp.files[0]; inp.value=''; if(!f) return; SC.loc.loadFile(f).catch(()=>alert(_t('loc.bad'))); }; }
    inp.click(); return; }
  if(action==='paste'){ openLocPaste(); return; }
  if(action==='clear'){ SC.loc.clearCustom(); return; }
  SC.loc.setMode(action);
}
const ST_UI_THEMES=['classic','compact','practical','chassis','scifi','haze'];
const ST_UI_THEME_KEY='sclmw_ui_theme';
let ST_UI_THEME='haze';
function normUiTheme(t){ return ST_UI_THEMES.indexOf(t)>=0?t:null; }
function readUiTheme(given){
  let saved=null; try{ saved=localStorage.getItem(ST_UI_THEME_KEY); }catch(e){}
  return normUiTheme(saved)||normUiTheme(given)||normUiTheme(window.LIVEMAP_CONFIG&&window.LIVEMAP_CONFIG.THEME)||'haze';
}
function syncLangAttr(){
  if(!ROOT||!SC.i18n) return;
  const map={de:'de',en:'en','zh-Hans':'zh-Hans','zh-Hant':'zh-Hant'};
  ROOT.setAttribute('lang', map[SC.i18n.lang]||'en');
}
function uiLangMark(){ return SC.i18n&&SC.i18n.mark?SC.i18n.mark():'EN'; }
function paintPicks(){
  const langs=[['zh-Hans','lang.zhHans'],['zh-Hant','lang.zhHant'],['en','lang.en'],['de','lang.de']];
  const lp=$('stLangPick');
  if(lp) lp.innerHTML=langs.map(x=>'<button type="button" data-ui-lang="'+x[0]+'"'+(SC.i18n&&SC.i18n.lang===x[0]?' class="on"':'')+'>'+esc(_t(x[1]))+'</button>').join('');
  const tp=$('stThemePick');
  if(tp) tp.innerHTML=ST_UI_THEMES.map(id=>'<button type="button" data-ui-theme="'+id+'"'+(ST_UI_THEME===id?' class="on"':'')+'>'+esc(_t('theme.'+id))+'</button>').join('');
}
function applyUiTheme(t, persist){
  t=normUiTheme(t)||'haze'; ST_UI_THEME=t;
  if(ROOT) ROOT.setAttribute('data-theme', t);
  if(persist){ try{ localStorage.setItem(ST_UI_THEME_KEY, t); }catch(e){} }
  try{ document.dispatchEvent(new CustomEvent('sclmw-theme',{detail:t})); }catch(e){}
  const box=$('stThemePick');
  if(box) box.querySelectorAll('[data-ui-theme]').forEach(b=>b.classList.toggle('on', b.getAttribute('data-ui-theme')===t));
  const btn=$('stTheme'); if(btn) btn.title=_t('theme.title')+' · '+_t('theme.'+t);
}
function stApplyLang(){
  const ui=$('stExUI');
  if(ui){
    const sysSel=$('stSysSel'), allBtn=sysSel&&sysSel.querySelector('[data-sys="all"]'); if(allBtn) allBtn.title=_t('system.all_title');
    const exx=$('stExX'); if(exx) exx.title=_t('ui.leave_map');
    const q=$('stQ'); if(q) q.placeholder=_t('search.placeholder');
    const qx=$('stQx'); if(qx) qx.title=_t('ui.clear');
    const cats=$('stCats'); if(cats) cats.querySelectorAll('[data-cat]').forEach(b=>{ b.textContent=_t('cat.'+b.getAttribute('data-cat')); });
    const legLbl=$('stSideMin'); if(legLbl) legLbl.textContent=_t('tabs.legend')+' ▸';
    const plLbl=$('stSidePlLbl'); if(plLbl) plLbl.textContent=_t('tabs.players');
    syncGameLang();
    const ul=$('stUiLang'); if(ul){ ul.title=_t('uilang.title'); ul.textContent=uiLangMark(); }
    const tb=$('stTheme'); if(tb) tb.title=_t('theme.title')+' · '+_t('theme.'+ST_UI_THEME);
    const dg=$('stDrag'); if(dg) dg.title=_t('ctrl.title');
    paintDrag();
    paintLoc();
    if(SC.loc) SC.loc.sync();
    refreshGameText();
    const plq=$('stPlQ'); if(plq) plq.placeholder=_t('player.search_placeholder');
    const hint=$('stHint'); if(hint){ hint.hidden=!ST_CTRL.hint; hint.textContent=controlsHint(); }
    const pause=$('stPause'); if(pause){ pause.innerHTML=SC.ico?SC.ico(ST_PAUSE?'play':'pause'):''; pause.title=ST_PAUSE?_t('action.resume_rotation'):_t('action.pause_rotation'); }
    const hb=$('stHome'); if(hb) hb.title=_t('action.home_title');
    const comN=$('stComN'); if(comN) comN.textContent=_t('compass.north');
    const comS=$('stComS'); if(comS) comS.textContent=_t('compass.south');
    const comW=$('stComW'); if(comW) comW.textContent=_t('compass.west');
    const comE=$('stComE'); if(comE) comE.textContent=_t('compass.east');
    paintPicks();
    syncLangAttr();
  }
  if(ST_DATA) stLegend();
  else if(ST_DATA_ERR){ const leg=$('stLegend'); if(leg) leg.innerHTML='<p class="sc-lmw-muted">'+esc(_t('error.data_load_failed'))+'</p>'; }
  stPlList();
  const res=$('stRes'); if(res&&!res.hidden) stSearch();
  const lp=$('stLoc'); if(lp&&lp.__re) lp.__re();
}
function enterStExplore(){
  if(ROOT.classList.contains('st-explore')) return;
  const ctl=window.__stCtl; if(!ctl) return;
  const back=$('stBack'); if(back) back.remove();
  ROOT.classList.add('st-explore');
  const ui=document.createElement('div'); ui.className='st-exui'; ui.id=ID('stExUI');
  ui.innerHTML=
    '<div class="st-top" id="'+ID('stTop')+'"><div class="st-top-row"><div class="st-sys" id="'+ID('stSysSel')+'">'+[['stanton','Stanton'],['pyro','Pyro'],['nyx','Nyx']].map(s=>'<button data-sys="'+s[0]+'"><i style="background:'+ST_SYSLOOK[s[0]].dot+'"></i>'+s[1]+'</button>').join('')+'<button data-sys="all" title="'+esc(_t('system.all_title'))+'">'+(SC.ico?SC.ico('star'):'')+'</button></div><div class="st-crumb" id="'+ID('stCrumb')+'"></div>'+
      '<div class="st-sbox"><input id="'+ID('stQ')+'" placeholder="'+esc(_t('search.placeholder'))+'" autocomplete="off" enterkeyhint="search"><button id="'+ID('stQx')+'" title="'+esc(_t('ui.clear'))+'">'+(SC.ico?SC.ico('close'):'')+'</button></div>'+
      '<div class="st-zoom"><button class="st-pause" id="'+ID('stPause')+'" title="'+esc(_t('action.pause_rotation'))+'">'+(SC.ico?SC.ico('pause'):'')+'</button><button class="st-pause" id="'+ID('stHome')+'" title="'+esc(_t('action.home_title'))+'">'+(SC.ico?SC.ico('home'):'')+'</button><span>'+(SC.ico?SC.ico('sat'):'')+'</span><input type="range" id="'+ID('stZoom')+'" min="0" max="1" step="0.001"><span>'+(SC.ico?SC.ico('scope'):'')+'</span></div>'+
      '<div class="st-dockslot" id="'+ID('stDockSlot')+'" hidden></div>'+
      '<div class="st-cats" id="'+ID('stCats')+'">'+ST_CATS.map(c=>'<button data-cat="'+c[0]+'"'+(ST_CAT===c[0]?' class="on"':'')+'>'+esc(_t(c[1]))+'</button>').join('')+'</div>'+
      '<div class="st-tools"><div class="st-tabs"><button id="'+ID('stSideMin')+'">'+esc(_t('tabs.legend'))+' ▸</button><button id="'+ID('stSidePl')+'"><span id="'+ID('stSidePlLbl')+'">'+esc(_t('tabs.players'))+'</span> <span id="'+ID('stPlCnt')+'"></span></button><button type="button" class="st-sq" id="'+ID('stUiLang')+'" title="'+esc(_t('uilang.title'))+'">'+uiLangMark()+'</button><button type="button" class="st-sq" id="'+ID('stTheme')+'" title="'+esc(_t('theme.title'))+'">'+(SC.ico?SC.ico('theme'):'')+'</button><button type="button" class="st-sq" id="'+ID('stDrag')+'" title="'+esc(_t('drag.title'))+'">'+(SC.ico?SC.ico('drag'):'')+'</button><button type="button" class="st-sq" id="'+ID('stLocBtn')+'" title="'+esc(_t('loc.title'))+'">文</button></div>'+
      '<div class="st-pick" id="'+ID('stLangPick')+'" hidden></div><div class="st-pick st-pick-themes" id="'+ID('stThemePick')+'" hidden></div><div class="st-pick st-pick-loc" id="'+ID('stLocPick')+'" hidden></div></div><button class="stx" id="'+ID('stExX')+'" title="'+esc(_t('ui.leave_map'))+'">'+(SC.ico?SC.ico('close'):'')+'</button></div>'+
      '<div class="st-res" id="'+ID('stRes')+'" hidden></div></div>'+
    '<div class="st-side min" id="'+ID('stSide')+'"><div class="st-tab" id="'+ID('stTabLeg')+'"><div id="'+ID('stLegend')+'"></div></div><div class="st-tab" id="'+ID('stTabPl')+'" hidden><input id="'+ID('stPlQ')+'" placeholder="'+esc(_t('player.search_placeholder'))+'"><div id="'+ID('stPlList')+'"></div></div></div>'+
    '<div class="st-compass"><svg viewBox="0 0 100 100" width="86" height="86">'+
      '<circle cx="50" cy="50" r="46" fill="rgba(8,12,20,.82)" stroke="rgba(120,165,230,.35)" stroke-width="1.5"/>'+
      '<g id="'+ID('stComDial')+'">'+
        '<line x1="50" y1="50" x2="50" y2="15" stroke="#37e1ff" stroke-width="2.5"/>'+
        '<line x1="50" y1="50" x2="50" y2="85" stroke="#ff62ab" stroke-width="2"/>'+
        '<line x1="15" y1="50" x2="85" y2="50" stroke="rgba(200,215,240,.45)" stroke-width="1"/>'+
        '<text id="'+ID('stComN')+'" x="50" y="13" text-anchor="middle" font-size="12" font-weight="700" fill="#37e1ff" font-family="Chakra Petch,sans-serif">'+_t('compass.north')+'</text>'+
        '<text id="'+ID('stComS')+'" x="50" y="95" text-anchor="middle" font-size="12" fill="#cfe0ee" font-family="Chakra Petch,sans-serif">'+_t('compass.south')+'</text>'+
        '<text id="'+ID('stComW')+'" x="7" y="54" text-anchor="middle" font-size="12" fill="#cfe0ee" font-family="Chakra Petch,sans-serif">'+_t('compass.west')+'</text>'+
        '<text id="'+ID('stComE')+'" x="93" y="54" text-anchor="middle" font-size="12" fill="#cfe0ee" font-family="Chakra Petch,sans-serif">'+_t('compass.east')+'</text>'+
      '</g>'+
      '<polygon points="50,1 45,10 55,10" fill="#ffd76a"/>'+
    '</svg></div>'+
    '<div class="st-hint" id="'+ID('stHint')+'">'+esc(_t('hint.controls'))+'</div>';
  ROOT.appendChild(ui);
  const zoom=$('stZoom'), dial=$('stComDial'), pause=$('stPause');
  if(zoom){ zoom.value=ctl.zoom01(); zoom.oninput=()=>ctl.setZoom01(parseFloat(zoom.value)); }
  if(pause){ syncPauseBtn(); pause.onclick=()=>{ ST_PAUSE=!ST_PAUSE; ST_CTRL.spin=!ST_PAUSE; saveCtrl(); }; }
  $('stExX').onclick=exitStExplore;
  $('stUiLang').onclick=e=>{ e.stopPropagation(); const p=$('stLangPick'); $('stThemePick').hidden=true; $('stLocPick').hidden=true; closeCtrl(); p.hidden=!p.hidden; };
  $('stTheme').onclick=e=>{ e.stopPropagation(); const p=$('stThemePick'); $('stLangPick').hidden=true; $('stLocPick').hidden=true; closeCtrl(); p.hidden=!p.hidden; };
  $('stDrag').onclick=e=>{ e.stopPropagation(); $('stLangPick').hidden=true; $('stThemePick').hidden=true; $('stLocPick').hidden=true; openCtrl(); };
  $('stLocBtn').onclick=e=>{ e.stopPropagation(); const p=$('stLocPick'); $('stLangPick').hidden=true; $('stThemePick').hidden=true; closeCtrl(); p.hidden=!p.hidden; };
  $('stLangPick').onclick=e=>{ const b=e.target.closest('[data-ui-lang]'); if(!b||!SC.i18n) return; e.stopPropagation(); SC.i18n.setLang(b.getAttribute('data-ui-lang')); $('stLangPick').hidden=true; syncGameLang(); if(SC.loc) SC.loc.sync(); stApplyLang(); };
  $('stThemePick').onclick=e=>{ const b=e.target.closest('[data-ui-theme]'); if(!b) return; e.stopPropagation(); applyUiTheme(b.getAttribute('data-ui-theme'), true); $('stThemePick').hidden=true; };
  $('stLocPick').onclick=e=>{ const b=e.target.closest('[data-loc]'); if(!b) return; e.stopPropagation(); onLocPick(b.getAttribute('data-loc')); };
  if(!ROOT.__stPickClose){ ROOT.__stPickClose=function(e){ if(e.target.closest('.st-pick,.st-ctrldlg,#'+ID('stUiLang')+',#'+ID('stTheme')+',#'+ID('stDrag')+',#'+ID('stLocBtn')+',.st-locdlg')) return; const a=$('stLangPick'),b=$('stThemePick'),d=$('stLocPick'); if(a) a.hidden=true; if(b) b.hidden=true; if(d) d.hidden=true; closeCtrl(); }; ROOT.addEventListener('click', ROOT.__stPickClose); }
  if(SC.loc) SC.loc.onChange=function(){ paintLoc(); refreshGameText(); };
  if(!window.__stLangSync){ window.__stLangSync=function(){ if(SC.loc) SC.loc.sync(); }; document.addEventListener('sclmw-lang', window.__stLangSync); }
  paintDrag();
  paintLoc();
  paintSysNames();
  paintPicks();
  const hb=$('stHome'); if(hb) hb.onclick=()=>{ ctl.highlight(null); ctl.home(); };
  const side=$('stSide');
  const sideTab=t=>{ const open=!side.classList.contains('min'), cur=$('stTabPl').hidden?'leg':'pl', btn=t==='pl'?$('stSidePl'):$('stSideMin');
    if(open&&cur===t){ side.classList.add('min'); side.classList.remove('st-anchored'); side.__btn=null; side.style.left=side.style.top=side.style.right=side.style.bottom=side.style.width=side.style.maxHeight=''; }
    else { side.classList.remove('min'); $('stTabLeg').hidden=t!=='leg'; $('stTabPl').hidden=t!=='pl'; side.__btn=btn; placeUnder(side, btn, 320); }
    $('stSideMin').classList.toggle('on',!side.classList.contains('min')&&t==='leg'); $('stSidePl').classList.toggle('on',!side.classList.contains('min')&&t==='pl'); if(t==='pl') stPlList(); };
  $('stSideMin').onclick=()=>sideTab('leg'); $('stSidePl').onclick=()=>sideTab('pl'); $('stPlQ').oninput=()=>stPlList();
  function crumb(lv){ const c=$('stCrumb'); if(!c||!ST_DATA) return; const path=[]; let x=lv&&lv.o; while(x){ path.unshift(x); x=ST_DATA.by[x.p]; }
    if(!path.length) path.push(ST_DATA.star);
    c.innerHTML=path.map((o,i)=>i===path.length-1?'<b>'+esc(gn(o.n))+'</b>':'<a data-cid="'+o.id+'">'+esc(gn(o.n))+'</a>').join('<span class="sc-lmw-muted">›</span>');
    c.querySelectorAll('[data-cid]').forEach(a=>a.onclick=()=>{ const o=ST_DATA.by[a.getAttribute('data-cid')]; ctl.focus(o.k==='star'?null:o); }); }
  ctl.onLevel=crumb;
  const sysMark=k=>{ $('stSysSel').querySelectorAll('[data-sys]').forEach(b=>b.classList.toggle('on',b.getAttribute('data-sys')===k)); crumb(ctl.level()); };
  ctl.onSys=sysMark; sysMark(ST_SYS);
  $('stSysSel').querySelectorAll('[data-sys]').forEach(b=>b.onclick=()=>{ const k=b.getAttribute('data-sys'); stCloseCard(); if(k==='all'){ ctl.galaxy(); return; } ctl.goSystem(k); sysMark(k); });
  const plTick=()=>stLoadPlayers().then(ch=>{ if(ch&&window.__stCtl) window.__stCtl.rebuild(); stLegend(); stPlList(); });
  clearInterval(window.__stPlT); { const C=window.LIVEMAP_CONFIG||{}, ms=C.PLAYERS_POLL_MS==null?30000:+C.PLAYERS_POLL_MS; if(ms>0) window.__stPlT=setInterval(plTick,Math.max(5000,ms)); }   // 0 = kein erneutes Laden
  window.__stReloadPlayers=()=>plTick();
  stLoad().then(()=>{ crumb(ctl.level()); stLegend(); plTick(); }).catch(()=>{ ST_DATA_ERR=true; const leg=$('stLegend'); if(leg) leg.innerHTML='<p class="sc-lmw-muted">'+esc(_t('error.data_load_failed'))+'</p>'; plTick(); });
  // Obere Leiste: Reiter + Suche
  const q=$('stQ'); let tmr=null;
  q.oninput=()=>{ clearTimeout(tmr); ST_ANCHOR=q; tmr=setTimeout(stSearch,120); };
  q.onfocus=()=>{ ST_ANCHOR=q; if(q.value.trim()||ST_CAT!=='all') stSearch(); };
  q.onkeydown=(e)=>{ const box=$('stRes');
    if(e.key==='Escape'){ box.hidden=true; q.blur(); }
    else if(e.key==='ArrowDown'||e.key==='ArrowUp'){ const rs=[...box.querySelectorAll('.st-r')]; if(!rs.length) return; let i=rs.findIndex(r=>r.classList.contains('sel')); rs.forEach(r=>r.classList.remove('sel')); i=Math.max(0,Math.min(rs.length-1,i+(e.key==='ArrowDown'?1:-1))); rs[i].classList.add('sel'); rs[i].scrollIntoView({block:'nearest'}); e.preventDefault(); }
    else if(e.key==='Enter'){ const r=box.hidden?null:(box.querySelector('.st-r.sel')||box.querySelector('.st-r')); if(r) r.click(); } };
  $('stQx').onclick=()=>{ q.value=''; ST_SEC=null; ST_CAT='all'; stCatsMark(); $('stRes').hidden=true; ctl.highlight(null); };
  $('stCats').querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{ const c=b.getAttribute('data-cat'); ST_SEC=null;
    if(ST_CAT===c&&!$('stRes').hidden){ $('stRes').hidden=true; return; } ST_CAT=c; ST_ANCHOR=b; stCatsMark(); stCloseCard(); stSearch(); });
  if(!window.__stPopResize){ window.__stPopResize=function(){ const box=$('stRes'), side=$('stSide'); if(box&&!box.hidden) placeUnder(box, popAnchor(), 440); if(side&&!side.classList.contains('min')&&side.__btn) placeUnder(side, side.__btn, 320); }; window.addEventListener('resize', window.__stPopResize); }
  function spinUI(){ window.__stExRaf=requestAnimationFrame(spinUI); const c=window.__stCtl; if(!c) return; if(dial) dial.setAttribute('transform','rotate('+(-c.getAz()*180/Math.PI)+' 50 50)'); if(zoom&&document.activeElement!==zoom) zoom.value=c.zoom01(); }
  spinUI();
  window.__stExStop=function(){ cancelAnimationFrame(window.__stExRaf); };
  if(window.__stDockMount) window.__stDockMount();
}
// ---- Obere Suchleiste: Orte, Erze, Items, Schiffe, Waren, Blueprints, Missionen ----
const ST_CATS=[['all','cat.all'],['pl','cat.pl'],['loc','cat.loc'],['ore','cat.ore'],['item','cat.item'],['ship','cat.ship'],['ware','cat.ware'],['bp','cat.bp'],['mis','cat.mis']];
const ST_SEC_IC={'Armor':'🛡️','Clothing':'👕','Undersuits':'🧥','Liveries':'🎨','Personal Weapons':'🔫','Vehicle Weapons':'💥','Systems':'⚙️','Avionics':'📡','Utility':'🔧','Miscellaneous':'📦','Decorations':'🪴','Commodities':'🪙'};
let ST_CAT='all', ST_SEC=null, ST_ANCHOR=null, ST_TERM=null, ST_ORES=null, ST_ORES_TRIED=false;
function popAnchor(){ if(ST_ANCHOR&&ST_ANCHOR.isConnected) return ST_ANCHOR; const cats=$('stCats'), on=cats&&cats.querySelector('button.on'); return on||$('stQ'); }
function placeUnder(panel, btn, prefW){ if(!panel||!btn) return; const anchor=btn.closest?(btn.closest('.st-sbox')||btn):btn;
  const host=panel.offsetParent||ROOT, hr=host.getBoundingClientRect(), map=(ROOT&&ROOT.getBoundingClientRect())||hr, br=anchor.getBoundingClientRect(), gap=6;
  const maxW=Math.min(prefW||440, Math.max(220, map.width-16));
  let left=br.left-hr.left, minLeft=(map.left+8)-hr.left, maxLeft=(map.right-8)-hr.left-maxW;
  if(left>maxLeft) left=Math.max(minLeft, maxLeft); if(left<minLeft) left=minLeft;
  const top=br.bottom-hr.top+gap, room=map.bottom-br.bottom-gap-28;
  panel.style.width=maxW+'px'; panel.style.left=left+'px'; panel.style.top=top+'px'; panel.style.right='auto'; panel.style.bottom='auto';
  panel.style.maxHeight=Math.max(140, Math.min(540, room))+'px'; panel.classList.add('st-anchored'); }
const stCache=new Map();
async function stGet(url){ const c=stCache.get(url); if(c&&Date.now()-c.t<300000) return c.d;
  const d=await fetch(url).then(r=>r.json()).then(j=>(j&&j.data)||[]).catch(()=>null); if(d) stCache.set(url,{t:Date.now(),d}); return d||[]; }
function stCloseCard(){ const p=$('stLoc'); if(p) p.remove(); window.__stCtl&&window.__stCtl.highlight(null); }
function stCatsMark(){ const c=$('stCats'); if(c) c.querySelectorAll('[data-cat]').forEach(b=>b.classList.toggle('on',b.getAttribute('data-cat')===ST_CAT)); }
function stTermIdx(){ if(ST_TERM) return ST_TERM; ST_TERM={}; ST_DATA.d.objects.forEach(o=>(o.terms||[]).forEach(t=>{ ST_TERM[t.id]=o; })); return ST_TERM; }
const stBase=n=>n.toLowerCase().replace(/\s*\((raw|ore|r)\)\s*$/,'').replace(/^raw\s*/,'').trim();
async function stOres(){ if(ST_ORES) return ST_ORES; let list=[];
  // data/ores.json kommt aus scripts/items-build.py (UEX-Warennummern fuer Roh- und Raffinadepreise).
  // Fehlt die Datei, bleiben code/ido/idr leer; die Erznamen kommen trotzdem aus den Mining-Daten.
  // Nur EIN Versuch pro Sitzung, sonst haemmert jede Suchanfrage gegen den Server.
  // data/ores.json comes from scripts/items-build.py (UEX commodity ids for raw and refined prices).
  // Without the file, code/ido/idr stay empty; ore names still come from the mining data.
  // Only ONE attempt per session, or every search would hit the server again.
  if(!ST_ORES_TRIED){ ST_ORES_TRIED=true; try{ list=(await fetch(pathOf('data/ores.json'),{cache:'no-cache'}).then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); })).ores||[]; }catch(e){} }
  const I=stOreIndex(), map={};
  list.forEach(o=>{ map[stBase(o.n)]={n:o.n,code:o.code,ido:o.ido,idr:o.idr,mine:[]}; });
  Object.keys(I.ores).filter(n=>!/^Inert/i.test(n)).forEach(n=>{ const b=stBase(n); const x=map[b]||(map[b]={n:n.replace(/\s*\((Raw|Ore)\)$/,''),mine:[]}); x.mine.push(n); });
  const res=Object.values(map).sort((a,b)=>a.n.localeCompare(b.n)); ST_ORES=res; return res; }
function stShipImg(x){ return x&&x.i&&x.ph?pathOf('data/img/ships/'+x.i+'.jpg'):''; }
function stCut(n,l){ return !ST_CAT||ST_CAT==='all'||n<=l?'':'<!--CUT:'+(n-l)+'-->'; }
function stThumb(ic,img){ return img?'<img loading="lazy" src="'+esc(img)+'" alt="" data-ico="ship" onerror="stIcoFall(this)">':'<i class="ic">'+ic+'</i>'; }
function stIcoFall(el){ var i=document.createElement('i'); i.className='ic'; i.innerHTML=SC.ico?SC.ico(el.getAttribute('data-ico')||'ship'):''; el.replaceWith(i); }
function stRow(kind,key,ic,title,sub,img){ return '<div class="st-r" data-kind="'+kind+'" data-key="'+esc(String(key))+'">'+stThumb(ic,img)+'<div><b>'+esc(title)+'</b><span>'+esc(sub)+'</span></div></div>'; }
// Welche Systeme ein Erz wirklich hat (die Mining-Daten sind ueber alle Systeme zusammengefuehrt)
function stOreWhere(x){ if(!x.mine.length) return _t('ore.no_location'); const I=stOreIndex(), S=new Set(); x.mine.forEach(n=>(I.ores[n]||[]).forEach(r=>(I.locs[r.k]||[]).forEach(o=>{ const s=stSysName(o); if(s) S.add(s); }))); return S.size?_t('ore.mineable_in',{list:[...S].join(', ')}):_t('ore.mineable_no_fixed'); }
let ST_SGEN=0;
async function stSearch(){ const box=$('stRes'), qi=$('stQ'); if(!box||!ST_DATA) return; const gen=++ST_SGEN;
  const q=(qi.value||'').trim().toLowerCase(), cat=ST_CAT, all=cat==='all';
  if(!q&&all){ box.hidden=true; return; } box.hidden=false; placeUnder(box, popAnchor(), 440);
  if(rootW()<700){ const lp=$('stLoc'); if(lp) lp.remove(); }
  const has=s=>{ if(!q) return true; const a=String(s||'').toLowerCase(); if(a.indexOf(q)>=0) return true; const g=gn(s); return g!==s&&String(g).toLowerCase().indexOf(q)>=0; }, lim=n=>all?5:n;
  const C=await uexCatalog(), M=await stMis(), ORES=await stOres(), BPD=(all||cat==='bp')?await stBps():{bps:{}};
  if(!C._ix){ C.items.forEach((x,i)=>{ x._i=i; }); C.ships.forEach((x,i)=>{ x._i=i; }); C._ix=1; }
  let h='';
  const head=(tt,n,c)=>all?'<div class="st-rh">'+tt+(n>5?' <a data-more="'+c+'">'+esc(_t('action.show_all',{n}))+'</a>':'')+'</div>':'';
  if((all||cat==='pl')&&ST_PL){ const L=ST_PL.filter(p=>has(p.name)||has(p.player)||has(p.location)||has(p.ship)||has(p.system)||has(p.server));
    if(ST_PL_ERR&&cat==='pl') h+='<p class="st-warn">'+esc(ST_PL_ERR)+'</p>';
    if(L.length) h+=head(_t('cat.pl'),L.length,'pl')+L.slice(0,lim(300)).map(p=>stRow('pl',p.id,p.online?'🟢':'⚪',p.name||p.player,[p.online?_t('status.online'):_t('status.offline_last',{time:stAgo(p.last_seen||p.when)}),p.location&&(playerPlaceName(p)||gn(p.location))+(p.online&&p.when&&!stLocFresh(p)?' ('+stAgo(p.when)+')':''),p.ship&&gn(p.ship),p.server&&(_t('pilot.server')+' '+p.server),travelBlurb(p)].filter(v=>v&&v!=='—').join(' · '))).join('')+stCut(L.length,lim(300)); else if(cat==='pl'&&!ST_PL_ERR) h+='<p class="sc-lmw-muted" style="padding:10px;font-size:.84rem">'+_t('search.none_players')+'</p>'; }
  if(all||cat==='loc'){ const L=ST_DATA.d.objects.filter(o=>o.k!=='asteroid'&&(!o.h||ST_HID)&&(q?has(o.n):(ST_PRIO[o.k]||0)>=2)).sort((a,b)=>(ST_PRIO[b.k]||0)-(ST_PRIO[a.k]||0)||a.n.localeCompare(b.n));
    if(L.length) h+=head(_t('cat.loc'),L.length,'loc')+L.slice(0,lim(600)).map(o=>stRow('loc',o.id,kindMark(o.k),gn(o.n),kindLabel(o.k)+(stBodyOf(o)!==o&&stBodyOf(o).k!=='star'?' · '+gn(stBodyOf(o).n):'')+' · '+stSysName(o))).join('')+stCut(L.length,lim(600)); }
  if(all||cat==='ore'){ const L=ORES.filter(o=>has(o.n)||o.mine.some(has)||has(o.code));
    if(L.length) h+=head(_t('cat.ore'),L.length,'ore')+L.slice(0,lim(200)).map(o=>stRow('ore',o.n,'⛏️',gn(o.n),stOreWhere(o)+(o.code?' · '+o.code:''))).join('')+stCut(L.length,lim(200)); }
  if(all||cat==='item'){
    if(!q&&!ST_SEC&&cat==='item'){ const S={}; C.items.forEach(x=>{ if(x.k!=='c') S[x.s||_t('common.misc')]=(S[x.s||_t('common.misc')]||0)+1; });
      h+=Object.keys(S).sort((a,b)=>S[b]-S[a]).map(s=>stRow('sec',s,ST_SEC_IC[s]||'📦',gn(s),_t('count.items',{n:S[s]}))).join(''); }
    else { const L=C.items.filter(x=>x.k!=='c'&&(!ST_SEC||x.s===ST_SEC)&&(has(x.n)||has(x.co)||has(x.s)));
      if(L.length) h+=(ST_SEC&&!all?'<div class="st-rh"><a data-back="1">'+esc(_t('action.back_categories'))+'</a> · '+esc(gn(ST_SEC))+'</div>':head(_t('cat.item'),L.length,'item'))+L.slice(0,lim(150)).map((x,i)=>stRow('item',x._i,ST_SEC_IC[x.s]||'📦',gn(x.n),[gn(x.s),gn(x.co),x.sz?_t('label.size_abbr',{sz:x.sz}):''].filter(Boolean).join(' · '))).join('')+stCut(L.length,lim(150)); } }
  if(all||cat==='ship'){ const L=C.ships.filter(x=>has(x.n)||has(x.co));
    if(L.length) h+=head(_t('cat.ship'),L.length,'ship')+L.slice(0,lim(300)).map(x=>stRow('ship',x._i,'🚀',gn(x.n),[gn(x.co),x.crew?_t('label.crew',{n:x.crew}):''].filter(Boolean).join(' · '),stShipImg(x))).join('')+stCut(L.length,lim(300)); }
  if(all||cat==='ware'){ const L=C.items.filter(x=>x.k==='c'&&has(x.n));
    if(L.length) h+=head(_t('cat.ware'),L.length,'ware')+L.slice(0,lim(250)).map(x=>stRow('ware',x._i,'🪙',gn(x.n),(x.pb?_t('price.buy_from',{price:uexMoney(x.pb)}):'')+(x.pb&&x.ps?' · ':'')+(x.ps?_t('price.sell_up_to',{price:uexMoney(x.ps)}):''))).join('')+stCut(L.length,lim(250)); }
  if(all||cat==='bp'){ const B=M.d.bps||{}, R=BPD.bps||{}; const L=[...new Set(Object.keys(R).concat(Object.keys(B)))].filter(n=>has(n)||has((B[n]||{}).cat)||has((R[n]||{}).t)).sort((a,b)=>a.localeCompare(b));
    const src=n=>B[n]?(B[n].m.length===1?_t('count.mission_one'):_t('count.mission_many',{n:B[n].m.length})):(R[n]&&R[n].src==='default'?_t('bp.from_start'):_t('bp.no_known_mission'));
    if(L.length) h+=head(_t('cat.bp'),L.length,'bp')+L.slice(0,lim(1800)).map(n=>stRow('bp',n,'🧩',gn(n),[gn((R[n]||{}).t||(B[n]||{}).cat),src(n)].filter(Boolean).join(' · '))).join('')+stCut(L.length,lim(1800)); }
  if(all||cat==='mis'){ const L=M.d.groups.map((g,i)=>[g,i]).filter(([g])=>has(stTy(g.ty))||has(g.g)||g.t.some(has)).sort((a,b)=>stTy(a[0].ty).localeCompare(stTy(b[0].ty))||b[0].n-a[0].n);
    if(L.length) h+=head(_t('cat.mis'),L.length,'mis')+L.slice(0,lim(200)).map(([g,i])=>stRow('mis',i,'🎯',stTy(g.ty)+' · '+gn(g.g),_t('count.orders',{n:g.n})+(g.il?' · '+_t('tag.illegal'):'')+(g.bp?' · 🧩 '+g.bp.length+' '+_t('cat.bp'):''))).join('')+stCut(L.length,lim(200)); }
  const miss=(M.failed?[_t('cat.mis')+'/'+_t('cat.bp')]:[]).concat(!C.items.length?[_t('cat.item')+'/'+_t('cat.ware')]:[],!C.ships.length?[_t('cat.ship')]:[]);
  if(miss.length) h='<p class="st-warn">'+esc(_t('search.load_failed',{list:miss.join(', ')}))+'</p>'+h;
  // Sichtbar machen, wenn eine Liste gekuerzt wurde (nie still abschneiden)
  h=h.replace(/<!--CUT:(\d+)-->/g,(m,n)=>'<p class="sc-lmw-muted" style="padding:6px 10px;font-size:.78rem">'+esc(_t('search.more_specific',{n}))+'</p>');
  if(gen!==ST_SGEN) return;   // eine neuere Suche laeuft schon, dieses Ergebnis ist veraltet
  box.innerHTML=h||'<p class="sc-lmw-muted" style="padding:10px;font-size:.84rem">'+_t('search.nothing_found')+'</p>';
  const f1=box.querySelector('.st-r'); if(f1) f1.classList.add('sel');
  box.querySelectorAll('[data-more]').forEach(a=>a.onclick=(e)=>{ e.stopPropagation(); ST_CAT=a.getAttribute('data-more'); stCatsMark(); const b=$('stCats')&&$('stCats').querySelector('[data-cat="'+ST_CAT+'"]'); if(b) ST_ANCHOR=b; stSearch(); });
  placeUnder(box, popAnchor(), 440);
  box.querySelectorAll('[data-back]').forEach(a=>a.onclick=()=>{ ST_SEC=null; stSearch(); });
  box.querySelectorAll('.st-r').forEach(r=>r.onclick=()=>stPick(r.getAttribute('data-kind'),r.getAttribute('data-key'))); }
async function stPick(kind,key){ const ctl=window.__stCtl, C=await uexCatalog(), mob=rootW()<700;
  if(kind==='sec'){ ST_SEC=key; stSearch(); return; }
  if(kind==='pl'){ const p=(ST_PL||[]).find(x=>String(x.id)===key); if(!p) return; const po=stPlayerObj(p); if(po&&po.loc) ctl.flyTo(po.loc); if(mob) $('stRes').hidden=true; stOpenPlayer(p); return; }
  if(mob) $('stRes').hidden=true;
  if(kind==='loc'){ const o=ST_DATA.by[key]; ctl.highlight(null); ctl.flyTo(o); openStPanel(o); $('stRes').hidden=true; }
  else if(kind==='ore'){ const x=(await stOres()).find(o=>o.n===key); if(x) stOpenOre(x); }
  else if(kind==='item') stOpenBuy('item',C.items[+key]);
  else if(kind==='ship') stOpenBuy('ship',C.ships[+key]);
  else if(kind==='ware') stOpenBuy('ware',C.items[+key]);
  else if(kind==='bp') stOpenBp(key);
  else if(kind==='mis'){ const g=(await stMis()).d.groups[+key]; ctl.highlight(g.locs); stOpenMisGroup(g); } }
function stCard(dot,title,sub){ let p=$('stLoc'); if(p) p.remove();
  p=document.createElement('div'); p.id=ID('stLoc'); p.className='st-loc';
  p.innerHTML='<div class="st-loc-card"><div class="st-loc-h"><span class="st-dot" style="background:'+dot+'"></span><h3>'+esc(title)+'<small>'+esc(sub)+'</small></h3>'+'<button class="st-loc-x" id="'+ID('stLocX')+'">✕</button></div><div class="st-loc-body" id="'+ID('stCardBody')+'"><p class="sc-lmw-muted">'+_t('common.loading')+'</p></div></div>';
  ROOT.appendChild(p); $('stLocX').onclick=()=>{ p.remove(); window.__stCtl&&window.__stCtl.highlight(null); }; return $('stCardBody'); }
function stPriceRows(rows,field,label,asc){ const T=stTermIdx();
  const L=rows.filter(r=>r[field]>0).sort((a,b)=>asc?a[field]-b[field]:b[field]-a[field]);
  if(!L.length) return {html:'',ids:[]}; const ids=[];
  const html='<div class="st-slbl">'+label+' <span class="st-cnt">'+_t('count.terminals',{n:L.length})+'</span></div>'+L.map(r=>{ const o=T[r.id_terminal]; if(o) ids.push(o.id);
    const sys=r.star_system_name&&r.star_system_name!=='Stanton'?gnLine(r.star_system_name):''; const where=gnLine(o?stBodyOf(o).n:(r.planet_name||r.moon_name||''));
    const title=gnLine(o&&o.n?o.n:(r.terminal_name||'?')); const sub=gnLine(r.terminal_name||'');
    return '<div class="st-pr'+(o?'':' nomap')+'"'+(o?' data-oid="'+o.id+'"':'')+' title="'+esc(o?_t('tooltip.show_on_map'):_t('tooltip.not_on_map'))+'"><div><b>'+esc(title)+'</b><span>'+esc([sub,where,sys].filter((v,i,a)=>v&&a.indexOf(v)===i).join(' · '))+'</span></div><em>'+uexMoney(r[field])+'</em></div>'; }).join('');
  return {html,ids}; }
function stWirePrices(body){ body.querySelectorAll('[data-oid]').forEach(el=>el.onclick=()=>{ const o=ST_DATA.by[el.getAttribute('data-oid')]; window.__stCtl.flyTo(o); openStPanel(o); }); }
async function stOpenBuy(kind,rec){ if(!rec) return;
  const sub=kind==='ship'?[gn(rec.co),rec.crew?_t('label.crew',{n:rec.crew}):''].filter(Boolean).join(' · '):kind==='ware'?_t('cat.ware'):[gn(rec.s),gn(rec.co),rec.sz?_t('label.size_abbr',{sz:rec.sz}):''].filter(Boolean).join(' · ');
  const body=stCard(kind==='ship'?'#37e1ff':kind==='ware'?'#ffd76a':'#38d39f',gn(rec.n),sub,[kind,kind+':'+rec.i,rec.n]);
  let rows=[];
  if(kind==='ship'&&rec.i) rows=await stGet(UEX_BASE+'/vehicles_purchases_prices?id_vehicle='+rec.i);
  else if(kind==='item'&&rec.i) rows=await stGet(UEX_BASE+'/items_prices?id_item='+rec.i);
  else if(kind==='ware'&&rec.i) rows=await stGet(UEX_BASE+'/commodities_prices?id_commodity='+rec.i);
  if(!ROOT.contains(body)) return;
  const buy=stPriceRows(rows,'price_buy',kind==='ware'?_t('price.buy_wholesale_label'):_t('price.buy_label'),true), sell=kind==='ware'?stPriceRows(rows,'price_sell',_t('price.sell_label'),false):{html:'',ids:[]};
  let h=kind==='ship'&&stShipImg(rec)?'<img class="st-shipimg" src="'+esc(stShipImg(rec))+'" alt="" onerror="this.remove()">':'';
  if(kind==='ship') h+='<div class="st-chips">'+(rec.msrp?'<span>'+esc(_t('label.pledge',{n:rec.msrp}))+'</span>':'')+(rec.st?'<a href="'+esc(rec.st)+'" target="_blank" rel="noopener" class="st-lnk">RSI ↗</a>':'')+'</div>';
  h+=buy.html+sell.html;
  if(kind==='item') h+='<div id="'+ID('stLoot')+'"></div>';   // Beute-Fundorte / loot (js/guides.js, data/loot.json)
  if(kind==='item'&&rec.i) h+='<div id="'+ID('stAttr')+'"></div>';
  if(!buy.html&&!sell.html) h+='<p class="sc-lmw-muted" style="font-size:.84rem">'+(kind==='ship'?_t('notice.ship_not_buyable'):kind==='item'?_t('notice.item_not_buyable'):_t('notice.ware_no_price'))+'</p>';
  h+='<div class="st-coord">'+_t('price.coord_note')+'</div>';
  body.innerHTML=h; stWirePrices(body); if(kind==='item'&&SC.guides) SC.guides.loot($('stLoot'),rec.n);
  if(kind==='item'&&rec.i) stGet(UEX_BASE+'/items_attributes?id_item='+rec.i).then(A=>{ const bx=$('stAttr'); if(!bx) return; const L=A.filter(a=>a.attribute_name&&a.value!==''&&a.value!=null); if(L.length) bx.innerHTML='<div class="st-slbl">'+_t('label.stats')+'</div><table class="st-attr">'+L.map(a=>'<tr><td>'+esc(gn(a.attribute_name))+'</td><td>'+esc(a.value)+(a.unit?' '+esc(gn(a.unit)):'')+'</td></tr>').join('')+'</table>'; });
  const ids=[...new Set(buy.ids.concat(sell.ids))]; if(ids.length) window.__stCtl.highlight(ids); }
async function stOpenOre(x){ const I=stOreIndex();
  const body=stCard('#e0a458',gn(x.n),(x.code?x.code+' · ':'')+stOreWhere(x),['erz',x.n,x.n]);
  const rows=[]; x.mine.forEach(n=>(I.ores[n]||[]).forEach(r=>rows.push(Object.assign({ore:n},r)))); rows.sort((a,b)=>(b.q-a.q)||(b.ch-a.ch));
  const ids=new Set();
  let h=rows.length?'<div class="st-slbl">'+_t('label.mining')+' <span class="st-cnt">'+_t('hint.best_quality_first')+'</span></div>'+rows.map((r,i)=>{ const L=I.locs[r.k]||[]; L.forEach(o=>ids.add(o.id));
    const where=!L.length?stMineLabel(r.k)+_t('nofix.mineable_no_place'):r.k==='HPP_AaronHalo'?gn('Aaron Halo')+' ('+L.length+')':(/^HPP_(Stanton|Pyro)\d/.test(r.k)?L.map(o=>gn(o.n)).join(', '):stMineLabel(r.k)+' · '+L.slice(0,4).map(o=>gn(o.n)).join(', ')+(L.length>4?' …':''))+(L.length?' · '+stSysName(L[0]):'');
    return '<div class="st-orow'+(L.length?'':' st-nofix')+'" data-ri="'+i+'"><b>'+esc(where)+'</b><div class="om"><span>'+esc(mineGroupLabel(r.g))+'</span><span title="'+esc(_t('tooltip.ore_chance'))+'">'+esc(_t('ore.percent_chance',{n:(r.ch>=1?Math.round(r.ch):r.ch.toFixed(1))}))+'</span><span title="'+esc(_t('tooltip.ore_max_share'))+'">'+esc(_t('ore.up_to_percent',{n:Math.round(r.max)}))+'</span><span title="'+esc(_t('tooltip.best_quality'))+'">'+esc(_t('ore.quality',{n:r.q}))+'</span></div></div>'; }).join(''):'';
  body.innerHTML=h+'<div id="'+ID('stOreSell')+'"><p class="sc-lmw-muted" style="font-size:.82rem">'+_t('status.loading_sell_prices')+'</p></div>';
  body.querySelectorAll('[data-ri]').forEach(el=>el.onclick=()=>{ const r=rows[+el.getAttribute('data-ri')]; const o=(I.locs[r.k]||[])[0]; if(!o){ stOpenNofix(r.k); return; } window.__stCtl.flyTo(o); openStPanel(o); });
  if(ids.size) window.__stCtl.highlight([...ids]);
  const [raw,ref]=await Promise.all([x.ido?stGet(UEX_BASE+'/commodities_prices?id_commodity='+x.ido):[],x.idr?stGet(UEX_BASE+'/commodities_prices?id_commodity='+x.idr):[]]);
  if(!ROOT.contains(body)) return; const box=body.querySelector('#stOreSell'); if(!box) return;
  const a=stPriceRows(raw,'price_sell',_t('label.sell_raw'),false), b=stPriceRows(ref,'price_sell',_t('label.sell_refined'),false);
  box.innerHTML=(a.html+b.html)||'<p class="sc-lmw-muted" style="font-size:.82rem">'+_t('price.none_sell_uex')+'</p>'; stWirePrices(box); }
// Rezept: was man zum Craften braucht (Baugruppen, Ressourcen in SCU, Items mit Stueckzahl, Mindestqualitaet)
function stBpRecipe(R){ if(!R||!R.req||!R.req.length) return '';
  const tm=R.tm?(R.tm>=3600?_t('time.hours_short',{n:Math.round(R.tm/360)/10}):R.tm>=60?_t('time.min_short',{n:Math.round(R.tm/60)}):_t('time.sec_short',{n:R.tm})):'';
  return '<div class="st-slbl">'+_t('label.crafting')+(tm?' <span class="st-cnt">'+tm+'</span>':'')+'</div>'+R.req.map(g=>'<div class="st-orow st-bpg"><b>'+esc(g.n?gn(g.n):_t('common.material'))+(g.c>1?' ×'+g.c:'')+'</b>'+
    g.it.map(i=>'<div class="om"><span>'+esc(gn(i.n))+'</span><span>'+(i.scu!=null?String(i.scu).replace('.',',')+' SCU':'×'+(i.q||1))+(i.mq>1?' · '+esc(_t('label.min_quality',{n:i.mq})):'')+'</span></div>').join('')+
    (g.mod&&g.mod.length?'<div class="om"><span class="sc-lmw-muted">'+esc(_t('label.quality_affects',{list:g.mod.join(', ')}))+'</span></div>':'')+'</div>').join(''); }
// ORTS-WISSEN der Community: Temperatur/Strahlung von-bis, Schwerkraft, Wetter, Geschichte; jeder ergaenzt, alle Namen unten.
async function stOpenBp(name){ const M=await stMis(), BP=await stBps(), B=(M.d.bps||{})[name], R=(BP.bps||{})[name]; if(!B&&!R) return; const LS=M.d.lsets||[];
  const body=stCard('#37e1ff',gn(name),[R?gn(R.t)+(R.g?' · '+_t('label.grade',{n:R.g}):''):(B&&gn(B.cat)),'Blueprint'].filter(Boolean).join(' · '),['blueprint',name,name]);
  const ids=new Set();
  if(!B){ // nicht in unseren Missionsdaten: Quelle aus den Spieldaten + Rezept
    body.innerHTML=(R.src==='default'?'<div class="st-slbl">'+_t('bp.unlocked_from_start')+'</div>':
      R.src==='reward'?'<div class="st-slbl">'+_t('bp.comes_as_reward')+'</div><div class="st-orow"><div class="om"><span>'+R.pools.map(k=>esc(k.replace(/^BP_(MISSIONREWARD|REWARDS)_/,'').replace(/_/g,' '))).join(', ')+'</span></div><div class="om"><span class="sc-lmw-muted">'+_t('bp.reward_no_mission')+'</span></div></div>':
      '<div class="st-slbl">'+_t('bp.no_known_source')+'</div><div class="st-orow"><div class="om"><span class="sc-lmw-muted">'+_t('bp.no_source_note')+'</span></div></div>')+
      stBpRecipe(R)+'<div class="st-coord">'+esc(_t('data.version_prefix',{version:(BP.version||'').replace(/-LIVE.*/,'')}))+'</div>'; return; }
  const bpCount='<span class="st-cnt">'+(B.m.length===1?_t('count.mission_one'):_t('count.mission_many',{n:B.m.length}))+'</span>';
  body.innerHTML='<div class="st-slbl">'+_t('bp.found_in',{count:bpCount})+'</div>'+B.m.map((m,i)=>{ (LS[m.l]||[]).forEach(id=>ids.add(id));
    const areas=(LS[m.l]||[]).map(id=>ST_DATA.by[id]).filter(Boolean); const planets=[...new Set(areas.map(o=>stBodyOf(o)).map(b=>{ let x=b; while(x&&x.k==='moon') x=ST_DATA.by[x.p]; return x&&x.k!=='star'?gn(x.n)+' ('+stSysName(x)+')':stSysName(b); }))];
    const one=m.ps>1?Math.round(m.ch/m.ps*10)/10:m.ch;
    return '<div class="st-orow" data-bi="'+i+'"><b>'+esc(gn(m.t)||stTy(m.ty))+'</b>'+(m.il?' <em class="t-ill">'+esc(_t('tag.illegal'))+'</em>':'')+'<div class="om"><span>'+esc(stTy(m.ty))+'</span><span>'+esc(gn(m.g))+'</span></div>'+
      '<div class="om"><span title="'+esc(_t('tooltip.bp_chance'))+'">🎲 '+m.ch+' %'+(m.ps>1?esc(_t('bp.pool_odds',{ps:m.ps,one})):'')+'</span></div>'+
      '<div class="om"><span>📍 '+esc(planets.join(', '))+'</span></div></div>'; }).join('')+
    stBpRecipe(R)+'<div class="st-coord">'+esc(_t('data.version_prefix',{version:(M.d.version||'').replace(/-LIVE.*/,'')}))+' · '+esc(_t('bp.approx_note'))+'</div>';
  body.querySelectorAll('[data-bi]').forEach(el=>el.onclick=()=>{ const m=B.m[+el.getAttribute('data-bi')]; window.__stCtl.highlight(LS[m.l]||[]); });
  if(ids.size) window.__stCtl.highlight([...ids]); }
function stPlList(){ const box=$('stPlList'), cnt=$('stPlCnt'); const P=ST_PL||[]; if(cnt){ const on=P.filter(p=>p.online).length; cnt.innerHTML=P.length?(on?' <b class="st-plon">'+on+' '+esc(_t('status.online'))+'</b>':' (0/'+P.length+')'):''; } if(!box) return;
  const q=(($('stPlQ')||{}).value||'').trim().toLowerCase(); const L=P.filter(p=>!q||[p.name,p.player,p.location,gn(p.location),p.ship,gn(p.ship),p.server].some(v=>String(v||'').toLowerCase().indexOf(q)>=0));
  box.innerHTML=(ST_PL_ERR?'<p class="st-warn">'+esc(ST_PL_ERR)+'</p>':'')+(L.map(p=>{ const o=stPlayerLoc(p);
    const place=playerPlaceName(p)||(o&&translated(o.n))||'';
    const age=stAgo(p.last_seen||p.when);
    const where=p.online?(travelBlurb(p)||place||_t('location.unknown'))+(p.when&&!stLocFresh(p)?' ('+age+')':''):(place||_t('location.unknown'))+' · '+_t('status.offline_last',{time:age});
    return '<div class="st-orow st-plrow'+(p.online?'':' is-off')+'" data-pid="'+esc(p.id)+'"><b><i class="st-pl-dot'+(p.online?' on':'')+'"></i>'+esc(p.name||p.player||_t('entity.player'))+'</b><div class="om"><span>'+esc(where)+'</span>'+(o?'<span>'+esc(stSysName(o))+'</span>':'')+(p.server?'<span>'+esc(_t('pilot.server'))+' '+esc(String(p.server))+'</span>':'')+(p.ship&&p.ship!=='—'?'<span>🚀 '+esc(gn(p.ship))+'</span>':'')+'</div></div>'; }).join('')||'<p class="sc-lmw-muted" style="font-size:.8rem">'+(ST_PL?_t('search.none_players'):_t('common.loading'))+'</p>');
  box.querySelectorAll('[data-pid]').forEach(el=>el.onclick=()=>{ const p=P.find(x=>String(x.id)===el.getAttribute('data-pid')); if(!p) return; const o=stPlayerLoc(p); if(o) window.__stCtl.flyTo(o); stOpenPlayer(p); }); }
function stLegend(){ const box=$('stLegend'); if(!box||!ST_DATA) return; const cnt={}, hid={};
  ST_DATA.d.objects.forEach(o=>{ if(o.h) hid[o.k]=(hid[o.k]||0)+1; else cnt[o.k]=(cnt[o.k]||0)+1; });
  cnt.halo=ST_DATA.d.objects.filter(o=>o.ring).length;
  const rows=Object.keys(ST_KIND).filter(k=>k!=='star'&&(cnt[k]||hid[k])).map(k=>'<label class="st-lg"><input type="checkbox" data-k="'+k+'"'+(ST_VIS[k]?' checked':'')+'>'+kindMark(k)+esc(kindLabel(k))+'<span>'+(cnt[k]||0)+(hid[k]?' +'+hid[k]:'')+'</span></label>').join('');
  const pOn=(ST_PL||[]).filter(p=>p.online).length, pOff=(ST_PL||[]).length-pOn;
  box.innerHTML='<div class="st-slbl">'+_t('legend.players_heading')+'</div>'+'<label class="st-lg"><input type="checkbox" id="'+ID('stPlOn')+'"'+(ST_PL_ON?' checked':'')+'>'+sigil('mklive','#4dff9a','mk-live')+esc(_t('status.online'))+'<span>'+pOn+'</span></label><label class="st-lg"><input type="checkbox" id="'+ID('stPlOff')+'"'+(ST_PL_OFF?' checked':'')+'>'+sigil('mkoff','#8a93a6')+esc(_t('status.offline_last_location'))+'<span>'+pOff+'</span></label>'+'<p class="st-lg-note">'+esc(_t('legend.other_note'))+'</p>'+'<label class="st-lg"><input type="checkbox" id="'+ID('stPlOtherOn')+'"'+(ST_PL_OTHER.on?' checked':'')+'>'+esc(_t('legend.other_on'))+'</label><label class="st-lg"><input type="checkbox" id="'+ID('stPlOtherOff')+'"'+(ST_PL_OTHER.off?' checked':'')+'>'+esc(_t('legend.other_off'))+'</label>'+(ST_PL_ERR?'<p class="st-warn">'+esc(ST_PL_ERR)+'</p>':'')+'<div class="st-slbl">'+_t('legend.show_heading')+'</div>'+rows+
    '<label class="st-lg st-lg-h"><input type="checkbox" id="'+ID('stHid')+'"'+(ST_HID?' checked':'')+'>'+sigil('mkhid','#9aa6c0')+esc(_t('legend.hidden_places'))+'<span>'+Object.values(hid).reduce((a,b)=>a+b,0)+'</span></label>'+
    '<p class="st-mnote">'+esc(_t('legend.note',{version:(ST_DATA.d.version||'').replace(/-LIVE.*/,'')}))+'</p>';
  box.querySelectorAll('[data-k]').forEach(c=>c.onchange=()=>{ ST_VIS[c.getAttribute('data-k')]=c.checked; window.__stCtl&&window.__stCtl.rebuild(); });
  const h=$('stHid'); if(h) h.onchange=()=>{ ST_HID=h.checked; window.__stCtl&&window.__stCtl.rebuild(); };
  const a1=$('stPlOn'), a2=$('stPlOff'); if(a1) a1.onchange=()=>{ ST_PL_ON=a1.checked; window.__stCtl&&window.__stCtl.rebuild(); }; if(a2) a2.onchange=()=>{ ST_PL_OFF=a2.checked; window.__stCtl&&window.__stCtl.rebuild(); };
  const o1=$('stPlOtherOn'), o2=$('stPlOtherOff'); if(o1) o1.onchange=()=>{ ST_PL_OTHER.on=o1.checked; savePlOther(); }; if(o2) o2.onchange=()=>{ ST_PL_OTHER.off=o2.checked; savePlOther(); };
}
function stOreMerge(parts){ const m={}; (parts||[]).forEach(pt=>{ const x=m[pt.ore]||(m[pt.ore]={ore:pt.ore,p:0,b:[]}); x.p=Math.max(x.p,pt.p||0); x.b.push(pt); }); return Object.values(m); }
function stOreIndex(){ const D=ST_DATA; if(D.oreIdx) return D.oreIdx; const ores={}, locs={};
  Object.entries(D.d.mining).forEach(([k,gs])=>gs.forEach(g=>{ const acc={};
    g.deps.forEach(d=>stOreMerge(d.parts).forEach(x=>{ const a=acc[x.ore]||(acc[x.ore]={ch:0,max:0,q:0}); a.ch+=d.rel*x.p; x.b.forEach(b=>{ a.max=Math.max(a.max,b.max||0); a.q=Math.max(a.q,(b.q&&b.q[1])||0); }); }));
    Object.entries(acc).forEach(([ore,a])=>(ores[ore]=ores[ore]||[]).push({k,g:g.g,ch:a.ch,max:a.max,q:a.q})); }));
  D.d.objects.forEach(o=>(o.mine||[]).forEach(k=>(locs[k]=locs[k]||[]).push(o)));
  D.oreIdx={ores,locs}; return D.oreIdx; }
function stOpenMisGroup(g){ let p=$('stLoc'); if(p) p.remove(); p=document.createElement('div'); p.id=ID('stLoc'); p.className='st-loc'; p.__re=()=>stOpenMisGroup(g);
  const locs=g.locs.map(id=>ST_DATA.by[id]).filter(Boolean);
  p.innerHTML='<div class="st-loc-card"><div class="st-loc-h"><span class="st-dot" style="background:#ffd76a"></span><h3>'+esc(stTy(g.ty))+'<small>'+esc(gn(g.g))+(g.il?' · '+esc(_t('tag.illegal')):'')+' · '+esc(_t('count.orders',{n:g.n}))+'</small></h3>'+'<button class="st-loc-x" id="'+ID('stLocX')+'">✕</button></div><div class="st-loc-body">'+
    (g.t.length?'<div class="st-slbl">'+_t('label.examples')+'</div>'+g.t.map(t=>'<div class="st-mis-t">'+esc(gn(t))+'</div>').join(''):'')+
    (g.bp?'<div class="st-slbl">🧩 '+esc(_t('cat.bp'))+' <span class="st-cnt">'+esc(_t('bp.in_x_of_y_orders',{nbp:g.nbp,n:g.n}))+'</span></div>'+(g.tb?'<div class="st-mis-sub">'+g.tb.map(function(t){ return esc(gn(t)); }).join(' · ')+'</div>':'')+
      '<div class="st-bp">'+g.bp.map(b=>'<span'+(b[2]?' title="'+esc(gn(b[2]))+'"':'')+'>'+esc(gn(b[0]))+(b[1]<100?' <em>'+b[1]+' %</em>':'')+'</span>').join('')+'</div>':'')+
    (g.rw?'<div class="st-slbl">'+_t('label.reward')+'</div><div class="st-bp">'+g.rw.map(r=>'<span>'+esc(gn(r[0]))+' ×'+r[1]+'</span>').join('')+'</div>':'')+
    '<div class="st-slbl">'+_t('label.offered_in')+'</div>'+locs.map(o=>'<div class="st-orow" data-gid="'+o.id+'"><b>'+esc(gn(o.n))+'</b><div class="om"><span>'+esc(kindLabel(o.k))+'</span></div></div>').join('')+'</div></div>';
  ROOT.appendChild(p); $('stLocX').onclick=()=>p.remove();
  p.querySelectorAll('[data-gid]').forEach(el=>el.onclick=()=>{ const o=ST_DATA.by[el.getAttribute('data-gid')]; window.__stCtl.flyTo(o); openStPanel(o); }); }
// (stOpenMap(), das frueher aus einem Dashboard heraus in einen separaten Taktik-Tisch-Canvas
// wechselte, ist in diesem eigenstaendigen Projekt tot: initLiveMap()/SCLMW.mount() rufen
// enterStExplore() direkt auf. Entfernt, statt als nie erreichbarer Code stehen zu bleiben.)
function showMapBack(){
  if(!ROOT||$('stBack')) return;
  const b=document.createElement('button'); b.type='button'; b.className='stx st-back'; b.id=ID('stBack'); b.title=_t('ui.show_map'); b.innerHTML=SC.ico?SC.ico('menu'):'';
  b.onclick=function(){ b.remove(); enterStExplore(); };
  ROOT.appendChild(b);
}
function exitStExplore(){
  clearInterval(window.__stPlT);
  if(ROOT) ROOT.classList.remove('st-explore');
  if(window.__stExStop){ try{ window.__stExStop(); }catch(e){} window.__stExStop=null; }
  if(window.__stCtl){ window.__stCtl.onLevel=null; window.__stCtl.reset(); }
  const ui=$('stExUI'); if(ui) ui.remove();
  const lp=$('stLoc'); if(lp) lp.remove();
  showMapBack();
}
// g.g kommt bereits deutsch aus den gebauten Spieldaten (siehe GROUPS in scripts/*-build.py,
// nur 4 feste Werte) -- hier ueber die neuen mine.group.*-Schluessel durchgereicht/uebersetzt.
// g.g already arrives in German from the built game data (see GROUPS in scripts/*-build.py,
// only 4 fixed values) -- passed through/translated here via the new mine.group.* keys.
function mineGroupLabel(g){ const k='mine.group.'+g; return SC.i18n&&SC.i18n.dict.en[k]?_t(k):g; }
function stMiningHTML(keys){ const D=ST_DATA; let h='<div class="st-slbl">'+_t('label.mining_resources')+'</div>';
  keys.forEach(k=>{ const gs=D.d.mining[k]; if(!gs) return; h+='<div class="st-mprov">'+esc(stMineLabel(k))+'</div>';
    gs.forEach(g=>{ h+='<div class="st-mgrp">'+esc(mineGroupLabel(g.g))+'</div>';
      g.deps.forEach(d=>{ const ores=stOreMerge(d.parts).filter(x=>!/^Inert/i.test(x.ore));
        h+='<details class="st-dep"><summary><b>'+esc(gn(d.rock))+'</b>'+(d.tier?'<em class="t-'+esc(d.tier)+'">'+esc(d.tier)+'</em>':'')+'<span title="'+esc(_t('tooltip.rock_frequency'))+'">'+d.rel+' %</span></summary>'+
          (ores.length?'<table><tr><th>'+esc(_t('table.ore'))+'</th><th title="'+esc(_t('tooltip.ore_in_rock'))+'">'+esc(_t('table.chance'))+'</th><th title="'+esc(_t('tooltip.ore_share_quality'))+'">'+esc(_t('table.share_quality'))+'</th></tr>'+ores.map(x=>'<tr><td>'+esc(gn(x.ore))+'</td><td>'+Math.round(x.p*100)+' %</td><td>'+x.b.map(b=>b.min+'–'+b.max+' %<small>Q '+b.q[0]+'–'+b.q[1]+'</small>').join('<br>')+'</td></tr>').join('')+'</table>':'<p class="sc-lmw-muted" style="font-size:.78rem;margin:0 10px 8px">'+_t('common.no_ore_data')+'</p>')+'</details>'; }); }); });
  return h; }
function stNofixNote(k){ return /^AsteroidCluster_/.test(k)?_t('nofix.note_random'):_t('nofix.note_no_coords'); }
function stOpenNofix(k){ const D=ST_DATA; let p=$('stLoc'); if(p) p.remove();
  p=document.createElement('div'); p.id=ID('stLoc'); p.className='st-loc';
  p.innerHTML='<div class="st-loc-card"><div class="st-loc-h"><span class="st-dot" style="background:#9c8b76"></span><h3>'+esc(stMineLabel(k))+'<small>'+esc(_t('nofix.title'))+'</small></h3>'+'<button class="st-loc-x" id="'+ID('stLocX')+'">✕</button></div><div class="st-loc-body"><div class="st-nofix-note">'+stNofixNote(k)+'</div>'+stMiningHTML([k])+'</div></div>';
  p.__re=()=>stOpenNofix(k); ROOT.appendChild(p); $('stLocX').onclick=()=>p.remove(); }
function stDist(km){ return km>=1e6?_t('unit.mio_km',{n:tn(km/1e6,{maximumFractionDigits:2})}):_t('unit.km',{n:tn(Math.round(km))}); }
async function openStPanel(o){
  const D=ST_DATA; if(!D||!o) return;
  if(o.grp){ if(window.__stPinPlayer) window.__stPinPlayer(null); stOpenGroup(o); return; }
  if(o.k==='player'){ stOpenPlayer(o.pl); return; }
  if(window.__stPinPlayer) window.__stPinPlayer(null);
  window.__stPlace=o;
  let p=$('stLoc'); if(p) p.remove();
  p=document.createElement('div'); p.id=ID('stLoc'); p.className='st-loc';
  const K=ST_KIND[o.k]||{c:'#ccc'}, kl=kindLabel(o.k), par=o.p&&D.by[o.p], b=stBodyOf(o);
  const sub=[kl, b&&b!==o&&b.k!=='star'?gn(b.n):(par&&par!==o&&par.k!=='star'?gn(par.n):null), stSysName(o), gn(o.ju)].filter(Boolean).join(' · ');
  p.innerHTML='<div class="st-loc-card"><div class="st-loc-h">'+kindMark(o.k)+'<h3>'+esc(gn(o.n))+'<small>'+esc(sub)+'</small></h3>'+'<button class="st-loc-x" id="'+ID('stLocX')+'">✕</button></div><div class="st-loc-body" id="'+ID('stLocBody')+'"></div></div>';
  ROOT.appendChild(p); $('stLocX').onclick=()=>p.remove();
  const body=$('stLocBody'); let h='';
  p.__re=()=>openStPanel(o); const isDe=ST_LANG==='de', SY=D.sys[o.sy]||{};
  let desc=isDe&&o.dde?o.dde:o.d;
  if(o.k==='star'){ if(SY.img) h+='<img class="st-shipimg" src="'+esc(SY.img)+'" alt="" onerror="this.remove()">'; desc=isDe?(o.dde||SY.dde||SY.d||o.d):(SY.d||o.d); }
  { const zd=gn(o.k==='star'?(SY.d||o.d):o.d); if(zd&&zd!==(o.k==='star'?(SY.d||o.d):o.d)) desc=zd; }
  if(o.k==='gateway'){ const L=(D.gal.links||[]).find(l=>l.a===o.id||l.b===o.id);
    if(L){ const other=D.by[L.a===o.id?L.b:L.a]; if(other) h+='<div class="st-jump">'+_t('jump.gateway_to',{sys:'<b>'+esc(stSysName(other))+'</b>'})+(L.live?'':' <em>'+esc(_t('jump.rsi_only_note'))+'</em>')+'<button class="sc-lmw-btn sm primary" id="'+ID('stJumpGo')+'" data-to="'+other.id+'">'+_t('action.fly_through')+'</button></div>'; } }
  if(desc) h+='<div class="st-desc" id="'+ID('stDesc')+'" title="'+esc(_t('hint.tap_to_expand'))+'">'+esc(desc)+'</div>';
  if(o.am&&o.am.length) h+='<div class="st-slbl">'+_t('label.amenities')+'</div><div class="st-chips">'+o.am.map(a=>{ const z=gnLine(a); return '<span>'+esc(z!==a?z:(isDe?(ST_AM_DE[a]||a):a))+'</span>'; }).join('')+'</div>';
  if(SC.guides) h+=SC.guides.html(o);   // Ablauf, Timer, Karten der grossen Loops / guides for the big loops (js/guides.js)
  if(o.mine&&o.mine.length) h+=stMiningHTML(o.mine);
  if(o.k==='wikelo') h+='<div id="'+ID('stWkBox')+'"></div>';
  if((o.terms||[]).some(t=>!/^(commodity|refinery|fuel)/.test(t.t||''))) h+='<div class="st-slbl">'+_t('label.available_here')+'</div><div id="'+ID('stShopBox')+'"><button class="sc-lmw-btn sm" id="'+ID('stShopGo')+'">'+_t('action.load_items_ships')+'</button></div>';
  h+='<div id="'+ID('stMisBox')+'"></div>';
  const comm=(o.terms||[]).filter(t=>t.t==='commodity').slice(0,6);
  if(comm.length) h+='<div class="st-slbl">'+_t('label.commodity_market')+'</div><div id="'+ID('stGoodsBox')+'"><p class="sc-lmw-muted" style="font-size:.85rem">'+_t('status.loading_prices')+'</p></div>';
  if(o.terms&&o.terms.length) h+='<div class="st-slbl">'+esc(_t('label.terminals',{n:o.terms.length}))+'</div><div class="st-chips">'+o.terms.map(t=>'<span>'+esc(gnLine(t.n))+'</span>').join('')+'</div>';
  h+='<div class="st-slbl">'+_t('label.search_items_ships')+'</div><input id="'+ID('stCat')+'" placeholder="'+esc(_t('search.item_ship_placeholder'))+'"><div id="'+ID('stCatRes')+'"><p class="sc-lmw-muted" style="font-size:.82rem"></p></div>';
  h+='<div class="st-coord">'+esc(_t('coord.from_star',{dist:stDist(Math.hypot(o.x,o.y,o.z)),x:tn(Math.round(o.x)),y:tn(Math.round(o.y)),z:tn(Math.round(o.z))}))+'<br>'+esc(_t('data.version_prefix',{version:(D.d.version||'').replace(/-LIVE.*/,'')}))+(o.h?esc(_t('note.not_on_starmap')):'')+(o.approx?esc(_t('note.approx_position')):'')+(isDe&&o.dde?esc(_t('note.de_ini_source')):'')+'</div>';
  body.innerHTML=h; if(SC.guides) SC.guides.wire(body,o);
  const de=$('stDesc'); if(de) de.onclick=()=>de.classList.toggle('open');
  const wk=$('stWkBox'); if(wk) stWikeloHTML(wk);
  const sg=$('stShopGo'); if(sg) sg.onclick=()=>{ const bx=$('stShopBox'); bx.innerHTML='<p class="sc-lmw-muted" style="font-size:.82rem">'+_t('status.loading_uex')+'</p>'; stShopHTML(o,bx); };
  const jg=$('stJumpGo'); if(jg) jg.onclick=()=>{ const t=D.by[jg.getAttribute('data-to')]; if(!t) return; window.__stCtl.flyTo(t); openStPanel(t); };
  const misBox=$('stMisBox'), goodsBox=$('stGoodsBox');
  stMis().then(M=>{ const box=misBox; if(!box||!ROOT.contains(box)) return; const ids=[]; let x=o; while(x){ ids.push(x.id); if(x.k==='planet'||(D.by[x.p]||{}).k==='star') break; x=D.by[x.p]; }
    const seen=new Set(), rows=[]; ids.forEach(id=>(M.byLoc[id]||[]).forEach(i=>{ if(!seen.has(i)){ seen.add(i); rows.push(i); } }));
    if(!rows.length) return; rows.sort((a,b)=>M.d.groups[b].n-M.d.groups[a].n);
    const area=gn(ids.length>1?D.by[ids[ids.length-1]].n:o.n);
    box.innerHTML='<div class="st-slbl">'+esc(_t('mission.area_heading',{area}))+'</div>'+rows.slice(0,12).map(i=>stMisRow(M.d.groups[i],i)).join('')+(rows.length>12?'<p class="sc-lmw-muted" style="font-size:.76rem">'+esc(_t('mission.more_groups',{n:rows.length-12}))+'</p>':''); });
  const cf=$('stCat'), cr=$('stCatRes');
  if(cf) cf.oninput=async()=>{ const cat=await uexCatalog(); const q=cf.value.toLowerCase().trim(); if(q.length<2){ cr.innerHTML='<p class="sc-lmw-muted" style="font-size:.82rem">'+_t('search.min_2_chars')+'</p>'; return; }
    const hitn=x=>x.n.toLowerCase().indexOf(q)>=0||String(gn(x.n)).toLowerCase().indexOf(q)>=0;
    const its=cat.items.filter(hitn).slice(0,8).map(x=>({t:'item',o:x}));
    const shs=cat.ships.filter(hitn).slice(0,8).map(x=>({t:'ship',o:x}));
    const all=shs.concat(its);
    cr.innerHTML=all.length?all.map((r,i)=>'<div class="st-res" data-ci="'+i+'"><b>'+(r.t==='ship'?'🚀 ':'📦 ')+esc(gn(r.o.n))+'</b><div class="rp" id="'+ID('stRp'+i)+'">'+(r.t==='ship'?_t('label.ship'):esc(gn(r.o.s)||_t('label.item')))+esc(_t('hint.tap_for_price'))+'</div></div>').join(''):'<p class="sc-lmw-muted" style="font-size:.82rem">'+_t('common.nothing_in_catalog')+'</p>';
    cr.querySelectorAll('.st-res').forEach(el=>el.onclick=()=>uexPriceInto(all[+el.getAttribute('data-ci')],$('stRp'+el.getAttribute('data-ci')),o.n)); };
  if(comm.length){ let goods=[];
    try{ const lists=await Promise.all(comm.map(t=>fetch(UEX_BASE+'/commodities_prices?id_terminal='+t.id).then(r=>r.json()).then(d=>(d&&d.data)||[]).catch(()=>[])));
      const merged={}; lists.forEach(list=>list.forEach(r=>{ const nm=r.commodity_name; if(!nm) return; const g=merged[nm]||(merged[nm]={n:nm,buy:0,sell:0}); if(r.price_buy>g.buy) g.buy=r.price_buy; if(r.price_sell>g.sell) g.sell=r.price_sell; }));
      goods=Object.values(merged).sort((a,b)=>a.n.localeCompare(b.n)); }catch(e){}
    const box=goodsBox; if(!box||!ROOT.contains(box)) return;
    const grow=g=>'<div class="st-grow"><span>'+esc(gn(g.n))+'</span><span class="gp">'+'<b class="st-buy" title="'+esc(_t('label.buy_here'))+'">'+(g.buy?uexMoney(g.buy):'–')+'</b><b class="st-sell" title="'+esc(_t('label.sell_here'))+'">'+(g.sell?uexMoney(g.sell):'–')+'</b>'+'</span></div>';
    box.innerHTML=goods.length?'<input id="'+ID('stGoodF')+'" placeholder="'+esc(_t('ware.filter_placeholder'))+'"><div class="st-grow st-gh"><span>'+esc(_t('table.commodity'))+'</span><span class="gp"><span>'+esc(_t('table.buy'))+'</span><span>'+esc(_t('table.sell'))+'</span></span></div><div id="'+ID('stGoods')+'">'+goods.map(grow).join('')+'</div>':'<p class="sc-lmw-muted" style="font-size:.85rem">'+_t('price.none_uex')+'</p>';
    const gf=$('stGoodF'); if(gf) gf.oninput=()=>{ const q=gf.value.toLowerCase().trim(); $('stGoods').innerHTML=goods.filter(g=>!q||g.n.toLowerCase().indexOf(q)>=0||String(gn(g.n)).toLowerCase().indexOf(q)>=0).map(grow).join('')||'<p class="sc-lmw-muted" style="font-size:.82rem">'+_t('ware.none_found')+'</p>'; }; }
}
window.openStPanel=openStPanel;
// ---- UEX-Marktdaten fuer Orte im Erkunden-Modus ----
const UEX_BASE='https://api.uexcorp.space/2.0';
const uexMoney=n=>(n&&n>0)?tn(Math.round(n))+' aUEC':'—';
async function uexTerminals(){ if(window.__uexTerm) return window.__uexTerm; try{ const r=await fetch(UEX_BASE+'/terminals?id_star_system=68'); const d=await r.json(); window.__uexTerm=(d&&d.data)||[]; }catch(e){ window.__uexTerm=[]; } return window.__uexTerm; }
async function uexCatalog(){ if(window.__uexCat) return window.__uexCat; const cat={items:[],ships:[]};
  try{ const r=await fetch(pathOf('data/items.json'),{cache:'no-store'}); const d=await r.json(); cat.items=(d.items||[]).filter(x=>x&&x.n); }catch(e){}
  try{ const r=await fetch(pathOf('data/vehicles.json'),{cache:'no-store'}); const d=await r.json(); cat.ships=(d.ships||[]).filter(x=>x&&x.n); }catch(e){}
  if(cat.items.length&&cat.ships.length) window.__uexCat=cat; return cat; }
async function uexPriceInto(rec,el,loc){
  if(!el||el.getAttribute('data-done')) return; el.setAttribute('data-done','1'); el.textContent=_t('status.loading_price');
  try{
    if(rec.t==='ship'){ if(!rec.o.i){ el.textContent=_t('notice.pledge_only'); return; }
      const d=await fetch(UEX_BASE+'/vehicles_purchases_prices?id_vehicle='+rec.o.i).then(r=>r.json()); const rows=((d&&d.data)||[]).filter(x=>x.price_buy>0);
      if(!rows.length){ el.textContent=_t('notice.not_buyable_ingame',{pledge:rec.o.msrp?_t('label.also_pledge',{n:rec.o.msrp}):''}); return; }
      const avg=Math.round(rows.reduce((a,b)=>a+b.price_buy,0)/rows.length); const where=rows.map(x=>x.terminal_name).filter(Boolean);
      el.innerHTML='Ø '+uexMoney(avg)+' '+esc(_t('label.buyable_at',{where:where.slice(0,3).map(gnLine).join(', ')||'—'}))+(hereMark(where,loc));
    } else { if(!rec.o.i){ el.textContent=_t('notice.no_uex_data'); return; }
      const d=await fetch(UEX_BASE+'/items_prices?id_item='+rec.o.i).then(r=>r.json()); const rows=((d&&d.data)||[]).filter(x=>x.price_buy>0).sort((a,b)=>a.price_buy-b.price_buy);
      if(!rows.length){ el.textContent=_t('notice.not_buyable_anywhere'); return; }
      const where=rows.map(x=>x.terminal_name).filter(Boolean);
      el.innerHTML=esc(_t('label.from_price',{price:uexMoney(rows[0].price_buy)}))+' · '+esc(where.slice(0,3).map(gnLine).join(', '))+(hereMark(where,loc));
    }
  }catch(e){ el.textContent=_t('error.price_load_failed'); }
}
function hereMark(where,loc){ return where.some(w=>w&&loc&&(w.indexOf(loc)>=0||loc.indexOf(w)>=0))?' <span style="color:#37e1ff">'+esc(_t('label.also_here'))+'</span>':''; }

// ---- SCLMW.mount(el, opts): der EINE Einstiegspunkt fuer jede Einbettung (eigene Seite, iframe,
//      <div id="sc-lmw"> in einer fremden Seite). Haengt Canvas + UI in el ein, laedt three.js
//      ueber holo.js nach und startet die Karte direkt im "Erkunden"-Modus. Nur EINE Karte
//      gleichzeitig (siehe stantonScene(): eine neue mount() raeumt die alte selbst auf). ----
var FIT_SEL='.st-loc-h h3,.st-loc-h small,.st-grow>span:first-child,.st-dep summary>b,.st-chips>span,.st-r b,.st-pr b,.st-call-name,.st-call-status,.st-call-ship,.st-call-rows b,.st-call-when b,.st-call-gear b,.st-crumb,.st-room-h>b,.st-mate>b,.st-mate>span:not(.st-mate-host),.st-orow>b,.st-room-route b';
var fitObs=null, fitRo=null, fitQueue=[], fitWait=false;
function tuneFit(el){
  var run=el.querySelector(':scope>.st-run');
  if(!run) return;
  if(el.clientWidth<8){ run.classList.remove('on'); return; }
  var extra=run.scrollWidth-el.clientWidth;
  if(extra>4){
    el.style.setProperty('--st-shift', extra+'px');
    el.style.setProperty('--st-dur', Math.max(4, Math.min(14, extra/22))+'s');
    run.classList.add('on');
  }else{
    run.classList.remove('on');
    el.style.removeProperty('--st-shift');
  }
}
function watchFit(el){ if(fitRo){ try{ fitRo.observe(el); }catch(e){} } }
function armFitOne(el){
  if(!el||el.querySelector(':scope>.st-run,:scope>.st-fit')) return;
  var run=document.createElement('span');
  run.className='st-run';
  if(el.tagName==='H3'){
    var n=el.firstChild;
    while(n&&n.nodeType===3){ var next=n.nextSibling; run.appendChild(n); n=next; }
    if(!run.textContent.trim()) return;
    var box=document.createElement('span');
    box.className='st-fit';
    box.appendChild(run);
    el.insertBefore(box, el.firstChild);
    watchFit(box); tuneFit(box);
    return;
  }
  if(el.childElementCount&&!el.classList.contains('st-crumb')) return;
  while(el.firstChild) run.appendChild(el.firstChild);
  if(!run.textContent.trim()&&!el.classList.contains('st-crumb')) return;
  el.appendChild(run);
  el.classList.add('st-fit');
  watchFit(el); tuneFit(el);
}
function armFit(root){
  if(!root||!root.querySelectorAll) return;
  var list=[];
  if(root.matches&&root.matches(FIT_SEL)) list.push(root);
  root.querySelectorAll(FIT_SEL).forEach(function(el){ list.push(el); });
  list.forEach(armFitOne);
}
function flushFit(){
  fitWait=false;
  var batch=fitQueue.splice(0);
  batch.forEach(function(n){
    if(!n.isConnected) return;
    armFit(n);
    if(n.parentElement) armFit(n.parentElement);
  });
}
function bootFit(root){
  if(fitObs) fitObs.disconnect();
  if(fitRo) fitRo.disconnect();
  fitRo=new ResizeObserver(function(entries){ entries.forEach(function(e){ tuneFit(e.target); }); });
  fitObs=new MutationObserver(function(recs){
    recs.forEach(function(r){ r.addedNodes.forEach(function(n){ if(n.nodeType===1) fitQueue.push(n); }); });
    if(!fitQueue.length||fitWait) return;
    fitWait=true;
    Promise.resolve().then(flushFit);
  });
  fitObs.observe(root,{childList:true,subtree:true});
  armFit(root);
}
function stopFit(){
  if(fitObs){ fitObs.disconnect(); fitObs=null; }
  if(fitRo){ fitRo.disconnect(); fitRo=null; }
  fitQueue=[]; fitWait=false;
}
function mount(el, opts){
  opts=opts||{};
  // Oberflaechen-Sprache ZUERST ermitteln, bevor irgendein UI-Text gebaut wird (enterStExplore()
  // unten ruft schon _t() auf). Reihenfolge siehe js/i18n.js: eigene Wahl (localStorage) >
  // opts.lang/data-lang/config.js LANG > Browsersprache.
  // Resolve the UI language FIRST, before any UI text is built (enterStExplore() below already
  // calls _t()). Order: see js/i18n.js -- the user's own choice (localStorage) > opts.lang/
  // data-lang/config.js LANG > browser language.
  if(SC.i18n) SC.i18n.init({lang:opts.lang});
  syncGameLang();
  if(typeof el==='string') el=document.querySelector(el);
  if(!el) throw new Error('SCLMW.mount: Container-Element nicht gefunden / container element not found: '+el);
  if(ROOT&&ROOT!==el) unmount();
  ROOT=el; ROOT.classList.add('sc-lmw');
  bootFit(ROOT);
  applyUiTheme(readUiTheme(opts.theme), false);
  syncLangAttr();
  BASE=String(opts.base||BASE||'./'); if(BASE.slice(-1)!=='/') BASE+='/';
  if(SC.setHoloBase) SC.setHoloBase(BASE);
  window.LIVEMAP_CONFIG=window.LIVEMAP_CONFIG||{};
  if(opts.playersUrl) window.LIVEMAP_CONFIG.PLAYERS_URL=opts.playersUrl;
  else if(!window.LIVEMAP_CONFIG.PLAYERS_URL) window.LIVEMAP_CONFIG.PLAYERS_URL=pathOf('players.example.json');
  if(opts.playersHeaders) window.LIVEMAP_CONFIG.PLAYERS_HEADERS=opts.playersHeaders;
  if(opts.pollMs!=null) window.LIVEMAP_CONFIG.PLAYERS_POLL_MS=opts.pollMs;
  var canvas=$('stCanvas');
  if(!canvas){ canvas=document.createElement('canvas'); canvas.id=ID('stCanvas'); canvas.className='st-canvas'; ROOT.appendChild(canvas); }
  // Die Startseite braucht die Karte nicht. three.js, das Ortsnamenpaket und der Szenenaufbau
  // blockieren den Hauptthread; das passiert erst, wenn jemand die Karte oeffnet.
  // The home page does not need the map. three.js, the place-name pack and the scene build
  // block the main thread; that waits until someone opens the map.
  var sceneArm=null;
  function armScene(){
    if(sceneArm) return sceneArm;
    var done, fail;
    sceneArm=new Promise(function(ok, no){ done=ok; fail=no; });
    function boot(){
      try{ window.__stClean=stantonScene(canvas,'stanton'); }
      catch(e){ fail(e); return; }
      if(!window.__stCtl){ setTimeout(boot,50); return; }
      if(opts.standalone) ROOT.classList.add('st-standalone');
      try{ enterStExplore(); }catch(e){ fail(e); return; }
      done();
    }
    var locP=(SC.loc&&SC.loc.ready)?SC.loc.ready():Promise.resolve();
    var threeP=SC.loadThreeCore?SC.loadThreeCore():(SC.loadThree?SC.loadThree():Promise.resolve());
    Promise.all([locP, threeP]).then(boot).catch(boot);
    return sceneArm;
  }
  SC.armScene=armScene;
  if(!SC.room) armScene();
  return {unmount:unmount};
}
function unmount(){
  if(!ROOT) return;
  stopFit();
  try{ exitStExplore(); }catch(e){}
  if(window.__stClean){ try{ window.__stClean(); }catch(e){} window.__stClean=null; }
  ROOT.classList.remove('sc-lmw','st-standalone','st-explore');
  ROOT.removeAttribute('data-theme');
  ROOT.removeAttribute('lang');
  ROOT.innerHTML='';
  ROOT=null;
}
SC.mount=mount; SC.unmount=unmount;
// Rueckwaertskompatibel: index.html rief bisher initLiveMap()/exitLiveMap() direkt (kein
// SCLMW.mount() noetig fuer die eigenstaendige Seite, Container ist dort einfach <body>).
// Backward compatible: index.html used to call initLiveMap()/exitLiveMap() directly (no
// SCLMW.mount() needed for the standalone page, its container is simply <body>).
window.initLiveMap=function(opts){ opts=opts||{}; mount(opts.container||document.body, Object.assign({standalone:true,base:opts.base||'./'},opts)); };
window.exitLiveMap=exitStExplore;
})();
