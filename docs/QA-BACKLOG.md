# Forge — QA exploratorio (2026-05-21)

QA con Playwright (mobile 390×844). App **mobile-only** (decisión de Luca: no se
testea/optimiza desktop). Cada ítem verificado con captura o prueba reproducible.
Capturas en [`./qa-shots/`](./qa-shots/).

## Estado de resolución

| Ítem | Estado |
|------|--------|
| F-1 picker vacío | ✅ RESUELTO |
| F-2 race del seed | ✅ RESUELTO |
| F-3 Perfil sin estilar | ✅ RESUELTO |
| F-4 tema blanco vs oscuro | ✅ RESUELTO |
| F-5 empty-states ilegibles | ✅ RESUELTO |
| F-7 iconos del nav | ✅ RESUELTO |
| F-10 exercise-form sin estilar | ✅ RESUELTO |
| N-1 lista sin orden | ✅ RESUELTO |
| N-2 picker sin filtro grupo | ✅ RESUELTO |
| Catálogo 12 → 42 ejercicios | ✅ HECHO |
| F-6 responsive desktop | ⛔ WONTFIX (app mobile-only) |
| F-8 imagen por ejercicio | 🟡 infra LISTA (fallback activo) — 42 imágenes diferidas |
| F-11 selects muestran enums crudos | ✅ RESUELTO |
| F-9 "info hardcodeada" | ✅ diagnosticado (data del demo seed, no bug) |

> Sesión 1 mergeada a `main` (local). 983 tests verdes.

---

## Sesión 2 — pedidos de Luca (todos mergeados a `main`)

| Pedido | Estado |
|--------|--------|
| Datos hardcodeados en Progreso | ✅ diagnosticado — NO es bug: es data del demo seed (`?seed=demo`) persistida en IndexedDB. Solución: limpiar storage o agregar botón "borrar datos" (a confirmar). |
| No se pueden eliminar rutinas | ✅ RESUELTO — `DeleteRoutineUseCase` + botón con confirmación en el editor (cascada a días). |
| Series/reps objetivo por ejercicio | ✅ RESUELTO — conectado `TargetSetEditorComponent` (inline) + `SetTargetSetsUseCase` en el editor de día. |
| Agregar ejercicios uno por uno | ✅ RESUELTO — multi-select en el picker + `AddExercisesToDayUseCase` plural. |
| Input peso/reps (stepper lento) | ✅ RESUELTO — input mixto: peso = teclado numérico, reps = select desplegable. |
| Notificaciones del celular | ⛔ WONTFIX — ver N-3 abajo. Las del rest-timer ("¡Descanso terminado!") YA funcionan. El recordatorio de entrenar requiere backend (Web Push); decisión de Luca: no se justifica. |

**Pendientes menores nuevos**: F-12 (estilo del `TargetSetEditorComponent` algo plano vs el DS — funcional pero pulible). Prefill de peso/reps en el set-logger desde el target (hoy arranca en 0/—).

---

## ✅ RESUELTO

- **F-1** picker vacío → el picker siembra el catálogo (`SeedExercisesUseCase`) y recarga en `ngOnInit`. `qa-shots/verify_picker.png`.
- **F-2** race del seed → `ExerciseListPage.ngOnInit` awaita el seed + recarga. `qa-shots/verify_exercises_first.png`.
- **F-3** Perfil → reconstruido con design system (page-header, card, fg-input, fg-button, select oscuro). Funcional + visual. `qa-shots/profile_fixed_firstrun.png`.
- **F-4** tema → `<body class="forge-frame">` + `html { background: forge-950 }`. Toda la app oscura por defecto (root-level). `qa-shots/theme_routines.png`.
- **F-5** empty-states → caen con F-4 (beige legible sobre oscuro).
- **F-7** iconos del nav → `bottom-nav` tokenizado (bg/border) e inactivos de `#888` a `forge-300` (se notan). Archivo: `src/app/shell/navigation/bottom-nav.component.ts`.
- **F-10** exercise-form → reconstruido con design system (igual que el perfil). Funcional (crear navega + aparece) + visual. `qa-shots/form_fixed_new.png`.
- **N-1** orden → `GetExercisesUseCase` ordena alfabético locale-aware (lista + picker).
- **N-2** picker filtro grupo → chips de grupo muscular agregados al picker (mismo patrón que Ejercicios). Filtra correctamente + labels en español. `qa-shots/picker_filter_chest.png`.
- **F-8 (infra)** thumbnail por ejercicio con fallback a icono. `ExerciseThumbnailComponent` + helper slug. Imágenes reales diferidas (decisión de Luca). `qa-shots/picker_thumbnails.png`.
- **F-11** labels español en los selects de `exercise-form` (grupo / tracking / equipamiento). Helper `exercise-labels.ts`. TDD.
- **Catálogo 12 → 42** cubriendo los 9 grupos. TDD.

---

## ⛔ WONTFIX

### F-6 · Responsive desktop
- Forge es mobile-only (Luca lo usa siempre en formato mobile). No se invierte en layout desktop.

### N-3 · Recordatorio de entrenar ("hoy toca X")
- **Las notificaciones del rest-timer YA existen y andan**: `NotificationPermissionService` (`core/notifications/`) + `rest-timer.service.ts:71` disparan "¡Descanso terminado!" vía `serviceWorker.showNotification`. Permiso pedible desde el perfil.
- **El recordatorio de entrenar (app cerrada) NO se hace.** Razón técnica verificada (jun 2026):
  - Notification Triggers API (`TimestampTrigger`) — la única vía local sin servidor — está **discontinuada por Chrome**, no viene por defecto, requiere flag `#enable-experimental-web-platform-features`. No sirve para uso diario.
  - La única forma confiable (Android + iOS, app cerrada) es **Web Push**, que **necesita un backend** que mande el push a horario.
  - Forge es offline-first sin backend → meter un servidor solo para un recordatorio no se justifica (decisión de Luca). Alternativa: calendario/alarma nativa del teléfono.

---

## 🔲 PENDIENTE

### F-8 · Imagen/logo por ejercicio (enfoque: ilustración por ejercicio)
- **Infra LISTA** (verificada): `ExerciseThumbnailComponent` + helper `exerciseImageUrl(name)` (slug). Render en lista y picker con fallback automático a icono de pesa. Cero cambios en la capa de datos (la imagen se deriva del nombre, no se persiste). Convención documentada en `public/exercises/README.md`.
- **Decisión de Luca**: dejar el **fallback de pesa por ahora**. Las 42 ilustraciones `.webp` quedan diferidas — se dropean en `public/exercises/` (convención de nombre) cuando estén.

### F-9 · "Info hardcodeada" (A CONFIRMAR)
- No se encontró data falsa en templates; única hardcode = catálogo seed (legítimo). Pendiente: Luca aclara a qué se refería.

---

## ✅ Verificado OK (no tocar)
- Validaciones: rutina/ejercicio vacíos bloquean guardado; nombres largos sin overflow.
- Búsqueda por texto: anda en lista y picker. Chips de grupo: filtran bien (lista + picker).
- Sin errores de consola / runtime, ni con catálogo completo (42).

---

> Reproducción: `npm start` + Playwright (`NODE_PATH=./node_modules node <script>.js`).
> Taskboard canónico = vault Obsidian; este archivo es el handoff committeable.
