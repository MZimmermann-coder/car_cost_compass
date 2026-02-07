# Car Cost Compass

Single-file Svelte-App zur Gegenüberstellung von Fahrzeugkosten. Alle Daten werden direkt in der HTML-Datei gespeichert.

## Entwicklung

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Der Build erzeugt `dist/index.html`. Benenne diese Datei in `car_cost_compass.html` um, wenn du eine portable Datei brauchst.

**Wichtig:** Baue niemals über deine Arbeitsdatei, in der du Daten gespeichert hast. Der Build enthält immer die Standard-Daten aus `index.html`.

## Nutzung

- Fahrzeuge in der Garage anlegen oder bearbeiten.
- In der Übersicht vergleichen und sortieren.
- In der Detailansicht die jährliche Aufschlüsselung prüfen.
- Über die obere Leiste Dateien öffnen und speichern.

Wenn der File System Access API nicht verfügbar ist, nutzt die App automatische Download- und Upload-Fallbacks.



