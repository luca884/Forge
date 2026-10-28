/**
 * FgFirstUseComponent — "Primer uso" (S3), from the C-Welcome board.
 *
 * ApplyRoutineTemplateUseCase is declared in the component's own providers[], so it is replaced
 * with overrideComponent (root-level providers would not win).
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, type WritableSignal } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { UserPreferencesService } from '@core/profile/user-preferences.service';
import type { PreferredUnit } from '@features/profile/domain/value-objects/preferred-unit.vo';
import { ApplyRoutineTemplateUseCase } from '../../domain/use-cases/apply-routine-template.use-case';
import { FgFirstUseComponent } from './first-use.component';

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

describe('FgFirstUseComponent', () => {
  let fixture: ComponentFixture<FgFirstUseComponent>;
  let applyMock: { execute: jest.Mock };
  let loadOnceMock: jest.Mock;
  let unit: WritableSignal<PreferredUnit>;
  let applied: jest.Mock;

  async function setup(): Promise<void> {
    applyMock = { execute: jest.fn().mockResolvedValue({ id: 'r-new' }) };
    loadOnceMock = jest.fn().mockResolvedValue(undefined);
    unit = signal<PreferredUnit>('kg');
    applied = jest.fn();

    await TestBed.configureTestingModule({
      imports: [FgFirstUseComponent, RouterTestingModule],
      providers: [{ provide: UserPreferencesService, useValue: { unit, loadOnce: loadOnceMock } }],
    })
      .overrideComponent(FgFirstUseComponent, {
        set: { providers: [{ provide: ApplyRoutineTemplateUseCase, useValue: applyMock }] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(FgFirstUseComponent);
    fixture.componentInstance.applied.subscribe(applied);
    await settle(fixture);
  }

  function root(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function useButton(templateName: string): HTMLButtonElement {
    const button = Array.from(root().querySelectorAll<HTMLButtonElement>('button')).find((b) =>
      b.getAttribute('aria-label')?.includes(templateName),
    );
    if (!button) throw new Error(`No "Usar" button for ${templateName}`);
    return button;
  }

  it('shows "Empezá en 3 pasos" with its three steps', async () => {
    await setup();
    expect(root().querySelector('h2')?.textContent?.trim()).toBe('Empezá en 3 pasos');
    const steps = Array.from(root().querySelectorAll('ol > li')).map((li) => li.textContent?.replace(/\s+/g, ' ').trim());
    expect(steps).toHaveLength(3);
    expect(steps[0]).toContain('Elegí tu unidad');
    expect(steps[1]).toContain('Armá tu rutina');
    expect(steps[1]).toContain('Usá una plantilla o creala desde cero.');
    expect(steps[2]).toContain('Asigná días a tu semana');
    expect(steps[2]).toContain('Así Forge te dice qué toca cada día.');
  });

  it('step 1 shows the preferred unit as done, and follows it', async () => {
    await setup();
    expect(loadOnceMock).toHaveBeenCalled();
    expect(root().querySelector('ol > li')?.textContent).toContain('kg · listo');

    unit.set('lb');
    await settle(fixture);
    expect(root().querySelector('ol > li')?.textContent).toContain('lb · listo');
  });

  it('lists the three templates with the canvas subtitles and a "Usar" button named after each', async () => {
    await setup();
    const rows = Array.from(root().querySelectorAll('[data-template-row]')).map((row) => ({
      lines: Array.from(row.querySelectorAll('span > span')).map((line) => line.textContent?.trim()),
      label: row.querySelector('button')?.getAttribute('aria-label'),
      visible: row.querySelector('button')?.textContent?.trim(),
    }));
    expect(rows).toEqual([
      { lines: ['Torso / Pierna', '4 días · 4 ejercicios por día'], label: 'Usar plantilla Torso / Pierna', visible: 'Usar' },
      { lines: ['Full body', '3 días · ideal para empezar'], label: 'Usar plantilla Full body', visible: 'Usar' },
      { lines: ['Push / Pull / Piernas', '6 días · volumen alto'], label: 'Usar plantilla Push / Pull / Piernas', visible: 'Usar' },
    ]);
  });

  it('"Usar" applies that template and then emits applied', async () => {
    await setup();
    useButton('Full body').click();
    await settle(fixture);

    expect(applyMock.execute).toHaveBeenCalledTimes(1);
    expect(applyMock.execute).toHaveBeenCalledWith('full-body');
    expect(applied).toHaveBeenCalledTimes(1);
  });

  it('disables every "Usar" button while a template is being applied', async () => {
    await setup();
    let finish: (routine: unknown) => void = () => undefined;
    applyMock.execute.mockReturnValue(new Promise((resolve) => (finish = resolve)));

    useButton('Full body').click();
    fixture.detectChanges();
    const buttons = Array.from(root().querySelectorAll<HTMLButtonElement>('[data-template-row] button'));
    expect(buttons.map((b) => b.disabled)).toEqual([true, true, true]);

    finish({ id: 'r-new' });
    await settle(fixture);
    expect(applyMock.execute).toHaveBeenCalledTimes(1);
  });

  it('shows an alert and lets the user retry when applying fails', async () => {
    await setup();
    applyMock.execute.mockImplementationOnce(async () => {
      throw new Error('boom');
    });

    useButton('Full body').click();
    await settle(fixture);

    expect(root().querySelector('[role="alert"]')?.textContent).toContain('No se pudo crear la rutina');
    expect(applied).not.toHaveBeenCalled();
    expect(useButton('Full body').disabled).toBe(false);

    useButton('Full body').click();
    await settle(fixture);
    expect(applied).toHaveBeenCalledTimes(1);
    expect(root().querySelector('[role="alert"]')).toBeNull();
  });

  it('links "Crear rutina desde cero" to /routines/new and the library to /exercises', async () => {
    await setup();
    const links = Array.from(root().querySelectorAll('a'));
    const hrefOf = (text: string): string | null | undefined =>
      links.find((a) => a.textContent?.includes(text))?.getAttribute('href');
    expect(hrefOf('Crear rutina desde cero')).toBe('/routines/new');
    expect(hrefOf('Ver la biblioteca de ejercicios')).toBe('/exercises');
  });

  it('uses only semantic tokens: no forge-*, accent-<n>, destructive-* nor raw hex', async () => {
    await setup();
    const html = root().innerHTML;
    expect(html.length).toBeGreaterThan(0);
    expect(html).not.toMatch(/\bforge-\d/);
    expect(html).not.toMatch(/\baccent-\d/);
    expect(html).not.toMatch(/destructive-\d|text-destructive/);
    expect(html).not.toMatch(/#[0-9a-fA-F]{6}\b/);
  });
});
