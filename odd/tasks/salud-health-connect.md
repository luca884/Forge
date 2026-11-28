# Salud: pantalla Cuerpo/Salud con datos de Health Connect
Rama `feat/salud-health-connect`, desde `main` (d33bbbd). Segunda área nueva del hub personal de Forge, después de Recorridos. Parte del spike `spike/health-connect` (5340d1c, descartable: no se mergea, solo se reutilizan dependencias, permiso y forma de las llamadas). Ruteo de modelo: caso 5, Opus de punta a punta, todo inline salvo que un disparador lo cambie.

## Specs
- S1: "Pantalla Cuerpo/Salud" — pasos, FC y SpO2 por día con tendencia en el tiempo.
- S2: "Una sola base, dos destinos" — la PWA sigue igual en Cloudflare Pages; la APK con Capacitor suma Health Connect; en web la pantalla Salud muestra solo los datos ya importados, sin lectura nueva.

## Tasks
- [x] T1 (S1) Dominio y datos: entidades de métricas diarias (pasos, distancia, calorías) y de frecuencia cardíaca y SpO2, tablas Dexie nuevas (versión 5, solo aditiva), repositorio, casos de uso (guardar lote, listar por rango, tendencia) y backup (`BACKUP_TABLES`, `DATE_FIELDS`, `BACKUP_VERSION`; sigue restaurando respaldos viejos). Ruta: inline. Risk: item 1 (formato persistido: backup v3 y Dexie v5, solo aditivos; respaldos v1 y v2 siguen restaurando). Verificado: jest 2041/2041, `ng lint` ok. Commit: ver L7
- [ ] T2 (S1, S2) Puerto `HealthSource` + adaptador Capacitor con `import()` diferido detrás de una comprobación de plataforma; filtro por origen GloryFit para pasos, distancia y calorías (ver D1); caso de uso de sincronización idempotente. Agrega dependencias `@capacitor/core` y `@capgo/capacitor-health`: Risk item 5. Ruta: inline. Commit: —
- [ ] T3 (S2) Base nativa: `capacitor.config.ts`, proyecto `android/` (minSdk 26, JDK 21), permisos de lectura y de historial en el manifiesto, `public/privacypolicy.html`, scripts y nota de cómo compilar e instalar la APK. Risk item 5. Ruta: inline. Commit: —
- [ ] T4 (S1, S2) UI: ruta `health`, pantalla con tarjetas del día, botón de sincronizar (solo en nativo) y estado vacío en web. Entrada desde Perfil (ver D2). Ruta: inline. Commit: —
- [ ] T5 (S1) Tendencia en el tiempo: serie por día de pasos, FC y SpO2 (rango 7/30 días) con gráfico propio en SVG, sin librería nueva. Ruta: inline. Commit: —
- [ ] T6 Cierre: e2e (web, con datos sembrados), capturas visuales, lint, tsc, jest, build, prueba en el teléfono con la APK. Ruta: inline. Commit: —

## Log
- L1 (Luca, original): "continuamos con el proyecto forge"
- L2 (Luca): "spike de health connect"
- L3 (Luca): "dale"
- L4 (Luca, elección): "Pantalla Cuerpo/Salud"
- L5 (Luca): "dale"
- L6 (Luca, elección): "Una sola base, dos destinos"
- D1 (decisión, recomendación aceptada con L5): fuente única GloryFit para pasos, distancia y calorías, porque llegan de tres orígenes (Samsung Health, GloryFit, sensor del teléfono) y sumarlos triplica los totales. FC y SpO2 solo vienen del reloj. GloryFit sincroniza con Health Connect solo cuando la app sincroniza con el reloj.
- D2 (decisión, mía, por defecto): la barra inferior ya tiene 6 pestañas y no entra una séptima (D6 de actividades-gpx), así que Salud se abre desde Perfil. Se revisa si Luca prefiere otro lugar.
- D3 (hallazgo del spike): GloryFit no escribe sueño, FC en reposo, HRV, frecuencia respiratoria, peso ni sesiones de ejercicio en Health Connect; quedan fuera de esta feature.
- D4 (hallazgo de la exploración): `main` no tiene Capacitor ni detección de plataforma; un `import` estático del plugin lo metería en el bundle inicial de la web (hoy ~397,8 kB, aviso a 400 kB). Por eso T2 usa `import()` diferido. Los tests Jest y Playwright corren solo en navegador: el adaptador nativo se prueba con un falso detrás del puerto.
- D5 (riesgo heredado, actividades-gpx L15): las teselas de OSM podrían rechazarse en el WebView de Capacitor; se prueba en T6 con la APK.
- D7 (decisión, mía): se guarda un resumen por día (`healthDaily`, clave = día local AAAA-MM-DD) y no las muestras sueltas de FC y SpO2; mantiene la base y el respaldo chicos y la sincronización idempotente (el día se recalcula entero y se reemplaza).
- L7 (T1): backup pasa a v3 con `TABLE_ADDED_IN` (una tabla ausente en un archivo más viejo entra vacía); el hash del commit se registra en el siguiente slice.
- D6 (proceso): el spike se materializó solo lectura en `/tmp/forge-spike` (worktree desprendido en 5340d1c); se elimina al cerrar.
