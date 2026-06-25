```
 ███╗   ███╗ ██████╗ ███╗   ██╗ ██████╗ ██╗     ██╗
 ████╗ ████║██╔═══██╗████╗  ██║██╔════╝ ██║     ██║
 ██╔████╔██║██║   ██║██╔██╗ ██║██║  ███╗██║     ██║
 ██║╚██╔╝██║██║   ██║██║╚██╗██║██║   ██║██║     ██║
 ██║ ╚═╝ ██║╚██████╔╝██║ ╚████║╚██████╔╝███████╗██║
 ╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝ ╚══════╝╚═╝
         Tu memoria vive en la blockchain
```

## Mongli Game — Amnesia Noir

Juego narrativo de amnesia psicológica con estética noir donde la IA escribe tu historia y la blockchain de 0G la guarda para siempre.

**Live:** https://mongli-game.vercel.app
**Hackathon:** Zero Cup 2026 · 0G Labs

---

## Cómo funciona

```
Conectas wallet (MetaMask)
        │
        ▼
5 ACTOS narrativos ──────────────────────────┐
        │                                     │
  Acto 1: El Despertar (hotel)                │
  Acto 2: La Ciudad (callejón)                │
  Acto 3: Los Documentos (oficina)     IA genera 3
  Acto 4: El Vacío                     fragmentos
  Acto 5: La Revelación (archivo)      por acto
        │                                     │
        ▼                                     │
  1 DECISIÓN por acto ◄──────────────────────┘
  (luz vs sombra)
        │
        ▼
  Fragmentos guardados en 0G Storage
  Decisión firmada en 0G Chain (MetaMask)
        │
        ▼
  REVELACIÓN: ¿El Arquitecto, El Testigo o El Espejo?
  (basada en el patrón de tus 5 decisiones)
```

## Por qué 0G no es bolt-on

Sin 0G, los recuerdos del jugador se pierden al cerrar el navegador.
Con 0G Storage, cada fragmento es permanente e inmutable.
Con 0G Chain, cada decisión es verificable on-chain.
La premisa narrativa ("tus recuerdos son tuyos para siempre")
**depende existencialmente** de 0G.

## Stack

| Tecnología | Uso |
|-----------|-----|
| Next.js 14 + TypeScript | Framework |
| Tailwind CSS | Estilos noir |
| Framer Motion | Animaciones |
| Claude / Gemini | Narrador IA (cascada dual) |
| 0G Storage | Almacenamiento permanente |
| 0G Chain (Galileo) | Contrato MongliMemory.sol |
| RainbowKit + wagmi | Wallet (MetaMask) |
| Web Audio API | Audio procedural |

## Contrato

```
MongliMemory.sol
Red: 0G Galileo Testnet (chain 16602)
Dirección: 0x81B600E7ACE4CEe5D698C39368B615A732d0E9f8
Explorer: https://chainscan-galileo.0g.ai/address/0x81B600E7ACE4CEe5D698C39368B615A732d0E9f8
```

## Correr localmente

```bash
git clone https://github.com/ALFA117/Mongli_Game.git
cd Mongli_Game
npm install
cp .env.local.example .env.local
# Editar .env.local con tus API keys
npm run dev
```

### Variables de entorno

```
ANTHROPIC_API_KEY=...     # Claude (de pago) — console.anthropic.com
GEMINI_API_KEY=...        # Gemini 1.5 Flash (gratis) — aistudio.google.com/apikey
NEXT_PUBLIC_CONTRACT_ADDRESS=0x81B600E7ACE4CEe5D698C39368B615A732d0E9f8
NEXT_PUBLIC_CHAIN_ID=16602
```

## Desarrollador

Edgar Lopez Baeza (@ALFA_EDG)
Zero Cup 2026 · 0G Labs Hackathon

---

*Los recuerdos de cada jugador son únicos, permanentes e inviolables.*
