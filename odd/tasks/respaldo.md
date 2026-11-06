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

- [x] T1 · S1, S3 · ruta: inline · Aceptación: formato `{ format: 'forge-backup', version: 1, exportedAt, data }`; `serializeBackup` y `parseBackup` (revive fechas por tabla, valida y rechaza con `InvalidBackupError`) en `core/shared/domain/backup/` · Evidencia: RED (módulo inexistente) → GREEN `backup.spec.ts` 16/16, eslint limpio · commit: ver `git log` (feat(backup): formato…) · Risk: item 1 (formato persistido)
- [ ] T2 · S1, S2, S3 · ruta: inline · Aceptación: puerto `BackupStore` + `DexieBackupStore` (`readAll` de las 8 tablas; `replaceAll` en una transacción rw: clear + bulkAdd, rollback si falla) con tests sobre fake-indexeddb · Evidencia: — · Risk: item 1 (borra y reescribe datos guardados)
- [ ] T3 · S1, S2, S3 · ruta: inline · Aceptación: casos de uso de exportar/restaurar, `downloadJson`, UI en Perfil (exportar, elegir archivo, confirmar, restaurar, recargar) y e2e de ida y vuelta + archivo inválido · Evidencia: — · Risk: item 1 (borra datos del usuario desde la UI)

## Log

- L1 (2026-11-05) Pedido original, textual:
  > hay algo para mejorar o que podemos agregar a la aplicaicon?
  > dale, vamos con el respaldo
- L2 (2026-11-05) Decisión del usuario sobre restaurar (corrigió "Combinar" en el selector), textual:
  > borrar los viejos y poner los nuevos
- L3 (2026-11-05) Exploración: 8 tablas Dexie v3 (`src/app/core/db/database.ts:123-157`), fechas como `Date` en casi todas las filas; `DexieTrainingHistoryReset` (`src/app/core/shared/data/dexie-training-history-reset.ts`) muestra el patrón de transacción; `FileDownloadService.downloadCsv` (`src/app/core/files/file-download.service.ts`); sección "Datos" de Perfil (`src/app/features/profile/ui/pages/profile.page.ts:225-284`); jest usa fake-indexeddb (`setup-jest.ts:2`). Próximo paso: T1.
