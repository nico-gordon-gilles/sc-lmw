/* Stroke icons for the map UI. Same weight as the crosshair on the zoom bar:
   currentColor, so classic cyan and the flat themes all pick up their own ink.
   Cheap emoji in map HTML are swapped for these when the markup is inserted. */
(function(){
  var SC=window.SCLMW=window.SCLMW||{};
  var P={
    pause:'<path d="M8 5v14M16 5v14"/>',
    play:'<path d="M8 5.5l10 6.5-10 6.5z"/>',
    close:'<path d="M6 6l12 12M18 6L6 18"/>',
    menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
    sat:'<path d="M9 9h6v6H9zM3.5 10.2H9M3.5 13.8H9M15 10.2h5.5M15 13.8h5.5M12 9V4.5M9.5 4.5h5"/>',
    scope:'<path d="M3 12.2h4.2l6.2-3.4h5.2"/><path d="M3 16.2h4.2l6.2 2h4.2"/><path d="M7.2 12.2v4"/><circle cx="19.2" cy="13.2" r="2.3"/>',
    globe:'<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c-2.4 2.6-2.4 11.4 0 16M12 4c2.4 2.6 2.4 11.4 0 16"/>',
    theme:'<path d="M4 4h16v16H4zM8 8h8v8H8z"/>',
    drag:'<path d="M3 8h13l-3.5-3.5M21 16H8l3.5 3.5"/>',
    star:'<path d="M12 2.5l1.8 6.7h7l-5.6 4.1 2.1 6.7L12 16.2 6.7 20l2.1-6.7L3.2 9.2h7z"/>',
    pin:'<path d="M12 21s6-5.8 6-11a6 6 0 1 0-12 0c0 5.2 6 11 6 11z"/><circle cx="12" cy="10" r="2"/>',
    ship:'<path d="M3.5 15L12 4.5 20.5 15 12 18.2zM12 18.2V21"/>',
    search:'<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>',
    cart:'<path d="M4 5h2.2l1.8 11h10.2l1.8-8H7"/><circle class="f" cx="9" cy="19.2" r="1.3"/><circle class="f" cx="16.5" cy="19.2" r="1.3"/>',
    coin:'<circle cx="12" cy="12" r="8"/><path d="M12 7.5v9M9.2 9.5h4.6a2.1 2.1 0 0 1 0 4.2H9.2"/>',
    chart:'<path d="M4 19V5M4 19h16M8 15.5V11M12 15.5V8M16 15.5V6"/>',
    wrench:'<path d="M14.7 6.2a3.1 3.1 0 0 1-4 4L5 16l3 3 5.8-5.7a3.1 3.1 0 0 1 4-4L15 12l-3-3z"/>',
    pick:'<path d="M14 4l6 6M3.5 20.5L15 9M8.5 4.5L4 9l5 4"/>',
    tag:'<path d="M3.5 12L12 3.5H20.5V12L12 20.5z"/><circle class="f" cx="16" cy="8" r="1.2"/>',
    trade:'<path d="M4 8h13l-3.2-3.2M20 16H7l3.2 3.2"/>',
    gate:'<path d="M7 20V9.5a5 5 0 0 1 10 0V20M5 20h14"/>',
    check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    gift:'<path d="M4 11h16v9H4zM4 11V8h16v3M12 8v12M12 8c0-2.6-3.2-3.2-4-.6M12 8c0-2.6 3.2-3.2 4-.6"/>',
    help:'<circle cx="12" cy="12" r="8"/><path d="M9.4 9.6a2.6 2.6 0 1 1 3.4 2.5c-.8.4-1.3 1-1.3 2V15"/><circle class="f" cx="12" cy="17.6" r=".8"/>',
    target:'<circle cx="12" cy="12" r="7"/><circle class="f" cx="12" cy="12" r="1.7"/><path d="M12 2.5V6M12 18v3.5M2.5 12H6M18 12h3.5"/>',
    puzzle:'<path d="M9 4h3.2a1.8 1.8 0 1 1 0 3.6H16V11a1.8 1.8 0 1 1-3.6 0V16H9v-3.2a1.8 1.8 0 1 1-3.6 0V7.6H9a1.8 1.8 0 1 0 0-3.6z"/>',
    dice:'<path d="M6 6h12v12H6z"/><circle class="f" cx="9" cy="9" r="1"/><circle class="f" cx="15" cy="15" r="1"/><circle class="f" cx="12" cy="12" r="1"/>',
    box:'<path d="M4 8l8-4 8 4v10l-8 4-8-4zM12 8v10M4 8l8 4 8-4"/>',
    shield:'<path d="M12 3l8 3v5.5c0 4.6-3.2 7.6-8 8.8-4.8-1.2-8-4.2-8-8.8V6z"/>',
    shirt:'<path d="M9 5L4 8l2 3 2-2v11h8V9l2 2 2-3-5-3-2 2h-2z"/>',
    suit:'<path d="M9 4h6v3l3 2v11H6V9l3-2z"/>',
    paint:'<path d="M5 18l9-13 4 4L9 22zM14 5l2.2-2.2"/>',
    gun:'<path d="M3 11h9V9h6v4h-6v2H8v-2H3z"/>',
    blast:'<path d="M12 2.5l1.8 6.2H20l-5 3.8 1.9 6.5L12 15.6 7.1 19l1.9-6.5-5-3.8h6.2z"/>',
    gear:'<circle cx="12" cy="12" r="3"/><path d="M12 3v3.2M12 17.8V21M3 12h3.2M17.8 12H21M5.8 5.8l2.2 2.2M16 16l2.2 2.2M18.2 5.8L16 8M8 16l-2.2 2.2"/>',
    radar:'<circle cx="12" cy="12" r="8"/><path d="M12 12l5.2-4M12 4v16M4 12h16"/>',
    plant:'<path d="M12 20V10M12 14c-4 .2-6-3.2-4.2-6.2C10 9 11.2 12 12 14M12 12c4-.2 6-3.6 4.2-6.6C14 7 12.8 10 12 12"/>',
    dot:'<circle class="f" cx="12" cy="12" r="5"/>',
    ring:'<circle cx="12" cy="12" r="5"/>',
    gem:'<path d="M12 3l6 6-6 12-6-12zM6 9h12"/>',
    key:'<circle cx="8" cy="12" r="3.6"/><path d="M11.4 12H21v2.6h-2.4V13"/>',
    map:'<path d="M4 6.5l5-2 6 2 5-2V18l-5 2-6-2-5 2zM9 4.5V18M15 6.5V20"/>',
    timer:'<circle cx="12" cy="13" r="7"/><path d="M12 13V9.2l3 2M9.5 3.5h5M12 3.5V6"/>',
    loop:'<path d="M7 8.5A5.5 5.5 0 1 1 6 15"/><path d="M7 4.5V9H2.5"/>',
    bolt:'<path d="M13 2.5L5.5 13H11l-1 8.5L18.5 10H13z"/>',
    pack:'<path d="M7 8h10v12H7zM9.5 8V5.5h5V8M7 12.5h10"/>',
    warn:'<path d="M12 3.5L21.5 20h-19z"/><path d="M12 9.5v5"/><circle class="f" cx="12" cy="17.2" r=".85"/>',
    unlock:'<rect x="6" y="11" width="12" height="9"/><path d="M8 11V8a4 4 0 0 1 8 0"/>',
    bug:'<ellipse cx="12" cy="13" rx="3.2" ry="4"/><path d="M9 10L5.5 7M15 10l3.5-3M8.5 12H4M15.5 12H20M9 16l-3 3.2M15 16l3 3.2"/>',
    sword:'<path d="M12 3v13M8 16h8M12 16v5M9 7h6"/>',
    pill:'<rect x="6" y="8" width="12" height="8" rx="4"/><path d="M12 8v8"/>',
    home:'<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8V6M12 18v3.2M2.8 12H6M18 12h3.2"/>',
    mkplanet:'<circle class="f" cx="12" cy="12" r="7"/><path class="cut" d="M5 12h14"/>',
    mkmoon:'<path class="f" d="M15.2 4.2a7.6 7.6 0 1 0 0 15.6 5.6 5.6 0 0 1 0-15.6z"/>',
    mkcity:'<path class="f" d="M4 19h16v1.4H4zM5 19V10.2h3.6V19zM9.4 19V5.2h5V19zM15.2 19V8.6H20V19z"/>',
    mkstation:'<circle class="f" cx="12" cy="12" r="4.2"/><path class="f" d="M2.2 9.2h5.2v5.6H2.2zM16.6 9.2h5.2v5.6h-5.2z"/>',
    mkrest:'<path class="f" d="M4 15.5L12 4.5l8 11H4z"/>',
    mkgate:'<circle cx="12" cy="12" r="7" stroke-width="2.6"/><circle class="f" cx="12" cy="12" r="2.2"/>',
    mkjump:'<path class="f" d="M3 6.5L11 12 3 17.5zM21 6.5L13 12l8 5.5z"/>',
    mkwikelo:'<path class="f" d="M12 3.2l7.2 4.2v8.4L12 20l-7.2-4.2V7.4z"/>',
    mkout:'<path class="f" d="M6.2 20V4h1.8v5.2h8.4L13.2 13H8v7z"/>',
    mkmine:'<path class="f" d="M12 3.2l6.4 10.2H5.6zM10.2 13.4h3.6V20h-3.6z"/>',
    mklag:'<circle class="f" cx="7.2" cy="15" r="3.1"/><circle class="f" cx="14.4" cy="8.2" r="3.6"/><circle class="f" cx="17.2" cy="15.6" r="2.3"/>',
    mkhalo:'<ellipse cx="12" cy="12" rx="8.6" ry="3.4" stroke-width="2.6"/>',
    mkcomm:'<path class="f" d="M10.6 20V10.4h2.8V20zM12 3.2l6.2 6.4H5.8z"/>',
    mkpoi:'<path class="f" d="M10.2 2.8h3.6V10h7.4v3.6H13.8v7.6h-3.6V13.6H2.8V10h7.4z"/>',
    mkrock:'<path class="f" d="M6 15.4l2.4-6.6 4.4-2.8 5.6 3.4 1.4 5.4-3.4 4H8.2z"/>',
    mkbelt:'<ellipse cx="12" cy="12" rx="8.6" ry="3.4" stroke-width="2.4"/><circle class="f" cx="6.2" cy="10.6" r="1.5"/><circle class="f" cx="12" cy="14.6" r="1.5"/><circle class="f" cx="17.6" cy="10.2" r="1.5"/>',
    mklive:'<path class="f" d="M12 2.8l7.4 9.2L12 21.2 4.6 12z"/>',
    mkoff:'<path d="M12 4.2l6.2 7.8L12 19.8 5.8 12z" stroke-width="2.4"/>',
    mkhid:'<path d="M3.2 12S6.6 6.6 12 6.6 20.8 12 20.8 12 17.4 17.4 12 17.4 3.2 12 3.2 12z" stroke-width="2.2"/><path d="M5 5l14 14" stroke-width="2.2"/>'
  };
  function svg(name, extra){
    var body=P[name]||P.box;
    return '<svg class="sc-ico'+(extra?' '+extra:'')+'" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+body+'</svg>';
  }
  var MARK={
    '\u23F8':'pause','\u25B6':'play','\u2715':'close','\u2630':'menu',
    '\uD83D\uDEF0\uFE0F':'sat','\uD83D\uDEF0':'sat','\uD83D\uDD2D':'scope',
    '\uD83C\uDF10':'globe','\u25A3':'theme','\u21C4':'drag','\u2726':'star',
    '\uD83D\uDCCD':'pin','\uD83D\uDE80':'ship','\uD83D\uDD0D':'search','\uD83D\uDED2':'cart',
    '\uD83E\uDE99':'coin','\uD83D\uDCCA':'chart','\uD83D\uDEE0\uFE0F':'wrench','\uD83D\uDEE0':'wrench',
    '\u26CF\uFE0F':'pick','\u26CF':'pick','\uD83D\uDCB0':'tag','\uD83D\uDEF8':'trade',
    '\uD83C\uDF00':'gate','\u2705':'check','\uD83C\uDF81':'gift','\u2754':'help',
    '\uD83C\uDFAF':'target','\uD83E\uDDE9':'puzzle','\uD83C\uDFB2':'dice','\uD83D\uDCE6':'box',
    '\uD83D\uDEE1\uFE0F':'shield','\uD83D\uDEE1':'shield','\uD83D\uDC55':'shirt','\uD83E\uDDE5':'suit',
    '\uD83C\uDFA8':'paint','\uD83D\uDD2B':'gun','\uD83D\uDCA5':'blast',
    '\u2699\uFE0F':'gear','\u2699':'gear','\uD83D\uDCE1':'radar','\uD83D\uDD27':'wrench',
    '\uD83E\uDEB4':'plant','\uD83D\uDFE2':'dot on','\u26AA':'ring off','\u25CF':'dot on','\u25CB':'ring off',
    '\uD83D\uDC8E':'gem','\uD83D\uDD11':'key','\uD83D\uDDFA\uFE0F':'map','\uD83D\uDDFA':'map',
    '\u23F1\uFE0F':'timer','\u23F1':'timer','\uD83D\uDD01':'loop','\u26A1':'bolt',
    '\uD83C\uDF92':'pack','\u26A0\uFE0F':'warn','\u26A0':'warn','\uD83D\uDD13':'unlock',
    '\uD83D\uDC1B':'bug','\u2694\uFE0F':'sword','\u2694':'sword','\uD83D\uDC8A':'pill',
    '\u2708\uFE0F':'ship','\u2708':'ship'
  };
  var keys=Object.keys(MARK).sort(function(a,b){ return b.length-a.length; });
  var re=new RegExp(keys.map(function(k){ return k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }).join('|'),'g');
  function html(s){
    s=s==null?'':String(s);
    if(!re.test(s)){ re.lastIndex=0; return s; }
    re.lastIndex=0;
    return s.replace(/>([^<]*)</g, function(m, t){
      if(!re.test(t)){ re.lastIndex=0; return m; }
      re.lastIndex=0;
      return '>'+t.replace(re, function(ch){
        var spec=MARK[ch]||'';
        var p=spec.split(' ');
        return svg(p[0], p[1]||'');
      })+'<';
    });
  }
  function inMap(el){
    var n=el;
    while(n){
      var c=n.className;
      if(typeof c==='string' && (c.indexOf('st-')>=0 || c.indexOf('lmw-')>=0 || c.indexOf('sc-lmw')>=0)) return true;
      if(n.id==='sc-lmw') return true;
      n=n.parentElement||n.parentNode;
      if(n===document) break;
    }
    return false;
  }
  var desc=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
  if(desc && desc.set && desc.configurable){
    Object.defineProperty(Element.prototype,'innerHTML',{
      configurable:true,
      enumerable:desc.enumerable,
      get:desc.get,
      set:function(v){
        var s=v==null?'':String(v);
        if(s && inMap(this)) s=html(s);
        return desc.set.call(this, s);
      }
    });
  }
  SC.ico=function(name, extra){ return svg(name, extra); };
  SC.ico.html=html;
})();
