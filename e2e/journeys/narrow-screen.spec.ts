import { test, expect } from '../fixtures/db-reset';
import { FIXED_NOW, seedVisualData } from '../visual/visual-data';

/**
 * J21 — Pantallas angostas (320 px).
 *
 * En la planilla de la sesión, cada encabezado de columna entra entero en su celda y no se pisa con
 * el de al lado.
 */

test.use({ viewport: { width: 320, height: 640 } });

test.describe('J21 — Pantallas angostas', () => {
  test('J21.1 — sesión: los encabezados de la planilla no se pisan', async ({ page }) => {
    await page.clock.setFixedTime(FIXED_NOW);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await seedVisualData(page, { activeSession: true });
    await page.goto('/training/session');
    await page.waitForLoadState('networkidle');

    const head = page.locator('[data-sheet-head]').first();
    await expect(head).toBeVisible();
    const cells = await head.locator(':scope > span').evaluateAll((spans) =>
      spans.map((el) => {
        const cell = el.getBoundingClientRect();
        // Union of the visible text: screen-reader-only copies (1 px, clipped) are skipped.
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
    );

    for (const c of cells) {
      expect(c.textLeft, `${c.label} starts inside its cell`).toBeGreaterThanOrEqual(c.cellLeft - 0.5);
      expect(c.textRight, `${c.label} ends inside its cell`).toBeLessThanOrEqual(c.cellRight + 0.5);
    }
    for (let i = 1; i < cells.length; i++) {
      expect(cells[i].textLeft, `${cells[i - 1].label} / ${cells[i].label}`).toBeGreaterThan(cells[i - 1].textRight);
    }
  });
});
