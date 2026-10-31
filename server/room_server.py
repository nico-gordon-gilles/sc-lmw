# Room server for SC LMW.
# Serves this site and /api/rooms. The site never reads the game folder.
# A player marks "I am here" by clicking a place on the map.
#
#   python server/room_server.py
#   then open http://127.0.0.1:8770/
#
#   python server/room_server.py --host 0.0.0.0
#   people on the same network open http://<this-computer>:8770/

import argparse
import json
import os
import secrets
import socket
import sqlite3
import threading
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent.parent
DB = Path(__file__).resolve().parent / "rooms.sqlite"
HOST = "127.0.0.1"
PORT = 8770
ALPH = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
# These stay on disk for local builds. The room site must not hand them out.
BLOCK_DIR = {"language", ".cache", ".git", ".test", "__pycache__", "server", "companion"}
BLOCK_EXT = {".sqlite", ".ini", ".pyc", ".spec"}
BLOCK_NAME = {"config.json"}
ONLINE_S = 600
OPEN_S = 300
# Captain absence follows room polls, not the ten-minute location dot.
CAPTAIN_GONE_S = 7 * 24 * 3600
POLL_LIVE_S = 120
LOCK = threading.Lock()

MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".md": "text/markdown; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".woff2": "font/woff2",
    ".webmanifest": "application/manifest+json",
}


def now():
    return time.time()


def iso(ts):
    return datetime.fromtimestamp(ts, timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def db():
    con = sqlite3.connect(DB, timeout=5)
    con.row_factory = sqlite3.Row
    return con


def init_db():
    with LOCK, db() as con:
        con.executescript(
            """
            CREATE TABLE IF NOT EXISTS member (
              id TEXT PRIMARY KEY,
              token TEXT UNIQUE NOT NULL,
              nickname TEXT NOT NULL,
              created REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS room (
              code TEXT PRIMARY KEY,
              captain TEXT NOT NULL,
              route_mode TEXT NOT NULL DEFAULT 'captain',
              created REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS membership (
              room TEXT NOT NULL,
              member TEXT NOT NULL,
              status TEXT NOT NULL,
              created REAL NOT NULL,
              PRIMARY KEY (room, member)
            );
            CREATE TABLE IF NOT EXISTS presence (
              room TEXT NOT NULL,
              member TEXT NOT NULL,
              location TEXT,
              system TEXT,
              code TEXT,
              seen REAL NOT NULL,
              PRIMARY KEY (room, member)
            );
            CREATE TABLE IF NOT EXISTS route (
              id TEXT PRIMARY KEY,
              room TEXT NOT NULL,
              author TEXT NOT NULL,
              title TEXT,
              note TEXT,
              points TEXT NOT NULL,
              published INTEGER NOT NULL DEFAULT 1,
              created REAL NOT NULL,
              updated REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS comment (
              id TEXT PRIMARY KEY,
              route TEXT NOT NULL,
              author TEXT NOT NULL,
              body TEXT NOT NULL,
              created REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS broadcast (
              id TEXT PRIMARY KEY,
              room TEXT NOT NULL,
              author TEXT NOT NULL,
              body TEXT NOT NULL,
              created REAL NOT NULL
            );
            """
        )
        cols = {row[1] for row in con.execute("PRAGMA table_info(presence)")}
        if "ship" not in cols:
            con.execute("ALTER TABLE presence ADD COLUMN ship TEXT")
        if "gear" not in cols:
            con.execute("ALTER TABLE presence ADD COLUMN gear TEXT")
        if "host" not in cols:
            con.execute("ALTER TABLE presence ADD COLUMN host TEXT")
        if "travel" not in cols:
            con.execute("ALTER TABLE presence ADD COLUMN travel TEXT")
        room_cols = {row[1] for row in con.execute("PRAGMA table_info(room)")}
        if "open" not in room_cols:
            con.execute("ALTER TABLE room ADD COLUMN open INTEGER NOT NULL DEFAULT 0")
        if "open_at" not in room_cols:
            con.execute("ALTER TABLE room ADD COLUMN open_at REAL NOT NULL DEFAULT 0")
        if "recover" not in room_cols:
            con.execute("ALTER TABLE room ADD COLUMN recover TEXT")
        mem_cols = {row[1] for row in con.execute("PRAGMA table_info(membership)")}
        if "touched" not in mem_cols:
            con.execute("ALTER TABLE membership ADD COLUMN touched REAL")
            con.execute("UPDATE membership SET touched=? WHERE touched IS NULL", (now(),))


def clean_nick(raw):
    s = "".join(ch for ch in str(raw or "") if ch >= " " and ch != "\x7f").strip()
    if not s or len(s) > 32:
        return None
    return s


def clean_cast(raw):
    s = " ".join(str(raw or "").replace("\r", " ").replace("\n", " ").split())
    s = "".join(ch for ch in s if ch >= " " and ch != "\x7f").strip()
    if not s:
        return None
    return s[:120]


def latest_cast(con, code):
    row = con.execute(
        """
        SELECT b.id, b.body, b.created, m.nickname
        FROM broadcast b JOIN member m ON m.id=b.author
        WHERE b.room=?
        ORDER BY b.created DESC
        LIMIT 1
        """,
        (code,),
    ).fetchone()
    if not row:
        return None
    return {"id": row["id"], "body": row["body"], "name": row["nickname"] or "", "at": row["created"]}


def new_code(con):
    for _ in range(20):
        raw = "".join(secrets.choice(ALPH) for _ in range(8))
        code = raw[:4] + "-" + raw[4:]
        if not con.execute("SELECT 1 FROM room WHERE code=?", (code,)).fetchone():
            return code
    raise RuntimeError("code")


def new_recover():
    raw = "".join(secrets.choice(ALPH) for _ in range(12))
    return raw[:4] + "-" + raw[4:8] + "-" + raw[8:]


def clean_recover(raw):
    chars = [ch for ch in str(raw or "").upper() if ch in ALPH]
    if len(chars) != 12:
        return ""
    raw = "".join(chars)
    return raw[:4] + "-" + raw[4:8] + "-" + raw[8:]


def touch_member(con, code, mid):
    con.execute(
        "UPDATE membership SET touched=? WHERE room=? AND member=?",
        (now(), code, mid),
    )


def earliest_member(con, code, skip):
    return con.execute(
        """
        SELECT member FROM membership
        WHERE room=? AND status='member' AND member!=?
        ORDER BY created LIMIT 1
        """,
        (code, skip or ""),
    ).fetchone()


def settle_room(con, code):
    """Hand the room on after the captain's browser has been gone for seven days.

    A room poll refreshes that clock. The ten-minute location flag does not.
    With other confirmed members, the earliest one becomes captain and the
    previous captain stays in the room. With nobody else, the room is removed.
    """
    room = con.execute("SELECT * FROM room WHERE code=?", (code,)).fetchone()
    if not room:
        return False
    cap = con.execute(
        """
        SELECT touched, created FROM membership
        WHERE room=? AND member=? AND status='member'
        """,
        (code, room["captain"]),
    ).fetchone()
    if not cap:
        other = earliest_member(con, code, room["captain"])
        if other:
            con.execute("UPDATE room SET captain=? WHERE code=?", (other["member"], code))
            return True
        wipe_room(con, code)
        return False
    stamp = cap["touched"] if cap["touched"] is not None else cap["created"]
    if stamp is None or now() - float(stamp) < CAPTAIN_GONE_S:
        return True
    other = earliest_member(con, code, room["captain"])
    if other:
        con.execute("UPDATE room SET captain=? WHERE code=?", (other["member"], code))
        return True
    wipe_room(con, code)
    return False


def ensure_recover(con, room):
    current = room["recover"] if "recover" in room.keys() else ""
    if current:
        return current
    secret = new_recover()
    con.execute("UPDATE room SET recover=? WHERE code=?", (secret, room["code"]))
    return secret


def bearer(header):
    h = header or ""
    if h.lower().startswith("bearer "):
        return h[7:].strip()
    return ""


def member_by_token(con, token):
    if not token:
        return None
    return con.execute("SELECT * FROM member WHERE token=?", (token,)).fetchone()


def gear_items(raw):
    if not raw:
        return []
    try:
        data = json.loads(raw)
    except (TypeError, json.JSONDecodeError):
        return []
    if not isinstance(data, list):
        return []
    out = []
    for item in data[:12]:
        if not isinstance(item, dict):
            continue
        port = str(item.get("port") or "")[:40]
        name = str(item.get("name") or "")[:80]
        cls = str(item.get("cls") or "")[:80]
        if port and name:
            row = {"port": port, "name": name}
            if cls:
                row["cls"] = cls
            out.append(row)
    return out


def clean_gear(raw):
    return json.dumps(gear_items(json.dumps(raw if isinstance(raw, list) else [])), ensure_ascii=False)


def clean_host(raw):
    return "".join(ch for ch in str(raw or "") if ch.isalnum() or ch in "_-")[:80]


def clean_travel(raw):
    if not isinstance(raw, dict):
        return ""
    mode = raw.get("mode")
    if mode not in ("aim", "jump"):
        return ""

    def clip(key):
        text = "".join(ch for ch in str(raw.get(key) or "") if ch >= " " and ch != "\x7f").strip()
        return text[:80]

    out = {"mode": mode, "from": clip("from"), "to": clip("to"), "to_raw": clip("to_raw")}
    if not out["to"] and not out["to_raw"]:
        return ""
    return json.dumps(out, ensure_ascii=False, separators=(",", ":"))


def travel_obj(raw):
    if not raw:
        return None
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except (TypeError, json.JSONDecodeError):
            return None
    text = clean_travel(raw)
    if not text:
        return None
    return json.loads(text)


def save_presence(con, room, member, body):
    loc = str(body.get("location") or "")[:80]
    sys = str(body.get("system") or "")[:40]
    code_loc = str(body.get("code") or "")[:80]
    if not loc and not code_loc:
        return False
    old = con.execute(
        "SELECT ship, gear, host, travel FROM presence WHERE room=? AND member=?",
        (room, member),
    ).fetchone()
    if "ship" in body:
        ship_name = str(body.get("ship") or "")[:80]
    else:
        ship_name = (old["ship"] if old and old["ship"] else "") or ""
    if "gear" in body:
        worn = clean_gear(body.get("gear"))
    else:
        worn = (old["gear"] if old and old["gear"] else "") or "[]"
    if "server" in body:
        host_id = clean_host(body.get("server"))
    else:
        host_id = (old["host"] if old and old["host"] else "") or ""
    if "travel" in body:
        travel = clean_travel(body.get("travel")) if isinstance(body.get("travel"), dict) else ""
    else:
        travel = (old["travel"] if old and old["travel"] else "") or ""
    con.execute(
        """
        INSERT INTO presence (room, member, location, system, code, seen, ship, gear, host, travel)
        VALUES (?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(room, member) DO UPDATE SET
          location=excluded.location, system=excluded.system,
          code=excluded.code, seen=excluded.seen,
          ship=excluded.ship, gear=excluded.gear,
          host=excluded.host, travel=excluded.travel
        """,
        (room, member, loc, sys, code_loc, now(), ship_name, worn, host_id, travel),
    )
    return True


def room_state(con, code, me):
    room = con.execute("SELECT * FROM room WHERE code=?", (code,)).fetchone()
    if not room:
        return None
    ship = con.execute(
        "SELECT * FROM membership WHERE room=? AND member=?", (code, me["id"])
    ).fetchone()
    if not ship:
        return {"error": "forbidden"}
    if ship["status"] == "rejected":
        return {"error": "rejected"}
    role = "captain" if room["captain"] == me["id"] else "member"
    rows = con.execute(
        """
        SELECT m.id, m.nickname, s.status, p.location, p.system, p.code, p.seen, p.ship, p.gear, p.host, p.travel
        FROM membership s
        JOIN member m ON m.id = s.member
        LEFT JOIN presence p ON p.room = s.room AND p.member = s.member
        WHERE s.room=?
        ORDER BY s.created
        """,
        (code,),
    ).fetchall()
    members = []
    for r in rows:
        if r["status"] != "member" and role != "captain":
            continue
        if r["status"] == "rejected":
            continue
        members.append(
            {
                "id": r["id"],
                "nickname": r["nickname"],
                "status": r["status"],
                "location": r["location"] or "",
                "system": r["system"] or "",
                "code": r["code"] or "",
                "seen": int(r["seen"]) if r["seen"] else None,
                "ship": r["ship"] or "",
                "gear": gear_items(r["gear"]),
                "server": r["host"] or "",
                "travel": travel_obj(r["travel"]),
                "online": bool(r["seen"] and now() - r["seen"] < ONLINE_S),
            }
        )
    routes = []
    if ship["status"] == "member":
        for rt in con.execute(
            "SELECT * FROM route WHERE room=? AND published=1 ORDER BY updated DESC",
            (code,),
        ):
            comments = []
            for c in con.execute(
                """
                SELECT c.id, c.body, c.created, m.nickname
                FROM comment c JOIN member m ON m.id=c.author
                WHERE c.route=? ORDER BY c.created
                """,
                (rt["id"],),
            ):
                comments.append(
                    {"id": c["id"], "authorName": c["nickname"], "body": c["body"]}
                )
            author = con.execute(
                "SELECT nickname FROM member WHERE id=?", (rt["author"],)
            ).fetchone()
            routes.append(
                {
                    "id": rt["id"],
                    "author": rt["author"],
                    "authorName": author["nickname"] if author else "",
                    "title": rt["title"] or "",
                    "note": rt["note"] or "",
                    "points": json.loads(rt["points"] or "[]"),
                    "comments": comments,
                }
            )
    state = {
        "code": code,
        "role": role,
        "captain": room["captain"],
        "status": ship["status"],
        "me": {"id": me["id"], "nickname": me["nickname"]},
        "routeMode": room["route_mode"],
        "open": room_is_open(room),
        "openWait": open_wait(room),
        "members": members,
        "routes": routes,
        "cast": latest_cast(con, code),
    }
    if role == "captain" and ship["status"] == "member":
        state["recover"] = ensure_recover(con, room)
    return state


def room_is_open(room):
    try:
        return int(room["open"] or 0) == 1
    except (KeyError, IndexError, TypeError, ValueError):
        return False


def open_wait(room):
    try:
        at = float(room["open_at"] or 0)
    except (KeyError, IndexError, TypeError, ValueError):
        return 0
    if at <= 0:
        return 0
    left = int(at + OPEN_S - now() + 0.999)
    return left if left > 0 else 0


def want_open(raw):
    if isinstance(raw, bool):
        return raw
    if raw in (0, 1):
        return bool(raw)
    if isinstance(raw, str) and raw.lower() in ("1", "true", "public"):
        return True
    if isinstance(raw, str) and raw.lower() in ("0", "false", "private"):
        return False
    return None


def set_room_open(con, room, want):
    want_i = 1 if want else 0
    if want_i == (1 if room_is_open(room) else 0):
        return None
    wait = open_wait(room)
    if wait > 0:
        return {"error": "cooldown", "wait": wait}
    con.execute(
        "UPDATE room SET open=?, open_at=? WHERE code=?",
        (want_i, now(), room["code"]),
    )
    if want_i:
        con.execute(
            "UPDATE membership SET status='member' WHERE room=? AND status='pending'",
            (room["code"],),
        )
    return None


def join_status(room, me, existing):
    if room["captain"] == me["id"] or (existing and existing["status"] == "member") or room_is_open(room):
        return "member"
    return "pending"


def public_rooms(con):
    for row in con.execute("SELECT code FROM room WHERE open=1"):
        settle_room(con, row["code"])
    rows = con.execute(
        """
        SELECT r.code,
               (SELECT nickname FROM member WHERE id=r.captain) AS captain,
               (SELECT COUNT(*) FROM membership s WHERE s.room=r.code AND s.status='member') AS members
        FROM room r
        WHERE r.open=1
        ORDER BY members DESC, r.created ASC
        LIMIT 100
        """
    ).fetchall()
    return [
        {"code": r["code"], "captain": r["captain"] or "", "members": int(r["members"])}
        for r in rows
    ]


def room_brief(con, code):
    if not settle_room(con, code):
        return {"code": code, "exists": False, "online": 0, "members": 0}
    room = con.execute("SELECT code FROM room WHERE code=?", (code,)).fetchone()
    if not room:
        return {"code": code, "exists": False, "online": 0, "members": 0}
    members = con.execute(
        "SELECT COUNT(*) AS n FROM membership WHERE room=? AND status='member'",
        (code,),
    ).fetchone()["n"]
    online = con.execute(
        """
        SELECT COUNT(*) AS n FROM membership s
        JOIN presence p ON p.room=s.room AND p.member=s.member
        WHERE s.room=? AND s.status='member' AND p.seen>?
        """,
        (code, now() - ONLINE_S),
    ).fetchone()["n"]
    return {"code": code, "exists": True, "online": int(online), "members": int(members)}


def release_other_rooms(con, me, keep=None):
    rows = con.execute(
        "SELECT room, status FROM membership WHERE member=? AND status!='rejected'",
        (me["id"],),
    ).fetchall()
    for row in rows:
        code = row["room"]
        if keep and code == keep:
            continue
        room = con.execute("SELECT captain FROM room WHERE code=?", (code,)).fetchone()
        if not room:
            drop_member(con, code, me["id"])
            continue
        if room["captain"] == me["id"] and row["status"] == "member":
            other = con.execute(
                """
                SELECT member FROM membership
                WHERE room=? AND status='member' AND member!=?
                ORDER BY created LIMIT 1
                """,
                (code, me["id"]),
            ).fetchone()
            if other:
                con.execute("UPDATE room SET captain=? WHERE code=?", (other["member"], code))
                drop_member(con, code, me["id"])
            else:
                wipe_room(con, code)
        else:
            drop_member(con, code, me["id"])


def wipe_room(con, code):
    for rt in con.execute("SELECT id FROM route WHERE room=?", (code,)):
        con.execute("DELETE FROM comment WHERE route=?", (rt["id"],))
    con.execute("DELETE FROM route WHERE room=?", (code,))
    con.execute("DELETE FROM presence WHERE room=?", (code,))
    con.execute("DELETE FROM broadcast WHERE room=?", (code,))
    con.execute("DELETE FROM membership WHERE room=?", (code,))
    con.execute("DELETE FROM room WHERE code=?", (code,))


def drop_member(con, code, mid):
    con.execute("DELETE FROM presence WHERE room=? AND member=?", (code, mid))
    con.execute("DELETE FROM membership WHERE room=? AND member=?", (code, mid))
    left = con.execute(
        "SELECT 1 FROM membership WHERE room=? AND status='member'", (code,)
    ).fetchone()
    if left:
        return False
    wipe_room(con, code)
    return True


def players_json(con, code, me):
    st = room_state(con, code, me)
    if not st or st.get("error") or st.get("status") != "member":
        return None
    out = []
    for m in st["members"]:
        if m["status"] != "member":
            continue
        seen = con.execute(
            "SELECT seen FROM presence WHERE room=? AND member=?", (code, m["id"])
        ).fetchone()
        if not seen:
            continue
        out.append(
            {
                "id": m["id"],
                "name": m["nickname"],
                "online": m["online"],
                "last_seen": iso(seen["seen"]),
                "when": iso(seen["seen"]),
                "code": m["code"],
                "location": m["location"],
                "system": m["system"],
                "ship": m.get("ship") or None,
                "gear": m.get("gear") or [],
                "server": m.get("server") or "",
                "travel": m.get("travel"),
            }
        )
    return {"players": out}


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):
        return

    def _cors(self):
        origin = self.headers.get("Origin")
        if not origin:
            return
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")

    def send_json(self, code, obj):
        raw = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self._cors()
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Content-Length", "0")
        self._cors()
        self.end_headers()

    def read_json(self):
        try:
            n = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            return {}
        if n <= 0 or n > 200_000:
            return {}
        try:
            return json.loads(self.rfile.read(n).decode("utf-8"))
        except Exception:
            return {}

    def me(self, con):
        return member_by_token(con, bearer(self.headers.get("Authorization")))

    def do_GET(self):
        path = unquote(urlparse(self.path).path)
        if path == "/api/health":
            self.send_json(200, {"ok": True})
            return
        if path.startswith("/api/"):
            self.api_get(path)
            return
        self.static(path)

    def do_POST(self):
        path = unquote(urlparse(self.path).path)
        if not path.startswith("/api/"):
            self.send_json(404, {"error": "not found"})
            return
        body = self.read_json()
        parts = [p for p in path.split("/") if p]
        with LOCK, db() as con:
            me = self.me(con)
            if parts == ["api", "session"]:
                nick = clean_nick(body.get("nickname"))
                if not nick:
                    self.send_json(400, {"error": "nickname"})
                    return
                if me:
                    con.execute("UPDATE member SET nickname=? WHERE id=?", (nick, me["id"]))
                    token = me["token"]
                    mid = me["id"]
                else:
                    token = secrets.token_hex(24)
                    mid = secrets.token_hex(8)
                    con.execute(
                        "INSERT INTO member (id, token, nickname, created) VALUES (?,?,?,?)",
                        (mid, token, nick, now()),
                    )
                self.send_json(200, {"token": token, "id": mid, "nickname": nick})
                return
            if not me:
                self.send_json(401, {"error": "auth"})
                return
            if parts == ["api", "rooms", "lookup"]:
                raw = body.get("codes") if isinstance(body, dict) else None
                if not isinstance(raw, list):
                    raw = []
                codes = []
                seen = set()
                for item in raw[:90]:
                    code = "".join(ch for ch in str(item or "").upper() if ch.isalnum() or ch == "-")[:12]
                    if code and code not in seen:
                        seen.add(code)
                        codes.append(code)
                self.send_json(200, {"rooms": [room_brief(con, code) for code in codes]})
                return
            if parts == ["api", "rooms"]:
                release_other_rooms(con, me)
                code = new_code(con)
                stamp = now()
                con.execute(
                    "INSERT INTO room (code, captain, route_mode, created, recover) VALUES (?,?,?,?,?)",
                    (code, me["id"], "captain", stamp, new_recover()),
                )
                con.execute(
                    "INSERT INTO membership (room, member, status, created, touched) VALUES (?,?,?,?,?)",
                    (code, me["id"], "member", stamp, stamp),
                )
                self.send_json(200, room_state(con, code, me))
                return
            if len(parts) == 4 and parts[0] == "api" and parts[1] == "rooms" and parts[3] == "join":
                code = parts[2].upper()
                if not settle_room(con, code):
                    self.send_json(404, {"error": "room"})
                    return
                room = con.execute("SELECT * FROM room WHERE code=?", (code,)).fetchone()
                if not room:
                    self.send_json(404, {"error": "room"})
                    return
                release_other_rooms(con, me, keep=code)
                existing = con.execute(
                    "SELECT status FROM membership WHERE room=? AND member=?",
                    (code, me["id"]),
                ).fetchone()
                status = join_status(room, me, existing)
                stamp = now()
                con.execute(
                    """
                    INSERT INTO membership (room, member, status, created, touched) VALUES (?,?,?,?,?)
                    ON CONFLICT(room, member) DO UPDATE SET
                      status=excluded.status, touched=excluded.touched
                    """,
                    (code, me["id"], status, stamp, stamp),
                )
                self.send_json(200, room_state(con, code, me))
                return
            if len(parts) == 4 and parts[0] == "api" and parts[1] == "rooms" and parts[3] == "recover":
                code = parts[2].upper()
                if not settle_room(con, code):
                    self.send_json(404, {"error": "room"})
                    return
                room = con.execute("SELECT * FROM room WHERE code=?", (code,)).fetchone()
                if not room:
                    self.send_json(404, {"error": "room"})
                    return
                secret = clean_recover(body.get("recover"))
                stored = room["recover"] or ""
                if (
                    not secret
                    or not stored
                    or len(secret) != len(stored)
                    or not secrets.compare_digest(secret, stored)
                ):
                    self.send_json(403, {"error": "recover"})
                    return
                if room["captain"] != me["id"]:
                    release_other_rooms(con, me, keep=code)
                    old_id = room["captain"]
                    old = con.execute(
                        "SELECT touched FROM membership WHERE room=? AND member=? AND status='member'",
                        (code, old_id),
                    ).fetchone()
                    stamp = now()
                    con.execute(
                        """
                        INSERT INTO membership (room, member, status, created, touched) VALUES (?,?,?,?,?)
                        ON CONFLICT(room, member) DO UPDATE SET
                          status='member', touched=excluded.touched
                        """,
                        (code, me["id"], "member", stamp, stamp),
                    )
                    con.execute("UPDATE room SET captain=? WHERE code=?", (me["id"], code))
                    if old and old_id != me["id"]:
                        idle_for = now() - float(old["touched"] or 0)
                        if idle_for > POLL_LIVE_S:
                            drop_member(con, code, old_id)
                self.send_json(200, room_state(con, code, me))
                return
            if (
                len(parts) == 6
                and parts[:2] == ["api", "rooms"]
                and parts[3] == "members"
            ):
                code, mid, action = parts[2].upper(), parts[4], parts[5]
                room = con.execute("SELECT * FROM room WHERE code=?", (code,)).fetchone()
                if not room or room["captain"] != me["id"]:
                    self.send_json(403, {"error": "captain"})
                    return
                if action == "kick":
                    if mid == me["id"]:
                        self.send_json(400, {"error": "member"})
                        return
                    row = con.execute(
                        """
                        SELECT member FROM membership
                        WHERE room=? AND member=? AND status='member'
                        """,
                        (code, mid),
                    ).fetchone()
                    if not row:
                        self.send_json(404, {"error": "member"})
                        return
                    drop_member(con, code, mid)
                    self.send_json(200, room_state(con, code, me))
                    return
                if action not in ("approve", "reject"):
                    self.send_json(400, {"error": "action"})
                    return
                status = "member" if action == "approve" else "rejected"
                cur = con.execute(
                    "UPDATE membership SET status=? WHERE room=? AND member=? AND member!=?",
                    (status, code, mid, me["id"]),
                )
                if cur.rowcount == 0:
                    self.send_json(404, {"error": "member"})
                    return
                self.send_json(200, room_state(con, code, me))
                return
            if len(parts) == 4 and parts[3] in ("leave", "captain", "dissolve"):
                code = parts[2].upper()
                room = con.execute("SELECT * FROM room WHERE code=?", (code,)).fetchone()
                ship = con.execute(
                    "SELECT status FROM membership WHERE room=? AND member=?",
                    (code, me["id"]),
                ).fetchone()
                if not room or not ship or ship["status"] == "rejected":
                    self.send_json(404, {"error": "room"})
                    return
                kind = parts[3]
                if kind == "dissolve":
                    if room["captain"] != me["id"]:
                        self.send_json(403, {"error": "captain"})
                        return
                    wipe_room(con, code)
                    self.send_json(200, {"dissolved": True})
                    return
                if kind == "captain":
                    if room["captain"] != me["id"] or ship["status"] != "member":
                        self.send_json(403, {"error": "captain"})
                        return
                    target = str(body.get("member") or "")
                    row = con.execute(
                        """
                        SELECT member FROM membership
                        WHERE room=? AND member=? AND status='member' AND member!=?
                        """,
                        (code, target, me["id"]),
                    ).fetchone()
                    if not row:
                        self.send_json(404, {"error": "member"})
                        return
                    con.execute("UPDATE room SET captain=? WHERE code=?", (target, code))
                    self.send_json(200, room_state(con, code, me))
                    return
                if ship["status"] != "member":
                    drop_member(con, code, me["id"])
                    self.send_json(200, {"left": True})
                    return
                if room["captain"] != me["id"]:
                    gone = drop_member(con, code, me["id"])
                    self.send_json(200, {"left": True, "dissolved": gone})
                    return
                if body.get("dissolve"):
                    wipe_room(con, code)
                    self.send_json(200, {"dissolved": True})
                    return
                target = str(body.get("transfer") or "")
                if target:
                    row = con.execute(
                        """
                        SELECT member FROM membership
                        WHERE room=? AND member=? AND status='member' AND member!=?
                        """,
                        (code, target, me["id"]),
                    ).fetchone()
                    if not row:
                        self.send_json(404, {"error": "member"})
                        return
                    con.execute("UPDATE room SET captain=? WHERE code=?", (target, code))
                    drop_member(con, code, me["id"])
                    self.send_json(200, {"left": True})
                    return
                others = con.execute(
                    """
                    SELECT member FROM membership
                    WHERE room=? AND status='member' AND member!=?
                    """,
                    (code, me["id"]),
                ).fetchone()
                self.send_json(409, {"error": "handoff" if others else "solo"})
                return
            if len(parts) == 4 and parts[3] == "open":
                code = parts[2].upper()
                room = con.execute("SELECT * FROM room WHERE code=?", (code,)).fetchone()
                if not room or room["captain"] != me["id"]:
                    self.send_json(403, {"error": "captain"})
                    return
                want = want_open(body.get("open") if isinstance(body, dict) else None)
                if want is None:
                    self.send_json(400, {"error": "open"})
                    return
                blocked = set_room_open(con, room, want)
                if blocked:
                    self.send_json(429, blocked)
                    return
                self.send_json(200, room_state(con, code, me))
                return
            if len(parts) == 4 and parts[3] == "settings":
                code = parts[2].upper()
                room = con.execute("SELECT * FROM room WHERE code=?", (code,)).fetchone()
                if not room or room["captain"] != me["id"]:
                    self.send_json(403, {"error": "captain"})
                    return
                mode = body.get("routeMode")
                if mode not in ("captain", "members"):
                    self.send_json(400, {"error": "mode"})
                    return
                con.execute("UPDATE room SET route_mode=? WHERE code=?", (mode, code))
                self.send_json(200, room_state(con, code, me))
                return
            if len(parts) == 4 and parts[3] == "broadcast":
                code = parts[2].upper()
                room = con.execute("SELECT * FROM room WHERE code=?", (code,)).fetchone()
                ship = con.execute(
                    "SELECT status FROM membership WHERE room=? AND member=?",
                    (code, me["id"]),
                ).fetchone()
                if not room or not ship or ship["status"] != "member" or room["captain"] != me["id"]:
                    self.send_json(403, {"error": "captain"})
                    return
                text = clean_cast(body.get("body") if isinstance(body, dict) else None)
                if not text:
                    self.send_json(400, {"error": "empty"})
                    return
                bid = secrets.token_hex(8)
                con.execute(
                    "INSERT INTO broadcast (id, room, author, body, created) VALUES (?,?,?,?,?)",
                    (bid, code, me["id"], text, now()),
                )
                con.execute(
                    "DELETE FROM broadcast WHERE room=? AND id!=?",
                    (code, bid),
                )
                self.send_json(200, room_state(con, code, me))
                return
            if len(parts) == 4 and parts[3] == "presence":
                code = parts[2].upper()
                st = room_state(con, code, me)
                if not st or st.get("error") or st.get("status") != "member":
                    self.send_json(403, {"error": "forbidden"})
                    return
                if not save_presence(con, code, me["id"], body):
                    self.send_json(400, {"error": "location"})
                    return
                self.send_json(200, {"ok": True})
                return
            if len(parts) == 4 and parts[3] == "routes":
                code = parts[2].upper()
                if not self.can_draw(con, code, me):
                    self.send_json(403, {"error": "route"})
                    return
                pts = self.clean_points(body.get("points"))
                if len(pts) < 2:
                    self.send_json(400, {"error": "points"})
                    return
                rid = secrets.token_hex(8)
                con.execute(
                    """
                    INSERT INTO route (id, room, author, title, note, points, published, created, updated)
                    VALUES (?,?,?,?,?,?,1,?,?)
                    """,
                    (
                        rid,
                        code,
                        me["id"],
                        str(body.get("title") or "")[:40],
                        str(body.get("note") or "")[:500],
                        json.dumps(pts, ensure_ascii=False),
                        now(),
                        now(),
                    ),
                )
                self.send_json(200, room_state(con, code, me))
                return
            if len(parts) == 6 and parts[3] == "routes" and parts[5] == "comments":
                code, rid = parts[2].upper(), parts[4]
                st = room_state(con, code, me)
                if not st or st.get("status") != "member":
                    self.send_json(403, {"error": "forbidden"})
                    return
                text = "".join(ch for ch in str(body.get("body") or "") if ch >= " ").strip()
                if not text or len(text) > 300:
                    self.send_json(400, {"error": "body"})
                    return
                rt = con.execute(
                    "SELECT id FROM route WHERE id=? AND room=? AND published=1", (rid, code)
                ).fetchone()
                if not rt:
                    self.send_json(404, {"error": "route"})
                    return
                con.execute(
                    "INSERT INTO comment (id, route, author, body, created) VALUES (?,?,?,?,?)",
                    (secrets.token_hex(8), rid, me["id"], text, now()),
                )
                self.send_json(200, room_state(con, code, me))
                return
        self.send_json(404, {"error": "not found"})

    def do_DELETE(self):
        path = unquote(urlparse(self.path).path)
        parts = [p for p in path.split("/") if p]
        if not (len(parts) == 5 and parts[:2] == ["api", "rooms"] and parts[3] == "routes"):
            self.send_json(404, {"error": "not found"})
            return
        code, rid = parts[2].upper(), parts[4]
        with LOCK, db() as con:
            me = self.me(con)
            if not me:
                self.send_json(401, {"error": "auth"})
                return
            room = con.execute("SELECT * FROM room WHERE code=?", (code,)).fetchone()
            rt = con.execute(
                "SELECT * FROM route WHERE id=? AND room=?", (rid, code)
            ).fetchone()
            if not room or not rt:
                self.send_json(404, {"error": "route"})
                return
            if rt["author"] != me["id"] and room["captain"] != me["id"]:
                self.send_json(403, {"error": "forbidden"})
                return
            con.execute("DELETE FROM comment WHERE route=?", (rid,))
            con.execute("DELETE FROM route WHERE id=?", (rid,))
            self.send_json(200, room_state(con, code, me))

    def api_get(self, path):
        parts = [p for p in path.split("/") if p]
        if parts == ["api", "rooms", "public"]:
            with LOCK, db() as con:
                self.send_json(200, {"rooms": public_rooms(con)})
            return
        with LOCK, db() as con:
            me = self.me(con)
            if not me:
                self.send_json(401, {"error": "auth"})
                return
            if len(parts) == 3 and parts[:2] == ["api", "rooms"]:
                code = parts[2].upper()
                touch_member(con, code, me["id"])
                if not settle_room(con, code):
                    self.send_json(404, {"error": "room"})
                    return
                st = room_state(con, code, me)
                if not st:
                    self.send_json(404, {"error": "room"})
                elif st.get("error"):
                    self.send_json(403, st)
                else:
                    self.send_json(200, st)
                return
            if len(parts) == 4 and parts[3] == "players":
                data = players_json(con, parts[2].upper(), me)
                if data is None:
                    self.send_json(403, {"error": "forbidden"})
                else:
                    self.send_json(200, data)
                return
        self.send_json(404, {"error": "not found"})

    def can_draw(self, con, code, me):
        room = con.execute("SELECT * FROM room WHERE code=?", (code,)).fetchone()
        ship = con.execute(
            "SELECT status FROM membership WHERE room=? AND member=?", (code, me["id"])
        ).fetchone()
        if not room or not ship or ship["status"] != "member":
            return False
        if room["route_mode"] == "members":
            return True
        return room["captain"] == me["id"]

    def clean_points(self, raw):
        if not isinstance(raw, list):
            return []
        out = []
        for p in raw[:40]:
            if not isinstance(p, dict):
                continue
            pid = str(p.get("id") or "")[:80]
            name = str(p.get("n") or "")[:80]
            sy = str(p.get("sy") or "")[:40]
            if pid and name:
                out.append({"id": pid, "n": name, "sy": sy})
        return out

    def static(self, path):
        rel = path.lstrip("/") or "index.html"
        if rel.endswith("/"):
            rel += "index.html"
        target = (ROOT / rel).resolve()
        if ROOT not in target.parents and target != ROOT:
            self.send_error(403)
            return
        try:
            parts = target.relative_to(ROOT).parts
        except ValueError:
            self.send_error(403)
            return
        if (parts and parts[0].lower() in BLOCK_DIR) or target.suffix.lower() in BLOCK_EXT or target.name.lower() in BLOCK_NAME or target.name.startswith("."):
            self.send_error(404)
            return
        if not target.is_file() or target == DB or "rooms.sqlite" in target.name:
            self.send_error(404)
            return
        data = target.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", MIME.get(target.suffix.lower(), "application/octet-stream"))
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(data)


def lan_ip():
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.connect(("8.8.8.8", 80))
        ip = sock.getsockname()[0]
        sock.close()
        return ip
    except OSError:
        return ""


def main():
    env_port = os.environ.get("PORT")
    ap = argparse.ArgumentParser(description="Serve SC LMW and team rooms")
    ap.add_argument("--host", default="0.0.0.0" if env_port else HOST)
    ap.add_argument("--port", type=int, default=int(env_port or PORT))
    args = ap.parse_args()
    init_db()
    ThreadingHTTPServer.allow_reuse_address = True
    httpd = ThreadingHTTPServer((args.host, args.port), Handler)
    print("SC LMW  port %d" % args.port)
    if args.host in ("0.0.0.0", "::") and not env_port:
        ip = lan_ip()
        if ip and not ip.startswith("127."):
            print("same network  http://%s:%d/" % (ip, args.port))
    httpd.serve_forever()


if __name__ == "__main__":
    main()
