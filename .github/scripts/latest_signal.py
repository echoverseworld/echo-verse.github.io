#!/usr/bin/env python3
"""Holt die neuesten VEROEFFENTLICHTEN Videos beider Kanaele aus den
YouTube-RSS-Feeds (scheduled/private tauchen dort nicht auf), filtert
#shorts und schreibt assets/latest.json (Player + Ticker + Recent-Grid)."""
import json, re, sys, urllib.request
from datetime import datetime, timezone
from pathlib import Path

CHANNELS = {
    "frequency": "UC-Paofpq5_SgnDIIVAWJupA",
    "drift": "UCr4tKWsfu6-QZPAkYfrTZwg",
}
OUT = Path(__file__).resolve().parents[2] / "assets" / "latest.json"
MAX_RECENT = 4

def entries(channel_id):
    url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
    xml = urllib.request.urlopen(url, timeout=20).read().decode("utf-8")
    out = []
    for m in re.finditer(r"<entry>(.*?)</entry>", xml, re.S):
        e = m.group(1)
        vid = re.search(r"<yt:videoId>([^<]+)", e)
        title = re.search(r"<title>([^<]+)", e)
        if not vid or not title:
            continue
        t = title.group(1)
        t = t.replace("&amp;", "&").replace("&quot;", '"').replace("&#39;", "'")
        if "#shorts" in t.lower():
            continue
        out.append({"id": vid.group(1), "title": t})
        if len(out) >= MAX_RECENT:
            break
    return out

def main():
    data = {}
    for key, cid in CHANNELS.items():
        vids = entries(cid)
        if not vids:
            print(f"[WARN] Feed {key} leer -- latest.json bleibt unveraendert.")
            return 0
        data[key] = vids[0]["id"]
        data[f"{key}_title"] = vids[0]["title"]
        data[f"recent_{key}"] = vids
    data["updated"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"[OK] {OUT}: " + ", ".join(f"{k}={len(v) if isinstance(v,list) else v}" for k, v in data.items()))
    return 0

if __name__ == "__main__":
    sys.exit(main())
