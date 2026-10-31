# SC LMW – Star Citizen LiveMap Wiki

**Version 1.1.0** · AGPL-3.0 · Starfix 1.0.9

**English** · [Deutsch](README.de.md) · [简体中文](README.zh-Hans.md) · [繁體中文](README.zh-Hant.md)

A free, open-source 3D map of Star Citizen: Stanton, Pyro and Nyx, with search, live trade prices, ship models, team rooms, and an optional log reader that runs only on your computer.

> **Unofficial fan project.** Not endorsed by, sponsored by, or affiliated with Cloud Imperium Games or Roberts Space Industries. Star Citizen®, Squadron 42®, Roberts Space Industries®, and Cloud Imperium® are registered trademarks of Cloud Imperium Rights LLC and Cloud Imperium Rights Ltd. The site shows this notice on the home page and in the footer. Keep it visible if you embed the map.

## Websites for this copy

| | Address | What it is |
|---|---|---|
| Public name | https://sclmw.cltbbs.com/ | The address visitors should use. The browser stays on this name. |
| Origin | https://gugugubear.pythonanywhere.com/ | The PythonAnywhere app. Same pages, reached directly. Also the deploy target. |

`sclmw.cltbbs.com` is a reverse proxy, not a redirect and not a CNAME to the origin. Cloudflare zone `cltbbs.com`, Worker `sclmw-proxy`, custom hostname `sclmw.cltbbs.com`. The Worker fetches `https://gugugubear.pythonanywhere.com` with that host's `Host` header, and rewrites a `Location` that would reveal the origin. This repository does not contain the Worker script. Change the origin by editing the Worker's `ORIGIN` constant and uploading the script again.

Both addresses serve one application. Room calls and map files use relative paths, so a page opened on either name stays there. Starfix 1.0.9 accepts a pairing from either name. See [companion/README.md](companion/README.md).

Cloudflare can keep a static file for several hours. A check on 30 Oct 2026 showed `js/starmap.js` on the public name with `cache-control: max-age=14400` and `cf-cache-status: HIT`, while the origin already had the newer file. After a deploy, the origin updates when the Action finishes. The public name can lag until that cache expires. Room API responses from [server/room_server.py](server/room_server.py) send `Cache-Control: no-store`. The page shell is not a private document. Login state is a bearer token in `localStorage`, not a cookie.

## What to know before you change anything

- The website never reads the game folder. Only Starfix, on the computer where you start it, opens the one log file you choose.
- `data/` is built on a machine and is not in git. A push does not upload it and does not replace the copy already on the server. Rebuild steps are below.
- Do not commit `companion/config.json`, `server/*.sqlite`, `data/loc.json`, `.env`, or a PythonAnywhere token. The deploy secret is `PA_API_TOKEN` in the GitHub Actions secrets.
- A fourth star system does not appear by itself. [scripts/systems-build.py](scripts/systems-build.py) lists Stanton, Pyro and Nyx. The page buttons match that list.
- Chinese place names come from a local game Language folder through `python scripts/loc-build.py`. That step is not part of `scripts/build-all.py`. The generated `data/loc.json` stays off git.
- Shop and facility labels on the map use the game's own strings where those strings exist. Names without an official shop title stay in English.
- Interface text is at least 12px. Starfix's own window stays at 9pt. See [css/starmap.css](css/starmap.css) and [companion/desk.py](companion/desk.py).

## Using the map

Open the public name or the origin. The home page is the team room: create a room, join with a code, or enter a public room. One browser is in one room at a time. The captain sets public or private, approves people, removes a member, and can broadcast. Public rooms are listed on the home page.

On the map, search sits in the top bar. The zoom slider is on that same bar, to the right of the search box, and uses the bar's height. Category buttons are beside it. Right-click a place for "I am here" and for drawing a route when the room allows it.

**Blur other systems** is on by default. While you look at one system up close, the others go soft and cannot be clicked. Pull back until all three systems are in view and they sharpen again. The switch is under Settings, in Other: `ctrl.blurBg` in [js/i18n.js](js/i18n.js), stored with the other controls in `localStorage` key `sclmw_controls`.

Click a name in the crew list or the player list to open that pilot's card and the dashed line. The card shows the log fields plus, when the place is on the map, distance from the star, amenities and terminals. The crew list shows each person's server so the captain can see who shares one.

Themes: Classic, Compact, Practical, Chassis, Sci-fi, and Haze. Haze is the default. The visitor's own choice is kept in the browser. Haze is the cyan instrument look (`data-theme="haze"`).

The 1.1.0 interface notes are in [docs/WHATS_NEW.md](docs/WHATS_NEW.md). They are not a list of every later change. The Starfix version those notes were written beside is no longer current. Use `companion/VERSION`.

## Starfix

Optional. The map works without it: right-click and choose "I am here".

Starfix reads `Game.log` on that computer and, after you confirm, posts the place code to the room. It does not attach to the game, read memory, or upload the log. Read [companion/README.md](companion/README.md) before you run the source.

Published build: [Starfix 1.0.9](https://github.com/GuguguBear/sc-lmw/releases/tag/starfix-1.0.9). The program compares `companion/VERSION` with GitHub Releases named `starfix-X.Y.Z`. Pushing `companion/**` or [.github/workflows/starfix-release.yml](.github/workflows/starfix-release.yml) to `master` builds the exe when that tag does not exist yet. [companion/write_version_info.py](companion/write_version_info.py) writes the Windows version resource from the same number.

On update, a window in the theme you already chose shows crates loading into a container. When the download finishes, a helper copies the new file over the one you started. `Move-Item -Force` in Windows PowerShell does not replace an existing exe, so the helper uses `System.IO.File.Copy`. If the file you launched is named like `Starfix 1.0.6.exe`, the new file is `Starfix 1.0.8.exe` and the old name is removed. A file that is just `Starfix.exe` keeps that name.

A build from before this copy step can download `Starfix.update.exe` and still leave the old program in place. Close Starfix, then double-click `Starfix.update.exe` beside it. That file copies itself into place and starts the new one. From 1.0.8 on, the progress window and the copy run from the update you confirm.

Starfix allows these page origins, plus `http://127.0.0.1` and `http://localhost`:

- `https://gugugubear.pythonanywhere.com`
- `https://sclmw.cltbbs.com`

A new window fills in `https://sclmw.cltbbs.com`. If the saved address is still the previous built-in `https://gugugubear.pythonanywhere.com`, the next start of this version replaces it. Pairing from a page stores that page's own address.

Pairing from a page stores that page's origin as the API base. An older install keeps the PythonAnywhere address until you pair again. Both addresses work once the proxy is in front.

## Deploy this copy

A push to `master` starts [.github/workflows/deploy.yml](.github/workflows/deploy.yml). The job checks out the repo and runs [scripts/deploy_pythonanywhere.py](scripts/deploy_pythonanywhere.py).

That script:

1. Reads `PA_API_TOKEN` from the environment. On GitHub that is the Actions secret of the same name. Create the token on the PythonAnywhere account page.
2. Lists files with `git ls-files`. Untracked and gitignored files are not uploaded.
3. Uploads those files to `/home/GuguguBear/sc-lmw` on `www.pythonanywhere.com` for user `GuguguBear`.
4. Reloads the web app `gugugubear.pythonanywhere.com`.

It does not delete extra files on the server, and it does not replace `data/` or the room database that already live there. After a data rebuild, copy the new JSON onto the server yourself.

The public name is not registered by this script. DNS and the Worker stay in Cloudflare. Shipping a webpage update is: commit, push `master`, wait until the Action "Update the live site" succeeds, then remember the public name may still serve cached JS and CSS for a few hours.

Pull requests are the normal path on GitHub. An admin push to `master` can bypass that ruleset. The bypass message is expected for that kind of push.

## Run a copy yourself

Python 3. No Node build for the site.

```sh
git clone https://github.com/GuguguBear/sc-lmw.git
cd sc-lmw
python scripts/build-all.py
python -m http.server 8000
```

Open http://localhost:8000/ . The map ships with demo pilots until you point it at a room or a players URL. Run `build-all.py` again after the community game-data export updates.

| Flag | Effect |
|---|---|
| `--with-de` | German in-game strings. See [scripts/README_DE_INI.md](scripts/README_DE_INI.md). |
| `--with-loot` | Loot locations from the Friendly Fire Department export. Not stored in git. |

Prices and ship models are loaded live from UEX and FleetYards. They are not in the build.

## Put it on another site

**iframe**

```html
<iframe src="https://sclmw.cltbbs.com/"
        style="width:100%;height:640px;border:0" allow="fullscreen"></iframe>
```

**One script tag.** The map stays inside the element. It does not style your `body`.

```html
<div id="sc-lmw" style="height:640px"></div>
<script src="https://your-site.example/sc-lmw/js/sc-lmw.js"
        data-base="https://your-site.example/sc-lmw/"
        data-players-url="https://your-site.example/api/players"></script>
```

Examples: [examples/iframe.html](examples/iframe.html), [examples/embed.html](examples/embed.html). A prompt for an assistant is in [docs/AI_INTEGRATION.md](docs/AI_INTEGRATION.md). The pilot JSON contract is [docs/PLAYERS_API.md](docs/PLAYERS_API.md). This deployment's team rooms are the service in [server/room_server.py](server/room_server.py), started beside the site. `PLAYERS_URL` in [config.js](config.js) is the other way: your own list of pilots.

### Interface language (German/English)

`LANG` in `config.js` (`auto`, `de`, `en`, `zh-Hans`, `zh-Hant`), or `data-lang` on the script, or `SCLMW.mount(el, { lang: 'zh-Hans' })`. The first visit follows the browser. A button switches live and the choice stays. The same setting covers Simplified Chinese and Traditional Chinese.

Theme: `THEME` in `config.js` (`compact`, `classic`, `practical`, `chassis`, `scifi`, `haze`), or `data-theme`, or `mount(el, { theme })`. A visitor's choice wins.

## Where the data comes from

| What | Source | How |
|---|---|---|
| Places, ores, items, blueprints, missions | Community `scunpacked-data` export | `scripts/build-all.py`. Not committed. |
| Chinese names | Local game Language files | `scripts/loc-build.py`. Not committed. |
| Trade prices | [UEX](https://uexcorp.space) | Live in the browser. |
| Ship specs and models | [FleetYards](https://fleetyards.net) | Live in the browser. Credited in the app. |
| 3D engine | [three.js](https://threejs.org) r128 (MIT) | `vendor/three/` |
| Team on this site | Room service | [server/room_server.py](server/room_server.py) |
| Your own pilots | `PLAYERS_URL` | Optional. [docs/PLAYERS_API.md](docs/PLAYERS_API.md) |

Game files are not redistributed. Attribution: [CREDITS.md](CREDITS.md).

Guides and timers: [starcitizen.tools](https://starcitizen.tools), [exec.xyxyll.com](https://exec.xyxyll.com) via `scripts/exec-build.py`, [exectimer.com](https://exectimer.com). Loot only with `--with-loot`.

## Layout

```
index.html                 this site's page
config.js                  PLAYERS_URL, language, theme, poll interval
manifest.webmanifest       installable app
sw.js                      offline shell; /api/ stays on the network
js/starmap.js              map, search, blur, pilot card
js/room.js                 home page, rooms, crew, broadcast
js/i18n.js                 de / en / zh-Hans / zh-Hant
js/history.js              personal log playback, on this computer
css/starmap.css            everything under .sc-lmw
server/room_server.py      room API used by the live site
companion/                 Starfix. See companion/README.md
scripts/deploy_pythonanywhere.py
.github/workflows/deploy.yml
.github/workflows/starfix-release.yml
docs/PLAYERS_API.md
docs/AI_INTEGRATION.md
docs/WHATS_NEW.md          notes for site 1.1.0
```

## Screens

| The room is still there after a refresh | The team room on the Stanton map |
|---|---|
| ![Team room gate: the saved room is ready to enter](docs/img/01-room-gate.png) | ![Stanton with the team room window](docs/img/02-stanton-room.png) |

| Connect Starfix on this computer | Down to a planet |
|---|---|
| ![The room panel next to the Starfix window](docs/img/03-starfix.png) | ![A planet, with the place list and the room window](docs/img/04-planet.png) |

| A place open in Stanton | Pyro |
|---|---|
| ![Stanton with a place panel and the team room](docs/img/05-stanton-place.png) | ![Pyro with a place panel and the team room](docs/img/06-pyro.png) |

## License

**AGPL-3.0.** See [LICENSE](LICENSE). If you run a modified version as a network service, you must offer that modified source to its users. Third-party code and data keep their own licenses. See [CREDITS.md](CREDITS.md).
