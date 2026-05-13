# Forge — Agent Rules

Single-user offline-first PWA for gym logging.

## Source of truth

- Producto + decisiones: `/home/luca/repos/Obsidian/Projects/Forge/_canonical/sync.md`
- Arquitectura: `/home/luca/repos/Obsidian/Projects/Forge/v2/arquitectura.md`
- Stack: `/home/luca/repos/Obsidian/Projects/Forge/v2/stack.md`
- Modelo de datos: `/home/luca/repos/Obsidian/Projects/Forge/v2/modelo-de-datos.md`

Si algo aqui contradice el vault, **el vault gana** — actualiza este archivo.

## Reglas de oro

- **Calidad > velocidad SIEMPRE.** Conceptos antes que codigo.
- **TDD desde dia 1** en `domain/` (value objects, use cases, domain services).
- **Commits en espanol**, formato conventional. Ejemplo: `feat(training): agrega LogSetUseCase`.
- **NUNCA** agregar `Co-Authored-By: Claude` (ni similar) en commits.
- **Nunca** corras `ng build` despues de cambios salvo que se pida explicito (regla Luca).

## Arquitectura — recordatorio rapido

- Screaming Architecture (`features/`) + Clean por feature (`domain/` `data/` `ui/`).
- Direccion de dependencias: `ui -> domain <- data`. `domain/` NO importa `@angular/*`, RxJS ni Dexie.
- Dexie -> signals: use cases retornan `Promise<T>`, UI hace `await` + `signal.update(...)`. **NO `liveQuery` en `ui/`**.
- Repository bindings se proveen en `providers: []` de feature routes (lazy), no en `app.config.ts`.

## Comandos

- `npm start` — dev server (sin service worker)
- `npm run dev:pwa` — build + serve con service worker activo (para probar PWA local)
- `npm test` — Jest
- `npm run lint` — ESLint
- `npm run format` — Prettier

## Testing

- Co-located: `foo.ts` + `foo.spec.ts` lado a lado.
- Strict TDD activo (post-bootstrap). Runner: `npm test`.
- `fake-indexeddb/auto` esta registrado en `setup-jest.ts` para repositorios con Dexie.
