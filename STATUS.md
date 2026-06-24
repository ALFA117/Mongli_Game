# Mongli Game — Status Report
> Zero Cup 2026 | 0G Labs Hackathon | Deadline: 24 Jun 2026, 11:00 AM CDT

## Contrato desplegado
- **Network:** 0G Galileo Testnet (chainId: 16602)
- **Contract:** `0x2ee1d7432de8e722f5b7597f907ac53b45ab4afd`
- **TX:** `0x84fd4ed84b8f7855a8dc74413e11a06d2e994fe8fbba78740c73fcf251714184`
- **Deployer:** `0x2E64066Fb794e1241b0F27b4DD02dC8fC0A3C04f`

## Deploy en Vercel
- **URL:** _pendiente — deploy en progreso_

---

## Hecho

- [x] Proyecto Next.js 16 + TypeScript + Tailwind CSS
- [x] Estética noir completa (paleta oscura, tipografía máquina de escribir)
- [x] Pantalla de inicio con wallet connect (RainbowKit)
- [x] Selección de 3 escenas iniciales
- [x] Integración Claude Sonnet 4.6 para generación narrativa
- [x] API Route `/api/generate` con prompt system noir
- [x] Fragmentos con animación typewriter (letra por letra)
- [x] Panel de elección binaria (dark/light)
- [x] Mapa de recuerdos (grilla 5x3 con nodos bloqueados)
- [x] Barra de progreso visual (15 fragmentos)
- [x] Sistema de 3 actos narrativos
- [x] Integración 0G Storage (upload fragmentos como blob JSON)
- [x] Integración 0G Chain (MongliMemory.sol desplegado)
- [x] Smart contract MongliMemory.sol verificable
- [x] Toast de confirmación on-chain
- [x] Repo en GitHub: https://github.com/ALFA117/Mongli_Game.git
- [x] Galileo Testnet configurada (chainId 16602 verificado)

## Pendiente

- [ ] Deploy en Vercel con variables de entorno
- [ ] Verificar flujo completo en producción
- [ ] Fragmentos bloqueados con blur + candado (visual listo, lógica pendiente)
- [ ] Acto III: síntesis final con todo el historial de 0G
- [ ] Video demo de 2 min para submission
- [ ] Descripción en la plataforma Arena

## Errores conocidos

- El 0G Storage RPC (`storagerpc-testnet.0g.ai`) puede no estar disponible; el sistema tiene fallback a hash local
- WalletConnect projectId es placeholder (`mongli-game-dev`); funciona en dev pero necesita un ID real para producción
- La integración on-chain desde el frontend requiere que el usuario firme cada fragmento (UX friction)

---

*Generado: 24 Jun 2026 | Dev: Edgar Lopez Baeza (@ALFA_EDG)*
