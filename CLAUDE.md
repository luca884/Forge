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
- **Nunca** corras `ng build` como post-cambio automatico (regla Luca). Excepcion: si el slice toca templates, `ng build` o `npm start` son el gate canonico de validacion (ver seccion Testing abajo) — eso SI esta permitido.

## Arquitectura — recordatorio rapido

- Screaming Architecture (`features/`) + Clean por feature (`domain/` `data/` `ui/`).
- Direccion de dependencias: `ui -> domain <- data`. `domain/` NO importa `@angular/*`, RxJS ni Dexie.
- Dexie -> signals: use cases retornan `Promise<T>`, UI hace `await` + `signal.update(...)`. **NO `liveQuery` en `ui/`**.
- Repository bindings se proveen en `providers: []` de feature routes (lazy), no en `app.config.ts`.

## Comandos

- `npm start` — dev server (sin service worker)
- `npm run build` — build de produccion (AOT + tree-shaking + strictTemplates + service worker). `defaultConfiguration: production` en angular.json
- `npm run dev:pwa` — build + serve con service worker activo (para probar PWA local)
- `npm test` — Jest
- `npm run lint` — ESLint
- `npm run format` — Prettier

## Testing

- Co-located: `foo.ts` + `foo.spec.ts` lado a lado.
- Strict TDD activo (post-bootstrap). Runner: `npm test`.
- `fake-indexeddb/auto` esta registrado en `setup-jest.ts` para repositorios con Dexie.

### Gate canonico de templates — Jest NO valida `strictTemplates`

`npm test` (Jest / `jest-preset-angular` + `ts-jest`) **NO valida `strictTemplates` ni binding errors de Angular**. Aunque `tsconfig.json` tenga `"strictTemplates": true`, jest-preset-angular lo ignora al transpilar.

Solo `ngc` (el compilador real de Angular) los detecta. Usarlo via:

- `npm start` (`ng serve`) — falla al boot si hay binding errors. Gate rapido en desarrollo.
- `npm run build` — gate canonico: strictTemplates + produccion (tree-shaking, AOT completo). `ng build` usa `defaultConfiguration: production`.
- `npm run e2e` — corre `ng serve` internamente; sirve como gate de templates indirecto.

**Regla**: antes de cerrar un slice que toca templates (bindings, `@Input`, `@Output`, pipes, directivas), corra `npm start` o `ng build` para confirmar que compila. Tests Jest en verde NO son suficientes.

Origen: slice `e2e-foundation` (archive #564, commit `67716d4`) — 6 errores latentes de templates introducidos en slice 3 WIP no fueron detectados por 869 tests Jest verdes durante semanas. Aparecieron solo al correr `ng serve` durante setup de E2E.
