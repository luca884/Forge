# rediseno-cuaderno

Objetivo: migrar toda la UI de Forge a la dirección C "Cuaderno" (claro y oscuro) y sumar las funciones nuevas del canvas · Por qué: el usuario quiere un diseño nuevo completo y eligió C.
Rama: `feat/rediseno-cuaderno` desde `081e4d3` · Entrega: single-pr · Runner: `npm test` (Jest), `npm run e2e` (Playwright), detectados en `package.json` (el proyecto no tiene bloque `## ODD`) · Mirror Engram: `odd/rediseno-cuaderno/tasks` (ok). Desde L22, Log L1–L16 está en `odd/rediseno-cuaderno/tasks-log-1`, y desde L27, L17–L23 está en `odd/rediseno-cuaderno/tasks-log-2`, porque Engram limita cada observación a 50 000 bytes
Pronóstico: ~5500 líneas cambiadas (agregadas + borradas, sin generados ni capturas) · Heurística por tarea: ~400 (no es límite)
Ruteo de modelo: caso 4. Opus escribió este documento con riesgo por tarea; una sesión Sonnet lo retoma y ejecuta sin replanificar.

## Specs

Alcance: todas las pantallas, componentes compartidos y shell; tema Claro/Oscuro/Sistema; color de acento elegible; pantalla siempre encendida; exportar historial a CSV; primer uso con plantillas de rutina; "Descanso por defecto" y "Aviso al terminar el descanso" en Perfil (D3, L16).
Fuera de alcance: direcciones A y B del canvas; cambios al esquema Dexie; layout de escritorio.

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
- S3: "entran en el plan" (plantillas en primer uso) — Aceptación: pantalla Primer uso con los 3 pasos y las plantillas "Torso / Pierna", "Full body" y "Push / Pull / Piernas"; "Usar" crea la rutina con sus días y ejercicios, la deja activa y lleva a Hoy. "la idea tambien es que las rutinas que ya tengo cargadas no se borren, verifica eso tambien" (L29): aplicar una plantilla nunca borra ni modifica rutinas, días ni ejercicios existentes — Checks: Jest del caso de uso (incluye que no toca lo existente), e2e nuevo de primer uso, e2e de que con rutinas cargadas no aparece Primer uso y siguen todas.
- S4: "entran en el plan" (pantalla siempre encendida) — Aceptación: fila "Pantalla siempre encendida · Durante la sesión" en Perfil; con la opción activa y una sesión en curso, la app pide Wake Lock (`navigator.wakeLock.request('screen')`), lo vuelve a pedir al volver a primer plano y lo libera al terminar o abandonar la sesión; sin soporte del navegador, la fila se ve deshabilitada con una explicación — Checks: Jest con `navigator.wakeLock` simulado.
- S5: "entran en el plan" (exportar CSV) — Aceptación: "Exportar historial (CSV)" en Perfil descarga un `.csv` en UTF-8 con BOM, una fila por serie registrada, columnas según D2 — Checks: Jest del caso de uso que arma el CSV (comillas, comas y saltos de línea escapados), e2e que verifica la descarga.
- S6: "entran en el plan" (elegir color de acento) — Aceptación: radiogroup "Color de acento" en Perfil con las 4 opciones; cambia el acento al instante sin recargar y persiste — Checks: Jest del servicio de apariencia, e2e de Perfil.
- S7: el tema por defecto es "Sistema" y el acento por defecto es `#2B59FF` (confirmado en L7: "dale,").
- S8 (supuesto): Primer uso reemplaza el estado vacío "Sin rutina activa" de Hoy cuando no hay ninguna rutina. Con rutinas pero sin una activa, Hoy sigue como hoy. Confirmar o descartar en T13.
- S9: "Pantalla siempre encendida" viene desactivada por defecto; el usuario la activa en Perfil (L19: "nop, la tenes que activar").
- S10: "obviamente quiero que la aplicacion siga aprovechando la informacoin y datos que se estvieron cargando, por ejemplo luego de esta migracion grande que fue, que sigan apareciendo los datos que todo este tiempo usando la apliciion, que eso siga como siempre, se entiende?" (L20).
  - Aceptación:
    - Lo que se guardó antes de la rama se sigue viendo y usando después de actualizar: perfil, rutinas, días, ejercicios propios, sesiones, series y PRs.
    - Ninguna pantalla deja de mostrar un dato que antes mostraba, salvo por decisión del usuario (L17: nombre y avatar).
    - No cambian el esquema Dexie ni el formato de las filas. Excepción autorizada en L26 ("autorizo"): `ExerciseRow.plateWeightKg`, opcional y sin índice (S11).
  - Checks:
    - Sin cambios en `src/app/core/db` ni en los `data/` de las features desde `081e4d3`.
    - Auditoría de antes y después por pantalla.
    - Chequeo diferencial de actualización: lo que escribe la build de `081e4d3` se ve en la build nueva, en el mismo origen.
    - El CSV de T12 incluye las sesiones viejas.
- S11: "y si ponemos que cada placa pesa 5kgs?? para darle un valor a ese volumen, igualmente ese valor se tendria que pode cambiar, ya sea al cambiar en el edit del ejercicio, por ejemplo lo cambio a placas y m da un lugar donde escribir el peso de cada placa, seria opcional, sino se ingresa nada es 5kg" (L26).
  - Aceptación:
    - En el formulario del ejercicio, con unidad "Placas (máquina)", aparece un campo opcional para el peso de cada placa en kg. Vacío vale 5 kg. Se guarda en `plateWeightKg`, opcional y sin índice, sin versión nueva de Dexie. Los ejercicios guardados antes valen 5 kg.
    - Las series en placas se muestran como "N placas" en todas las pantallas y nunca se convierten a lb (D4).
    - Todo volumen cuenta una serie en placas como placas × peso por placa × reps, en kg, y lo convierte a lb si esa es la unidad preferida.
    - El 1RM estimado de un ejercicio en placas también usa el peso por placa, como el volumen (confirmado en L28: "dale lo dejamos asi").
    - El peso por placa es de cada ejercicio, porque cada máquina tiene el suyo (L28).
    - El editor del día pide "Placas" en esos ejercicios, no "Peso … kg".
  - Checks: Jest de cada superficie; e2e con un ejercicio propio en placas de 10 kg por placa, de la sesión al Resumen.

Decisiones abiertas (preguntar una por vez al llegar a la tarea, antes de implementar):
- D1 (T13), resuelta en L29 ("esta bien"). Ejercicios del catálogo por nombre, sin peso objetivo, con el descanso por defecto. "Usar" crea solo los días; asignarlos a la semana es el paso 3.
  - Torso / Pierna (4 días):
    - Torso A: Press de banca 4×6 · Remo con barra 4×8 · Press militar 3×8 · Jalón al pecho 3×10
    - Pierna A: Sentadilla 4×6 · Peso muerto rumano 3×8 · Prensa de piernas 3×10 · Elevación de gemelos 3×12
    - Torso B: Press inclinado con barra 3×8 · Dominadas 3×8 · Press de hombros con mancuernas 3×10 · Remo con mancuerna 3×10
    - Pierna B: Peso muerto 3×5 · Zancadas 3×10 · Curl femoral 3×12 · Hip thrust 3×10
  - Full body (3 días):
    - A: Sentadilla 3×8 · Press de banca 3×8 · Remo con barra 3×8 · Plancha 3×45 s
    - B: Peso muerto 3×5 · Press militar 3×8 · Jalón al pecho 3×10 · Zancadas 3×10
    - C: Prensa de piernas 3×10 · Press de banca con mancuernas 3×10 · Remo en polea baja 3×10 · Abdominales 3×15
  - Push / Pull / Piernas (3 días distintos, para hacerlos dos veces por semana):
    - Push: Press de banca 4×8 · Press militar 3×8 · Elevaciones laterales 3×12 · Extensión de tríceps en polea 3×12
    - Pull: Dominadas 3×8 · Remo con barra 4×8 · Face pull 3×15 · Curl de bíceps 3×10
    - Piernas: Sentadilla 4×6 · Peso muerto rumano 3×8 · Extensión de cuádriceps 3×12 · Elevación de gemelos 3×15
  - Supuesto: si un ejercicio de la plantilla ya no está en la biblioteca con ese nombre (porque se renombró o se borró), se saltea y la rutina se crea igual.
- D2 (T12), resuelta en L20: columnas `fecha, rutina, dia, ejercicio, serie, tipo, peso, unidad, reps, tiempo_s, distancia_km, pr`. Una fila por serie, solo de sesiones terminadas. `peso` va en la unidad preferida y `unidad` dice cuál es. Las celdas que no aplican al tipo de serie quedan vacías. La distancia va en km porque así se guarda (`DistanceTimeSet.distanceKm`).
- D4 (T17), resuelta en L25: el número guardado es la cantidad de placas que se le ponen a la máquina; nunca son kg ni se convierten a lb. Antes, cada parte lo trataba distinto:
  - el editor del día lo pide como "Peso … kg";
  - Sesión lo muestra como "N placas";
  - Hoy, Resumen y Progreso lo tratan como kg y, con lb, lo convierten.
- D3 (T10), resuelta en L16: entran "Descanso por defecto" (hoy es la constante `DEFAULT_REST_SECONDS = 90` en `src/app/features/training/ui/services/rest-timer.service.ts:8`; el descanso propio de cada ejercicio sigue mandando) y "Aviso al terminar el descanso" (switch para el beep y la notificación que hoy siempre se disparan). Las dos son preferencias del dispositivo en `localStorage`, sin tocar Dexie.

## Tasks

- [x] T1 · S1, S2 · ruta: inline · Tokens C claro y oscuro con los 4 acentos en `src/styles.css`, colores semánticos en `tailwind.config.js` (`page`, `surface`, `line`, `line-soft`, `ink`, `ink-2`, `dash`, `empty`, `danger`, `accent` con `DEFAULT`/`ink`/`on`/`soft`), Inter Tight y JetBrains Mono en `public/fonts/` con `preload` en `src/index.html`. La rampa `forge-*`, `accent-50..700` y Geist conviven hasta T14. Verificar que el service worker cachee `/fonts/**`: el patrón `/*.(…woff2)` de `ngsw-config.json:18` parece cubrir solo la raíz · Aceptación: build verde, clases nuevas disponibles, fuentes servidas offline · Evidencia: `9edf638` (tokens y fuentes), `6ebc80b` (caché SW). RED: J14.4 falla con el `ngsw-config.json` viejo (`[false, false]`); GREEN: `e2e:pwa` 4/4. `npm run build` verde, `ngsw.json` con las 4 woff2 en el grupo `fonts` (prefetch). Sonda de Tailwind genera `bg-page`, `text-ink-2`, `border-line-soft`, `bg-accent-soft`, `text-accent-on`, etc., y las clases viejas siguen. `npm test` 1350/1350, `npm run e2e` 23/23 · Risk: item 5 (cambió `ngsw-config.json`; lo cubre J14.4 y queda para el verificador de T15)
- [x] T2 · S2, S6, S7 · ruta: inline · Servicio de apariencia en `src/app/core/` (tema `light | dark | system`, acento), clave `localStorage` `forge.appearance` con lectura tolerante a valores inválidos, script inline en `src/index.html` que pone `data-theme` y `data-accent` antes de pintar (hoy `data-theme="dark"` fijo en `src/index.html:2`), escucha de `prefers-color-scheme`, actualización de `theme-color` (hoy fijo `#0c0a09` en `src/index.html:10`). Test-first en Jest · Aceptación: S2 y S6 a nivel servicio · Evidencia: `ae8ad79`. RED: los specs fallan sin `appearance.service.ts` y, con el servicio, los 7 del script inline fallan con "No inline script reads forge.appearance in index.html"; GREEN: 22/22 (`appearance.service.spec.ts` y `appearance-boot-script.spec.ts`). Probe en Chromium sobre el build: al crearse `<body>`, antes de que arranque Angular, ya están `data-theme`, `data-accent` y `theme-color` (claro sin guardar → `light`/`cobalt`/`#F6F6F4`; oscuro sin guardar → `dark`; guardado `dark`+`green` con sistema claro → `dark`/`green`). `npm test` 1372/1372, `npm run build` verde, `npm run e2e` 23/23 · Risk: none (clave nueva; no cambia datos guardados)
- [x] T3 · S1, S2 · ruta: delegada · Journey visual `e2e/visual/screens.spec.ts`: cada pantalla de la tabla en claro y oscuro con datos de `e2e/fixtures/seed.ts`, `toHaveScreenshot` con baselines generadas en Docker con Playwright v1.60.0 (como la verificación anterior) para que el render sea estable. Cada tarea de pantalla regenera solo sus baselines y revisa las capturas · Aceptación: el journey corre verde y deja las capturas · Evidencia: `8aec475`, ruta delegada (subagente Sonnet, pedido en L6). Sin RED, por la excepción de `testing.md` para journeys de capturas; la prueba es de estabilidad. `npm run e2e:visual:update` 18/18 genera las baselines; `npm run e2e:visual` 18/18 sin diferencias, tanto en la corrida del subagente como en la del parent. `npm run e2e` 23/23 con `**/visual/**` excluido. eslint limpio. Revisé `sesion-light` y `sesion-dark` · Risk: none
- [x] T4 · S1 · ruta: delegada · Componentes compartidos `src/app/core/shared/ui/` (`button`, `card`, `chip`, `input`, `page-header`, `empty-state`, `skeleton`, `toast`, `wheel-picker`, `icon` si cambia el trazo) y shell (`src/app/shell/navigation/bottom-nav.component.ts` sin hex, `src/app/shell/layout/app-layout.component.ts`) con tokens semánticos · Aceptación: los specs existentes pasan; capturas coherentes con el canvas · Evidencia: `9066b19`, ruta delegada (subagente Sonnet). RED: 27 tests de `src/app/core/shared/ui` y `src/app/shell` fallaban antes de implementar; GREEN 203/203. El parent ajustó `set-logger.component.spec.ts:106`, que fijaba `bg-accent-500/12` de la variante `accent_soft`. `npm test` 1378/1378, `npm run e2e` 23/23, `npm run e2e:visual` 18/18 con las baselines regeneradas, eslint limpio en la superficie. Revisé `perfil-light`: barra, botón primario y tarjetas como en el canvas · Risk: item 6 (ningún test falla ante una regresión visual; evidencia: capturas de T3)
- [x] T5 · S1 · ruta: delegada · Hoy y Resumen (`training-home.page.ts`, `session-summary.page.ts`, `pr-celebration.component.ts`) según `C-Hoy` y `C-Summary`, más `e2e/journeys/training.spec.ts` · Aceptación: capturas iguales al canvas; e2e de training verde · Evidencia: `e03b6c0` (Hoy), `9115caf` (Resumen y PR); ruta delegada (subagente Sonnet). RED antes de implementar: Hoy 13/32, PR 5/12, Resumen 9/22. Corrección pedida por el parent (regresión de unidad, L11): RED 5/25, GREEN 25/25. `npm test` 1405/1405, `npm run e2e` 23/23, `npm run e2e:visual` 18/18 (solo cambiaron `hoy-*` y `resumen-*`), eslint limpio en lo tocado. Revisé `hoy-light` y `resumen-dark` · Risk: item 6 (igual que T4)
- [x] T6 · S1 · ruta: delegada · Sesión planilla (`training-session.page.ts`, `exercise-session-card.component.ts`, `set-logger.component.ts`, `rest-timer.component.ts`) según `C-Session`. Se conservan el prefill de la última vez y el timer en web worker · Aceptación: capturas; e2e de training verde, incluido el prefill (J14) · Evidencia: `8bbdb8f`, ruta delegada (subagente Sonnet). RED: 31 tests en 4 suites; GREEN `npx jest src/app/features/training/ui` 278/278. `tsc -p tsconfig.app.json` limpio. `npm test` 1424/1424. `npm run e2e` 23/23, J14 incluido. `npm run e2e:visual` 18/18; solo cambiaron `sesion-*`. eslint limpio: se fueron los 7 errores previos de esos archivos. Revisé `sesion-dark` · Risk: item 6 (igual que T4)
- [x] T7 · S1 · ruta: delegada · Rutinas y editor de día (`routine-list`, `routine-card`, `routine-editor`, `weekly-schedule-editor`, `training-day-editor`, `target-set-editor`) según `C-Routines` y `C-DayEditor`, más `e2e/journeys/routines.spec.ts` · Aceptación: capturas; e2e de rutinas verde · Evidencia: `856f9b3`, ruta delegada (subagente Sonnet). RED: card 8/17, lista 7/15, editor de día 12/21, numeración de series 1, card del editor de rutina 1. GREEN: `npx jest src/app/features/routines/ui` 124/124. `tsc` limpio. `npm test` 1450/1450. `npm run e2e` 24/24 (suma J6a.3). `npm run e2e:visual` 18/18; solo cambiaron `rutinas-*` y `editor-dia-*`. eslint limpio salvo `exercise-picker.page.ts:177`, que es previo y de T8. Revisé `rutinas-light` · Risk: item 6 (igual que T4)
- [x] T8 · S1 · ruta: delegada · Biblioteca y ejercicios (`exercise-picker` con búsqueda, filtro por grupo, selección múltiple y la etiqueta "En el día"; `exercise-list`, `exercise-form`, `exercise-thumbnail`) según `C-Library`, más `e2e/journeys/exercises.spec.ts` · Aceptación: capturas; e2e de ejercicios y J4 de rutinas verdes · Evidencia: `2cf19c5`, ruta delegada (subagente Sonnet). RED: 34 de 64 tests. GREEN: 70/70. `tsc` limpio. `npm test` 1477/1477. `npm run e2e` 25/25 (suma J4.4). `npm run e2e:visual` 18/18; solo cambiaron las `biblioteca-*`. eslint limpio: se fueron los `no-misused-promises` previos del picker y de la lista. Revisé `biblioteca-dark` · Risk: item 6 (igual que T4)
- [x] T9 · S1 · ruta: delegada · Progreso e historial (`progress-home`, `pr-list`, `exercise-history`, componentes de `progress/ui/components/`; quitar los hex de `line-chart.component.ts`) según `C-Progress` y `C-Exercise`, más `e2e/journeys/progress.spec.ts` · Aceptación: capturas; gráficos legibles en los dos temas; e2e de progreso verde · Evidencia: `ecf9324`, ruta delegada (subagente Sonnet). RED observado primero en el redibujo por tema y acento (los colores fijos `#4CAF50` y `rgba(0,0,0,0.1)`) y en el redondeo del 1RM. GREEN: `npx jest src/app/features/progress/ui` 152/152. `tsc` limpio. `npm test` 1526/1526. `npm run e2e` 25/25. `npm run e2e:visual` 18/18; solo cambiaron `progreso-*` e `historial-ejercicio-*`. eslint limpio. `rg` sin hex. Revisé `progreso-dark` · Risk: item 6 (igual que T4)
- [x] T10 · S1, S2, S6 · ruta: inline · Perfil según `C-Profile`: secciones Apariencia (Tema, Color de acento, conectados al servicio de T2), Entrenamiento (Unidad de peso; "Descanso por defecto" y "Aviso al terminar el descanso" según D3, test-first, el timer usa el descanso por defecto guardado cuando el ejercicio no tiene uno propio y respeta el switch de aviso) y Datos (Borrar historial sin cambio de comportamiento), más `e2e/journeys/profile.spec.ts`. Sin Nombre ni Avatar (L17) · Aceptación: S2 y S6 de punta a punta; J13.1 verde · Evidencia: `7d17fb9` (L17, L18). RED: faltaban `SetPreferredUnitUseCase` y `RestPreferencesService`. Después fallaron 30 de 30 tests de la página, 3 del timer (descanso guardado, descanso 0 y aviso apagado) y 1 de Sesión (`Expected: 150, Received: undefined`). GREEN: `npx jest src/app/features/profile` 67/67. `tsc -p tsconfig.app.json` limpio. `npm test` 1560/1560. `npm run e2e` 27/27 (J13.1 reescrito, suma J13.2 y J13.3). `npm run e2e:visual` 18/18, con build; solo cambiaron `perfil-*`. eslint limpio en lo tocado. Revisé `perfil-light` y `perfil-dark` · Risk: none (la clave `forge.rest` es nueva; el perfil se guarda con la misma forma de `ProfileRow`)
- [x] T11 · S4, S9 · ruta: inline · Servicio de Wake Lock en `src/app/core/`, preferencia en `forge.appearance`, uso desde la sesión activa, fila en Perfil. Test-first en Jest con `navigator.wakeLock` simulado: pedir, volver a pedir en `visibilitychange`, liberar al terminar, sin soporte · Aceptación: S4 · Evidencia: `88da6bc` (L19). RED: 21 tests nuevos fallaban con el servicio vacío (17 del servicio, 3 de Perfil y 2 de Sesión). GREEN: `npx jest src/app/core/wake-lock src/app/features/profile/ui …/training-session.page.spec.ts` 88/88. `tsc` limpio. `npm test` 1582/1582. `npm run e2e` 27/27. `npm run e2e:visual` 18/18; solo cambiaron `perfil-*`. eslint limpio en lo tocado. Revisé `perfil-light` · Risk: item 4 (pedido y liberación asíncronos del lock con `visibilitychange`; lo cubren los tests de carrera y queda para el verificador de T15)
- [x] T12 · S5 · ruta: inline · Preguntar D2 antes. Caso de uso que arma el CSV desde sesiones y series (repositorios existentes, sin escribir datos), descarga con `Blob`, botón en Perfil. Test-first en Jest · Aceptación: S5 · Evidencia: `f88df20` (L21). RED:
  - Caso de uso: 9 de 9 fallaban contra un stub vacío.
  - Página y `FileDownloadService`: fallaban 7, que son 4 de Perfil y 3 del servicio.
  - GREEN: `npx jest src/app/core/files src/app/features/profile/ui src/app/features/progress/domain` 125/125. `tsc` limpio. `npm test` 1598/1598.
  - `npm run e2e` 28/28, con J13.4 nuevo. Ese e2e se escribió después de implementar; el RED de esas reglas se vio en Jest.
  - `npm run e2e:visual` 18/18; solo cambiaron `perfil-*`. eslint limpio en lo tocado. Revisé `perfil-dark`.
  - Risk: none (solo lectura; formato nuevo que todavía nadie consume)
- [x] T13 · S3, S8 · ruta: delegada (respaldo de contexto de ~150k del parent, un writer Sonnet) · D1 resuelta en L29. Feature `onboarding`: pantalla Primer uso según `C-Welcome`, catálogo de plantillas, caso de uso que crea la rutina con los casos de uso de `routines` existentes (respeta "una sola rutina activa", J6a.2). Ajustar el e2e "muestra \"Sin rutina activa\"…" y sumar uno de primer uso · Aceptación: S3 · Evidencia: `72ecb05` y `96c8fe8` (L30). RED en Jest, lo reportó el writer y no lo observó el parent: catálogo 6/6, caso de uso 10/10, componente 8/8 y Hoy 3/5. Los e2e se escribieron después de implementar. GREEN: `npm test` 1770/1770, e2e 34/34 en el puerto 4300, `npm run e2e:visual:update` 20/20, con `primer-uso-*` nuevas y las otras 18 sin cambios. tsc limpio; `npm run lint` da 5 errores, todos previos. Revisé `primer-uso-light` y `primer-uso-dark` · Risk: none (crea registros solo con los casos de uso existentes)
- [ ] T14 · S1 · ruta: inline · Limpieza: borrar la rampa `forge-*`, `accent-50..700`, `--pr-warm*` si queda sin uso, los bloques viejos `.forge-dark`/`.forge-light`, las Geist y sus `preload`; regenerar todas las baselines. En `public/manifest.webmanifest` cambian solo los colores: `id`, `start_url`, `scope` y `name` quedan igual, así la app instalada sigue siendo la misma (S10) · Aceptación: `rg` de S1 sin resultados; build verde · Evidencia: — · Risk: item 6 (igual que T4)
- [x] T16 · S10 · ruta: delegada (auditoría en workflow) e inline (chequeo diferencial) · Continuidad de datos:
  - Auditoría de solo lectura de antes (`081e4d3`) y después: capa de persistencia y cada pantalla, con verificación adversarial de cada hallazgo.
  - Chequeo diferencial en scratch: la build de `081e4d3` escribe datos con su propia UI y la build nueva los muestra en el mismo origen.
  - Corregir lo que se haya perdido sin decisión del usuario: pasó a T17 (L22).
  - Aceptación: S10 · Evidencia: auditoría `wf_20f26eae-8cb` (L22) y diferencial `wf_0bfe533d-a45` (L23) · Risk: none (verificación de solo lectura)
- [x] T17 · S10 · ruta: delegada (Writer trigger: 3 unidades con superficies disjuntas, en paralelo, cada una en su worktree, Sonnet) e inline (integración y correcciones de la revisión) · Correcciones de la auditoría de T16 según las decisiones de L22:
  - Unidad A: Hoy y Resumen (`src/app/features/training/ui`).
  - Unidad B: Rutinas (`src/app/features/routines/ui`).
  - Unidad C: Progreso (`src/app/features/progress/ui`).
  - Los hallazgos de placas esperan D4.
  - Aceptación: cada hallazgo confirmado tiene su test RED→GREEN; `npm test`, `npm run e2e` y `npm run e2e:visual` verdes; capturas revisadas.
  - Evidencia: `3b55fc4` (A), `80187d1` (B), `a4c027c` (C) (L24).
    - RED de A1–C7: lo reportaron los writers del workflow `wf_4b271193-2d2`; el parent no lo observó.
    - RED observado de las correcciones importantes de la revisión: A2 en J8.2, B2 en J4.5, C2 en 2 tests y C5 en 3 tests (detalle en L24).
    - GREEN: `npm test` 1659/1659, `npm run e2e` 30/30, `npm run e2e:visual:update` 18/18. tsc limpio.
    - Revisé `hoy-light`, `hoy-dark`, `resumen-dark`, `historial-ejercicio-light`, `historial-ejercicio-dark` y `editor-dia-light`.
  - Pendiente: las correcciones menores de L23 no se aplicaron.
  - Risk: item 6 (cambios visuales; lo cubren J8.2, J4.5 y las capturas, y queda para el verificador de T15)
- [x] T18 · S10, S11 · Placas según D4 y S11. Risk: item 1 (formato guardado de `ExerciseRow`) e item 3 (CSV con unidad `placas`, firmas de la agregación de Progreso); quedan para el verificador de T15.
  - T18a · ruta: inline · Base compartida: `DEFAULT_PLATE_WEIGHT_KG` y la carga en kg de una serie en `src/app/core/shared/domain/weight-unit.ts`; `plateWeightKg` en `Exercise`, `ExerciseRow`, mapper, casos de uso de crear y editar, y el campo del formulario · Hecha · Evidencia: `29b9e75`. RED: 19 de 52 tests (helpers, mapper y casos de uso) y 4 de 12 del formulario. GREEN: `npx jest src/app/features/exercises src/app/core/shared/domain` 199/199, tsc limpio. eslint limpio en lo tocado; se arregló el error previo de `weight-unit.ts:12`. Corrección a lo dicho en L26: los ejercicios del catálogo también se editan (`exercise-list.page.ts:104`), así que también pueden pasar a placas.
  - T18b · ruta: delegada (Writer trigger: T18b y T18c son disjuntas y de más de 100 líneas cada una, en paralelo, Sonnet) · `src/app/features/training/ui` (Hoy, Resumen, celebración de PR) y `src/app/features/routines/ui/components/target-set-editor.component.ts` · Hecha · Evidencia: `3fbe130`. RED por regla, lo reportó el writer y no lo observó el parent (L27). GREEN: `npx jest src/app/features/training src/app/features/routines` 798/798, que el parent volvió a correr con el mismo resultado; tsc y eslint limpios.
  - T18c · ruta: delegada (ídem) · `src/app/features/progress` (agregación de volumen, récords, 1RM, historial, gráfico, lista de PR, lista de progreso) · Hecha · Evidencia: `aecda84`. RED por regla, lo reportó el writer y no lo observó el parent (L27). GREEN: `npx jest src/app/features/progress` 335/335; tsc y eslint limpios.
  - T18d · ruta: inline · Integración, e2e de S11, capturas y revisión · Hecha · Evidencia: `ef2672b` (J15). `npm test` 1741/1741. e2e 31/31, corrido en el puerto 4300 con una config temporal (L27). `npm run e2e:visual:update` 18/18 sin capturas cambiadas. tsc limpio. `npm run lint` da 5 errores, todos previos.
- [ ] T15 · S1–S11 · ruta: delegada (Verification trigger: items 4, 5 y 6 en T1, T4–T9, T11, T14) · Cierre: `npm test`, `npm run lint`, `npm run build`, `npm run e2e`, `npm run e2e:pwa` (fuentes offline), y un `odd-verifier` (opus) sobre toda la feature desde `081e4d3` · Aceptación: todo verde o un único **Needs your decision** · Evidencia: — · Risk: —

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
- L13 (2026-10-27) T7 cerrada:
  - Lista: "N rutinas", tarjeta de la rutina activa con su semana y la tabla de días, "Editar semana", "Otras rutinas" y entrada "Biblioteca de ejercicios".
  - Comportamiento sumado del canvas: botón "Activar" en las rutinas no activas. Reusa `SetActiveRoutineUseCase`, así que sigue habiendo una sola activa; lo cubre J6a.3. Antes solo se activaba desde el editor de rutina.
  - Editor de día:
    - "Agregar ejercicio" pasa a "Agregar ejercicios" y "Guardar día" a "Listo".
    - "Quitar del día" queda dentro de la fila expandida, con el `aria-label` "Quitar X".
    - "Editar día" pasa a h1 `sr-only` y el nombre del día queda como input grande.
    - El botón de volver muestra el nombre de la rutina.
  - Series objetivo: "Serie N" y "Quitar serie N".
  - Omitido del canvas porque no tiene soporte:
    - "última vez" / "nunca usada" en las rutinas y los contadores de la biblioteca.
    - Los chips "Se entrena los" y "Eliminar día".
    - Reordenar arrastrando.
    - El rango de reps y "placas".
    - Los steppers de series y de descanso: el descanso sigue en segundos.
  - El ícono `chevron-up` no existe: la fila expandida gira el `chevron-down`.
  - Los días se listan en el orden de almacenamiento de `TrainingDayRepository.getByRoutineId`, como antes.
  - Próximo paso: T8 (Biblioteca y ejercicios).
- L14 (2026-10-27) T8 cerrada:
  - La selección múltiple ya existía: `AddExercisesToDayUseCase` agrega todos los ids en una sola llamada. T8 sumó el contador y el estado "Elegí ejercicios".
  - "En el día": el picker lee el día con `GetTrainingDayWithExercisesUseCase`. Las filas que ya están en el día salen tildadas, atenuadas y `disabled`, con `aria-label` "{X}, en el día". Antes se podían tocar, pero el caso de uso las descartaba en silencio; nunca se duplicaban.
  - Nuevo `fg-muscle-group-filter` (`features/exercises/ui/components/`), hecho de `<button aria-pressed>` dentro de `role="group"`. Lo usan el picker y la lista. Resuelve localmente el problema de foco de `fg-chip` (L10); `fg-chip` sigue sin ser enfocable donde se use.
  - Textos cambiados:
    - El título del picker pasa de "Elegir ejercicio" a "Agregar a {día}", con el nombre de la rutina como subtítulo.
    - Volver pasa a "Cancelar".
    - "Crear ejercicio nuevo" pasa a ser un "+" con `aria-label` "Crear ejercicio propio".
    - El buscador dice "Buscar en N ejercicios".
    - El título de sección muestra "Grupo · N".
    - Los ejercicios propios llevan la etiqueta "Propio".
  - Omitido del canvas:
    - Filtros reducidos a 6 grupos: quedan los 9 reales más "Todos".
    - "· kg" en la meta, porque la unidad es una preferencia; solo se muestra "placas".
    - El checkbox `<input>` real, que se reemplaza por una celda visual dentro del botón para conservar el nombre accesible.
  - Próximo paso: T9 (Progreso e historial).
- L15 (2026-10-27) T9 cerrada:
  - Gráficos: `helpers/chart-palette.ts` lee `--color-*` con `getComputedStyle` y los pasa a `rgb(r, g, b)`, porque Chart.js no resuelve `rgb(var(--x))`. `line-chart` y `exercise-history-chart` se redibujan cuando cambian `AppearanceService.resolvedTheme()` o `accent()`. `weekly-trend-chart` pasa a dos gráficos de barras en CSS (volumen y sesiones).
  - Pesos: `helpers/weight-display.ts` delega en `DisplayWeightPipe`, y `format-tracking-value.ts` también. El tile de 1RM se redondea a 1 decimal.
  - Filtros de métrica y rango del historial, y filtros de `pr-list`, ahora son `button[aria-pressed]` en vez de `fg-chip`.
  - Textos cambiados:
    - "ÚLTIMAS 12 SEMANAS" → "Constancia".
    - "ÚLTIMOS PRS" → "Récords personales".
    - "Ver todos los PRs" → "Ver todos" / "Ver los N".
    - "Sets" → "Series".
    - "ÚLTIMOS SETS" → "Historial".
    - El h1 del historial pasa a ser el nombre del ejercicio.
    - Tiles: "1RM est.", "Mejor serie" y "Sesiones".
    - Botones del gráfico: "Peso máx." y "1RM est.".
    - J9.1, J9.2 y J11 actualizados.
  - Omitido del canvas:
    - "Exportar historial" en el encabezado de Progreso: llega con T12 en Perfil.
    - La columna "12 sem" y la "racha".
    - El calendario de 52 semanas: el caso de uso da 12.
    - El equipo en la meta.
    - La etiqueta del último punto del gráfico.
    - La acción "Calendario" sin destino.
  - "Mejor serie" ("97.5 kg × 5") se parte en 2 líneas a 390 px. Se dejó así.
  - Próximo paso: T10 (Perfil). Antes hay que preguntar D3.
- L16 (2026-10-27) Pregunta D3: "¿Las sumamos, o dejamos Perfil sin esas dos filas?" (las filas son "Descanso por defecto" y "Aviso al terminar el descanso"). Respuesta textual:
  > las sumamos, pero eso queda para otra session, quiero que hagas commit de todo lo que hicimos hasta ahor

  - D3 queda resuelta: entran las dos filas y T10 cambia en consecuencia. La sesión se corta acá; T1–T9 están commiteadas en la rama, sin push.
  - Próximo paso (otra sesión): T10 (Perfil con Apariencia, Entrenamiento con las dos filas de D3, y Datos). Después T11 (preguntar S9), T12 (preguntar D2), T13 (preguntar D1 y S8), T14 y T15. Los trabajos de pantalla se delegaron a subagentes Sonnet (`general-purpose`, que tiene la herramienta Artifact para leer el canvas), uno por vez, porque en paralelo chocarían los puertos 4200 y 8081, `dist` y Docker.
- L17 (2026-10-28) Retomado con: "continuamos con el Forge, donde nosquedamos". Pregunta para T10: el tablero `C-Profile` no tiene Nombre ni Avatar, que hoy solo se usan en Perfil; "¿Saco Nombre y Avatar de Perfil, o los mantengo?". Respuesta textual:
  > sacalo

  - Perfil deja de editar Nombre y Avatar, y se va el formulario "Configurá tu perfil". Los campos `name` y `avatarBase64` siguen en `ProfileRow` (el esquema Dexie no cambia) y se conservan al guardar.
  - "Unidad de peso" pasa a un radiogroup kg/lb que guarda al instante con un caso de uso nuevo, `SetPreferredUnitUseCase`. Si no hay perfil, lo crea con `name` vacío. `SetUserProfileUseCase` queda sin uso y se borra. J13.1 pasa a probar la unidad.
- L18 (2026-10-28) T10 cerrada:
  - Preferencias de descanso: `RestPreferencesService` (`src/app/core/rest-preferences/`) con la clave `localStorage` `forge.rest` (`defaultSeconds`, `alertOnEnd`). Usa la misma lectura tolerante que `forge.appearance` y mezcla al guardar. `DEFAULT_REST_SECONDS = 90` se mudó ahí desde `rest-timer.service.ts`. Vale la regla de `RestSeconds`: entero mayor o igual a 0, y 0 significa sin descanso.
  - `RestTimerService` usa el descanso guardado cuando el ejercicio no tiene uno propio. Con el aviso apagado, al terminar el descanso no suena ni notifica. La tarjeta de Sesión muestra ese mismo descanso.
  - "Descanso por defecto" abre un panel con "−15s" / "+15s" (`aria-label` "Restar 15 segundos" / "Sumar 15 segundos"). No baja de 0:00.
  - La unidad se aplica en toda la app al instante: Perfil actualiza `UserPreferencesService.unit`. Antes, el resto de las pantallas seguía con la unidad vieja hasta recargar. Si falla el guardado, se vuelve a la unidad anterior y aparece un toast.
  - `GetUserProfileUseCase` también quedó sin uso y se borró. `createProfile` e `InvalidProfileInputError` (`profile.entity.ts`) solo los usa su spec; quedan para T14.
  - Textos cambiados según el canvas: "Instalar app" → "Instalar Forge en el inicio". El botón "Activar notificaciones (estado)" pasa a vivir bajo "Aviso al terminar el descanso", y solo se ve con el aviso encendido:
    - "Permitir notificaciones" si el permiso está pendiente.
    - "Notificaciones bloqueadas en el navegador: solo suena el aviso." si está denegado.
    - "Las notificaciones requieren instalar la app primero." sin soporte, igual que antes.
  - La explicación de "Borrar historial" ("Borra rutinas, sesiones…") pasa al paso de confirmación; el comportamiento no cambia.
  - Omitido del canvas: la línea "142 sesiones · desde mar 2026", porque Perfil tendría que leer sesiones de otra feature. "Pantalla siempre encendida" llega con T11 y "Exportar historial (CSV)" con T12.
  - Detalle de Jest: un mock rechazado detrás de un clic en el DOM aparece como error no capturado de zone.js antes de que corra el `catch`. El test de error de la unidad llama a `onUnitChange` directamente, como los demás tests de rechazo del repo.
  - Próximo paso: T11 (Wake Lock). Antes hay que preguntar S9.
- L19 (2026-10-28) Pregunta S9: "¿"Pantalla siempre encendida" viene activada por defecto?". Respuesta textual:
  > nop, la tenes que activar

  T11 cerrada:
  - `ScreenWakeLockService` (`src/app/core/wake-lock/`) guarda `keepAwake` dentro de `forge.appearance` y mezcla al guardar. `AppearanceService` también mezcla, así que ninguno pisa al otro. Sin valor guardado, o con un valor que no es `true`, queda apagada.
  - La página de Sesión llama a `hold()` cuando encuentra la sesión activa y a `release()` en `ngOnDestroy`. Terminar, cancelar y minimizar salen de la página, así que las tres liberan el lock. Al volver a la sesión se pide de nuevo.
  - El lock se pide solo con la sesión abierta, la opción encendida, soporte del navegador y la página visible. Cuando la página se oculta, el navegador lo libera solo; en `visibilitychange` a visible se vuelve a pedir.
  - Carreras cubiertas:
    - No hay doble pedido mientras uno está en curso.
    - Si la sesión termina o la opción se apaga con el pedido en curso, el lock que llega se libera enseguida.
    - Un pedido rechazado (`NotAllowedError`) no rompe nada y se reintenta en el próximo paso a primer plano.
  - Sin soporte, la fila de Perfil dice "Tu navegador no permite mantener la pantalla encendida." y el switch queda `disabled`.
  - Próximo paso: T12 (CSV). Antes hay que preguntar D2.
- L20 (2026-10-28) Pregunta D2, con la propuesta `fecha, rutina, dia, ejercicio, serie, tipo, peso, unidad, reps, tiempo_s, distancia_km, pr`: "¿Vamos con esas columnas?". Respuesta textual:
  > dale me parece bien, obviamente quiero que la aplicacion siga aprovechando la informacoin y datos que se estvieron cargando, por ejemplo luego de esta migracion grande que fue, que sigan apareciendo los datos que todo este tiempo usando la apliciion, que eso siga como siempre, se entiende?

  - D2 queda resuelta con esas columnas.
  - La segunda parte es un requisito nuevo, S10, y se cubre con la tarea nueva T16. T15 pasa a cubrir S1–S10.
  - T14 suma una restricción: el manifest mantiene su identidad.
  - Próximo paso: T12 (inline, test-first). En paralelo corre la auditoría de T16 (workflow de solo lectura, que compara `081e4d3` con `49c5183`).
- L21 (2026-10-28) T12 cerrada:
  - `ExportHistoryCsvUseCase` vive en `features/progress/domain/use-cases/`, porque `progress` ya lee `SessionRepository` de `training`. La ruta de Perfil lo provee junto con los cuatro repositorios Dexie que lee. No escribe nada.
  - Lee todas las series con `getWorkedSetsSince(new Date(0))` y toma solo las sesiones `completed`. Los estados `missed` y `recovered` existen en el tipo, pero ningún código los escribe, ni en `081e4d3` ni hoy.
  - Valores:
    - `tipo`: `peso_reps`, `peso_corporal`, `tiempo` o `distancia_tiempo`.
    - `pr`: `sí` o `no`.
    - `serie`: numera las series de cada ejercicio dentro de la sesión, en el orden en que se registraron.
    - `peso`: en lb usa el mismo factor y redondeo que `DisplayWeightPipe` (2.20462, un decimal); en kg va tal como se guardó.
  - Si la rutina, el día o el ejercicio ya no existen, la fila queda igual, con esas celdas vacías.
  - Formato: comillas según RFC 4180 y fin de línea CRLF.
  - Sin protección contra fórmulas (`=`, `+`, `-`, `@`), porque los nombres los escribe solo el dueño del dispositivo; no es entrada de terceros.
  - `FileDownloadService` (`src/app/core/files/`): arma un Blob con BOM y lo descarga con un link agregado al documento. Revoca la URL 40 s después, como FileSaver.js, porque Safari en iOS falla si se revoca enseguida.
  - Sin series: toast "Todavía no hay series para exportar." y no se descarga nada. Si falla: toast "No se pudo exportar el historial". El botón queda deshabilitado mientras exporta.
  - J13.4 siembra una sesión de hace 400 días y una abierta: cubre S5 y la parte de S10 que corresponde al CSV.
  - Próximo paso: revisar la auditoría de T16 cuando termine; después, el chequeo diferencial de actualización.
- L22 (2026-10-28) Auditoría de T16 (workflow `wf_20f26eae-8cb`): 5 auditores y 5 verificadores adversariales, sin errores, con 185 entradas de inventario. Resultado:
  - Persistencia igual: Dexie v3, 8 tablas e índices idénticos, sin `upgrade()`, repositorios y mappers sin cambios. Al actualizar no se pisa ni se borra ninguna fila. Nombre y avatar se conservan (L17).
  - Datos que dejaron de verse, confirmados y sin decisión del usuario:
    - la etiqueta del día de hoy en Hoy;
    - la descripción de la rutina activa;
    - las reps por ejercicio en Resumen;
    - el mejor peso y las reps máximas del historial (ahora "Mejor serie" sale de la tabla de PR);
    - el valor de cada punto del gráfico del historial;
    - el valor exacto por semana en Progreso;
    - que el historial muestra solo 10 sesiones: ya no se avisa.
  - Bugs nuevos de la rama:
    - la tira semanal marca el día siguiente para las sesiones de noche;
    - volumen en kg fijo en Resumen y en el Diario;
    - "NaN–NaN" o "undefined s" en Objetivo;
    - el resumen de tiempo y distancia toma solo la primera serie;
    - el descanso sugerido sigue en 90 aunque en Perfil se haya cambiado;
    - siglas de días repetidas;
    - la cantidad de sesiones por semana cuenta días borrados;
    - el gráfico del historial queda en blanco después de pasar por un rango sin datos;
    - el tooltip muestra una unidad que no corresponde al valor;
    - "Récords personales" repite ejercicios y su "Mejor" no siempre es el mejor;
    - el gráfico dice "Peso máx." pero tiene un punto por serie.
  - Placas: cuatro hallazgos dependen de qué significa el número guardado, así que esperan D4 (entrenamiento F3 y M-1, progreso F5 y M-1).
  - Correcciones de T17 (el id entre corchetes es el hallazgo de la auditoría):
    - Unidad A, Hoy y Resumen:
      - A1 [entrenamiento F1]: la tira decide "hecho" con la fecha local de `startedAt`, igual que el Diario y Constancia. No con `Session.date`, que se guarda en UTC. No cambia cómo se guarda.
      - A2 [entrenamiento F2]: el volumen de Totales en Resumen y el del Diario pasan por `DisplayWeightPipe` con la unidad preferida. Llevan punto decimal y no llevan separador de miles.
      - A3 [entrenamiento F4]: "Hoy toca" vuelve a mostrar "Nombre · Etiqueta" cuando el día tiene etiqueta.
      - A4 [entrenamiento F5]: Hoy vuelve a mostrar la descripción de la rutina activa en una línea secundaria, si la tiene.
      - A5 [entrenamiento F6]: Resumen vuelve a mostrar el total de reps de cada ejercicio en una línea secundaria debajo del nombre, en los ejercicios con reps.
    - Unidad B, Rutinas:
      - B1 [rutinas H1]: "Objetivo" ignora los valores vacíos o inválidos; si no queda ninguno, muestra "N series".
      - B2 [rutinas H2]: en tiempo y distancia muestra el rango cuando las series difieren ("3 × 30–60 s").
      - B3 [rutinas H3]: el placeholder del descanso usa `RestPreferencesService.defaultSeconds()`.
      - B4 [rutinas H4]: las siglas son únicas dentro de cada rutina y se desambiguan siempre de la misma forma.
      - B5 [rutinas H5]: "M sesiones por semana" cuenta solo los días que existen. No se tocan los datos.
    - Unidad C, Progreso:
      - C1 [progreso F1]: el gráfico del historial se vuelve a dibujar después de un rango vacío.
      - C2 [progreso F2]: "Mejor serie" se calcula con las series registradas (más peso y, en empate, más reps), como en `081e4d3`. También vuelven las reps máximas, sin cortar el texto a 390 px.
      - C3 [progreso F3]: cualquier punto del historial se consulta con un toque (interacción por índice o nearest, con radio amplio), sin cambiar el dibujo.
      - C4 [progreso F4]: cada barra semanal se puede elegir (`aria-pressed`), arranca elegida la semana en curso, y una línea muestra "Semana del {d mmm}: {valor}".
      - C5 [progreso F6]: el tooltip y las etiquetas usan la unidad preferida.
      - C6 [progreso F7]: "Récords personales" muestra un ejercicio por fila con su mejor marca, ordenados por el récord más reciente, hasta 5. El botón del gráfico vuelve a decir "Peso", porque sigue habiendo un punto por serie.
      - C7 [progreso M-2]: el Historial avisa "Últimas 10 de N" y tiene "Ver todas".
  - Próximo paso: lanzar las tres unidades de T17. Cuando termine el chequeo diferencial, sumar sus hallazgos. Al final, preguntar D4.
- L23 (2026-10-28) T16 cerrada y T17 resguardada sin integrar. Pedido del usuario, textual:
  > cuando termines esos workflows, hace la conclusion y cerra sesion deja todo para la proxima
  - Chequeo diferencial (workflow `wf_0bfe533d-a45`): la build de `081e4d3` escribió datos con su propia UI y la build de HEAD los leyó en el mismo origen. Los datos: perfil en lb con nombre y avatar, el ejercicio propio "Remo, polea baja", una sesión terminada y una en curso.
    - Las 8 tablas quedaron idénticas byte a byte después de solo leer.
    - 34 de 37 chequeos OK. Las 3 fallas son de unidad: el volumen del Diario y el de Resumen salen en kg (los corrige A2), y los campos de carga en kg, que ya eran así en `081e4d3`.
    - El CSV trajo 11 de 11 filas, con BOM. Cambiar la unidad a kg conservó nombre y avatar.
    - El revisor dio "con reparos" por cobertura: faltan placas, tiempo, distancia, lastre y una actualización real con el service worker; el set de datos es chico.
  - T17 (workflow `wf_4b271193-2d2`): 3 writers y 3 revisores, sin errores. Los worktrees nacieron en `081e4d3` y no en la rama; cada writer hizo fast-forward a `2245fd9` antes de trabajar. Unidad A reportó `npx jest` 1607/1607, tsc y eslint OK. Ninguna unidad corrió e2e ni capturas.
  - Correcciones pendientes de la revisión (importantes):
    - A2: en Resumen, el volumen en lb (y en kg con decimales desde 5 cifras) no entra en la celda Volumen de Totales; desde 10000 lb invade la celda Series.
    - B2: los rangos de tiempo y distancia ("3 × 30–60 s") no entran en la columna Objetivo, de 72 px, y la unidad baja a una segunda línea. Ningún test ni la seed visual lo cubren.
    - C2: "Mejor serie" sale de las series, pero "1RM est." sigue saliendo de la fila de PR; con varios PR al mismo peso, los dos tiles se contradicen.
    - C5: la cabecera fija "Series ({unit} × reps)" sigue apareciendo en ejercicios de tiempo, distancia o peso corporal (segunda parte de F6).
    - Faltan los e2e (J9.1, J11 y los de entrenamiento) y regenerar y revisar las capturas de hoy, resumen, rutinas, editor-dia, progreso e historial.
  - Correcciones pendientes de la revisión (menores):
    - A2: el test de Resumen en lb fija la unidad antes de crear el componente y no prueba la reactividad.
    - A4: una descripción hecha solo de espacios deja un hueco de unos 14 px en "Hoy toca".
    - B4: el respaldo numérico pega el número a siglas que ya terminan en dígito ("Día 10" sale "D12").
    - C2: en peso corporal, "Mejor serie" ordena primero por lastre y el dominio ordena primero por reps.
    - C4: con `role=group` el lector de pantalla lee las marcas del eje y las etiquetas sueltas; el espaciado entre barras queda por debajo de 24 px (23.7 a 390 px).
    - C4 y D4: la línea "Semana del …" muestra un volumen que suma placas como kg.
    - C6: ningún test separa "récord más reciente" de "fecha de la mejor marca".
    - C1: el comentario de cabecera de `LineChartComponent` describe el ciclo de vida anterior.
  - Scratch: se quitaron los worktrees `wt-base` y `wt-head`.
  - Próximo paso: integrar las tres ramas WIP en `feat/rediseno-cuaderno` (cherry-pick o merge, son superficies disjuntas), aplicar las correcciones importantes con su test, correr `npm test`, `npm run e2e` y `npm run e2e:visual:update`, revisar las capturas y commitear T17. Después, preguntar D4, y seguir con T13, T14 y T15.
- L24 (2026-10-28) T17 integrada y cerrada. Pedido del usuario, textual:
  > continuamos con el proyecto
  - Integración: `git cherry-pick -n` de `bd87b54`, `c327d46` y `86f2293` sobre `07791ce`, sin conflictos. Jest de las tres superficies 632/632.
  - Correcciones importantes de la revisión (L23), test primero:
    - A2: J8.2 nuevo, con 44092.4 lb y una sesión de 1:05:23. RED: la celda Volumen se desbordaba ("Volumen44092.4lb"). Causa: `grid-cols-4` es `repeat(4, minmax(0, 1fr))` y la columna no crece. GREEN con `grid-cols-[repeat(4,1fr)]`: las columnas siguen iguales cuando todo entra.
    - B2: J4.5 nuevo, con "3 × 120–180 s" y "2 × 5–10 km". RED: la etiqueta ocupaba 2 líneas.
      - Arreglo: cabecera y filas comparten un grid con `subgrid`, y Objetivo es `minmax(72px, max-content)`, alineada con su cabecera.
      - La captura mostró que el número de fila pisaba el nombre: el padding de un subgrid se descuenta de las columnas de los bordes. J4.5 suma esa medida (RED: 2 px de separación). GREEN con columnas de 36 px y 50 px. `editor-dia-*` quedó idéntica a la captura anterior.
    - C2: "1RM est." sale de la misma serie que "Mejor serie". RED: 2 tests, porque la fila de PR daba 116.7 kg y la serie da 106.7 kg. La página ya no lee la tabla de PR.
    - C5: la cabecera dice "Series" en tiempo, distancia y peso corporal, y "Series ({unidad} × reps)" solo en peso y reps. RED: 3 tests.
  - Checks: `npm test` 1659/1659, `npm run e2e` 30/30, `npm run e2e:visual:update` 18/18. Cambiaron `hoy-*`, `resumen-*` e `historial-ejercicio-*`. `rutinas-*` y `progreso-*` no cambiaron, porque C4 y C6 quedan debajo del pliegue de la captura.
  - `npm run lint` da 6 errores previos, fuera de lo tocado: `pwa-update.service(.spec).ts`, `weight-unit.ts`, `seed-exercises.use-case.spec.ts`, `progression-target-calculator.ts` y `cancel-session.use-case.spec.ts`. HEAD sin los cambios da los mismos 6. T15 pide lint verde.
  - Las correcciones menores de L23 siguen sin aplicar.
  - Las ramas `worktree-wf_4b271193-2d2-{1,2,3}` y sus worktrees siguen; su contenido ya está integrado.
  - Próximo paso: preguntar D4. Después, seguir con T13, T14 y T15.
- L25 (2026-10-28) D4 resuelta. Respuesta del usuario, textual:
  > yo suelo usar los pesos en kg, y cuando pongo a un ejercicio para medirlo en placas, es eso lo que pongo en el numeor, X placas que le pongo a la maquina
  - Coincide con el dominio: `weight-unit.ts:4` ("abstract machine stack plates (integer, step 1, no kg conversion)") y la progresión de +1 placa.
  - Pantallas que ignoran `weightUnit` y muestran placas como kg (y las convierten con lb): Hoy ("Última vez" y volumen del Diario); Resumen (series, Mejor, vs. ant., PR, volumen) y la celebración de PR; Progreso (récords, 1RM, volumen semanal y del tablero, lista de progreso); historial del ejercicio (tiles, gráfico, lista, volumen); lista de PR; editor del día ("Peso … kg").
  - Próximo paso: preguntar cómo cuentan las series en placas en los volúmenes en kg. Después, planificar la tarea de placas.
- L26 (2026-10-28) Peso por placa para el volumen. Propuesta del usuario, textual:
  > y si ponemos que cada placa pesa 5kgs?? para darle un valor a ese volumen, igualmente ese valor se tendria que pode cambiar, ya sea al cambiar en el edit del ejercicio, por ejemplo lo cambio a placas y m da un lugar donde escribir el peso de cada placa, seria opcional, sino se ingresa nada es 5kg
  - Le avisé que choca con S10 ("No cambian el esquema Dexie ni el formato de las filas") y con "Fuera de alcance". Respuesta, textual:
    > autorizo
  - Mismo camino que `weightUnit` (`database.ts:80`): campo opcional sin índice, sin subir la versión. La build vieja lo ignora y la nueva lee 5 kg por defecto.
  - El volumen se calcula al mostrarlo: si cambia el peso por placa, cambia el volumen de las sesiones pasadas de ese ejercicio. El usuario ya lo sabía antes de autorizar.
  - Hoy hay tres reglas de volumen: `computeVolume` del dominio de Progreso suma el lastre del peso corporal, y Resumen, el Diario y el historial no lo suman. T18 no cambia eso; solo agrega placas.
  - Se agregaron S11 y T18. Próximo paso: T18a inline y después T18b y T18c en paralelo.
- L27 (2026-10-28) T18 cerrada.
  - T18b (`3fbe130`) y T18c (`aecda84`): dos writers Sonnet en paralelo, en el mismo árbol, con superficies disjuntas. El parent revisó que cada diff quedara dentro de su superficie.
  - Decisiones de los writers, aceptadas por el parent:
    - El CSV escribe una serie en placas con `peso` = el número cargado y `unidad` = `placas`. Antes salía convertida a lb ("15.4,lb"). Es coherente con D2, donde `unidad` dice cuál es.
    - El aviso de PR durante la sesión también da el delta en placas (`training-session.page.ts`).
    - La lista de progreso no cambió: muestra el 1RM en kg (`loadKg`) en la unidad preferida.
  - J15 se escribió antes de T18b y T18c, pero corrió por primera vez después de integrar, así que no se vio en RED. El RED de cada regla está en Jest.
  - Entorno: un `ng serve` de otro proyecto (`ferreteria/frontend`) ocupaba el puerto 4200. `reuseExistingServer` hizo correr los 31 e2e contra esa app, y fallaron todos con "One of the specified object stores was not found". Se corrieron en el puerto 4300 con una config temporal, que después se borró. No se cortó el otro servidor.
  - Advisories:
    - Hay dos funciones que formatean placas: `training/ui/format-plates.ts` y una privada en `progress/ui/helpers/format-tracking-value.ts`.
    - La progresión todavía dice "placa 6 × 12" (`progression-target-calculator.ts`).
    - La seed visual no tiene ejercicios en placas.
  - Pendiente: confirmar el supuesto del 1RM de S11. Siguen sin aplicar las correcciones menores de L23.
  - Próximo paso: confirmar el supuesto del 1RM y seguir con T13 (preguntar D1).
- L28 (2026-10-28) Supuesto del 1RM de S11 confirmado. Respuesta del usuario, textual:
  > dale lo dejamos asi, pero el peso de la placa de cada ejercicio se debe poder cambiar, no es el ismo peso que tiene la placa de espalda que la de brazo
  - Ya funciona así desde T18a: `plateWeightKg` es un campo de cada ejercicio (`exercise.entity.ts:41`). Se carga y se guarda en el formulario de ese ejercicio (`exercise-form.page.ts:256`, `:274`), y J15 lo verifica. No hizo falta cambiar código.
  - Próximo paso: T13, preguntar D1.
- L29 (2026-10-28) D1 aprobada y pedido de no borrar rutinas. Respuesta del usuario, textual:
  > esta bien, la idea tambien es que las rutinas que ya tengo cargadas no se borren, verifica eso tambien
  - Verificado en el código: `CreateRoutineUseCase` solo guarda la rutina nueva, y la deja activa solo si no hay otra activa. Ningún caso de uso de creación borra nada. Con S8, Primer uso aparece solo si no hay ninguna rutina.
  - S3 suma la aceptación de no borrar ni modificar lo existente, con su test.
  - T13 pasa a un writer: el parent está cerca del respaldo de contexto de ~150k.
- L30 (2026-10-28) T13 cerrada.
  - Writer Sonnet. El diff quedó dentro de su superficie. El parent ajustó J6a.1 (`routines.spec.ts`) a S8: siembra una rutina inactiva y espera "Sin rutina activa".
  - Decisiones del writer, aceptadas por el parent:
    - `ApplyRoutineTemplateUseCase` corre `SeedExercisesUseCase` primero, porque la biblioteca se siembra recién al abrir la lista o el picker, y sin eso una instalación nueva no encuentra los ejercicios. No hace nada si la biblioteca ya tiene ejercicios.
    - Los días de Full body se llaman "A", "B" y "C", como en D1.
    - Mientras Hoy carga no muestra ningún estado vacío, así que desaparece el destello de "Sin rutina activa" para quien tiene rutinas.
  - S8 queda implementado tal como está escrito: Primer uso aparece solo si no hay ninguna rutina.
  - Próximo paso: confirmar S8 con el usuario y seguir con T14.
