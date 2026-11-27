# Actividades: importar recorridos GPX y verlos en un mapa
Rama `feat/activities-gpx-import` (worktree `/Users/luca/Projects/Forge-activities`), desde `main`. Forge pasa a ser el lugar donde se junta la información personal de Luca; esta es la primera área nueva (recorridos). El spike de Health Connect vive aparte en `spike/health-connect` y no se toca.

## Specs
- S1: "que me muestre los recorridos que hago distancias tiempo etc caminatas bici" — "me gustaría tener la información del tiempo, el recorrido, los kilómetros que hice, el dibujo también en algún Google Maps o en algún mapa"
- S2: "la idea es que quede todo en local por el momento"
- S3: "vamos con la importacion"
- S4: "Una pestaña nueva en la barra inferior"

## Tasks
- [x] T1 (S1, S3) Parser GPX + entidad `Activity` y estadísticas (distancia, tiempo, velocidad, desnivel). Dominio puro, sin Angular. Ruta: worker. Commit: 0b48167 (53 tests verdes, eslint ok; Risk: none)
- [ ] T2 (S2, S3) Tablas Dexie `activities` + `activityTracks` (versión 4, ver D4), repositorio, casos de uso (importar, listar, obtener, borrar) y backup (`BACKUP_TABLES`, `DATE_FIELDS`, `BACKUP_VERSION`). Ruta: worker. Commit: —
- [ ] T3 (S1, S3) UI: importar archivo, lista de actividades y detalle con estadísticas (sin mapa). Ruta: worker. Commit: —
- [ ] T4 (S1) Mapa del recorrido con Leaflet + OpenStreetMap, en carga diferida (presupuesto inicial 400/450 kB). Ruta: worker. Commit: —
- [ ] T5 (S4) Sexta pestaña "Actividades" en la barra inferior (`repeat(5` → 6), icono, ruta, recorrido e2e. Ruta: inline. Commit: —
- [ ] T6 Cierre: ayuda/docs, lint, tsc, jest, build y e2e completos; Risk line. Ruta: inline. Commit: —

## Log
- L1 (Luca, original): "La app esa que recolecte toda mi información tambien tengo algún mapa y que me muestre los recorridos que hago distancias tiempo etc caminatas bici" … "Yo quiero empezar una rutina o quiero ir a salir a andar en bici. Si yo quiero ir a andar en bici, me gustaría tener la información del tiempo, el recorrido, los kilómetros que hice, el dibujo también en algún Google Maps o en algún mapa."
- L2 (Luca): "la idea es que quede todo en local por el momento. Obviamente sí, periódicamente estaría bueno subir, yo qué sé, datos o información en algún JSON a un repositorio y listo."
- L3 (Luca): "vamos con la importacion"
- L4 (Luca, nav): "Una pestaña nueva en la barra inferior"
- D1 (decisión, defaults míos): solo GPX por ahora (FIT queda para después); mapa Leaflet + teselas de OpenStreetMap (gratis, sin clave; es el único uso de red); tipo de actividad = `<type>` del GPX si existe, si no se elige al importar (caminata, bici, correr).
- D2 (hallazgo del spike Health Connect): GloryFit no envía entrenamientos ni rutas a Health Connect; por eso los recorridos entran por GPX exportado de otra app (Strava, OsmAnd, etc.).
- L5 (slice): el commit 0b48167 mide 569 líneas contando ~310 de tests; límite del slice 1 = fin de T1. Los slices siguientes se cortan por tarea (T2, T3, T4, T5+T6).
- L6 (hallazgo): `npx tsc --noEmit -p tsconfig.spec.json` ya falla en `main` por specs ajenos (appearance-boot-script, pwa-update); no es de esta funcionalidad.
- D4 (decisión, rendimiento): los puntos GPS viven en una tabla aparte `activityTracks` (clave = id de la actividad) y `activities` guarda solo metadatos y estadísticas; así la lista no carga miles de puntos por recorrido. Borrar y guardar tocan ambas tablas en una sola transacción. El backup incluye las dos tablas y debe seguir restaurando respaldos viejos (sin esas tablas).
- D3 (arquitectura, del mapa del explorer): Dexie se amplía con versión nueva aditiva `version(4).stores({ activities: ... })` en `src/app/core/db/database.ts`; el backup enumera tablas a mano en `src/app/core/shared/domain/backup/backup.ts`; la barra inferior es el arreglo `tabs` en `src/app/shell/navigation/bottom-nav.component.ts`; tests co-ubicados (`*.spec.ts`), Jest + fake-indexeddb; eslint con prefijo `fg`; tsconfig con `noUncheckedIndexedAccess`.
