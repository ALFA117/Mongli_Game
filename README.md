```
 ███╗   ███╗ ██████╗ ███╗   ██╗ ██████╗ ██╗     ██╗
 ████╗ ████║██╔═══██╗████╗  ██║██╔════╝ ██║     ██║
 ██╔████╔██║██║   ██║██╔██╗ ██║██║  ███╗██║     ██║
 ██║╚██╔╝██║██║   ██║██║╚██╗██║██║   ██║██║     ██║
 ██║ ╚═╝ ██║╚██████╔╝██║ ╚████║╚██████╔╝███████╗██║
 ╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝ ╚══════╝╚═╝
         Tu memoria vive en la blockchain
```

![Routes](https://img.shields.io/badge/routes-22-d4a244)
![0G Storage](https://img.shields.io/badge/0G-Storage-22c55e)
![Zero Cup](https://img.shields.io/badge/Zero_Cup-2026-d4a244)

## Mongli Game — Amnesia Noir

Juego narrativo de amnesia psicológica con estética noir donde la IA escribe tu historia y la blockchain de 0G la guarda para siempre.

**Live:** https://mongli-game.vercel.app
**Hackathon:** Zero Cup 2026 · 0G Labs

---

## Game Modes

| Modo | Descripción |
|------|-------------|
| **Normal** | 5 actos, 3 fragmentos por acto, decisiones morales |
| **Speedrun** | Contrarreloj con countdown de 10s por decisión |
| **Pesadilla** | 3 actos, 5s countdown, game over si el tiempo se acaba |
| **Silencioso** | Sin texto — solo visuales CSS y símbolos |
| **New Game+** | Segunda vuelta con ecos de la partida anterior |

## Community Features

| Feature | Descripción |
|---------|-------------|
| **Galería** | Archivo público de identidades reveladas |
| **Votos** | Vota el fragmento más perturbador de la semana |
| **Diario** | Tus fragmentos como diario manuscrito |
| **Replay** | Ve tu partida como película cinematográfica |
| **Mapa mundial** | Actividad de jugadores en tiempo real |
| **Herencia** | Pasa un fragmento a otra wallet como legado |
| **Trazas** | Deja pistas anónimas en las partidas de otros |
| **Leaderboard** | Top 10 speedruns más rápidos |

## Architecture

```
Player → MetaMask → Next.js API → Claude/Gemini AI
                        │               │
                        │         Fragment JSON
                        ▼               ▼
                   0G Storage    ← SHA-256 hash
                        │
                        ▼
                   0G Chain (MongliMemory.sol)
                        │
                        ▼
                   FragmentSaved event
```

## Why 0G is NOT bolt-on

Sin 0G, los recuerdos se pierden al cerrar el browser.
Con 0G Storage, cada fragmento es permanente e inmutable.
Con 0G Chain, cada decisión es verificable on-chain.
La premisa narrativa **depende existencialmente** de 0G.

## Contract

```
MongliMemory.sol
Chain: 0G Galileo Testnet (16602)
Address: 0x81B600E7ACE4CEe5D698C39368B615A732d0E9f8
```

## Routes (22)

| Route | Type | Description |
|-------|------|-------------|
| `/` | Page | Landing con hero + wallet setup |
| `/game` | Page | 5 actos con save/load |
| `/speedrun` | Page | Modo contrarreloj |
| `/nightmare` | Page | Modo pesadilla |
| `/silent` | Page | Modo silencioso |
| `/trailer` | Page | Demo 90s sin wallet |
| `/about` | Page | Terminal interactiva |
| `/history` | Page | Expediente de partida |
| `/gallery` | Page | Archivo público |
| `/diary` | Page | Diario manuscrito |
| `/replay` | Page | Replay cinematográfico |
| `/revelation` | Page | Identidad compartible |
| `/judges` | Page | Dashboard jueces |
| `/leaderboard` | Page | Top speedruns |
| `/vote` | Page | Votación semanal |
| `/world` | Page | Mapa de actividad |
| `/api/generate` | API | AI cascade |
| `/api/save` | API | Save/load |
| `/api/gallery` | API | Galería |
| `/api/vote` | API | Votos |
| `/api/world` | API | Actividad |
| `/api/og` | API | OG image |

## Run Locally

```bash
git clone https://github.com/ALFA117/Mongli_Game.git
cd Mongli_Game && npm install
cp .env.local.example .env.local
npm run dev
```

## Developer

Edgar Lopez Baeza (@ALFA_EDG) · Zero Cup 2026 · 0G Labs

*Los recuerdos de cada jugador son únicos, permanentes e inviolables.*
