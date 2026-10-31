# Personal timeline parsed from Game.log on this computer.
# Events stay in history.jsonl next to the program. They are not posted to a room.

import json
import re
import threading
from pathlib import Path

MAKER_NAME = {
    "AEGS": "Aegis", "ANVL": "Anvil", "CRUS": "Crusader", "MISC": "MISC",
    "ORIG": "Origin", "RSI": "RSI", "DRAK": "Drake", "BANU": "Banu",
    "XIAN": "Aopoa", "TMBL": "Tumbril", "GRIN": "Greycat", "KRIG": "Kruger",
    "CNOU": "Consolidated", "ESPR": "Esperia", "GAMA": "Gatac",
    "VNCL": "Vanduul", "MRAI": "Mirai",
}
BODY_N = {"1": "HUR", "2": "CRU", "3": "ARC", "4": "MIC"}
MISSION_PREFIX = ("已接受合约", "新任务", "任务完成")
KEEP = 4000

TIME_RE = re.compile(r"<(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)>")
SHIP_RE = re.compile(
    r"\b((?:AEGS|ANVL|CRUS|MISC|ORIG|RSI|DRAK|BANU|XIAN|TMBL|GRIN|KRIG|CNOU|ESPR|GAMA|VNCL|MRAI)(?:_[A-Za-z][A-Za-z0-9]*)+)_\d{6,}"
)
BUY_RE = re.compile(
    r"SendShop(Buy|Sell)Request\b.*?shopName\[([^\]]*)\].*?client_price\[([0-9.]+)\].*?itemName\[([^\]]*)\].*?quantity\[(\d+)\]"
)
FLOW_RE = re.compile(r"RmShopFlowResponse\b.*?result\[(\w+)\].*?type\[(Buying|Selling)\]")
NOTE_RE = re.compile(r'Notification "(.*?)"')
JUMP_RE = re.compile(r"Projected Start Location is (.+?) for .+? to destination (\S+)")
LAG_RE = re.compile(r"\bLOC_RR_S([1-4])_L(\d+)\b", re.I)
LAG_WORD = re.compile(r"\b(HUR|CRU|ARC|MIC)\s*[- ]?\s*L(\d+)\b", re.I)
TRANS = re.compile(
    r"Transitioning from zone [\w.-]+ in [\w.-]+ to zone ([\w.-]+) in [\w.-]+",
    re.I,
)
END_RE = re.compile(r"CompletionType\[(Complete|Abandon)\]")

LOCK = threading.Lock()
EVENTS = []
SEEN = set()
STORE = None


def new_state():
    return {"buy": None, "ship": "", "dest": "", "destKind": "", "destCode": ""}


LIVE = new_state()


def reset():
    global LIVE, EVENTS, SEEN, STORE
    with LOCK:
        LIVE = new_state()
        EVENTS = []
        SEEN = set()
        STORE = None


def open_store(path):
    global STORE, EVENTS, SEEN
    file = Path(path)
    rows = []
    seen = set()
    if file.is_file():
        try:
            for line in file.read_text(encoding="utf-8").splitlines():
                if not line.strip():
                    continue
                try:
                    row = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if isinstance(row, dict) and row.get("id"):
                    rows.append(row)
                    seen.add(row["id"])
        except OSError:
            rows = []
            seen = set()
    with LOCK:
        STORE = file
        EVENTS = rows[-KEEP:]
        SEEN = seen


def public(limit=400):
    with LOCK:
        rows = EVENTS[-limit:]
    out = []
    for row in reversed(rows):
        item = {k: v for k, v in row.items() if k != "id"}
        out.append(item)
    return out


def note(line, state=None):
    st = state if state is not None else LIVE
    if st is None:
        return []
    found = []
    for row in parse(line or "", st):
        sig = row["kind"] + "|" + json.dumps(
            {k: v for k, v in row.items() if k not in ("id", "t")},
            ensure_ascii=False, sort_keys=True,
        )
        if st.get("echo") == sig:
            continue
        st["echo"] = sig
        found.append(row)
    if found:
        remember(found)
    return found


def backfill(log_path):
    path = Path(log_path) if log_path else None
    files = []
    if path is not None:
        folder = path.parent / "logbackups"
        if folder.is_dir():
            try:
                files.extend(sorted(folder.glob("*.log"), key=lambda item: item.stat().st_mtime))
            except OSError:
                pass
        if path.is_file():
            files.append(path)
    state = new_state()
    count = 0
    for file in files:
        try:
            handle = file.open("r", encoding="utf-8", errors="replace")
        except OSError:
            continue
        with handle:
            for line in handle:
                count += len(note(line, state))
    return count


def remember(rows):
    global EVENTS, SEEN
    with LOCK:
        added = False
        for row in rows:
            if row["id"] in SEEN:
                continue
            SEEN.add(row["id"])
            EVENTS.append(row)
            added = True
            if STORE is not None:
                try:
                    with STORE.open("a", encoding="utf-8") as handle:
                        handle.write(json.dumps(row, ensure_ascii=False) + "\n")
                except OSError:
                    pass
        if added and len(EVENTS) > KEEP:
            EVENTS = EVENTS[-KEEP:]
            SEEN = {row["id"] for row in EVENTS}
            if STORE is not None:
                try:
                    STORE.write_text(
                        "".join(json.dumps(row, ensure_ascii=False) + "\n" for row in EVENTS),
                        encoding="utf-8",
                    )
                except OSError:
                    pass


def parse(line, state):
    when = TIME_RE.search(line)
    stamp = when.group(1) if when else ""
    rows = []
    if "Legacy login success" in line:
        rows.append(event(stamp, "online"))
    zone = TRANS.search(line)
    if zone:
        rows.append(event(stamp, "place", code=zone.group(1)))
    end = END_RE.search(line)
    if end and "EndMission" in line:
        rows.append(event(stamp, "contract", result=end.group(1).lower()))
    if "Action: Next" in line:
        note = NOTE_RE.search(line)
        if note:
            say = note.group(1).strip().rstrip(":：").strip()
            if say.startswith(MISSION_PREFIX):
                code, _label = code_in_text(say)
                rows.append(event(stamp, "mission", say=say[:180], code=code))
    buy = BUY_RE.search(line)
    if buy:
        kind = "buy" if buy.group(1).lower() == "buy" else "sell"
        try:
            price = float(buy.group(3))
        except ValueError:
            price = 0
        state["buy"] = {
            "t": stamp,
            "kind": kind,
            "shop": buy.group(2)[:80],
            "price": int(price) if price == int(price) else price,
            "item": buy.group(4)[:80],
            "qty": int(buy.group(5)),
        }
    flow = FLOW_RE.search(line)
    pending = state.get("buy")
    if flow and pending:
        result, flow_kind = flow.group(1), flow.group(2)
        same = (pending["kind"] == "buy" and flow_kind == "Buying") or (
            pending["kind"] == "sell" and flow_kind == "Selling"
        )
        if same and result == "Success":
            rows.append(event(
                pending["t"] or stamp,
                pending["kind"],
                shop=pending["shop"],
                price=pending["price"],
                item=pending["item"],
                qty=pending["qty"],
            ))
        state["buy"] = None
    if "CSCItemNavigation::" in line:
        found = SHIP_RE.search(line)
        ship = pretty_ship(found.group(1)) if found else ""
        if ship and ship != state.get("ship"):
            jumping = "Projected Start Location is " in line or "arrived at final destination" in line.lower()
            if not jumping:
                rows.append(event(stamp, "ship", ship=ship))
            state["ship"] = ship
        lag = LAG_RE.search(line)
        if lag and "selected point" in line.lower():
            code, label = lagrange(lag.group(1), lag.group(2))
            state["dest"], state["destKind"], state["destCode"] = label, "place", code
            rows.append(event(stamp, "aim", dest=label, destKind="place", code=code, ship=state.get("ship") or ""))
        jump = JUMP_RE.search(line)
        if jump:
            start = jump.group(1).strip()[:80]
            token = jump.group(2).strip(".,)")
            dest, dest_kind, dest_code = destination(token)
            state["dest"], state["destKind"], state["destCode"] = dest, dest_kind, dest_code
            rows.append(event(
                stamp, "jump",
                start=start, dest=dest, destKind=dest_kind,
                code=dest_code, ship=state.get("ship") or "",
            ))
        if "arrived at final destination" in line.lower():
            rows.append(event(
                stamp, "arrive",
                dest=state.get("dest") or "",
                destKind=state.get("destKind") or "",
                code=state.get("destCode") or "",
                ship=state.get("ship") or "",
            ))
    return rows


def destination(token):
    lag = LAG_RE.fullmatch(token)
    if lag:
        code, label = lagrange(lag.group(1), lag.group(2))
        return label, "place", code
    if token.startswith("MISSION_"):
        return "", "beacon", ""
    if "{" in token or ".soc" in token or "_" in token:
        return "", "raw", ""
    if token.startswith("OOC_"):
        return token.split("_")[-1][:80], "raw", ""
    return token[:80], "raw", ""


def lagrange(body, lag):
    name = BODY_N.get(str(body), str(body).upper())
    if name not in ("HUR", "CRU", "ARC", "MIC"):
        return "", ""
    return "RR_%s_L%s" % (name, lag), "%s-L%s" % (name, lag)


def code_in_text(text):
    found = LAG_WORD.search(text or "")
    if found:
        return lagrange(found.group(1).upper(), found.group(2))
    if "赫" in (text or ""):
        found = re.search(r"L(\d+)", text)
        if found:
            return lagrange("HUR", found.group(1))
    return "", ""


def pretty_ship(code):
    parts = code.split("_")
    if "SCItem" in parts:
        parts = parts[: parts.index("SCItem")]
    maker = MAKER_NAME.get(parts[0], parts[0])
    rest = parts[1:]
    if rest and len(rest[-1]) == 1:
        body = " ".join(rest[:-1]) + "-" + rest[-1]
    else:
        body = " ".join(rest)
    return (maker + " " + body).strip()


def event(stamp, kind, **fields):
    row = {"t": stamp, "kind": kind}
    row.update(fields)
    row["id"] = stamp + "|" + kind + "|" + json.dumps(fields, ensure_ascii=False, sort_keys=True)
    return row
