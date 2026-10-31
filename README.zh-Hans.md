# SC LMW – 星际公民星图

**版本 1.1.0** · AGPL-3.0 · Starfix 1.0.9

[English](README.md) · [Deutsch](README.de.md) · **简体中文** · [繁體中文](README.zh-Hant.md)

一套免费、开源的星际公民三维星图：斯坦顿、派罗、尼克斯。可以搜索，看实时物价和舰船模型，开团队房间。另有一个可选的日志读取程序，只在你自己的电脑上运行。

> **非官方粉丝项目。** 未获 Cloud Imperium Games 或 Roberts Space Industries 认可、赞助或关联。Star Citizen®、Squadron 42®、Roberts Space Industries®、Cloud Imperium® 是 Cloud Imperium Rights LLC 与 Cloud Imperium Rights Ltd. 的注册商标。首页和页脚都有这段说明。嵌到别的网站时，请让它保持可见。

## 这一份网站的地址

| | 地址 | 是什么 |
|---|---|---|
| 对外名称 | https://sclmw.cltbbs.com/ | 给访客用的地址。浏览器地址栏保持这个名字。 |
| 源站 | https://gugugubear.pythonanywhere.com/ | PythonAnywhere 上的应用。同一套页面，也可以直接打开。部署也发到这里。 |

`sclmw.cltbbs.com` 是反向代理，不是跳转，也不是把 CNAME 指到源站。Cloudflare 区域 `cltbbs.com`，Worker 名 `sclmw-proxy`，自定义主机名 `sclmw.cltbbs.com`。Worker 去取 `https://gugugubear.pythonanywhere.com`，请求头 `Host` 用源站的主机名；如果上游的 `Location` 会露出源站，就改回当前主机名。Worker 脚本不在这个仓库里。要换源站，改 Worker 里的 `ORIGIN` 常量，再把脚本上传一次。

两个地址是同一套应用。房间请求和地图文件都用相对路径，所以从哪个名字打开，就留在哪个名字上。Starfix 1.0.9 接受从这两个名字发起的连接。见 [companion/README.md](companion/README.md)。

Cloudflare 可能把静态文件留几个小时。2026 年 10 月 30 日查过：对外名称上的 `js/starmap.js` 是 `cache-control: max-age=14400`、`cf-cache-status: HIT`，源站当时已经是更新的文件。部署完成后，源站在 Action 成功时就换好了。对外名称要等这份缓存过期。房间接口来自 [server/room_server.py](server/room_server.py)，响应带 `Cache-Control: no-store`。页面本身不是私人文档。登录态是 `localStorage` 里的 Bearer 令牌，不是 Cookie。

## 改之前要知道的

- 网站不读游戏目录。只有你在自己电脑上启动的 Starfix，才会打开你选定的那一个日志文件。
- `data/` 在一台机器上生成，不进 git。推送不会上传它，也不会换掉服务器上已经放着的那一份。生成步骤写在下面。
- 不要提交 `companion/config.json`、`server/*.sqlite`、`data/loc.json`、`.env`，也不要提交 PythonAnywhere 令牌。部署用的密钥是 GitHub Actions 机密 `PA_API_TOKEN`。
- 第四个星系不会自己出现。[scripts/systems-build.py](scripts/systems-build.py) 里写的是斯坦顿、派罗、尼克斯。页面上的按钮跟这份名单一致。
- 中文地名来自本机的游戏 Language 目录，用 `python scripts/loc-build.py` 生成。这一步不在 `scripts/build-all.py` 里。生成的 `data/loc.json` 不进 git。
- 地图上的商店和设施，有官方文本就用官方文本。没有正式店名的，保持英文。
- 界面文字至少 12px。Starfix 自己的窗口保持 9pt。见 [css/starmap.css](css/starmap.css) 和 [companion/desk.py](companion/desk.py)。

## 使用星图

打开对外名称或源站。首页是团队房间：建房间、用房间码加入，或进入公开房间。一个浏览器同时只在一个房间里。队长可以改公开或私人、通过申请、移出成员、发广播。公开房间列在首页。

星图上，搜索在顶栏。缩放条在同一条顶栏里，紧挨搜索框右边，高度跟顶栏一致。分类按钮在旁边。在地点上右键，可以选「我在这里」；房间允许时，也可以从这里画路线。

**模糊其他星系** 默认开着。靠近看某一个星系时，另外的星系变模糊，也不能点。拉远到三个星系一起入画时，它们重新变清晰。开关在操作设置的「其他」：文案键是 [js/i18n.js](js/i18n.js) 里的 `ctrl.blurBg`，和别的操作开关一起存在 `localStorage` 的 `sclmw_controls`。

点队员列表或玩家列表里的名字，会打开这个人的卡片和虚线。卡片有日志里的字段；这个地点在地图上时，还会有距恒星的距离、设施和终端。队员列表显示每个人的服务器，方便队长看是不是同一台。

主题：经典、紧凑、实用、机壳、科幻、气雾。默认是气雾。访客自己的选择留在浏览器里。气雾是青色仪表盘那种样子（`data-theme="haze"`）。

1.1.0 的界面说明在 [docs/WHATS_NEW.md](docs/WHATS_NEW.md)。那不是之后每一次改动的清单。写那些说明时旁边的 Starfix 版本已经不是现在的版本。以 `companion/VERSION` 为准。

## Starfix

可选。没有它也能用星图：右键选「我在这里」。

Starfix 读取这台电脑上的 `Game.log`。你确认之后，它把地点代码发到房间。它不进游戏进程，不读内存，不上传整份日志。运行源码之前先读 [companion/README.md](companion/README.md)。

已发布的安装包：[Starfix 1.0.9](https://github.com/GuguguBear/sc-lmw/releases/tag/starfix-1.0.9)。程序拿 `companion/VERSION` 和名为 `starfix-X.Y.Z` 的 GitHub Release 比较。把 `companion/**` 或 [.github/workflows/starfix-release.yml](.github/workflows/starfix-release.yml) 推到 `master`，如果这个标签还不存在，就会打出 exe。[companion/write_version_info.py](companion/write_version_info.py) 用同一个版本号写 Windows 的版本信息。

更新时，窗口用你已经选好的主题，显示箱子装进集装箱的进度。下载结束后，辅助程序把新文件盖到你刚才打开的那个文件上。Windows PowerShell 的 `Move-Item -Force` 换不掉已经存在的 exe，所以辅助程序用 `System.IO.File.Copy`。如果你打开的文件名叫 `Starfix 1.0.6.exe`，新文件会是 `Starfix 1.0.8.exe`，旧名字会去掉。文件名就是 `Starfix.exe` 的，继续用这个名字。

更早的版本可能已经下载了 `Starfix.update.exe`，旧程序却还在。先关掉 Starfix，再双击旁边的 `Starfix.update.exe`。这个文件会把自己换上去并打开新程序。从 1.0.8 起，进度窗和覆盖都从你确认的那次更新里执行。

Starfix 允许这些页面来源，另外还有 `http://127.0.0.1` 和 `http://localhost`：

- `https://gugugubear.pythonanywhere.com`
- `https://sclmw.cltbbs.com`

新打开的窗口里，星图地址是 `https://sclmw.cltbbs.com`。如果保存的地址还是以前内置的 `https://gugugubear.pythonanywhere.com`，这个版本下次启动时会换成新地址。从某个页面连过来时，存的是那个页面自己的地址。

从某个页面点「连到这台电脑」，就会把那个页面的来源存成接口地址。更早安装的程序会一直用 PythonAnywhere，直到你再连一次。代理在前面时，两个地址都可以用。

## 部署这一份网站

推送到 `master` 会启动 [.github/workflows/deploy.yml](.github/workflows/deploy.yml)。任务检出仓库，再运行 [scripts/deploy_pythonanywhere.py](scripts/deploy_pythonanywhere.py)。

这个脚本会：

1. 从环境变量读 `PA_API_TOKEN`。在 GitHub 上，这是同名的 Actions 机密。令牌在 PythonAnywhere 账户页创建。
2. 用 `git ls-files` 列出文件。未跟踪和被 git 忽略的文件不会上传。
3. 把这些文件上传到 `www.pythonanywhere.com` 上用户 `GuguguBear` 的 `/home/GuguguBear/sc-lmw`。
4. 重新加载 Web 应用 `gugugubear.pythonanywhere.com`。

它不会删除服务器上多出来的文件，也不会换掉已经在服务器上的 `data/` 或房间数据库。数据重新生成之后，要自己把新的 JSON 拷到服务器。

对外名称不是这个脚本登记的。DNS 和 Worker 在 Cloudflare。发布一次网页改动就是：提交，推送 `master`，等到名为 “Update the live site” 的 Action 成功，并记住对外名称可能还会把缓存里的 JS 和 CSS 再留几个小时。

GitHub 上平时走 Pull Request。管理员直接推 `master` 可以绕过这条规则。这种推送出现绕过提示是预期情况。

## 自己跑一份

需要 Python 3。网站本身不用 Node 构建。

```sh
git clone https://github.com/GuguguBear/sc-lmw.git
cd sc-lmw
python scripts/build-all.py
python -m http.server 8000
```

打开 http://localhost:8000/ 。在你接到房间或玩家列表之前，地图上是示例飞行员。社区的游戏数据导出更新之后，再跑一次 `build-all.py`。

| 参数 | 作用 |
|---|---|
| `--with-de` | 德语游戏文本。见 [scripts/README_DE_INI.md](scripts/README_DE_INI.md)。 |
| `--with-loot` | Friendly Fire Department 导出的掉落地点。不放进 git。 |

物价和舰船模型是浏览器里向 UEX 和 FleetYards 现取的，不在这次构建的文件里。

## 嵌到别的网站

**iframe**

```html
<iframe src="https://sclmw.cltbbs.com/"
        style="width:100%;height:640px;border:0" allow="fullscreen"></iframe>
```

**一个 script 标签。** 星图留在这个元素里，不会去改你的 `body`。

```html
<div id="sc-lmw" style="height:640px"></div>
<script src="https://your-site.example/sc-lmw/js/sc-lmw.js"
        data-base="https://your-site.example/sc-lmw/"
        data-players-url="https://your-site.example/api/players"></script>
```

例子：[examples/iframe.html](examples/iframe.html)、[examples/embed.html](examples/embed.html)。给助手用的说明在 [docs/AI_INTEGRATION.md](docs/AI_INTEGRATION.md)。飞行员 JSON 的约定在 [docs/PLAYERS_API.md](docs/PLAYERS_API.md)。这一份网站的团队房间是 [server/room_server.py](server/room_server.py) 里的服务。[config.js](config.js) 里的 `PLAYERS_URL` 是另一条路：你自己的飞行员列表。

语言：`config.js` 里的 `LANG`（`auto`、`de`、`en`、`zh-Hans`、`zh-Hant`），或 script 上的 `data-lang`，或 `SCLMW.mount(el, { lang: 'zh-Hans' })`。第一次打开跟随浏览器。按钮可以当场切换，选择会留下。

主题：`config.js` 里的 `THEME`（`compact`、`classic`、`practical`、`chassis`、`scifi`、`haze`），或 `data-theme`，或 `mount(el, { theme })`。访客自己的选择优先。

## 数据从哪来

| 内容 | 来源 | 方式 |
|---|---|---|
| 地点、矿石、物品、蓝图、任务 | 社区的 `scunpacked-data` 导出 | `scripts/build-all.py`。不提交。 |
| 中文名 | 本机游戏 Language 文件 | `scripts/loc-build.py`。不提交。 |
| 物价 | [UEX](https://uexcorp.space) | 浏览器里现取。 |
| 舰船参数和模型 | [FleetYards](https://fleetyards.net) | 浏览器里现取。应用里有署名。 |
| 三维引擎 | [three.js](https://threejs.org) r128（MIT） | `vendor/three/` |
| 本站的团队 | 房间服务 | [server/room_server.py](server/room_server.py) |
| 你自己的飞行员 | `PLAYERS_URL` | 可选。[docs/PLAYERS_API.md](docs/PLAYERS_API.md) |

游戏文件不在这里分发。署名见 [CREDITS.md](CREDITS.md)。

指南和计时：[starcitizen.tools](https://starcitizen.tools)，[exec.xyxyll.com](https://exec.xyxyll.com) 经 `scripts/exec-build.py`，[exectimer.com](https://exectimer.com)。掉落地点只有加上 `--with-loot` 才有。

## 目录

```
index.html                 本站页面
config.js                  PLAYERS_URL、语言、主题、轮询间隔
manifest.webmanifest       可安装的应用
sw.js                      离线外壳；/api/ 仍走网络
js/starmap.js              星图、搜索、模糊、飞行员卡片
js/room.js                 首页、房间、队员、广播
js/i18n.js                 de / en / zh-Hans / zh-Hant
js/history.js              本机的个人日志回放
css/starmap.css            .sc-lmw 下的样式
server/room_server.py      本站使用的房间接口
companion/                 Starfix。见 companion/README.md
scripts/deploy_pythonanywhere.py
.github/workflows/deploy.yml
.github/workflows/starfix-release.yml
docs/PLAYERS_API.md
docs/AI_INTEGRATION.md
docs/WHATS_NEW.md          网站 1.1.0 的说明
```

## 画面

| 刷新之后房间还在 | 斯坦顿星图上的团队房间 |
|---|---|
| ![团队房间入口：保存的房间可以进入](docs/img/01-room-gate.png) | ![斯坦顿和团队房间窗口](docs/img/02-stanton-room.png) |

| 连到这台电脑上的 Starfix | 靠近一颗行星 |
|---|---|
| ![房间面板旁边的 Starfix 窗口](docs/img/03-starfix.png) | ![行星、地点列表和房间窗口](docs/img/04-planet.png) |

| 斯坦顿里打开的一个地点 | 派罗 |
|---|---|
| ![斯坦顿、地点面板和团队房间](docs/img/05-stanton-place.png) | ![派罗、地点面板和团队房间](docs/img/06-pyro.png) |

## 许可

**AGPL-3.0。** 见 [LICENSE](LICENSE)。如果你把修改过的版本当成网络服务给别人用，就要把这份修改过的源码提供给他们。第三方代码和数据仍用它们自己的许可。见 [CREDITS.md](CREDITS.md)。
