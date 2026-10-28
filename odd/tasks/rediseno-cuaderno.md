# rediseno-cuaderno

Objetivo: migrar toda la UI de Forge a la dirección C "Cuaderno" (claro y oscuro) y sumar las funciones nuevas del canvas · Por qué: el usuario quiere un diseño nuevo completo y eligió C.
Rama: `feat/rediseno-cuaderno` desde `081e4d3` · Entrega: single-pr · Runner: `npm test` (Jest), `npm run e2e` (Playwright), detectados en `package.json` (el proyecto no tiene bloque `## ODD`) · Mirror Engram: `odd/rediseno-cuaderno/tasks` (ok)
Pronóstico: ~5500 líneas cambiadas (agregadas + borradas, sin generados ni capturas) · Heurística por tarea: ~400 (no es límite)
Ruteo de modelo: caso 4. Opus escribió este documento con riesgo por tarea; una sesión Sonnet lo retoma y ejecuta sin replanificar.

## Specs

Alcance: todas las pantallas, componentes compartidos y shell; tema Claro/Oscuro/Sistema; color de acento elegible; pantalla siempre encendida; exportar historial a CSV; primer uso con plantillas de rutina.
Fuera de alcance: direcciones A y B del canvas; cambios al esquema Dexie; layout de escritorio; las filas "Descanso por defecto" y "Aviso al terminar el descanso" del canvas de Perfil (ver D3).

Referencia visual (fuente de verdad del diseño): canvas https://claude.ai/artifact/KcPdT7hLpZX2BkmT81cKRv, columna "C · Cuaderno". Cada pantalla es un archivo `project/C-<Pantalla>.dc.html` (claro) y `project/C-<Pantalla>-Dark.dc.html` (oscuro). Leer con la herramienta Artifact: `action: "read"`, `url` del canvas, `path: "project/C-Hoy.dc.html"` (corregido en L6). Los valores de la tabla de tokens de abajo mandan sobre los del canvas si difieren.

| Pantalla | Tablero del canvas | Archivos |
|---|---|---|
| Hoy | `C-Hoy.dc.html` | `src/app/features/training/ui/pages/training-home.page.ts` |
| Sesión | `C-Session.dc.html` | `training-session.page.ts`, `components/exercise-session-card.component.ts`, `set-logger.component.ts`, `rest-timer.component.ts` |
| Resumen | `C-Summary.dc.html` | `session-summary.page.ts`, `components/pr-celebration.component.ts` |
| Rutinas | `C-Routines.dc.html` | `src/app/features/routines/ui/pages/routine-list.page.ts`, `routine-editor.page.ts`, `weekly-schedule-editor.page.ts`, `components/routine-card.component.ts` |
| Editor de día | `C-DayEditor.dc.html` | `training-day-editor.page.ts`, `components/target-set-editor.component.ts` |
| Biblioteca | `C-Library.dc.html` | `routines/ui/pages/exercise-picker.page.ts`, `src/app/features/exercises/ui/pages/exercise-list.page.ts`, `exercise-form.page.ts`, `components/exercise-thumbnail.component.ts` |
| Progreso | `C-Progress.dc.html` | `src/app/features/progress/ui/pages/progress-home.page.ts`, `pr-list.page.ts`, `components/*` (dashboard-overview, weekly-trend-chart, line-chart, session-heatmap, exercise-progress-list) |
| Historial de ejercicio | `C-Exercise.dc.html` | `progress/ui/pages/exercise-history.page.ts`, `components/exercise-history-chart/*` |
| Perfil | `C-Profile.dc.html` | `src/app/features/profile/ui/pages/profile.page.ts` |
| Primer uso | `C-Welcome.dc.html` | nuevo en `src/app/features/onboarding/ui/` (hoy solo tiene `.gitkeep`) |

Pantallas sin tablero propio (`routine-editor`, `weekly-schedule-editor`, `exercise-form`, `exercise-list`, `pr-list`): siguen el mismo lenguaje visual C.

Tokens C (formato `R G B` sin comas en `src/styles.css`, invariante R7 de `tailwind.config.js:8-10`):

| Token Tailwind | Claro | Oscuro |
|---|---|---|
| `page` (fondo) | `#F6F6F4` | `#0F0F11` |
| `surface` | `#FFFFFF` | `#18181B` |
| `line` | `#E4E4E0` | `#2A2A2F` |
| `line-soft` | `#EEEEEA` | `#222226` |
| `ink` | `#111113` | `#EDEDEA` |
| `ink-2` | `#5B5B60` | `#A1A1A8` |
| `dash` | `#D2D2CC` | `#3A3A40` |
| `empty` | `#ECECE8` | `#26262B` |
| `danger` | `#C62828` | `#F87171` |
| sombra | `rgba(17,17,19,0.08)` | `rgba(0,0,0,0.45)` |

Acento (`data-accent` en `<html>`, 4 opciones del canvas): `#2B59FF` (por defecto), `#FF5A1F`, `#0F9D76`, `#111113` (en oscuro se reemplaza por `#EDEDEA`).
- `accent`: el color elegido.
- `accent-ink` (texto en color acento): igual al acento en claro; en oscuro, cada canal se aclara 38% hacia blanco (`c + (255 - c) * 0.38`), porque el cobalto sobre negro no llega al contraste mínimo.
- `accent-on` (texto sobre fondo acento): `#111113` si la luminancia del acento es mayor a 0.6, si no `#FFFFFF`.
- `accent-soft`: acento con alfa 0.08 en claro y 0.16 en oscuro.

Tipografía: Inter Tight 400/500/600/700 (texto) y JetBrains Mono 400/500 (números y metadatos), en woff2 dentro de `public/fonts/`, igual que hoy las Geist.

Restricciones:
- PWA mobile-only y offline: las fuentes nuevas tienen que quedar en la caché del service worker.
- Tema, acento y pantalla encendida son preferencias del dispositivo: se guardan en `localStorage` y se leen antes de que arranque Angular. No tocan Dexie.
- El esquema Dexie no cambia (`src/app/core/db/database.ts:134-158`).
- Los textos visibles y los nombres accesibles actuales se mantienen salvo que el canvas los cambie. Los e2e usan 48 `getByRole`, 44 `getByText` y 10 `getByLabel`: cada tarea actualiza su journey en el mismo commit.
- "Borrar historial" mantiene su comportamiento y su confirmación actuales (`profile.page.ts:186-205`).

Requisitos:
- S1: "quieor modifircar basicamente todo visualmente, quieor un nuevo diseno" · "la verdad me gusto mucho mas en general la opcion C de cuaderno" — Aceptación: cada pantalla de la tabla se ve como su tablero C; no queda ninguna clase `forge-*` ni `accent-<número>`, ni la fuente Geist, ni el naranja brasa `#FF6A1F` — Checks: `npm test`, `npm run e2e`, `npm run build`, `rg "(forge|accent)-[0-9]|Geist|FF6A1F|ff6a1f" src public/index.html` sin resultados, capturas de T3.
- S2: "primero los colores me gustaron mas los de el C, tambien habira que hacer algun modo oscuro para ese" — Aceptación: Perfil tiene Tema Claro / Oscuro / Sistema; el tema se aplica antes del primer pintado, sin destello; persiste tras recargar; "Sistema" sigue a `prefers-color-scheme` en vivo; `<meta name="theme-color">` acompaña al fondo — Checks: Jest del servicio de apariencia, e2e de Perfil, capturas claro y oscuro.
- S3: "entran en el plan" (plantillas en primer uso) — Aceptación: pantalla Primer uso con los 3 pasos y las plantillas "Torso / Pierna", "Full body" y "Push / Pull / Piernas"; "Usar" crea la rutina con sus días y ejercicios, la deja activa y lleva a Hoy — Checks: Jest del caso de uso, e2e nuevo de primer uso.
- S4: "entran en el plan" (pantalla siempre encendida) — Aceptación: fila "Pantalla siempre encendida · Durante la sesión" en Perfil; con la opción activa y una sesión en curso, la app pide Wake Lock (`navigator.wakeLock.request('screen')`), lo vuelve a pedir al volver a primer plano y lo libera al terminar o abandonar la sesión; sin soporte del navegador, la fila se ve deshabilitada con una explicación — Checks: Jest con `navigator.wakeLock` simulado.
- S5: "entran en el plan" (exportar CSV) — Aceptación: "Exportar historial (CSV)" en Perfil descarga un `.csv` en UTF-8 con BOM, una fila por serie registrada, columnas según D2 — Checks: Jest del caso de uso que arma el CSV (comillas, comas y saltos de línea escapados), e2e que verifica la descarga.
- S6: "entran en el plan" (elegir color de acento) — Aceptación: radiogroup "Color de acento" en Perfil con las 4 opciones; cambia el acento al instante sin recargar y persiste — Checks: Jest del servicio de apariencia, e2e de Perfil.
- S7: el tema por defecto es "Sistema" y el acento por defecto es `#2B59FF` (confirmado en L7: "dale,").
- S8 (supuesto): Primer uso reemplaza el estado vacío "Sin rutina activa" de Hoy cuando no hay ninguna rutina. Con rutinas pero sin una activa, Hoy sigue como hoy. Confirmar o descartar en T13.
- S9 (supuesto): "Pantalla siempre encendida" viene activada por defecto. Confirmar o descartar en T11.

Decisiones abiertas (preguntar una por vez al llegar a la tarea, antes de implementar):
- D1 (T13): ejercicios, series y repeticiones de cada plantilla, tomados del catálogo de 42 ejercicios.
- D2 (T12): columnas del CSV. Propuesta: `fecha, rutina, dia, ejercicio, serie, peso, unidad, reps, tiempo_s, distancia_m, pr`.
- D3 (T10): si entran "Descanso por defecto" (hoy es la constante `DEFAULT_REST_SECONDS = 90` en `src/app/features/training/ui/services/rest-timer.service.ts:8`) y "Aviso al terminar el descanso". Hasta que se confirme, quedan fuera y no se dibujan.

## Tasks

- [x] T1 · S1, S2 · ruta: inline · Tokens C claro y oscuro con los 4 acentos en `src/styles.css`, colores semánticos en `tailwind.config.js` (`page`, `surface`, `line`, `line-soft`, `ink`, `ink-2`, `dash`, `empty`, `danger`, `accent` con `DEFAULT`/`ink`/`on`/`soft`), Inter Tight y JetBrains Mono en `public/fonts/` con `preload` en `src/index.html`. La rampa `forge-*`, `accent-50..700` y Geist conviven hasta T14. Verificar que el service worker cachee `/fonts/**`: el patrón `/*.(…woff2)` de `ngsw-config.json:18` parece cubrir solo la raíz · Aceptación: build verde, clases nuevas disponibles, fuentes servidas offline · Evidencia: `9edf638` (tokens y fuentes), `6ebc80b` (caché SW). RED: J14.4 falla con el `ngsw-config.json` viejo (`[false, false]`); GREEN: `e2e:pwa` 4/4. `npm run build` verde, `ngsw.json` con las 4 woff2 en el grupo `fonts` (prefetch). Sonda de Tailwind genera `bg-page`, `text-ink-2`, `border-line-soft`, `bg-accent-soft`, `text-accent-on`, etc., y las clases viejas siguen. `npm test` 1350/1350, `npm run e2e` 23/23 · Risk: item 5 (cambió `ngsw-config.json`; lo cubre J14.4 y queda para el verificador de T15)
- [x] T2 · S2, S6, S7 · ruta: inline · Servicio de apariencia en `src/app/core/` (tema `light | dark | system`, acento), clave `localStorage` `forge.appearance` con lectura tolerante a valores inválidos, script inline en `src/index.html` que pone `data-theme` y `data-accent` antes de pintar (hoy `data-theme="dark"` fijo en `src/index.html:2`), escucha de `prefers-color-scheme`, actualización de `theme-color` (hoy fijo `#0c0a09` en `src/index.html:10`). Test-first en Jest · Aceptación: S2 y S6 a nivel servicio · Evidencia: `ae8ad79`. RED: los specs fallan sin `appearance.service.ts` y, con el servicio, los 7 del script inline fallan con "No inline script reads forge.appearance in index.html"; GREEN: 22/22 (`appearance.service.spec.ts` y `appearance-boot-script.spec.ts`). Probe en Chromium sobre el build: al crearse `<body>`, antes de que arranque Angular, ya están `data-theme`, `data-accent` y `theme-color` (claro sin guardar → `light`/`cobalt`/`#F6F6F4`; oscuro sin guardar → `dark`; guardado `dark`+`green` con sistema claro → `dark`/`green`). `npm test` 1372/1372, `npm run build` verde, `npm run e2e` 23/23 · Risk: none (clave nueva; no cambia datos guardados)
- [x] T3 · S1, S2 · ruta: delegada · Journey visual `e2e/visual/screens.spec.ts`: cada pantalla de la tabla en claro y oscuro con datos de `e2e/fixtures/seed.ts`, `toHaveScreenshot` con baselines generadas en Docker con Playwright v1.60.0 (como la verificación anterior) para que el render sea estable. Cada tarea de pantalla regenera solo sus baselines y revisa las capturas · Aceptación: el journey corre verde y deja las capturas · Evidencia: `8aec475`, ruta delegada (subagente Sonnet, pedido en L6). Sin RED, por la excepción de `testing.md` para journeys de capturas; la prueba es de estabilidad. `npm run e2e:visual:update` 18/18 genera las baselines; `npm run e2e:visual` 18/18 sin diferencias, tanto en la corrida del subagente como en la del parent. `npm run e2e` 23/23 con `**/visual/**` excluido. eslint limpio. Revisé `sesion-light` y `sesion-dark` · Risk: none
- [x] T4 · S1 · ruta: delegada · Componentes compartidos `src/app/core/shared/ui/` (`button`, `card`, `chip`, `input`, `page-header`, `empty-state`, `skeleton`, `toast`, `wheel-picker`, `icon` si cambia el trazo) y shell (`src/app/shell/navigation/bottom-nav.component.ts` sin hex, `src/app/shell/layout/app-layout.component.ts`) con tokens semánticos · Aceptación: los specs existentes pasan; capturas coherentes con el canvas · Evidencia: `9066b19`, ruta delegada (subagente Sonnet). RED: 27 tests de `src/app/core/shared/ui` y `src/app/shell` fallaban antes de implementar; GREEN 203/203. El parent ajustó `set-logger.component.spec.ts:106`, que fijaba `bg-accent-500/12` de la variante `accent_soft`. `npm test` 1378/1378, `npm run e2e` 23/23, `npm run e2e:visual` 18/18 con las baselines regeneradas, eslint limpio en la superficie. Revisé `perfil-light`: barra, botón primario y tarjetas como en el canvas · Risk: item 6 (ningún test falla ante una regresión visual; evidencia: capturas de T3)
- [x] T5 · S1 · ruta: delegada · Hoy y Resumen (`training-home.page.ts`, `session-summary.page.ts`, `pr-celebration.component.ts`) según `C-Hoy` y `C-Summary`, más `e2e/journeys/training.spec.ts` · Aceptación: capturas iguales al canvas; e2e de training verde · Evidencia: `e03b6c0` (Hoy), `9115caf` (Resumen y PR); ruta delegada (subagente Sonnet). RED antes de implementar: Hoy 13/32, PR 5/12, Resumen 9/22. Corrección pedida por el parent (regresión de unidad, L11): RED 5/25, GREEN 25/25. `npm test` 1405/1405, `npm run e2e` 23/23, `npm run e2e:visual` 18/18 (solo cambiaron `hoy-*` y `resumen-*`), eslint limpio en lo tocado. Revisé `hoy-light` y `resumen-dark` · Risk: item 6 (igual que T4)
- [x] T6 · S1 · ruta: delegada · Sesión planilla (`training-session.page.ts`, `exercise-session-card.component.ts`, `set-logger.component.ts`, `rest-timer.component.ts`) según `C-Session`. Se conservan el prefill de la última vez y el timer en web worker · Aceptación: capturas; e2e de training verde, incluido el prefill (J14) · Evidencia: `8bbdb8f`, ruta delegada (subagente Sonnet). RED: 31 tests en 4 suites; GREEN `npx jest src/app/features/training/ui` 278/278. `tsc -p tsconfig.app.json` limpio. `npm test` 1424/1424. `npm run e2e` 23/23, J14 incluido. `npm run e2e:visual` 18/18; solo cambiaron `sesion-*`. eslint limpio: se fueron los 7 errores previos de esos archivos. Revisé `sesion-dark` · Risk: item 6 (igual que T4)
- [ ] T7 · S1 · ruta: inline · Rutinas y editor de día (`routine-list`, `routine-card`, `routine-editor`, `weekly-schedule-editor`, `training-day-editor`, `target-set-editor`) según `C-Routines` y `C-DayEditor`, más `e2e/journeys/routines.spec.ts` · Aceptación: capturas; e2e de rutinas verde · Evidencia: — · Risk: item 6 (igual que T4)
- [ ] T8 · S1 · ruta: inline · Biblioteca y ejercicios (`exercise-picker` con búsqueda, filtro por grupo, selección múltiple y la etiqueta "En el día"; `exercise-list`, `exercise-form`, `exercise-thumbnail`) según `C-Library`, más `e2e/journeys/exercises.spec.ts` · Aceptación: capturas; e2e de ejercicios y J4 de rutinas verdes · Evidencia: — · Risk: item 6 (igual que T4)
- [ ] T9 · S1 · ruta: inline · Progreso e historial (`progress-home`, `pr-list`, `exercise-history`, componentes de `progress/ui/components/`; quitar los hex de `line-chart.component.ts`) según `C-Progress` y `C-Exercise`, más `e2e/journeys/progress.spec.ts` · Aceptación: capturas; gráficos legibles en los dos temas; e2e de progreso verde · Evidencia: — · Risk: item 6 (igual que T4)
- [ ] T10 · S1, S2, S6 · ruta: inline · Perfil según `C-Profile`: secciones Apariencia (Tema, Color de acento, conectados al servicio de T2), Entrenamiento (Unidad de peso) y Datos (Borrar historial sin cambio de comportamiento), más `e2e/journeys/profile.spec.ts`. Preguntar D3 antes · Aceptación: S2 y S6 de punta a punta; J13.1 verde · Evidencia: — · Risk: none (solo vista; reutiliza el servicio de T2 y los casos de uso de perfil)
- [ ] T11 · S4, S9 · ruta: inline · Servicio de Wake Lock en `src/app/core/`, preferencia en `forge.appearance`, uso desde la sesión activa, fila en Perfil. Test-first en Jest con `navigator.wakeLock` simulado: pedir, volver a pedir en `visibilitychange`, liberar al terminar, sin soporte · Aceptación: S4 · Evidencia: — · Risk: item 4 (pedido y liberación asíncronos del lock con `visibilitychange`)
- [ ] T12 · S5 · ruta: inline · Preguntar D2 antes. Caso de uso que arma el CSV desde sesiones y series (repositorios existentes, sin escribir datos), descarga con `Blob`, botón en Perfil. Test-first en Jest · Aceptación: S5 · Evidencia: — · Risk: none (solo lectura; formato nuevo que todavía nadie consume)
- [ ] T13 · S3, S8 · ruta: inline · Preguntar D1 antes. Feature `onboarding`: pantalla Primer uso según `C-Welcome`, catálogo de plantillas, caso de uso que crea la rutina con los casos de uso de `routines` existentes (respeta "una sola rutina activa", J6a.2). Ajustar el e2e "muestra \"Sin rutina activa\"…" y sumar uno de primer uso · Aceptación: S3 · Evidencia: — · Risk: none (crea registros nuevos con los casos de uso existentes)
- [ ] T14 · S1 · ruta: inline · Limpieza: borrar la rampa `forge-*`, `accent-50..700`, `--pr-warm*` si queda sin uso, los bloques viejos `.forge-dark`/`.forge-light`, las Geist y sus `preload`; regenerar todas las baselines · Aceptación: `rg` de S1 sin resultados; build verde · Evidencia: — · Risk: item 6 (igual que T4)
- [ ] T15 · S1–S9 · ruta: delegada (Verification trigger: items 4, 5 y 6 en T1, T4–T9, T11, T14) · Cierre: `npm test`, `npm run lint`, `npm run build`, `npm run e2e`, `npm run e2e:pwa` (fuentes offline), y un `odd-verifier` (opus) sobre toda la feature desde `081e4d3` · Aceptación: todo verde o un único **Needs your decision** · Evidencia: — · Risk: —

## Log

- L1 (2026-10-27) Pedido original, textual:
  > quero que revises de que se trata el poryecto y quiero y me digas si esta en su ultima version comparada con github, quieor modifircar basicamente todo visualmente, quieor un nuevo diseno, quioerque con las skills que tenes de diseno o visualizacion me des varios artifact para modificar todo el UI/UX, ejemplos y quieorque tomes de referencia a aplicaciones de hoy en dia que hacen/funcionan para lo mismo
- L2 (2026-10-27) Pedidos siguientes, textuales:
  > podes hacer las 3 opciones en el mismo lugar, asi las puedo comparar y dame el link donde se ecnuentran las 3

  > okey perfecto, primero los colores me gustaron mas los de el C, tambien habira que hacer algun modo oscuro para ese, luego la verdad me gusto mucho mas en general la opcion C de cuaderno, prodias hacer las demas pantallas con esa direccion para ver como quedarian? hacel oa continuacion de lo que ya hiciste con la opcion C

  > arrancamos con la plainifacion
- L3 (2026-10-27) Respuesta a "¿Las funciones nuevas del canvas (plantillas en primer uso, pantalla siempre encendida, exportar CSV, elegir color de acento) entran en este plan, o este plan es solo lo visual más el tema y esas van aparte?", textual:
  > entran en el plan
- L4 (2026-10-27) Exploración:
  - Los 47 componentes usan templates inline y pintan con la rampa oscura fija: `bg-forge-900`, `text-forge-100`, etc., en 312 lugares. Las variables semánticas (`--bg`, `--surface`, `--text`) ya existen para `[data-theme=dark]` y `[data-theme=light]` (`src/styles.css:129`, `src/styles.css:157`), pero casi nadie las usa. Por eso cambiar `data-theme` no alcanza y cada pantalla tiene que migrar a tokens semánticos.
  - Solo hay hex sueltos en `line-chart.component.ts` y `bottom-nav.component.ts`.
  - Los e2e no miran estilos ni capturas: hoy ningún test detecta una regresión visual (item 6). T3 agrega capturas.
  - Perfil guarda solo `preferredUnit` en Dexie; no hay preferencia de tema ni de acento. No existe Wake Lock ni exportación. "Borrar historial" ya existe.
  - `src/app/features/onboarding/` solo tiene `.gitkeep`.
  - No hay CSP en `src/index.html`, así que el script inline de tema no choca con nada.
- L5 (2026-10-27) Ruteo propuesto: caso 4. El usuario respondió el alcance sin objetar el ruteo. Próximo paso: T1.
- L6 (2026-10-27) Retomado con: "continua retomá odd/tasks/rediseno-cuaderno.md desde T1, para implementar utiliza subagentes si es mucho trabajo". T1 cerrada:
  - El canvas guarda los tableros en `project/` y el oscuro es un archivo aparte `-Dark`; se corrigió la referencia en Specs.
  - El glob del SW es por segmento (`*` = `[^/]*` en `@angular/service-worker`), así que `/fonts/*` nunca estuvo en caché, tampoco las Geist. Se agregó el grupo `fonts` en prefetch con `/fonts/*.woff2` (sin las licencias).
  - Valores de `data-accent`: `cobalt`, `orange`, `green`, `ink` (nombres del canvas: Cobalto, Naranja, Verde, Tinta). Sin atributo: claro y cobalto. `data-theme` recibe el tema ya resuelto (`light` | `dark`); T2 resuelve "Sistema".
  - `accent-on` usa la luminancia del canvas: promedio ponderado sin linealizar, `(0.2126 r + 0.7152 g + 0.0722 b) / 255`. Solo Tinta en oscuro da `#111113`.
  - Variables CSS nuevas con prefijo `--color-*` para no chocar con las `--surface` y `--accent` viejas. `--color-shadow` queda como `rgba` completo, sin clase de Tailwind, hasta que una pantalla lo use.
  - Fuentes: subset latin de `@fontsource-variable/inter-tight@5.3.0` y `@fontsource-variable/jetbrains-mono@5.3.0` (OFL 1.1, licencias en `public/fonts/`). `font-sans` y `font-mono` ya apuntan a Inter Tight y JetBrains Mono, así que toda la app cambió de tipografía en T1; los archivos Geist y su `preload` quedan hasta T14.
  - Entorno: hizo falta `npm ci` y `npx playwright install chromium` (headless shell v1223) para correr e2e en local.
  - Próximo paso: T2, confirmar S7 antes de implementar.
- L7 (2026-10-27) Respuesta a "¿el tema por defecto es "Sistema" (sigue al claro/oscuro del teléfono) y el acento por defecto es Cobalto `#2B59FF`?", textual:
  > dale,

  T2 cerrada:
  - `AppearanceService` (`src/app/core/appearance/`) expone `theme`, `accent` y `resolvedTheme` como signals de solo lectura, más `setTheme` y `setAccent`. Exporta `THEME_PREFERENCES` y `ACCENT_IDS` para Perfil (T10). Se instancia en un `APP_INITIALIZER`.
  - Al guardar, el servicio mezcla con lo que ya hay en `forge.appearance`, así T11 puede sumar `keepAwake` en la misma clave sin que se pisen.
  - El script inline repite las reglas del servicio porque corre antes de Angular. `appearance-boot-script.spec.ts` lee `src/index.html` y lo ejecuta en jsdom para que ambos no se desfasen.
  - Se sacó `data-theme="dark"` fijo de `<html>`. Mientras T4–T9 no migren cada pantalla, en tema claro las pantallas viejas se ven mezcladas: el bloque viejo `[data-theme="light"]` pinta fondo y texto claros y las clases `forge-*` siguen oscuras. Es esperado en la rama.
  - Pendiente para T14: `public/manifest.webmanifest` sigue con `theme_color: #0c0a09` y `background_color: #111827`.
  - `npm run lint` da 15 errores, todos en archivos que esta rama no tocó (`pwa-update.service.ts`, `set-logger.component.ts`, `exercise-list.page.ts`, etc.). Son previos a la rama y quedan fuera de alcance; T15 los va a mostrar igual.
  - Próximo paso: T3 (journey visual con capturas).
- L8 (2026-10-27) T3 cerrada:
  - `npm run e2e:visual` corre `ng build` en el host y Playwright dentro de `mcr.microsoft.com/playwright:v1.60.0-noble`, con el repo montado. Sirve `dist` con `npx -y http-server@14.1.1 -P "http://localhost:8081?"` para el fallback SPA, así que necesita red. Las baselines son solo `-chromium-mobile-linux`. Config: `playwright.visual.config.ts`.
  - Datos y reloj en `e2e/visual/visual-data.ts`: `FIXED_NOW` es el martes 2026-10-27 10:00 (Buenos Aires); rutina activa "Torso / Pierna" (`rt-torso-pierna`, días `day-pierna-a`, `day-torso-b`, …), "Full body" inactiva y 23 sesiones en 8 semanas. A Sesión y Resumen se llega desde una sesión `in-progress` sembrada; a Resumen, con clic en "Terminar sesión".
  - Antes de T4, claro y oscuro casi no difieren, porque las clases `forge-*` son oscuras fijas. `resumen-*` sale con el hero algo desplazado por el scroll, igual que la página hoy.
  - Bug previo a la rama: `ring-white/6` y `ring-white/8` no existen en la escala de opacidad de Tailwind, así que `ring-1` cae al anillo azul por defecto (`rgb(59 130 246 / 0.5)`). Se ve en la tarjeta de Sesión. Desaparece cuando T6 la migre a tokens.
  - Próximo paso: T4 (componentes compartidos y shell).
- L9 (2026-10-27) La barra inferior tiene hoy 5 pestañas (Entrenar, Rutinas, Ejercicios, Progreso, Perfil) y el canvas C tiene 4 (Hoy, Rutinas, Progreso, Perfil). Pregunta: mantener las 5 con el estilo nuevo y cambiar solo "Entrenar" por "Hoy", o pasar a las 4 del canvas. Respuesta textual:
  > vamos con eso

  Decisión para T4: la barra queda con 5 pestañas (Hoy, Rutinas, Ejercicios, Progreso, Perfil) y el estilo, los íconos y los estados del canvas C. "Entrenar" pasa a "Hoy" solo en la barra; el título de la página lo cambia T5.
- L10 (2026-10-27) T4 cerrada:
  - Íconos nuevos en `icon.catalog.ts`, tomados del canvas: `clock` (Hoy), `list` (Rutinas), `bars` (Progreso) y `person` (Perfil). Ejercicios sigue con `dumbbell`. La barra tiene `aria-label="Principal"` y `aria-current="page"` en la pestaña activa.
  - `fg-chip` usa un solo estilo de píldora: activo en `accent-soft` con texto `accent-ink`. El canvas dibuja los filtros activos en acento sólido, así que T8 puede sobreescribirlo en `exercise-list` y `exercise-picker`.
  - Bug previo a la rama: `fg-chip` decide `role` y `tabindex` con `tap.observed`, pero `OutputEmitterRef` no tiene `observed`, así que los chips nunca son enfocables con teclado. No se tocó, porque cambiar el rol puede romper selectores e2e. Queda anotado para T8.
  - Los specs de `features/` pueden fijar clases de los componentes compartidos (pasó con `set-logger`). Cada tarea de pantalla corre `npm test` completo.
  - Próximo paso: T5 (Hoy y Resumen).
- L11 (2026-10-27) T5 cerrada:
  - Hoy: título "Hoy" con fecha, tira de la semana (hecho, hoy, planeado, descanso), tarjeta "Hoy toca" con tabla y botón "Empezá" (el nombre accesible "Empezar sesión de X" no cambia), "Otros días" (mantiene `[data-days-list]`, así se puede empezar cualquier día) y "Diario" con las últimas 4 sesiones y "Ver todo" hacia `/progress`.
  - Resumen: "Sesión terminada", Totales (Duración, Volumen, Series, Reps), tabla "Ejercicio por ejercicio" (Series, Mejor, vs. ant.), tarjetas de récord en acento y botón "Guardar sesión". Los PR dejan de usar `--pr-warm`.
  - Textos cambiados según el canvas: "Entrenar" → "Hoy", "Sesión completada" → "Sesión terminada", "Guardar y cerrar" → "Guardar sesión", "EJERCICIOS" → "Ejercicio por ejercicio". J8 actualizado.
  - Elementos del canvas omitidos porque no existe soporte: "Ver calendario", "~50 min" (no hay estimación de duración), "Compartir resumen", notas de la sesión (ningún caso de uso guarda `Session.notes`), "Descartar" (borraría una sesión terminada), 1RM estimado y "Descanso prom.".
  - Regresión que encontró el parent y corrigió el subagente: Resumen armaba los pesos nuevos con "kg" fijo y coma decimal, sin respetar la unidad preferida. Ahora todo peso pasa por `DisplayWeightPipe.transform(kg, unit())` y queda con el mismo formato de punto decimal que el resto de la app.
  - `tsconfig.app.json` tiene `noUncheckedIndexedAccess`: un acceso indexado mal tipado rompe `ng build` (y el `webServer` de los e2e) sin que Jest lo note. Conviene correr `npx tsc --noEmit -p tsconfig.app.json` antes de los e2e.
  - Próximo paso: T6 (Sesión).
- L12 (2026-10-27) T6 cerrada:
  - Planilla: encabezado con "Terminar" (el `aria-label` sigue siendo "Terminar sesión"), riel de ejercicios y tarjeta con filas Serie / Anterior / Peso / Reps / Hecha. El panel "Serie N" conserva el input numérico y el wheel picker. Las celdas tienen `data-cell` (`n`, `prev`, `a`, `b`) y el encabezado `data-sheet-head`.
  - Textos cambiados según el canvas: "sets" → "series", "Atrás" → "Minimizar sesión", "SET" → "Serie N", "EDITAR SET" → "Editar serie". El timer usa `role="timer"` con "Descanso restante …". J7, J8 y J14 actualizados.
  - Comportamiento sumado del canvas: "+15s" en el timer, que reusa `RestTimerService.start`. La tarjeta muestra el descanso del ejercicio (`restSeconds` o `DEFAULT_REST_SECONDS`) y su nota.
  - Corregido: el delta de PR en la sesión tenía "kg" fijo; ahora pasa por `DisplayWeightPipe`. Los inputs del logger siguen en kg, como antes de la rama.
  - Omitido del canvas: menú "Opciones" (⋯), "Agregar serie" (hoy no se puede pasar del objetivo), teclado numérico propio con edición en la fila, píldora de descanso dentro de la tarjeta (sigue fija bajo el encabezado) y rango de reps "6–8" (`TargetSet` tiene un solo `reps`). "Cancelar entrenamiento" se mantiene abajo aunque el canvas no lo muestre.
  - Próximo paso: T7 (Rutinas y editor de día).
