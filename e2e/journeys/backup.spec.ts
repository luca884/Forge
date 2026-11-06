import { readFile } from 'node:fs/promises';
import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/db-reset';
import { seedRoutines } from '../fixtures/seed';
import { FIXED_NOW, seedVisualData } from '../visual/visual-data';

/**
 * J22 — Respaldo: exportar todos los datos a JSON y restaurarlos reemplazando los actuales.
 * Spec: odd/tasks/respaldo.md (S1–S3).
 */

async function openProfile(page: Page): Promise<void> {
  await page.clock.setFixedTime(FIXED_NOW);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await seedVisualData(page);
  await page.goto('/profile');
  await page.waitForLoadState('networkidle');
}

/** Rows of a table, read straight from IndexedDB, with each date field's type. */
function sessionDateTypes(page: Page): Promise<string[]> {
  return page.evaluate(
    () =>
      new Promise<string[]>((resolve, reject) => {
        const open = indexedDB.open('forge');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const request = open.result.transaction('sessions').objectStore('sessions').getAll();
          request.onsuccess = () => {
            resolve((request.result as { startedAt: unknown }[]).map((row) => Object.prototype.toString.call(row.startedAt)));
            open.result.close();
          };
        };
      }),
  );
}

test.describe('J22 — Respaldo', () => {
  test('J22.1 — exportar, cambiar los datos y restaurar deja exactamente lo del respaldo', async ({ page }) => {
    await openProfile(page);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Exportar respaldo (JSON)' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^forge-respaldo-\d{4}-\d{2}-\d{2}\.json$/);
    const path = await download.path();
    const raw = JSON.parse(await readFile(path, 'utf-8'));
    expect(raw.format).toBe('forge-backup');
    expect(raw.data.routines.map((r: { name: string }) => r.name)).toContain('Torso / Pierna');
    expect(raw.data.sessions.length).toBeGreaterThan(0);

    // After the backup: the history is wiped and a new routine appears.
    await page.getByRole('button', { name: 'Borrar historial' }).click();
    await page.getByRole('button', { name: 'Borrar', exact: true }).click();
    await seedRoutines(page, [{ id: 'rt-nueva', name: 'Rutina nueva', isActive: true, schedule: null, createdAt: new Date(), updatedAt: new Date() }]);

    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: 'Restaurar respaldo' }).click(),
    ]);
    await chooser.setFiles(path);
    await expect(page.getByText(/¿Reemplazar todos tus datos por los del respaldo del .+ de \d{4}\?/)).toBeVisible();

    await Promise.all([page.waitForEvent('load'), page.getByRole('button', { name: 'Restaurar', exact: true }).click()]);

    await page.goto('/routines');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Torso / Pierna')).toBeVisible();
    await expect(page.getByText('Rutina nueva')).toHaveCount(0);
    // Dates come back as dates, not as the strings they were in the file.
    const types = await sessionDateTypes(page);
    expect(types.length).toBe(raw.data.sessions.length);
    expect(new Set(types)).toEqual(new Set(['[object Date]']));
  });

  test('J22.2 — un archivo que no es un respaldo se rechaza y no toca los datos', async ({ page }) => {
    await openProfile(page);

    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: 'Restaurar respaldo' }).click(),
    ]);
    await chooser.setFiles({ name: 'notas.json', mimeType: 'application/json', buffer: Buffer.from('{"hola":1}') });

    await expect(page.getByText('El archivo no es un respaldo de Forge válido.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Restaurar', exact: true })).toHaveCount(0);

    await page.goto('/routines');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Torso / Pierna')).toBeVisible();
  });
});
