// Leaflet publica un build ESM que su package.json no declara como "module"; se importa por ruta directa.
declare module 'leaflet/dist/leaflet-src.esm.js' {
  export * from 'leaflet';
}
