# Native window for the place watcher. The dark title bar is ours, and the
# window stays on the taskbar. It leaves the screen only when the user
# chooses 后台运行, and it comes back from the tray menu. It does not
# hide itself.

import sys
import time
import tkinter as tk
from pathlib import Path
from tkinter import filedialog

THEMES = {
    "classic": {
        "bg": "#070a12", "panel": "#101829", "ink": "#eef2fb", "muted": "#94a2c2",
        "line": "#3d5a80", "accent": "#37e1ff", "err": "#ff6b8a", "on": "#04131b",
    },
    "compact": {
        "bg": "#0c0e12", "panel": "#161b22", "ink": "#e8eaef", "muted": "#b7c0ce",
        "line": "#5c6778", "accent": "#e8eaef", "err": "#e07a86", "on": "#0c0e12",
    },
    "practical": {
        "bg": "#0a0a09", "panel": "#121110", "ink": "#c8c4bc", "muted": "#8a8680",
        "line": "#8a8680", "accent": "#d8d4c8", "err": "#c87070", "on": "#0a0a09",
    },
    "chassis": {
        "bg": "#080604", "panel": "#100c06", "ink": "#ffb000", "muted": "#c48a20",
        "line": "#ffb000", "accent": "#ffb000", "err": "#ff5544", "on": "#080604",
    },
    "scifi": {
        "bg": "#000808", "panel": "#041210", "ink": "#00e5cc", "muted": "#14988c",
        "line": "#00e5cc", "accent": "#00e5cc", "err": "#ff6688", "on": "#000808",
    },
}
THEME_NAMES = (
    ("classic", "经典"),
    ("compact", "紧凑"),
    ("practical", "实用"),
    ("chassis", "机壳"),
    ("scifi", "科幻"),
)
FONT = ("Microsoft YaHei UI", 9)
FONT_PLACE = ("Microsoft YaHei UI", 9)
LANGS = (
    ("zh-Hans", "简体中文"),
    ("zh-Hant", "繁體中文"),
    ("en", "English"),
    ("de", "Deutsch"),
)
TEXT = {
    "zh-Hans": {
        "title": "Starfix",
        "lead": "读取 Game.log，换区后把地点发到房间。",
        "tos": "不进游戏进程，不读内存，不改游戏文件。",
        "terms_title": "使用条款",
        "terms_yes": "同意并继续",
        "terms_no": "不同意",
        "terms_body": "本软件是非官方粉丝工具。它与 Cloud Imperium Games（CIG）、Roberts Space Industries（RSI）及其关联方没有关系，未获其认可、赞助、授权或同意。\n\nCIG 与 RSI 从未以任何形式同意、授权或许可本软件读取游戏客户端日志文件。\n\n本软件按现状提供，没有任何保证。开发者、贡献者、分发者以及本软件本身，不保证它适合任何用途，不保证它安全、不中断、无错误，也不保证使用它不会影响你的游戏账号、电脑或数据。\n\n你自愿使用本软件，并自行承担由此产生的一切风险和后果。这些后果包括但不限于账号警告、限制、封禁、游戏进度或物品损失、数据丢失、设备故障，以及任何直接、间接、附带、特殊或后续的损失。\n\n对你使用、无法使用或停止使用本软件所造成的任何形式的后果，开发者、贡献者、分发者和本软件本身均不负责，也不承担任何赔偿或法律责任。你与 CIG、RSI 之间的协议、处罚、纠纷和争议，与本软件的开发者、贡献者和分发者无关。\n\n选择「同意并继续」，表示你已阅读、理解并接受以上全部内容。选择「不同意」或关闭本窗口，软件立即退出，不会继续运行。",
        "linked_off": "还没连上房间。在星图点「连到这台电脑」，回到这里点确认。",
        "linked_on": "已连上房间 {room}",
        "pair": "星图要连上房间 {room}。确认后，这台电脑会把地点发过去。",
        "pair_yes": "确认连接", "pair_no": "取消",
        "log": "GAME.LOG", "browse": "浏览",
        "api": "星图地址", "room": "房间码", "token": "房间令牌",
        "lang": "语言", "look": "外观",
        "theme.classic": "经典", "theme.compact": "紧凑", "theme.practical": "实用", "theme.chassis": "机壳", "theme.scifi": "科幻",
        "watch": "开始监视", "watch_stop": "停止监视", "scan": "读最近地点",
        "place_none": "还没有地点", "quit": "退出", "back": "后台运行",
        "tray_show": "打开窗口", "tray_tip": "Starfix 在后台。左键打开窗口，右键可以操作。",
        "file_title": "选择 Game.log", "file_log": "日志", "file_all": "全部",
        "log_ok": "日志状态：正常", "log_missing": "日志状态：故障", "log_empty": "日志状态：空内容",
        "sent": "已发送 {code}", "seen": "日志里看到 {code}", "parsed": "解析到 {code}",
        "watching": "正在监视", "send_failed": "发送失败", "no_place": "最近日志里没有地点", "idle": "没有监视",
        "err_need_link": "先在星图里点「连到这台电脑」，再回到这里确认",
        "err_nolog": "找不到这份日志", "err_room": "房间码不对", "err_token": "令牌不对",
        "err_addr": "地址不对", "err_nopair": "没有待确认的连接", "err_http": "房间服务返回",
        "update_title": "正在更新", "update_lead": "正在把 {version} 装进程序",
        "update_bytes": "{done} / {total}", "update_swap": "正在换上新版本", "update_unknown": "正在下载",
    },
    "zh-Hant": {
        "title": "Starfix",
        "lead": "讀取 Game.log，換區後把地點發到房間。",
        "tos": "不進遊戲行程，不讀記憶體，不改遊戲檔案。",
        "terms_title": "使用條款",
        "terms_yes": "同意並繼續",
        "terms_no": "不同意",
        "terms_body": "本軟體是非官方粉絲工具。它與 Cloud Imperium Games（CIG）、Roberts Space Industries（RSI）及其關聯方沒有關係，未獲其認可、贊助、授權或同意。\n\nCIG 與 RSI 從未以任何形式同意、授權或許可本軟體讀取遊戲客戶端日誌檔案。\n\n本軟體按現狀提供，沒有任何保證。開發者、貢獻者、散布者以及本軟體本身，不保證它適合任何用途，不保證它安全、不中斷、無錯誤，也不保證使用它不會影響你的遊戲帳號、電腦或資料。\n\n你自願使用本軟體，並自行承擔由此產生的一切風險和後果。這些後果包括但不限於帳號警告、限制、封鎖、遊戲進度或物品損失、資料遺失、裝置故障，以及任何直接、間接、附帶、特殊或後續的損失。\n\n對你使用、無法使用或停止使用本軟體所造成的任何形式的後果，開發者、貢獻者、散布者和本軟體本身均不負責，也不承擔任何賠償或法律責任。你與 CIG、RSI 之間的協議、處罰、糾紛和爭議，與本軟體的開發者、貢獻者和散布者無關。\n\n選擇「同意並繼續」，表示你已閱讀、理解並接受以上全部內容。選擇「不同意」或關閉本視窗，軟體立即退出，不會繼續執行。",
        "linked_off": "還沒連上房間。在星圖點「連到這台電腦」，回到這裡點確認。",
        "linked_on": "已連上房間 {room}",
        "pair": "星圖要連上房間 {room}。確認後，這台電腦會把地點發過去。",
        "pair_yes": "確認連接", "pair_no": "取消",
        "log": "GAME.LOG", "browse": "瀏覽",
        "api": "星圖地址", "room": "房間碼", "token": "房間令牌",
        "lang": "語言", "look": "外觀",
        "theme.classic": "經典", "theme.compact": "緊湊", "theme.practical": "實用", "theme.chassis": "機殼", "theme.scifi": "科幻",
        "watch": "開始監視", "watch_stop": "停止監視", "scan": "讀最近地點",
        "place_none": "還沒有地點", "quit": "退出", "back": "背景執行",
        "tray_show": "打開視窗", "tray_tip": "Starfix 在背景。左鍵打開視窗，右鍵可以操作。",
        "file_title": "選擇 Game.log", "file_log": "日誌", "file_all": "全部",
        "log_ok": "日誌狀態：正常", "log_missing": "日誌狀態：故障", "log_empty": "日誌狀態：空內容",
        "sent": "已發送 {code}", "seen": "日誌裡看到 {code}", "parsed": "解析到 {code}",
        "watching": "正在監視", "send_failed": "發送失敗", "no_place": "最近日誌裡沒有地點", "idle": "沒有監視",
        "err_need_link": "先在星圖裡點「連到這台電腦」，再回到這裡確認",
        "err_nolog": "找不到這份日誌", "err_room": "房間碼不對", "err_token": "令牌不對",
        "err_addr": "地址不對", "err_nopair": "沒有待確認的連接", "err_http": "房間服務返回",
        "update_title": "正在更新", "update_lead": "正在把 {version} 裝進程式",
        "update_bytes": "{done} / {total}", "update_swap": "正在換上新版本", "update_unknown": "正在下載",
    },
    "en": {
        "title": "Starfix",
        "lead": "Reads Game.log and sends the place after a zone change.",
        "tos": "It does not enter the game, read memory, or change game files.",
        "terms_title": "Terms of use",
        "terms_yes": "Agree and continue",
        "terms_no": "Do not agree",
        "terms_body": "This software is an unofficial fan tool. It has no relationship with Cloud Imperium Games (CIG), Roberts Space Industries (RSI), or their affiliates. It is not approved, sponsored, authorized, or endorsed by them.\n\nCIG and RSI have never agreed to, authorized, or permitted this software to read the game client log file, in any form.\n\nThe software is provided as is, with no warranty of any kind. The developers, contributors, distributors, and the software itself do not warrant that it is fit for any purpose, that it is safe, uninterrupted, or error-free, or that using it will not affect your game account, computer, or data.\n\nYou use this software voluntarily and you accept every risk and consequence. That includes, without limitation, account warnings, limits, bans, loss of progress or items, loss of data, device failure, and any direct, indirect, incidental, special, or consequential loss.\n\nThe developers, contributors, distributors, and the software itself are not responsible for any consequence of using, being unable to use, or stopping this software, and they accept no damages or legal liability. Any agreement, penalty, dispute, or claim between you and CIG or RSI is not a matter for the developers, contributors, or distributors of this software.\n\nChoose “Agree and continue” only if you have read, understood, and accepted all of the above. Choose “Do not agree,” or close this window, and the software exits at once.",
        "linked_off": "Not connected. On the map, choose Connect this computer, then confirm here.",
        "linked_on": "Connected to {room}",
        "pair": "The map wants to connect room {room}. After you confirm, this computer sends places there.",
        "pair_yes": "Confirm", "pair_no": "Cancel",
        "log": "GAME.LOG", "browse": "Browse",
        "api": "Map address", "room": "Room code", "token": "Room token",
        "lang": "Language", "look": "Appearance",
        "theme.classic": "Classic", "theme.compact": "Compact", "theme.practical": "Practical", "theme.chassis": "Chassis", "theme.scifi": "Sci-fi",
        "watch": "Start watch", "watch_stop": "Stop watch", "scan": "Latest place",
        "place_none": "No place yet", "quit": "Quit", "back": "Background",
        "tray_show": "Show window", "tray_tip": "Starfix is in the background. Left click opens the window. Right click opens the menu.",
        "file_title": "Choose Game.log", "file_log": "Log", "file_all": "All",
        "log_ok": "Log status: ok", "log_missing": "Log status: missing", "log_empty": "Log status: empty",
        "sent": "Sent {code}", "seen": "Log shows {code}", "parsed": "Parsed {code}",
        "watching": "Watching", "send_failed": "Send failed", "no_place": "No place in the recent log", "idle": "Not watching",
        "err_need_link": "On the map, choose Connect this computer, then confirm here",
        "err_nolog": "Cannot find this log", "err_room": "Room code is not valid", "err_token": "Token is not valid",
        "err_addr": "Address is not valid", "err_nopair": "Nothing is waiting to confirm", "err_http": "Room service returned",
        "update_title": "Updating", "update_lead": "Loading {version} into the program",
        "update_bytes": "{done} / {total}", "update_swap": "Replacing this copy", "update_unknown": "Downloading",
    },
    "de": {
        "title": "Starfix",
        "lead": "Liest Game.log und sendet den Ort nach einem Zonenwechsel.",
        "tos": "Kein Eingriff ins Spiel, kein Speicherlesen, keine Spieldateien ändern.",
        "terms_title": "Nutzungsbedingungen",
        "terms_yes": "Zustimmen und weiter",
        "terms_no": "Nicht zustimmen",
        "terms_body": "Diese Software ist ein inoffizielles Fan-Werkzeug. Sie steht in keiner Beziehung zu Cloud Imperium Games (CIG), Roberts Space Industries (RSI) oder deren verbundenen Unternehmen. Sie ist von ihnen nicht gebilligt, gesponsert, erlaubt oder unterstützt.\n\nCIG und RSI haben niemals in irgendeiner Form zugestimmt, genehmigt oder erlaubt, dass diese Software die Logdatei des Spielclients liest.\n\nDie Software wird ohne jede Gewähr bereitgestellt. Die Entwickler, Mitwirkenden, Verbreiter und die Software selbst garantieren nicht, dass sie für einen Zweck geeignet, sicher, ununterbrochen oder fehlerfrei ist, und auch nicht, dass ihre Nutzung dein Spielkonto, deinen Computer oder deine Daten unberührt lässt.\n\nDu nutzt die Software freiwillig und trägst jedes Risiko und jede Folge selbst. Dazu gehören unter anderem Kontowarnungen, Einschränkungen, Sperren, Verlust von Fortschritt oder Gegenständen, Datenverlust, Gerätefehler und jeder unmittelbare, mittelbare, begleitende, besondere oder Folgeschaden.\n\nDie Entwickler, Mitwirkenden, Verbreiter und die Software selbst haften nicht für irgendeine Folge daraus, dass du die Software nutzt, nicht nutzen kannst oder nicht mehr nutzt, und sie schulden keinen Schadenersatz. Verträge, Strafen, Streit und Ansprüche zwischen dir und CIG oder RSI gehen die Entwickler, Mitwirkenden und Verbreiter dieser Software nichts an.\n\n„Zustimmen und weiter“ heißt, dass du alles gelesen, verstanden und akzeptiert hast. „Nicht zustimmen“ oder das Fenster schließen beendet die Software sofort.",
        "linked_off": "Noch kein Raum. In der Karte „Diesen Computer verbinden“, dann hier bestätigen.",
        "linked_on": "Verbunden mit {room}",
        "pair": "Die Karte will Raum {room} verbinden. Danach sendet dieser Computer die Orte dorthin.",
        "pair_yes": "Bestätigen", "pair_no": "Abbrechen",
        "log": "GAME.LOG", "browse": "Suchen",
        "api": "Kartenadresse", "room": "Raumcode", "token": "Raumtoken",
        "lang": "Sprache", "look": "Aussehen",
        "theme.classic": "Klassisch", "theme.compact": "Kompakt", "theme.practical": "Praktisch", "theme.chassis": "Gehäuse", "theme.scifi": "Science-Fiction",
        "watch": "Überwachen", "watch_stop": "Stoppen", "scan": "Letzten Ort",
        "place_none": "Noch kein Ort", "quit": "Beenden", "back": "Hintergrund",
        "tray_show": "Fenster öffnen", "tray_tip": "Starfix läuft im Hintergrund. Linksklick öffnet das Fenster. Rechtsklick öffnet das Menü.",
        "file_title": "Game.log wählen", "file_log": "Log", "file_all": "Alle",
        "log_ok": "Logstatus: in Ordnung", "log_missing": "Logstatus: fehlt", "log_empty": "Logstatus: leer",
        "sent": "Gesendet {code}", "seen": "Log zeigt {code}", "parsed": "Gelesen {code}",
        "watching": "Überwacht", "send_failed": "Senden fehlgeschlagen", "no_place": "Kein Ort im letzten Log", "idle": "Keine Überwachung",
        "err_need_link": "In der Karte „Diesen Computer verbinden“, dann hier bestätigen",
        "err_nolog": "Dieses Log wurde nicht gefunden", "err_room": "Raumcode ungültig", "err_token": "Token ungültig",
        "err_addr": "Adresse ungültig", "err_nopair": "Nichts wartet auf Bestätigung", "err_http": "Raumdienst antwortete",
        "update_title": "Aktualisierung", "update_lead": "{version} wird ins Programm geladen",
        "update_bytes": "{done} / {total}", "update_swap": "Diese Datei wird ersetzt", "update_unknown": "Download",
    },
}
ERR_MAP = {
    "先在星图里点「连到这台电脑」，再回到这里确认": "err_need_link",
    "找不到这份日志": "err_nolog",
    "房间码不对": "err_room",
    "令牌不对": "err_token",
    "地址不对": "err_addr",
    "没有待确认的连接": "err_nopair",
}


def canon_lang(raw):
    if not raw:
        return None
    x = str(raw).strip().lower().replace("_", "-")
    if x in ("zh-hans", "zh-cn", "zh-sg") or x.startswith("zh-hans") or x.startswith("zh-cn"):
        return "zh-Hans"
    if x in ("zh-hant", "zh-tw", "zh-hk", "zh-mo") or x.startswith("zh-hant") or x.startswith("zh-tw") or x.startswith("zh-hk"):
        return "zh-Hant"
    if x == "zh" or x.startswith("zh-"):
        return "zh-Hans"
    if x == "de" or x.startswith("de-"):
        return "de"
    if x == "en" or x.startswith("en-"):
        return "en"
    return None


def windows_lang():
    try:
        import ctypes
        buf = ctypes.create_unicode_buffer(85)
        if ctypes.windll.kernel32.GetUserDefaultLocaleName(buf, 85):
            found = canon_lang(buf.value)
            if found:
                return found
    except (AttributeError, OSError):
        pass
    return "en"


def tr(lang, key, **vars):
    pack = TEXT.get(lang) or TEXT["en"]
    text = pack.get(key)
    if text is None:
        text = TEXT["en"].get(key, key)
    if vars:
        text = text.format(**vars)
    return text


def _asset(name):
    here = Path(__file__).resolve().parent
    frozen = Path(getattr(sys, "_MEIPASS", here))
    for base in (frozen, here):
        path = base / name
        if path.is_file():
            return path
    return None


def theme_scroll(parent, target, colors):
    bar = tk.Canvas(parent, width=12, highlightthickness=0, bd=0, bg=colors["bg"], cursor="hand2")

    def paint(_event=None):
        bar.delete("thumb")
        try:
            first, last = target.yview()
        except tk.TclError:
            return
        if last - first >= 0.995:
            return
        height = max(1, bar.winfo_height())
        top = int(first * height)
        bot = int(last * height)
        if bot - top < 28:
            mid = (top + bot) // 2
            top = max(0, mid - 14)
            bot = min(height, top + 28)
        bar.create_rectangle(3, top + 2, 9, max(top + 6, bot - 2), fill=colors["accent"], width=0, tags="thumb")

    def jump(event):
        height = max(1, bar.winfo_height())
        first, last = target.yview()
        span = max(0.05, last - first)
        target.yview_moveto(min(1 - span, max(0, event.y / height - span / 2)))
        bar._origin = event.y
        bar._start = target.yview()[0]

    def drag(event):
        height = max(1, bar.winfo_height())
        span = max(0.05, target.yview()[1] - target.yview()[0])
        moved = (event.y - getattr(bar, "_origin", event.y)) / height
        target.yview_moveto(min(1 - span, max(0, getattr(bar, "_start", 0) + moved)))

    bar.bind("<Configure>", paint)
    bar.bind("<Button-1>", jump)
    bar.bind("<B1-Motion>", drag)
    target.configure(yscrollcommand=lambda *_args: paint())
    return bar


def _colorref(hex_color):
    text = str(hex_color or "").lstrip("#")
    if len(text) != 6:
        return 0x00121010
    red = int(text[0:2], 16)
    green = int(text[2:4], 16)
    blue = int(text[4:6], 16)
    return (blue << 16) | (green << 8) | red


def hide_window_border(widget, hex_color):
    # Windows 11 draws a white edge on a borderless window. Paint that edge
    # with the window color so it disappears.
    if sys.platform != "win32":
        return
    try:
        import ctypes
        from ctypes import wintypes
        widget.update_idletasks()
        user32 = ctypes.WinDLL("user32", use_last_error=True)
        user32.GetParent.argtypes = [wintypes.HWND]
        user32.GetParent.restype = wintypes.HWND
        hwnd = user32.GetParent(widget.winfo_id()) or widget.winfo_id()
        dwm = ctypes.WinDLL("dwmapi")
        color = ctypes.c_uint(_colorref(hex_color))
        dwm.DwmSetWindowAttribute.argtypes = [
            wintypes.HWND, ctypes.c_uint, ctypes.POINTER(ctypes.c_uint), ctypes.c_uint,
        ]
        dwm.DwmSetWindowAttribute.restype = ctypes.c_long
        dwm.DwmSetWindowAttribute(hwnd, 34, ctypes.byref(color), ctypes.sizeof(color))
    except (AttributeError, OSError, tk.TclError, ValueError):
        pass


def _dpi():
    try:
        import ctypes
        ctypes.windll.shcore.SetProcessDpiAwareness(1)
    except (AttributeError, OSError):
        try:
            import ctypes
            ctypes.windll.user32.SetProcessDPIAware()
        except (AttributeError, OSError):
            pass


_front = None


def _bind_front(fn):
    global _front
    _front = fn


def request_front():
    fn = _front
    if not fn:
        return False
    try:
        fn()
    except tk.TclError:
        return False
    return True


def force_foreground(widget):
    # The second double-click owns the foreground right. Pulse topmost, then
    # ask Windows to hand that right to the window that is already open.
    try:
        widget.deiconify()
        widget.lift()
        widget.attributes("-topmost", True)
        widget.update_idletasks()
    except tk.TclError:
        return
    try:
        if sys.platform == "win32":
            import ctypes
            from ctypes import wintypes
            user32 = ctypes.WinDLL("user32", use_last_error=True)
            kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
            user32.GetParent.argtypes = [wintypes.HWND]
            user32.GetParent.restype = wintypes.HWND
            user32.ShowWindow.argtypes = [wintypes.HWND, ctypes.c_int]
            user32.ShowWindow.restype = wintypes.BOOL
            user32.GetForegroundWindow.restype = wintypes.HWND
            user32.GetWindowThreadProcessId.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.DWORD)]
            user32.GetWindowThreadProcessId.restype = wintypes.DWORD
            user32.AttachThreadInput.argtypes = [wintypes.DWORD, wintypes.DWORD, wintypes.BOOL]
            user32.AttachThreadInput.restype = wintypes.BOOL
            user32.BringWindowToTop.argtypes = [wintypes.HWND]
            user32.SetForegroundWindow.argtypes = [wintypes.HWND]
            user32.SetForegroundWindow.restype = wintypes.BOOL
            kernel32.GetCurrentThreadId.restype = wintypes.DWORD
            hwnd = user32.GetParent(widget.winfo_id()) or widget.winfo_id()
            user32.ShowWindow(hwnd, 9)
            fg = user32.GetForegroundWindow()
            fg_pid = wintypes.DWORD()
            fg_tid = user32.GetWindowThreadProcessId(fg, ctypes.byref(fg_pid)) if fg else 0
            our_tid = kernel32.GetCurrentThreadId()
            linked = bool(fg_tid and fg_tid != our_tid and user32.AttachThreadInput(our_tid, fg_tid, True))
            user32.BringWindowToTop(hwnd)
            user32.SetForegroundWindow(hwnd)
            if linked:
                user32.AttachThreadInput(our_tid, fg_tid, False)
    finally:
        try:
            widget.attributes("-topmost", False)
            widget.focus_force()
            hide_window_border(widget, str(widget.cget("bg")))
        except tk.TclError:
            pass


def _status_text(state, lang):
    raw = state.get("status") or ""
    kind = state.get("logKind") or ("ok" if state.get("logExists") else "missing")
    log = tr(lang, {"ok": "log_ok", "empty": "log_empty"}.get(kind, "log_missing"))
    if raw.startswith("sent "):
        head = tr(lang, "sent", code=raw[5:])
    elif raw.startswith("seen "):
        head = tr(lang, "seen", code=raw[5:])
    elif raw.startswith("parsed "):
        head = tr(lang, "parsed", code=raw[7:])
    elif raw == "send failed":
        head = tr(lang, "send_failed")
    elif raw == "no place in the recent log":
        head = tr(lang, "no_place")
    elif raw == "watching" or state.get("running"):
        head = tr(lang, "watching")
    else:
        head = tr(lang, "idle")
    return head + "  ·  " + log


class Desktop:
    def __init__(self, core):
        self.core = core
        saved = core.CFG.get("theme")
        self.theme = saved if saved in THEMES else "scifi"
        self.lang = canon_lang(core.CFG.get("lang")) or windows_lang()
        if core.CFG.get("lang") != self.lang:
            core.CFG["lang"] = self.lang
            core.save_config(core.CFG)
        self.buttons = []
        self.chrome = []
        self._drag = None
        self._geom = None
        self._zoomed = False
        self._ready = False
        self._linked = False
        self._link_until = 0
        self._feed_sig = None
        self._feed_ids = None
        self._icon_img = None
        self._tray_on = False
        self._tray_hwnd = None
        self._tray_proc = None
        self._tray_class = None
        self._tray_hicon = None
        self._tray_taskbar_msg = 0
        self._tray_menu_at = 0
        self._user_background = False
        self._placing = False
        self._guard_on = False
        self._resume_frame = False
        _dpi()
        self.root = tk.Tk()
        self.root.overrideredirect(True)
        self.root.title(tr(self.lang, "title"))
        ico = _asset("icon.ico")
        if ico:
            try:
                self.root.iconbitmap(str(ico))
            except tk.TclError:
                pass
        self.root.configure(bg=THEMES[self.theme]["panel"])
        self.root.protocol("WM_DELETE_WINDOW", self.close)
        self.core.RAISE = lambda: self.root.after(0, self._raise)
        _bind_front(lambda: self.root.after(0, self._raise))

        shell = tk.Frame(self.root, bg=THEMES[self.theme]["panel"])
        shell.pack(fill="both", expand=True)
        self.shell = shell

        bar = tk.Frame(shell, height=36)
        bar.pack(fill="x")
        bar.pack_propagate(False)
        self.titlebar = bar
        self.mark = tk.Label(bar, text="◆", font=FONT, padx=8)
        png = _asset("icon.png")
        if png:
            try:
                raw = tk.PhotoImage(file=str(png))
                dpi = 96
                try:
                    import ctypes
                    dpi = int(ctypes.windll.user32.GetDpiForSystem()) or 96
                except (AttributeError, OSError, ValueError):
                    dpi = 96
                target = max(16, int(round(16 * dpi / 96)))
                factor = max(1, int(raw.width() / target))
                self._icon_img = raw.subsample(factor, factor)
                self.mark.configure(image=self._icon_img, text="")
            except tk.TclError:
                pass
        self.mark.pack(side="left")
        self.bar_title = tk.Label(bar, text=tr(self.lang, "title"), font=FONT)
        self.bar_title.pack(side="left")
        ver = str(getattr(self.core, "VERSION", "") or "").strip()
        self.bar_sub = tk.Label(bar, text=("  " + ver) if ver else "  SC LMW", font=FONT)
        self.bar_sub.pack(side="left")
        self.btn_close = self._chrome_btn(bar, "×", self.close, "close")
        self.btn_close.pack(side="right", fill="y")
        self.btn_max = self._chrome_btn(bar, "□", self._toggle_zoom, "max")
        self.btn_max.pack(side="right", fill="y")
        self.btn_min = self._chrome_btn(bar, "—", self._minimize, "min")
        self.btn_min.pack(side="right", fill="y")
        for widget in (bar, self.mark, self.bar_title, self.bar_sub):
            widget.bind("<ButtonPress-1>", self._drag_start)
            widget.bind("<B1-Motion>", self._drag_move)
            widget.bind("<Double-Button-1>", lambda _e: self._toggle_zoom())

        self.rule = tk.Canvas(shell, height=3, highlightthickness=0, bd=0)
        self.rule.pack(fill="x")

        card = tk.Frame(shell, padx=12, pady=8)
        self.card = card

        self.lead = tk.Label(card, text="读取 Game.log，换区后把地点发到房间。", font=FONT, anchor="w")
        self.lead.pack(fill="x")
        self.tos = tk.Label(card, text="不进游戏进程，不读内存，不改游戏文件。", font=FONT, anchor="w")
        self.tos.pack(fill="x", pady=(2, 0))
        self.linked = tk.Label(card, text="", font=FONT, anchor="w", justify="left", wraplength=490)
        self.linked.pack(fill="x", pady=(8, 0))

        self.pair = tk.Frame(card, padx=8, pady=8, highlightthickness=1)
        self.pair_text = tk.Label(self.pair, text="", font=FONT, anchor="w", justify="left", wraplength=470)
        self.pair_text.pack(fill="x")
        pair_row = tk.Frame(self.pair)
        pair_row.pack(fill="x", pady=(6, 0))
        self.pair_row = pair_row
        self.pair_yes = self._button(pair_row, "确认连接", self._accept, primary=True)
        self.pair_yes.pack(side="left")
        self.pair_no = self._button(pair_row, "取消", self._decline)
        self.pair_no.pack(side="left", padx=(6, 0))

        self.log_label = tk.Label(card, text="GAME.LOG", font=FONT, anchor="w")
        self.log_label.pack(fill="x", pady=(8, 2))
        log_row = tk.Frame(card)
        log_row.pack(fill="x")
        self.log_row = log_row
        self.log = tk.Entry(log_row, font=FONT, relief="flat", highlightthickness=1, borderwidth=0)
        self.log.pack(side="left", fill="x", expand=True, ipady=4)
        self.browse = self._button(log_row, "浏览", self._browse)
        self.browse.pack(side="left", padx=(6, 0))

        self.manual = tk.Frame(card)
        self.api_label, self.api = self._field(self.manual, "星图地址")
        self.room_label, self.room = self._field(self.manual, "房间码")
        self.manual.pack(fill="x", pady=(8, 0))

        self.lang_label = tk.Label(card, text="", font=FONT, anchor="w")
        self.lang_label.pack(fill="x", pady=(8, 4))
        lang_row = tk.Frame(card)
        lang_row.pack(fill="x")
        self.lang_row = lang_row
        self.lang_buttons = {}
        for key, name in LANGS:
            btn = self._button(lang_row, name, lambda k=key: self._pick_lang(k))
            btn._lang = key
            btn.pack(side="left", padx=(0, 4))
            self.lang_buttons[key] = btn

        self.look = tk.Label(card, text="外观", font=FONT, anchor="w")
        self.look.pack(fill="x", pady=(8, 4))
        theme_row = tk.Frame(card)
        theme_row.pack(fill="x")
        self.theme_row = theme_row
        self.theme_buttons = {}
        for key, name in THEME_NAMES:
            btn = self._button(theme_row, name, lambda k=key: self._pick_theme(k))
            btn._theme = key
            btn.pack(side="left", padx=(0, 4))
            self.theme_buttons[key] = btn

        actions = tk.Frame(card)
        actions.pack(fill="x", pady=(8, 0))
        self.actions = actions
        self.watch = self._button(actions, "开始监视", self._toggle_watch, primary=True)
        self.watch.pack(side="left")
        self.scan = self._button(actions, "读最近地点", self._scan)
        self.scan.pack(side="left", padx=(6, 0))

        self.err = tk.Label(card, text="", font=FONT, anchor="w", justify="left", wraplength=490)
        self.feed = tk.Canvas(shell, height=96, highlightthickness=0, bd=0)
        self._feed = {"place": "", "ship": "", "gear": "", "on": False}
        card.bind("<Configure>", self._fit_wrap)

        foot_rule = tk.Frame(shell, height=1)
        self.foot_rule = foot_rule
        foot = tk.Frame(shell, height=42)
        foot.pack_propagate(False)
        self.foot = foot
        self.meta = tk.Label(foot, text="", font=FONT, anchor="w", padx=12)
        self.meta.pack(side="left", fill="y")
        self.quit = self._button(foot, "退出", self.close)
        self.quit.pack(side="right", padx=8, pady=4)
        self.back = self._button(foot, "后台运行", self._background)
        self.back.pack(side="right", padx=(8, 0), pady=4)
        foot.pack(side="bottom", fill="x")
        foot_rule.pack(side="bottom", fill="x")
        self.feed.pack(side="bottom", fill="x")
        card.pack(fill="both", expand=True)

        self._apply_copy()
        self._paint()
        self._fill(core.public_state(), force=True)
        self.root.after(400, self._tick)
        self.root.after(32, self._animate)
        self.root.update_idletasks()
        width, height = 520, self.shell.winfo_reqheight() + 4
        if height < 560:
            height = 560
        screen_w = self.root.winfo_screenwidth()
        screen_h = self.root.winfo_screenheight()
        self._normal = "%dx%d+%d+%d" % (
            width, height,
            max(0, (screen_w - width) // 2),
            max(40, (screen_h - height) // 6),
        )
        self.root.minsize(420, 520)
        self.root.geometry(self._normal)
        self.root.bind("<Map>", self._on_map)
        self._mount_grips()
        self.root.after(30, self._seat_taskbar)
        self._ready = True

    def _hwnd(self):
        import ctypes
        self.root.update_idletasks()
        hwnd = ctypes.windll.user32.GetParent(self.root.winfo_id())
        return hwnd or self.root.winfo_id()

    def _mark_appwindow(self):
        import ctypes
        user32 = ctypes.windll.user32
        hwnd = self._hwnd()
        style = user32.GetWindowLongW(hwnd, -20)
        style = (style & ~0x00000080) | 0x00040000
        user32.SetWindowLongW(hwnd, -20, style)
        user32.SetWindowPos(hwnd, None, 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0004 | 0x0010 | 0x0020)
        hide_window_border(self.root, self._colors()["panel"])

    def _seat_taskbar(self):
        # withdraw() drops the frameless flag. Put it back before the window
        # is shown again, in this same step, so it neither stays hidden nor
        # grows a system title bar. The user did not ask to leave, so the
        # window is put back even if a step fails.
        self._placing = True
        try:
            self.root.withdraw()
            self.root.update()
            self.root.overrideredirect(True)
            self.root.deiconify()
            self.root.lift()
            self._mark_appwindow()
        except tk.TclError:
            try:
                self.root.overrideredirect(True)
                self.root.deiconify()
            except tk.TclError:
                pass
        finally:
            self._placing = False
            if not self._user_background:
                try:
                    if str(self.root.state()) == "withdrawn":
                        self.root.overrideredirect(True)
                        self.root.deiconify()
                        self.root.lift()
                except tk.TclError:
                    pass
            if not self._guard_on:
                self._guard_on = True
                self.root.after(3000, self._tray_guard)

    def _on_map(self, _event):
        if not self._resume_frame or str(self.root.state()) != "normal":
            return
        self._resume_frame = False
        try:
            self.root.overrideredirect(True)
        except tk.TclError:
            return
        self._mark_appwindow()

    def _chrome_btn(self, parent, text, command, role):
        label = tk.Label(parent, text=text, font=FONT, padx=12, cursor="hand2")
        label._role = role
        label.bind("<Button-1>", lambda _event: command())
        label.bind("<Enter>", lambda _event, widget=label: self._chrome_hover(widget, True))
        label.bind("<Leave>", lambda _event, widget=label: self._chrome_hover(widget, False))
        self.chrome.append(label)
        return label

    def _chrome_hover(self, widget, on):
        c = self._colors()
        if not on:
            widget.configure(bg=c["panel"], fg=c["ink"])
            return
        if widget._role == "close":
            widget.configure(bg=c["err"], fg="#ffffff")
        else:
            widget.configure(bg=c["accent"], fg=c["on"])

    def _drag_start(self, event):
        self._drag = (event.x_root - self.root.winfo_x(), event.y_root - self.root.winfo_y())

    def _drag_move(self, event):
        if self._zoomed or not self._drag:
            return
        self.root.geometry("+%d+%d" % (event.x_root - self._drag[0], event.y_root - self._drag[1]))

    def _minimize(self):
        # The user asked to leave the screen. Keep a taskbar button so the
        # window can come back. If that fails, stay on screen.
        self._resume_frame = True
        try:
            self.root.overrideredirect(False)
            self._mark_appwindow()
            self.root.iconify()
        except tk.TclError:
            self._resume_frame = False
            try:
                self.root.overrideredirect(True)
                self.root.deiconify()
            except tk.TclError:
                pass

    def _toggle_zoom(self):
        if self._zoomed:
            self.root.geometry(self._normal)
            self._zoomed = False
            self.btn_max.configure(text="□")
            return
        self._normal = self.root.geometry()
        self.root.geometry("%dx%d+0+0" % (self.root.winfo_screenwidth(), self.root.winfo_screenheight()))
        self._zoomed = True
        self.btn_max.configure(text="❐")

    def _button(self, parent, text, command, primary=False):
        label = tk.Label(parent, text=text, font=FONT, padx=10, pady=4, cursor="hand2")
        label._primary = primary
        label.bind("<Button-1>", lambda _event: command())
        self.buttons.append(label)
        return label

    def _field(self, parent, caption, secret=False):
        label = tk.Label(parent, text=caption, font=FONT, anchor="w")
        label.pack(fill="x", pady=(6, 2))
        entry = tk.Entry(parent, font=FONT, relief="flat", highlightthickness=1, borderwidth=0, show="*" if secret else "")
        entry.pack(fill="x", ipady=4)
        entry.bind("<FocusOut>", lambda _event: self._save())
        return label, entry

    def _colors(self):
        return THEMES.get(self.theme) or THEMES["scifi"]

    def _paint(self):
        c = self._colors()
        self.root.configure(bg=c["panel"])
        self.shell.configure(bg=c["panel"])
        self.titlebar.configure(bg=c["panel"])
        self.rule.configure(bg=c["panel"])
        self.card.configure(bg=c["panel"])
        self.foot.configure(bg=c["panel"])
        self.foot_rule.configure(bg=c["line"])
        self.mark.configure(bg=c["panel"], fg=c["accent"])
        self.bar_title.configure(bg=c["panel"], fg=c["ink"])
        self.bar_sub.configure(bg=c["panel"], fg=c["muted"])
        for widget in self.chrome:
            widget.configure(bg=c["panel"], fg=c["ink"])
        for widget in (self.lead, self.tos, self.linked, self.log_label, self.lang_label, self.look, self.meta, self.api_label, self.room_label):
            widget.configure(bg=c["panel"], fg=c["muted"])
        self.linked.configure(fg=c["ink"])
        self.feed.configure(bg=c["bg"])
        for grip in getattr(self, "_grips", []):
            grip.configure(bg=c["panel"])
        hide_window_border(self.root, c["panel"])
        self.log_label.configure(fg=c["accent"])
        self.lang_label.configure(fg=c["accent"])
        self.look.configure(fg=c["accent"])
        self.err.configure(bg=c["panel"], fg=c["err"])
        self.pair.configure(bg=c["bg"], highlightbackground=c["accent"])
        self.pair_text.configure(bg=c["bg"], fg=c["ink"])
        self.pair_row.configure(bg=c["bg"])
        self.log_row.configure(bg=c["panel"])
        self.lang_row.configure(bg=c["panel"])
        self.theme_row.configure(bg=c["panel"])
        self.actions.configure(bg=c["panel"])
        self.manual.configure(bg=c["panel"])
        for entry in (self.log, self.api, self.room):
            entry.configure(
                bg=c["bg"], fg=c["ink"], insertbackground=c["ink"],
                highlightbackground=c["line"], highlightcolor=c["accent"],
            )
        for label in self.buttons:
            active = bool(label._primary or getattr(label, "_theme", None) == self.theme or getattr(label, "_lang", None) == self.lang)
            if active:
                label.configure(bg=c["accent"], fg=c["on"])
            else:
                label.configure(bg=c["bg"], fg=c["ink"])

    def _set_entry(self, entry, value, force):
        value = value or ""
        if not force and entry.focus_get() is entry:
            return
        if entry.get() != value:
            entry.delete(0, "end")
            entry.insert(0, value)

    def _fill(self, state, force=False):
        self._set_entry(self.log, state.get("logPath"), force)
        self._set_entry(self.api, state.get("apiBase"), force)
        self._set_entry(self.room, state.get("room"), force)
        linked = bool(state.get("room") and state.get("tokenSet"))
        if linked and not self._linked:
            self._link_until = time.monotonic() + 1.26
        self._linked = linked
        if linked:
            self.linked.configure(text=tr(self.lang, "linked_on", room=state["room"]))
        else:
            self.linked.configure(text=tr(self.lang, "linked_off"))
        pending = state.get("pendingRoom") or ""
        if pending:
            self.pair_text.configure(text=tr(self.lang, "pair", room=pending))
            if not self.pair.winfo_ismapped():
                self.pair.pack(fill="x", pady=(8, 0), before=self.log_label)
        elif self.pair.winfo_ismapped():
            self.pair.pack_forget()
        place = state.get("place") or {}
        if place.get("code"):
            text = place["code"]
            if place.get("system"):
                text += "  ·  " + place["system"]
        else:
            text = tr(self.lang, "place_none")
        names = [item.get("name") for item in (place.get("gear") or []) if item.get("name")]
        self._feed = {
            "place": text,
            "ship": place.get("ship") or "",
            "gear": "  ·  ".join(names[:8]),
            "on": bool(state.get("running")),
        }
        self.meta.configure(text=_status_text(state, self.lang))
        err = self._local_error(state.get("error") or "")
        self.err.configure(text=err)
        if err and not self.err.winfo_ismapped():
            self.err.pack(fill="x", pady=(4, 0))
        elif not err and self.err.winfo_ismapped():
            self.err.pack_forget()
        self.watch.configure(text=tr(self.lang, "watch_stop" if state.get("running") else "watch"))
        theme = state.get("theme") if state.get("theme") in THEMES else self.theme
        if theme != self.theme:
            self.theme = theme
            self._paint()

    def _gather(self):
        return {
            "apiBase": self.api.get().strip(),
            "room": self.room.get().strip(),
            "logPath": self.log.get().strip(),
            "theme": self.theme,
        }

    def _save(self):
        self.core.apply_settings(self._gather())

    def _pick_theme(self, key):
        self.theme = key
        self._save()
        self._paint()

    def _pick_lang(self, key):
        self.lang = key
        with self.core.LOCK:
            self.core.CFG["lang"] = key
            self.core.save_config(self.core.CFG)
        self._apply_copy()
        self._paint()
        self._fill(self.core.public_state())
        self._refit()

    def _apply_copy(self):
        title = tr(self.lang, "title")
        self.root.title(title)
        self.bar_title.configure(text=title)
        self.lead.configure(text=tr(self.lang, "lead"))
        self.tos.configure(text=tr(self.lang, "tos"))
        self.log_label.configure(text=tr(self.lang, "log"))
        self.browse.configure(text=tr(self.lang, "browse"))
        self.api_label.configure(text=tr(self.lang, "api"))
        self.room_label.configure(text=tr(self.lang, "room"))
        self.lang_label.configure(text=tr(self.lang, "lang"))
        self.look.configure(text=tr(self.lang, "look"))
        self.scan.configure(text=tr(self.lang, "scan"))
        self.quit.configure(text=tr(self.lang, "quit"))
        self.back.configure(text=tr(self.lang, "back"))
        self.pair_yes.configure(text=tr(self.lang, "pair_yes"))
        self.pair_no.configure(text=tr(self.lang, "pair_no"))
        for key, btn in self.theme_buttons.items():
            btn.configure(text=tr(self.lang, "theme." + key))

    def _local_error(self, err):
        key = ERR_MAP.get(err)
        if key:
            return tr(self.lang, key)
        if err.startswith("房间服务返回"):
            return tr(self.lang, "err_http") + err[len("房间服务返回"):]
        return err

    def _fit_wrap(self, event=None):
        width = event.width if event is not None else self.card.winfo_width()
        wrap = max(180, width - 8)
        self.linked.configure(wraplength=wrap)
        self.pair_text.configure(wraplength=wrap)
        self.err.configure(wraplength=wrap)

    def _refit(self):
        self._fit_wrap()

    def _mount_grips(self):
        cursors = {
            "n": "size_ns", "s": "size_ns", "e": "size_we", "w": "size_we",
            "nw": "size_nw_se", "se": "size_nw_se", "ne": "size_ne_sw", "sw": "size_ne_sw",
        }
        specs = (
            ("n", {"relx": 0, "rely": 0, "relwidth": 1, "height": 6, "anchor": "nw"}),
            ("s", {"relx": 0, "rely": 1, "relwidth": 1, "height": 6, "anchor": "sw"}),
            ("w", {"relx": 0, "rely": 0, "relheight": 1, "width": 6, "anchor": "nw"}),
            ("e", {"relx": 1, "rely": 0, "relheight": 1, "width": 6, "anchor": "ne"}),
            ("nw", {"relx": 0, "rely": 0, "width": 14, "height": 14, "anchor": "nw"}),
            ("ne", {"relx": 1, "rely": 0, "width": 14, "height": 14, "anchor": "ne"}),
            ("sw", {"relx": 0, "rely": 1, "width": 14, "height": 14, "anchor": "sw"}),
            ("se", {"relx": 1, "rely": 1, "width": 14, "height": 14, "anchor": "se"}),
        )
        self._grips = []
        for edge, opts in specs:
            grip = tk.Frame(self.root, cursor=cursors[edge], bg=self._colors()["panel"])
            grip.place(**opts)
            grip.bind("<ButtonPress-1>", lambda event, name=edge: self._resize_start(event, name))
            grip.bind("<B1-Motion>", self._resize_move)
            grip.bind("<ButtonRelease-1>", self._resize_end)
            self._grips.append(grip)

    def _resize_start(self, event, edge):
        if self._zoomed:
            self._zoomed = False
            self.btn_max.configure(text="□")
        self._geom = {
            "edge": edge,
            "x": event.x_root, "y": event.y_root,
            "w": self.root.winfo_width(), "h": self.root.winfo_height(),
            "px": self.root.winfo_x(), "py": self.root.winfo_y(),
        }

    def _resize_move(self, event):
        g = self._geom
        if not g:
            return
        dx = event.x_root - g["x"]
        dy = event.y_root - g["y"]
        x, y, w, h = g["px"], g["py"], g["w"], g["h"]
        edge = g["edge"]
        if "e" in edge:
            w = g["w"] + dx
        if "s" in edge:
            h = g["h"] + dy
        if "w" in edge:
            w = g["w"] - dx
            x = g["px"] + dx
        if "n" in edge:
            h = g["h"] - dy
            y = g["py"] + dy
        if w < 420:
            if "w" in edge:
                x -= 420 - w
            w = 420
        if h < 520:
            if "n" in edge:
                y -= 520 - h
            h = 520
        self.root.geometry("%dx%d+%d+%d" % (int(w), int(h), int(x), int(y)))

    def _resize_end(self, _event):
        if not self._geom:
            return
        self._geom = None
        if not self._zoomed:
            self._normal = self.root.geometry()

    def _browse(self):
        path = filedialog.askopenfilename(
            parent=self.root,
            title=tr(self.lang, "file_title"),
            filetypes=((tr(self.lang, "file_log"), "*.log"), (tr(self.lang, "file_all"), "*.*")),
        )
        if not path:
            return
        self.log.delete(0, "end")
        self.log.insert(0, path)
        self._save()

    def _toggle_watch(self):
        self._save()
        state = self.core.public_state()
        self.core.set_running(not state.get("running"))
        self._fill(self.core.public_state())

    def _scan(self):
        self._save()
        self.core.scan_tail()
        self._fill(self.core.public_state())

    def _accept(self):
        try:
            self.core.accept_pair()
        except Exception as exc:
            self.err.configure(text=self._local_error(str(exc)[:180]))
            if not self.err.winfo_ismapped():
                self.err.pack(fill="x", pady=(4, 0))
            return
        self._fill(self.core.public_state(), force=True)

    def _decline(self):
        self.core.decline_pair()
        self._fill(self.core.public_state())

    def _tick(self):
        if not self.root.winfo_exists():
            return
        self._fill(self.core.public_state())
        self.root.after(400, self._tick)

    def _animate(self):
        if not self.root.winfo_exists():
            return
        now = time.monotonic()
        c = self._colors()
        width = max(self.rule.winfo_width(), 1)
        span = max(48, width // 4)
        x = int(((now % 5.4) / 5.4) * (width + span)) - span
        self.rule.delete("sweep")
        self.rule.configure(bg=c["panel"])
        self.rule.create_rectangle(0, 0, width, 3, fill=c["line"], width=0, tags="sweep")
        self.rule.create_rectangle(x, 0, x + span, 3, fill=c["accent"], width=0, tags="sweep")
        if now < self._link_until:
            on = int(now / 0.09) % 2 == 0
            self.linked.configure(fg=c["on"] if on else c["accent"], bg=c["accent"] if on else c["panel"])
        elif not self._linked:
            on = int(now / 0.72) % 2 == 0
            self.linked.configure(fg=c["accent"] if on else c["panel"], bg=c["panel"])
        else:
            self.linked.configure(fg=c["on"], bg=c["accent"])
        self._draw_feed(now)
        self.root.after(32, self._animate)

    def _draw_feed(self, now):
        box = self.feed
        if not box.winfo_exists():
            return
        c = self._colors()
        width = max(box.winfo_width(), 2)
        height = max(box.winfo_height(), 2)
        feed = self._feed
        on = bool(feed.get("on"))
        place = feed.get("place") or ""
        ship = feed.get("ship") or ""
        gear = feed.get("gear") or ""
        sig = (place, ship, gear, on, width, height, self.theme)
        if sig != self._feed_sig or not self._feed_ids:
            self._feed_sig = sig
            self._build_feed(box, c, width, height, on, place, ship, gear)
        self._move_feed(box, c, width, height, on, ship, now)

    def _build_feed(self, box, c, width, height, on, place, ship, gear):
        box.delete("all")
        box.configure(bg=c["bg"])
        ids = {
            "live": box.create_text(14, 16, text="LIVE" if on else "IDLE", anchor="w", font=FONT, fill=c["accent"]),
            "meters": [],
            "place": box.create_text(14, 40, text=place, anchor="w", font=FONT, fill=c["ink"]),
            "ship": box.create_text(14, 60, text=ship or "—", anchor="w", font=FONT, fill=c["accent"] if ship else c["muted"]),
            "gear": [],
            "scroll": False,
        }
        box.create_rectangle(0, 0, 3, height, fill=c["accent"], width=0)
        if on:
            for i in range(6):
                ids["meters"].append(box.create_rectangle(
                    width - 16 - i * 7, 8, width - 12 - i * 7, 22, fill=c["line"], width=0
                ))
            ids["scan"] = box.create_rectangle(10, 6, width - 8, 8, fill=c["line"], width=0)
        if gear:
            import tkinter.font as tkfont
            measure = tkfont.Font(font=FONT).measure(gear)
            room = max(40, width - 28)
            if on and measure > room:
                period = measure + 48
                ids["scroll"] = True
                ids["period"] = period
                ids["gear"].append(box.create_text(14, 80, text=gear, anchor="w", font=FONT, fill=c["muted"]))
                ids["gear"].append(box.create_text(14 + period, 80, text=gear, anchor="w", font=FONT, fill=c["muted"]))
            else:
                ids["gear"].append(box.create_text(14, 80, text=gear, anchor="w", font=FONT, fill=c["muted"]))
        elif on:
            ids["gear"].append(box.create_text(14, 80, text="· · ·", anchor="w", font=FONT, fill=c["line"]))
        self._feed_ids = ids
        self._feed_pulse = None
        self._feed_step = None

    def _move_feed(self, box, c, width, height, on, ship, now):
        ids = self._feed_ids
        pulse = int(now / 0.54) % 2 == 0
        if pulse != self._feed_pulse:
            self._feed_pulse = pulse
            box.itemconfig(ids["live"], fill=c["accent"] if (on and pulse) or not on else c["line"])
            caret = " ▍" if on and pulse else ""
            box.itemconfig(ids["ship"], text=(ship or "—") + caret)
        if on and ids["meters"]:
            step = int(now / 0.18)
            if step != self._feed_step:
                self._feed_step = step
                for i, item in enumerate(ids["meters"]):
                    hot = (step + i) % 6 < 3
                    box.itemconfig(item, fill=c["accent"] if hot else c["line"])
            travel = max(1, height - 8)
            y = 6 + (now * 55) % travel
            box.coords(ids["scan"], 10, y, width - 8, y + 2)
        if ids["scroll"]:
            period = ids["period"]
            shift = (now * 34) % period
            box.coords(ids["gear"][0], 14 - shift, 80)
            box.coords(ids["gear"][1], 14 - shift + period, 80)

    def _tray_hwnd_ready(self):
        if self._tray_hwnd or sys.platform != "win32":
            return bool(self._tray_hwnd)
        import ctypes
        from ctypes import wintypes
        user32 = ctypes.windll.user32
        kernel32 = ctypes.windll.kernel32
        kernel32.GetModuleHandleW.restype = wintypes.HINSTANCE
        kernel32.GetModuleHandleW.argtypes = [wintypes.LPCWSTR]
        user32.DefWindowProcW.restype = ctypes.c_ssize_t
        user32.DefWindowProcW.argtypes = [wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM]
        proc_type = ctypes.WINFUNCTYPE(ctypes.c_ssize_t, wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM)

        user32.RegisterWindowMessageW.argtypes = [wintypes.LPCWSTR]
        user32.RegisterWindowMessageW.restype = wintypes.UINT
        self._tray_taskbar_msg = int(user32.RegisterWindowMessageW("TaskbarCreated") or 0)

        def proc(hwnd, msg, wparam, lparam):
            try:
                message = int(msg)
                if self._tray_taskbar_msg and message == self._tray_taskbar_msg:
                    self.root.after(0, self._tray_restore)
                    return 0
                if message == 0x8000 and int(wparam) == 1:
                    mouse = int(lparam) & 0xFFFF
                    if mouse in (0x0202, 0x0203):
                        self.root.after(0, self._show)
                    elif mouse in (0x0205, 0x007B):
                        self.root.after(0, self._tray_menu)
                    return 0
            except Exception:
                return 0
            return user32.DefWindowProcW(hwnd, msg, wparam, lparam)

        class WndClass(ctypes.Structure):
            _fields_ = [
                ("style", wintypes.UINT),
                ("lpfnWndProc", proc_type),
                ("cbClsExtra", ctypes.c_int),
                ("cbWndExtra", ctypes.c_int),
                ("hInstance", wintypes.HINSTANCE),
                ("hIcon", wintypes.HICON),
                ("hCursor", wintypes.HANDLE),
                ("hbrBackground", wintypes.HBRUSH),
                ("lpszMenuName", wintypes.LPCWSTR),
                ("lpszClassName", wintypes.LPCWSTR),
            ]

        self._tray_proc = proc_type(proc)
        klass = WndClass()
        klass.lpfnWndProc = self._tray_proc
        klass.hInstance = kernel32.GetModuleHandleW(None)
        klass.lpszClassName = "StarfixTray"
        user32.RegisterClassW.argtypes = [ctypes.POINTER(WndClass)]
        user32.RegisterClassW.restype = wintypes.ATOM
        atom = user32.RegisterClassW(ctypes.byref(klass))
        if not atom and kernel32.GetLastError() not in (0, 1410):
            return False
        user32.CreateWindowExW.argtypes = [
            wintypes.DWORD, wintypes.LPCWSTR, wintypes.LPCWSTR, wintypes.DWORD,
            ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.c_int,
            wintypes.HWND, wintypes.HMENU, wintypes.HINSTANCE, wintypes.LPVOID,
        ]
        user32.CreateWindowExW.restype = wintypes.HWND
        hwnd = user32.CreateWindowExW(
            0x80, "StarfixTray", "Starfix", 0x80000000,
            -32000, -32000, 1, 1,
            None, None, klass.hInstance, None,
        )
        if not hwnd:
            return False
        user32.ShowWindow.argtypes = [wintypes.HWND, ctypes.c_int]
        user32.ShowWindow.restype = wintypes.BOOL
        user32.ShowWindow(hwnd, 8)
        self._tray_hwnd = hwnd
        self._tray_class = atom
        return True

    def _tray_icon(self):
        if self._tray_hicon:
            return self._tray_hicon
        path = _asset("icon.ico")
        if not path:
            return None
        import ctypes
        from ctypes import wintypes
        user32 = ctypes.windll.user32
        user32.LoadImageW.restype = wintypes.HICON
        user32.LoadImageW.argtypes = [wintypes.HINSTANCE, wintypes.LPCWSTR, wintypes.UINT, ctypes.c_int, ctypes.c_int, wintypes.UINT]
        icon = user32.LoadImageW(None, str(path), 1, 16, 16, 0x10)
        self._tray_hicon = icon or None
        return self._tray_hicon

    def _tray_data(self):
        import ctypes
        from ctypes import wintypes
        class Data(ctypes.Structure):
            _fields_ = [
                ("cbSize", wintypes.DWORD),
                ("hWnd", wintypes.HWND),
                ("uID", wintypes.UINT),
                ("uFlags", wintypes.UINT),
                ("uCallbackMessage", wintypes.UINT),
                ("hIcon", wintypes.HICON),
                ("szTip", wintypes.WCHAR * 128),
            ]
        data = Data()
        data.cbSize = ctypes.sizeof(data)
        data.hWnd = self._tray_hwnd
        data.uID = 1
        data.uFlags = 1 | 2 | 4
        data.uCallbackMessage = 0x8000
        data.hIcon = self._tray_icon()
        data.szTip = tr(self.lang, "tray_tip")[:127]
        return data

    def _tray_add(self):
        if self._tray_on:
            return True
        if not self._tray_hwnd_ready() or not self._tray_icon():
            return False
        import ctypes
        data = self._tray_data()
        ok = ctypes.windll.shell32.Shell_NotifyIconW(0, ctypes.byref(data))
        self._tray_on = bool(ok)
        return self._tray_on

    def _tray_remove(self):
        if not self._tray_on or not self._tray_hwnd:
            self._tray_on = False
            return
        import ctypes
        data = self._tray_data()
        ctypes.windll.shell32.Shell_NotifyIconW(2, ctypes.byref(data))
        self._tray_on = False

    def _tray_touch(self):
        if not self._tray_on or not self._tray_hwnd or not self._tray_icon():
            return False
        import ctypes
        data = self._tray_data()
        return bool(ctypes.windll.shell32.Shell_NotifyIconW(1, ctypes.byref(data)))

    def _tray_restore(self):
        if not self._user_background:
            return
        self._tray_on = False
        self._tray_add()

    def _tray_menu(self):
        if not self._tray_on or not self._tray_hwnd:
            return
        now = time.time()
        if now - self._tray_menu_at < 0.4:
            return
        self._tray_menu_at = now
        import ctypes
        from ctypes import wintypes
        user32 = ctypes.windll.user32
        kernel32 = ctypes.windll.kernel32
        user32.CreatePopupMenu.restype = wintypes.HMENU
        user32.AppendMenuW.argtypes = [wintypes.HMENU, wintypes.UINT, ctypes.c_size_t, wintypes.LPCWSTR]
        user32.TrackPopupMenu.restype = ctypes.c_int
        user32.TrackPopupMenu.argtypes = [wintypes.HMENU, wintypes.UINT, ctypes.c_int, ctypes.c_int, ctypes.c_int, wintypes.HWND, ctypes.c_void_p]
        user32.GetCursorPos.argtypes = [ctypes.POINTER(wintypes.POINT)]
        user32.GetForegroundWindow.restype = wintypes.HWND
        user32.GetWindowThreadProcessId.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.DWORD)]
        user32.GetWindowThreadProcessId.restype = wintypes.DWORD
        user32.AttachThreadInput.argtypes = [wintypes.DWORD, wintypes.DWORD, wintypes.BOOL]
        user32.AttachThreadInput.restype = wintypes.BOOL
        user32.SetForegroundWindow.argtypes = [wintypes.HWND]
        user32.SetForegroundWindow.restype = wintypes.BOOL
        kernel32.GetCurrentThreadId.restype = wintypes.DWORD
        menu = user32.CreatePopupMenu()
        user32.AppendMenuW(menu, 0, 1, tr(self.lang, "tray_show"))
        running = False
        try:
            running = bool(self.core.public_state().get("running"))
        except Exception:
            running = False
        user32.AppendMenuW(menu, 0, 3, tr(self.lang, "watch_stop" if running else "watch"))
        user32.AppendMenuW(menu, 0x800, 0, "")
        user32.AppendMenuW(menu, 0, 2, tr(self.lang, "quit"))
        point = wintypes.POINT()
        user32.GetCursorPos(ctypes.byref(point))
        fg = user32.GetForegroundWindow()
        pid = wintypes.DWORD()
        fg_tid = user32.GetWindowThreadProcessId(fg, ctypes.byref(pid)) if fg else 0
        tid = kernel32.GetCurrentThreadId()
        linked = bool(fg_tid and fg_tid != tid and user32.AttachThreadInput(tid, fg_tid, True))
        user32.SetForegroundWindow(self._tray_hwnd)
        cmd = user32.TrackPopupMenu(
            menu, 0x0100 | 0x0002 | 0x0080 | 0x0008 | 0x0020,
            int(point.x), int(point.y), 0, self._tray_hwnd, None,
        )
        user32.PostMessageW(self._tray_hwnd, 0, 0, 0)
        if linked:
            user32.AttachThreadInput(tid, fg_tid, False)
        user32.DestroyMenu(menu)
        self._tray_menu_at = time.time()
        if cmd == 1:
            self._show()
        elif cmd == 3:
            self._toggle_watch()
        elif cmd == 2:
            self.close()

    def _tray_guard(self):
        try:
            if self._placing:
                pass
            elif self._user_background:
                if not self._tray_touch():
                    self._tray_on = False
                    if not self._tray_add():
                        self._user_background = False
                        self._show()
            else:
                try:
                    if str(self.root.state()) == "withdrawn":
                        self._show()
                except tk.TclError:
                    return
        except Exception:
            pass
        try:
            self.root.after(3000, self._tray_guard)
        except tk.TclError:
            pass

    def _background(self):
        if not self._tray_add():
            return
        self._user_background = True
        try:
            self.root.withdraw()
        except tk.TclError:
            self._user_background = False
            self._tray_remove()

    def _show(self):
        self._user_background = False
        self._tray_remove()
        try:
            self.root.overrideredirect(True)
            self.root.deiconify()
            self.root.lift()
            self.root.focus_force()
            self._mark_appwindow()
        except tk.TclError:
            return
        force_foreground(self.root)

    def _raise(self):
        self._show()

    def close(self):
        self._tray_remove()
        self.core.request_stop()
        self.root.destroy()

    def run(self):
        self.root.mainloop()


def accept_terms(lang, theme, version=""):
    colors = THEMES.get(theme) or THEMES["scifi"]
    _dpi()
    root = tk.Tk()
    root.overrideredirect(True)
    ver = str(version or "").strip()
    root.title("Starfix" + ((" " + ver) if ver else ""))
    ico = _asset("icon.ico")
    if ico:
        try:
            root.iconbitmap(str(ico))
        except tk.TclError:
            pass
    root.configure(bg=colors["panel"])
    agreed = {"ok": False}
    drag = {"x": 0, "y": 0}
    live = {"ok": False}

    def accept():
        if not live["ok"]:
            return
        agreed["ok"] = True
        root.destroy()

    def decline():
        root.destroy()

    def drag_start(event):
        drag["x"] = event.x_root - root.winfo_x()
        drag["y"] = event.y_root - root.winfo_y()

    def drag_move(event):
        root.geometry("+%d+%d" % (event.x_root - drag["x"], event.y_root - drag["y"]))

    shell = tk.Frame(root, bg=colors["panel"])
    shell.pack(fill="both", expand=True)
    bar = tk.Frame(shell, bg=colors["panel"], height=28)
    bar.pack(fill="x")
    bar.pack_propagate(False)
    title = tk.Label(bar, text="Starfix" + ((" " + ver) if ver else ""), font=FONT, bg=colors["panel"], fg=colors["ink"])
    title.pack(side="left", padx=10)
    terms_heading = tk.Label(bar, text="  " + tr(lang, "terms_title"), font=FONT, bg=colors["panel"], fg=colors["muted"])
    close = tk.Label(bar, text="×", font=FONT, bg=colors["panel"], fg=colors["ink"], padx=12, cursor="hand2")
    close.pack(side="right", fill="y")
    close.bind("<Button-1>", lambda _event: decline())
    terms_heading.pack(side="left")
    for widget in (bar, title, terms_heading):
        widget.bind("<ButtonPress-1>", drag_start)
        widget.bind("<B1-Motion>", drag_move)
    body = tk.Frame(shell, bg=colors["panel"], padx=12, pady=10)
    body.pack(fill="both", expand=True)
    row = tk.Frame(body, bg=colors["panel"])
    row.pack(side="bottom", fill="x", pady=(10, 0))
    box = tk.Frame(body, bg=colors["line"])
    box.pack(side="top", fill="both", expand=True)
    text = tk.Text(
        box, font=FONT, wrap="word", width=42, height=8, relief="flat", bd=8,
        bg=colors["bg"], fg=colors["ink"], highlightthickness=0,
        padx=6, pady=6,
    )
    scroll = theme_scroll(box, text, colors)
    scroll.pack(side="right", fill="y")
    text.pack(side="left", fill="both", expand=True)
    text.insert("1.0", tr(lang, "terms_body"))
    text.mark_set("insert", "1.0")
    text.configure(state="disabled")

    def wheel(event):
        text.yview_scroll(int(-event.delta / 120), "units")

    text.bind("<MouseWheel>", wheel)
    yes = tk.Button(
        row, text=tr(lang, "terms_yes"), font=FONT, command=accept,
        bg=colors["accent"], fg=colors["on"], activebackground=colors["accent"],
        activeforeground=colors["on"], relief="flat", bd=0, padx=12, pady=4,
        highlightthickness=0, cursor="hand2",
    )
    no = tk.Button(
        row, text=tr(lang, "terms_no"), font=FONT, command=decline,
        bg=colors["bg"], fg=colors["ink"], activebackground=colors["bg"],
        activeforeground=colors["ink"], relief="flat", bd=0, padx=12, pady=4,
        highlightthickness=0, cursor="hand2",
    )
    yes.pack(side="left")
    no.pack(side="left", padx=(8, 0))
    root.protocol("WM_DELETE_WINDOW", decline)
    root.after(800, lambda: live.__setitem__("ok", True))
    root.update_idletasks()
    screen_w = root.winfo_screenwidth()
    screen_h = root.winfo_screenheight()
    width = min(560, max(420, screen_w - 48))
    height = min(680, max(520, int(screen_h * 0.72)))
    height = min(height, max(420, screen_h - 80))
    root.geometry("%dx%d+%d+%d" % (
        width, height,
        max(0, (screen_w - width) // 2),
        max(24, (screen_h - height) // 6),
    ))
    hide_window_border(root, colors["panel"])

    def show_start():
        text.yview_moveto(0)

    def bring():
        try:
            root.deiconify()
            root.lift()
        except tk.TclError:
            return
        force_foreground(root)

    previous = _front
    _bind_front(lambda: root.after(0, bring))
    root.after_idle(show_start)
    root.after(50, show_start)
    try:
        root.mainloop()
    finally:
        _bind_front(previous)
    return agreed["ok"]


def _byte_text(n):
    n = max(0, int(n or 0))
    if n >= 1_000_000:
        return "%.1f MB" % (n / 1_000_000)
    if n >= 1000:
        return "%d KB" % (n // 1000)
    return "%d B" % n


class UpdateProgress:
    """Download window. Crates slide into a container as bytes arrive."""

    SLOTS = 8

    def __init__(self, theme, lang, version):
        self.colors = THEMES.get(theme) or THEMES["scifi"]
        self.lang = lang if lang in TEXT else "en"
        self.version = version
        self.frac = 0.0
        self.shown = 0.0
        self.done = 0
        self.total = 0
        self.phase = "load"
        self.tick = 0
        self.alive = True
        _dpi()
        c = self.colors
        root = tk.Tk()
        self.root = root
        root.overrideredirect(True)
        root.title("Starfix")
        root.configure(bg=c["panel"])
        root.attributes("-topmost", True)
        ico = _asset("icon.ico")
        if ico:
            try:
                root.iconbitmap(str(ico))
            except tk.TclError:
                pass
        drag = {"x": 0, "y": 0}

        def drag_start(event):
            drag["x"] = event.x_root - root.winfo_x()
            drag["y"] = event.y_root - root.winfo_y()

        def drag_move(event):
            root.geometry("+%d+%d" % (event.x_root - drag["x"], event.y_root - drag["y"]))

        shell = tk.Frame(root, bg=c["panel"])
        shell.pack(fill="both", expand=True)
        bar = tk.Frame(shell, bg=c["panel"], height=28)
        bar.pack(fill="x")
        bar.pack_propagate(False)
        self.lamp = tk.Canvas(bar, width=14, height=14, highlightthickness=0, bd=0, bg=c["panel"])
        self.lamp.pack(side="left", padx=(10, 0))
        title = tk.Label(bar, text=tr(self.lang, "update_title"), font=FONT, bg=c["panel"], fg=c["ink"])
        title.pack(side="left", padx=8)
        for widget in (bar, title, self.lamp):
            widget.bind("<ButtonPress-1>", drag_start)
            widget.bind("<B1-Motion>", drag_move)
        body = tk.Frame(shell, bg=c["panel"], padx=12, pady=8)
        body.pack(fill="both", expand=True)
        self.lead = tk.Label(body, text=tr(self.lang, "update_lead", version=version), font=FONT, bg=c["panel"], fg=c["ink"], anchor="w")
        self.lead.pack(fill="x")
        self.canvas = tk.Canvas(body, width=436, height=132, highlightthickness=0, bd=0, bg=c["bg"])
        self.canvas.pack(fill="x", pady=(8, 0))
        self.meta = tk.Label(body, text=tr(self.lang, "update_unknown"), font=FONT, bg=c["panel"], fg=c["muted"], anchor="w")
        self.meta.pack(fill="x", pady=(6, 0))
        root.update_idletasks()
        width, height = 460, 214
        screen_w = root.winfo_screenwidth()
        screen_h = root.winfo_screenheight()
        root.geometry("%dx%d+%d+%d" % (
            width, height,
            max(0, (screen_w - width) // 2),
            max(24, (screen_h - height) // 3),
        ))
        hide_window_border(root, c["panel"])
        self._paint()
        root.after(33, self._loop)
        try:
            root.update()
            force_foreground(root)
        except tk.TclError:
            self.alive = False

    def set_progress(self, done, total):
        self.done = max(0, int(done or 0))
        self.total = max(0, int(total or 0))
        if self.total > 0:
            self.frac = max(0.0, min(1.0, self.done / self.total))
        self._sync_text()

    def set_phase(self, phase):
        self.phase = phase
        if phase == "swap":
            self.frac = 1.0
        self._sync_text()

    def pump(self):
        if not self.alive:
            return
        try:
            self.root.update()
        except tk.TclError:
            self.alive = False

    def close(self):
        self.alive = False
        try:
            self.root.destroy()
        except tk.TclError:
            pass

    def _sync_text(self):
        if not self.alive:
            return
        try:
            if self.phase == "swap":
                self.lead.configure(text=tr(self.lang, "update_swap"))
                self.meta.configure(text=self.version)
            elif self.total > 0:
                self.lead.configure(text=tr(self.lang, "update_lead", version=self.version))
                self.meta.configure(text=tr(self.lang, "update_bytes", done=_byte_text(self.done), total=_byte_text(self.total)))
            else:
                self.lead.configure(text=tr(self.lang, "update_lead", version=self.version))
                self.meta.configure(text=tr(self.lang, "update_unknown") + "  " + _byte_text(self.done))
        except tk.TclError:
            self.alive = False

    def _loop(self):
        if not self.alive:
            return
        self.tick += 1
        target = self.SLOTS if self.phase == "swap" else self.frac * self.SLOTS
        if self.total <= 0 and self.phase != "swap":
            target = (self.tick % 48) / 48 * self.SLOTS
        self.shown += (target - self.shown) * 0.22
        if abs(target - self.shown) < 0.02:
            self.shown = target
        try:
            self._paint()
            self.root.after(33, self._loop)
        except tk.TclError:
            self.alive = False

    def _paint(self):
        c = self.colors
        cv = self.canvas
        cv.delete("all")
        left, top, right, bottom = 8, 18, 428, 118
        cv.create_rectangle(left, top, right, bottom, outline=c["accent"], width=2)
        for edge in ((left, top), (right, top), (left, bottom), (right, bottom)):
            ox = -7 if edge[0] == left else 7
            oy = -7 if edge[1] == top else 7
            cv.create_line(edge[0], edge[1], edge[0] + ox, edge[1], fill=c["accent"], width=2)
            cv.create_line(edge[0], edge[1], edge[0], edge[1] + oy, fill=c["accent"], width=2)
        rib = (self.tick // 2) % 10
        x = left + 10
        while x < right - 16:
            shade = c["accent"] if (x // 14) % 10 == rib else c["line"]
            cv.create_line(x, top + 4, x, bottom - 4, fill=shade)
            x += 14
        door = right - 18
        cv.create_rectangle(door, top + 4, right - 4, bottom - 4, outline=c["accent"], fill=c["panel"])
        cv.create_line(door + 7, top + 10, door + 7, bottom - 10, fill=c["accent"])
        bay_w, bay_h, gap = 36, 44, 6
        home0 = left + 12
        seats = self.shown
        whole = int(seats)
        part = seats - whole
        for i in range(self.SLOTS):
            hx = home0 + i * (bay_w + gap)
            hy = top + 28
            if i < whole:
                self._crate(hx, hy, bay_w, bay_h, 1)
            elif i == whole and part > 0.01 and i < self.SLOTS:
                start = door - bay_w - 4
                self._crate(start + (hx - start) * part, hy - (1 - part) * 10, bay_w, bay_h, part)
        sweep = left + ((self.tick * 6) % (right - left - 8))
        cv.create_line(sweep, top + 2, sweep, bottom - 2, fill=c["accent"])
        self.lamp.delete("all")
        lit = c["accent"] if (self.tick // 8) % 2 == 0 else c["line"]
        self.lamp.create_oval(2, 2, 12, 12, outline=lit, fill=lit)

    def _crate(self, x, y, w, h, alpha):
        c = self.colors
        cv = self.canvas
        cv.create_rectangle(x, y, x + w, y + h, outline=c["accent"], fill=c["panel"], width=2)
        cv.create_line(x + 4, y + h * 0.45, x + w - 4, y + h * 0.45, fill=c["accent"])
        cv.create_line(x + w * 0.5, y + 4, x + w * 0.5, y + h - 4, fill=c["line"])
        if alpha < 0.95:
            cv.create_rectangle(x, y - 6, x + w, y - 2, outline=c["accent"], fill=c["bg"])


def open_update_progress(theme, lang, version):
    return UpdateProgress(theme, lang, version)


def open_window(core):
    lang = canon_lang(core.CFG.get("lang")) or windows_lang()
    theme = core.CFG.get("theme") if core.CFG.get("theme") in THEMES else "scifi"
    if not accept_terms(lang, theme, getattr(core, "VERSION", "")):
        return
    Desktop(core).run()
