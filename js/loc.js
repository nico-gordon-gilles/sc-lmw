/* Game-text localization. UI chrome stays in js/i18n.js.
   Place, ship, item, ore, mission and description strings are English in data/*.json.
   data/loc.json maps those English strings to zh-Hans / zh-Hant, built from
   Language/chinese_(simplified|traditional)/global.ini plus the game's labels.json keys.
   A user-supplied global.ini (same keys) overrides the built-in pack. */
(function(){
  'use strict';
  var SC=window.SCLMW=window.SCLMW||{};
  var MODE_KEY='sclmw_loc_mode';
  var mode='auto';
  try{ mode=localStorage.getItem(MODE_KEY)||'auto'; }catch(e){}
  if(['auto','hans','hant','off','custom'].indexOf(mode)<0) mode='auto';

  var pack=null, packWait=null, keys=null, keysWait=null;
  var custom=null; // {map, name, lines, cls}
  var active=null, activeClass=null;
  var userText=null, userName='';

  function uiLang(){ return (SC.i18n&&SC.i18n.lang)||'en'; }
  function resolved(){
    if(mode==='off') return null;
    if(mode==='custom') return custom? 'custom' : fallbackLang();
    if(mode==='hans'||mode==='hant') return mode;
    return fallbackLang();
  }
  function fallbackLang(){
    var l=uiLang();
    if(l==='zh-Hant') return 'hant';
    if(l==='zh-Hans') return 'hans';
    return null;
  }
  function base(){ return (SC.basePath?SC.basePath():'./'); }
  function notify(){ try{ if(SC.loc&&typeof SC.loc.onChange==='function') SC.loc.onChange(); }catch(e){} }

  function withAlias(dict){
    var al=pack&&pack.alias; if(!al||!dict) return dict;
    Object.keys(al).forEach(function(short){ var src=al[short]; if(dict[src]) dict[short]=dict[src]; });
    return dict;
  }
  function rebuild(){
    var r=resolved();
    if(!r||!pack){ active=null; activeClass=null; return; }
    var lang=r==='custom'?(fallbackLang()||'hans'):r;
    var baseDict=pack[lang]?Object.assign({}, pack[lang]):{};
    if(r==='custom'&&custom&&custom.map) Object.assign(baseDict, custom.map);
    active=withAlias(baseDict);
    var table=pack&&pack.class&&pack.class[lang]?Object.assign({}, pack.class[lang]):{};
    if(r==='custom'&&custom&&custom.cls) Object.assign(table, custom.cls);
    activeClass=table;
  }

  function fold(t){ return String(t||'').replace(/-/g,' ').replace(/\s+/g,' ').trim(); }
  function loose(t){ return fold(t).split(' ').filter(function(p){ return !/^\d+$/.test(p); }).join(' '); }
  function lookup(q){ return q&&active?active[q]:''; }

  var ROMAN={1:'I',2:'II',3:'III',4:'IV',5:'V',6:'VI',7:'VII',8:'VIII',9:'IX',10:'X',11:'XI',12:'XII'};
  // Watcher labels spell the class id. The pack uses the official English name.
  var SUIT={
    Concierge:'Venture Undersuit Executive',
    Centurion:'Venture Undersuit Voyager',
    Imperator:'Venture Undersuit Pathfinder',
    Ruso:'Venture Undersuit "Rust Society"'
  };
  function romanize(t){
    return String(t||'').replace(/\bMk\s*(\d{1,2})\b/gi, function(all, n){
      var r=ROMAN[+n];
      return r ? 'Mk '+r : all;
    });
  }
  function watchForms(t){
    var forms=[], seen={};
    function add(s){ if(s && !seen[s]){ seen[s]=1; forms.push(s); } }
    add(romanize(t));
    var slim=loose(t);
    if(slim && slim!==t) add(romanize(slim));
    var armor=String(t||'').match(/^RRS Specialist Heavy (Core|Helmet|Arms|Legs)$/);
    if(armor) add('Morozov-SH '+armor[1]);
    var suit=String(slim||'').match(/^RSI Explorer Undersuit ([A-Za-z]+)$/);
    if(suit && SUIT[suit[1]]) add(SUIT[suit[1]]);
    return forms;
  }
  function text(s){
    if(s==null||s===''||!active) return s;
    var t=String(s), hit=lookup(t);
    if(hit) return hit;
    var folded=fold(t);
    if(folded!==t && (hit=lookup(folded))) return hit;
    var slim=loose(t);
    if(slim && slim!==t && slim!==folded && slim.split(' ').length>=2 && (hit=lookup(slim))) return hit;
    var forms=watchForms(t), i;
    for(i=0;i<forms.length;i++){ if(forms[i]!==t && (hit=lookup(forms[i]))) return hit; }
    var m=t.match(/^(.*?)(\s*\((?:raw|ore|r)\)\s*)$/i);
    if(m&&active[m[1]]) return active[m[1]]+m[2];
    var raw=t.replace(/^raw\s+/i,'');
    if(raw!==t&&active[raw]) return active[raw];
    return s;
  }

  function classFromKey(k){
    var base=String(k||'').split(',')[0], low=base.toLowerCase();
    var mark='item_name_';
    return low.indexOf(mark)===0 ? base.slice(mark.length).toLowerCase() : '';
  }

  function parseIni(raw){
    var out={};
    String(raw||'').split(/\r?\n/).forEach(function(line){
      line=line.replace(/^\uFEFF/,'').trim();
      if(!line||line.charAt(0)==='#'||line.charAt(0)===';'||line.charAt(0)==='['||line.indexOf('=')<0) return;
      var i=line.indexOf('='), k=line.slice(0,i).trim(), v=line.slice(i+1).replace(/\\n/g,'\n').trim();
      if(k&&v) out[k]=v;
    });
    return out;
  }

  function idb(){
    return new Promise(function(res,rej){
      var r=indexedDB.open('sclmw-loc',1);
      r.onupgradeneeded=function(){ r.result.createObjectStore('kv'); };
      r.onsuccess=function(){ res(r.result); };
      r.onerror=function(){ rej(r.error); };
    });
  }
  function idbGet(k){
    var read=idb().then(function(db){ return new Promise(function(res,rej){
      var q=db.transaction('kv').objectStore('kv').get(k);
      q.onsuccess=function(){ res(q.result||null); }; q.onerror=function(){ rej(q.error); };
    }); });
    return Promise.race([read, new Promise(function(res){ setTimeout(function(){ res(null); }, 1200); })]);
  }
  function idbSet(k,v){
    return idb().then(function(db){ return new Promise(function(res,rej){
      var q=db.transaction('kv','readwrite').objectStore('kv').put(v,k);
      q.onsuccess=function(){ res(); }; q.onerror=function(){ rej(q.error); };
    }); });
  }
  function idbDel(k){
    return idb().then(function(db){ return new Promise(function(res,rej){
      var q=db.transaction('kv','readwrite').objectStore('kv').delete(k);
      q.onsuccess=function(){ res(); }; q.onerror=function(){ rej(q.error); };
    }); });
  }

  function ensurePack(){
    if(pack) return Promise.resolve(pack);
    if(packWait) return packWait;
    packWait=fetch(base()+'data/loc.json',{cache:'no-cache'}).then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); }).then(function(d){
      pack=d&&d.hans?d:{hans:{},hant:{},alias:{}}; return pack;
    }).catch(function(){ pack={hans:{},hant:{},alias:{}}; return pack; });
    return packWait;
  }
  function ensureKeys(){
    if(keys) return Promise.resolve(keys);
    if(keysWait) return keysWait;
    keysWait=fetch(base()+'data/loc-keys.json',{cache:'no-cache'}).then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); }).then(function(d){ keys=d||{}; return keys; }).catch(function(){ keys={}; return keys; });
    return keysWait;
  }
  function mapFromIni(raw){
    return ensureKeys().then(function(table){
      var ini=parseIni(raw), hits=[];
      Object.keys(ini).forEach(function(k){
        var slot=table[k]; if(!slot) return;
        var rank=slot[0], en=slot[1], val=ini[k];
        if(!en||!val) return;
        hits.push({rank:rank, en:en, val:val, n:k.length});
      });
      hits.sort(function(a,b){ return b.rank-a.rank||b.n-a.n; });
      var map={}, classes={};
      hits.forEach(function(h){ map[h.en]=h.val; });
      Object.keys(ini).forEach(function(k){
        var code=classFromKey(k), val=ini[k];
        if(code && val && (!classes[code] || k.indexOf(',')<0)) classes[code]=val;
      });
      return {map:map, cls:classes, lines:Object.keys(ini).length, applied:Object.keys(map).length};
    });
  }
  function adopt(raw, name){
    return ensurePack().then(function(){ return mapFromIni(raw); }).then(function(got){
      if(!got.applied){ var err=new Error('empty'); err.code='empty'; throw err; }
      custom={map:got.map, cls:got.cls||{}, name:name||'global.ini', lines:got.lines, applied:got.applied};
      userText=raw; userName=custom.name;
      mode='custom';
      try{ localStorage.setItem(MODE_KEY,'custom'); }catch(e){}
      return idbSet('ini',{text:raw, name:custom.name}).catch(function(){}).then(function(){
        rebuild(); notify(); return custom;
      });
    });
  }

  function boot(){
    return idbGet('ini').catch(function(){ return null; }).then(function(row){
      if(row&&row.text){ userText=row.text; userName=row.name||'global.ini'; }
    }).then(function(){
      if(!userText) return;
      return ensurePack().then(function(){ return mapFromIni(userText); }).then(function(got){
        if(got.applied) custom={map:got.map, cls:got.cls||{}, name:userName, lines:got.lines, applied:got.applied};
        rebuild(); notify();
      });
    });
  }

  function item(cls){
    if(!cls||!activeClass) return '';
    return activeClass[String(cls).toLowerCase()]||'';
  }

  SC.loc={
    text:text,
    item:item,
    mode:function(){ return mode; },
    resolved:resolved,
    stats:function(){ return {ready:!!pack, mode:mode, resolved:resolved(), custom:custom?custom.applied:0, customName:custom?custom.name:'', hasFile:!!userText}; },
    ready:function(){ if(!resolved()&&mode!=='custom') return Promise.resolve(null); return ensurePack().then(function(){ rebuild(); return pack; }); },
    sync:function(){ var want=resolved(); if(want&&!pack){ ensurePack().then(function(){ rebuild(); notify(); }); return; } rebuild(); },
    setMode:function(m){
      if(['auto','hans','hant','off','custom'].indexOf(m)<0) return;
      if(m==='custom'&&!userText) return;
      mode=m; try{ localStorage.setItem(MODE_KEY,m); }catch(e){}
      var p=(m==='off')?Promise.resolve():ensurePack();
        p.then(function(){ if(m==='custom'&&userText&&!custom) return mapFromIni(userText).then(function(got){ if(got.applied) custom={map:got.map, cls:got.cls||{}, name:userName, lines:got.lines, applied:got.applied}; }); }).then(function(){ rebuild(); notify(); });
    },
    loadFile:function(file){ return file.text().then(function(t){ return adopt(t, file.name||'global.ini'); }); },
    applyText:function(text){ return adopt(text, 'global.ini'); },
    clearCustom:function(){
      custom=null; userText=null; userName='';
      if(mode==='custom') mode='auto';
      try{ localStorage.setItem(MODE_KEY, mode); }catch(e){}
      idbDel('ini').catch(function(){});
      rebuild(); notify();
    },
    onChange:null
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
