#!/usr/bin/env python3
# Baut data/loc.json (englischer Anzeigename -> zh-Hans/zh-Hant) und data/loc-keys.json
# (INI-Schluessel -> [Rang, englischer Text]) aus Language/*/global.ini und labels.json.
#
# Builds data/loc.json (English display string -> zh-Hans/zh-Hant) and data/loc-keys.json
# (INI key -> [rank, English text]) from Language/*/global.ini plus the datamined labels.json.
import json
import os
import re
import sys
from pathlib import Path

import _common as C

ROOT = Path(__file__).resolve().parents[1]
LANG = ROOT / "Language"
LABELS = ROOT / ".cache" / "scunpacked-data" / "labels.json"
DATA = C.cli_path(C.DATA_DIR)

# Same maker spelling companion/app.py uses when it turns a class id into a label.
PRETTY_MAKER = {
    "AEGS": "Aegis", "ANVL": "Anvil", "CRUS": "Crusader", "MISC": "MISC",
    "ORIG": "Origin", "RSI": "RSI", "DRAK": "Drake", "BANU": "Banu",
    "XIAN": "Aopoa", "TMBL": "Tumbril", "GRIN": "Greycat", "KRIG": "Kruger",
    "CNOU": "Consolidated", "ESPR": "Esperia", "GAMA": "Gatac",
    "VNCL": "Vanduul", "MRAI": "Mirai",
}

MAKERS = sorted([
    "Roberts Space Industries", "Consolidated Outland", "Drake Interplanetary",
    "Musashi Industrial & Starflight Concern", "Origin Jumpworks", "Aegis Dynamics",
    "Anvil Aerospace", "Crusader Industries", "Kruger Intergalactic", "Esperia",
    "Banu", "MISC", "RSI", "Drake", "Origin", "Anvil", "Aegis", "Crusader", "Argo",
    "Greycat", "Tumbril", "Mirai", "Gatac", "C.O.", "CO",
], key=len, reverse=True)

BAD = re.compile(r"(RepUI|Journal|Objective|Waypoint|Conversation|Fluff|Subtitle)", re.I)


def score(key):
    kl = key.split(",")[0]
    low = kl.lower()
    if BAD.search(kl) or kl.startswith(("mission_", "Event_", "Human_", "dfm_", "scan_")):
        return 80
    if low.endswith("_desc") or kl.endswith("_Desc") or kl.startswith("item_Desc"):
        return 24
    if "desc" in low:
        return 70
    if kl.startswith("vehicle_Name") and kl.endswith("_short"):
        return 1
    if kl.startswith("vehicle_Name"):
        return 2
    if kl.startswith("item_Name"):
        return 3
    if re.match(r"^(Stanton|Pyro|Nyx)(\d|Star|$)", kl) and "Jump" not in kl:
        return 4
    if kl.startswith(("ui_pregame_port_", "items_commodities_", "mineable")):
        return 5
    if re.match(r"^(Stanton|Pyro|Nyx|Terra)", kl) and "Jump" not in kl:
        return 6
    if re.match(r"^[A-Za-z0-9]+$", kl) and len(kl) <= 48:
        return 8
    if len(kl) <= 64 and not kl.startswith(("ea_", "text_", "ui_", "pu_")):
        return 15
    return 40


def load_ini(path):
    out = {}
    with open(path, encoding="utf-8-sig") as f:
        for line in f:
            line = line.strip()
            if not line or line[0] in ";#[" or "=" not in line:
                continue
            k, v = line.split("=", 1)
            k, v = k.strip(), v.replace("\\n", "\n").strip()
            if k and v:
                out[k] = v
    return out


def walk_strings(node, bag):
    if isinstance(node, dict):
        for k, v in node.items():
            if k in ("n", "d", "ty", "g", "t", "co", "cat", "rock", "ore") and isinstance(v, str):
                bag.add(v.strip())
            elif k in ("t", "am") and isinstance(v, list):
                for x in v:
                    if isinstance(x, str):
                        bag.add(x.strip())
            else:
                walk_strings(v, bag)
    elif isinstance(node, list):
        for x in node:
            walk_strings(x, bag)


def item_class(key):
    base = key.split(",")[0]
    low = base.lower()
    mark = "item_name_"
    if low.startswith(mark):
        return base[len(mark):]
    return ""


def pretty_class(code):
    parts = [p for p in code.split("_") if p]
    while parts and parts[-1].isdigit():
        parts.pop()
    if not parts:
        return ""
    maker = PRETTY_MAKER.get(parts[0].upper(), parts[0].upper())
    rest = " ".join(p.capitalize() for p in parts[1:])
    return (maker + " " + rest).strip()


def loose_class(label):
    return " ".join(p for p in label.split() if not p.isdigit())


def ini_get(table, key):
    if key in table:
        return table[key]
    base = key.split(",")[0]
    return table.get(base, "")


def add_item_aliases(hans, hant, hans_ini, hant_ini):
    """Map the watcher's class-shaped labels onto the ini item names.

    The log only has ids like rrs_specialist_heavy_core_04_03_01. The card
    shows a shortened English label. Both forms are filled from item_Name
    when that key already has a translation.
    """
    buckets = {}
    cls_hans, cls_hant = {}, {}
    for key, zh in hans_ini.items():
        code = item_class(key)
        if not code or not zh:
            continue
        zt = ini_get(hant_ini, key) or zh
        low = code.lower()
        if low not in cls_hans or "," not in key:
            cls_hans[low] = zh
            cls_hant[low] = zt
        pretty = pretty_class(code)
        if len(pretty) < 3:
            continue
        buckets.setdefault(pretty, []).append((len(code), zh, zt))
        slim = loose_class(pretty)
        if slim and slim != pretty:
            buckets.setdefault(slim, []).append((len(code), zh, zt))
    added = 0
    for form, opts in buckets.items():
        if form in hans:
            continue
        opts.sort(key=lambda o: (len(o[1]), o[0]))
        hans[form] = opts[0][1]
        hant[form] = opts[0][2]
        added += 1
    return added, {"hans": cls_hans, "hant": cls_hant}


def strip_maker(v):
    for m in MAKERS:
        if v.lower().startswith(m.lower() + " "):
            return v[len(m) + 1:]
    return v


def main():
    if not LABELS.exists():
        print("labels.json fehlt:", LABELS, file=sys.stderr)
        return 1
    hans_ini = load_ini(LANG / "chinese_(simplified)" / "global.ini")
    hant_ini = load_ini(LANG / "chinese_(traditional)" / "global.ini")
    labels = json.loads(LABELS.read_text(encoding="utf-8-sig"))
    labels = {k.lstrip("\ufeff"): v for k, v in labels.items()}

    wanted = set()
    for name in ("sys-stanton.json", "sys-pyro.json", "sys-nyx.json", "items.json",
                 "vehicles.json", "missions.json", "blueprints.json", "ores.json", "fleet.json"):
        p = DATA / name
        if not p.exists():
            continue
        walk_strings(json.loads(p.read_text(encoding="utf-8")), wanted)
    wanted.discard("")

    by_en = {}
    for k, v in labels.items():
        if not isinstance(v, str):
            continue
        en = v.strip()
        if len(en) < 2 or en.isdigit() or len(en) > 4000:
            continue
        sc = score(k)
        if sc >= 80:
            continue
        by_en.setdefault(en, []).append((sc, k))

    hans, hant, keys, alias = {}, {}, {}, {}
    used = 0
    for en, pairs in by_en.items():
        pairs.sort()
        best = pairs[0][0]
        if best > 15 and en not in wanted:
            continue
        if best > 30:
            continue
        chosen = [k for sc, k in pairs if sc <= best + 1 and sc <= 30][:6]
        zh_s = zh_t = None
        best_key = None
        for k in chosen:
            s, t = hans_ini.get(k), hant_ini.get(k)
            if s and s != en:
                zh_s = s
                best_key = k
                zh_t = t if t and t != en else s
                break
            if t and t != en and zh_t is None:
                zh_t = t
                best_key = k
        if not zh_s and not zh_t:
            continue
        hans[en] = zh_s or zh_t
        hant[en] = zh_t or zh_s
        for k in chosen:
            if k in hans_ini or k in hant_ini:
                keys[k] = [score(k), en]
        used += 1

    # UEX-Schiffsnamen lassen den Hersteller weg ("Cutlass Black" statt "Drake Cutlass Black").
    vehicles = {}
    for k, v in labels.items():
        if isinstance(v, str) and k.split(",")[0].startswith("vehicle_Name"):
            vehicles.setdefault(v.strip(), []).append(k)
    ship_names = []
    vp = DATA / "vehicles.json"
    if vp.exists():
        ship_names = [s.get("n") or "" for s in json.loads(vp.read_text(encoding="utf-8")).get("ships") or []]
    aliased = 0
    for name in ship_names:
        name = name.strip()
        if not name or name in hans:
            continue
        hit = None
        for en, ks in vehicles.items():
            short = strip_maker(en)
            if short == name or en.endswith(" " + name) or short.endswith(" " + name):
                if en in hans:
                    hit = en
                    break
        if not hit:
            continue
        hans[name] = hans[hit]
        hant[name] = hant.get(hit, hans[hit])
        alias[name] = hit
        aliased += 1

    # Gross/Klein-Schreibung der UEX-Namen an den Label-Text haengen.
    lower = {}
    for en in list(hans):
        lower.setdefault(en.lower(), en)
    cased = 0
    for name in list(wanted):
        if name in hans:
            continue
        src = lower.get(name.lower())
        if src:
            hans[name] = hans[src]
            hant[name] = hant[src]
            cased += 1

    pretty_n, classes = add_item_aliases(hans, hant, hans_ini, hant_ini)
    out = DATA / "loc.json"
    C.write_json(out, {"hans": hans, "hant": hant, "alias": alias, "class": classes})
    C.write_json(DATA / "loc-keys.json", keys)
    print("loc.json %d names (%d ship aliases, %d case aliases, %d item labels), %d class ids, %d keys, hans %d bytes" % (
        len(hans), aliased, cased, pretty_n, len(classes["hans"]), len(keys), out.stat().st_size))
    for sample in ("Hurston", "Lorville", "Area18", "Stanton", "Cutlass Black", "Agricium",
                   "A2 Hercules Starlifter", "Hauling - Planetary"):
        print(" ", sample, "->", hans.get(sample, "—"))
    return 0


if __name__ == "__main__":
    sys.exit(main() or 0)
