#!/usr/bin/env python3
"""Holt die neuesten VEROEFFENTLICHTEN Videos beider Kanaele aus den
YouTube-RSS-Feeds (scheduled/private tauchen dort nicht auf), filtert
#shorts und schreibt assets/latest.json (Player + Ticker + Recent-Grid)."""
import json, re, sys, time, urllib.request
from datetime import datetime, timezone
from pathlib import Path

CHANNELS = {
    "frequency": "UC-Paofpq5_SgnDIIVAWJupA",
    "drift": "UCr4tKWsfu6-QZPAkYfrTZwg",
}
ASSETS = Path(__file__).resolve().parents[2] / "assets"
OUT = ASSETS / "latest.json"
MAX_RECENT = 4

def fetch(url, tries=3, binary=False):
    """Mit UA-Header + Retry -- YouTube drosselt Runner-IPs gelegentlich (Run #10)."""
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (echo-verse.world latest-signal)"})
    for i in range(tries):
        try:
            raw = urllib.request.urlopen(req, timeout=20).read()
            return raw if binary else raw.decode("utf-8")
        except Exception as e:
            print(f"[WARN] Versuch {i+1}/{tries} fehlgeschlagen: {e}")
            time.sleep(10 * (i + 1))
    return None

def fetch_thumbnail(key, video_id):
    """Laedt das echte YouTube-Thumbnail des neuesten Videos nach
    assets/latest_<key>.jpg -- die Player-Facade zeigt es OHNE externe
    Requests (Privacy-Konzept der Seite bleibt intakt). maxres zuerst
    (16:9), Fallback hqdefault (4:3 mit Balken -- object-fit:cover der
    Facade schneidet exakt die Balken weg). Fehlschlag ist nicht fatal:
    index.html faellt per onerror auf das Gallery-Artwork zurueck."""
    dest = ASSETS / f"latest_{key}.jpg"
    for variant in ("maxresdefault", "hqdefault"):
        raw = fetch(f"https://i.ytimg.com/vi/{video_id}/{variant}.jpg", tries=2, binary=True)
        if raw and len(raw) > 1000:  # YouTubes 404-Platzhalter-JPG ist ~1kB
            dest.write_bytes(raw)
            print(f"[OK] Thumbnail {key}: {variant} ({len(raw)} bytes)")
            return
    print(f"[WARN] Kein Thumbnail fuer {key}/{video_id} -- Facade nutzt Fallback-Artwork.")

def entries(channel_id):
    xml = fetch(f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}")
    if xml is None:
        return []
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
            # Transient (Feed leer/unerreichbar): alte latest.json behalten,
            # Run GRUEN lassen -- naechster Cron versucht es erneut.
            print(f"[WARN] Feed {key} leer/unerreichbar -- latest.json bleibt unveraendert.")
            return 0
        data[key] = vids[0]["id"]
        data[f"{key}_title"] = vids[0]["title"]
        data[f"recent_{key}"] = vids
        fetch_thumbnail(key, vids[0]["id"])
    data["updated"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"[OK] {OUT}: " + ", ".join(f"{k}={len(v) if isinstance(v,list) else v}" for k, v in data.items()))
    return 0

if __name__ == "__main__":
    sys.exit(main())
