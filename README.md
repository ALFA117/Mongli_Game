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

## FIX_NOTES (rediseño /diseno, 2026-10-11)

- **La intro de ~10 s salía en cada visita y no se podía saltar.** La pantalla "reconstruyendo identidad" es ambientación (su progreso es aleatorio, no carga nada real). Ahora sale una vez por sesión, se salta con un toque, Esc, Enter o espacio (con el aviso "Toca para saltar · Esc"), y no aparece con `prefers-reduced-motion`.
- **Contraste**: "Jugar sin cuenta" (`#555`, 2.9:1), la nota de modos (`#333`, 1.6:1) y el separador "o" (`#222`) ahora usan el gris hueso de la marca. 58 textos en `text-noir-muted/20–70` y `text-noir-text/50–60` (entre ~1.5:1 y 3:1) subieron a `noir-muted` sólido y `noir-text/75`.
- **Texto por debajo de 12 px**: 186 usos de `text-[8–11px]`, `0.5–0.6rem` y `fontSize: 8–11` en 30 archivos subieron a 12 px. La imagen OG (`app/api/og`) no se tocó, porque se dibuja a 1200 px.
- **Áreas táctiles**: los enlaces del pie (GitHub, About, Archivo, Votos…) y los de Speedrun, Trailer y Mapa pasaron de 14–16 px a 44 px de alto, y el pie hace wrap en celular. Los modos secretos (Pesadilla, Silencioso) siguen discretos, pero subieron de 30 % a 50 % de opacidad.
- **SEO**: se agregaron `metadataBase`, canonical, `robots.ts`, `sitemap.ts` y `app/apple-icon.png`.

## DESIGN_NOTES

- **Fondo 3D: el dado sacó la receta 3 (globo de puntos con arcos).** Se adaptó como una **esfera de memoria**: 680 fragmentos de identidad (320 en celular) en el hueso de la marca (`#E5DEC9`) giran despacio alrededor de la calavera. Cada 1.6 s un **arco rojo** une dos recuerdos (uno que se recupera) y deja una chispa, y algunos fragmentos se apagan a ratos, como señal corrupta. Capas: niebla roja lejana (CSS), esfera (canvas) y viñeta noir, con una zona más oscura detrás del párrafo del hero. El puntero inclina y gira la esfera y el scroll la sube. `components/AmbientBackground.tsx`, montado en `layout.tsx`.
- **Intensidad por pantalla**: 100 % en la portada, 55 % en las páginas secundarias y 25 % dentro de `/game`, para no competir con la narración. DPR ≤ 2, pausa con la pestaña oculta y una sola escena quieta con movimiento reducido.
- **No se hizo modo claro.** Es un thriller noir con 371 colores inline (el motor del juego, la calavera, los paneles de decisión), y un tema claro rompería la atmósfera, que es parte del producto. Queda anotado como decisión, no como olvido.

### Checklist de 2 minutos en el celular

1. Abre el juego: aparece la intro; tócala y se salta. Recarga: ya no sale (misma sesión).
2. Detrás de la calavera giran puntos hueso y, cada tanto, un arco rojo une dos.
3. "Jugar sin cuenta" y la nota de abajo se leen sin esfuerzo.
4. Los enlaces del pie se tocan sin fallar y no se salen de la pantalla.
5. Entra a jugar: el fondo casi desaparece.
