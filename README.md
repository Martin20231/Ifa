# IFA Tagebuch

Privates Messetagebuch für die **IFA Berlin** – SwiftUI + SwiftData, iOS 17+, nur lokal auf dem Gerät.

## Funktionen

## Web-App (iPhone ohne Xcode)

Die App läuft auch als **Website** (GitHub Pages) – ideal fürs iPhone:

**https://martin20231.github.io/Ifa/**

1. Link im Safari öffnen  
2. Teilen → **Zum Home-Bildschirm** (optional, wie eine App)  
3. Check-ins, Notizen und Fotos bleiben **lokal im Browser** gespeichert  

Quellcode der Web-Version: Ordner `docs/`

- **Hallen-Übersicht** als Liste (nach Bereich gruppiert) oder interaktives **Grundriss-Grid**
- **1-Tap-Check-in** (Liste: Plus-Button; Grid: langer Druck)
- **Detail pro Halle:** Hersteller/Stände, Notizen, Fotos via `PhotosPicker` (lokal gespeichert)
- **Verlauf & Statistik:** Timeline, Fortschrittsbalken, durchsuchbare Notizen/Hersteller
- **Persistenz** mit SwiftData (`Hall`, `VisitEvent`)

## Projektstruktur

```
IFATagebuch/
├── project.yml                 # optional: XcodeGen
├── README.md
└── IFATagebuch/
    ├── IFATagebuchApp.swift
    ├── Info.plist
    ├── Assets.xcassets/
    ├── Models/
    │   ├── Hall.swift
    │   ├── VisitEvent.swift
    │   └── HallSeed.swift
    ├── Services/
    │   ├── HallBootstrap.swift
    │   └── PhotoStorage.swift
    ├── ViewModels/
    │   ├── HallListViewModel.swift
    │   ├── HallDetailViewModel.swift
    │   └── StatsViewModel.swift
    └── Views/
        ├── RootTabView.swift
        ├── Components/
        ├── Halls/
        └── Stats/
```

## In Xcode öffnen

### Variante A – manuell (empfohlen, ohne Extra-Tools)

1. Xcode → **File → New → Project → App**
2. Product Name: `IFATagebuch`
3. Interface: **SwiftUI**, Language: **Swift**, Storage: **None** (SwiftData kommt aus dem Code)
4. Minimum Deployment: **iOS 17.0**
5. Die von Xcode erzeugte `ContentView.swift` / App-Datei löschen
6. Den Ordner `IFATagebuch/` (Models, Views, …) per Drag & Drop in das Xcode-Projekt ziehen  
   („Copy items if needed“, Target `IFATagebuch` anhaken)
7. In **Signing & Capabilities** dein Team wählen (für Gerät / Sideload)
8. Build & Run auf iPhone oder Simulator

### Variante B – mit XcodeGen

```bash
brew install xcodegen
cd IFATagebuch
xcodegen generate
open IFATagebuch.xcodeproj
```

## Bedienung vor Ort

| Aktion | Wo |
|--------|-----|
| Schnell einchecken | Liste: ✓ / + rechts; Grid: lange drücken |
| Details / Notizen / Fotos | Halle antippen |
| Grundriss | Segment-Control oben rechts |
| Fortschritt & Timeline | Tab **Verlauf** |

## Hinweise

- Kein Backend, keine Cloud, kein App-Store-Zwang – ideal für privates Sideloading (Xcode / Developer Account).
- Fotos liegen unter `Documents/HallPhotos/` der App-Sandbox.
- Hallenkatalog in `Models/HallSeed.swift` bei Bedarf anpassen (Namen, Reihenfolge, Grid-Positionen).

## Anforderungen

- Xcode 15+
- iOS 17+
- Swift 5.9+
