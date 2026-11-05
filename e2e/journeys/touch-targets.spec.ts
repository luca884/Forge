import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../fixtures/db-reset';
import { FIXED_NOW, seedVisualData } from '../visual/visual-data';

/**
 * J20 — Áreas táctiles de 44 px.
 *
 * Los controles chicos conservan su aspecto pero reciben el toque en 44 px de alto: tocar 21 px por
 * encima o por debajo de su centro sigue cayendo en el control. Se prueba con elementFromPoint, así
 * que también falla si un contenedor con scroll recorta el área.
 */

const REACH = 21;

/** The element hit `dy` px from the target's centre is the target itself (or something inside it). */
async function expectHitAt(target: Locator, dy: number): Promise<void> {
  const box = await target.boundingBox();
  if (!box) throw new Error('target not visible');
  const hits = await target.evaluate(
    (el, p) => {
      const hit = document.elementFromPoint(p.x, p.y);
      return !!hit && (hit === el || el.contains(hit));
    },
    { x: box.x + box.width / 2, y: box.y + box.height / 2 + dy },
  );
  expect(hits, `${await target.getAttribute('aria-label') ?? await target.textContent()} at ${dy} px`).toBe(true);
}

async function expectTall(target: Locator): Promise<void> {
  await target.scrollIntoViewIfNeeded();
  await expectHitAt(target, -REACH);
  await expectHitAt(target, REACH);
}

async function open(page: Page, url: string, options: { activeSession?: boolean } = {}): Promise<void> {
  await page.clock.setFixedTime(FIXED_NOW);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await seedVisualData(page, options);
  await page.goto(url);
  await page.waitForLoadState('networkidle');
}

test.describe('J20 — Áreas táctiles de 44 px', () => {
  test('J20.1 — sesión: +15s y Saltar', async ({ page }) => {
    await open(page, '/training/session', { activeSession: true });
    await page.getByRole('button', { name: 'Loguear set' }).click();
    await expect(page.getByRole('timer')).toBeVisible();
    await expectTall(page.getByRole('button', { name: 'Sumar 15 segundos al descanso' }));
    await expectTall(page.getByRole('button', { name: 'Saltar descanso' }));
  });

  test('J20.2 — Hoy y Rutinas: links y botones chicos', async ({ page }) => {
    await open(page, '/training');
    await expectTall(page.getByRole('link', { name: 'Ver todo' }));

    await page.goto('/routines');
    await page.waitForLoadState('networkidle');
    await expectTall(page.getByRole('button', { name: 'Editar semana' }).first());
    await expectTall(page.getByRole('button', { name: /^Activar rutina/ }).first());
  });

  test('J20.3 — Ejercicios: chips de músculo dentro de la fila que scrollea', async ({ page }) => {
    await open(page, '/exercises');
    await expectTall(page.getByRole('button', { name: 'Todos', exact: true }));
    await expectTall(page.getByRole('button', { name: 'Pecho', exact: true }));
    // The padding that makes room for the taps must not make the row scroll vertically.
    const row = page.getByRole('group', { name: 'Filtrar por grupo muscular' });
    expect(await row.evaluate((el) => el.scrollHeight - el.clientHeight)).toBe(0);
  });

  test('J20.4 — Progreso: "Ver los N", filtros de récords y del historial', async ({ page }) => {
    await open(page, '/progress');
    await expectTall(page.getByRole('button', { name: /^Ver (los \d+|todos)$/ }));

    await page.goto('/progress/prs');
    await page.waitForLoadState('networkidle');
    await expectTall(page.getByRole('button', { name: 'Todos', exact: true }));
    await expectTall(page.getByRole('button', { name: 'Recientes', exact: true }));

    // Metric row above, range row below, 41 px apart: each takes 44 px outwards, and the gap between
    // them is split, so no tap there is lost.
    await page.goto('/progress/exercise/ex-sentadilla');
    await page.waitForLoadState('networkidle');
    for (const name of ['Peso', 'Reps', 'Volumen', '1RM est.']) {
      await expectHitAt(page.getByRole('button', { name, exact: true }), -REACH);
    }
    for (const name of ['3M', '6M', '1A', 'Todo']) {
      await expectHitAt(page.getByRole('button', { name, exact: true }), REACH);
    }
    const metric = (await page.getByRole('button', { name: 'Peso', exact: true }).boundingBox())!;
    const range = (await page.getByRole('button', { name: '3M', exact: true }).boundingBox())!;
    const x = range.x + range.width / 2;
    for (let y = Math.ceil(metric.y + metric.height); y < range.y; y++) {
      const hit = await page.evaluate((p) => document.elementFromPoint(p.x, p.y)?.closest('button')?.textContent?.trim() ?? null, { x, y });
      expect(['Peso', '3M'], `gap at y=${y}`).toContain(hit);
    }
  });

  test('J20.5 — Progreso: cada barra semanal recibe el toque en el hueco hasta la siguiente', async ({ page }) => {
    await open(page, '/progress');
    const bar = page.locator('[data-bar]').nth(3);
    await bar.scrollIntoViewIfNeeded();
    const box = (await bar.boundingBox())!;
    // The 6 px gap between bars belongs half to each: 2 px past the edge still hits this bar.
    const hits = await bar.evaluate(
      (el, p) => {
        const hit = document.elementFromPoint(p.x, p.y);
        return !!hit && (hit === el || el.contains(hit));
      },
      { x: box.x + box.width + 2, y: box.y + box.height / 2 },
    );
    expect(hits).toBe(true);
  });

  test('J20.6 — Perfil: interruptores y segmentados', async ({ page }) => {
    await open(page, '/profile');
    for (const name of ['Pantalla siempre encendida', 'Aviso al terminar el descanso']) {
      await expectTall(page.getByRole('switch', { name }));
    }
    for (const name of ['Claro', 'Oscuro', 'Sistema', 'kg', 'lb']) {
      await expectTall(page.getByRole('radio', { name, exact: true }));
    }
  });
});
