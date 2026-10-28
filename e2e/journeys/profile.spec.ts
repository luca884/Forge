import { readFileSync } from 'node:fs';
import { test, expect } from '../fixtures/db-reset';
import {
  daysAgo,
  seedExercises,
  seedProfile,
  seedRoutines,
  seedSessions,
  seedTrainingDays,
  seedWorkedSets,
  type SeedProfile,
} from '../fixtures/seed';

/** YYYY-MM-DD in local time, like Session.date. */
function localDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function after(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}

// ─── J13 — Perfil ─────────────────────────────────────────────────────────────

test.describe('J13 — Perfil', () => {
  test('J13.1 — la unidad de peso se guarda al instante y persiste tras recarga', async ({ page }) => {
    // Boot Angular + Dexie (navigate-first contract)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const now = new Date();

    const profile: SeedProfile = {
      id: 'me',
      name: 'Luca',
      preferredUnit: 'kg',
      createdAt: now,
      updatedAt: now,
    };

    await seedProfile(page, profile);

    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Perfil', level: 1 })).toBeVisible();

    const units = page.getByRole('radiogroup', { name: 'Unidad de peso' });
    await expect(units.getByRole('radio', { name: 'kg' })).toHaveAttribute('aria-checked', 'true');

    await units.getByRole('radio', { name: 'lb' }).click();
    await expect(units.getByRole('radio', { name: 'lb' })).toHaveAttribute('aria-checked', 'true');
    await page.waitForTimeout(500); // wait for async IDB save to complete

    // No toast exists — reload to verify persistence (reload-persists pattern, ADR-E3-4)
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(units.getByRole('radio', { name: 'lb' })).toHaveAttribute('aria-checked', 'true');
    await expect(units.getByRole('radio', { name: 'kg' })).toHaveAttribute('aria-checked', 'false');
  });

  test('J13.2 — el tema cambia al instante, acompaña theme-color y persiste tras recarga', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    const html = page.locator('html');
    const themeColor = page.locator('meta[name="theme-color"]');
    const themes = page.getByRole('radiogroup', { name: 'Tema' });

    await expect(themes.getByRole('radio', { name: 'Sistema' })).toHaveAttribute('aria-checked', 'true');
    await expect(html).toHaveAttribute('data-theme', 'light');

    await themes.getByRole('radio', { name: 'Oscuro' }).click();
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await expect(themeColor).toHaveAttribute('content', '#0F0F11');

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(html).toHaveAttribute('data-theme', 'dark');
    await expect(themes.getByRole('radio', { name: 'Oscuro' })).toHaveAttribute('aria-checked', 'true');
  });

  test('J13.3 — el color de acento cambia al instante y persiste tras recarga', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    const html = page.locator('html');
    const accents = page.getByRole('radiogroup', { name: 'Color de acento' });

    await expect(accents.getByRole('radio', { name: 'Cobalto' })).toHaveAttribute('aria-checked', 'true');

    await accents.getByRole('radio', { name: 'Verde' }).click();
    await expect(html).toHaveAttribute('data-accent', 'green');
    await expect(accents.getByRole('radio', { name: 'Verde' })).toHaveAttribute('aria-checked', 'true');

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(html).toHaveAttribute('data-accent', 'green');
    await expect(accents.getByRole('radio', { name: 'Verde' })).toHaveAttribute('aria-checked', 'true');
  });

  test('J13.4 — "Exportar historial (CSV)" descarga todas las series terminadas, también las de hace más de un año', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const oldStart = daysAgo(400);
    const recentStart = daysAgo(2);
    const now = new Date();

    await seedExercises(page, [
      {
        id: 'ex-e2e-squat',
        name: 'Sentadilla, barra',
        muscleGroup: 'legs',
        trackingType: 'weight-reps',
        isCustom: true,
        createdAt: oldStart,
        updatedAt: oldStart,
      },
    ]);
    await seedRoutines(page, [
      { id: 'rt-e2e', name: 'Torso / Pierna', isActive: true, schedule: null, createdAt: oldStart, updatedAt: oldStart },
    ]);
    await seedTrainingDays(page, [
      { id: 'day-e2e', routineId: 'rt-e2e', name: 'Pierna A', exercises: [], createdAt: oldStart, updatedAt: oldStart },
    ]);
    await seedSessions(page, [
      {
        id: 's-old', routineId: 'rt-e2e', dayId: 'day-e2e', date: localDate(oldStart), status: 'completed',
        startedAt: oldStart, endedAt: after(oldStart, 3600), createdAt: oldStart, updatedAt: oldStart,
      },
      {
        id: 's-recent', routineId: 'rt-e2e', dayId: 'day-e2e', date: localDate(recentStart), status: 'completed',
        startedAt: recentStart, endedAt: after(recentStart, 3600), createdAt: recentStart, updatedAt: recentStart,
      },
      {
        id: 's-open', routineId: 'rt-e2e', dayId: 'day-e2e', date: localDate(now), status: 'in-progress',
        startedAt: now, createdAt: now, updatedAt: now,
      },
    ]);
    await seedWorkedSets(page, [
      { id: 'ws-old-1', sessionId: 's-old', exerciseId: 'ex-e2e-squat', type: 'weight-reps', isPR: false, reps: 8, weightKg: 60, createdAt: after(oldStart, 60) },
      { id: 'ws-old-2', sessionId: 's-old', exerciseId: 'ex-e2e-squat', type: 'weight-reps', isPR: true, reps: 8, weightKg: 62.5, createdAt: after(oldStart, 240) },
      { id: 'ws-recent', sessionId: 's-recent', exerciseId: 'ex-e2e-squat', type: 'weight-reps', isPR: true, reps: 5, weightKg: 100, createdAt: after(recentStart, 60) },
      { id: 'ws-open', sessionId: 's-open', exerciseId: 'ex-e2e-squat', type: 'weight-reps', isPR: false, reps: 10, weightKg: 40, createdAt: after(now, 1) },
    ]);

    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar historial (CSV)' }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe(`forge-historial-${localDate(new Date())}.csv`);
    const bytes = readFileSync(await download.path());
    expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(bytes.subarray(3).toString('utf8').split('\r\n')).toEqual([
      'fecha,rutina,dia,ejercicio,serie,tipo,peso,unidad,reps,tiempo_s,distancia_km,pr',
      `${localDate(oldStart)},Torso / Pierna,Pierna A,"Sentadilla, barra",1,peso_reps,60,kg,8,,,no`,
      `${localDate(oldStart)},Torso / Pierna,Pierna A,"Sentadilla, barra",2,peso_reps,62.5,kg,8,,,sí`,
      `${localDate(recentStart)},Torso / Pierna,Pierna A,"Sentadilla, barra",1,peso_reps,100,kg,5,,,sí`,
      '',
    ]);
  });
});
