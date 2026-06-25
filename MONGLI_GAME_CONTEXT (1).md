# MONGLI GAME — Contexto completo para Claude Code
> Documento de arranque para desarrollo inmediato. Deadline: **24 Jun, 11:00 AM CDT (México)**

---

## 0. Situación actual

- Hackathon: **Zero Cup 2026** organizado por 0G Labs (blockchain descentralizada para IA)
- Participante: **Edgar Lopez Baeza (@ALFA_EDG)**, México
- Deadline extendido: **24 de junio, 12:00 PM EDT / 11:00 AM CDT México**
- Tiempo disponible: ~9 horas desde ahora
- Estado del proyecto: **cero código escrito**, arranque desde cero
- Nombre del proyecto: **Mongli Game**

---

## 1. Qué es Mongli Game

Juego narrativo de misterio psicológico con estética **noir oscura**. El jugador despierta sin saber quién es. Cada decisión desbloquea un **fragmento de memoria** generado por IA que se guarda permanentemente en la blockchain de 0G.

### Pitch de una línea
> "Juego de amnesia donde la IA escribe tu historia y la blockchain la guarda para siempre."

### Por qué gana votos comunitarios
- Jugable en 5 minutos
- El contenido generativo es diferente para cada jugador
- "Mis recuerdos on-chain" es un tweet natural
- El horror psicológico + noir es visualmente impactante y shareable

---

## 2. Sobre 0G (la plataforma del hackathon)

0G es una blockchain modular diseñada para IA. Tiene 4 capas:

| Capa | Qué hace | Cómo la usa Mongli |
|------|----------|-------------------|
| **0G Storage** | Almacenamiento descentralizado permanente | Guarda cada fragmento de memoria generado |
| **0G Compute** | GPU descentralizado para inferencia IA | Ejecuta las llamadas narrativas a la IA |
| **0G Chain** | L1 EVM-compatible | Emite eventos onchain por fragmento desbloqueado |
| **0G DA** | Data availability | No se usa en MVP |

**Testnet activa:** Galileo Testnet
**SDK:** `@0glabs/0g-ts-sdk`
**Faucet:** https://faucet.0g.ai (tokens de prueba gratuitos)
**Docs builder:** https://build.0g.ai

### Regla crítica del hackathon
> "0G tiene que hacer trabajo real en tu app: si corre igual sin él, es un bolt-on y no califica."

En Mongli, sin 0G la premisa narrativa ("tus recuerdos son permanentes e inviolables") se rompe. El juego depende existencialmente de 0G Storage.

---

## 3. Game Design — Mecánicas completas

### Loop principal (se repite cada turno)
```
1. EXPLORAR  → El jugador ve una escena (lugar, objeto, persona)
2. GENERAR   → La IA crea un fragmento de memoria (80-120 palabras, noir, primera persona)
3. GUARDAR   → El fragmento se sube a 0G Storage, hash se registra en 0G Chain
4. DECIDIR   → El jugador elige entre 2 opciones que moldean el siguiente fragmento
5. REPEAT    → La IA recibe el historial de 0G + la decisión como contexto
```

### Fragmento de memoria (unidad básica)
- Texto corto (80-120 palabras) en primera persona
- Tono: oscuro, ambiguo, perturbador
- Estética: polaroid que se va revelando
- Datos guardados en 0G: `{ fragment_text, choice_made, fragment_id, timestamp, tone_score }`
- Hash del fragmento registrado en 0G Chain

### Mapa de recuerdos (vista principal)
- Grafo visual de nodos conectados
- Cada nodo = un fragmento desbloqueado
- Algunos nodos bloqueados (requieren "trazas" acumuladas)
- El jugador puede hacer click en cualquier fragmento para releerlo

### Elecciones binarias
Al final de cada fragmento, siempre 2 opciones que contrastan:
- Recordar con culpa vs con alivio
- Avanzar vs huir
- Confiar vs sospechar
La elección se pasa como contexto a la próxima generación

### Arco narrativo (3 actos)
- **Acto I** (fragmentos 1–5): Identidad desconocida, fragmentos ambiguos
- **Acto II** (fragmentos 6–12): Dos identidades posibles emergen (¿héroe o villano?)
- **Acto III** (fragmentos 13–15): La IA sintetiza TODO el historial de 0G y genera la revelación final única por jugador

### Fragmentos bloqueados
- Algunos fragmentos están cifrados visualmente en el mapa
- Se desbloquean acumulando "trazas" (pistas extraídas automáticamente de fragmentos anteriores)
- Crea tensión y recompensa la atención

---

## 4. Stack técnico

### Frontend
```
Framework:    Next.js 14 + TypeScript
Estilos:      Tailwind CSS
Animaciones:  Framer Motion (revelado de polaroids)
Mapa nodos:   Canvas API o react-flow (grafo de fragmentos)
Wallet:       RainbowKit + wagmi
```

### IA Narrativa
```
Modelo:       claude-sonnet-4-6 (Anthropic API)
Prompt:       Sistema con instrucciones de tono noir
              + historial de últimos 3 fragmentos desde 0G Storage
              + decisión actual del jugador
Respuesta:    JSON estructurado: { fragment_text, tags[], tone_score, unlocked_traces[] }
```

### 0G Integration
```
SDK:          @0glabs/0g-ts-sdk
Storage:      Subir fragmento como blob JSON → recibir hash
Chain:        Contrato Solidity: saveFragment(bytes32 hash, uint256 fragmentId)
              emite evento: FragmentSaved(address player, bytes32 hash, uint256 id)
Network:      Galileo Testnet (chainId: verificar en docs 0G)
```

### Smart Contract (Solidity)
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MongliMemory {
    event FragmentSaved(address indexed player, bytes32 indexed hash, uint256 fragmentId);
    
    mapping(address => uint256) public fragmentCount;
    mapping(address => mapping(uint256 => bytes32)) public fragments;
    
    function saveFragment(bytes32 _hash, uint256 _fragmentId) external {
        fragments[msg.sender][_fragmentId] = _hash;
        fragmentCount[msg.sender]++;
        emit FragmentSaved(msg.sender, _hash, _fragmentId);
    }
    
    function getFragment(address player, uint256 fragmentId) external view returns (bytes32) {
        return fragments[player][fragmentId];
    }
}
```

### Prompt System para la IA (base)
```
SYSTEM:
Eres el narrador de Mongli Game, un juego noir de amnesia psicológica.
Escribe en primera persona del personaje (sin nombre).
Tono: oscuro, poético, perturbador. Frases cortas. Años 40 digitales.
El personaje no sabe quién es. Cada fragmento revela una pieza.
Mantén coherencia con el historial recibido.
Longitud: exactamente 80-120 palabras.
Responde SOLO en JSON: { "fragment_text": "...", "tone_score": 0-10, "tags": [], "traces": [] }

CONTEXT (historial desde 0G):
[últimos 3 fragmentos]

USER:
Escena actual: [descripción de escena]
Decisión anterior: [elección del jugador]
Genera el siguiente fragmento de memoria.
```

### Deploy
```
Frontend:     Vercel (un click desde GitHub)
Contrato:     Hardhat → deploy en Galileo Testnet
Backend API:  Next.js API Routes (no servidor separado)
```

---

## 5. Estructura de carpetas sugerida

```
mongli-game/
├── app/
│   ├── page.tsx              # Pantalla de inicio (wallet connect)
│   ├── game/
│   │   ├── page.tsx          # Vista principal del juego
│   │   └── map/page.tsx      # Mapa de recuerdos
│   └── api/
│       └── generate/route.ts # API route: genera fragmento con Claude
├── components/
│   ├── Fragment.tsx           # Polaroid animada de un fragmento
│   ├── MemoryMap.tsx          # Grafo de nodos
│   ├── ChoicePanel.tsx        # Panel de elección binaria
│   └── WalletButton.tsx       # Conectar wallet
├── lib/
│   ├── og-storage.ts          # Upload/download fragmentos a 0G Storage
│   ├── og-chain.ts            # Interacción con contrato MongliMemory
│   ├── claude.ts              # Llamada a Anthropic API con contexto
│   └── types.ts               # Fragment, Choice, GameState types
├── contracts/
│   └── MongliMemory.sol       # Contrato principal
├── hardhat.config.ts
├── .env.local                 # ANTHROPIC_API_KEY, PRIVATE_KEY, etc
└── package.json
```

---

## 6. Flujo técnico completo (end-to-end)

```
Jugador conecta wallet
        ↓
Elige una escena inicial (3 opciones predefinidas)
        ↓
Frontend llama a /api/generate con { scene, history: [] }
        ↓
API Route:
  1. Recupera últimos 3 fragmentos desde 0G Storage (si existen)
  2. Llama a Claude claude-sonnet-4-6 con prompt system + contexto
  3. Recibe JSON { fragment_text, tone_score, tags, traces }
  4. Sube fragmento a 0G Storage → recibe storageHash
  5. Llama al contrato: saveFragment(storageHash, fragmentId)
  6. Devuelve al frontend: { fragment, storageHash, txHash }
        ↓
Frontend muestra fragmento con animación de revelado (polaroid)
        ↓
Jugador elige entre 2 opciones
        ↓
Loop vuelve a /api/generate con la nueva decisión
```

---

## 7. Variables de entorno necesarias

```env
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_CHAIN_ID=...          # Galileo Testnet chain ID
NEXT_PUBLIC_CONTRACT_ADDRESS=0x... # Dirección del contrato desplegado
PRIVATE_KEY=0x...                  # Para deploy del contrato (solo dev)
OG_STORAGE_RPC=...                 # RPC de 0G Storage
OG_CHAIN_RPC=...                   # RPC de Galileo Testnet
```

---

## 8. Estética visual (instrucciones de diseño)

### Paleta
```
Fondo:        #0a0a0a (casi negro)
Texto:        #e8d5b0 (ámbar/sepia)
Acento:       #c4923a (ámbar oscuro)
Bordes:       #2a2a2a
Fragmento:    #111111 con borde sepia
Bloqueado:    blur(4px) + overlay negro 70%
```

### Tipografía
```
Display:      'Special Elite' (Google Fonts) — máquina de escribir
Body:         'IBM Plex Mono' — monospace limpio
```

### Animaciones clave
```
Revelado de fragmento: opacidad 0→1 + efecto de máquina de escribir (letra por letra)
Guardado en 0G: small toast "Fragmento grabado en cadena ✓ [hash abreviado]"
Mapa de nodos: nodos que aparecen con fade + líneas que se dibujan
Fragmento bloqueado: blur + ícono de candado
```

---

## 9. MVP mínimo para el deadline (prioridad absoluta)

Para el Group Stage solo necesitas demostrar el loop completo. En orden de prioridad:

1. ✅ Wallet connect (RainbowKit)
2. ✅ Llamada a Claude claude-sonnet-4-6 que genera un fragmento narrativo
3. ✅ Guardar fragmento en 0G Storage (aunque sea básico)
4. ✅ Emitir evento en 0G Chain (saveFragment)
5. ✅ Mostrar fragmento con animación polaroid
6. ✅ Elección binaria que alimenta el siguiente fragmento
7. ⬜ Mapa de recuerdos (si queda tiempo)
8. ⬜ Fragmentos bloqueados (si queda tiempo)
9. ⬜ Los 3 actos completos (rondas siguientes)

---

## 10. Lo que tienes que entregar el 24 Jun

- **Repo público en GitHub** con todo el código
- **Demo funcional** (Vercel deploy o video de 2 min)
- **Descripción** del proyecto en la plataforma de Arena

### Descripción sugerida para el submission
```
Mongli Game es un juego narrativo de amnesia psicológica con estética noir donde 
la IA genera tu historia y la blockchain de 0G la guarda para siempre.

Cada decisión desbloquea un fragmento de memoria generado por Claude IA, 
almacenado permanentemente en 0G Storage y registrado en 0G Chain. 
Tus recuerdos son tuyos. Nadie puede borrarlos.

Stack: Next.js + Claude claude-sonnet-4-6 + 0G Storage + 0G Chain (Galileo Testnet)
```

---

## 11. Comandos para arrancar

```bash
# Crear proyecto
npx create-next-app@latest mongli-game --typescript --tailwind --app

# Instalar dependencias
cd mongli-game
npm install @0glabs/0g-ts-sdk ethers @anthropic-ai/sdk
npm install @rainbow-me/rainbowkit wagmi viem
npm install framer-motion
npm install hardhat @nomicfoundation/hardhat-toolbox

# Dev server
npm run dev
```

---

*Documento generado por Claude (claude.ai) el 23 de junio de 2026.*
*Proyecto: Mongli Game — Zero Cup 2026 · 0G Labs Hackathon*
*Desarrollador: Edgar Lopez Baeza (@ALFA_EDG)*
