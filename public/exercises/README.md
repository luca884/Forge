# Ilustraciones de ejercicios (F-8)

Cada ejercicio del catálogo built-in muestra una ilustración estilo logo desde
esta carpeta. La app las referencia por convención de nombre (slug del nombre):

- `exercises/<slug>.webp`
- `slug` = nombre en minúsculas, sin acentos, no-alfanuméricos → `-`.
  Ej: `Curl de bíceps` → `curl-de-biceps.webp`, `Press militar` → `press-militar.webp`.

Si no existe el archivo, la card cae a un icono (pesa) automáticamente — la app
no se rompe. Los ejercicios custom no tienen imagen (usan el fallback).

Formato sugerido: **WebP**, cuadrado (ej. 256×256), fondo transparente u oscuro
coherente con el tema (`#0c0a09`).

El helper que arma el path es `src/app/features/exercises/ui/helpers/exercise-image.ts`.

## Pendiente
Faltan los 42 archivos `.webp` (uno por ejercicio del seed). Ver el catálogo en
`src/app/features/exercises/domain/use-cases/seed-exercises.use-case.ts`.
