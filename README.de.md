# SC LMW – Star Citizen LiveMap Wiki

**Version 1.1.0** · AGPL-3.0 · Starfix 1.0.9

[English](README.md) · **Deutsch** · [简体中文](README.zh-Hans.md) · [繁體中文](README.zh-Hant.md)

Eine freie, quelloffene 3D-Karte von Star Citizen: Stanton, Pyro und Nyx, mit Suche, Live-Preisen, Schiffsmodellen, Teamräumen und einem optionalen Log-Leser, der nur auf dem eigenen Rechner läuft.

> **Inoffizielles Fan-Projekt.** Nicht unterstützt, gesponsert oder verbunden mit Cloud Imperium Games oder Roberts Space Industries. Star Citizen®, Squadron 42®, Roberts Space Industries® und Cloud Imperium® sind eingetragene Marken von Cloud Imperium Rights LLC und Cloud Imperium Rights Ltd. Der Hinweis steht auf der Startseite und in der Fußzeile. Beim Einbetten sichtbar lassen.

## Websites dieser Ausgabe

| | Adresse | Bedeutung |
|---|---|---|
| Öffentlicher Name | https://sclmw.cltbbs.com/ | Die Adresse für Besucher. Die Adresszeile bleibt auf diesem Namen. |
| Ursprung | https://gugugubear.pythonanywhere.com/ | Die App auf PythonAnywhere. Dieselben Seiten, direkt erreichbar. Auch das Ziel der Bereitstellung. |

`sclmw.cltbbs.com` ist ein Reverse-Proxy, kein Redirect und kein CNAME auf den Ursprung. Cloudflare-Zone `cltbbs.com`, Worker `sclmw-proxy`, Custom Hostname `sclmw.cltbbs.com`. Der Worker holt `https://gugugubear.pythonanywhere.com` mit dem `Host`-Header dieses Ursprungs und schreibt ein `Location` um, das den Ursprung zeigen würde. Das Worker-Skript liegt nicht in diesem Repository. Den Ursprung ändert man in der Konstante `ORIGIN` des Workers und lädt das Skript neu hoch.

Beide Adressen liefern eine Anwendung. Raumaufrufe und Kartendateien sind relativ, deshalb bleibt eine geöffnete Seite auf ihrem Namen. Starfix 1.0.9 nimmt eine Verbindung von beiden Namen an. Siehe [companion/README.md](companion/README.md).

Cloudflare kann eine statische Datei mehrere Stunden behalten. Eine Prüfung am 30. Okt. 2026 zeigte `js/starmap.js` auf dem öffentlichen Namen mit `cache-control: max-age=14400` und `cf-cache-status: HIT`, während der Ursprung die neuere Datei schon hatte. Nach einer Bereitstellung ist der Ursprung fertig, sobald die Action durch ist. Der öffentliche Name kann hinterherhinken, bis dieser Cache abläuft. Raum-API-Antworten aus [server/room_server.py](server/room_server.py) senden `Cache-Control: no-store`. Die Seite selbst ist kein privates Dokument. Der Anmeldestand ist ein Bearer-Token in `localStorage`, kein Cookie.

## Was man wissen sollte

- Die Website liest nie den Spielordner. Nur Starfix, auf dem Rechner, auf dem man es startet, öffnet die eine Logdatei, die man auswählt.
- `data/` wird auf einem Rechner gebaut und liegt nicht in Git. Ein Push lädt es nicht hoch und ersetzt die Kopie auf dem Server nicht. Der Bau steht unten.
- Nicht committen: `companion/config.json`, `server/*.sqlite`, `data/loc.json`, `.env`, ein PythonAnywhere-Token. Das Geheimnis der Bereitstellung heißt `PA_API_TOKEN` in den GitHub-Actions-Secrets.
- Ein viertes Sternsystem erscheint nicht von allein. [scripts/systems-build.py](scripts/systems-build.py) nennt Stanton, Pyro und Nyx. Die Knöpfe der Seite folgen dieser Liste.
- Chinesische Ortsnamen kommen aus einem lokalen Language-Ordner des Spiels über `python scripts/loc-build.py`. Dieser Schritt gehört nicht zu `scripts/build-all.py`. Die erzeugte `data/loc.json` bleibt außerhalb von Git.
- Laden- und Einrichtungsnamen auf der Karte nutzen die Texte des Spiels, wo es sie gibt. Namen ohne offiziellen Ladentitel bleiben Englisch.
- Text der Oberfläche ist mindestens 12px. Das Fenster von Starfix bleibt bei 9pt. Siehe [css/starmap.css](css/starmap.css) und [companion/desk.py](companion/desk.py).

## Die Karte benutzen

Den öffentlichen Namen oder den Ursprung öffnen. Die Startseite ist der Teamraum: Raum anlegen, mit einem Code beitreten oder einen öffentlichen Raum betreten. Ein Browser ist immer nur in einem Raum. Der Captain stellt öffentlich oder privat, nimmt Leute an, entfernt ein Mitglied und kann eine Durchsage senden. Öffentliche Räume stehen auf der Startseite.

Auf der Karte sitzt die Suche in der oberen Leiste. Der Zoom-Regler liegt in derselben Leiste, rechts neben der Suche, und hat ihre Höhe. Die Kategorien stehen daneben. Rechtsklick auf einen Ort für „Ich bin hier“ und, wenn der Raum es erlaubt, für eine Route.

**Andere Systeme weichzeichnen** ist standardmäßig an. Wer ein System nah betrachtet, sieht die anderen weich, und sie lassen sich nicht anklicken. Zieht man so weit heraus, dass alle drei Systeme im Bild sind, werden sie wieder scharf. Der Schalter liegt unter Einstellungen, bei Sonstiges: `ctrl.blurBg` in [js/i18n.js](js/i18n.js), gespeichert mit den übrigen Schaltern unter dem `localStorage`-Schlüssel `sclmw_controls`.

Ein Name in der Teamliste oder in der Spielerliste öffnet die Karte dieser Person und die gestrichelte Linie. Die Karte zeigt die Logfelder und, wenn der Ort auf der Karte liegt, den Abstand zum Stern, Einrichtungen und Terminals. Die Teamliste zeigt den Server jeder Person, damit der Captain sieht, wer denselben teilt.

Themen: Klassisch, Kompakt, Praktisch, Gehäuse, Science-Fiction und Dunst (Haze). Haze ist die Vorgabe. Die eigene Wahl bleibt im Browser. Haze ist die cyanfarbene Instrumentenansicht (`data-theme="haze"`).

Die Hinweise zur Oberfläche 1.1.0 stehen in [docs/WHATS_NEW.md](docs/WHATS_NEW.md). Das ist nicht die Liste jeder späteren Änderung. Die Starfix-Version neben diesen Hinweisen ist nicht mehr die aktuelle. Es gilt `companion/VERSION`.

## Starfix

Optional. Die Karte geht auch ohne: Rechtsklick und „Ich bin hier“.

Starfix liest `Game.log` auf diesem Rechner und sendet nach der Bestätigung den Ortscode an den Raum. Es hängt sich nicht an das Spiel, liest keinen Speicher und lädt das Log nicht hoch. Vor dem Start der Quellen [companion/README.md](companion/README.md) lesen.

Veröffentlichter Bau: [Starfix 1.0.9](https://github.com/GuguguBear/sc-lmw/releases/tag/starfix-1.0.9). Das Programm vergleicht `companion/VERSION` mit GitHub-Releases namens `starfix-X.Y.Z`. Ein Push von `companion/**` oder [.github/workflows/starfix-release.yml](.github/workflows/starfix-release.yml) auf `master` baut die exe, wenn es das Tag noch nicht gibt. [companion/write_version_info.py](companion/write_version_info.py) schreibt die Windows-Versionsangabe aus derselben Zahl.

Beim Update zeigt ein Fenster im bereits gewählten Thema, wie Kisten in einen Container geladen werden. Danach kopiert ein Helfer die neue Datei über die gestartete. `Move-Item -Force` in Windows PowerShell ersetzt eine vorhandene exe nicht, deshalb nutzt der Helfer `System.IO.File.Copy`. Heißt die gestartete Datei `Starfix 1.0.6.exe`, wird die neue `Starfix 1.0.8.exe`, und der alte Name verschwindet. Eine Datei, die nur `Starfix.exe` heißt, behält diesen Namen.

Ein älterer Bau kann `Starfix.update.exe` laden und das alte Programm trotzdem liegen lassen. Starfix schließen und `Starfix.update.exe` daneben doppelklicken. Diese Datei kopiert sich an die Stelle und startet die neue. Ab 1.0.8 laufen das Fortschrittsfenster und das Kopieren aus dem Update, das man bestätigt.

Starfix lässt diese Seiten-Ursprünge zu, dazu `http://127.0.0.1` und `http://localhost`:

- `https://gugugubear.pythonanywhere.com`
- `https://sclmw.cltbbs.com`

Ein neues Fenster trägt `https://sclmw.cltbbs.com` ein. Steht in der gespeicherten Konfiguration noch die frühere Vorgabe `https://gugugubear.pythonanywhere.com`, setzt der nächste Start dieser Version sie um. Eine Verbindung von einer Seite speichert die Adresse dieser Seite.

Eine Verbindung von einer Seite speichert den Ursprung dieser Seite als API-Basis. Eine ältere Installation behält die PythonAnywhere-Adresse, bis man erneut verbindet. Beide Adressen gehen, sobald der Proxy davor steht.

## Diese Ausgabe bereitstellen

Ein Push auf `master` startet [.github/workflows/deploy.yml](.github/workflows/deploy.yml). Der Job holt das Repo und führt [scripts/deploy_pythonanywhere.py](scripts/deploy_pythonanywhere.py) aus.

Das Skript:

1. Liest `PA_API_TOKEN` aus der Umgebung. Auf GitHub ist das das Actions-Secret desselben Namens. Den Token legt man auf der PythonAnywhere-Kontoseite an.
2. Listet Dateien mit `git ls-files`. Nicht verfolgte und von Git ignorierte Dateien werden nicht hochgeladen.
3. Lädt diese Dateien nach `/home/GuguguBear/sc-lmw` auf `www.pythonanywhere.com` für den Benutzer `GuguguBear`.
4. Lädt die Web-App `gugugubear.pythonanywhere.com` neu.

Es löscht keine zusätzlichen Dateien auf dem Server und ersetzt weder `data/` noch die Raumdatenbank, die dort schon liegen. Nach einem Neubau der Daten kopiert man das neue JSON selbst auf den Server.

Den öffentlichen Namen trägt dieses Skript nicht ein. DNS und der Worker bleiben bei Cloudflare. Eine Seitenänderung ausliefern heißt: committen, `master` pushen, warten bis die Action „Update the live site“ fertig ist, und daran denken, dass der öffentliche Name JS und CSS noch ein paar Stunden aus dem Cache liefern kann.

Pull Requests sind der normale Weg auf GitHub. Ein Admin-Push auf `master` kann diese Regel umgehen. Die Umgehungsmeldung ist bei einem solchen Push erwartet.

## Eine eigene Kopie starten

Python 3. Kein Node-Bau für die Seite.

```sh
git clone https://github.com/GuguguBear/sc-lmw.git
cd sc-lmw
python scripts/build-all.py
python -m http.server 8000
```

http://localhost:8000/ öffnen. Die Karte zeigt Beispielpiloten, bis man sie an einen Raum oder eine Spieler-URL hängt. `build-all.py` nach einer Aktualisierung des Community-Exports erneut ausführen.

| Flag | Wirkung |
|---|---|
| `--with-de` | Deutsche Spieltexte. Siehe [scripts/README_DE_INI.md](scripts/README_DE_INI.md). |
| `--with-loot` | Fundorte aus dem Export des Friendly Fire Department. Liegt nicht in Git. |

Preise und Schiffsmodelle kommen live von UEX und FleetYards. Sie stecken nicht im Bau.

## Auf eine andere Website setzen

**iframe**

```html
<iframe src="https://sclmw.cltbbs.com/"
        style="width:100%;height:640px;border:0" allow="fullscreen"></iframe>
```

**Ein Script-Tag.** Die Karte bleibt im Element. Sie gestaltet `body` nicht.

```html
<div id="sc-lmw" style="height:640px"></div>
<script src="https://your-site.example/sc-lmw/js/sc-lmw.js"
        data-base="https://your-site.example/sc-lmw/"
        data-players-url="https://your-site.example/api/players"></script>
```

Beispiele: [examples/iframe.html](examples/iframe.html), [examples/embed.html](examples/embed.html). Eine Vorlage für einen Assistenten steht in [docs/AI_INTEGRATION.md](docs/AI_INTEGRATION.md). Das JSON der Piloten steht in [docs/PLAYERS_API.md](docs/PLAYERS_API.md). Die Teamräume dieser Ausgabe sind der Dienst in [server/room_server.py](server/room_server.py). `PLAYERS_URL` in [config.js](config.js) ist der andere Weg: eine eigene Pilotenliste.

### Oberflächensprache (Deutsch/Englisch)

`LANG` in `config.js` (`auto`, `de`, `en`, `zh-Hans`, `zh-Hant`), oder `data-lang` am Script, oder `SCLMW.mount(el, { lang: 'zh-Hans' })`. Der erste Besuch folgt dem Browser. Ein Knopf schaltet sofort, die Wahl bleibt. Dieselbe Einstellung gilt auch für Vereinfachtes und Traditionelles Chinesisch.

Thema: `THEME` in `config.js` (`compact`, `classic`, `practical`, `chassis`, `scifi`, `haze`), oder `data-theme`, oder `mount(el, { theme })`. Die Wahl des Besuchers gewinnt.

## Woher die Daten kommen

| Was | Quelle | Wie |
|---|---|---|
| Orte, Erze, Gegenstände, Blaupausen, Missionen | Community-Export `scunpacked-data` | `scripts/build-all.py`. Nicht committed. |
| Chinesische Namen | Lokale Language-Dateien des Spiels | `scripts/loc-build.py`. Nicht committed. |
| Handelspreise | [UEX](https://uexcorp.space) | Live im Browser. |
| Schiffswerte und Modelle | [FleetYards](https://fleetyards.net) | Live im Browser. In der App genannt. |
| 3D-Engine | [three.js](https://threejs.org) r128 (MIT) | `vendor/three/` |
| Team auf dieser Website | Raumdienst | [server/room_server.py](server/room_server.py) |
| Eigene Piloten | `PLAYERS_URL` | Optional. [docs/PLAYERS_API.md](docs/PLAYERS_API.md) |

Spieldateien werden hier nicht weitergegeben. Namensnennung: [CREDITS.md](CREDITS.md).

Anleitungen und Timer: [starcitizen.tools](https://starcitizen.tools), [exec.xyxyll.com](https://exec.xyxyll.com) über `scripts/exec-build.py`, [exectimer.com](https://exectimer.com). Beute nur mit `--with-loot`.

## Aufbau

```
index.html                 Seite dieser Website
config.js                  PLAYERS_URL, Sprache, Thema, Abfrageintervall
manifest.webmanifest       installierbare App
sw.js                      Offline-Hülle; /api/ bleibt im Netz
js/starmap.js              Karte, Suche, Weichzeichnung, Pilotenkarte
js/room.js                 Startseite, Räume, Team, Durchsage
js/i18n.js                 de / en / zh-Hans / zh-Hant
js/history.js              eigene Log-Wiedergabe, auf diesem Rechner
css/starmap.css            alles unter .sc-lmw
server/room_server.py      Raum-API der Live-Website
companion/                 Starfix. Siehe companion/README.md
scripts/deploy_pythonanywhere.py
.github/workflows/deploy.yml
.github/workflows/starfix-release.yml
docs/PLAYERS_API.md
docs/AI_INTEGRATION.md
docs/WHATS_NEW.md          Hinweise zur Website 1.1.0
```

## Bilder

| Der Raum ist nach dem Neuladen noch da | Der Teamraum auf der Stanton-Karte |
|---|---|
| ![Teamraum: der gemerkte Raum kann betreten werden](docs/img/01-room-gate.png) | ![Stanton mit dem Teamraum](docs/img/02-stanton-room.png) |

| Starfix auf diesem Rechner verbinden | Hinunter zu einem Planeten |
|---|---|
| ![Raumfenster neben dem Starfix-Fenster](docs/img/03-starfix.png) | ![Ein Planet, mit Orten und dem Raumfenster](docs/img/04-planet.png) |

| Ein Ort in Stanton | Pyro |
|---|---|
| ![Stanton mit Ortsfenster und Teamraum](docs/img/05-stanton-place.png) | ![Pyro mit Ortsfenster und Teamraum](docs/img/06-pyro.png) |

## Lizenz

**AGPL-3.0.** Siehe [LICENSE](LICENSE). Wer eine veränderte Fassung als Netzdienst betreibt, muss den Nutzern diesen veränderten Quelltext anbieten. Fremder Code und fremde Daten behalten ihre eigenen Lizenzen. Siehe [CREDITS.md](CREDITS.md).
