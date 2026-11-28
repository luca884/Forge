import { readFile } from 'node:fs/promises';
import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/db-reset';
import { seedHealthDays, type SeedHealthDay } from '../fixtures/seed';

/** Local day ids (YYYY-MM-DD) in the browser's time zone, today first, `count` days back. */
function recentDayIds(page: Page, count: number): Promise<string[]> {
  return page.evaluate((n) => {
    const pad = (v: number): string => String(v).padStart(2, '0');
    const now = new Date();
    return Array.from({ length: n }, (_, back) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - back);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    });
  }, count);
}

const day = (id: string, steps: number | null): SeedHealthDay => ({
  id,
  steps,
  distanceMeters: steps === null ? null : steps * 0.75,
  caloriesKcal: steps === null ? null : 2000,
  heartRate: steps === null ? null : { avg: 72, min: 51, max: 130, samples: 96 },
  oxygenSaturation: steps === null ? null : { avg: 97, min: 94, max: 99, samples: 12 },
  syncedAt: 1,
});

async function openHealthFromProfile(page: Page): Promise<void> {
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Salud', exact: true }).click();
  await expect(page).toHaveURL(/\/health$/);
  await expect(page.getByRole('heading', { name: 'Salud', level: 1, exact: true })).toBeVisible();
}

test.describe('J25 — Salud', () => {
  test('J25.1 — sin datos guardados, muestra guiones y explica que leer solo funciona en Android', async ({ page }) => {
    await openHealthFromProfile(page);
    await expect(page.getByText('Todavía no hay datos de hoy.')).toBeVisible();
    await expect(page.getByText('Sin datos en este período')).toHaveCount(3);
    await expect(page.getByText(/solo funciona en la app de Android con Health Connect/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Sincronizar/ })).toHaveCount(0);
  });

  test('J25.2 — con datos guardados, muestra hoy y la tendencia de 7 y de 30 días', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const [today, yesterday, tenDaysAgo] = await recentDayIds(page, 11).then((ids) => [ids[0]!, ids[1]!, ids[10]!]);
    await seedHealthDays(page, [day(today, 8123), day(yesterday, 4000), day(tenDaysAgo, 12000)]);

    await openHealthFromProfile(page);
    await expect(page.getByText('8.123', { exact: true })).toBeVisible();
    await expect(page.getByText('6,09 km', { exact: true })).toBeVisible();
    await expect(page.getByText('2.000 kcal', { exact: true })).toBeVisible();
    await expect(page.getByText('51–130 lpm', { exact: true })).toBeVisible();
    await expect(page.getByText('97 %', { exact: true }).first()).toBeVisible();

    // 7 days: today and yesterday only (the 10-days-ago row is outside).
    await expect(page.getByText('Promedio: 6.062 pasos por día')).toBeVisible();
    await expect(page.getByRole('img', { name: 'Pasos por día, últimos 7 días' })).toBeVisible();
    await expect(page.getByRole('button', { name: '7 días' })).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: '30 días' }).click();
    await expect(page.getByRole('button', { name: '30 días' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('Promedio: 8.041 pasos por día')).toBeVisible();
    await expect(page.getByRole('img', { name: 'Pasos por día, últimos 30 días' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Frecuencia cardíaca promedio por día, últimos 30 días' })).toBeVisible();
  });

  test('J25.3 — los datos de salud viajan en el respaldo (versión 3)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const [today] = await recentDayIds(page, 1);
    await seedHealthDays(page, [day(today!, 5000)]);

    await page.goto('/profile');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Exportar respaldo (JSON)' }).click(),
    ]);
    const raw = JSON.parse(await readFile((await download.path())!, 'utf-8'));
    expect(raw.version).toBe(3);
    expect(raw.data.healthDaily).toEqual([day(today!, 5000)]);
  });
});
