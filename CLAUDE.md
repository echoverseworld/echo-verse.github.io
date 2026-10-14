# Hinweise für Claude

## Offene Punkte

- **Impressum und Datenschutzerklärung:** Die Seite hat aktuell keine.
  Bevor das Projekt monetarisiert oder gewerblich betrieben wird, beide
  Seiten ergänzen (Impressumspflicht nach § 5 DDG, Datenschutzerklärung
  nach DSGVO). Wenn in einer Session Monetarisierung, Einnahmen oder ein
  Gewerbe zur Sprache kommen, aktiv darauf hinweisen. Inhalte muss der
  Betreiber liefern oder rechtlich prüfen lassen.

## Empfänger „Signal Lock“ (Startseite, E925)

- Der Hero ist ein Radio: `assets/receiver.js` (WebGL2; ohne WebGL2 eine CSS-Fassung, bei „Bewegung reduzieren“ ein Standbild). Parameter je Sender in `LOOK` (Fokuspunkt, Lage/Tiefe/Sperrung des Riesen-Worts, Takt des Lichtpulses).
- Bilder: `assets/hero/<key>.jpg` + `<key>_depth.jpg` (Rot = Tiefe für die Parallaxe, Grün = ausgeweitete Tiefe für die Verdeckung des Worts). Neu bauen nur mit `97_Programme/tools/Build-WebsiteHero.py` im DepthFlow-Venv – nie direkt in diesen Checkout, der Archiv-Job veröffentlicht jeden Commit auf `main` (E898). Nach einem Tausch `ASSET_V` in `receiver.js` und `?v=` in `index.html` (preload, `--amb`) hochzählen.
- Prüfansicht nur lokal (localhost/127.0.0.1): `?rx=drift,3` eingerastet, `?rx=reveal,pulse,0.4` mitten in der Rekonstruktion, `?rx=89.2` tote, `?rx=99.0` leere Frequenz, `&rxcss` CSS-Fassung. Headless-Browser fotografieren die WebGL-Leinwand nur über das `<img>`-Abbild dieser Ansicht.
- Keine Requests nach außen, nichts im Speicher des Besuchers; Ton (FM-Rauschen) erst nach Klick auf SOUND.

## Unterseiten im Look der Startseite (E932)

- Gemeinsamer Rahmen: `assets/site.css` (Farben, Navigation, Kopf, Knöpfe, Footer) und `assets/site.js` (Navigation, Sendezähler, Erscheinen, `ECHO_DECODE` zum Entschlüsseln). Die Startseite bindet beides nicht ein (eigenes CSS in `index.html`) – Navigation und Footer bei Änderungen an beiden Stellen nachziehen.
- `archive.html` + `assets/archive.js`: Signal-Atlas im Kopf (jede Sendung ein Kamm auf ihrer FM-Zahl, in die Tiefe der Sendetag; am Handy nur die letzten 18 Sendetage), Raster, Filter (färbt `--sig`), Leuchtkasten mit Pfeiltasten. Die Karten führen auf die Sendungs-Seite.
- `codex.html`: Akten entschlüsseln sich beim Öffnen, Zähler im Kopf, Leuchtpunkt im Archivkern. FILE 0008 bleibt versiegelt.
- `sig/*.html` schreibt der Archiv-Job mit `97_Programme/website_pages.py`; Aussehen in `assets/sig.css` + `assets/sig.js`. Neue Elemente der Sendungs-Seiten gehören in den Seitenbau, nicht von Hand in `sig/`.
- Prüfansicht nur lokal: `archive.html?at=12` (Atlas eingefroren), `&ahover=3`, `&afilter=drift`; `codex.html?open=f1,f3`; `?still` schaltet die Erscheinen-Effekte ab (Headless-Fotos). Der Animationspfad des Atlas ist damit NICHT geprüft (E933): dafür `archive.html?probe` (zählt nach 3,5 s die gezeichneten Pixel, Ergebnis im Seitentitel, auslesen per Headless `--dump-dom`) und `?noraf` (Umgebung ohne Animations-Frames wie die Vorschau der Claude-App).
- Nichts darf seitlich über den Bildschirm ragen: verwischtes Licht mit negativem Rand gehört in einen Rahmen mit `overflow:hidden` – sonst wird die Seite am Handy breiter und die Navigation abgeschnitten (E932).
