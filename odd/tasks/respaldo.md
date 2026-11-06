# respaldo

Objetivo: exportar todos los datos de Forge a un archivo JSON y restaurarlos desde ese archivo · Por qué: los datos viven solo en IndexedDB del teléfono; el CSV no se puede volver a importar y perder el navegador o cambiar de teléfono borra el historial.
Rama: `feat/respaldo` desde `468ed81` · Entrega: single-pr · Runner: `npx jest` / `npx playwright test` · Mirror Engram: `odd/respaldo/tasks` (ok) · Modelo: Opus de punta a punta (caso 5: grande y de alto riesgo, datos)
Pronóstico: ~650 líneas cambiadas (agregadas + borradas, sin generados) · Heurística por tarea: ~400 (no es límite)

## Specs

Alcance: exportar un respaldo completo en JSON desde Perfil y restaurarlo desde un archivo, reemplazando los datos actuales. · Fuera de alcance: combinar datos, respaldo automático o en la nube, migrar respaldos de un esquema futuro a uno viejo.
Restricciones: Dexie esquema v3 con 8 tablas (`src/app/core/db/database.ts:123-157`); fechas guardadas como `Date`; los repos se proveen por ruta; budget de bundle inicial 450 kB.

- S1: "Propongo un respaldo completo en JSON (rutinas, días, ejercicios, sesiones, récords y perfil) más su importación." (propuesta aceptada con "dale, vamos con el respaldo") — Aceptación: Perfil ofrece descargar `forge-respaldo-AAAA-MM-DD.json` con las 8 tablas (profile, routines, trainingDays, exercises, sessions, workedSets, personalRecords, auditEvents), y elegir un archivo para restaurarlo; exportar y restaurar devuelve los mismos datos (fechas incluidas). — Checks: unit del codec y del store, e2e de ida y vuelta.
- S2: "borrar los viejos y poner los nuevos" — Aceptación: restaurar borra todos los datos actuales y deja exactamente los del archivo, después de una confirmación que dice que se reemplaza todo; la app muestra lo restaurado sin estado viejo en memoria. — Checks: unit del store (reemplazo), e2e (dato previo desaparece, dato del archivo aparece).
- S3 (supuesto): un archivo inválido (no es JSON, no es respaldo de Forge, versión desconocida, filas mal formadas) se rechaza con un mensaje y no toca los datos; el reemplazo es atómico (si falla a mitad, quedan los datos previos). — Checks: unit del codec y del store, e2e con archivo inválido.
- S4 (supuesto): las preferencias del dispositivo en localStorage (tema, descanso, pantalla encendida) no entran en el respaldo.

## Tasks

- [x] T1 · S1, S3 · ruta: inline · Aceptación: formato `{ format: 'forge-backup', version: 1, exportedAt, data }`; `serializeBackup` y `parseBackup` (revive fechas por tabla, valida y rechaza con `InvalidBackupError`) en `core/shared/domain/backup/` · Evidencia: RED (módulo inexistente) → GREEN `backup.spec.ts` 16/16, eslint limpio · commit `8d250da` · Risk: item 1 (formato persistido)
- [x] T2 · S1, S2, S3 · ruta: inline · Aceptación: puerto `BackupStore` + `DexieBackupStore` (`readAll` de las 8 tablas; `replaceAll` en una transacción rw: clear + bulkAdd, rollback si falla) con tests sobre fake-indexeddb · Evidencia: RED (módulo inexistente) → GREEN `dexie-backup-store.spec.ts` 4/4 (incluye rollback con id duplicado); jest completo 1843/1843 con el polyfill nuevo · commit: feat(backup): almacén… · Risk: item 1 (borra y reescribe datos guardados); item 3 por `setup-jest.ts` (entorno de todos los tests)
- [x] T3 · S1, S2, S3 · ruta: inline · Aceptación: casos de uso de exportar/restaurar, `downloadJson`, UI en Perfil (exportar, elegir archivo, confirmar, restaurar, recargar) y e2e de ida y vuelta + archivo inválido · Evidencia: RED (compilación: `AppReloadService` y métodos inexistentes) → GREEN unit (`backup.use-cases.spec.ts` 3, `file-download.service.spec.ts` +1, `profile.page.spec.ts` +8); e2e J22.1 (ida y vuelta: borra lo posterior, vuelve lo del respaldo, fechas como `Date` en IndexedDB) y J22.2 (archivo inválido); capturas `perfil` regeneradas (dos filas nuevas en Datos) · commit: feat(backup): exportar y restaurar… · Risk: item 1 (borra datos del usuario desde la UI)

## Log

- L1 (2026-11-05) Pedido original, textual:
  > hay algo para mejorar o que podemos agregar a la aplicaicon?
  > dale, vamos con el respaldo
- L2 (2026-11-05) Decisión del usuario sobre restaurar (corrigió "Combinar" en el selector), textual:
  > borrar los viejos y poner los nuevos
- L3 (2026-11-05) Exploración: 8 tablas Dexie v3 (`src/app/core/db/database.ts:123-157`), fechas como `Date` en casi todas las filas; `DexieTrainingHistoryReset` (`src/app/core/shared/data/dexie-training-history-reset.ts`) muestra el patrón de transacción; `FileDownloadService.downloadCsv` (`src/app/core/files/file-download.service.ts`); sección "Datos" de Perfil (`src/app/features/profile/ui/pages/profile.page.ts:225-284`); jest usa fake-indexeddb (`setup-jest.ts:2`). Próximo paso: T1.
- L4 (2026-11-05) T1 GREEN (`8d250da`). T2: (a) el polyfill de `structuredClone` de `setup-jest.ts` hacía un round trip JSON y guardaba las fechas como texto en los tests (en el navegador IndexedDB conserva `Date`); pasa a `v8.serialize/deserialize` (clonado estructurado real); la suite completa sigue verde (1843/1843). (b) `await` en secuencia dentro de `db.transaction` daba `PrematureCommitError` (zone.js); `replaceAll` encadena promesas de Dexie. El rollback ante un `bulkAdd` fallido quedó probado. Próximo paso: T3.
- L5 (2026-11-05) T3 GREEN. Restaurar recarga la app (`AppReloadService`) para descartar cachés en memoria (perfil, stores, barra de sesión). Un test previo de Perfil ("ya no edita nombre ni avatar") exigía cero `<input>`; ahora excluye solo el selector de respaldo JSON. Checks: jest 1855/1855, lint, build (395.48 kB inicial), e2e 55/55, visual 20/20 tras regenerar `perfil`. Pendiente: `odd-verifier` (Risk item 1; item 3 por `setup-jest.ts`), PR.
