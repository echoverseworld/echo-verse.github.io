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
