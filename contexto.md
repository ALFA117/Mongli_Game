# MONGLI GAME — Contexto completo del proyecto

## Qué es

Mongli Game es un juego narrativo de misterio psicológico con estética **noir oscura** desarrollado para el hackathon **Zero Cup 2026** organizado por **0G Labs** (blockchain descentralizada para IA).

El jugador despierta sin saber quién es. Cada decisión desbloquea un **fragmento de memoria** generado por la IA Claude Sonnet 4.6, que se guarda permanentemente en la blockchain de 0G.

**Pitch:** "Juego de amnesia donde la IA escribe tu historia y la blockchain la guarda para siempre."

---

## Participante

- **Nombre:** Edgar Lopez Baeza
- **Handle:** @ALFA_EDG
- **Ubicación:** México
- **Email:** elopezbaeza705@gmail.com
- **Hackathon:** Zero Cup 2026 — 0G Labs
- **Deadline:** 24 de junio 2026, 11:00 AM CDT México

---

## URLs y deploy

| Recurso | URL / Dirección |
|---|---|
| **Producción (Vercel)** | https://mongli-game.vercel.app |
| **Repositorio GitHub** | https://github.com/ALFA117/Mongli_Game.git |
| **Branch** | master |
| **Vercel project** | alfa117s-projects/mongli-game |
| **Smart contract** | `0x2ee1d7432de8e722f5b7597f907ac53b45ab4afd` |
| **TX del deploy** | `0x84fd4ed84b8f7855a8dc74413e11a06d2e994fe8fbba78740c73fcf251714184` |
| **Red** | 0G Galileo Testnet (chainId: 16602) |
| **RPC** | https://evmrpc-testnet.0g.ai |
| **Explorer** | https://chainscan-galileo.0g.ai |
| **Deployer wallet** | `0x2E64066Fb794e1241b0F27b4DD02dC8fC0A3C04f` |

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 + TypeScript |
| Estilos | Tailwind CSS + inline styles |
| Fuentes | Special Elite, Creepster, IBM Plex Mono (Google Fonts) |
| Animaciones | Framer Motion + CSS animations |
| 3D | Three.js + @react-three/fiber + @react-three/drei (solo fondo) |
| Audio | Web Audio API nativo (drone + harmónicos + ruido + latido) |
| IA narrativa | Claude Sonnet 4.6 (Anthropic API) |
| Blockchain | 0G Chain (Galileo Testnet) — Solidity smart contract |
| Storage | 0G Storage (con fallback a hash local) |
| Wallet | wagmi + MetaMask (sin WalletConnect) |
| Deploy frontend | Vercel |
| Deploy contrato | Hardhat 3 + viem |

---

## Variables de entorno (Vercel + .env.local)

```
ANTHROPIC_API_KEY=sk-ant-api03-... (Claude API key)
NEXT_PUBLIC_CHAIN_ID=16602
NEXT_PUBLIC_CONTRACT_ADDRESS=0x2ee1d7432de8e722f5b7597f907ac53b45ab4afd
NEXT_PUBLIC_OG_CHAIN_RPC=https://evmrpc-testnet.0g.ai
OG_STORAGE_RPC=https://storagerpc-testnet.0g.ai
PRIVATE_KEY=0x... (solo para deploy del contrato, no en producción)
```

**IMPORTANTE:** Las variables en Vercel se agregaron con `bash printf` para evitar BOM (Byte Order Mark) que causaba errores 500 en la API.

---

## Estructura de archivos

```
mongli-game/
├── app/
│   ├── page.tsx              — Pantalla de inicio (skull, wallet, escenas)
│   ├── layout.tsx            — Layout raíz (fuentes, providers)
│   ├── globals.css           — CSS global (scanlines, glitch, rain, etc.)
│   ├── game/
│   │   └── page.tsx          — Página del juego (mapa, fragmentos, elecciones)
│   └── api/
│       └── generate/route.ts — API Route: llama a Claude, sube a 0G
├── components/
│   ├── SVGSkull.tsx          — Cráneo SVG 450x500 con glow rojo
│   ├── CSSRain.tsx           — 20 gotas de lluvia CSS
│   ├── CSSSkull.tsx          — Cráneo CSS 3D (versión anterior)
│   ├── CursorGlow.tsx        — Disco rojo que sigue al mouse
│   ├── FloatingDust.tsx      — 30 partículas de polvo flotante
│   ├── FogLayer.tsx          — 8 blobs de niebla roja con blur
│   ├── GlitchFlash.tsx       — Flash aleatorio cada 8-15s + sonido
│   ├── GlitchTitle.tsx       — Título MONGLI con glitch rojo/cian
│   ├── Typewriter.tsx        — Efecto typewriter para texto
│   ├── PixelCharacter.tsx    — 3 sprites pixel art (canvas → dataURL → img)
│   ├── PathMap.tsx           — Mapa SVG lineal con bifurcaciones
│   ├── MemoryMap.tsx         — Mapa hexagonal SVG (versión anterior)
│   ├── Fragment.tsx          — Card de fragmento con typewriter
│   ├── ChoicePanel.tsx       — Panel de elección binaria
│   ├── HUD.tsx               — Overlay: progreso, acto, wallet, minimap
│   ├── Toast.tsx             — Notificación terminal [0G]
│   ├── ChainBeam.tsx         — Línea de luz al guardar en 0G
│   ├── LoadingScreen.tsx     — Boot terminal estilo retro
│   ├── LoadingSequence.tsx   — Secuencia de carga multi-paso
│   ├── Scene3D.tsx           — Escena Three.js (piso, lluvia 3D, luces)
│   ├── Skull3D.tsx           — Cráneo Three.js (versión anterior)
│   ├── MobileJoystick.tsx    — Joystick virtual táctil
│   ├── WalletButton.tsx      — Botón MetaMask custom
│   ├── Providers.tsx         — Wagmi + React Query providers
│   ├── AmbientAudio.tsx      — Componente de audio (versión anterior)
│   ├── RainEffect.tsx        — Lluvia canvas (versión anterior)
│   ├── StaticNoise.tsx       — Estática canvas (versión anterior)
│   └── DustParticles.tsx     — Polvo canvas (versión anterior)
├── lib/
│   ├── types.ts              — Fragment, Choice, GameState, INITIAL_SCENES
│   ├── claude.ts             — Llamada a Anthropic API con prompt noir
│   ├── og-storage.ts         — Upload/download a 0G Storage
│   ├── og-chain.ts           — Interacción con contrato MongliMemory
│   ├── wagmi.ts              — Config wagmi + Galileo Testnet chain
│   ├── useMovement.ts        — Hook WASD/flechas + joystick móvil
│   └── ambientAudio.ts       — Web Audio API: drone, harmónicos, latido
├── contracts/
│   └── MongliMemory.sol      — Smart contract (saveFragment, getFragment)
├── scripts/
│   └── deploy.ts             — Script de deploy con viem
├── hardhat.config.ts         — Config Hardhat 3 para Galileo
├── vercel.json               — Config de deploy Vercel
├── .env.local                — Variables de entorno (NO en git)
├── STATUS.md                 — Estado del proyecto
├── MONGLI_GAME_CONTEXT.md    — Documento original de diseño
└── contexto.md               — Este archivo
```

---

## Mecánicas del juego

### Loop principal
1. Jugador conecta wallet MetaMask
2. Elige escena inicial (El callejón / La oficina / El tren)
3. La API `/api/generate` llama a Claude con prompt noir + historial
4. Claude devuelve: fragmento narrativo + 2 opciones
5. Fragmento se sube a 0G Storage → hash se registra en 0G Chain
6. Jugador elige opción A o B → alimenta el siguiente fragmento
7. Repetir hasta fragmento 15

### Arco narrativo (3 actos, 15 fragmentos)
- **Acto I (1-5) — LA AMNESIA:** Identidad desconocida, desorientación
- **Acto II (6-12) — EL DESDOBLAMIENTO:** Dos identidades posibles emergen
- **Acto III (13-15) — LA REVELACIÓN:** Síntesis final basada en todas las decisiones

### Smart contract (MongliMemory.sol)
```solidity
function saveFragment(bytes32 _hash, uint256 _fragmentId) external
function getFragment(address player, uint256 fragmentId) view returns (bytes32)
event FragmentSaved(address indexed player, bytes32 indexed hash, uint256 fragmentId)
```

### Prompt system para Claude
- Narrador en primera persona, tono noir oscuro/poético
- 80-120 palabras por fragmento
- Responde en JSON: { fragment_text, tone_score, tags[], traces[], choices[] }
- Recibe contexto: últimos 3 fragmentos desde 0G + decisión actual

---

## Efectos visuales implementados

| Efecto | Implementación |
|---|---|
| Cráneo SVG | 450×500, paths anatómicos, ojos con glow rojo, dientes, grietas |
| Lluvia | 20 divs CSS con animation rain-fall |
| Niebla | 8 blobs rojos blur(80px) con scale pulsante |
| Polvo | 30 partículas CSS (22 sepia + 8 rojas), opacity 0.3-0.7 |
| Estática TV | SVG feTurbulence inline como background |
| Scanlines | repeating-linear-gradient 3px |
| Vignette | box-shadow inset 200px |
| Glitch título | 3 capas con clip-path, colores rojo/cian, keyframes agresivos |
| Glitch flash | Flash blanco cada 8-15s + sonido estática |
| Cursor glow | Disco rojo 200px sigue al mouse |
| Typewriter | Letra por letra a 30ms con cursor ▌ parpadeante |
| Audio | Drone 55Hz + 110Hz + ruido filtrado + latido cada 2-3s |
| Chain beam | Línea de luz vertical al confirmar transacción |
| Pixel art | 3 personajes 64×64 canvas → dataURL → img |

---

## Historial de desarrollo (11 commits)

1. **Initial commit** — Create Next App base
2. **MVP completo** — Next.js + Claude + 0G + RainbowKit + todos los archivos
3. **ChainId fix** — Corregido de 16600 a 16602, contrato desplegado
4. **Vercel deploy** — STATUS.md con URL y contract address
5. **3 critical fixes** — RPC BOM, WalletConnect→MetaMask, API diagnostics
6. **API working** — Anthropic SDK instanciado dentro de función, env vars limpias
7. **UI redesign** — Three.js skull, hexagonal map, horror theme completo
8. **3D overhaul** — @react-three/fiber scene, pixel characters, loading screen
9. **Performance** — CSS rain/noise/skull, optimized pixels, movement hooks
10. **Audio + layout** — Ambient audio, fog, cursor glow, CSS Grid, path map
11. **Layout fix** — Reescritura completa, SVG skull, audio autoplay, partículas

---

## Problemas resueltos

| Problema | Causa | Solución |
|---|---|---|
| RPC 404 | BOM character en env var | Hardcoded clean URL |
| WalletConnect 403 | projectId inválido | Migrar a MetaMask directo via wagmi |
| API 500 | BOM en ANTHROPIC_API_KEY de Vercel | Re-agregar con `bash printf` |
| ChainId incorrecto | Docs decían 16600, RPC devuelve 16602 | Verificar con eth_chainId |
| Layout encimado | Mezcla de position absolute + flex + z-index | Reescritura con flex puro |
| Three.js lento | Demasiados polígonos + sombras | CSS skull + BasicMaterial |
| Canvas pesado | 200 partículas requestAnimationFrame | 20 CSS divs con animation |

---

## Qué falta para completar (pendientes)

- [ ] Verificar flujo completo en producción (wallet → fragmento → 0G → elección)
- [ ] Integración real de saveFragment on-chain desde el frontend (requiere firma)
- [ ] Video demo de 2 minutos para submission
- [ ] Descripción del proyecto en la plataforma Arena
- [ ] Fragmentos bloqueados con blur + candado (visual hecho, lógica pendiente)
- [ ] Los 3 actos completos jugados y verificados end-to-end
- [ ] Mobile responsive completo (joystick implementado, layout por verificar)

---

*Documento generado el 24 de junio de 2026*
*Proyecto: Mongli Game — Zero Cup 2026 · 0G Labs Hackathon*
*Desarrollador: Edgar Lopez Baeza (@ALFA_EDG)*
*Asistente: Claude Sonnet 4.6 via Claude Code*
