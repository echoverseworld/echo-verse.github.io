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
- Skala (E974): die fünf Sender liegen mittig bei 23–79 %, tote Frequenzen 89.2 / 91.7 / 103.8 / 108.0. Senderplätze stehen an drei Stellen und müssen gleich bleiben: `ANCH` in `assets/receiver.js`, `style="left:…"` der `.rx-st` in `index.html`, Bandplan (`.bd-st` + Tabelle) in `codex.html`. Nach Änderung an `receiver.js` das `?v=` am Script-Tag in `index.html` hochzählen.
- Prüfansicht nur lokal (localhost/127.0.0.1): `?rx=drift,3` eingerastet, `?rx=reveal,pulse,0.4` mitten in der Rekonstruktion, `?rx=89.2` tote, `?rx=99.0` leere Frequenz, `&rxcss` CSS-Fassung. Headless-Browser fotografieren die WebGL-Leinwand nur über das `<img>`-Abbild dieser Ansicht.
- Keine Requests nach außen, nichts im Speicher des Besuchers; Ton erst nach Klick auf SOUND oder LISTEN LIVE.
- „Live Carrier“ (E1020): je Sender ein echter Musik-Ausschnitt `assets/radio/<key>.mp3` (64 s, −14 LUFS) + `assets/radio.json` (Song, Volume, Video-ID, Startsekunde im Mix). Bauen/tauschen nur mit `97_Programme/tools/Build-WebsiteRadio.py --out <arbeitskopie>/assets` (Auswahl in `PICKS`), danach `RADIO_V` in `receiver.js` hochzählen. Geladen wird erst nach dem Klick. Beim Abstimmen klingt die Musik dumpf (Filter folgt dem Signal), eingerastet klar; Sendezeit aus der Uhr (Sprung braucht Byte-Ranges – Cloudflare liefert 206, `py -m http.server` nicht: lokal mit einem Range-Server prüfen). Wer zuhört, bleibt auf dem Sender (kein Suchlauf); „CONTINUE ON YOUTUBE“ springt an die gehörte Sekunde des Mixes; Bass treibt Licht, Drift-Zoom und Kamm. Prüfhilfen: `ECHO_RECEIVER.listen()`, `state().au`.
- Hör-Paket (E1021, in `receiver.js` Abschnitt „Hoer-Paket“, Markup in `index.html` nach dem Hero): Mini-Tuner `#miniTuner` erscheint beim Hören, sobald der Empfänger aus dem Bild ist (Lage per `getBoundingClientRect`, nicht per IntersectionObserver – der meldet ohne Animations-Frames nichts); Senderwechsel außerhalb des Bildes per `quickTune` ohne Suchlauf. FULL SIGNAL = Klasse `rx-zen` + Fullscreen-API (ohne API nur ausgeblendete Seite), wach nur bei echter Mausbewegung (≥ 6 px). Sleep-Timer 30/60/90 min, letzte 20 s Ausblenden. Tasten 1–5, Leertaste (nur Empfänger sichtbar), F, S, ?, Esc – Eingabefelder ausgenommen; Terminal (`~`, „echo“) unberührt. Prüfhilfen: `ECHO_RECEIVER.sleepIn(sek)`, `.zen()`.
- Seitenwechsel als Signalverlust (E1020): `@view-transition` in `index.html` und `assets/site.css` (gleicher Block an beiden Stellen); Browser ohne Unterstützung wechseln wie bisher, bei „Bewegung reduzieren“ kein Effekt.
- Vorschaubild der Player in den Kanal-Panels: das Artwork aus `assets/archive.json` zur Video-ID in `assets/latest.json` (E935). `assets/latest_<kanal>.jpg` ist nur noch Rückfall – die GitHub Action lädt sie seit 09.10.2026 nicht mehr nach (Download vom YouTube-Bildserver scheitert dort, Ursache ohne Protokolle unbelegt).

## Unterseiten im Look der Startseite (E932)

- Gemeinsamer Rahmen: `assets/site.css` (Farben, Navigation, Kopf, Knöpfe, Footer) und `assets/site.js` (Navigation, Sendezähler, Erscheinen, `ECHO_DECODE` zum Entschlüsseln). Die Startseite bindet beides nicht ein (eigenes CSS in `index.html`) – Navigation und Footer bei Änderungen an beiden Stellen nachziehen.
- `archive.html` + `assets/archive.js`: Signal-Atlas im Kopf (jede Sendung ein Kamm auf ihrer FM-Zahl, in die Tiefe der Sendetag; am Handy nur die letzten 18 Sendetage), Raster, Filter (färbt `--sig`), Leuchtkasten mit Pfeiltasten. Die Karten führen auf die Sendungs-Seite.
- `codex.html`: Akten entschlüsseln sich beim Öffnen, Zähler im Kopf, Leuchtpunkt im Archivkern. FILE 0008 bleibt versiegelt.
- `sig/*.html` schreibt der Archiv-Job mit `97_Programme/website_pages.py`; Aussehen in `assets/sig.css` + `assets/sig.js`. Neue Elemente der Sendungs-Seiten gehören in den Seitenbau, nicht von Hand in `sig/`.
- Cloudflare gibt CSS/JS mit `max-age=14400` aus (4 h im Browser). Nach jeder Änderung an `assets/site.*`, `assets/sig.*` oder `assets/archive.js` die Version hochzählen: `ASSET_V` in `website_pages.py` (danach Export mit `--pages`) und die `?v=` in `archive.html` und `codex.html` – sonst sehen Wiederkehrer neues HTML mit altem CSS (E933).
- Prüfansicht nur lokal: `archive.html?at=12` (Atlas eingefroren), `&ahover=3`, `&afilter=drift`; `codex.html?open=f1,f3`; `?still` schaltet die Erscheinen-Effekte ab (Headless-Fotos). Der Animationspfad des Atlas ist damit NICHT geprüft (E933): dafür `archive.html?probe` (zählt nach 3,5 s die gezeichneten Pixel, Ergebnis im Seitentitel, auslesen per Headless `--dump-dom`) und `?noraf` (Umgebung ohne Animations-Frames wie die Vorschau der Claude-App).
- Nichts darf seitlich über den Bildschirm ragen: verwischtes Licht mit negativem Rand gehört in einen Rahmen mit `overflow:hidden` – sonst wird die Seite am Handy breiter und die Navigation abgeschnitten (E932).
