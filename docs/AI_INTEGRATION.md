# AI Integration Guide / KI-Integrationsanleitung

*(English below / Deutsch weiter unten)*

This file holds a ready-to-paste prompt for an AI coding assistant (Claude,
ChatGPT, or similar) that tells it exactly how to integrate **SC LMW (Star
Citizen LiveMap Wiki)**, version 1.1.0, into an existing website. Paste the
fenced block into your AI assistant's chat, in the same repo/workspace where
the existing website and this project's files live.

---

## English

### Copy-paste prompt

````text
You are integrating "SC LMW" (Star Citizen LiveMap Wiki, v1.1.0), an
open-source, AGPL-3.0-licensed, static Star Citizen 3D map, into an existing
website. Follow these steps exactly. Do not ask clarifying questions unless a
step is genuinely ambiguous for this specific codebase -- make the
reasonable choice and note what you chose.

1. COPY FILES
   Copy the following into a new subfolder of the target site, e.g.
   `/live-map/`:
     index.html, config.js, players.example.json, js/, css/, vendor/,
     docs/, LICENSE, CREDITS.md, VERSION
   Do NOT copy: data/, .cache/, .test/ (build output / dev-only, listed in
   this project's .gitignore). Keep the relative folder structure intact --
   index.html and js/sc-lmw.js expect ./js/, ./css/, ./vendor/three/,
   ./data/ next to them.

2. BUILD THE GAME DATA
   Requires Python 3 and network access (GitHub, api.uexcorp.space,
   fleetyards.net). From inside the copied `live-map/` folder, run:
     python3 scripts/build-all.py
   This creates data/*.json (a few MB). Re-run it after Star Citizen
   patches to refresh. Do not commit data/ or .cache/ to version control.

3. PICK AN EMBED METHOD
   There are two, both fully scoped under a `.sc-lmw` root: they never
   style `body`/`html` or anything outside their own container, use one
   global (`window.SCLMW`), and resize to their container via
   `ResizeObserver` -- they work in a small box or a full page, phone or
   desktop.

   (a) IFRAME -- simplest, use when you just want the whole standalone page:
       <iframe src="/live-map/index.html" style="width:100%;height:640px;border:0" allow="fullscreen"></iframe>
       Any size works; there is no minimum. If you set a `sandbox`
       attribute, it needs at least `allow-scripts allow-same-origin`, or
       the map will not run.

   (b) DIRECT EMBED -- when the map must live inside the page's own DOM
       (e.g. to match scroll behavior, or avoid an iframe for some other
       reason): a container and ONE script tag, nothing else to wire up.
         <div id="sc-lmw"></div>
         <script src="/live-map/js/sc-lmw.js"
                 data-players-url="/live-map/players.example.json"
                 data-base="/live-map/"></script>
       This script auto-finds the `#sc-lmw` div (or whatever `data-target`
       points at), loads holo.js + starmap.js + css/starmap.css from
       `data-base`, and mounts the map automatically -- no further JS call
       needed. All its `data-*` attributes are optional:
         data-target           CSS selector for the container (default: #sc-lmw)
         data-base              base path for data/, vendor/, css/, ... (default: this script's own folder)
         data-players-url       see step 4 below (default: <base>players.example.json, the fictional demo)
         data-players-headers   a JSON object as a string, e.g. '{"Authorization":"Bearer xyz"}'
         data-poll-ms            how often (ms) to re-fetch data-players-url (default: 30000)
         data-lang               interface language 'auto'|'de'|'en'|'zh-Hans'|'zh-Hant' (default: config.js LANG,
                                  else 'auto' = browser language). This is the INTERFACE itself
                                  (buttons, panels, search, error messages) -- separate from the
                                  small in-map "DE"/"EN" button, which only translates in-game
                                  text (mission types, amenity names) and is unaffected. A
                                  visitor's own choice (the interface has its own language
                                  switch) is remembered in their browser and wins over this.
         data-theme              'classic'|'compact'|'practical'|'chassis'|'scifi'|'haze'
                                  (default: config.js THEME, else 'haze'). The visitor's
                                  own choice wins over this.
       If you need programmatic control (mount/unmount at a chosen time,
       change options later), call `window.SCLMW.mount(el, opts)` /
       `window.SCLMW.unmount()` yourself instead of using the auto-init
       script tag -- `opts` takes the same fields as the `data-*`
       attributes (`base`, `playersUrl`, `playersHeaders`, `pollMs`, `lang`), plus
       `standalone: true` if this container should fill the whole
       viewport (that's what index.html itself does).

4. BUILD YOUR OWN PLAYERS ENDPOINT
   It must return exactly the JSON shape documented in docs/PLAYERS_API.md:
     {"players":[{id,name,online,last_seen,code,location,system,ship,travel}, ...]}
   Minimal examples below -- adapt the data source (read from your own
   DB/bot/log-watcher); these snippets only show the required HTTP shape.

   Node.js / Express:
     app.get('/api/players', (req, res) => {
       res.set('Access-Control-Allow-Origin', 'https://your-map-host.example'); // only if cross-origin
       res.json({ players: [ /* map your real data to the shape above */ ] });
     });

   Python / Flask:
     from flask import Flask, jsonify
     app = Flask(__name__)

     @app.get("/api/players")
     def players():
         resp = jsonify({"players": []})  # map your real data to the shape above
         resp.headers["Access-Control-Allow-Origin"] = "https://your-map-host.example"  # if cross-origin
         return resp

   PHP:
     <?php
     header('Content-Type: application/json');
     header('Access-Control-Allow-Origin: https://your-map-host.example'); // if cross-origin
     echo json_encode(['players' => [ /* map your real data to the shape above */ ]]);

   Never put Discord ids, real names, or other personal data into id/name
   without your community's explicit consent (see docs/PLAYERS_API.md,
   section "Privacy").

5. CORS
   api.uexcorp.space and fleetyards.net are public, CORS-open APIs the
   browser calls directly; no proxy needed for them.
   Your own players endpoint (step 4) only needs CORS headers if it is
   served from a different origin (scheme+host+port) than the page loading
   the map. Same-origin: no CORS headers needed. With an iframe (method a),
   "same origin" means the page hosting the iframe and the players endpoint
   -- the iframe's own origin (index.html's host) is what actually fetches
   it, not the outer page.

6. KEEP THE MANDATORY NOTICE VISIBLE
   Do not remove, hide, or visually cover the fan-project/trademark notice
   at the bottom of the page (id ending in "fanNotice" in index.html; the
   direct-embed method doesn't add its own page-level notice, so if you use
   method (b) keep this same notice visible somewhere near the map on your
   own page instead), and do not remove the "Credits & licenses" link. This
   is a condition of using this project, not a cosmetic choice.

7. AGPL-3.0 OBLIGATIONS
   This project is licensed AGPL-3.0 (see LICENSE). If you modify the code
   (this map's HTML/CSS/JS/build scripts) and let anyone other than
   yourself use the modified version over a network -- including an
   internal site reachable only by members of your own organization -- you
   must offer them the complete corresponding source code of your modified
   version, under the same license. Keep LICENSE and CREDITS.md in the
   deployed copy. Keep the "SC LMW" name/version marker and the CIG/RSI
   trademark disclaimer intact. If you deploy it unmodified (only
   config.js/data-* attributes and your own players endpoint changed), you
   can deploy as-is; still keep LICENSE/CREDITS.md/the notice.

When done, report: which method (a or b) you used, the URL the map is
reachable at, what you set as the players endpoint, and whether the
mandatory notice is visible on the final page.
````

If you are doing this yourself rather than delegating to an AI, the same 7
steps apply -- this file is simply phrased as an instruction block so it can
be pasted directly into an AI chat. Working, tested examples of both embed
methods (against a deliberately "hostile" guest page with its
own generic CSS) are in [`examples/iframe.html`](../examples/iframe.html) and
[`examples/embed.html`](../examples/embed.html).

---

## Deutsch

### Copier-/Einfügbarer Prompt

````text
Du integrierst "SC LMW" (Star Citizen LiveMap Wiki, v1.1.0), eine
Open-Source-, AGPL-3.0-lizenzierte, statische 3D-Karte für Star Citizen, in
eine bestehende Website. Halte dich genau an diese Schritte. Stelle keine
Rückfragen, außer ein Schritt ist für dieses konkrete Projekt wirklich
mehrdeutig -- triff dann die vernünftigste Wahl und vermerke sie.

1. DATEIEN KOPIEREN
   Kopiere Folgendes in einen neuen Unterordner der Zielseite, z.B.
   `/live-map/`:
     index.html, config.js, players.example.json, js/, css/, vendor/,
     docs/, LICENSE, CREDITS.md, VERSION
   NICHT kopieren: data/, .cache/, .test/ (Build-Ausgabe/nur für die
   Entwicklung, stehen in der .gitignore dieses Projekts). Die relative
   Ordnerstruktur beibehalten -- index.html und js/sc-lmw.js erwarten
   ./js/, ./css/, ./vendor/three/, ./data/ direkt daneben.

2. SPIELDATEN BAUEN
   Braucht Python 3 und Netzzugriff (GitHub, api.uexcorp.space,
   fleetyards.net). Im kopierten `live-map/`-Ordner ausführen:
     python3 scripts/build-all.py
   Das erzeugt data/*.json (einige MB). Nach jedem Star-Citizen-Patch neu
   laufen lassen. data/ und .cache/ nicht ins Versionsverwaltungssystem
   aufnehmen.

3. EINBAU-WEG WAEHLEN
   Es gibt zwei, beide vollstaendig unter einer Wurzelklasse `.sc-lmw`
   gekapselt: sie stylen niemals `body`/`html` oder irgendetwas außerhalb
   ihres eigenen Containers, nutzen ein einziges Globales
   (`window.SCLMW`), und passen ihre Größe per `ResizeObserver` an ihren
   Container an -- sie funktionieren in einer kleinen Box genauso wie auf
   einer ganzen Seite, am Handy wie am Desktop.

   (a) IFRAME -- am einfachsten, wenn die ganze eigenstaendige Seite reicht:
       <iframe src="/live-map/index.html" style="width:100%;height:640px;border:0" allow="fullscreen"></iframe>
       Jede Größe funktioniert, es gibt kein Minimum. Setzt du ein
       `sandbox`-Attribut, braucht es mindestens `allow-scripts
       allow-same-origin`, sonst läuft die Karte nicht.

   (b) DIREKTER EINBAU -- wenn die Karte im DOM der Seite selbst leben muss
       (z.B. wegen Scroll-Verhalten, oder aus einem anderen Grund kein
       iframe gewuenscht ist): ein Container und EIN Script-Tag, sonst
       nichts zu verdrahten.
         <div id="sc-lmw"></div>
         <script src="/live-map/js/sc-lmw.js"
                 data-players-url="/live-map/players.example.json"
                 data-base="/live-map/"></script>
       Dieses Skript findet das `#sc-lmw`-Div selbst (oder was `data-target`
       angibt), laedt holo.js + starmap.js + css/starmap.css von
       `data-base` nach, und mountet die Karte automatisch -- kein
       weiterer JS-Aufruf noetig. Alle `data-*`-Attribute sind optional:
         data-target            CSS-Selektor des Containers (Standard: #sc-lmw)
         data-base               Basispfad fuer data/, vendor/, css/, ... (Standard: der eigene Ordner dieses Skripts)
         data-players-url        siehe Schritt 4 unten (Standard: <base>players.example.json, die erfundenen Demo-Spieler)
         data-players-headers    ein JSON-Objekt als String, z.B. '{"Authorization":"Bearer xyz"}'
         data-poll-ms             wie oft (ms) data-players-url neu abgefragt wird (Standard: 30000)
         data-lang                Oberflaechensprache 'auto'|'de'|'en'|'zh-Hans'|'zh-Hant' (Standard: LANG aus
                                   config.js, sonst 'auto' = Browsersprache). Das ist die
                                   OBERFLAECHE selbst (Knoepfe, Panels, Suche,
                                   Fehlermeldungen) -- getrennt vom kleinen "DE"/"EN"-Knopf in
                                   der Karte, der nur Spieltexte uebersetzt (Missionstypen,
                                   Ausstattungsnamen) und davon unberuehrt bleibt. Die eigene
                                   Wahl des Besuchers (die Oberflaeche hat einen eigenen
                                   Sprach-Umschalter) wird in dessen Browser gemerkt und
                                   schlaegt diese Vorgabe.
         data-theme               'classic'|'compact'|'practical'|'chassis'|'scifi'|'haze'
                                   (Standard: THEME aus config.js, sonst 'haze'). Die
                                   eigene Wahl des Besuchers schlaegt diese Vorgabe.
       Brauchst du programmatische Kontrolle (mounten/entmounten zu einem
       gewaehlten Zeitpunkt, Optionen spaeter aendern), ruf statt des
       Auto-Init-Script-Tags selbst `window.SCLMW.mount(el, opts)` /
       `window.SCLMW.unmount()` auf -- `opts` nimmt dieselben Felder wie
       die `data-*`-Attribute (`base`, `playersUrl`, `playersHeaders`,
       `pollMs`, `lang`), plus `standalone: true`, falls dieser Container die
       ganze Ansicht ausfuellen soll (das macht index.html selbst so).

4. EIGENEN SPIELER-ENDPUNKT BAUEN
   Er muss genau die in docs/PLAYERS_API.md dokumentierte JSON-Form
   liefern:
     {"players":[{id,name,online,last_seen,code,location,system,ship,travel}, ...]}
   Minimalbeispiele unten -- die Datenquelle anpassen (aus eigener
   Datenbank/Bot/Log-Watcher lesen); diese Schnipsel zeigen nur die
   verlangte HTTP-Form.

   Node.js / Express:
     app.get('/api/players', (req, res) => {
       res.set('Access-Control-Allow-Origin', 'https://deine-karten-domain.example'); // nur bei fremder Herkunft
       res.json({ players: [ /* eigene echte Daten in die obige Form bringen */ ] });
     });

   Python / Flask:
     from flask import Flask, jsonify
     app = Flask(__name__)

     @app.get("/api/players")
     def players():
         resp = jsonify({"players": []})  # eigene echte Daten in die obige Form bringen
         resp.headers["Access-Control-Allow-Origin"] = "https://deine-karten-domain.example"  # bei fremder Herkunft
         return resp

   PHP:
     <?php
     header('Content-Type: application/json');
     header('Access-Control-Allow-Origin: https://deine-karten-domain.example'); // bei fremder Herkunft
     echo json_encode(['players' => [ /* eigene echte Daten */ ]]);

   Niemals Discord-IDs, echte Namen oder andere personenbezogene Daten in
   id/name eintragen, ohne dass deine Community dem ausdrücklich zugestimmt
   hat (siehe docs/PLAYERS_API.md, Abschnitt "Datenschutz").

5. CORS
   api.uexcorp.space und fleetyards.net sind öffentliche, CORS-offene
   APIs, die der Browser direkt aufruft; dafür ist kein Proxy nötig.
   Dein eigener Spieler-Endpunkt (Schritt 4) braucht nur dann CORS-Header,
   wenn er von einer anderen Herkunft (Schema+Host+Port) ausgeliefert wird
   als die Seite, die die Karte lädt. Gleiche Herkunft: keine CORS-Header
   nötig. Beim iframe (Weg a) heißt "gleiche Herkunft": die Herkunft der
   Seite, auf der index.html liegt -- das iframe selbst ruft den Endpunkt
   auf, nicht die äußere Seite.

6. PFLICHT-HINWEIS SICHTBAR LASSEN
   Den Fan-Projekt-/Marken-Hinweis am unteren Seitenrand (eine ID, die auf
   "fanNotice" endet, in index.html; der direkte Einbau fügt keinen
   eigenen Seiten-Hinweis hinzu, bei Weg (b) also denselben Hinweis
   irgendwo in der Naehe der Karte auf der eigenen Seite behalten) nicht
   entfernen, verstecken oder optisch überdecken, und den Link "Credits &
   licenses" nicht entfernen. Das ist eine Bedingung für die Nutzung
   dieses Projekts, keine Geschmacksfrage.

7. AGPL-3.0-PFLICHTEN
   Dieses Projekt steht unter AGPL-3.0 (siehe LICENSE). Änderst du den Code
   (HTML/CSS/JS/Bau-Skripte dieser Karte) und lässt jemand anderen als dich
   selbst die geänderte Version über ein Netz nutzen -- auch eine interne
   Seite, die nur Mitglieder der eigenen Organisation erreichen können --
   musst du ihnen den vollständigen zugehörigen Quellcode deiner geänderten
   Version anbieten, unter derselben Lizenz. LICENSE und CREDITS.md in der
   ausgelieferten Kopie behalten. Den Namen/die Versionsmarkierung "SC LMW"
   und den CIG/RSI-Markenhinweis unverändert lassen. Lieferst du sie
   unverändert aus (nur config.js/data-*-Attribute und dein eigener
   Spieler-Endpunkt angepasst), kannst du sie so ausliefern;
   LICENSE/CREDITS.md/den Hinweis trotzdem behalten.

Melde am Ende: welchen Weg (a oder b) du genommen hast, unter welcher URL
die Karte erreichbar ist, was du als Spieler-Endpunkt gesetzt hast, und ob
der Pflicht-Hinweis auf der fertigen Seite sichtbar ist.
````

Machst du das selbst statt über eine KI, gelten dieselben 7 Schritte --
diese Datei ist nur so formuliert, dass sie sich direkt in einen KI-Chat
einfügen lässt. Funktionierende, getestete Beispiele beider Einbau-Wege
(gegen eine absichtlich "feindliche" Gastseite mit eigenem, generischem
CSS) liegen in [`examples/iframe.html`](../examples/iframe.html) und
[`examples/embed.html`](../examples/embed.html).
