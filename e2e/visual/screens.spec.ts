import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/db-reset';
import { FIXED_NOW, seedVisualData } from './visual-data';

/**
 * Visual journey: one screenshot per screen, in light and dark.
 *
 * Baselines are generated inside the Playwright Docker image (see
 * `npm run e2e:visual:update`) so font rasterisation is identical across
 * machines. Captures cover the viewport only (390x844, Pixel 5 emulation).
 *
 * Time is pinned to FIXED_NOW and the theme is written to `forge.appearance`
 * before the app boots, exactly as the inline boot script in index.html reads
 * it. Each screen waits for a landmark that proves real data rendered, so a
 * baseline can never silently capture a spinner or an empty state.
 */

type Theme = 'light' | 'dark';

interface Screen {
  /** Baseline file stem, e.g. `hoy` -> `hoy-light.png`. */
  readonly name: string;
  readonly seed?: { readonly activeSession?: boolean };
  /** Navigates from the booted, seeded app to the screen and waits for its landmark. */
  readonly open: (page: Page) => Promise<void>;
}

const THEMES: readonly Theme[] = ['light', 'dark'];

const SCREENS: readonly Screen[] = [
  {
    name: 'hoy',
    open: async (page) => {
      await page.goto('/training');
      await expect(page.locator('[data-routine-card]')).toContainText('Torso / Pierna');
      await expect(page.locator('[data-days-list]')).toBeVisible();
    },
  },
  {
    name: 'sesion',
    seed: { activeSession: true },
    open: async (page) => {
      await page.goto('/training/session');
      await expect(page.getByText(/3 de \d+ series/)).toBeVisible();
    },
  },
  {
    name: 'resumen',
    seed: { activeSession: true },
    open: async (page) => {
      await page.goto('/training/session');
      await expect(page.getByText(/3 de \d+ series/)).toBeVisible();
      await page.getByRole('button', { name: 'Terminar sesión' }).click();
      await expect(page).toHaveURL(/\/training\/session\/summary$/);
      await expect(page.getByText('Sesión terminada')).toBeVisible();
      await expect(page.getByText('Sentadilla').first()).toBeVisible();
    },
  },
  {
    name: 'rutinas',
    open: async (page) => {
      await page.goto('/routines');
      await expect(page.getByRole('button', { name: /Abrir rutina Torso \/ Pierna/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /Abrir rutina Full body/ })).toBeVisible();
    },
  },
  {
    name: 'editor-dia',
    open: async (page) => {
      await page.goto('/routines/rt-torso-pierna/days/day-pierna-a');
      await expect(page.getByRole('heading', { name: 'Editar día' })).toBeVisible();
      await expect(page.getByText('Sentadilla', { exact: true })).toBeVisible();
      await expect(page.getByText('Prensa de piernas', { exact: true })).toBeVisible();
    },
  },
  {
    name: 'biblioteca',
    open: async (page) => {
      await page.goto('/routines/rt-torso-pierna/days/day-torso-b/pick-exercise');
      await expect(page.getByRole('button', { name: 'Seleccionar Sentadilla' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Seleccionar Curl femoral' })).toBeVisible();
    },
  },
  {
    name: 'progreso',
    open: async (page) => {
      await page.goto('/progress');
      await expect(page.getByText('Sentadilla').first()).toBeVisible();
    },
  },
  {
    name: 'historial-ejercicio',
    open: async (page) => {
      await page.goto('/progress/exercise/ex-sentadilla');
      await expect(page.getByRole('heading', { name: 'Historial' })).toBeVisible();
      await expect(page.locator('fg-exercise-history-chart canvas')).toBeVisible();
      await expect(page.getByText('ÚLTIMOS SETS')).toBeVisible();
    },
  },
  {
    name: 'perfil',
    open: async (page) => {
      await page.goto('/profile');
      await expect(page.getByLabel('Nombre')).toHaveValue('Luca');
    },
  },
];

async function waitForRender(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  // Web fonts must be decoded before the capture or glyph metrics differ.
  await page.evaluate(() => document.fonts.ready);
}

for (const theme of THEMES) {
  test.describe(`Capturas — ${theme}`, () => {
    for (const screen of SCREENS) {
      test(`${screen.name}`, async ({ page }) => {
        await page.clock.setFixedTime(FIXED_NOW);
        await page.addInitScript((value: string) => {
          localStorage.setItem('forge.appearance', value);
        }, JSON.stringify({ theme }));

        // Boot Angular + Dexie so the seed helpers find the schema.
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await seedVisualData(page, screen.seed);

        await screen.open(page);
        await waitForRender(page);

        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await expect(page).toHaveScreenshot(`${screen.name}-${theme}.png`);
      });
    }
  });
}
