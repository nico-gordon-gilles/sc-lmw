/* Personal timeline from Starfix on this computer. The page does not read the game folder. */
(function(){
  var DICT = {
    'zh-Hans': {
      title:'我的记录',
      open:'记录', close:'关闭', empty:'还没有能串起来的记录。',
      play:'播放', pause:'暂停', nopoint:'能对上星图的地点少于两个，所以还画不出轨迹。',
      lead:'播放后，星图按时间把地点连成轨迹，时间精确到秒。记录只留在这台电脑上，不会发到房间。',
      off:'本机 Starfix 没开。先打开它，记录才会出现。',
      old:'这台 Starfix 还没有记录。用当前源码重新打开一次。',
      online:'上线', place:'进入 {code}',
      done:'合约完成', abandon:'合约放弃',
      buy:'购买 {item} × {qty}，标价 {price}',
      sell:'出售 {item} × {qty}，标价 {price}',
      shop:'商店 {shop}', ship:'驾驶 {ship}',
      aim:'选定 {where}', aimShip:'选定 {where}，驾驶 {ship}',
      jump:'从 {from} 前往 {where}', jumpShip:'从 {from} 前往 {where}，驾驶 {ship}',
      arrive:'到达 {where}', arriveShip:'到达 {where}，驾驶 {ship}',
      beacon:'任务信标', somewhere:'某处', fly:'在星图上查看'
    },
    'zh-Hant': {
      title:'我的記錄',
      open:'記錄', close:'關閉', empty:'還沒有能串起來的記錄。',
      play:'播放', pause:'暫停', nopoint:'能對上星圖的地點少於兩個，所以還畫不出軌跡。',
      lead:'播放後，星圖按時間把地點連成軌跡，時間精確到秒。記錄只留在這台電腦上，不會發到房間。',
      off:'本機 Starfix 沒開。先打開它，記錄才會出現。',
      old:'這台 Starfix 還沒有記錄。用目前源碼重新打開一次。',
      online:'上線', place:'進入 {code}',
      done:'合約完成', abandon:'合約放棄',
      buy:'購買 {item} × {qty}，標價 {price}',
      sell:'出售 {item} × {qty}，標價 {price}',
      shop:'商店 {shop}', ship:'駕駛 {ship}',
      aim:'選定 {where}', aimShip:'選定 {where}，駕駛 {ship}',
      jump:'從 {from} 前往 {where}', jumpShip:'從 {from} 前往 {where}，駕駛 {ship}',
      arrive:'到達 {where}', arriveShip:'到達 {where}，駕駛 {ship}',
      beacon:'任務信標', somewhere:'某處', fly:'在星圖上查看'
    },
    en: {
      title:'My log',
      open:'Log', close:'Close', empty:'Nothing has been recorded yet.',
      play:'Play', pause:'Pause', nopoint:'Fewer than two places match the map, so there is no trail yet.',
      lead:'Play draws the places on the map in time order, down to the second. The log stays on this computer and is not sent to the room.',
      off:'Starfix is not open on this computer.',
      old:'This Starfix has no log yet. Open it again from the current source.',
      online:'Signed in', place:'Entered {code}',
      done:'Contract complete', abandon:'Contract abandoned',
      buy:'Bought {item} × {qty}, listed {price}',
      sell:'Sold {item} × {qty}, listed {price}',
      shop:'Shop {shop}', ship:'Flew {ship}',
      aim:'Selected {where}', aimShip:'Selected {where}, flew {ship}',
      jump:'From {from} to {where}', jumpShip:'From {from} to {where}, flew {ship}',
      arrive:'Arrived {where}', arriveShip:'Arrived {where}, flew {ship}',
      beacon:'mission beacon', somewhere:'somewhere', fly:'Show on the map'
    },
    de: {
      title:'Mein Verlauf',
      open:'Verlauf', close:'Schließen', empty:'Noch nichts aufgezeichnet.',
      play:'Abspielen', pause:'Pause', nopoint:'Weniger als zwei Orte passen auf die Karte, deshalb gibt es noch keine Spur.',
      lead:'Abspielen zeichnet die Orte in der Zeit, bis auf die Sekunde. Der Verlauf bleibt auf diesem Computer und geht nicht in den Raum.',
      off:'Starfix ist auf diesem Computer nicht geöffnet.',
      old:'Dieses Starfix hat noch keinen Verlauf. Öffne es erneut aus dem aktuellen Quelltext.',
      online:'Angemeldet', place:'Zone {code}',
      done:'Auftrag abgeschlossen', abandon:'Auftrag abgebrochen',
      buy:'Gekauft {item} × {qty}, Preis {price}',
      sell:'Verkauft {item} × {qty}, Preis {price}',
      shop:'Laden {shop}', ship:'Geflogen {ship}',
      aim:'Ziel {where}', aimShip:'Ziel {where}, geflogen {ship}',
      jump:'Von {from} nach {where}', jumpShip:'Von {from} nach {where}, geflogen {ship}',
      arrive:'Ankunft {where}', arriveShip:'Ankunft {where}, geflogen {ship}',
      beacon:'Auftragsbake', somewhere:'irgendwo', fly:'Auf der Karte zeigen'
    }
  };

  function lang(){
    var code = window.SCLMW && SCLMW.i18n && SCLMW.i18n.lang;
    return DICT[code] ? code : 'en';
  }
  function t(key){
    var pack = DICT[lang()] || DICT.en;
    return pack[key] || DICT.en[key] || key;
  }
  function fill(key, map){
    return t(key).replace(/\{(\w+)\}/g, function(_m, name){ return map[name] == null ? '' : String(map[name]); });
  }
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
    });
  }
  function root(){ return document.querySelector('.sc-lmw') || document.body; }
  function where(ev){
    if(ev.destKind === 'beacon') return t('beacon');
    if(ev.dest) return ev.dest;
    return t('somewhere');
  }
  function itemFace(raw){
    var s = String(raw || '').trim();
    if(!s) return {text:'', code:false};
    var loc = window.SCLMW && SCLMW.loc;
    var hit = loc && typeof loc.item === 'function' ? (loc.item(s) || '') : '';
    if(!hit && loc && typeof loc.text === 'function'){
      var named = loc.text(s);
      if(named && named !== s) hit = named;
    }
    if(hit) return {text:hit, code:false};
    return {text:s, code:(s.indexOf('_') >= 0 && s.indexOf(' ') < 0)};
  }
  function shopFace(raw){
    var s = String(raw || '').trim();
    if(!s) return '';
    if(window.SCLMW && typeof SCLMW.gnLine === 'function') return SCLMW.gnLine(s);
    var loc = window.SCLMW && SCLMW.loc;
    if(loc && typeof loc.text === 'function'){
      var named = loc.text(s);
      if(named) return named;
    }
    return s;
  }
  function rowHtml(ev){
    if(ev.kind === 'buy' || ev.kind === 'sell'){
      var face = itemFace(ev.item || '');
      var token = '\u0001';
      var parts = fill(ev.kind, {item:token, qty:ev.qty || 0, price:ev.price || 0}).split(token);
      var itemHtml = face.code ? '<code class="st-hist-code">'+esc(face.text)+'</code>' : esc(face.text);
      return esc(parts[0] || '') + itemHtml + esc(parts[1] || '');
    }
    return esc(sentence(ev));
  }
  function sentence(ev){
    var ship = ev.ship || '';
    if(ev.kind === 'online') return t('online');
    if(ev.kind === 'place') return fill('place', {code: ev.code || ''});
    if(ev.kind === 'contract') return ev.result === 'abandon' ? t('abandon') : t('done');
    if(ev.kind === 'mission') return ev.say || '';
    if(ev.kind === 'buy' || ev.kind === 'sell') return fill(ev.kind, {item: ev.item || '', qty: ev.qty || 0, price: ev.price || 0});
    if(ev.kind === 'ship') return fill('ship', {ship: ship});
    if(ev.kind === 'aim') return fill(ship ? 'aimShip' : 'aim', {where: where(ev), ship: ship});
    if(ev.kind === 'jump') return fill(ship ? 'jumpShip' : 'jump', {from: ev.start || t('somewhere'), where: where(ev), ship: ship});
    if(ev.kind === 'arrive') return fill(ship ? 'arriveShip' : 'arrive', {where: where(ev), ship: ship});
    return '';
  }
  function stamp(ms){
    var date = new Date(ms);
    if(isNaN(date.getTime())) return '';
    function z(n){ return (n < 10 ? '0' : '') + n; }
    return date.getFullYear() + '-' + z(date.getMonth() + 1) + '-' + z(date.getDate()) + ' ' + z(date.getHours()) + ':' + z(date.getMinutes()) + ':' + z(date.getSeconds());
  }
  function when(ev){
    if(!ev || !ev.t) return '';
    var ms = Date.parse(ev.t);
    return isNaN(ms) ? ev.t : stamp(ms);
  }
  function placeCode(text){
    var s = String(text || '');
    var named = s.match(/\b(HUR|CRU|ARC|MIC)\s*[- ]?\s*L(\d+)/i);
    if(named) return 'RR_' + named[1].toUpperCase() + '_L' + named[2];
    var short = s.match(/^(HUR|CRU|ARC|MIC)-L(\d+)$/i);
    if(short) return 'RR_' + short[1].toUpperCase() + '_L' + short[2];
    if(s.indexOf('赫') >= 0){
      var hur = s.match(/L(\d+)/);
      if(hur) return 'RR_HUR_L' + hur[1];
    }
    return '';
  }
  function locOf(code, name){
    var SC = window.SCLMW;
    if(!code || !SC || !SC.playerLoc) return null;
    var loc = SC.playerLoc({code: code, location: name || code, system: ''});
    return loc && loc.id ? loc : null;
  }
  function eventPlaces(ev){
    var found = [];
    function add(code, name){
      var loc = locOf(code, name);
      if(!loc) return;
      if(!found.length || found[found.length - 1].id !== loc.id) found.push(loc);
    }
    add(placeCode(ev.start), ev.start);
    add(ev.code || placeCode(ev.dest) || placeCode(ev.say), ev.dest || ev.say || ev.code);
    return found;
  }

  var box = null, open = false, timer = 0, rows = [], stops = [], rowAt = {}, play = {on:false, speed:1, index:0, frac:0, last:0, raf:0}, note = '', seen = '', framed = false;

  function ensure(){
    var host = root();
    if(!box){
      box = document.createElement('section');
      box.id = 'stHist';
      box.className = 'st-hist';
      box.hidden = true;
      host.appendChild(box);
    }
    var tabs = document.querySelector('.sc-lmw .st-tabs');
    if(tabs && !document.getElementById('stHistBtn')){
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'stHistBtn';
      btn.addEventListener('click', function(){ toggle(!open); });
      tabs.appendChild(btn);
    }
    var btnNow = document.getElementById('stHistBtn');
    if(btnNow){
      btnNow.textContent = t('open');
      btnNow.classList.toggle('on', open);
      btnNow.setAttribute('aria-pressed', open ? 'true' : 'false');
    }
  }

  function ctl(){ return window.__stCtl || null; }
  function holdMap(on){
    var map = ctl();
    if(map && map.holdSpin) map.holdSpin(!!on);
  }
  function buildStops(){
    stops = [];
    rowAt = {};
    var order = rows.map(function(ev, i){ return {ev:ev, i:i}; }).reverse();
    order.forEach(function(item){
      var places = eventPlaces(item.ev);
      var ms = Date.parse(item.ev.t);
      if(isNaN(ms)) ms = stops.length ? stops[stops.length - 1].t : 0;
      if(!places.length){
        if(stops.length) rowAt[item.i] = stops.length - 1;
        return;
      }
      places.forEach(function(loc){
        var prev = stops[stops.length - 1];
        if(prev && prev.loc.id === loc.id){
          prev.until = ms;
          prev.ev = item.ev;
        }else{
          stops.push({t:ms, until:ms, loc:loc, ev:item.ev});
        }
        rowAt[item.i] = stops.length - 1;
      });
    });
    if(play.index > stops.length - 1) play.index = 0;
  }
  function shownMs(){
    if(!stops.length) return 0;
    var a = stops[play.index];
    var b = stops[Math.min(play.index + 1, stops.length - 1)];
    if(!b || a === b) return a.t;
    return a.t + (b.t - a.t) * play.frac;
  }
  function draw(frame){
    var map = ctl();
    if(!map || !stops.length) return;
    var locs = stops.map(function(s){ return s.loc; });
    var u = stops.length < 2 ? 0 : (play.index + play.frac) / (stops.length - 1);
    if(frame && !framed && map.frameTrail){ framed = true; map.frameTrail(locs); }
    else if(map.playTrail) map.playTrail(locs, u, play.on);
  }
  function markRow(){
    if(!box) return;
    var ev = stops[play.index] && stops[play.index].ev;
    box.querySelectorAll('.st-hist-row').forEach(function(el){
      var on = rows[+el.getAttribute('data-i')] === ev;
      el.classList.toggle('is-on', on);
      if(on && play.on && el.scrollIntoView) el.scrollIntoView({block:'nearest'});
    });
    var clock = document.getElementById('stHistClock');
    if(clock) clock.textContent = stops.length ? stamp(shownMs()) : '';
  }
  function stopPlay(){
    play.on = false;
    if(play.raf){ cancelAnimationFrame(play.raf); play.raf = 0; }
    var btn = document.getElementById('stHistPlay');
    if(btn) btn.textContent = t('play');
    holdMap(false);
  }
  function tick(now){
    if(!play.on) return;
    if(!play.last) play.last = now;
    var step = (now - play.last) / 1600 * play.speed;
    play.last = now;
    play.frac += step;
    while(play.frac >= 1 && play.index < stops.length - 1){
      play.frac -= 1;
      play.index += 1;
    }
    if(play.index >= stops.length - 1){
      play.index = Math.max(0, stops.length - 1);
      play.frac = 0;
      stopPlay();
    }
    draw(false);
    markRow();
    if(play.on) play.raf = requestAnimationFrame(tick);
  }
  function startPlay(){
    if(stops.length < 2) return;
    if(play.index >= stops.length - 1){ play.index = 0; play.frac = 0; }
    holdMap(true);
    play.on = true;
    play.last = 0;
    var btn = document.getElementById('stHistPlay');
    if(btn) btn.textContent = t('pause');
    if(play.raf) cancelAnimationFrame(play.raf);
    play.raf = requestAnimationFrame(tick);
  }
  function seek(index){
    if(!stops.length) return;
    holdMap(true);
    play.index = Math.max(0, Math.min(stops.length - 1, index));
    play.frac = 0;
    play.last = 0;
    draw(false);
    markRow();
    var map = ctl();
    if(map && map.playTrail){
      var loc = stops[play.index].loc;
      map.playTrail([loc], 0, true);
      var locs = stops.map(function(s){ return s.loc; });
      var u = stops.length < 2 ? 0 : play.index / (stops.length - 1);
      map.playTrail(locs, u, true);
    }
  }
  function paint(message){
    ensure();
    if(!box) return;
    box.hidden = !open;
    if(!open) return;
    note = message || '';
    buildStops();
    var speeds = [1, 2, 4, 8].map(function(n){
      return '<button type="button" class="st-hist-speed'+(play.speed===n?' on':'')+'" data-speed="'+n+'">'+n+'×</button>';
    }).join('');
    var list = rows.map(function(ev, i){
      var text = sentence(ev);
      if(!text) return '';
      var shopName = (ev.kind === 'buy' || ev.kind === 'sell') && ev.shop ? shopFace(ev.shop) : '';
      var shop = shopName ? '<small>'+esc(fill('shop', {shop: shopName}))+'</small>' : '';
      var on = stops[play.index] && stops[play.index].ev === ev ? ' is-on' : '';
      return '<button type="button" class="st-hist-row'+on+'" data-i="'+i+'">'+
        '<time>'+esc(when(ev))+'</time><b>'+rowHtml(ev)+'</b>'+shop+'</button>';
    }).join('');
    var body = list || '<p class="st-hist-empty">'+esc(note || t('empty'))+'</p>';
    var warn = rows.length && stops.length < 2 ? '<p class="st-hist-empty">'+esc(t('nopoint'))+'</p>' : '';
    box.innerHTML = '<header><b>'+esc(t('title'))+'</b><button type="button" id="stHistClose">'+esc(t('close'))+'</button></header>'+
      '<p class="st-hist-lead">'+esc(t('lead'))+'</p>'+
      '<div class="st-hist-play"><button type="button" id="stHistPlay">'+esc(play.on ? t('pause') : t('play'))+'</button>'+speeds+
      '<time id="stHistClock">'+esc(stops.length ? stamp(shownMs()) : '')+'</time></div>'+warn+
      '<div class="st-hist-list">'+body+'</div>';
    document.getElementById('stHistClose').onclick = function(){ toggle(false); };
    document.getElementById('stHistPlay').onclick = function(){ if(play.on) stopPlay(); else startPlay(); };
    box.querySelectorAll('.st-hist-speed').forEach(function(el){
      el.onclick = function(){
        play.speed = +el.getAttribute('data-speed') || 1;
        box.querySelectorAll('.st-hist-speed').forEach(function(b){ b.classList.toggle('on', b === el); });
        if(!play.on) startPlay();
      };
    });
    box.querySelectorAll('.st-hist-row').forEach(function(el){
      el.onclick = function(){
        var at = rowAt[+el.getAttribute('data-i')];
        if(at == null) return;
        stopPlay();
        seek(at);
      };
    });
    if(stops.length) draw(!play.on && play.index === 0 && play.frac === 0);
  }

  function pull(){
    fetch('http://127.0.0.1:8780/api/history', {cache:'no-store'})
      .then(function(r){
        if(r.status === 404){ rows = []; stops = []; seen = ''; if(ctl()) ctl().clearTrail(); paint(t('old')); return null; }
        if(!r.ok) throw new Error('history');
        return r.json();
      })
      .then(function(data){
        if(!data) return;
        var next = (data.events || []).filter(function(ev){ return ev && sentence(ev); });
        var sig = next.map(function(ev){ return (ev.t||'')+'|'+(ev.kind||'')+'|'+(ev.say||'')+'|'+(ev.start||'')+'|'+(ev.code||''); }).join('\n');
        if(sig === seen) return;
        seen = sig;
        rows = next;
        paint(rows.length ? '' : t('empty'));
      })
      .catch(function(){
        rows = [];
        stops = [];
        seen = '';
        if(ctl()) ctl().clearTrail();
        paint(t('off'));
      });
  }

  function toggle(next){
    open = next;
    ensure();
    if(timer){ clearInterval(timer); timer = 0; }
    if(open){
      framed = false;
      paint(t('empty'));
      pull();
      timer = setInterval(pull, 8000);
    }else{
      stopPlay();
      framed = false;
      if(ctl()) ctl().clearTrail();
      if(box) box.hidden = true;
    }
    var btn = document.getElementById('stHistBtn');
    if(btn) btn.classList.toggle('on', open);
  }

  function boot(){
    ensure();
    document.addEventListener('sclmw-lang', function(){ ensure(); if(open) paint(); });
    setInterval(ensure, 1000);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
