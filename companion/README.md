# Starfix

本目录是星图的可选附属程序。网页本身不读游戏目录。想自动报位置时，才在自己的电脑上运行这里的源码。

The files in this folder are an optional add-on for the star map. The website does not read the game folder. Run this source on your own computer only if you want it to try to report your place.

**English** · [Deutsch](#deutsch) · [简体中文](#简体中文) · [繁體中文](#繁體中文)

## 简体中文

### 它做什么

星图上有两种告诉队友你在哪的办法。

- **手动。** 在星图上点开一个地点，再点「我在这里」。这一步只用网页，不需要本程序。
- **自动。** 运行本目录里的程序。它读取你电脑上的 `Game.log`，找换区时游戏自己写下的那一行，把地点代码发给你已经确认过的房间。

程序打开后是一个窗口，不会另外打开浏览器。星图房间面板里的「连到这台电脑」只把房间码和令牌发给本机 `127.0.0.1:8780`。窗口里会先问你确认，你点了确认，它才保存。窗口不显示令牌，也不用你填写。别的网站不能悄悄写进你的配置。

### 它不做什么

这些事情源码里没有，也不会做：

- 不进入游戏进程，不注入，不读内存
- 不抓网络包，不改游戏文件，不替你按键
- 不上传整份日志，不上传你的昵称以外的账号资料
- 网页服务器不读你的游戏目录。只有你在这台电脑上运行本程序时，才会打开你指定的那一个日志文件

发给房间的内容只有三项：地点代码、星系、同一段代码。地址是你确认过的星图地址，请求头里带着房间令牌。对应代码在 `app.py` 的 `post_place`。

### 请先读再运行

全部逻辑都在这两个文件里，只用 Python 标准库：

| 文件 | 作用 |
|---|---|
| `app.py` | 读日志、解析地点、在本机 `127.0.0.1:8780` 等星图来连接、向房间发送地点 |
| `desk.py` | 窗口。语言、主题、按钮都在这里 |
| `index.html` | 同一小服务可以打开的备用页。正常使用时窗口不会带你去浏览器 |
| `icon.png` / `icon.ico` | 窗口和程序图标：取景框、菱形、星，表示在星图上锁定一个地点 |

日志怎么认地点，写在 `app.py` 的 `parse_line`。它找的是游戏日志里这种句子：`Transitioning from zone … to zone …`。句子里如果出现 zone、location、quantum 或 jump，也可能取最后一个看起来像地点代码的词。对不上时，它就不发送。

配置写在本机的 `config.json`，包含星图地址、房间码、房间令牌和日志路径。这个文件在 `.gitignore` 里，不会进仓库。令牌相当于房间钥匙，不要发给别人，也不要贴到公开页面。

### 怎么从源码运行

在项目根目录：

```sh
python companion/app.py
```

需要 Python 3。不需要再装别的包。窗口出现后，到星图房间里点「连到这台电脑」，回到窗口点确认，再点「开始监视」。

`companion/dist/` 里如果有 `Starfix.exe`，那是这套源码在你这台电脑上打包出来的，方便双击。仓库不收录那个可执行文件。要检查程序，请看上面的 `.py` 文件，而不是只看 exe。

### 条款

每次启动都会先弹出使用条款。同意才能继续，不同意或关闭窗口，程序立刻退出。条款不留在主窗口里。

条款写明：本软件与 CIG、RSI 及其关联方没有关系，也未获其任何形式的同意或授权来读取客户端日志。软件按现状提供，没有任何保证。使用造成的一切后果由使用者自己承担。开发者、贡献者、分发者和本软件本身不负责，也不承担赔偿。你和 CIG、RSI 之间的协议、处罚和争议，与本软件的开发者无关。

## English

### What it does

There are two ways to tell the room where you are.

- **By hand.** Open a place on the map and choose “I am here.” The website does that alone. This program is not required.
- **From the log.** Run the program in this folder. It reads `Game.log` on your computer, looks for the zone-change line the game writes, and sends that place code to the room you confirmed.

The program opens its own window. It does not open a browser. “Connect this computer” on the map sends the room code and token only to `127.0.0.1:8780` on this machine. The window asks you to confirm before it saves them. It never shows the token, and you never type it. Another website cannot store that token quietly.

### What it does not do

The source does not do any of these:

- attach to the game, inject code, or read memory
- capture packets, change game files, or press keys for you
- upload the whole log, or upload account data beyond the room you joined
- let the website read your game folder. The log file opens only if you run this program on this computer

The room receives three fields: place code, system, and the same code again. The address is the map address you confirmed. The request carries the room token. See `post_place` in `app.py`.

### Read it before you run it

The behavior is in two files. They use the Python standard library only.

| File | Role |
|---|---|
| `app.py` | Read the log, parse a place, listen on `127.0.0.1:8780` for the map, send the place to the room |
| `desk.py` | The window: languages, themes, buttons |
| `index.html` | A spare page from the same local service. Normal use stays in the window |
| `icon.png` / `icon.ico` | The mark: a frame, a diamond, and a star, for locking one place on the map |

`parse_line` in `app.py` is the whole parser. It looks for `Transitioning from zone … to zone …`. If a line mentions zone, location, quantum, or jump, it may take the last token that looks like a place code. If nothing matches, it sends nothing.

Settings go in `config.json` on this computer: map address, room code, room token, and log path. That file is listed in `.gitignore` and is not part of the repository. The token is a key to the room. Do not publish it.

### Run it from source

From the project root:

```sh
python companion/app.py
```

Python 3 is enough. No extra packages. When the window is open, choose “Connect this computer” in the room, confirm in the window, then start the watch.

A `Starfix.exe` under `companion/dist/`, if you built one, is this same source packaged on your computer. The repository does not include that executable. Inspect the `.py` files.

### Terms

Every launch asks you to accept the terms before the program continues. If you do not agree, or you close that window, the program exits. The terms are not kept inside the main window.

They state that this software has no relationship with CIG, RSI, or their affiliates, and that those companies have never authorized reading the client log. The software is provided as is, with no warranty. You accept every consequence of using it. The developers, contributors, distributors, and the software itself accept no responsibility and no damages. Any agreement, penalty, or dispute between you and CIG or RSI is not a matter for the developers of this software.

## Deutsch

### Was sie tut

Es gibt zwei Wege, dem Raum zu sagen, wo du bist.

- **Von Hand.** Öffne einen Ort auf der Karte und wähle „Ich bin hier“. Dafür reicht die Website. Dieses Programm brauchst du nicht.
- **Aus dem Log.** Starte das Programm in diesem Ordner. Es liest `Game.log` auf deinem Computer, sucht die Zeile zum Zonenwechsel und sendet den Ortscode an den Raum, den du bestätigt hast.

Es öffnet ein eigenes Fenster und keinen Browser. „Diesen Computer verbinden“ schickt Raumcode und Token nur an `127.0.0.1:8780` auf diesem Rechner. Das Fenster fragt nach, bevor es speichert. Den Token zeigt es nicht an, und du tippst ihn nicht ein. Eine andere Website kann den Token nicht still ablegen.

### Was sie nicht tut

Im Quelltext steht nichts davon, und es passiert auch nicht:

- kein Einhängen ins Spiel, keine Injektion, kein Speicherlesen
- kein Mitschnitt von Paketen, keine Änderung an Spieldateien, keine Tastendrücke für dich
- kein Hochladen des ganzen Logs und keine Kontodaten über den Raum hinaus
- Die Website liest deinen Spielordner nicht. Die Logdatei geht nur auf, wenn du dieses Programm auf diesem Computer startest

Der Raum bekommt drei Felder: Ortscode, System und denselben Code noch einmal. Die Adresse ist die bestätigte Kartenadresse. Die Anfrage trägt den Raumtoken. Siehe `post_place` in `app.py`.

### Lies den Quelltext zuerst

Das Verhalten steckt in zwei Dateien. Sie nutzen nur die Python-Standardbibliothek.

| Datei | Aufgabe |
|---|---|
| `app.py` | Log lesen, Ort erkennen, auf `127.0.0.1:8780` auf die Karte warten, Ort an den Raum senden |
| `desk.py` | Das Fenster: Sprachen, Themen, Knöpfe |
| `index.html` | Eine Ersatzseite desselben lokalen Dienstes. Im normalen Gebrauch bleibt das Fenster |
| `icon.png` / `icon.ico` | Das Zeichen: Rahmen, Raute und Stern, ein Ort auf der Karte |

`parse_line` in `app.py` ist der ganze Parser. Er sucht `Transitioning from zone … to zone …`. Kommen in einer Zeile zone, location, quantum oder jump vor, kann er das letzte Wort nehmen, das wie ein Ortscode aussieht. Passt nichts, wird nichts gesendet.

Die Einstellungen liegen in `config.json` auf diesem Computer: Kartenadresse, Raumcode, Raumtoken und Logpfad. Die Datei steht in `.gitignore` und gehört nicht ins Repository. Der Token ist ein Schlüssel zum Raum. Nicht veröffentlichen.

### Aus dem Quelltext starten

Im Projektordner:

```sh
python companion/app.py
```

Python 3 reicht. Keine weiteren Pakete. Wenn das Fenster da ist, in der Karte „Diesen Computer verbinden“ wählen, im Fenster bestätigen und die Überwachung starten.

Eine `Starfix.exe` unter `companion/dist/` ist dieselbe Quelle, auf deinem Computer gepackt. Das Repository enthält diese Datei nicht. Prüfe die `.py`-Dateien.

### Bedingungen

Bei jedem Start musst du die Bedingungen annehmen, bevor es weitergeht. Ohne Zustimmung oder beim Schließen des Fensters endet das Programm. Der Text bleibt nicht im Hauptfenster.

Er sagt: Diese Software hat keine Beziehung zu CIG, RSI oder deren verbundenen Unternehmen, und diese haben das Lesen der Client-Logdatei niemals erlaubt. Die Software wird ohne Gewähr bereitgestellt. Jede Folge der Nutzung trägst du selbst. Entwickler, Mitwirkende, Verbreiter und die Software selbst haften nicht und schulden keinen Schadenersatz. Verträge, Strafen und Streit zwischen dir und CIG oder RSI gehen die Entwickler dieser Software nichts an.

## 繁體中文

### 它做什麼

星圖上有兩種告訴隊友你在哪的辦法。

- **手動。** 在星圖上點開一個地點，再點「我在這裡」。這一步只用網頁，不需要本程式。
- **自動。** 執行本目錄裡的程式。它讀取你電腦上的 `Game.log`，找換區時遊戲自己寫下的那一行，把地點代碼發給你已經確認過的房間。

程式打開後是一個視窗，不會另外打開瀏覽器。星圖房間面板裡的「連到這台電腦」只把房間碼和令牌發給本機 `127.0.0.1:8780`。視窗裡會先問你確認，你點了確認，它才保存。視窗不顯示令牌，也不用你填寫。別的網站不能悄悄寫進你的設定。

### 它不做什麼

這些事情源碼裡沒有，也不會做：

- 不進入遊戲行程，不注入，不讀記憶體
- 不抓網路封包，不改遊戲檔案，不替你按鍵
- 不上傳整份日誌，不上傳房間以外的帳號資料
- 網頁伺服器不讀你的遊戲資料夾。只有你在這台電腦上執行本程式時，才會打開你指定的那一個日誌檔案

發給房間的內容只有三項：地點代碼、星系、同一段代碼。地址是你確認過的星圖地址，請求頭裡帶著房間令牌。對應程式在 `app.py` 的 `post_place`。

### 請先讀再執行

全部邏輯都在這兩個檔案裡，只用 Python 標準庫：

| 檔案 | 作用 |
|---|---|
| `app.py` | 讀日誌、解析地點、在本機 `127.0.0.1:8780` 等星圖來連接、向房間發送地點 |
| `desk.py` | 視窗。語言、主題、按鈕都在這裡 |
| `index.html` | 同一個小服務可以打開的備用頁。正常使用時視窗不會帶你去瀏覽器 |
| `icon.png` / `icon.ico` | 視窗和程式圖示：取景框、菱形、星，表示在星圖上鎖定一個地點 |

日誌怎麼認地點，寫在 `app.py` 的 `parse_line`。它找的是遊戲日誌裡這種句子：`Transitioning from zone … to zone …`。句子裡如果出現 zone、location、quantum 或 jump，也可能取最後一個看起來像地點代碼的詞。對不上時，它就不發送。

設定寫在本機的 `config.json`，包含星圖地址、房間碼、房間令牌和日誌路徑。這個檔案在 `.gitignore` 裡，不會進倉庫。令牌相當於房間鑰匙，不要發給別人，也不要貼到公開頁面。

### 怎麼從源碼執行

在專案根目錄：

```sh
python companion/app.py
```

需要 Python 3。不需要再裝別的套件。視窗出現後，到星圖房間裡點「連到這台電腦」，回到視窗點確認，再點「開始監視」。

`companion/dist/` 裡如果有 `Starfix.exe`，那是這套源碼在你這台電腦上打包出來的，方便雙擊。倉庫不收錄那個執行檔。要檢查程式，請看上面的 `.py` 檔案，而不是只看 exe。

### 條款

每次啟動都會先彈出使用條款。同意才能繼續，不同意或關閉視窗，程式立刻退出。條款不留在主視窗裡。

條款寫明：本軟體與 CIG、RSI 及其關聯方沒有關係，也未獲其任何形式的同意或授權來讀取客戶端日誌。軟體按現狀提供，沒有任何保證。使用造成的一切後果由使用者自己承擔。開發者、貢獻者、散布者和本軟體本身不負責，也不承擔賠償。你和 CIG、RSI 之間的協議、處罰和爭議，與本軟體的開發者無關。
