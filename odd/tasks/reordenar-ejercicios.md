# reordenar-ejercicios

Objetivo: poder cambiar el orden de los ejercicios de un día arrastrándolos, desde el editor de día y durante la sesión, y que el orden quede guardado en la rutina · Por qué: hoy el orden solo sale del orden en que se agregaron y no se puede cambiar.
Rama: `feat/reordenar-ejercicios` desde `2f058ce` · Entrega: single-pr · Runner: `npm test` (Jest), `npm run e2e` (Playwright), `npm run build`, detectados en `package.json` (el proyecto no tiene bloque `## ODD`) · Mirror Engram: `odd/reordenar-ejercicios/tasks` (pending: el modo automático no deja escribir en Engram en esta sesión)
Pronóstico: ~600 líneas cambiadas (agregadas + borradas, sin `package-lock.json` ni capturas) · Heurística por tarea: ~400 (no es límite)
Ruteo de modelo: caso 5 (grande con riesgo alto por dependencia nueva), Opus de punta a punta. Aprobado en L4.

## Specs

Alcance: editor de día (`training-day-editor.page.ts`), pantalla de sesión (`training-session.page.ts`), un caso de uso nuevo en `routines/domain`, la dependencia `@angular/cdk`.
Fuera de alcance: el resto de los hallazgos del QA mobile de L2 (quedan como pendientes aparte); reordenar días o series; cambios al esquema Dexie.
Restricciones:
- El orden vive en `TrainingDay.exercises` (posición en el array y campo `order`, `training-day.entity.ts:3-9`). La sesión no guarda lista propia: lee `day.exercises` en orden (`training-session.page.ts:380-397`). No cambia el esquema Dexie ni el formato de las filas.
- Reordenar conserva todo lo demás de cada ejercicio del día (series objetivo, descanso, nota) y no toca las series ya registradas en la sesión (van por `exerciseId`).
- `@angular/cdk` en la versión 19.2.x que corresponde a Angular 19.2.

Requisitos:
- S1: "quieo que a la hora de editar una ruta algun dia o en el mismo momento de estar entrenado poder editar el orden de los ejercicios" — Aceptación: en el editor de día y durante la sesión se puede cambiar el orden de los ejercicios — Checks: los de S3 y S4.
- S2: "que se guarde también en la rutina" (L3) — Aceptación: el orden cambiado durante la sesión queda guardado en el día de la rutina; la próxima vez que se abre el editor de día o se empieza ese día, aparece el orden nuevo — Checks: Jest del caso de uso; e2e que reordena en la sesión y verifica el orden en el editor de día.
- S3: "Arrastrar con manija ≡" (L4) en el editor de día — Aceptación: cada fila tiene una manija ≡; arrastrarla mueve el ejercicio, la numeración 01, 02… se actualiza y el orden persiste al recargar — Checks: Jest del editor (soltar → caso de uso con el orden nuevo + filas renumeradas), e2e de arrastre con recarga.
- S4: en la sesión, "botón \"Ordenar\" junto a los chips → lista con manijas." (L4) — Aceptación: un botón "Ordenar" junto a los chips abre una lista con manijas; al soltar, los chips cambian de orden, el ejercicio enfocado sigue siendo el mismo y las series registradas no cambian; "Listo" cierra la lista — Checks: Jest de la sesión, e2e.
- S5 (supuesto): el caso de uso recibe la lista completa de ids en el orden nuevo y rechaza una lista que no sea exactamente los mismos ejercicios del día (día modificado en otra pantalla), sin guardar nada.

## Tasks

- [x] T1 · S2, S5 · ruta: inline · Aceptación: `ReorderExercisesInDayUseCase` reordena, renumera `order` 0..n-1, conserva el resto de los campos, actualiza `updatedAt` y rechaza listas que no coinciden · Evidencia: RED (módulo inexistente) → GREEN 6/6, commit `7f24f3c` · Risk: none
- [x] T2 · S3 · ruta: inline · Aceptación: `@angular/cdk` 19.2.x instalado; `npm run build` pasa; diferencia de tamaño del bundle registrada · Evidencia: `@angular/cdk@19.2.19` (peer `@angular/core ^19 || ^20`), build OK sin cambio de tamaño (Initial total 372.86 kB, aún sin importar), commit `511d6c5` · Risk: item 5 (dependencia nueva)
- [x] T3 · S1, S3 · ruta: inline · Aceptación: manija ≡ y arrastre en el editor de día; Jest + e2e · Evidencia: Jest RED 5/5 → GREEN (editor 31/31, routines+icon 348/348); e2e J14.1 verde (escrito junto con la implementación, RED no observado); commit `c0b781c` · Risk: none
- [ ] T4 · S1, S2, S4 · ruta: inline · Aceptación: botón "Ordenar" y lista con manijas en la sesión; Jest + e2e · Evidencia: — · Risk: none
- [ ] T5 · S1–S5 · ruta: inline · Aceptación: suite Jest, e2e, build y capturas visuales actualizadas; prueba manual en formato iPhone · Evidencia: — · Risk: —

## Log

- L1 (2026-11-05) Pedido original, textual:
  > quiero que pruebes la aplicacion en fromato de celular, las medidas a tu eleccion o modelo de movil, quiero que la pruebes y me digas que fallos tiene o que mejorraras podriamos ahcerle
  > otra cosa quieo que a la hora de editar una ruta algun dia o en el mismo momento de estar entrenado poder editar el orden de los ejercicios
- L2 (2026-11-05) QA mobile (Playwright iPhone 13 / SE y ego-browser): hallazgos reportados al usuario, fuera del alcance de esta feature. El editor de día no tiene forma de reordenar (`training-day-editor.page.ts:176`); la sesión arma los chips desde `day.exercises` (`training-session.page.ts:390-397`).
- L3 (2026-11-05) Decisión del usuario sobre reordenar durante la sesión, textual:
  > que se guarde también en la rutina
- L4 (2026-11-05) Interacción elegida: "Arrastrar con manija ≡" (con la vista de "En la sesión: botón \"Ordenar\" junto a los chips → lista con manijas."). Ruteo caso 5 aprobado, textual: "dale]". Próximo paso: T1.
- L5 (2026-11-05) T1–T3 hechos. El lock de npm trae ruido de metadatos (banderas `peer` y dos entradas opcionales de `chokidar` 5 bajo `@angular-eslint`) por la versión de npm; se instaló con npm 11.6.2 (el de Node 24, `.nvmrc`) y el build pasa. Ícono nuevo `grip` (≡) en el catálogo (41 íconos). `*cdkDragPreview` con `[matchSize]` no compila en AOT: se usa `<ng-template cdkDragPreview>`; Jest (JIT) no lo detecta, el build sí. Líneas del autor: ~430 (pasa de 400; single-pr, no se parte). Próximo paso: T4.
