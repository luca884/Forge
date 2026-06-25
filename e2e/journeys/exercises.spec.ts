import { test, expect } from '../fixtures/db-reset';

// ─── J12 — Crear ejercicio custom ─────────────────────────────────────────────

test.describe('J12 — Crear ejercicio custom', () => {
  test('J12.1 — llenar form → submit → lista muestra nuevo ejercicio', async ({ page }) => {
    // Navigate to exercises (SeedExercisesUseCase auto-seeds built-in exercises)
    await page.goto('/exercises');
    await page.waitForLoadState('networkidle');

    // List page title (raw <h1>)
    await expect(page.getByRole('heading', { name: 'Ejercicios' })).toBeVisible();

    // Open the new-exercise form via the page-header action button
    // (rendered as <button aria-label="Nuevo ejercicio"> by fg-page-header).
    await page.getByRole('button', { name: 'Nuevo ejercicio' }).click();
    await expect(page).toHaveURL(/\/exercises\/new$/);

    // Form title (raw <h1>)
    await expect(page.getByRole('heading', { name: 'Nuevo ejercicio' })).toBeVisible();

    // Fill form fields. The <option> labels are translated to Spanish, but the
    // [value] attributes keep the raw enum values, so select by value (positional string).
    await page.getByLabel('Nombre').fill('Mi ejercicio custom');
    await page.getByLabel('Grupo muscular').selectOption('legs');
    await page.getByLabel('Tipo de seguimiento').selectOption('weight-reps');

    // Submit form
    await page.getByRole('button', { name: 'Crear ejercicio' }).click();

    // Assert navigation to exercise list
    await expect(page).toHaveURL(/\/exercises$/);

    // Assert new exercise visible in list
    await expect(page.getByText('Mi ejercicio custom')).toBeVisible();
  });

  test('J12.2 — nombre vacío → submit deshabilitado → no navega', async ({ page }) => {
    // Navigate directly to exercise form
    await page.goto('/exercises/new');
    await page.waitForLoadState('networkidle');

    // Assert we're on the new exercise form
    await expect(page.getByRole('heading', { name: 'Nuevo ejercicio' })).toBeVisible();

    // Submit button is disabled when name is empty (exerciseForm.invalid)
    const submitBtn = page.getByRole('button', { name: 'Crear ejercicio' });
    await expect(submitBtn).toBeDisabled();

    // URL stays at /exercises/new
    await expect(page).toHaveURL(/\/exercises\/new$/);
  });
});
