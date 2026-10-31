#!/usr/bin/env python3
# Baut den Item-/Waren-/Schiffs-Katalog fuer die Suche (data/items.json, data/vehicles.json).
# Anders als die Preise (die holt js/starmap.js selbst live von api.uexcorp.space), braucht die
# Suche eine einmalig gebaute Namensliste -- die UEX-API hat dafuer keinen einzelnen
# "gib mir alle Items"-Endpunkt, sondern verlangt id_category je Aufruf (siehe unten).
#
# Builds the item/commodity/ship catalog used by the search (data/items.json, data/vehicles.json).
# Unlike prices (which js/starmap.js fetches live from api.uexcorp.space itself), search needs a
# name list built once -- UEX's API has no single "give me all items" endpoint, it requires
# id_category per call (see below).
#
# Quelle/source: https://api.uexcorp.space/2.0/ (oeffentlich, kein Schluessel fuer diese
# Lese-Endpunkte noetig / public, no key needed for these read endpoints).
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _common as C  # noqa: E402


def build_items():
    cats = [c for c in C.get(C.UEX_API + "categories")["data"] if c.get("type") == "item"]
    out, seen = [], set()
    for cat in cats:
        try:
            rows = C.get(C.UEX_API + "items?id_category=%d" % cat["id"]).get("data") or []
        except Exception as ex:
            print("WARNUNG/WARNING: Kategorie/category %r (%d) uebersprungen: %s" % (cat.get("name"), cat["id"], ex),
                  file=sys.stderr)
            continue
        for it in rows:
            if it["id"] in seen:
                continue
            seen.add(it["id"])
            out.append({"n": it.get("name") or "", "i": it["id"], "k": "i",
                        "s": it.get("section") or cat.get("section") or "",
                        "co": it.get("company_name") or ""})
    # Waren (Commodities): eigener Endpunkt, eigene Kategorie "Commodities" (k='c' markiert sie in
    # js/starmap.js als Handelsware statt Ausruestung).
    # Commodities: their own endpoint, own "Commodities" category (k='c' marks them in js/starmap.js
    # as tradeable goods rather than equipment).
    for c in C.get(C.UEX_API + "commodities")["data"] or []:
        out.append({"n": c.get("name") or "", "i": c["id"], "k": "c", "s": "Commodities", "co": ""})
    return out


def build_vehicles():
    companies = {c["id"]: c.get("name") or "" for c in C.get(C.UEX_API + "companies")["data"] or []}
    out = []
    for v in C.get(C.UEX_API + "vehicles")["data"] or []:
        out.append({"n": v.get("name") or "", "i": v["id"], "co": companies.get(v.get("id_company"), "")})
    return out


def ore_base(name):
    import re
    s = re.sub(r"\s*\((raw|ore|r)\)\s*$", "", (name or "").lower(), flags=re.I)
    return re.sub(r"^raw\s+", "", s).strip()


def mine_names():
    import json
    names = set()
    if not C.DATA_DIR.is_dir():
        return names
    for path in C.DATA_DIR.glob("sys-*.json"):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        for groups in (data.get("mining") or {}).values():
            for group in groups:
                for dep in group.get("deps") or []:
                    for part in dep.get("parts") or []:
                        if part.get("ore") and not str(part["ore"]).lower().startswith("inert"):
                            names.add(part["ore"])
    return names


def build_ores():
    """UEX-Warennummer je abbaubarem Erz: ido = roh, idr = raffiniert.
    UEX commodity id per mineable ore: ido = raw, idr = refined."""
    rows = C.get(C.UEX_API + "commodities").get("data") or []
    wanted = {ore_base(n) for n in mine_names()}
    by = {}
    for row in rows:
        key = ore_base(row.get("name"))
        if wanted and key not in wanted:
            continue
        if not wanted and not (row.get("is_raw") or row.get("is_refined") or row.get("is_mineral")):
            continue
        slot = by.setdefault(key, {"n": row.get("name") or "", "code": row.get("code") or ""})
        if row.get("is_refined"):
            slot["idr"] = row["id"]
            slot["n"] = row.get("name") or slot["n"]
            if row.get("code"):
                slot["code"] = row["code"]
        elif row.get("is_raw"):
            slot["ido"] = row["id"]
            if not slot.get("idr"):
                slot["n"] = (row.get("name") or slot["n"]).replace(" (Ore)", "").replace(" (Raw)", "").replace(" (R)", "")
            if row.get("code") and not slot.get("code"):
                slot["code"] = row["code"]
    return sorted(by.values(), key=lambda o: o["n"].lower())


def main():
    C.ensure_dirs()
    items = build_items()
    C.write_json(C.DATA_DIR / "items.json", {"items": items})
    print("data/items.json: %d Eintraege/entries" % len(items))

    ships = build_vehicles()
    C.write_json(C.DATA_DIR / "vehicles.json", {"ships": ships})
    print("data/vehicles.json: %d Eintraege/entries" % len(ships))

    ores = build_ores()
    C.write_json(C.DATA_DIR / "ores.json", {"ores": ores})
    print("data/ores.json: %d Eintraege/entries" % len(ores))


if __name__ == "__main__":
    main()
