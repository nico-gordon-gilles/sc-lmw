/* SC LMW: Ein-Zeilen-Einbau fuer eine fremde Seite.
 *
 * DE: <div id="sc-lmw"></div> + <script src=".../js/sc-lmw.js" data-players-url="..."
 *     data-base="..."></script> -- diese Datei findet ihren eigenen <script>-Tag, liest seine
 *     data-* Attribute, laedt js/holo.js + js/starmap.js aus demselben Ordner nach und mountet
 *     die Karte automatisch in den Zielcontainer. Kein weiterer JS-Aufruf noetig.
 * EN: <div id="sc-lmw"></div> + <script src=".../js/sc-lmw.js" data-players-url="..."
 *     data-base="..."></script> -- this file finds its own <script> tag, reads its data-*
 *     attributes, loads js/holo.js + js/starmap.js from the same folder, and mounts the map into
 *     the target container automatically. No further JS call needed.
 *
 * Attribute / attributes (alle optional / all optional):
 *   data-target        CSS-Selektor des Containers / CSS selector of the container (Default: #sc-lmw)
 *   data-base           Basispfad fuer data/, vendor/, ... (Default: der Ordner dieses Skripts / this script's own folder)
 *   data-players-url    siehe/see docs/PLAYERS_API.md (Default: <base>players.example.json)
 *   data-players-headers JSON-Objekt als String, z.B. '{"Authorization":"Bearer xyz"}' / JSON object as a string
 *   data-poll-ms        Abfrage-Intervall in ms / poll interval in ms (Default: 30000)
 *   data-lang           'auto'|'de'|'en'|'zh-Hans'|'zh-Hant' (zh-CN / zh-TW aliases work)
 *                        (Default: config.js LANG, sonst/otherwise 'auto' -- siehe js/i18n.js)
 *   data-theme          'classic'|'compact'|'practical'|'chassis'|'scifi'|'haze'
 *                        (Default: config.js THEME, sonst/otherwise 'haze')
 *
 * See CREDITS.md / LICENSE. Unofficial fan project, not affiliated with CIG/RSI.
 */
(function(){
  'use strict';
  // WICHTIG: document.currentScript ist nur WAEHREND der ersten, synchronen Ausfuehrung dieser
  // Datei gueltig -- deshalb wird er hier ganz oben, sofort, gesichert.
  // IMPORTANT: document.currentScript is only valid DURING this file's first, synchronous
  // execution -- so it is captured here, right away, at the very top.
  var THIS_SCRIPT = document.currentScript;

  function attr(name, fallback){
    if(!THIS_SCRIPT) return fallback;
    var v = THIS_SCRIPT.getAttribute(name);
    return v==null ? fallback : v;
  }
  function ownFolder(){
    if(!THIS_SCRIPT || !THIS_SCRIPT.src) return './';
    return THIS_SCRIPT.src.replace(/js\/sc-lmw\.js(\?.*)?$/, '');
  }
  function loadScript(src){
    return new Promise(function(ok, no){
      var s=document.createElement('script'); s.src=src; s.onload=ok;
      s.onerror=function(){ no(new Error('SC LMW: Laden fehlgeschlagen / failed to load: '+src)); };
      document.head.appendChild(s);
    });
  }
  function loadCss(href){
    if(document.querySelector('link[data-sclmw-css]')) return;
    var l=document.createElement('link'); l.rel='stylesheet'; l.href=href; l.setAttribute('data-sclmw-css','1');
    document.head.appendChild(l);
  }

  var base = attr('data-base', ownFolder());
  if(base.slice(-1)!=='/') base += '/';
  var targetSel = attr('data-target', '#sc-lmw');
  var playersUrl = attr('data-players-url', null);
  var pollMsRaw = attr('data-poll-ms', null);
  var lang = attr('data-lang', null);
  var theme = attr('data-theme', null);
  var headersRaw = attr('data-players-headers', null);
  var playersHeaders = null;
  if(headersRaw){
    try{ playersHeaders = JSON.parse(headersRaw); }
    catch(e){ console.error('SC LMW: data-players-headers ist kein gueltiges JSON / is not valid JSON:', e); }
  }

  function boot(){
    var el = document.querySelector(targetSel);
    if(!el){
      console.error('SC LMW: Container "'+targetSel+'" nicht gefunden -- <div id="sc-lmw"></div> fehlt? / '+
        'container "'+targetSel+'" not found -- missing <div id="sc-lmw"></div>?');
      return;
    }
    window.SCLMW.mount(el, {
      base: base,
      lang: lang || undefined,
      theme: theme || undefined,
      playersUrl: playersUrl || undefined,
      playersHeaders: playersHeaders || undefined,
      pollMs: pollMsRaw!=null ? parseInt(pollMsRaw,10) : undefined
    });
    if(window.SCLMW.room) window.SCLMW.room.start();
  }

  loadCss(base+'css/starmap.css');
  // js/i18n.js zuerst (definiert window.SCLMW.i18n), dann holo.js (definiert window.SCLMW.xyz),
  // dann starmap.js (definiert window.SCLMW.mount/unmount und ruft beide auf).
  // js/i18n.js first (defines window.SCLMW.i18n), then holo.js (defines window.SCLMW.xyz), then
  // starmap.js (defines window.SCLMW.mount/unmount and calls both).
  loadScript(base+'js/i18n.js')
    .then(function(){ return loadScript(base+'js/icons.js'); })
    .then(function(){ return loadScript(base+'js/holo.js'); })
    .then(function(){ return loadScript(base+'js/guides.js'); })
    .then(function(){ return loadScript(base+'js/starmap.js'); })
    .then(function(){ return loadScript(base+'js/room.js'); })
    .then(function(){
      if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot);
      else boot();
    })
    .catch(function(e){ console.error(e); });
})();
