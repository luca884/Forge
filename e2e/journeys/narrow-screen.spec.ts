import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../fixtures/db-reset';
import { FIXED_NOW, seedVisualData } from '../visual/visual-data';

/**
 * J21 — Pantallas angostas (320 px).
 *
 * En las tablas, cada encabezado de columna entra entero en su celda y no se pisa con el de al lado,
 * y los nombres cortos se leen enteros.
 */

test.use({ viewport: { width: 320, height: 640 } });

async function open(page: Page, url: string, options: { activeSession?: boolean } = {}): Promise<void> {
  await page.clock.setFixedTime(FIXED_NOW);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await seedVisualData(page, options);
  await page.goto(url);
  await page.waitForLoadState('networkidle');
}

/** Each header's visible text stays inside its own cell and clear of the next one. */
async function expectHeadersFit(head: Locator): Promise<void> {
  await expect(head).toBeVisible();
  const cells = (
    await head.locator(':scope > span').evaluateAll((spans) =>
      spans.map((el) => {
        const cell = el.getBoundingClientRect();
        // Union of the visible text: hidden or screen-reader-only copies (≤1 px) are skipped.
        let left = Infinity;
        let right = -Infinity;
        let label = '';
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (!node.textContent!.trim() || node.parentElement!.getBoundingClientRect().width <= 1) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          const rect = range.getBoundingClientRect();
          if (rect.width === 0) continue;
          left = Math.min(left, rect.left);
          right = Math.max(right, rect.right);
          label += node.textContent!.trim();
        }
        return { label, cellLeft: cell.left, cellRight: cell.right, textLeft: left, textRight: right };
      }),
    )
  ).filter((c) => c.label !== '');

  for (const c of cells) {
    expect(c.textLeft, `${c.label} starts inside its cell`).toBeGreaterThanOrEqual(c.cellLeft - 0.5);
    expect(c.textRight, `${c.label} ends inside its cell`).toBeLessThanOrEqual(c.cellRight + 0.5);
  }
  for (let i = 1; i < cells.length; i++) {
    expect(cells[i].textLeft, `${cells[i - 1].label} / ${cells[i].label}`).toBeGreaterThan(cells[i - 1].textRight);
  }
}

test.describe('J21 — Pantallas angostas', () => {
  test('J21.1 — sesión: los encabezados de la planilla no se pisan', async ({ page }) => {
    await open(page, '/training/session', { activeSession: true });
    await expectHeadersFit(page.locator('[data-sheet-head]').first());
  });

  test('J21.2 — Rutinas: los nombres de los días se leen enteros', async ({ page }) => {
    await open(page, '/routines');
    await expectHeadersFit(page.locator('[data-day-head]'));

    const names = page.locator('[data-day-row] [data-day-name]');
    await expect(names).toHaveCount(4);
    const clipped = await names.evaluateAll((els) =>
      els.filter((el) => el.scrollWidth > el.clientWidth).map((el) => el.textContent!.trim()),
    );
    expect(clipped).toEqual([]);
  });
});
