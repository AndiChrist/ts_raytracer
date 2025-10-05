# TypeScript Raytracer

Ein modularer, browser-basierter Raytracer implementiert in TypeScript mit JSON-konfigurierbaren Szenen.

## 📋 Inhaltsverzeichnis

- [Features](#features)
- [Voraussetzungen](#voraussetzungen)
- [Installation](#installation)
- [Betrieb](#betrieb)
- [Verwendung](#verwendung)
- [Szenen-Format](#szenen-format)
- [Beispiele](#beispiele)
- [Konfiguration](#konfiguration)
- [Troubleshooting](#troubleshooting)
- [Erweiterungen](#erweiterungen)

## ✨ Features

- 🎯 **Echtzeit-Raytracing** im Browser
- ⚡ **Web Workers** - Multi-threaded Rendering für massive Performance-Steigerung
- 📄 **JSON-basierte Szenen** - keine Neukompilierung nötig
- 🔷 **TypeScript** - vollständige Typsicherheit
- 🎨 **Phong-Beleuchtung** - diffuse und spekulare Reflexion
- 🪞 **Rekursive Reflexionen** - konfigurierbare Tiefe
- 💡 **Mehrere Lichtquellen** - mit Schattenberechnung
- 🔺 **Geometrische Formen** - Sphären, Ebenen, Dreiecke, Boxen
- 💾 **PNG-Export** - speichere gerenderte Bilder direkt
- 📦 **Webpack-Bundle** - optimierte Builds
- 🎮 **Interaktiver Editor** - Szenen in Echtzeit bearbeiten
- ⚡ **Hot-Reload** - sofortige Updates während der Entwicklung

## 📦 Voraussetzungen

### Software-Anforderungen

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **npm** >= 9.0.0 (kommt mit Node.js)
- Moderner Webbrowser (Chrome, Firefox, Safari, Edge)

### System-Anforderungen

- **Arbeitsspeicher:** Mindestens 4 GB RAM
- **Browser:** Aktuellste Version empfohlen
- **Betriebssystem:** Windows, macOS oder Linux

### Node.js Version prüfen

```bash
node --version  # sollte v18.0.0 oder höher sein
npm --version   # sollte 9.0.0 oder höher sein
```

Falls Node.js nicht installiert ist:
- **Windows/macOS:** Download von [nodejs.org](https://nodejs.org/)
- **Linux (Ubuntu/Debian):**
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

## 🚀 Installation

### 1. Projekt herunterladen

```bash
# Repository klonen (falls vorhanden)
git clone https://github.com/yourusername/raytracer.git
cd raytracer

# ODER: Manuell erstellen
mkdir raytracer
cd raytracer
```

### 2. Projektstruktur erstellen

```bash
# Verzeichnisse anlegen
mkdir -p src public/scenes
```

### 3. Dateien erstellen

Erstelle folgende Dateien mit dem entsprechenden Inhalt:

- `package.json`
- `tsconfig.json`
- `webpack.config.js`
- `src/main.ts`
- `public/index.html`
- `public/scenes/basic.json`
- `public/scenes/reflections.json`

*(Inhalt siehe Projektdateien)*

### 4. Dependencies installieren

```bash
npm install
```

Dies installiert:
- TypeScript Compiler
- Webpack und Dev-Server
- TS-Loader
- HTML-Plugin

**Erwartete Ausgabe:**
```
added 234 packages, and audited 235 packages in 15s
```

### 5. Installation verifizieren

```bash
# Prüfe ob alle Dependencies installiert sind
npm list --depth=0

# Sollte zeigen:
# ├── @types/node@20.x.x
# ├── html-webpack-plugin@5.x.x
# ├── ts-loader@9.x.x
# ├── typescript@5.x.x
# ├── webpack@5.x.x
# └── ...
```

## 🎮 Betrieb

### Development-Modus (empfohlen)

Startet einen lokalen Development-Server mit Hot-Reload:

```bash
npm run serve
```

**Was passiert:**
1. TypeScript wird kompiliert
2. Webpack erstellt ein Bundle
3. Dev-Server startet auf Port 3000
4. Browser öffnet sich automatisch
5. Änderungen werden live aktualisiert

**Konsolen-Ausgabe:**
```
<i> [webpack-dev-server] Project is running at:
<i> [webpack-dev-server] Loopback: http://localhost:3000/
<i> [webpack-dev-server] Content not from webpack is served from 'public'
webpack 5.88.0 compiled successfully in 2341 ms
```

**Browser öffnet:** `http://localhost:3000`

### Watch-Modus (ohne Server)

Kompiliert automatisch bei Änderungen, ohne Server:

```bash
npm run dev
```

Öffne dann manuell `dist/index.html` im Browser.

### Production Build

Erstellt optimiertes Bundle für Production:

```bash
npm run build
```

**Output:** `dist/` Verzeichnis mit:
- `bundle.js` (minimiert)
- `index.html`
- Source Maps

Das `dist/` Verzeichnis kann dann deployed werden.

### Build bereinigen

```bash
npm run clean
```

Löscht das `dist/` Verzeichnis.

## 📖 Verwendung

### 1. Erste Schritte

1. **Server starten:**
   ```bash
   npm run serve
   ```

2. **Browser öffnet sich automatisch** auf `http://localhost:3000`

3. **Standard-Szene wird geladen** - du solltest in der Console sehen:
   ```
   🚀 Main.ts wird ausgeführt...
   ✅ DOM loaded, initializing...
   🎉 App initialized successfully!
   ```

4. **Klicke auf "Szene Rendern"** - nach wenigen Sekunden siehst du das gerenderte Bild

### 2. Vordefinierte Szenen laden

1. Wähle eine Szene aus dem Dropdown:
   - **Standard-Szene** - Einfache Szene mit 2 Kugeln
   - **Basis** - Geladen aus `scenes/basic.json`
   - **Multi Light** - Szene mit mehreren Lichtquellen
   - **Reflexionen** - Szene mit hohen Reflexionswerten
   - **Coole Szene** - Kreative Szene
   - **Geometrische Formen** - Demonstriert alle verfügbaren Formen (Boxen, Dreiecke)

2. Klicke auf **"Szene Laden"**

3. Klicke auf **"Szene Rendern"**

### 3. Eigene Szenen erstellen

1. **Bearbeite das JSON** im Szenen-Editor
2. **Klicke auf "Custom Szene Laden & Rendern"**
3. Das Bild wird automatisch gerendert

### 4. Bild exportieren

Nach dem Rendern:
1. Klicke auf **"Als PNG Exportieren"**
2. Das Bild wird automatisch mit Zeitstempel heruntergeladen
3. Dateiname-Format: `raytracer-YYYY-MM-DDTHH-MM-SS.png`

### 5. Parameter anpassen

**Reflexionstiefe ändern:**
- Slider bewegen (1-10)
- Höhere Werte = mehr Reflexions-Bounces
- **Achtung:** Höhere Werte = längere Renderzeit

**Web Workers (Multi-Threading):**
- ✅ Checkbox: Web Workers aktivieren/deaktivieren
- Standard: Aktiviert für maximale Performance
- Automatische CPU-Kern-Erkennung
- Worker-Anzahl anpassbar (1-16)
- **Performance-Gewinn:**
  - 4-Core CPU: ~4x schneller
  - 8-Core CPU: ~6-8x schneller
  - Skaliert mit CPU-Kernen

**Szene bearbeiten:**
```json
{
  "camera": {
    "position": { "x": 0, "y": 1, "z": 5 },
    "target": { "x": 0, "y": 0, "z": 0 },
    "fov": 60
  },
  "lights": [...],
  "objects": [...]
}
```

### 6. Rendering-Performance

**Typische Renderzeiten (800x600):**

**Mit Web Workers (4 Kerne):**
- Einfache Szene (2-3 Objekte): ~0.5-1 Sekunden
- Mittlere Szene (5-7 Objekte): ~1-4 Sekunden
- Komplexe Szene (10+ Objekte): ~4-8 Sekunden

**Single-Threaded (zum Vergleich):**
- Einfache Szene (2-3 Objekte): ~2-5 Sekunden
- Mittlere Szene (5-7 Objekte): ~5-15 Sekunden
- Komplexe Szene (10+ Objekte): ~15-30 Sekunden

**Performance verbessern:**
- ✅ Web Workers aktivieren (Standard)
- Worker-Anzahl = CPU-Kerne nutzen
- Weniger Objekte
- Niedrigere Reflexionstiefe
- Kleinere Canvas-Größe

## 🎨 Szenen-Format

### Grundstruktur

```json
{
  "camera": { ... },
  "lights": [ ... ],
  "objects": [ ... ],
  "backgroundColor": { ... }
}
```

### Kamera

```json
"camera": {
  "position": { "x": 0, "y": 1, "z": 5 },  // Kameraposition
  "target": { "x": 0, "y": 0, "z": 0 },     // Blickpunkt
  "fov": 60                                  // Field of View (Grad)
}
```

### Lichtquellen

```json
"lights": [
  {
    "position": { "x": 5, "y": 5, "z": 5 },     // Lichtposition
    "color": { "r": 1, "g": 1, "b": 1 },         // RGB (0-1)
    "intensity": 1                                // Helligkeit (0-2)
  }
]
```

### Objekte

**Sphäre (Kugel):**
```json
{
  "type": "sphere",
  "center": { "x": 0, "y": 0, "z": 0 },
  "radius": 1,
  "material": {
    "color": { "r": 1, "g": 0.2, "b": 0.2 },
    "reflectivity": 0.3,   // 0 = matt, 1 = Spiegel
    "shininess": 32        // 1-200, höher = glänzender
  }
}
```

**Ebene:**
```json
{
  "type": "plane",
  "point": { "x": 0, "y": -2, "z": 0 },      // Punkt auf der Ebene
  "normal": { "x": 0, "y": 1, "z": 0 },      // Normalenvektor
  "material": { ... }
}
```

**Dreieck:**
```json
{
  "type": "triangle",
  "v0": { "x": -1, "y": 0, "z": 0 },         // Eckpunkt 1
  "v1": { "x": 1, "y": 0, "z": 0 },          // Eckpunkt 2
  "v2": { "x": 0, "y": 2, "z": 0 },          // Eckpunkt 3
  "material": { ... }
}
```

**Box (Achsen-ausgerichteter Quader):**
```json
{
  "type": "box",
  "min": { "x": -1, "y": -1, "z": -1 },      // Minimale Ecke
  "max": { "x": 1, "y": 1, "z": 1 },         // Maximale Ecke
  "material": { ... }
}
```

### Hintergrundfarbe

```json
"backgroundColor": { "r": 0.1, "g": 0.1, "b": 0.2 }
```

## 💡 Beispiele

### Beispiel 1: Einfache Szene

```json
{
  "camera": {
    "position": { "x": 0, "y": 2, "z": 6 },
    "target": { "x": 0, "y": 0, "z": 0 },
    "fov": 50
  },
  "lights": [
    {
      "position": { "x": 5, "y": 5, "z": 5 },
      "color": { "r": 1, "g": 1, "b": 1 },
      "intensity": 1
    }
  ],
  "objects": [
    {
      "type": "sphere",
      "center": { "x": 0, "y": 0, "z": 0 },
      "radius": 1,
      "material": {
        "color": { "r": 1, "g": 0, "b": 0 },
        "reflectivity": 0.2,
        "shininess": 50
      }
    }
  ],
  "backgroundColor": { "r": 0.1, "g": 0.1, "b": 0.2 }
}
```

### Beispiel 2: Geometrische Formen

```json
{
  "camera": {
    "position": { "x": 0, "y": 2, "z": 8 },
    "target": { "x": 0, "y": 0, "z": 0 },
    "fov": 60
  },
  "lights": [
    {
      "position": { "x": 5, "y": 8, "z": 5 },
      "color": { "r": 1, "g": 1, "b": 1 },
      "intensity": 1.2
    }
  ],
  "objects": [
    {
      "type": "box",
      "min": { "x": -1, "y": -0.5, "z": -1 },
      "max": { "x": 1, "y": 0.5, "z": 1 },
      "material": {
        "color": { "r": 0.8, "g": 0.3, "b": 0.3 },
        "reflectivity": 0.3,
        "shininess": 50
      }
    },
    {
      "type": "triangle",
      "v0": { "x": -2, "y": 0, "z": -1 },
      "v1": { "x": -3, "y": 1.5, "z": -1 },
      "v2": { "x": -1, "y": 1.5, "z": -1 },
      "material": {
        "color": { "r": 0.3, "g": 0.8, "b": 0.3 },
        "reflectivity": 0.2,
        "shininess": 40
      }
    },
    {
      "type": "plane",
      "point": { "x": 0, "y": -0.5, "z": 0 },
      "normal": { "x": 0, "y": 1, "z": 0 },
      "material": {
        "color": { "r": 0.7, "g": 0.7, "b": 0.7 },
        "reflectivity": 0.2,
        "shininess": 20
      }
    }
  ],
  "backgroundColor": { "r": 0.05, "g": 0.05, "b": 0.15 }
}
```

### Beispiel 3: Spiegelsaal

```json
{
  "camera": {
    "position": { "x": 0, "y": 1, "z": 8 },
    "target": { "x": 0, "y": 0, "z": 0 },
    "fov": 45
  },
  "lights": [
    {
      "position": { "x": 0, "y": 10, "z": 0 },
      "color": { "r": 1, "g": 1, "b": 1 },
      "intensity": 1.5
    }
  ],
  "objects": [
    {
      "type": "sphere",
      "center": { "x": 0, "y": 0, "z": 0 },
      "radius": 1,
      "material": {
        "color": { "r": 0.9, "g": 0.9, "b": 0.9 },
        "reflectivity": 0.95,
        "shininess": 100
      }
    },
    {
      "type": "plane",
      "point": { "x": 0, "y": -1.5, "z": 0 },
      "normal": { "x": 0, "y": 1, "z": 0 },
      "material": {
        "color": { "r": 0.8, "g": 0.8, "b": 0.8 },
        "reflectivity": 0.6,
        "shininess": 50
      }
    }
  ],
  "backgroundColor": { "r": 0, "g": 0, "b": 0 }
}
```

## ⚙️ Konfiguration

### Canvas-Größe ändern

In `public/index.html`:
```html
<canvas id="raytracer-canvas" width="1024" height="768"></canvas>
```

**Achtung:** Größere Auflösung = längere Renderzeit!

### Webpack Port ändern

In `webpack.config.js`:
```javascript
devServer: {
  port: 3000,  // Ändere hier den Port
  // ...
}
```

### TypeScript Strict Mode

In `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true  // Für strengere Type-Checks
  }
}
```

## 🔧 Troubleshooting

### Problem: "Cannot find module"

**Lösung:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Problem: Port 3000 bereits belegt

**Lösung 1:** Ändere Port in `webpack.config.js`

**Lösung 2:** Beende andere Prozesse:
```bash
# Linux/Mac
lsof -ti:3000 | xargs kill

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Problem: Rendering sehr langsam

**Lösungen:**
- Reduziere Canvas-Größe (z.B. 400x300)
- Weniger Objekte in der Szene
- Niedrigere Reflexionstiefe (1-3)
- Schließe andere Browser-Tabs

### Problem: Browser-Console zeigt Fehler

**Prüfe:**
1. Alle Dateien korrekt erstellt?
2. `npm install` erfolgreich?
3. JSON-Syntax korrekt?
4. Browser-Cache geleert? (Ctrl+Shift+R)

### Problem: "RaytracerApp is not defined"

**Lösung:**
1. Stoppe Server (Ctrl+C)
2. Lösche `dist/`: `npm run clean`
3. Starte neu: `npm run serve`

## 🚀 Erweiterungen

### Projektarchitektur

Das Projekt ist modular strukturiert:

```
src/
├── types/          # TypeScript Interfaces und Typen
├── math/           # Vector3 und mathematische Utilities
├── core/           # Raytracer Engine mit Intersection-Algorithmen
├── workers/        # Web Worker für paralleles Rendering
├── app/            # RaytracerApp Wrapper-Klasse
├── scenes/         # Szenen-Konfigurationen
└── main.ts         # Bootstrap und Initialisierung
```

### Web Workers Performance

Das Projekt nutzt **Web Workers** für Multi-Threading:

**Funktionsweise:**
1. Hauptthread erstellt mehrere Worker (= CPU-Kerne)
2. Bild wird in horizontale Streifen aufgeteilt
3. Jeder Worker rendert seinen Streifen parallel
4. Ergebnisse werden zusammengeführt

**Performance-Messung:**
- Moderne Browser unterstützen `navigator.hardwareConcurrency`
- Automatische Optimierung basierend auf CPU
- Linearer Speedup bis zur Kern-Anzahl
- Keine UI-Blockierung während Rendering

### Neue Objekttypen hinzufügen

**Schritte:**
1. Interface in `src/types/scene.types.ts` definieren
2. Union Type `SceneObject` erweitern
3. Intersect-Methode in `src/core/Raytracer.ts` implementieren
4. Case in `intersectObject()` hinzufügen

**Beispiel:** Siehe die Implementierungen von `intersectTriangle()` (Möller-Trumbore) oder `intersectBox()` (Slab-Methode)

### Performance-Optimierungen

**Implementiert:**
- ✅ **Web Workers** für Multi-Threading (4-8x Speedup)

**Mögliche weitere Verbesserungen:**
- **Spatial Data Structures** (BVH, Octree) für komplexe Szenen
- **Adaptive Sampling** für Anti-Aliasing
- **GPU-Beschleunigung** mit WebGL/WebGPU
- **Progressive Rendering** mit Live-Preview

### Weitere Features

Ideen für zukünftige Features:
- Texturen auf Objekten
- Volumetrisches Rendering
- Verschiedene Kamera-Modi
- Animation / Kamera-Bewegung
- Weitere Formen (Zylinder, Kegel, Torus)

## 📝 Lizenz

MIT License - siehe LICENSE Datei

## 👥 Autor

Andreas Christ - [GitHub](https://github.com/AndiChrist/ts_raytracer)

## 🙏 Danksagungen

- Basiert auf klassischen Raytracing-Algorithmen
- Inspiriert von Peter Shirley's "Ray Tracing in One Weekend"
