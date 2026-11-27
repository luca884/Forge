import { join } from 'node:path';
import type { Page } from '@playwright/test';
import { test as cleanDbTest, expect } from '../fixtures/db-reset';

const TILE_ORIGIN = 'https://tile.openstreetmap.org';
const TILE_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aB9sAAAAASUVORK5CYII=',
  'base64',
);
const EMPTY_STATE = 'Todavía no importaste ningún recorrido';
const DETAIL_URL = /\/activities\/[^/?#]+$/;

// Set up routing before the DB reset fixture's first navigation, not just before the test body.
const test = cleanDbTest.extend({
  page: async ({ page, baseURL }, use) => {
    const appOrigin = new URL(baseURL!).origin;
    const otherExternalRequests: string[] = [];
    const isExternalHttp = (url: URL): boolean =>
      (url.protocol === 'http:' || url.protocol === 'https:') && url.origin !== appOrigin;

    page.on('request', (request) => {
      const url = new URL(request.url());
      if (isExternalHttp(url) && url.origin !== TILE_ORIGIN) otherExternalRequests.push(url.href);
    });
    await page.route(isExternalHttp, (route) => route.abort());
    // Playwright tries the most recently registered matching route first.
    await page.route(`${TILE_ORIGIN}/**`, (route) =>
      route.fulfill({ contentType: 'image/png', body: TILE_PNG }),
    );

    await use(page);
    expect(otherExternalRequests, 'peticiones externas distintas de las teselas de OSM').toEqual([]);
  },
});

test.use({ serviceWorkers: 'block' });

function nav(page: Page) {
  return page.locator('fg-bottom-nav').getByRole('navigation', { name: 'Principal' });
}

function activityLinks(page: Page) {
  return page.locator('fg-activity-list-page').getByRole('list').getByRole('link');
}

function loadGpx(page: Page, fileName: string): Promise<void> {
  return page.locator('fg-activity-list-page input[type="file"][hidden]').setInputFiles(
    join(__dirname, '../fixtures/activities', fileName),
  );
}

async function expectDetail(page: Page, name: string, type: string): Promise<void> {
  await expect(page).toHaveURL(DETAIL_URL);
  await expect(page.getByRole('heading', { name, level: 1, exact: true })).toBeVisible();
  await expect(page.locator('fg-page-header').getByText(new RegExp(`^${type} · `))).toBeVisible();
}

async function importCostanera(page: Page): Promise<void> {
  await page.goto('/activities');
  await loadGpx(page, 'costanera.gpx');
  await expectDetail(page, 'Costanera', 'Bici');
}

async function deleteFromDetail(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Borrar recorrido', exact: true }).click();
  const confirm = page.getByRole('group', { name: '¿Borrar este recorrido? No se puede deshacer.' });
  await expect(confirm).toBeVisible();
  await confirm.getByRole('button', { name: 'Borrar', exact: true }).click();
  await expect(page).toHaveURL(/\/activities$/);
  await expect(page.getByText(EMPTY_STATE, { exact: true })).toBeVisible();
  await expect(activityLinks(page)).toHaveCount(0);
}

test.describe('J24 — Recorridos', () => {
  test('J24.1 — Recorridos abre Actividades y muestra el estado vacío', async ({ page }) => {
    await page.goto('/');
    const tab = nav(page).getByRole('link', { name: 'Recorridos', exact: true });
    await expect(tab).toBeVisible();
    await tab.click();
    await expect(page).toHaveURL(/\/activities$/);
    await expect(tab).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('heading', { name: 'Actividades', level: 1, exact: true })).toBeVisible();
    await expect(page.getByText(EMPTY_STATE, { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Importar GPX', exact: true })).toBeVisible();
  });

  test('J24.2 — importar el GPX de Costanera toma el tipo Bici y muestra sus estadísticas', async ({ page }) => {
    await importCostanera(page);

    // A mano: 3 × ~111,19 m = ~333,57 m → 334 m; 3 × 60 s = 180 s en total y en movimiento.
    // ~0,33357 km / (180/3600 h) = ~6,67 km/h; el único ascenso es de 0 a 10 m.
    const stats = {
      Distancia: '334 m',
      'Tiempo total': '3 min',
      'Tiempo en movimiento': '3 min',
      'Velocidad media': '6,7 km/h',
      'Desnivel positivo': '+10 m',
    };
    for (const [label, value] of Object.entries(stats)) {
      const stat = page.locator('dl > div').filter({ has: page.getByText(label, { exact: true }) });
      await expect(stat.getByText(label, { exact: true })).toBeVisible();
      await expect(stat.locator('dd')).toHaveText(value);
    }
  });

  test('J24.3 — el mapa dibuja el recorrido con estilos y atribución de OpenStreetMap', async ({ page }) => {
    await importCostanera(page);

    const map = page.locator('fg-route-map');
    const surface = map.getByRole('img', { name: 'Mapa del recorrido' }).and(page.locator('.leaflet-container'));
    const stylesheet = page.locator('link[rel="stylesheet"][href="leaflet.css"]');
    await expect(surface).toBeVisible();
    expect((await surface.boundingBox())?.height).toBeGreaterThan(0);
    // A horizontal route can have a zero-height path bounding box; check its SVG and drawing commands.
    const overlay = surface.locator('.leaflet-overlay-pane svg');
    await expect(overlay).toBeVisible();
    await expect(overlay.locator('path').first()).toHaveAttribute('d', /^M.+L/);
    await expect(stylesheet).toHaveCount(1);
    await expect(surface.locator('.leaflet-map-pane.leaflet-pane')).toHaveCSS('position', 'absolute');
    await expect(map.getByText('© OpenStreetMap contributors', { exact: true })).toBeVisible();
    await expect.poll(() => surface.locator('.leaflet-tile-pane img').evaluateAll((tiles) =>
      tiles.some((tile) => tile instanceof HTMLImageElement && tile.complete && tile.naturalWidth === 1),
    )).toBe(true);

    await page.getByRole('link', { name: 'Volver a Actividades', exact: true }).click();
    await activityLinks(page).getByText('Costanera', { exact: true }).click();
    await expect(surface).toBeVisible();
    await expect(stylesheet).toHaveCount(1);
  });

  test('J24.4 — un GPX sin nombre ni tipo usa el nombre del archivo y la lista conserva su orden al recargar', async ({ page }) => {
    await importCostanera(page);
    await page.getByRole('link', { name: 'Volver a Actividades', exact: true }).click();
    // Imported second, but recorded a day before Costanera.
    await loadGpx(page, 'Vuelta al parque.gpx');
    const chooser = page.getByRole('group', { name: '¿Qué tipo de actividad es?' });
    await expect(chooser).toBeVisible();
    await expect(chooser.getByRole('button')).toHaveText(['Caminata', 'Bici', 'Correr', 'Cancelar']);
    await chooser.getByRole('button', { name: 'Correr', exact: true }).click();
    await expectDetail(page, 'Vuelta al parque', 'Correr');

    await page.getByRole('link', { name: 'Volver a Actividades', exact: true }).click();
    await expect(page).toHaveURL(/\/activities$/);
    await page.reload();
    const links = activityLinks(page);
    await expect(links).toHaveCount(2);
    await expect(links.nth(0)).toHaveAccessibleName(/^Costanera Bici · /);
    await expect(links.nth(1)).toHaveAccessibleName(/^Vuelta al parque Correr · /);
  });

  test('J24.5 — rechazar un archivo que no es GPX deja la lista intacta', async ({ page }) => {
    await importCostanera(page);
    const costaneraPath = new URL(page.url()).pathname;
    await page.getByRole('link', { name: 'Volver a Actividades', exact: true }).click();
    const links = activityLinks(page);
    await expect(links).toHaveCount(1);
    const originalList = await links.allTextContents();

    await loadGpx(page, 'invalido.gpx');
    await expect(page.getByRole('alert')).toHaveText('GPX no válido: el XML no está bien formado');
    await expect(page).toHaveURL(/\/activities$/);
    await expect(links).toHaveText(originalList);
    await expect(links).toHaveAttribute('href', costaneraPath);
    await page.reload();
    await expect(links).toHaveText(originalList);
    await expect(links).toHaveAttribute('href', costaneraPath);
  });

  test('J24.6 — borrar un recorrido lo quita de la lista y su enlace viejo deja de abrirlo', async ({ page }) => {
    await importCostanera(page);
    const oldUrl = page.url();
    await deleteFromDetail(page);
    await page.goto(oldUrl);
    await expect(page.getByText('No encontramos este recorrido', { exact: true })).toBeVisible();
  });

  test('J24.7 — exportar y restaurar el respaldo desde Perfil recupera el recorrido borrado', async ({ page }) => {
    await importCostanera(page);
    await nav(page).getByRole('link', { name: 'Perfil', exact: true }).click();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Exportar respaldo (JSON)' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^forge-respaldo-\d{4}-\d{2}-\d{2}\.json$/);

    await nav(page).getByRole('link', { name: 'Recorridos', exact: true }).click();
    await activityLinks(page).getByText('Costanera', { exact: true }).click();
    await deleteFromDetail(page);

    await nav(page).getByRole('link', { name: 'Perfil', exact: true }).click();
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: 'Restaurar respaldo' }).click(),
    ]);
    await chooser.setFiles(await download.path());
    await expect(page.getByText(/¿Reemplazar todos tus datos por los del respaldo del .+ de \d{4}\?/)).toBeVisible();
    await Promise.all([
      page.waitForEvent('load'),
      page.getByRole('button', { name: 'Restaurar', exact: true }).click(),
    ]);

    await nav(page).getByRole('link', { name: 'Recorridos', exact: true }).click();
    await expect(activityLinks(page)).toHaveCount(1);
    await activityLinks(page).getByText('Costanera', { exact: true }).click();
    await expectDetail(page, 'Costanera', 'Bici');
    await expect(page.getByRole('img', { name: 'Mapa del recorrido' })).toBeVisible();
  });

  for (const [number, width] of [[8, 320], [9, 360]] as const) {
    test(`J24.${number} — las seis pestañas caben y se pueden tocar en ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 640 });
      await page.goto('/activities');
      const bar = nav(page);
      await expect(bar).toBeVisible();
      await expect(bar.getByRole('link')).toHaveCount(6);
      await expect(bar.locator('.bottom-nav__label')).toHaveCount(6);
      await page.evaluate(() => document.fonts.ready);

      const { columns, tabs } = await bar.evaluate((element) => {
        const tracks = getComputedStyle(element).gridTemplateColumns.split(/\s+/).map(parseFloat);
        const tabs = Array.from(element.querySelectorAll('.bottom-nav__tab'), (tab, index) => {
          const label = tab.querySelector('.bottom-nav__label')!;
          const rect = tab.getBoundingClientRect();
          return {
            label: label.textContent!.trim(),
            scrollWidth: label.scrollWidth,
            clientWidth: label.clientWidth,
            width: rect.width,
            height: rect.height,
            cellWidth: tracks[index],
          };
        });
        return { columns: tracks.length, tabs };
      });
      expect(columns).toBe(6);
      expect(tabs).toHaveLength(6);
      for (const tab of tabs) {
        const measurement = `${width} px: ${JSON.stringify(tab)}`;
        expect.soft(tab.scrollWidth, measurement).toBeLessThanOrEqual(tab.clientWidth);
        // Compare at the precision exposed by the computed grid track widths (CSS pixels).
        expect.soft(Number(tab.width.toFixed(3)), measurement).toBeLessThanOrEqual(Number(tab.cellWidth.toFixed(3)));
        expect.soft(tab.width, measurement).toBeGreaterThanOrEqual(44);
        expect.soft(tab.height, measurement).toBeGreaterThanOrEqual(48);
      }
    });
  }
});
